const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("1. Fetching all quiz attempts...");
  const { data: attempts, error: attErr } = await supabase.from('quiz_attempts').select('user_id, quiz_date, result_type');
  if (attErr) { console.error(attErr); return; }

  // Group by user
  const userAttempts = {};
  for (const att of attempts) {
    if (!userAttempts[att.user_id]) userAttempts[att.user_id] = [];
    userAttempts[att.user_id].push(att.quiz_date);
  }

  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, email, quiz_streak');
  if (profErr) { console.error(profErr); return; }

  const now = new Date().toISOString();
  let updatedCount = 0;

  for (const prof of profiles) {
    const dates = userAttempts[prof.id] || [];
    // Sort unique dates descending
    const uniqueDates = [...new Set(dates)].sort().reverse();
    
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const d1 = new Date(uniqueDates[i-1]);
        const d2 = new Date(uniqueDates[i]);
        const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1; 
        }
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    }
    
    const finalStreak = Math.max(maxStreak, prof.quiz_streak || 0, 1);
    
    if (uniqueDates.length > 0 || (prof.quiz_streak && prof.quiz_streak > 0)) {
      const { error: updateErr } = await supabase.from('profiles')
        .update({ 
          quiz_streak: finalStreak,
          quiz_last_completion_date: now
        })
        .eq('id', prof.id);
      
      if (!updateErr) updatedCount++;
    }
  }

  console.log('Restored streaks for ' + updatedCount + ' users based on their historical maximums.');
}

run().catch(console.error);
