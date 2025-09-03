-- Fix for duplicate policy error
-- Run this instead of the original migration if you get policy already exists errors

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  allow_multiple_votes BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text VARCHAR(500) NOT NULL,
  option_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_order)
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  voter_ip INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one vote per user per poll (unless multiple votes allowed)
  UNIQUE(poll_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls(expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_order ON poll_options(poll_id, option_order);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_polls_updated_at ON polls;
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
-- RLS Policies for polls
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
CREATE POLICY "Anyone can view active polls" ON polls
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own polls" ON polls;
CREATE POLICY "Users can view own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
CREATE POLICY "Authenticated users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own polls" ON polls;
CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own polls" ON polls;
CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for poll_options
DROP POLICY IF EXISTS "Anyone can view poll options" ON poll_options;
CREATE POLICY "Anyone can view poll options" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.is_active = true
    )
  );

DROP POLICY IF EXISTS "Poll creators can view own poll options" ON poll_options;
CREATE POLICY "Poll creators can view own poll options" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Poll creators can manage poll options" ON poll_options;
CREATE POLICY "Poll creators can manage poll options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

-- RLS Policies for votes
DROP POLICY IF EXISTS "Anyone can view votes for active polls" ON votes;
CREATE POLICY "Anyone can view votes for active polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can view own votes" ON votes;
CREATE POLICY "Users can view own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_active = true 
      AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
    )
  );

DROP POLICY IF EXISTS "Users can update own votes" ON votes;
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_active = true 
      AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
    )
  );

DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Poll creators can view poll votes" ON votes;
CREATE POLICY "Poll creators can view poll votes" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.created_by = auth.uid()
    )
  );