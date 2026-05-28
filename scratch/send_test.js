const fs = require('fs');
const https = require('https');
const path = require('path');

// 1. Dependency-free env loader
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      // Remove wrapping quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  return env;
}

const env = loadEnv();
const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

if (!apiKey || apiKey === 're_your_resend_api_key_here') {
  console.error("❌ RESEND_API_KEY is not defined in .env.local!");
  process.exit(1);
}

// 2. Custom Template Generators
function getFeatureAnnouncementHtml(name, appUrl) {
  const shortName = name.split(' ')[0];

  const body = `
    <p style="margin: 0 0 24px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
      Hi <strong style="color: #ffffff;">${shortName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #ffffff; line-height: 1.5; font-family: Georgia, serif; text-align: center;">
      Quick question — how well do you know Nigerian theatre?
    </p>
    
    <!-- Campaign Highlights Card -->
    <div style="
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 28px 24px;
      margin-bottom: 28px;
      text-align: center;
    ">
      <p style="margin: 0 0 16px; font-size: 15px; color: #d4d4d8; line-height: 1.7;">
        <strong>The Curtain Call Daily Quiz</strong> just launched. 5 questions a day. 5 seconds per question. Get them all right and earn <strong style="color: #fbbf24;">₦200 per day</strong>.
      </p>
      <p style="margin: 0; font-size: 15px; color: #f97316; font-weight: 700; line-height: 1.6;">
        Only 10 people can win each day. First come, first served.
      </p>
    </div>

    <!-- Hype Drop Line -->
    <p style="margin: 0 0 24px; font-size: 13.5px; font-weight: 800; color: #4ade80; text-align: center; text-transform: uppercase; letter-spacing: 1px; line-height: 1.6;">
      WE WILL DROP A NEW QUIZ EVERY DAY SO YOU CAN EARN WHILE YOU HAVE FUN!
    </p>
    
    <!-- Urgency Note -->
    <p style="margin: 0; font-size: 13px; color: #ef4444; font-weight: 700; text-align: center; letter-spacing: 2px; text-transform: uppercase;">
      ⏳ Clock is ticking.
    </p>
  `;

  return buildBaseLayout({
    preheader: "🎭 5 questions. 5 seconds. Get them all right and earn ₦200 per day!",
    title: "⚡ The Curtain Call Daily Quiz is Live!",
    bodyHtml: body,
    ctaText: "Take Today's Quiz →",
    ctaUrl: `${appUrl}/quiz`,
    signatureType: 'editors',
  });
}

function buildBaseLayout({ preheader, title, bodyHtml, ctaText, ctaUrl, signatureType }) {
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
            ">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  let signatureTextHtml = '';
  if (signatureType === 'editors') {
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
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 10px; width: 100% !important;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #18181b; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); max-width: 600px; width: 100%;">
          <tr>
            <td style="background: linear-gradient(180deg, #7f1d1d 0%, #3b0712 100%); padding: 48px 40px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="margin: 0 0 12px; font-size: 13px; color: #fca5a5; font-weight: 800; letter-spacing: 5px; text-transform: uppercase; display: block;">Curtain Call</span>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.25; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 44px 40px 48px;">
              ${bodyHtml}
              ${signatureBlockHtml}
              ${ctaButtonHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #09090b; padding: 32px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0 0 8px; font-size: 12px; color: #a1a1aa; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">🎭 Curtain Call</p>
              <p style="margin: 0 0 16px; font-size: 11px; color: #52525b; line-height: 1.6;">Nigeria's premier digital stage & creative repository.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// 3. Dispatch execution using HTTPS module
function run() {
  const recipient = "thejokang@gmail.com";
  const htmlContent = getFeatureAnnouncementHtml("Babatunde Lawal", "https://curtaincall.com.ng");

  console.log(`📤 Dispatching test email to ${recipient} via Resend...`);

  const requestBody = JSON.stringify({
    from: "Curtain Call <notifications@curtaincall.com.ng>",
    to: [recipient],
    subject: "⚡ The Curtain Call Daily Quiz is Live!",
    html: htmlContent,
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log("✅ Success! Test email dispatched successfully:", JSON.parse(data));
      } else {
        console.error(`❌ Error response from Resend API (HTTP ${res.statusCode}):`, data);
      }
    });
  });

  req.on('error', (e) => {
    console.error("❌ HTTPS Request failed:", e.message);
  });

  req.write(requestBody);
  req.end();
}

run();
