-- Fix poll_type missing from get_poll_with_results function
-- This script updates the poll_results view and get_poll_with_results function to include poll_type

-- First, drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS get_poll_with_results(uuid);

-- Drop and recreate the poll_results view with poll_type
DROP VIEW IF EXISTS poll_results;

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
  p.poll_type,
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
  p.is_anonymous, p.poll_type, vote_counts.total_votes;

-- Create the get_poll_with_results function with poll_type included
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
  poll_type VARCHAR,
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