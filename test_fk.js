const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'watchcurtaincall@gmail.com',
    password: 'password123',
    email_confirm: true
  });
  console.log(error || 'User created with ID: ' + data.user.id);
}
run();
