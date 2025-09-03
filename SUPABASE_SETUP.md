# 🚀 Supabase Setup Guide

This guide will help you connect your polling app to your Supabase account.

## Step 1: Create a Supabase Project

1. **Go to [Supabase](https://supabase.com)** and sign in or create an account
2. **Click "New Project"**
3. **Fill in your project details:**
   - Project name: `poll-app` (or any name you prefer)
   - Database password: Choose a strong password (save it!)
   - Region: Choose the closest to your users
4. **Click "Create new project"**
5. **Wait for the project to be created** (usually takes 1-2 minutes)

## Step 2: Get Your Project Credentials

1. **In your Supabase dashboard, go to Settings > API**
2. **Copy the following values:**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

## Step 3: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` with your actual credentials:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 4: Set Up the Database Schema

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-id
   ```
   (Find your project ID in the Supabase dashboard URL)

4. **Push the migrations:**
   ```bash
   supabase db push
   ```

5. **Seed the database with sample data:**
   ```bash
   supabase db reset --linked
   ```

### Option B: Manual Setup via Supabase Dashboard

1. **Go to your Supabase dashboard > SQL Editor**
2. **Run the migration files in order:**
   - Copy and paste the contents of `supabase/migrations/001_create_polls_schema.sql`
   - Click "Run" to execute
   - Copy and paste the contents of `supabase/migrations/002_create_views_and_functions.sql`
   - Click "Run" to execute
3. **Add sample data (optional):**
   - Copy and paste the contents of `supabase/seed.sql`
   - Click "Run" to execute

## Step 5: Enable Row Level Security (RLS)

The migrations automatically set up RLS policies, but verify they're enabled:

1. **Go to Authentication > Policies in your Supabase dashboard**
2. **Verify you see policies for:**
   - `polls` table
   - `poll_options` table
   - `votes` table

## Step 6: Test the Connection

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Check the browser console** - you should no longer see "Supabase not configured" warnings

3. **Test authentication:**
   - Go to `/auth/register` and try creating an account
   - Go to `/auth/login` and try logging in

4. **Test polling functionality:**
   - Visit `/polls/1` to see a sample poll
   - Try voting on the poll

## Step 7: Verify Database Setup

In your Supabase dashboard:

1. **Go to Table Editor** and verify you see:
   - `polls` table
   - `poll_options` table
   - `votes` table

2. **Go to Database > Functions** and verify you see:
   - `get_poll_with_results`
   - `cast_vote`
   - `create_poll_with_options`

## Troubleshooting

### Common Issues:

1. **"Supabase not configured" error:**
   - Check that `.env.local` exists and has the correct values
   - Restart your development server after adding environment variables

2. **Authentication not working:**
   - Verify your anon key is correct
   - Check that RLS policies are enabled

3. **Database queries failing:**
   - Ensure migrations were run successfully
   - Check the Supabase logs in your dashboard

4. **CORS errors:**
   - Add your local development URL (`http://localhost:3000`) to allowed origins in Supabase dashboard > Authentication > URL Configuration

### Getting Help:

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review the database schema documentation in `supabase/README.md`

## Security Notes

- ✅ **Safe to commit:** `.env.local.example`
- ❌ **Never commit:** `.env.local` (contains your actual keys)
- ✅ **Public keys:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose to browsers
- ❌ **Private keys:** Never use service role keys in frontend code

---

🎉 **You're all set!** Your polling app should now be connected to Supabase and ready for development.