import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/quiz/auth';

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyUserSession(request);
    const adminSecret = request.headers.get('x-admin-secret');
    const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET;

    const body = await request.json();
    const { to, subject, html, type = 'transactional' } = body;

    // Validate required fields before any further processing
    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    const isVerificationEmail = subject === 'Confirm Your Curtain Call Account 🎭';

    if (!verifiedUser && !isAdmin && !isVerificationEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const mailerSendApiKey = process.env.MAILERSEND_API_KEY;

    // Dynamic extraction of verification OTP code for absolute visibility in server terminal logs
    const codeMatch = html.match(/>(\d{4})<\/span>/) || html.match(/>\s*(\d{4})\s*</) || html.match(/\b(\d{4})\b/);
    const extractedCode = codeMatch ? codeMatch[1] : 'N/A';

    console.log(`
============================================================
🎭 [CURTAIN CALL EMAIL DISPATCHER]
To: ${to}
Subject: "${subject}"
Verification Code: ${extractedCode}
Type: ${type}
Timestamp: ${new Date().toISOString()}
============================================================
`);

    // Plain-text alternative generator to maximize email deliverability and bypass spam filters
    const textAlternative = html
      ? html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // strip style tags
          .replace(/<[^>]+>/g, ' ') // strip HTML tags
          .replace(/\s+/g, ' ') // collapse whitespaces
          .trim()
      : '';

    // Provider dispatcher functions
    const sendViaResend = async () => {
      if (!resendApiKey || resendApiKey === 're_your_resend_api_key_here') throw new Error('Missing Resend Key');
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Curtain Call <notifications@curtaincall.com.ng>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: textAlternative,
        }),
      });
      if (!resendRes.ok) {
        const errorData = await resendRes.json().catch(() => ({}));
        throw { provider: 'resend', status: resendRes.status, data: errorData };
      }
      return { success: true, provider: 'resend' };
    };

    const sendViaBrevo = async () => {
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (!brevoApiKey) throw new Error('Missing Brevo Key');
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: 'notifications@curtaincall.com.ng',
            name: 'Curtain Call'
          },
          to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          subject,
          htmlContent: html,
          textContent: textAlternative,
        }),
      });
      if (!brevoRes.ok) {
        const errorData = await brevoRes.json().catch(() => ({}));
        throw { provider: 'brevo', status: brevoRes.status, data: errorData };
      }
      return { success: true, provider: 'brevo' };
    };

    let primaryErrorData = null;

    // Routing Logic based on Email Type
    if (type === 'bulk') {
      // Primary: Resend, Fallback: Brevo
      try {
        console.log('[Email Dispatcher] Routing to Resend (Primary for Bulk)');
        const result = await sendViaResend();
        return NextResponse.json(result);
      } catch (err: any) {
        primaryErrorData = err;
        console.warn('[Email Dispatcher] Resend failed, falling back to Brevo...', err);
        try {
          const fallbackResult = await sendViaBrevo();
          return NextResponse.json(fallbackResult);
        } catch (fallbackErr: any) {
          console.error('[Email Dispatcher] CRITICAL: Both bulk providers failed', { primary: err, fallback: fallbackErr });
          return NextResponse.json({ error: 'All providers failed', details: { primary: err, fallback: fallbackErr } }, { status: 500 });
        }
      }
    } else {
      // Primary: Brevo, Fallback: Resend (Transactional/Default)
      try {
        console.log('[Email Dispatcher] Routing to Brevo (Primary for Transactional)');
        const result = await sendViaBrevo();
        return NextResponse.json(result);
      } catch (err: any) {
        primaryErrorData = err;
        console.warn('[Email Dispatcher] Brevo failed, falling back to Resend...', err);
        try {
          const fallbackResult = await sendViaResend();
          return NextResponse.json(fallbackResult);
        } catch (fallbackErr: any) {
           // If Resend fails and the key is missing, simulate for dev
           if (fallbackErr.message === 'Missing Resend Key') {
             console.warn('[Email Dispatcher] Fallback Resend API Key Missing. Simulating delivery.');
             return NextResponse.json({ success: true, simulated: true, provider: 'simulation' });
           }
          console.error('[Email Dispatcher] CRITICAL: Both transactional providers failed', { primary: err, fallback: fallbackErr });
          return NextResponse.json({ error: 'All providers failed', details: { primary: err, fallback: fallbackErr } }, { status: 500 });
        }
      }
    }

  } catch (error: any) {
    console.error('[API Send-Email Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
