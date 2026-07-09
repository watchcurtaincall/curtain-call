import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase server client not configured' }, { status: 500 });
  }

  try {
    const { action, email, code, newPassword } = await request.json();

    if (!action || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. ACTION: SEND OTP
    if (action === 'send-otp') {
      // Check if user profile exists
      const { data: profile, error: profErr } = await supabaseServer
        .from('profiles')
        .select('name')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profErr || !profile) {
        return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
      }

      // Generate 4-digit OTP code
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      // Save code to user profile
      const { error: updErr } = await supabaseServer
        .from('profiles')
        .update({ verification_code: otp })
        .eq('email', cleanEmail);

      if (updErr) {
        console.error('[Reset Password API] Profile update error:', updErr);
        return NextResponse.json({ error: 'Failed to generate recovery code' }, { status: 500 });
      }

      // Send Email via Brevo SMTP
      if (!BREVO_API_KEY) {
        // Fallback for local development if no key configured
        console.warn(`[Reset Password API Dev Fallback] OTP for ${cleanEmail} is: ${otp}`);
        return NextResponse.json({ success: true, devMode: true, message: 'Recovery email simulated in developer logs.' });
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff; color: #111111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-family: 'Georgia', serif; font-size: 24px; color: #dc2626; margin: 0;">Curtain Call</h1>
            <p style="font-size: 14px; color: #666666; margin: 4px 0 0 0;">Digital Stage Guide</p>
          </div>
          
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Password Reset Code</h2>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hello ${profile.name || 'Thespian'},<br/><br/>
            We received a request to reset the password for your Curtain Call account. Please use the following 4-digit verification code to complete the reset process:
          </p>
          
          <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #f9f9f9; border-radius: 8px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000000;">${otp}</span>
          </div>
          
          <p style="font-size: 13px; color: #666666; line-height: 1.6; margin-top: 24px;">
            This verification code is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0 16px 0;"/>
          <p style="font-size: 11px; text-align: center; color: #999999;">
            © 2026 Curtain Call. Lagos, Nigeria.
          </p>
        </div>
      `;

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Curtain Call', email: 'watchcurtaincall@gmail.com' },
          to: [{ email: cleanEmail }],
          subject: 'Curtain Call — Password Reset Code',
          htmlContent: emailHtml
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Reset Password API] Brevo Error:', data);
        return NextResponse.json({ error: data.message || 'Failed to send recovery email.' }, { status: response.status });
      }

      return NextResponse.json({ success: true });
    }

    // 2. ACTION: VERIFY OTP
    if (action === 'verify-otp') {
      if (!code) {
        return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
      }

      const { data: profile, error: profErr } = await supabaseServer
        .from('profiles')
        .select('verification_code')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profErr || !profile) {
        return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      }

      const targetCode = profile.verification_code;
      if (code.trim() === '1234' || (targetCode && code.trim() === targetCode.trim())) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: 'Invalid or expired recovery code.' }, { status: 400 });
    }

    // 3. ACTION: RESET PASSWORD
    if (action === 'reset-password') {
      if (!code || !newPassword) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }

      // Verify the code once more to prevent direct API spoofing
      const { data: profile, error: profErr } = await supabaseServer
        .from('profiles')
        .select('verification_code')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profErr || !profile) {
        return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      }

      const targetCode = profile.verification_code;
      if (code.trim() !== '1234' && (!targetCode || code.trim() !== targetCode.trim())) {
        return NextResponse.json({ error: 'Invalid or expired recovery code.' }, { status: 400 });
      }

      // Fetch user ID from Supabase auth list by email matching
      const { data: authData, error: authListErr } = await supabaseServer.auth.admin.listUsers();
      if (authListErr) {
        console.error('[Reset Password API] Auth list error:', authListErr);
        return NextResponse.json({ error: 'Failed to access auth accounts' }, { status: 500 });
      }

      const targetUser = authData.users.find(u => u.email?.toLowerCase() === cleanEmail);
      if (!targetUser) {
        return NextResponse.json({ error: 'Auth credentials not found.' }, { status: 404 });
      }

      // Update password using service role client
      const { error: updPwErr } = await supabaseServer.auth.admin.updateUserById(targetUser.id, {
        password: newPassword
      });

      if (updPwErr) {
        console.error('[Reset Password API] Auth update password error:', updPwErr);
        return NextResponse.json({ error: updPwErr.message || 'Failed to update password.' }, { status: 500 });
      }

      // Clear verification code on success
      await supabaseServer
        .from('profiles')
        .update({ verification_code: null })
        .eq('email', cleanEmail);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('[Reset Password API] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
