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
      const metadata = data.metadata || {};

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

      if (supabaseServer && productionId) {
        const { data: prodData } = await supabaseServer
          .from('productions')
          .select('venue, show_date')
          .eq('id', productionId)
          .maybeSingle();

        if (prodData) {
          venue = prodData.venue || venue;
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
          <tr style="border-top: 1px dashed rgba(255,255,255,0.08);">
            <td style="padding: 12px 0; font-size: 13px; color: #a1a1aa;">Pass #${idx + 1} (${t.tier})</td>
            <td style="padding: 12px 0; font-size: 13px; color: #22c55e; text-align: right; font-weight: bold;">${t.gate_pass}</td>
          </tr>
        `).join('');

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Curtain Call Admission Pass</span>
              <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 0;"></div>
            </div>
            
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 20px;">
              Your seats have been reserved. Present the digital passes at the gates.
            </p>
            
            <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 25px; margin: 30px 0;">
              <div style="margin-bottom: 20px;">
                <span style="font-size: 9px; color: #dc2626; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Admit ${tix.length} Person${tix.length > 1 ? 's' : ''}</span>
                <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 4px 0 0; font-family: Georgia, serif;">${productionTitle}</h2>
              </div>
              
              <div style="border-top: 1px dashed #27272a; margin: 20px 0;"></div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Event Date</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${showDateFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Venue</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${venue}</td>
                </tr>
              </table>

              <div style="border-top: 1px dashed #27272a; margin: 20px 0;"></div>
              <h3 style="font-size: 12px; color: #ffffff; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; font-family: Georgia, serif;">Admissions Gate Passes:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${ticketRows}
              </table>
            </div>

            <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 25px;">
              Don't forget to mark your calendar! The event is scheduled to take place at <strong>${venue}</strong> on <strong>${showDateFormatted}</strong>. We recommend arriving early.
            </p>
          </div>
        `;

        try {
          const origin = req.url.split('/api/')[0];
          await fetch(`${origin}/api/send-email`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-admin-secret': process.env.ADMIN_SECRET || ''
            },
            body: JSON.stringify({ to: recipientEmail, subject, html: htmlContent })
          });
          console.log(`[Paystack Webhook] Admission email sent to ${recipientEmail}`);
        } catch (mailErr) {
          console.error('[Paystack Webhook] Failed to send confirmation email:', mailErr);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('✗ Paystack Webhook processing failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
