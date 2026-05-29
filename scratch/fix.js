const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const now = new Date();
  const watOffset = 60; // WAT is UTC+1
  const watDate = new Date(now.getTime() + watOffset * 60 * 1000);
  const today = watDate.toISOString().split('T')[0];

  console.log(`Deleting quiz_days row for ${today}...`);
  const { error } = await supabase
    .from('quiz_days')
    .delete()
    .eq('quiz_date', today);

  if (error) {
    console.error('Error deleting row:', error);
    process.exit(1);
  }

  console.log('Successfully deleted today\'s quiz_days row!');
}

run();
