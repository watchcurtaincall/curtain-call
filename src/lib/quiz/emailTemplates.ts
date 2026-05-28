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
          <!-- Branded Premium Header with Subtle Red/Crimson Theater Glow -->
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
 */
export function getDailyQuizReminderHtml(name: string, date: string, slots: number, quizUrl: string): string {
  const displayDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  
  const shortName = name.split(' ')[0];

  const body = `
    <p style="margin: 0 0 24px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
      Hi <strong style="color: #ffffff;">${shortName}</strong>,
    </p>
    <p style="margin: 0 0 28px; font-size: 15px; color: #a1a1aa; line-height: 1.75;">
      The spotlights are up, the audience is seated, and today's 5-question theatre trivia is officially **live**. Answer fast, protect your streak, and claim one of the premium winner slots!
    </p>

    <!-- Sleek Glassmorphism Stats Showcase -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; border-collapse: separate; border-spacing: 8px 0;">
      <tr>
        <!-- Stat 1: Questions -->
        <td style="
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px 10px;
          text-align: center;
          width: 33%;
        ">
          <p style="margin: 0; font-size: 24px; font-weight: 900; color: #f59e0b; line-height: 1.2;">5</p>
          <p style="margin: 6px 0 0; font-size: 10px; color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Trivia Qs</p>
        </td>

        <!-- Stat 2: Slots -->
        <td style="
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px 10px;
          text-align: center;
          width: 33%;
        ">
          <p style="margin: 0; font-size: 24px; font-weight: 900; color: #f97316; line-height: 1.2;">${slots}</p>
          <p style="margin: 6px 0 0; font-size: 10px; color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Win Slots</p>
        </td>

        <!-- Stat 3: Timer -->
        <td style="
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px 10px;
          text-align: center;
          width: 33%;
        ">
          <p style="margin: 0; font-size: 24px; font-weight: 900; color: #ef4444; line-height: 1.2;">5s</p>
          <p style="margin: 6px 0 0; font-size: 10px; color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Per Slide</p>
        </td>
      </tr>
    </table>

    <!-- Beautiful Information Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(245, 158, 11, 0.03) 100%);
      border: 1px solid rgba(245, 158, 11, 0.1);
      border-radius: 20px;
      margin-bottom: 24px;
    ">
      <tr>
        <td style="padding: 24px 28px;">
          <h3 style="margin: 0 0 10px; font-size: 15px; font-weight: 700; color: #fbbf24; font-family: Georgia, serif;">
            💰 Play for Real Value
          </h3>
          <p style="margin: 0; font-size: 13.5px; color: #a1a1aa; line-height: 1.6;">
            Every successful run adds points to your wallet. Convert your points to cash directly into your <strong>Producer Wallet</strong> whenever you choose.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px; font-size: 12px; color: #52525b; text-align: center; line-height: 1.6;">
      ⚡ Slots fill up fast — be first to answer all 5 correctly!<br/>
      🚨 Do not leave the tab or minimize the browser or your attempt will instantly be voided.
    </p>
  `;

  return buildBaseLayout({
    preheader: `🎭 Complete today's daily theatre quiz for a chance to win one of ${slots} winner slots!`,
    title: `🎭 Today's Theatre Quiz is Live!`,
    bodyHtml: body,
    ctaText: "Take Today's Quiz →",
    ctaUrl: quizUrl,
  });
}

/**
 * Stunning Redesigned Feature Announcement Email
 */
export function getFeatureAnnouncementHtml(name: string, appUrl: string): string {
  const shortName = name.split(' ')[0];

  const body = `
    <p style="margin: 0 0 24px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
      Hi <strong style="color: #ffffff;">${shortName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; color: #a1a1aa; line-height: 1.8;">
      We're thrilled to introduce a highly requested feature to the **Curtain Call Daily Quiz** designed to capture your proudest theatrical achievements:
    </p>

    <!-- Headline and core announcement banner -->
    <div style="
      background: radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.06) 0%, rgba(0, 0, 0, 0) 90%);
      border: 1px solid rgba(245, 158, 11, 0.15);
      border-radius: 24px;
      padding: 30px 24px;
      text-align: center;
      margin-bottom: 32px;
    ">
      <span style="font-size: 40px; display: block; margin-bottom: 12px;">🏆 ➔ 🔗</span>
      <h2 style="
        margin: 0 0 8px;
        font-family: Georgia, serif;
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
      ">
        Introduce: Share Results Globally!
      </h2>
      <p style="margin: 0 auto; max-width: 440px; font-size: 14px; color: #d4d4d8; line-height: 1.6;">
        You can now instantly share your quiz scores, winning slots, points, and streaks directly to WhatsApp, Twitter, and Instagram stories in one elegant click!
      </p>
    </div>

    <!-- Features Breakdown Section -->
    <h3 style="
      margin: 0 0 16px;
      font-size: 12px;
      font-weight: 800;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 2px;
    ">
      What's New on Curtain Call
    </h3>

    <!-- Feature 1: Universal Sharing -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="top" style="padding-top: 4px; width: 44px;">
          <div style="
            background: rgba(245, 158, 11, 0.1);
            border-radius: 12px;
            width: 32px;
            height: 32px;
            line-height: 32px;
            text-align: center;
            font-size: 16px;
          ">🔗</div>
        </td>
        <td style="padding-left: 12px;">
          <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">Share Any Score</h4>
          <p style="margin: 0; font-size: 13.5px; color: #a1a1aa; line-height: 1.6;">
            Whether you claimed Winner Slot #1, earned a perfect 5/5, or just finished a fun run, you can now show off your score to friends. No score is too small to share!
          </p>
        </td>
      </tr>
    </table>

    <!-- Feature 2: Premium Visual Copy -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="top" style="padding-top: 4px; width: 44px;">
          <div style="
            background: rgba(239, 68, 68, 0.1);
            border-radius: 12px;
            width: 32px;
            height: 32px;
            line-height: 32px;
            text-align: center;
            font-size: 16px;
          ">🔥</div>
        </td>
        <td style="padding-left: 12px;">
          <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">Show off Streaks & Points</h4>
          <p style="margin: 0; font-size: 13.5px; color: #a1a1aa; line-height: 1.6;">
            Your shared results include your active daily streak and points gained, immediately raising the competitive bar for your peers and social followers.
          </p>
        </td>
      </tr>
    </table>

    <!-- Feature 3: Cash Conversion -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td valign="top" style="padding-top: 4px; width: 44px;">
          <div style="
            background: rgba(74, 222, 128, 0.1);
            border-radius: 12px;
            width: 32px;
            height: 32px;
            line-height: 32px;
            text-align: center;
            font-size: 16px;
          ">💰</div>
        </td>
        <td style="padding-left: 12px;">
          <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">Points to Cash, Instantly</h4>
          <p style="margin: 0; font-size: 13.5px; color: #a1a1aa; line-height: 1.6;">
            Points earned are accumulated securely in your wallet and can be fully converted directly to cash on demand into your producer account balance.
          </p>
        </td>
      </tr>
    </table>

    <!-- Play Highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" style="
      background: #27272a;
      border-radius: 16px;
      margin-bottom: 24px;
    ">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #d4d4d8; line-height: 1.5;">
            Join today's competition and be the first to share your achievements!
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    preheader: "🏆 Share your daily Curtain Call scores, streaks, and prizes instantly with the new sharing feature!",
    title: "✨ Show Off Your Theatre Mastery!",
    bodyHtml: body,
    ctaText: "Play & Share Today's Quiz →",
    ctaUrl: `${appUrl}/quiz`,
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
  });
}
