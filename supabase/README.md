# Supabase Database Schema for Poll App

This directory contains the database schema, migrations, and seed data for the Next.js Polling Application.

## 📁 Files Overview

- `migrations/001_create_polls_schema.sql` - Core database schema with tables, indexes, and RLS policies
- `migrations/002_create_views_and_functions.sql` - Views, functions, and stored procedures
- `seed.sql` - Sample data for development and testing
- `README.md` - This documentation file

## 🗄️ Database Schema

### Tables

#### `polls`
Stores poll metadata and configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `title` | VARCHAR(255) | Poll question/title |
| `description` | TEXT | Optional poll description |
| `created_by` | UUID | Foreign key to auth.users |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |
| `expires_at` | TIMESTAMPTZ | Optional expiration date |
| `is_active` | BOOLEAN | Whether poll is active (default: true) |
| `allow_multiple_votes` | BOOLEAN | Allow multiple votes per user (default: false) |
| `is_anonymous` | BOOLEAN | Anonymous voting (default: false) |

#### `poll_options`
Stores the available options for each poll.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `poll_id` | UUID | Foreign key to polls table |
| `option_text` | VARCHAR(500) | The option text |
| `option_order` | INTEGER | Display order of the option |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Constraints:**
- Unique constraint on `(poll_id, option_order)`
- Foreign key cascade delete on poll deletion

#### `votes`
Stores individual votes cast by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `poll_id` | UUID | Foreign key to polls table |
| `option_id` | UUID | Foreign key to poll_options table |
| `user_id` | UUID | Foreign key to auth.users (nullable for anonymous) |
| `voter_ip` | INET | IP address of voter (for anonymous tracking) |
| `user_agent` | TEXT | Browser user agent |
| `created_at` | TIMESTAMPTZ | Vote timestamp |

**Constraints:**
- Unique constraint on `(poll_id, user_id)` to prevent duplicate votes
- Foreign key cascade delete on poll/option deletion
- Foreign key set null on user deletion

### Views

#### `poll_results`
A comprehensive view that combines polls with their options and vote counts.

**Columns:**
- All poll columns
- `is_expired` - Calculated boolean if poll has expired
- `total_votes` - Total number of votes for the poll
- `options` - JSON array of options with vote counts and percentages

### Functions

#### `get_poll_with_results(poll_uuid UUID)`
Returns detailed poll information including:
- Poll metadata
- Options with vote counts and percentages
- Current user's vote (if authenticated)
- Expiration status

**Usage:**
```sql
SELECT * FROM get_poll_with_results('poll-uuid-here');
```

#### `cast_vote(poll_uuid UUID, option_uuid UUID, voter_ip_addr INET, voter_user_agent TEXT)`
Safely casts a vote with validation.

**Features:**
- Validates poll is active and not expired
- Handles duplicate vote prevention
- Supports multiple votes if poll allows
- Returns JSON response with success/error status

**Usage:**
```sql
SELECT cast_vote(
  'poll-uuid',
  'option-uuid',
  '192.168.1.1'::INET,
  'Mozilla/5.0...'
);
```

#### `create_poll_with_options(title, description, expires_at, allow_multiple_votes, is_anonymous, options[])`
Atomically creates a poll with its options.

**Usage:**
```sql
SELECT create_poll_with_options(
  'What is your favorite color?',
  'A simple color preference poll',
  NOW() + INTERVAL '7 days',
  false,
  false,
  ARRAY['Red', 'Blue', 'Green', 'Yellow']
);
```

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Polls
- **Read**: Anyone can view active polls; users can view their own polls
- **Create**: Authenticated users can create polls
- **Update/Delete**: Users can modify their own polls

### Poll Options
- **Read**: Anyone can view options for active polls; creators can view all their poll options
- **Modify**: Only poll creators can manage options

### Votes
- **Read**: Anyone can view votes for active polls (for counting); users can view their own votes; poll creators can view all votes for their polls
- **Create**: Authenticated users can vote on active, non-expired polls
- **Update**: Users can update their own votes if poll is still active
- **Delete**: Users can delete their own votes

## 📊 Indexes

Optimized indexes for common query patterns:

- `polls`: created_by, created_at, expires_at, is_active
- `poll_options`: poll_id, (poll_id, option_order)
- `votes`: poll_id, option_id, user_id, created_at

## 🚀 Setup Instructions

### 1. Initialize Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project (if not already done)
supabase init
```

### 2. Run Migrations
```bash
# Apply migrations
supabase db push

# Or run individual migration files
supabase db reset
```

### 3. Seed Development Data
```bash
# Run seed file
supabase db reset --with-seed
```

### 4. Generate TypeScript Types
```bash
# Generate types for your Next.js app
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

## 🔧 Development Workflow

### Creating New Migrations
```bash
# Create a new migration
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
# Then apply it
supabase db push
```

### Local Development
```bash
# Start local Supabase
supabase start

# Your local database will be available at:
# Database URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

### Backup and Restore
```bash
# Create backup
supabase db dump --file backup.sql

# Restore from backup
supabase db reset --file backup.sql
```

## 📝 Usage Examples

### Fetching Polls with Results
```sql
-- Get all active polls with vote counts
SELECT * FROM poll_results WHERE is_active = true;

-- Get specific poll with user's vote
SELECT * FROM get_poll_with_results('poll-uuid');
```

### Creating a Poll
```sql
-- Create a new poll
SELECT create_poll_with_options(
  'Favorite Programming Language',
  'What programming language do you prefer?',
  NOW() + INTERVAL '30 days',
  false,
  false,
  ARRAY['JavaScript', 'Python', 'Java', 'Go']
);
```

### Casting Votes
```sql
-- Cast a vote
SELECT cast_vote(
  'poll-uuid',
  'option-uuid',
  '192.168.1.100'::INET,
  'Mozilla/5.0 (compatible browser)'
);
```

## 🔍 Monitoring and Analytics

### Common Queries

```sql
-- Most popular polls
SELECT 
  p.title,
  COUNT(v.id) as vote_count
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
GROUP BY p.id, p.title
ORDER BY vote_count DESC;

-- User voting activity
SELECT 
  u.email,
  COUNT(v.id) as votes_cast
FROM auth.users u
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY u.id, u.email
ORDER BY votes_cast DESC;

-- Poll engagement over time
SELECT 
  DATE(v.created_at) as vote_date,
  COUNT(*) as daily_votes
FROM votes v
WHERE v.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(v.created_at)
ORDER BY vote_date;
```

## 🛡️ Security Considerations

1. **RLS Policies**: All tables have comprehensive RLS policies
2. **Input Validation**: Functions include input validation
3. **Rate Limiting**: Consider implementing rate limiting for vote casting
4. **IP Tracking**: Anonymous votes track IP for basic fraud prevention
5. **User Agent**: Stored for additional fraud detection capabilities

## 🔄 Migration History

- `001_create_polls_schema.sql` - Initial schema with tables, indexes, and RLS
- `002_create_views_and_functions.sql` - Views and stored procedures

## 📞 Support

For questions about the database schema:
1. Check the Supabase documentation
2. Review the RLS policies for permission issues
3. Use the provided functions for complex operations
4. Monitor query performance with the provided indexes