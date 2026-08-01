require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("1. Restoring streaks...");
  
  // Get all signups
  const { data: signups, error: signupsErr } = await supabase.from('signups').select('*');
  if (signupsErr) {
    console.error("Failed to get signups:", signupsErr);
    return;
  }
  
  // Re-run the logic from before or just force streaks to not be lost
  // Let's see what the streak columns are
  console.log("Updating streaks for", signups.length, "users to prevent loss...");
  // Normally streak resets to 0 if lastQuizDate is older than 48 hours. 
  // Let's just update lastQuizDate to today so they don't lose it, or increment/restore based on previous max.
  const now = new Date().toISOString();
  
  let updatedCount = 0;
  for (const user of signups) {
    // If they had a streak, make sure their lastQuizDate is very recent so it doesn't break
    if (user.quiz_streak > 0 || user.highest_streak > 0) {
      let currentStreak = Math.max(user.quiz_streak || 0, 1); 
      // Just ensure they have their streak and a fresh date
      const { error: updateErr } = await supabase.from('signups')
        .update({ 
          quiz_streak: currentStreak,
          last_quiz_date: now 
        })
        .eq('id', user.id);
        
      if (!updateErr) updatedCount++;
    }
  }
  console.log(`Restored/protected streaks for ${updatedCount} users.`);
  
  console.log("2. Triggering Quiz Generation via local API (if running) or directly...");
  // It's easier to hit the local API if it's running, or just run a curl command separately.
}

run().catch(console.error);
