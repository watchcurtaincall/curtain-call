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
  const { data, error } = await supabase.from('quiz_attempts').insert({
    user_id: 'c5c24e5d-1bd4-44aa-aa70-98d022b7dc04',
    quiz_date: '2026-05-28',
    status: 'pending',
    points_awarded: 0,
    question_ids: [],
    answers: [],
    started_at: new Date().toISOString()
  });
  console.log(error);
}
run();
