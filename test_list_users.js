const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  // Can we lookup a user by email?
  const { data: users, error } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'watchcurtaincall@gmail.com');
  console.log(user ? user.id : 'not found');
}
run();
