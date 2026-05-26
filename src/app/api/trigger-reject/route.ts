import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get('reason');
  const to = searchParams.get('to') || 'sheyeojelekesheyeojeleke@gmail.com';
  const name = searchParams.get('name') || 'Stage Play Submission';

  // If no reason parameter is passed, render a premium interactive email dispatch panel!
  if (!reason) {
    const htmlPanel = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Curtain Call — Rejection Dispatch Panel 🎭</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .card {
            background: #0c0c0e;
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 24px;
            max-width: 600px;
            width: 100%;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            position: relative;
            overflow: hidden;
          }
          .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: #dc2626;
          }
          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: #ffffff;
            text-align: center;
          }
          .subtitle {
            color: #a1a1aa;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-align: center;
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 20px;
            display: flex;
            flex-col: column;
            flex-direction: column;
            gap: 6px;
          }
          label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 1px;
            color: #dc2626;
          }
          input, textarea {
            background: #050507;
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 12px 16px;
            color: #ffffff;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.3s ease;
          }
          input:focus, textarea:focus {
            outline: none;
            border-color: #dc2626;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
          }
          button {
            background: #ffffff;
            color: #000000;
            border: none;
            border-radius: 12px;
            padding: 14px 24px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
            transition: background 0.3s ease;
          }
          button:hover {
            background: #e4e4e7;
          }
          .footer-note {
            font-size: 10px;
            color: #52525b;
            text-align: center;
            margin-top: 25px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Rejection Dispatch Panel 🎭</h1>
          <div class="subtitle">Curtain Call Administrative tool</div>
          
          <form method="GET" action="/api/trigger-reject">
            <div class="form-group">
              <label for="to">Recipient Email Address</label>
              <input type="email" id="to" name="to" value="${to}" required>
            </div>
            
            <div class="form-group">
              <label for="name">Declined Play Title</label>
              <input type="text" id="name" name="name" value="${name}" placeholder="e.g. Death and the King's Horseman" required>
            </div>
            
            <div class="form-group">
              <label for="reason">Exact Rejection Reason / Curator Notes</label>
              <textarea id="reason" name="reason" rows="5" placeholder="Type the exact rejection notes you added here..." required></textarea>
            </div>
            
            <button type="submit">Dispatch Rejection Email Now →</button>
          </form>
          
          <div class="footer-note">
            CURTAIN CALL DIGITAL NOTIFICATION UTILITIES
          </div>
        </div>
      </body>
      </html>
    `;
    return new Response(htmlPanel, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const subject = `Submission Update: "${name}" 🎭`;
  
  const rejectionHtml = `
    <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
        <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
      </div>
      
      <h2 style="font-family: serif; color: #ffffff; font-size: 22px; margin-top: 0;">Update Regarding Your Submission</h2>
      
      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
        Thank you for submitting <strong>${name}</strong> to the Curtain Call platform. Our editorial and curatorial board has reviewed your submission.
      </p>
      
      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
        At this time, we regret to inform you that your submission has been <strong>declined</strong> for publishing on our main feed.
      </p>
      
      <div style="background-color: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; margin: 30px 0;">
        <p style="color: #ef4444; font-size: 11px; text-transform: uppercase; tracking-wider: 1px; font-weight: bold; margin: 0 0 10px 0;">Curator's Notes & Rejection Reason:</p>
        <p style="color: #fca5a5; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
          "${reason}"
        </p>
      </div>
      
      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
        We encourage you to review the notes above, make the necessary corrections, and re-submit your credit when ready!
      </p>
      
      <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
        Best regards,<br/>
        <strong>The Curtain Call Curation Board</strong>
      </p>
    </div>
  `;

  if (!resendApiKey || resendApiKey === 're_your_resend_api_key_here') {
    return NextResponse.json({
      success: true,
      simulated: true,
      message: 'Resend API Key not set. Simulated sending email to ' + to,
      html: rejectionHtml
    });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Curtain Call <notifications@curtaincall.com.ng>',
      to: [to],
      subject,
      html: rejectionHtml,
    }),
  });

  const data = res.ok ? await res.json() : null;
  
  const successPanel = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Email Dispatched Successfully! 🎉</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { background: #09090b; color: #f4f4f5; font-family: 'Outfit', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: #0c0c0e; border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 40px; text-align: center; max-width: 500px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        h1 { color: #22c55e; margin: 0 0 15px 0; }
        p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 25px; }
        a { background: #ffffff; color: #000000; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 12px; display: inline-block; font-size: 13px; transition: background 0.3s ease; }
        a:hover { background: #e4e4e7; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Email Sent! 🎉</h1>
        <p>The rejection email with your exact curator notes has been dispatched to <strong>${to}</strong> regarding the play <strong>"${name}"</strong>.</p>
        <a href="/api/trigger-reject">Back to Mailer Panel</a>
      </div>
    </body>
    </html>
  `;

  return new Response(successPanel, {
    headers: { 'Content-Type': 'text/html' }
  });
}
