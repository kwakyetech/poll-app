-- Seed data for development and testing
-- This file contains sample polls and data for testing the application

-- Note: This assumes you have at least one user in auth.users table
-- You can run this after setting up authentication

-- Insert sample polls (using a placeholder user ID - replace with actual user ID)
-- First, let's create a function to get or create a test user
DO $$
DECLARE
  test_user_id UUID;
  poll1_id UUID;
  poll2_id UUID;
  poll3_id UUID;
  option1_id UUID;
  option2_id UUID;
  option3_id UUID;
  option4_id UUID;
BEGIN
  -- Try to get an existing user, or use a placeholder UUID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- If no users exist, use a placeholder UUID (this will need to be updated later)
  IF test_user_id IS NULL THEN
    test_user_id := '00000000-0000-0000-0000-000000000000';
  END IF;
  
  -- Insert sample poll 1: Frontend Framework
  INSERT INTO polls (
    id, title, description, created_by, expires_at, 
    allow_multiple_votes, is_anonymous
  ) VALUES (
    gen_random_uuid(),
    'What''s your favorite frontend framework?',
    'Help us understand which frontend framework is most popular among developers.',
    test_user_id,
    NOW() + INTERVAL '30 days',
    false,
    false
  ) RETURNING id INTO poll1_id;
  
  -- Insert options for poll 1
  INSERT INTO poll_options (poll_id, option_text, option_order) VALUES
    (poll1_id, 'React', 1),
    (poll1_id, 'Vue.js', 2),
    (poll1_id, 'Svelte', 3),
    (poll1_id, 'Angular', 4);
  
  -- Insert sample poll 2: Programming Languages
  INSERT INTO polls (
    id, title, description, created_by, expires_at,
    allow_multiple_votes, is_anonymous
  ) VALUES (
    gen_random_uuid(),
    'Which programming language do you use most?',
    'Survey about the most commonly used programming languages in 2024.',
    test_user_id,
    NOW() + INTERVAL '60 days',
    false,
    true
  ) RETURNING id INTO poll2_id;
  
  -- Insert options for poll 2
  INSERT INTO poll_options (poll_id, option_text, option_order) VALUES
    (poll2_id, 'JavaScript/TypeScript', 1),
    (poll2_id, 'Python', 2),
    (poll2_id, 'Java', 3),
    (poll2_id, 'C#', 4),
    (poll2_id, 'Go', 5),
    (poll2_id, 'Rust', 6);
  
  -- Insert sample poll 3: Work Preferences (expired poll for testing)
  INSERT INTO polls (
    id, title, description, created_by, expires_at,
    allow_multiple_votes, is_anonymous
  ) VALUES (
    gen_random_uuid(),
    'What''s your preferred work arrangement?',
    'Understanding work preferences in the post-pandemic era.',
    test_user_id,
    NOW() - INTERVAL '1 day', -- Expired poll
    false,
    false
  ) RETURNING id INTO poll3_id;
  
  -- Insert options for poll 3
  INSERT INTO poll_options (poll_id, option_text, option_order) VALUES
    (poll3_id, 'Remote work', 1),
    (poll3_id, 'Hybrid work', 2),
    (poll3_id, 'Office work', 3),
    (poll3_id, 'Flexible arrangement', 4);
  
  -- Insert sample poll 4: Multiple votes allowed
  INSERT INTO polls (
    id, title, description, created_by, expires_at,
    allow_multiple_votes, is_anonymous
  ) VALUES (
    gen_random_uuid(),
    'Which development tools do you use? (Select multiple)',
    'Survey about development tools and IDEs. You can select multiple options.',
    test_user_id,
    NOW() + INTERVAL '45 days',
    true, -- Multiple votes allowed
    false
  );
  
  -- Get the ID of the last inserted poll
  SELECT currval(pg_get_serial_sequence('polls', 'id')) INTO poll3_id;
  
  -- Insert options for poll 4
  INSERT INTO poll_options (poll_id, option_text, option_order) VALUES
    (poll3_id, 'VS Code', 1),
    (poll3_id, 'IntelliJ IDEA', 2),
    (poll3_id, 'Vim/Neovim', 3),
    (poll3_id, 'Sublime Text', 4),
    (poll3_id, 'Atom', 5),
    (poll3_id, 'WebStorm', 6);
  
  -- Insert sample poll 5: Simple Yes/No poll
  INSERT INTO polls (
    id, title, description, created_by, expires_at,
    allow_multiple_votes, is_anonymous
  ) VALUES (
    gen_random_uuid(),
    'Do you think AI will replace developers?',
    'A simple yes/no question about AI and the future of development.',
    test_user_id,
    NOW() + INTERVAL '90 days',
    false,
    true
  );
  
  -- Insert options for poll 5
  INSERT INTO poll_options (poll_id, option_text, option_order) VALUES
    (currval(pg_get_serial_sequence('polls', 'id')), 'Yes, eventually', 1),
    (currval(pg_get_serial_sequence('polls', 'id')), 'No, never', 2),
    (currval(pg_get_serial_sequence('polls', 'id')), 'Partially, some tasks', 3),
    (currval(pg_get_serial_sequence('polls', 'id')), 'Uncertain', 4);
  
  RAISE NOTICE 'Sample polls created successfully!';
  RAISE NOTICE 'Poll 1 ID: %', poll1_id;
  RAISE NOTICE 'Poll 2 ID: %', poll2_id;
  RAISE NOTICE 'Poll 3 ID: % (expired)', poll3_id;
  
END $$;

-- Create some sample votes (these will need actual user IDs to work properly)
-- This is commented out as it requires real user authentication
/*
DO $$
DECLARE
  sample_poll_id UUID;
  sample_option_id UUID;
BEGIN
  -- Get a sample poll and option
  SELECT p.id, po.id INTO sample_poll_id, sample_option_id
  FROM polls p
  JOIN poll_options po ON p.id = po.poll_id
  WHERE p.title = 'What''s your favorite frontend framework?'
  AND po.option_text = 'React'
  LIMIT 1;
  
  -- Insert some sample votes (replace with actual user IDs)
  -- INSERT INTO votes (poll_id, option_id, user_id) VALUES
  --   (sample_poll_id, sample_option_id, 'actual-user-id-1'),
  --   (sample_poll_id, sample_option_id, 'actual-user-id-2');
  
END $$;
*/

-- Verify the data was inserted correctly
SELECT 
  p.title,
  p.description,
  p.expires_at,
  p.is_active,
  p.allow_multiple_votes,
  COUNT(po.id) as option_count
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
GROUP BY p.id, p.title, p.description, p.expires_at, p.is_active, p.allow_multiple_votes
ORDER BY p.created_at DESC;