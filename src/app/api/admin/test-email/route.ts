import { NextResponse } from 'next/server';

export async function GET() {
  const mailerSendApiKey = process.env.MAILERSEND_API_KEY;
  if (!mailerSendApiKey) return NextResponse.json({ error: 'No key' }, { status: 400 });

  const payload = [{
    from: { email: 'notifications@curtaincall.com.ng', name: 'Curtain Call' },
    to: [{ email: 'watchcurtaincall@gmail.com' }],
    subject: 'MailerSend Test Successful 🎭',
    html: '<p>The new MailerSend API key is working perfectly!</p>',
    text: 'The new MailerSend API key is working perfectly!'
  }];

  try {
    const msRes = await fetch('https://api.mailersend.com/v1/bulk-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailerSendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (msRes.ok || msRes.status === 202) {
      return NextResponse.json({ success: true, message: 'Email sent to admin' });
    } else {
      const errorText = await msRes.text();
      return NextResponse.json({ error: errorText }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
