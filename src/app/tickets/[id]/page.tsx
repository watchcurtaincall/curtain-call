'use client';

import React, { useState, useEffect } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Ticket as TicketIcon, Mail, CheckCircle2, QrCode } from 'lucide-react';
import { PaystackButton } from '@/components/payments/PaystackButton';
import { useAuth } from '@/lib/AuthContext';

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState({ name: 'General Admission', price: 5000 });
  const [quantity, setQuantity] = useState(1);
  const [successData, setSuccessData] = useState<{
    reference: string;
    tier: string;
    quantity: number;
    tickets: { reference: string; gatePass: string }[];
  } | null>(null);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  useEffect(() => {
    params.then(resolved => {
      const fetched = ClientDB.getProductionById(resolved.id);
      if (fetched) {
        setProduction(fetched);
        if (fetched.ticketTiers && fetched.ticketTiers.length > 0) {
          const firstTier = fetched.ticketTiers[0];
          setSelectedTier({ name: firstTier.name, price: Number(firstTier.price) || 0 });
        }
      }
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono text-xs">
        <span className="animate-pulse">Loading secure checkout gateway...</span>
      </div>
    );
  }

  if (!production) {
    notFound();
  }

  const tiersToUse = (production?.ticketTiers && production.ticketTiers.length > 0)
    ? production.ticketTiers.map(t => ({ name: t.name, price: Number(t.price) || 0 }))
    : [
        { name: 'General Admission', price: 5000 },
        { name: 'VIP Pass', price: 15000 },
        { name: 'VVIP Premium Cabin', price: 40000 },
      ];

  const handlePaymentSuccess = async (reference: string) => {
    const recipient = email || 'guest@curtaincall.ng';
    const purchasedTickets: { reference: string; gatePass: string }[] = [];

    // Auto-record buyer in the admin directory (profiles & newsletter subscribers)
    try {
      ClientDB.saveProfile({
        email: recipient.toLowerCase(),
        name: recipient.split('@')[0],
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        isVerified: true
      });
      ClientDB.subscribeToNewsletter(recipient);
    } catch (e) {
      console.error('[Capture Buyer] Failed to save guest details:', e);
    }

    for (let i = 0; i < quantity; i++) {
      const ticketRef = quantity > 1 ? `${reference}-${i + 1}` : reference;
      const gatePass = `CC-${ticketRef.substring(0, 6).toUpperCase()}`;
      purchasedTickets.push({ reference: ticketRef, gatePass });

      if (production) {
        ClientDB.purchaseTicket({
          productionId: production.id,
          productionTitle: production.title,
          buyerEmail: recipient,
          tier: selectedTier.name,
          price: selectedTier.price,
          reference: ticketRef,
          gatePass
        });
      }
    }

    setSuccessData({
      reference,
      tier: selectedTier.name,
      quantity,
      tickets: purchasedTickets
    });

    // Send Ticket Email via Resend
    const subject = `Your Curtain Call Admission Pass: ${production?.title || 'Theatre Ticket'}`;
    const showDateFormatted = production?.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Scheduled Date';

    const ticketRows = purchasedTickets.map((t, idx) => `
      <tr style="border-top: 1px dashed rgba(255,255,255,0.08);">
        <td style="padding: 12px 0; font-size: 13px; color: #a1a1aa;">Pass #${idx + 1} (${selectedTier.name})</td>
        <td style="padding: 12px 0; font-size: 13px; color: #22c55e; text-align: right; font-weight: bold; font-family: monospace;">${t.gatePass}</td>
      </tr>
    `).join('');

    const downloadUrl = typeof window !== 'undefined' ? `${window.location.origin}/tickets/${production?.id}?ref=${reference}` : '';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Curtain Call Admission Pass</span>
          <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 0;"></div>
        </div>
        
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 20px;">
          Your seats have been reserved. Present the digital passes at the gates.
        </p>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${downloadUrl}" style="background-color: #ffffff; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 13px; display: inline-block; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">📥 Download PDF Ticket Pass</a>
        </div>
        
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 25px; margin: 30px 0;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 9px; color: #dc2626; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Admit ${quantity} Person${quantity > 1 ? 's' : ''}</span>
            <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 4px 0 0; font-family: Georgia, serif;">${production?.title}</h2>
          </div>
          
          <div style="border-top: 1px dashed #27272a; margin: 20px 0;"></div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Event Date</td>
              <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${showDateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Venue</td>
              <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${production?.venue}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Total Paid</td>
              <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold; font-family: monospace; font-size: 13px;">₦${(selectedTier.price * quantity).toLocaleString()}</td>
            </tr>
          </table>

          <div style="border-top: 1px dashed #27272a; margin: 20px 0;"></div>
          <h3 style="font-size: 12px; color: #ffffff; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; font-family: Georgia, serif;">Admissions Gate Passes:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${ticketRows}
          </table>
        </div>

        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 25px;">
          Don't forget to mark your calendar! The play is scheduled to take place at <strong>${production?.venue}</strong> on <strong>${showDateFormatted}</strong>. We recommend arriving 30 minutes before the curtains rise.
        </p>
        
        <p style="font-size: 11px; color: #71717a; text-align: center; font-family: monospace; line-height: 1.5; margin: 0;">
          CURTAIN CALL DIGITAL TICKETING AGENT · POWERED BY RESEND
        </p>
      </div>
    `;

    try {
      await ClientDB.sendEmail(recipient, subject, htmlContent);
      console.log('✓ Secure Ticket Confirmation email sent to:', recipient);
    } catch (err) {
      console.error('✗ Failed to dispatch ticket confirmation mail:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen container mx-auto px-4 py-16 items-center justify-center bg-zinc-950">
      {successData ? (
        /* ── GORGEOUS PREMIUM SUCCESS RECEIPT PASS ── */
        <div className="max-w-md w-full bg-zinc-900 border-2 border-green-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-fade-up print-wrapper">
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              /* Hide all other layout and navigation elements */
              body > div:not(.print-wrapper),
              body > header,
              body > footer,
              .no-print {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              /* Isolate tickets printable card container */
              .print-wrapper {
                background: white !important;
                color: black !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 auto !important;
                max-width: 100% !important;
                width: 100% !important;
              }
              .print-ticket-card {
                background: white !important;
                color: black !important;
                border: 2px solid black !important;
                box-shadow: none !important;
                margin-bottom: 25px !important;
                page-break-inside: avoid !important;
                border-radius: 16px !important;
              }
              .print-ticket-card * {
                color: black !important;
              }
              .print-dashed-line {
                border-color: black !important;
                border-style: dashed !important;
              }
            }
          `}</style>
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-500 no-print" />
          
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6 no-print">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>

          <h1 className="text-2xl font-serif font-bold text-white mb-1 no-print">
            Ticket Confirmed!
          </h1>
          <p className="text-xs text-zinc-500 mb-6 no-print">
            Your {successData.quantity} admission pass{successData.quantity > 1 ? 'es have' : ' has'} been secured and sent to <span className="text-zinc-300 font-semibold">{email || 'guest@curtaincall.ng'}</span>.
          </p>

          {/* Stacks of Admission Passes UI */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[380px] pr-2 [scrollbar-width:none] mb-6">
            {successData.tickets.map((t, index) => (
              <div key={index} className="bg-zinc-950 border border-white/5 rounded-2xl p-5 text-left relative overflow-hidden shrink-0 print-ticket-card">
                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-green-500/5 rounded-full blur-xl no-print" />
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Pass #{index + 1} of {successData.quantity}</span>
                    <h3 className="text-sm font-serif font-bold text-white truncate max-w-[200px] mt-0.5">
                      {production.title}
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-green-400 bg-green-600/10 px-2 py-0.5 rounded border border-green-500/20 font-mono no-print">
                    ADMIT ONE
                  </span>
                </div>

                <div className="border-t border-dashed border-white/10 my-3 print-dashed-line" />

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Tier</span>
                    <span className="text-xs text-zinc-200 font-semibold">{successData.tier}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Event Date</span>
                    <span className="text-xs text-zinc-200 font-semibold">
                      {production.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Venue</span>
                    <span className="text-xs text-zinc-200 font-semibold truncate block" title={production.venue}>{production.venue}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Gate Pass / Ref</span>
                    <span className="text-xs text-green-400 font-mono font-bold flex items-center gap-1">
                      <QrCode className="h-3.5 w-3.5" /> {t.gatePass}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono block mt-0.5">Ref: {t.reference}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-zinc-500 leading-relaxed mb-6 font-mono no-print">
            PRESENT THESE DIGITAL PASSES OR REFERENCE CODES AT THE VENUE GATE.
          </p>

          <div className="flex flex-col gap-3 w-full no-print">
            <button
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <QrCode className="h-4 w-4 text-red-500" /> Print Passes / Save PDF
            </button>
            <Link
              href={`/productions/${production.slug || production.id}`}
              className="block w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors text-sm shadow-xl text-center"
            >
              Back to Show Details
            </Link>
          </div>
        </div>
      ) : (
        /* ── TICKET SELECTION & CHECKOUT FORM ── */
        <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-fade-up">
          <div className="absolute -top-12 -right-12 text-zinc-800/20 rotate-12 pointer-events-none">
            <TicketIcon className="w-40 h-40" />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            
            {/* Header */}
            <div>
              <div className="h-10 w-10 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-3 text-red-500">
                <TicketIcon className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-serif font-bold text-white">
                Secure Tickets
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Direct platform ticket agent for <strong className="text-white font-medium">{production.title}</strong>
              </p>
            </div>

             {/* Email Address Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email Address (For Ticket Delivery)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors ${
                  email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/5 focus:border-red-500'
                }`}
              />
              {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                <span className="text-[10px] text-red-500 font-mono">
                  ⚠ Please enter a valid email address.
                </span>
              )}
              {!email && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  ℹ Email address is required to unlock secure checkout.
                </span>
              )}
            </div>

            {/* Tier Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Select Ticket Tier
              </label>
              <div className="flex flex-col gap-2">
                {tiersToUse.map(tier => (
                  <div
                    key={tier.name}
                    onClick={() => setSelectedTier(tier)}
                    className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTier.name === tier.name
                        ? 'bg-red-500/10 border-red-500 text-white'
                        : 'bg-zinc-950/50 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">{tier.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Instant gate pass receipt</p>
                    </div>
                    <span className="text-sm font-bold font-mono">
                      ₦{tier.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Quantity (Max 10)
              </label>
              <select
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-white/5 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} ticket{i > 0 ? 's' : ''} — ₦{((i + 1) * selectedTier.price).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Paystack Checkout Button Container */}
            <div className="mt-2">
              <PaystackButton
                productionTitle={production.title}
                productionId={production.id}
                tierName={selectedTier.name}
                priceNGN={selectedTier.price * quantity}
                userEmail={email}
                disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                onSuccess={handlePaymentSuccess}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-[9px] text-center text-zinc-500 mt-2 font-mono uppercase">
                Secured via Paystack 3D Secure
              </p>
            </div>

            {/* Cancel/Back link */}
            <Link
              href={`/productions/${production.slug || production.id}`}
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1 mt-1 font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="h-3 w-3" /> Go Back
            </Link>

          </div>
        </div>
      )}

    </div>
  );
}
