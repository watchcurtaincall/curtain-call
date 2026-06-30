import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

function parsePaystackMetadata(metadata: any): any {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  
  const parsed: any = {};
  const str = String(metadata);
  
  const idMatch = str.match(/"production_id"\s*:\s*"([^"]+)"/);
  const titleMatch = str.match(/"production_title"\s*:\s*"([^"]+)"/);
  const tierMatch = str.match(/"tier"\s*:\s*"([^"]+)"/);
  const firstNameMatch = str.match(/"buyer_first_name"\s*:\s*"([^"]+)"/);
  const lastNameMatch = str.match(/"buyer_last_name"\s*:\s*"([^"]+)"/);
  const phoneMatch = str.match(/"buyer_phone"\s*:\s*"([^"]+)"/);
  const sendToOthersMatch = str.match(/"send_to_others"\s*:\s*(true|false)/);
  
  if (idMatch) parsed.production_id = idMatch[1];
  if (titleMatch) parsed.production_title = titleMatch[1];
  if (tierMatch) parsed.tier = tierMatch[1];
  if (firstNameMatch) parsed.buyer_first_name = firstNameMatch[1];
  if (lastNameMatch) parsed.buyer_last_name = lastNameMatch[1];
  if (phoneMatch) parsed.buyer_phone = phoneMatch[1];
  if (sendToOthersMatch) parsed.send_to_others = sendToOthersMatch[1] === 'true';
  
  // Attempt to parse cart object
  const cartMatch = str.match(/"cart"\s*:\s*({[^}]+})/);
  if (cartMatch) {
    try {
      parsed.cart = JSON.parse(cartMatch[1]);
    } catch (e) {
      console.warn('[Paystack Webhook] Failed to parse extracted cart JSON:', cartMatch[1]);
    }
  }
  
  // Attempt to parse ticket_prices object if not truncated
  const pricesMatch = str.match(/"ticket_prices"\s*:\s*({[^}]+})/);
  if (pricesMatch) {
    try {
      parsed.ticket_prices = JSON.parse(pricesMatch[1]);
    } catch (e) {}
  }
  
  // Attempt to parse attendees object if not truncated
  const attendeesMatch = str.match(/"attendees"\s*:\s*({[^}]+})/);
  if (attendeesMatch) {
    try {
      parsed.attendees = JSON.parse(attendeesMatch[1]);
    } catch (e) {}
  }
  
  return parsed;
}

