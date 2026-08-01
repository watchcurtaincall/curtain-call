const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sendEmail() {
  const { data: profiles, error } = await supabase.from('profiles').select('email').not('email', 'is', null);
  if (error || !profiles) {
    console.error('Failed to get profiles', error);
    return;
  }

  const emails = profiles.map(p => p.email);
  console.log(`Sending to ${emails.length} users...`);

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
      <h2 style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; text-align: center; font-family: Georgia, serif;">The Daily Quiz is Back!</h2>
      <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 25px;"></div>
      
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 20px;">
        We sincerely apologize for the recent downtime with the Curtain Call Daily Quiz.
      </p>

      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 20px;">
        We know many of you were maintaining impressive streaks, and we have good news! <strong>Your streaks have been fully restored.</strong> You won't lose your progress due to the downtime. 
      </p>

      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        Today's quiz is ready and waiting for you. Dive back in and keep that streak alive!
      </p>

      <div style="text-align: center;">
        <a href="https://curtaincall.com.ng/quiz" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-weight: bold; padding: 14px 30px; border-radius: 12px; font-size: 14px;">Play Today's Quiz</a>
      </div>
    </div>
  `;

  for (const email of emails) {
    try {
      const res = await fetch('http://localhost:3000/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'We are back! Your Quiz Streaks have been restored 🎭',
          html: html,
          type: 'bulk'
        })
      });
      console.log(`Sent to ${email}: ${res.status}`);
    } catch (err) {
      console.error(`Failed to send to ${email}`, err);
    }
  }
}

sendEmail();
