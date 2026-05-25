import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();
    const resendApiKey = process.env.RESEND_API_KEY;

    // Dynamic extraction of verification OTP code for absolute visibility in server terminal logs
    const codeMatch = html.match(/>(\d{4})<\/span>/) || html.match(/>\s*(\d{4})\s*</) || html.match(/\b(\d{4})\b/);
    const extractedCode = codeMatch ? codeMatch[1] : 'N/A';

    console.log(`
============================================================
🎭 [CURTAIN CALL EMAIL DISPATCHER]
To: ${to}
Subject: "${subject}"
Verification Code: ${extractedCode}
Timestamp: ${new Date().toISOString()}
============================================================
`);

    // Dynamic verification of Resend API key
    if (!resendApiKey || resendApiKey === 're_your_resend_api_key_here') {
      console.warn('[Resend API Key Missing/Placeholder] Simulating email delivery for developer testing.');
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Email successfully simulated and logged.',
        data: {
          id: `sim_email_${Date.now()}`,
          to,
          subject,
          html,
          code: extractedCode,
          sentAt: new Date().toISOString()
        }
      });
    }

    // Plain-text alternative generator to maximize email deliverability and bypass spam filters
    const textAlternative = html
      ? html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // strip style tags
          .replace(/<[^>]+>/g, ' ') // strip HTML tags
          .replace(/\s+/g, ' ') // collapse whitespaces
          .trim()
      : '';

    // Call the real Resend API endpoint
    const res = await fetch('https://api.resend.com/emails', {
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

    const data = await res.json();

    if (!res.ok) {
      console.error('[Resend Error Response]:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to send email via Resend API.' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[API Send-Email Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
