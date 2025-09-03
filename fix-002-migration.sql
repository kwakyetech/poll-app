-- Fixed version of 002_create_views_and_functions.sql
-- This fixes the parameter default value ordering issue

-- Create a view for polls with vote counts
CREATE OR REPLACE VIEW poll_results AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.created_by,
  p.created_at,
  p.updated_at,
  p.expires_at,
  p.is_active,
  p.allow_multiple_votes,
  p.is_anonymous,
  -- Calculate if poll is expired
  CASE 
    WHEN p.expires_at IS NOT NULL AND p.expires_at <= NOW() THEN true
    ELSE false
  END as is_expired,
  -- Count total votes
  COALESCE(vote_counts.total_votes, 0) as total_votes,
  -- Get poll options with vote counts
  COALESCE(
    json_agg(
      json_build_object(
        'id', po.id,
        'option_text', po.option_text,
        'option_order', po.option_order,
        'vote_count', COALESCE(option_votes.vote_count, 0),
        'vote_percentage', 
          CASE 
            WHEN COALESCE(vote_counts.total_votes, 0) = 0 THEN 0
            ELSE ROUND(
              (COALESCE(option_votes.vote_count, 0)::DECIMAL / vote_counts.total_votes::DECIMAL) * 100, 
              2
            )
          END
      ) ORDER BY po.option_order
    ) FILTER (WHERE po.id IS NOT NULL), 
    '[]'::json
  ) as options
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN (
  SELECT 
    option_id, 
    COUNT(*) as vote_count
  FROM votes 
  GROUP BY option_id
) option_votes ON po.id = option_votes.option_id
LEFT JOIN (
  SELECT 
    poll_id, 
    COUNT(*) as total_votes
  FROM votes 
  GROUP BY poll_id
) vote_counts ON p.id = vote_counts.poll_id
GROUP BY 
  p.id, p.title, p.description, p.created_by, p.created_at, 
  p.updated_at, p.expires_at, p.is_active, p.allow_multiple_votes, 
  p.is_anonymous, vote_counts.total_votes;

-- Function to get poll by ID with results
CREATE OR REPLACE FUNCTION get_poll_with_results(poll_uuid UUID)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN,
  allow_multiple_votes BOOLEAN,
  is_anonymous BOOLEAN,
  is_expired BOOLEAN,
  total_votes BIGINT,
  options JSON,
  user_vote JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.*,
    -- Get current user's vote if authenticated
    CASE 
      WHEN auth.uid() IS NOT NULL THEN
        (
          SELECT json_build_object(
            'option_id', v.option_id,
            'voted_at', v.created_at
          )
          FROM votes v
          WHERE v.poll_id = poll_uuid 
          AND v.user_id = auth.uid()
          LIMIT 1
        )
      ELSE NULL
    END as user_vote
  FROM poll_results pr
  WHERE pr.id = poll_uuid
  AND (pr.is_active = true OR pr.created_by = auth.uid());
END;
$$;

-- Function to cast a vote (FIXED: moved parameters with defaults to the end)
CREATE OR REPLACE FUNCTION cast_vote(
  poll_uuid UUID,
  option_uuid UUID,
  voter_ip_addr INET DEFAULT NULL,
  voter_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  poll_record RECORD;
  existing_vote_id UUID;
  new_vote_id UUID;
  result JSON;
BEGIN
  -- Get poll information
  SELECT * INTO poll_record
  FROM polls 
  WHERE id = poll_uuid;
  
  -- Check if poll exists and is active
  IF poll_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Poll not found');
  END IF;
  
  IF poll_record.is_active = false THEN
    RETURN json_build_object('success', false, 'error', 'Poll is not active');
  END IF;
  
  -- Check if poll has expired
  IF poll_record.expires_at IS NOT NULL AND poll_record.expires_at <= NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Poll has expired');
  END IF;
  
  -- Check if option belongs to this poll
  IF NOT EXISTS (
    SELECT 1 FROM poll_options 
    WHERE id = option_uuid AND poll_id = poll_uuid
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid option for this poll');
  END IF;
  
  -- For authenticated users, check existing vote
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO existing_vote_id
    FROM votes 
    WHERE poll_id = poll_uuid AND user_id = auth.uid();
    
    -- If vote exists and multiple votes not allowed, update existing vote
    IF existing_vote_id IS NOT NULL THEN
      IF poll_record.allow_multiple_votes = false THEN
        UPDATE votes 
        SET option_id = option_uuid, created_at = NOW()
        WHERE id = existing_vote_id;
        
        RETURN json_build_object(
          'success', true, 
          'message', 'Vote updated successfully',
          'vote_id', existing_vote_id
        );
      ELSE
        -- Multiple votes allowed, create new vote
        INSERT INTO votes (poll_id, option_id, user_id, voter_ip, user_agent)
        VALUES (poll_uuid, option_uuid, auth.uid(), voter_ip_addr, voter_user_agent)
        RETURNING id INTO new_vote_id;
        
        RETURN json_build_object(
          'success', true, 
          'message', 'Additional vote cast successfully',
          'vote_id', new_vote_id
        );
      END IF;
    END IF;
  END IF;
  
  -- Create new vote
  INSERT INTO votes (poll_id, option_id, user_id, voter_ip, user_agent)
  VALUES (poll_uuid, option_uuid, auth.uid(), voter_ip_addr, voter_user_agent)
  RETURNING id INTO new_vote_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Vote cast successfully',
    'vote_id', new_vote_id
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'You have already voted on this poll');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'An error occurred while casting your vote');
END;
$$;

-- Function to create a poll with options (FIXED: moved parameters with defaults to the end)
CREATE OR REPLACE FUNCTION create_poll_with_options(
  poll_title VARCHAR,
  poll_options TEXT[],
  poll_description TEXT DEFAULT NULL,
  poll_expires_at TIMESTAMPTZ DEFAULT NULL,
  poll_allow_multiple_votes BOOLEAN DEFAULT false,
  poll_is_anonymous BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_poll_id UUID;
  option_text TEXT;
  option_index INTEGER := 1;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Validate input
  IF poll_title IS NULL OR LENGTH(TRIM(poll_title)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Poll title is required');
  END IF;
  
  IF array_length(poll_options, 1) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'At least 2 options are required');
  END IF;
  
  -- Create the poll
  INSERT INTO polls (
    title, description, created_by, expires_at, 
    allow_multiple_votes, is_anonymous
  )
  VALUES (
    poll_title, poll_description, auth.uid(), poll_expires_at,
    poll_allow_multiple_votes, poll_is_anonymous
  )
  RETURNING id INTO new_poll_id;
  
  -- Create poll options
  FOREACH option_text IN ARRAY poll_options
  LOOP
    IF LENGTH(TRIM(option_text)) > 0 THEN
      INSERT INTO poll_options (poll_id, option_text, option_order)
      VALUES (new_poll_id, TRIM(option_text), option_index);
      option_index := option_index + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Poll created successfully',
    'poll_id', new_poll_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'An error occurred while creating the poll');
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON poll_results TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_poll_with_results(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cast_vote(UUID, UUID, INET, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_poll_with_options(VARCHAR, TEXT[], TEXT, TIMESTAMPTZ, BOOLEAN, BOOLEAN) TO authenticated;