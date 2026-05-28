/**
 * 🎭 Curtain Call Email Template System
 * Custom, highly aesthetic dark-mode templates designed to WOW users.
 * Uses inline styling compatible with popular email clients.
 */

interface BaseEmailOptions {
  preheader?: string;
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribedUrl?: string;
  signatureType?: 'welcome' | 'support' | 'editors';
}

/**
 * Wraps content in a premium, responsive Curtain Call branded layout
 */
export function buildBaseLayout({
  preheader = "Discover Nigeria's Theatre Platform",
  title,
  bodyHtml,
  ctaText,
  ctaUrl,
  unsubscribedUrl = "https://curtaincall.com.ng/profile",
  signatureType,
}: BaseEmailOptions): string {
  const ctaButtonHtml = ctaText && ctaUrl
    ? `
      <!-- ── CALL TO ACTION ── -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 36px; margin-bottom: 12px;">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" target="_blank" style="
              display: inline-block;
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              color: #000000;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              font-weight: 800;
              font-size: 13px;
              letter-spacing: 2px;
              text-transform: uppercase;
              padding: 18px 48px;
              border-radius: 16px;
              text-decoration: none;
              box-shadow: 0 10px 20px rgba(245, 158, 11, 0.25);
              transition: all 0.2s ease;
            ">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  // Deriving the dynamic signature text depending on email intent
  let signatureTextHtml = '';
  if (signatureType === 'welcome') {
    signatureTextHtml = `
      Sincerely,<br/>
      <strong style="color: #ffffff; font-style: normal;">Babatunde Lawal</strong><br/>
      <span style="font-size: 12px; color: #88888b; font-style: normal; font-family: -apple-system, sans-serif;">Founder and Managing Editor,<br/>Curtain Call</span>
    `;
  } else if (signatureType === 'support') {
    signatureTextHtml = `
      Sincerely,<br/>
      <strong style="color: #ffffff; font-style: normal;">Oyin</strong><br/>
      <span style="font-size: 12px; color: #88888b; font-style: normal; font-family: -apple-system, sans-serif;">Support Team,<br/>Curtain Call</span>
    `;
  } else if (signatureType === 'editors') {
    signatureTextHtml = `
      Sincerely,<br/>
      <strong style="color: #ffffff; font-style: normal;">The CC Editors.</strong>
    `;
  } else {
    signatureTextHtml = `
      Sincerely,<br/>
      <strong style="color: #ffffff; font-style: normal;">The Curtain Call Curation Board</strong>
    `;
  }

  const signatureBlockHtml = `
    <!-- ── Elegant Signature ── -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; font-family: Georgia, serif; font-style: italic;">
            ${signatureTextHtml}
          </p>
        </td>
      </tr>
    </table>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 10px; width: 100% !important;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="
          background: #18181b; 
          border-radius: 32px; 
          overflow: hidden; 
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
          max-width: 600px;
          width: 100%;
        ">
          <!-- Branded Premium Header with Subtle Red/Crimson Glow -->
          <tr>
            <td style="
              background: linear-gradient(180deg, #7f1d1d 0%, #3b0712 100%);
              padding: 48px 40px 36px;
              text-align: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            ">
              <span style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #fca5a5;
                font-weight: 800;
                letter-spacing: 5px;
                text-transform: uppercase;
                display: block;
              ">Curtain Call</span>
              <h1 style="
                margin: 0;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 32px;
                font-weight: 700;
                color: #ffffff;
                line-height: 1.25;
                text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
              ">${title}</h1>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 44px 40px 48px;">
              ${bodyHtml}
              ${signatureBlockHtml}
              ${ctaButtonHtml}
            </td>
          </tr>

          <!-- High-End Branded Footer -->
          <tr>
            <td style="
              background-color: #09090b;
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
            ">
              <p style="
                margin: 0 0 8px;
                font-size: 12px;
                color: #a1a1aa;
                font-weight: 600;
                letter-spacing: 1px;
                text-transform: uppercase;
              ">
                🎭 Curtain Call
              </p>
              <p style="
                margin: 0 0 16px;
                font-size: 11px;
                color: #52525b;
                line-height: 1.6;
              ">
                Nigeria's premier digital stage & creative repository.<br/>
                Empowering producers, actors, writers, and patrons of African Theatre.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                © ${new Date().getFullYear()} Curtain Call. All rights reserved. <br/>
                <a href="${unsubscribedUrl}" style="color: #71717a; text-decoration: underline; font-weight: 500;">Manage email notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Redesigned Daily Quiz Reminder Email
 * Features 5 distinct copy versions that rotate day-to-day so it never feels bland!
 */
export function getDailyQuizReminderHtml(name: string, date: string, slots: number, quizUrl: string): string {
  const shortName = name.split(' ')[0];

  // Rotate copy day-to-day based on calendar date to avoid duplication fatigue
  const dayIndex = new Date(date).getDate();

  const variations = [
    // Version 1: Classic & Direct
    `The CC Daily Quiz is live and ${slots} winner slots are still open.
     <br/><br/>
     Get all 5 questions right before the slots run out and earn <strong>₦200 today</strong>.`,
    
    // Version 2: Competitive edge
    `Clock is ticking! Today's CC Daily Quiz is officially live and the ${slots} winner slots are already filling up fast.
     <br/><br/>
     Think you can get all 5 right? Do it now, secure your spot, and walk away with <strong>₦200 today</strong> straight to your wallet.`,
     
    // Version 3: High Energy / Action
    `5 questions. 5 seconds per slide. <strong>₦200 cash reward</strong> waiting right now.
     <br/><br/>
     Today's CC Daily Quiz is live, but only the first ${slots} perfect submissions claim the prize. Get in there before the slots are gone!`,
     
    // Version 4: Knowledge test
    `How well do you know your theatre? Let's put your stage knowledge to the test.
     <br/><br/>
     Today's CC Daily Quiz is live! Get all 5 questions correct before the ${slots} winner slots run out and claim your <strong>₦200 today</strong>.`,
     
    // Version 5: Early Bird / Spotlight
    `The daily spotlight is on and today's theatre questions are waiting!
     <br/><br/>
     Complete all 5 correctly before the other ${slots} winners beat you to it, and bag your <strong>₦200 prize today</strong>.`
  ];

  const selectedCopy = variations[dayIndex % variations.length];

  const body = `
    <p style="margin: 0 0 24px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
      Hi <strong style="color: #ffffff;">${shortName}</strong>,
    </p>
    <p style="margin: 0 0 28px; font-size: 15px; color: #a1a1aa; line-height: 1.75;">
      ${selectedCopy}
    </p>
    
    <!-- Rule warning card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.02); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 16px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; text-align: center;">
          <p style="margin: 0; font-size: 12.5px; color: #fca5a5; line-height: 1.5;">
            ⚠️ <strong>Crucial rule:</strong> Do not leave the page once you start. Switching tabs voids your attempt immediately.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    preheader: "⚡ Today's CC Daily Quiz is live - play now to win ₦200!",
    title: "🎭 Daily Quiz is Live — Play Now",
    bodyHtml: body,
    ctaText: "Play Now",
    ctaUrl: quizUrl,
    signatureType: 'editors',
  });
}

/**
 * Stunning Redesigned Feature Announcement Email
 * Signed by Babatunde Lawal
 */
export function getFeatureAnnouncementHtml(name: string, appUrl: string): string {
  const shortName = name.split(' ')[0];

  const body = `
    <p style="margin: 0 0 24px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
      Hi <strong style="color: #ffffff;">${shortName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px; font-size: 15.5px; color: #d4d4d8; line-height: 1.75;">
      We just launched the <strong>Curtain Call Daily Quiz</strong> — a new way to test your theatre knowledge and earn while doing it.
    </p>
    
    <p style="margin: 0 0 24px; font-size: 15px; color: #a1a1aa; line-height: 1.75;">
      5 questions every day. 5 seconds per question. Get them all right and earn <strong>₦200 straight to your wallet</strong>. Only the first 10 correct completions win each day — after that, the quiz closes until tomorrow.
    </p>
    
    <!-- Rule card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <h4 style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 1px;">
            ⚠️ One rule:
          </h4>
          <p style="margin: 0; font-size: 13.5px; color: #fca5a5; line-height: 1.6;">
            Don't leave the page once you start. Switching tabs voids your attempt immediately.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px; font-size: 15.5px; color: #ffffff; line-height: 1.75; text-align: center; font-weight: 600;">
      Today's quiz is already live — play now and share your result!
    </p>
  `;

  return buildBaseLayout({
    preheader: "⚡ We just launched the Curtain Call Daily Quiz — test your knowledge and earn ₦200!",
    title: "✨ We just launched something new — and you can earn from it",
    bodyHtml: body,
    ctaText: "Play Now",
    ctaUrl: `${appUrl}/quiz`,
    signatureType: 'welcome',
  });
}

/**
 * Beautiful Transactional / Code Verification Email (OTP)
 */
export function getVerificationEmailHtml(name: string, code: string): string {
  const shortName = name.split(' ')[0];

  const body = `
    <p style="margin: 0 0 24px; font-size: 16px; color: #d4d4d8; line-height: 1.6; text-align: center;">
      Hello <strong style="color: #ffffff;">${shortName}</strong>,
    </p>
    <p style="margin: 0 0 32px; font-size: 15px; color: #a1a1aa; line-height: 1.75; text-align: center;">
      Confirm your Curtain Call account identity. Use the secure, 4-digit verification code below to authorize full access to your account:
    </p>

    <!-- Dramatic Monospace Verification Code Card -->
    <div style="
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%);
      border: 1px solid rgba(239, 68, 68, 0.15);
      border-radius: 24px;
      padding: 30px 20px;
      text-align: center;
      margin: 0 auto 32px;
      max-width: 260px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    ">
      <span style="
        font-family: 'Courier New', Courier, monospace;
        font-size: 46px;
        font-weight: 800;
        letter-spacing: 12px;
        color: #ef4444;
        display: block;
        padding-left: 12px; /* balance the letter spacing */
      ">${code}</span>
      <span style="
        display: block;
        margin-top: 10px;
        font-size: 11px;
        color: #71717a;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      ">Verification Code</span>
    </div>

    <p style="margin: 0 0 24px; font-size: 13px; color: #71717a; line-height: 1.6; text-align: center;">
      This security measure helps us protect your Cast Credits, ticket allocations, and Producer Wallet conversions.
    </p>
    
    <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 1.6; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 24px;">
      If you did not initiate this request, you can safely disregard this message.
    </p>
  `;

  return buildBaseLayout({
    preheader: `🎭 Your Curtain Call secure verification code is ${code}`,
    title: "🔐 Confirm Your Account",
    bodyHtml: body,
    signatureType: 'welcome',
  });
}
