const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase Migration Helper');
console.log('================================\n');

console.log('Since the Supabase CLI requires database credentials that we don\'t have,');
console.log('here are the migration files you need to run manually in your Supabase dashboard:\n');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const seedFile = path.join(__dirname, 'supabase', 'seed.sql');

try {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log('📁 Migration Files to Run (in order):');
  console.log('=====================================\n');

  migrationFiles.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    console.log(`${index + 1}. ${file}`);
    console.log(`   📍 Location: ${filePath}`);
    console.log(`   🔗 Dashboard: https://supabase.com/dashboard/project/aqckctxqehtolunfbprn/sql/new`);
    console.log('');
  });

  // Check if seed file exists
  if (fs.existsSync(seedFile)) {
    console.log('🌱 Optional Seed Data:');
    console.log('======================\n');
    console.log(`📍 Location: ${seedFile}`);
    console.log(`🔗 Dashboard: https://supabase.com/dashboard/project/aqckctxqehtolunfbprn/sql/new`);
    console.log('');
  }

  console.log('📋 Instructions:');
  console.log('================');
  console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard/project/aqckctxqehtolunfbprn');
  console.log('2. Go to SQL Editor (left sidebar)');
  console.log('3. Click "New Query"');
  console.log('4. Copy and paste each migration file content (in order)');
  console.log('5. Click "Run" for each migration');
  console.log('6. Optionally run the seed.sql file for sample data\n');

  console.log('✅ After running migrations, your app will be fully connected!');
  console.log('🌐 Test your app at: http://localhost:3000');

} catch (error) {
  console.error('❌ Error reading migration files:', error.message);
  console.log('\n📁 Please ensure the supabase/migrations folder exists with .sql files');
}