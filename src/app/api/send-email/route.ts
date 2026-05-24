import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();
    const resendApiKey = process.env.RESEND_API_KEY;

    console.log(`[Resend Email Sender] Preparing email to ${to}: "${subject}"`);

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
          sentAt: new Date().toISOString()
        }
      });
    }

    // Call the real Resend API endpoint
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Curtain Call <notifications@curtaincall.com.ng>', // onboarding@resend.dev if custom domain is not yet active in Resend
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
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
