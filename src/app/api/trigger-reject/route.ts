import { NextResponse } from 'next/server';

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = 'sheyeojelekesheyeojeleke@gmail.com';
  const subject = 'Submission Update: Stage Play Submission 🎭';
  
  const rejectionHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
        <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
      </div>
      
      <h2 style="font-family: serif; color: #ffffff; font-size: 22px; margin-top: 0;">Update Regarding Your Submission</h2>
      
      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
        Thank you for submitting your play to the Curtain Call platform. Our editorial and curatorial board has reviewed your submission.
      </p>
      
      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
        At this time, we regret to inform you that your submission has been <strong>declined</strong> for publishing on our main feed.
      </p>
      
      <div style="background-color: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; margin: 30px 0;">
        <p style="color: #ef4444; font-size: 11px; text-transform: uppercase; tracking-wider: 1px; font-weight: bold; margin: 0 0 10px 0;">Curator Notes & Rejection Reason:</p>
        <p style="color: #fca5a5; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
          "The play does not meet our current curatorial guidelines for script quality and production detail requirements. We recommend providing a more comprehensive synopsis and complete cast/crew listing."
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
      message: 'Resend API Key not set. Simulated sending email to sheyeojelekesheyeojeleke@gmail.com.',
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
  return NextResponse.json({ success: res.ok, data });
}
