import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, html, type = 'transactional' } = await request.json();
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

    const sendViaMailerSend = async () => {
      if (!mailerSendApiKey || mailerSendApiKey === 'mlsn_your_api_key_here') throw new Error('Missing MailerSend Key');
      const mailerSendRes = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailerSendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: 'notifications@curtaincall.com.ng',
            name: 'Curtain Call'
          },
          to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          subject,
          html,
          text: textAlternative,
        }),
      });
      if (!mailerSendRes.ok) {
        const errorData = await mailerSendRes.json().catch(() => ({}));
        throw { provider: 'mailersend', status: mailerSendRes.status, data: errorData };
      }
      return { success: true, provider: 'mailersend' };
    };

    let primaryErrorData = null;

    // Routing Logic based on Email Type
    if (type === 'bulk') {
      // Primary: MailerSend, Fallback: Resend
      try {
        console.log('[Email Dispatcher] Routing to MailerSend (Primary for Bulk)');
        const result = await sendViaMailerSend();
        return NextResponse.json(result);
      } catch (err: any) {
        primaryErrorData = err;
        console.warn('[Email Dispatcher] MailerSend failed, falling back to Resend...', err);
        try {
          const fallbackResult = await sendViaResend();
          return NextResponse.json(fallbackResult);
        } catch (fallbackErr: any) {
          console.error('[Email Dispatcher] CRITICAL: Both bulk providers failed', { primary: err, fallback: fallbackErr });
          return NextResponse.json({ error: 'All providers failed', details: { primary: err, fallback: fallbackErr } }, { status: 500 });
        }
      }
    } else {
      // Primary: Resend, Fallback: MailerSend (Transactional/Default)
      try {
        console.log('[Email Dispatcher] Routing to Resend (Primary for Transactional)');
        const result = await sendViaResend();
        return NextResponse.json(result);
      } catch (err: any) {
        primaryErrorData = err;
        console.warn('[Email Dispatcher] Resend failed, falling back to MailerSend...', err);
        try {
          const fallbackResult = await sendViaMailerSend();
          return NextResponse.json(fallbackResult);
        } catch (fallbackErr: any) {
           // If MailerSend fails and the key is missing, simulate for dev
           if (fallbackErr.message === 'Missing MailerSend Key') {
             console.warn('[Email Dispatcher] Fallback MailerSend API Key Missing. Simulating delivery.');
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
