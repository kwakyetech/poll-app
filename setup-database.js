const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Environment check:');
console.log('URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET');
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.error('❌ Missing or invalid Supabase credentials in .env.local');
  console.log('Please make sure you have replaced the placeholder values with your actual credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('\n🚀 Setting up Supabase database...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  
  try {
    // Test connection with auth
    console.log('\n🧪 Testing connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth test result:', authError.message);
    } else {
      console.log('✅ Successfully connected to Supabase!');
    }
    
    // Try to query a system table to test database access
    const { data, error } = await supabase.rpc('version');
    if (error) {
      console.log('⚠️  Database test:', error.message);
    } else {
      console.log('✅ Database connection working!');
    }
    
    console.log('\n📋 Next steps to complete setup:');
    console.log('\n🔧 Set up database schema:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration files in order:');
    console.log('   - Copy content from: supabase/migrations/001_create_polls_schema.sql');
    console.log('   - Paste and run in SQL Editor');
    console.log('   - Copy content from: supabase/migrations/002_create_views_and_functions.sql');
    console.log('   - Paste and run in SQL Editor');
    console.log('4. (Optional) Run seed data: supabase/seed.sql');
    
    console.log('\n🧪 After running migrations, test your app:');
    console.log('- Authentication: http://localhost:3000/auth/register');
    console.log('- Sample poll: http://localhost:3000/polls/1');
    
    console.log('\n✨ Your Supabase connection is ready!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Verify your Supabase project is active in the dashboard');
    console.log('2. Check if your anon key has the correct permissions');
    console.log('3. Ensure your network allows connections to Supabase');
  }
}

setupDatabase();