function getProducerNotificationHtml(
  productionTitle: string,
  buyerEmail: string,
  ticketsCount: number,
  tiersStr: string,
  amount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#FFFFFF; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
              <tr>
                <td align="center" style="padding-bottom:20px; border-bottom:1px solid #8B1C31;">
                  <div style="font-family:Georgia, serif; font-size:32px; font-weight:bold; color:#8B1C31; letter-spacing:1px;">Curtain Call</div>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 0;">
                  <h1 style="margin:0 0 20px 0; font-family:Georgia, serif; font-size:24px; color:#1A1A1A; line-height:1.3; font-weight:bold; text-align:center;">New Ticket Sale Recorded</h1>
                  <div style="width:40px; height:2px; background-color:#8B1C31; margin:0 auto 20px auto;"></div>
                  <p style="margin:0 0 30px 0; font-family:Arial, sans-serif; font-size:16px; color:#555555; line-height:1.6; text-align:center;">Great news! Someone just purchased admission to your production.</p>

                  <div style="background-color:#FDF5F6; border:1px solid #E5D5D8; border-radius:12px; padding:30px; margin:0 0 30px 0;">
                    <p style="margin:0 0 8px 0; font-family:Arial, sans-serif; font-size:12px; font-weight:bold; color:#8B1C31; letter-spacing:1px; text-transform:uppercase;">Sales Confirmation</p>
                    <h2 style="margin:0 0 20px 0; font-family:Georgia, serif; font-size:28px; color:#1A1A1A;">${productionTitle}</h2>
                    
                    <div style="border-top:1px dashed #D4C4C7; margin:20px 0;"></div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, sans-serif; font-size:14px; color:#1A1A1A; line-height:1.6;">
                      <tr><td width="120" style="padding-bottom:12px; color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Buyer Email</td><td style="padding-bottom:12px; text-align:right; font-weight:bold;">${buyerEmail}</td></tr>
                      <tr><td style="padding-bottom:12px; color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Tickets Sold</td><td style="padding-bottom:12px; text-align:right; font-weight:bold;">${ticketsCount} Ticket(s)</td></tr>
                      <tr><td style="padding-bottom:12px; color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Tiers Purchased</td><td style="padding-bottom:12px; text-align:right; font-weight:bold;">${tiersStr}</td></tr>
                      <tr><td style="color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Total Revenue</td><td style="text-align:right; font-weight:bold; color:#1C7C54;">₦${amount.toLocaleString()}</td></tr>
                    </table>
                  </div>

                  <p style="margin:0 0 20px 0; font-family:Arial, sans-serif; font-size:15px; color:#555555; line-height:1.6; text-align:center;">This sale has been credited to your creator wallet. You can request a withdrawal or check your complete sales list from the portal.</p>

                  <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:40px;">
                    <tr>
                      <td align="center">
                        <a href="https://curtaincall.com.ng/creator" style="display:inline-block; background-color:#8B1C31; color:#FFFFFF; font-family:Arial, sans-serif; font-size:16px; font-weight:bold; text-decoration:none; padding:16px 40px; border-radius:4px;">Manage Production</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:30px; border-top:1px solid #8B1C31;">
                  <p style="margin:0 0 12px 0; font-family:Georgia, serif; font-size:14px; color:#555555; font-style:italic;">Documenting Nigerian Theatre and its Creators.</p>
                  <p style="margin:0; font-family:Arial, sans-serif; font-size:12px; color:#888888;">
                    <a href="https://curtaincall.com.ng" style="color:#888888; text-decoration:underline;">curtaincall.com.ng</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature missing' }, { status: 401 });
    }

    // Verify signature using Paystack secret key to prove authenticity
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(bodyText)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature validation' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);
    console.log('✓ Secure Paystack Webhook Event Received:', event.event);

    // Process charge success events
    if (event.event === 'charge.success') {
      const data = event.data;
      const email = data.customer.email;
      const amount = data.amount / 100; // Convert to NGN
      const reference = data.reference;
      const metadata = parsePaystackMetadata(data.metadata);

      console.log(`💰 Payment of ₦${amount} succeeded for customer ${email}. Ref: ${reference}`, metadata);

      const productionId = metadata.production_id;
      const productionTitle = metadata.production_title || 'Curtain Call Event';
      const cart = metadata.cart;
      const ticketPrices = metadata.ticket_prices || {};
      const buyerFirstName = metadata.buyer_first_name || '';
      const buyerLastName = metadata.buyer_last_name || '';
      const sendToOthers = metadata.send_to_others || false;
      const attendees = metadata.attendees || {};

      let venue = 'Broad Street Stage Venue';
      let showDateFormatted = 'Scheduled Date';
      let producerEmail = '';

      if (supabaseServer && productionId) {
        const { data: prodData } = await supabaseServer
          .from('productions')
          .select('venue, show_date, submitter_email')
          .eq('id', productionId)
          .maybeSingle();

        if (prodData) {
          venue = prodData.venue || venue;
          producerEmail = prodData.submitter_email || '';
          if (prodData.show_date) {
            try {
              showDateFormatted = new Date(prodData.show_date).toLocaleDateString('en-NG', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              });
            } catch (e) {
              showDateFormatted = prodData.show_date;
            }
          }
        }
      }

      const ticketsToInsert: any[] = [];
      let globalTicketIndex = 1;

      if (productionId && cart && typeof cart === 'object') {
        const totalTickets = Object.values(cart).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0) as number;
        
        for (const [tierName, qtyObj] of Object.entries(cart)) {
          const qty = Number(qtyObj) || 0;
          const tierPrice = Number(ticketPrices[tierName]) || 0;

          for (let i = 0; i < qty; i++) {
            let recipientEmail = email;
            let recipientName = `${buyerFirstName} ${buyerLastName}`.trim() || email.split('@')[0];

            if (sendToOthers) {
              const attendeeKey = `${tierName}-${i}`;
              const attendeeInfo = attendees[attendeeKey] || {};
              if (attendeeInfo.email && attendeeInfo.email.trim() !== '') recipientEmail = attendeeInfo.email;
              if (attendeeInfo.name && attendeeInfo.name.trim() !== '') recipientName = attendeeInfo.name;
            }

            const ticketRef = totalTickets > 1 ? `${reference}-${globalTicketIndex}` : reference;
            const randDigits = Math.floor(100 + Math.random() * 900);
            const gatePass = `CC-${randDigits}`;
            const ticketId = `tkt_${reference}_${globalTicketIndex}`;
            const ticketDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            ticketsToInsert.push({
              id: ticketId,
              production_id: productionId,
              production_title: productionTitle,
              buyer_email: recipientEmail.toLowerCase(),
              tier: tierName,
              price: tierPrice,
              reference: ticketRef,
              gate_pass: gatePass,
              date: ticketDate,
              timestamp: Date.now()
            });

            globalTicketIndex++;
          }
        }
      } else {
        // Fallback for single/simple ticket
        const tierName = metadata.tier || 'General Admission';
        const ticketId = `tkt_${reference}_1`;
        const ticketDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        ticketsToInsert.push({
          id: ticketId,
          production_id: productionId || 'unknown',
          production_title: productionTitle,
          buyer_email: email.toLowerCase(),
          tier: tierName,
          price: amount,
          reference: reference,
          gate_pass: `CC-${Math.floor(100 + Math.random() * 900)}`,
          date: ticketDate,
          timestamp: Date.now()
        });
      }

      // Upsert tickets to DB
      if (ticketsToInsert.length > 0 && supabaseServer) {
        const { error } = await supabaseServer
          .from('tickets')
          .upsert(ticketsToInsert);
        if (error) {
          console.error('[Paystack Webhook] DB error inserting tickets:', error);
        } else {
          console.log(`[Paystack Webhook] Successfully inserted ${ticketsToInsert.length} tickets to DB.`);
        }
      }

      // Sync user profile creation/verification status
      if (supabaseServer) {
        const nameToSave = `${buyerFirstName} ${buyerLastName}`.trim() || email.split('@')[0];
        const joinDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const { error: profileError } = await supabaseServer
          .from('profiles')
          .upsert({
            email: email.toLowerCase(),
            name: nameToSave,
            join_date: joinDate,
            is_verified: true
          }, { onConflict: 'email' });
        
        if (profileError) {
          console.error('[Paystack Webhook] Profile sync error:', profileError);
        }
      }

      // Group tickets by email to send grouped admission emails
      const ticketsByEmail = ticketsToInsert.reduce((acc, t) => {
        if (!acc[t.buyer_email]) acc[t.buyer_email] = [];
        acc[t.buyer_email].push(t);
        return acc;
      }, {} as Record<string, any[]>);

      // Send emails
      for (const [recipientEmail, tix] of Object.entries(ticketsByEmail) as [string, any[]][]) {
        const subject = `Your Curtain Call Admission Pass: ${productionTitle}`;
        const ticketRows = tix.map((t, idx) => `
          <tr style="border-top: 1px dashed #D4C4C7;">
            <td style="padding: 10px 0; color: #555555; font-size: 14px;">Pass #${idx + 1} (${t.tier})</td>
            <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 16px; font-weight: bold; color: #1C7C54;">${t.gate_pass}</td>
          </tr>
        `).join('');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0; padding:0; background-color:#FFFFFF; font-family:Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;">
              <tr>
                <td align="center" style="padding-clip:40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
                    <tr>
                      <td align="center" style="padding-bottom:20px; border-bottom:1px solid #8B1C31;">
                        <div style="font-family:Georgia, serif; font-size:32px; font-weight:bold; color:#8B1C31; letter-spacing:1px;">Curtain Call</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 0;">
                        <h1 style="margin:0 0 20px 0; font-family:Georgia, serif; font-size:24px; color:#1A1A1A; line-height:1.3; font-weight:bold; text-align:center;">${productionTitle} Admission Pass</h1>
                        <div style="width:40px; height:2px; background-color:#8B1C31; margin:0 auto 20px auto;"></div>
                        <p style="margin:0 0 30px 0; font-family:Arial, sans-serif; font-size:16px; color:#555555; line-height:1.6; text-align:center;">Your seats have been reserved. Present the digital passes at the gates.</p>

                        <div style="background-color:#FDF5F6; border:1px solid #E5D5D8; border-radius:12px; padding:30px; margin:0 0 30px 0;">
                          <p style="margin:0 0 8px 0; font-family:Arial, sans-serif; font-size:12px; font-weight:bold; color:#8B1C31; letter-spacing:1px; text-transform:uppercase;">Admit ${tix.length} Person(s)</p>
                          <h2 style="margin:0 0 20px 0; font-family:Georgia, serif; font-size:28px; color:#1A1A1A;">${productionTitle}</h2>
                          
                          <div style="border-top:1px dashed #D4C4C7; margin:20px 0;"></div>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, sans-serif; font-size:14px; color:#1A1A1A; line-height:1.6;">
                            <tr><td width="100" style="padding-bottom:12px; color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Event Date</td><td style="padding-bottom:12px; text-align:right; font-weight:bold;">${showDateFormatted}</td></tr>
                            <tr><td style="padding-bottom:12px; color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Venue</td><td style="padding-bottom:12px; text-align:right; font-weight:bold;">${venue}</td></tr>
                            <tr><td style="color:#555555; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Total Paid</td><td style="text-align:right; font-weight:bold;">₦${amount.toLocaleString()}</td></tr>
                          </table>
                          
                          <div style="border-top:1px dashed #D4C4C7; margin:20px 0;"></div>
                          
                          <p style="margin:0 0 15px 0; font-family:Arial, sans-serif; font-size:13px; font-weight:bold; color:#1A1A1A; letter-spacing:0.5px;">ADMISSIONS GATE PASSES:</p>
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, sans-serif; font-size:15px; color:#1A1A1A;">
                            ${ticketRows}
                          </table>
                        </div>

                        <p style="margin:0 0 20px 0; font-family:Arial, sans-serif; font-size:15px; color:#555555; line-height:1.6; text-align:center;">Don't forget to mark your calendar! The play is scheduled to take place at <strong>${venue}</strong> on <strong>${showDateFormatted}</strong>. We recommend arriving 30 minutes before the curtains rise.</p>

                        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:40px;">
                          <tr>
                            <td align="center">
                              <a href="https://curtaincall.com.ng/profile" style="display:inline-block; background-color:#8B1C31; color:#FFFFFF; font-family:Arial, sans-serif; font-size:16px; font-weight:bold; text-decoration:none; padding:16px 40px; border-radius:4px;">View Your Tickets</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:30px; border-top:1px solid #8B1C31;">
                        <p style="margin:0 0 12px 0; font-family:Georgia, serif; font-size:14px; color:#555555; font-style:italic;">Documenting Nigerian Theatre and its Creators.</p>
                        <p style="margin:0; font-family:Arial, sans-serif; font-size:12px; color:#888888;">
                          <a href="https://curtaincall.com.ng" style="color:#888888; text-decoration:underline;">curtaincall.com.ng</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        try {
          const origin = req.url.split('/api/')[0];
          await fetch(`${origin}/api/send-email`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-admin-secret': process.env.ADMIN_SECRET || process.env.CRON_SECRET || ''
            },
            body: JSON.stringify({ to: recipientEmail, subject, html: htmlContent })
          });
          console.log(`[Paystack Webhook] Admission email sent to ${recipientEmail}`);

          // Also notify the producer/creator of the ticket sale
          if (producerEmail) {
            const prodTiersStr = tix.map(t => t.tier).join(', ');
            const prodSubject = `Ticket Purchased: ${productionTitle} 🎭`;
            const prodHtml = getProducerNotificationHtml(productionTitle, recipientEmail, tix.length, prodTiersStr, amount);
            
            await fetch(`${origin}/api/send-email`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-admin-secret': process.env.ADMIN_SECRET || process.env.CRON_SECRET || ''
              },
              body: JSON.stringify({ to: producerEmail, subject: prodSubject, html: prodHtml })
            });
            console.log(`[Paystack Webhook] Producer sale notification email sent to ${producerEmail}`);
          }
        } catch (mailErr) {
          console.error('[Paystack Webhook] Failed to send confirmation emails:', mailErr);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('✗ Paystack Webhook processing failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
