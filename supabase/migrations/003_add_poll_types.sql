-- Add poll_type field to polls table and create text_responses table for text input polls

-- Add poll_type column to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple', 'text'));

-- Create text_responses table for text input polls
CREATE TABLE IF NOT EXISTS text_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  response_text TEXT NOT NULL,
  voter_ip INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one response per user per poll (unless multiple responses allowed)
  UNIQUE(poll_id, user_id)
);

-- Create indexes for text_responses
CREATE INDEX IF NOT EXISTS idx_text_responses_poll_id ON text_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_text_responses_user_id ON text_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_text_responses_created_at ON text_responses(created_at DESC);

-- Enable RLS for text_responses
ALTER TABLE text_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for text_responses
-- Anyone can view text responses for active polls (if not anonymous)
CREATE POLICY "Anyone can view text responses for non-anonymous polls" ON text_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = text_responses.poll_id 
      AND polls.is_active = true
      AND polls.is_anonymous = false
    )
  );

-- Users can view their own text responses
CREATE POLICY "Users can view own text responses" ON text_responses
  FOR SELECT USING (auth.uid() = user_id);

-- Poll creators can view all text responses for their polls
CREATE POLICY "Poll creators can view poll text responses" ON text_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = text_responses.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

-- Authenticated users can submit text responses to active polls
CREATE POLICY "Authenticated users can submit text responses" ON text_responses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = text_responses.poll_id 
      AND polls.is_active = true 
      AND polls.poll_type = 'text'
      AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
    )
  );

-- Users can update their own text responses (if poll allows)
CREATE POLICY "Users can update own text responses" ON text_responses
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = text_responses.poll_id 
      AND polls.is_active = true 
      AND polls.poll_type = 'text'
      AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
    )
  );

-- Users can delete their own text responses
CREATE POLICY "Users can delete own text responses" ON text_responses
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing polls to have poll_type = 'single' if they allow single votes
-- or 'multiple' if they allow multiple votes
UPDATE polls 
SET poll_type = CASE 
  WHEN allow_multiple_votes = true THEN 'multiple'
  ELSE 'single'
END
WHERE poll_type IS NULL OR poll_type = 'single';

-- Create function to submit text response
CREATE OR REPLACE FUNCTION submit_text_response(
  poll_uuid UUID,
  response_text_param TEXT,
  voter_ip_addr INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  poll_record RECORD;
  response_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Get poll information
  SELECT * INTO poll_record
  FROM polls
  WHERE id = poll_uuid
  AND is_active = true
  AND poll_type = 'text'
  AND (expires_at IS NULL OR expires_at > NOW());

  -- Check if poll exists and is valid for text responses
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Poll not found or not accepting text responses');
  END IF;

  -- Check if user has already responded (unless multiple responses allowed)
  IF NOT poll_record.allow_multiple_votes THEN
    IF EXISTS (
      SELECT 1 FROM text_responses
      WHERE poll_id = poll_uuid AND user_id = auth.uid()
    ) THEN
      RETURN json_build_object('success', false, 'error', 'You have already responded to this poll');
    END IF;
  END IF;

  -- Insert the text response
  INSERT INTO text_responses (poll_id, user_id, response_text, voter_ip, user_agent)
  VALUES (poll_uuid, auth.uid(), response_text_param, voter_ip_addr, user_agent_param)
  RETURNING id INTO response_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Response submitted successfully',
    'response_id', response_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'You have already responded to this poll');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'An error occurred while submitting your response');
END;
$$;

-- Grant permissions
GRANT SELECT ON text_responses TO authenticated, anon;
GRANT EXECUTE ON FUNCTION submit_text_response(UUID, TEXT, INET, TEXT) TO authenticated;