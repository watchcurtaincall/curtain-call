const fs = require('fs');

const code = `
'use client';

import React, { useState, useEffect } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Ticket as TicketIcon, Mail, CheckCircle2, QrCode, Calendar, MapPin, Clock, Info, Loader2, Plus, Minus, CreditCard, Users, UserCircle, ChevronRight, Check } from 'lucide-react';
import { PaystackButton } from '@/components/payments/PaystackButton';
import { useAuth } from '@/lib/AuthContext';

function generateQRCodeSVG(text: string) {
  // ... (Keep existing implementation)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const size = 15;
  const cells = Array(size).fill(null).map(() => Array(size).fill(false));
  const drawFinder = (x: number, y: number) => {
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        const isBorder = dx === 0 || dx === 4 || dy === 0 || dy === 4;
        const isCenter = dx >= 2 && dx <= 2 && dy >= 2 && dy <= 2;
        cells[y + dy][x + dx] = isBorder || isCenter;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(10, 0);
  drawFinder(0, 10);
  let hashIndex = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inTopLeft = x < 6 && y < 6;
      const inTopRight = x > 8 && y < 6;
      const inBottomLeft = x < 6 && y > 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      const bit = (Math.abs(hash) >> (hashIndex % 24)) & 1;
      cells[y][x] = bit === 1;
      hashIndex++;
    }
  }
  const rects = [];
  const cellSize = 10;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y][x]) {
        rects.push(
          <rect key={\`\${x}-\${y}\`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill="black" />
        );
      }
    }
  }
  return (
    <svg viewBox={\`0 0 \${size * cellSize} \${size * cellSize}\`} className="w-16 h-16 bg-white p-1 rounded-lg shadow-md shrink-0">
      {rects}
    </svg>
  );
}

function generateBarcodeSVG(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const barsCount = 38;
  const bars = [];
  let currentX = 0;
  for (let i = 0; i < barsCount; i++) {
    const bit = (Math.abs(hash) >> (i % 24)) & 3;
    const barWidth = bit === 0 ? 1 : bit === 1 ? 2 : bit === 2 ? 3 : 1.5;
    const isGap = i % 2 === 1;
    if (!isGap) {
      bars.push(<rect key={i} x={currentX} y={0} width={barWidth} height={30} fill="currentColor" />);
    }
    currentX += barWidth + (isGap ? 1.5 : 1);
  }
  return (
    <svg viewBox={\`0 0 \${currentX} 30\`} className="w-full h-7 text-zinc-700/60 print:text-black">
      {bars}
    </svg>
  );
}

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Checkout State
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Contact State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [sendToOthers, setSendToOthers] = useState(false);
  const [attendees, setAttendees] = useState<Record<string, {name: string; email: string}>>({});
  
  const [successData, setSuccessData] = useState<{
    reference: string;
    totalPaid: number;
    tickets: { reference: string; gatePass: string; tier: string; email: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (user.email && !buyerEmail) {
        setBuyerEmail(user.email);
        setConfirmEmail(user.email);
      }
      if (user.displayName && !firstName) {
        const parts = user.displayName.split(' ');
        setFirstName(parts[0] || '');
        if (parts.length > 1) setLastName(parts.slice(1).join(' '));
      }
    }
  }, [user, buyerEmail, firstName]);

  useEffect(() => {
    params.then(resolved => {
      const tickets = ClientDB.getTickets();
      const matchedTicket = tickets.find(t => 
        t.id === resolved.id || 
        t.reference?.toLowerCase() === resolved.id.toLowerCase() || 
        t.gatePass?.toLowerCase() === resolved.id.toLowerCase()
      );

      if (matchedTicket) {
        const prod = ClientDB.getProductionById(matchedTicket.productionId) || {
          id: matchedTicket.productionId,
          title: matchedTicket.productionTitle || 'Curtain Call Event',
          venue: 'Broad Street Stage Venue',
          showDate: matchedTicket.date || 'Scheduled Date',
          showTime: '7:00 PM',
          status: 'Currently Showing',
          ticketTiers: [{ name: matchedTicket.tier, price: matchedTicket.price || 5000, capacity: '100' }]
        } as Production;

        setProduction(prod);
        setSuccessData({
          reference: matchedTicket.reference,
          totalPaid: matchedTicket.price || 0,
          tickets: [{ reference: matchedTicket.reference, gatePass: matchedTicket.gatePass, tier: matchedTicket.tier, email: matchedTicket.buyerEmail || '', name: 'Guest' }]
        });
        setLoading(false);
        return;
      }

      const fetched = ClientDB.getProductionById(resolved.id);
      if (fetched) {
        if (fetched.externalTicketUrl) {
          window.location.replace(fetched.externalTicketUrl);
          return;
        }
        setProduction(fetched);
      }
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs">
        <span className="animate-pulse flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading checkout gateway...</span>
      </div>
    );
  }

  if (!production) {
    notFound();
  }

  const tiersToUse = (production?.ticketTiers && production.ticketTiers.length > 0)
    ? production.ticketTiers.map(t => ({ name: t.name, price: Number(t.price) || 0, description: t.description || '', capacity: Number(t.capacity) || 0 }))
    : [
        { name: 'General Admission', price: 5000, description: 'Standard entry pass', capacity: 100 },
        { name: 'VIP Pass', price: 15000, description: 'Front row seating with complimentary drinks', capacity: 50 },
        { name: 'VVIP Premium Cabin', price: 40000, description: 'Access to backstage, premium lounge, and valet', capacity: 20 },
      ];

  // Cart Logic
  const handleQuantityChange = (tierName: string, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      const current = next[tierName] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) delete next[tierName];
      else next[tierName] = updated;
      return next;
    });
  };

  const totalTickets = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = Object.entries(cart).reduce((sum, [tierName, qty]) => {
    const tier = tiersToUse.find(t => t.name === tierName);
    return sum + ((tier?.price || 0) * qty);
  }, 0);

  const canProceedToPayment = () => {
    return firstName.trim() !== '' && 
           lastName.trim() !== '' && 
           buyerEmail.trim() !== '' && 
           buyerEmail === confirmEmail && 
           buyerPhone.trim() !== '' &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail);
  };

  const handlePaymentSuccess = async (reference: string) => {
    const purchasedTickets: { reference: string; gatePass: string; tier: string; email: string; name: string }[] = [];

    try {
      if (buyerEmail) {
        ClientDB.saveProfile({
          email: buyerEmail.toLowerCase(),
          name: \`\${firstName} \${lastName}\`.trim() || buyerEmail.split('@')[0],
          joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isVerified: true
        });
      }
    } catch (e) {}

    let globalTicketIndex = 1;

    Object.entries(cart).forEach(([tierName, qty]) => {
      const tierDef = tiersToUse.find(t => t.name === tierName);
      if (!tierDef) return;

      for (let i = 0; i < qty; i++) {
        let recipientEmail = buyerEmail;
        let recipientName = \`\${firstName} \${lastName}\`.trim();

        if (sendToOthers) {
          const attendeeKey = \`\${tierName}-\${i}\`;
          const attendeeInfo = attendees[attendeeKey] || {};
          if (attendeeInfo.email && attendeeInfo.email.trim() !== '') recipientEmail = attendeeInfo.email;
          if (attendeeInfo.name && attendeeInfo.name.trim() !== '') recipientName = attendeeInfo.name;
        }

        const ticketRef = totalTickets > 1 ? \`\${reference}-\${globalTicketIndex}\` : reference;
        const randDigits = Math.floor(100 + Math.random() * 900);
        const gatePass = \`CC-\${randDigits}\`;
        
        purchasedTickets.push({ 
           reference: ticketRef, 
           gatePass, 
           tier: tierName, 
           email: recipientEmail, 
           name: recipientName 
        });

        if (production) {
          ClientDB.purchaseTicket({
            productionId: production.id,
            productionTitle: production.title,
            buyerEmail: recipientEmail,
            tier: tierName,
            price: tierDef.price,
            reference: ticketRef,
            gatePass
          });
        }
        globalTicketIndex++;
      }
    });

    setSuccessData({
      reference,
      totalPaid: totalAmount,
      tickets: purchasedTickets
    });

    const ticketsByEmail = purchasedTickets.reduce((acc, t) => {
      if (!acc[t.email]) acc[t.email] = [];
      acc[t.email].push(t);
      return acc;
    }, {} as Record<string, typeof purchasedTickets>);

    const showDateFormatted = production?.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Scheduled Date';

    for (const [recipientEmail, tix] of Object.entries(ticketsByEmail)) {
      const subject = \`Your Curtain Call Admission Pass: \${production?.title || 'Event Ticket'}\`;
      
      const ticketRows = tix.map((t, idx) => \`
        <tr style="border-top: 1px dashed rgba(255,255,255,0.08);">
          <td style="padding: 12px 0; font-size: 13px; color: #a1a1aa;">Pass #\${idx + 1} (\${t.tier})</td>
          <td style="padding: 12px 0; font-size: 13px; color: #22c55e; text-align: right; font-weight: bold;">\${t.gatePass}</td>
        </tr>
      \`).join('');

      const htmlContent = \`
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
              <span style="font-size: 9px; color: #dc2626; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Admit \${tix.length} Person\${tix.length > 1 ? 's' : ''}</span>
              <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 4px 0 0; font-family: Georgia, serif;">\${production?.title}</h2>
            </div>
            
            <div style="border-top: 1px dashed #27272a; margin: 20px 0;"></div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Event Date</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">\${showDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Venue</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">\${production?.venue}</td>
              </tr>
            </table>

            <div style="border-top: 1px dashed #27272a; margin: 20px 0;"></div>
            <h3 style="font-size: 12px; color: #ffffff; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; font-family: Georgia, serif;">Admissions Gate Passes:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              \${ticketRows}
            </table>
          </div>

          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 25px;">
            Don't forget to mark your calendar! The event is scheduled to take place at <strong>\${production?.venue}</strong> on <strong>\${showDateFormatted}</strong>. We recommend arriving early.
          </p>
        </div>
      \`;

      try {
        await ClientDB.sendEmail(recipientEmail, subject, htmlContent);
      } catch (err) {}
    }
  };

  const isTheatre = !production?.eventType || production?.eventType === 'Theatre';

  return (
    <div className="min-h-screen relative bg-zinc-950 overflow-x-hidden pb-32 lg:pb-0">
      <div 
        className="fixed inset-0 bg-cover bg-center z-0 opacity-20 mix-blend-luminosity transform scale-105 pointer-events-none" 
        style={{ backgroundImage: \`url(\${production?.posterUrl || ''})\` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/80 z-0 pointer-events-none" />
      <div className="fixed inset-0 backdrop-blur-3xl z-0 pointer-events-none" />

      {successData ? (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-20">
          <div className="max-w-xl w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_80px_rgba(34,197,94,0.15)] overflow-hidden animate-fade-up print-wrapper">
            <style>{\`
              @media print {
                body { background: white !important; color: black !important; }
                body > div:not(.print-wrapper), body > header, body > footer, .no-print { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
                .print-wrapper { background: white !important; color: black !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 auto !important; max-width: 100% !important; width: 100% !important; }
                .print-ticket-container { max-height: none !important; overflow: visible !important; display: block !important; padding: 0 !important; }
                .print-ticket-card { background: white !important; color: black !important; border: 2px solid black !important; box-shadow: none !important; margin-bottom: 30px !important; page-break-inside: avoid !important; border-radius: 16px !important; display: flex !important; flex-direction: row !important; align-items: stretch !important; justify-content: space-between !important; padding: 20px !important; width: 100% !important; min-height: 180px !important; }
                .print-ticket-card * { color: black !important; }
                .print-dashed-line { border-color: black !important; border-style: dashed !important; }
                .print-stub-section { background: white !important; border: none !important; border-left: 2px dashed black !important; border-radius: 0 !important; padding: 0 0 0 20px !important; margin: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; width: 140px !important; }
              }
            \`}</style>
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400 no-print" />
            
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5 no-print shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
  
            <h1 className="text-2xl font-serif font-bold text-white mb-1 no-print">Tickets Secured!</h1>
            <p className="text-xs text-zinc-400 mb-8 no-print">
              Your \${successData.tickets.length} admission pass\${successData.tickets.length > 1 ? 'es have' : ' has'} been secured and sent via email.
            </p>
  
            <div className="flex flex-col gap-5 overflow-y-auto max-h-[500px] pr-1.5 [scrollbar-width:none] mb-8 print-ticket-container">
              {successData.tickets.map((t, index) => (
                <div key={index} className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 text-left relative overflow-hidden shrink-0 print-ticket-card flex flex-col md:flex-row gap-4 items-stretch justify-between shadow-2xl">
                  <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-green-500/10 rounded-full blur-2xl no-print" />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Pass #\${index + 1} of \${successData.tickets.length}</span>
                          <h3 className="text-lg font-serif font-bold text-white truncate">
                            {production.title}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-zinc-300 truncate flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500" /> {production.venue}
                      </div>
                      
                      <div className="mt-2 flex gap-2">
                        <span className={\`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border shadow-inner \${
                          isTheatre
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-red-500/10 text-red-300 border-red-500/20'
                        }\`}>
                          {production.customEventType || production.eventType || 'Theatre'}
                        </span>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs border-t border-dashed border-white/10 pt-3 print-dashed-line">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mb-0.5">Tier</span>
                        <span className="text-white font-bold">{t.tier}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mb-0.5">Attendee</span>
                        <span className="text-white font-bold truncate max-w-[100px] block">{t.name}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mb-0.5">Date</span>
                        <span className="text-white font-bold">
                          {production.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-1 no-print">
                      {generateBarcodeSVG(t.gatePass)}
                    </div>
                  </div>
  
                  <div className="md:w-40 flex md:flex-col items-center justify-between md:justify-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-white/5 md:border-l md:border-t-0 border-t print-stub-section shrink-0 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent no-print pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-center shrink-0 bg-white p-1 rounded-xl shadow-lg">
                      {generateQRCodeSVG(t.gatePass)}
                    </div>
                    
                    <div className="relative z-10 text-right md:text-center flex-1 md:flex-none">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Gate Code</span>
                      <span className="text-sm text-green-400 font-bold tracking-widest uppercase block mt-1">
                        {t.gatePass}
                      </span>
                      <span className="text-[8px] text-zinc-600 block truncate max-w-[120px] mx-auto mt-1">Ref: {t.reference}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
  
            <p className="text-[10px] text-zinc-500 leading-relaxed mb-6 no-print">
              PRESENT THESE DIGITAL PASSES OR PRINTED TICKETS AT THE GATE FOR SCANNED ADMISSION.
            </p>
  
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center no-print mt-4">
              <button
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <QrCode className="h-4 w-4" /> Print / Save PDF
              </button>
              <Link
                href={isTheatre ? \`/productions/\${production.slug || production.id}\` : \`/events/\${production.slug || production.id}\`}
                className="flex-1 bg-white text-black font-bold py-4 px-6 rounded-2xl hover:bg-zinc-100 transition-all text-sm shadow-xl text-center flex items-center justify-center"
              >
                Back to Details
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-start animate-fade-up pt-12 lg:pt-20 px-4">
          
          {/* Left Column: Event Context & Multistep Form */}
          <div className="flex-1 w-full flex flex-col gap-6">
            <Link
              href={isTheatre ? \`/productions/\${production.slug || production.id}\` : \`/events/\${production.slug || production.id}\`}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-bold w-fit bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Event
            </Link>

            {/* Title / Info Mobile Header */}
            <div className="flex items-center gap-4 lg:hidden">
              <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                <img src={production.posterUrl || ''} className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border border-white/10 bg-white/5 w-fit block mb-1">
                  {production.customEventType || production.eventType || 'Theatre'}
                </span>
                <h1 className="text-xl font-serif font-bold text-white leading-tight">{production.title}</h1>
              </div>
            </div>

            {/* Stepper Content Box */}
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden relative">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] shrink-0">
                    {checkoutStep === 1 && <TicketIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                    {checkoutStep === 2 && <Users className="h-5 w-5 sm:h-6 sm:w-6" />}
                    {checkoutStep === 3 && <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {checkoutStep === 1 && 'Choose Tickets'}
                      {checkoutStep === 2 && 'Contact Info'}
                      {checkoutStep === 3 && 'Payment'}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 hidden sm:block">
                      {checkoutStep === 1 && 'Select your preferred entry pass.'}
                      {checkoutStep === 2 && 'Enter buyer details.'}
                      {checkoutStep === 3 && 'Securely pay for your order.'}
                    </p>
                  </div>
                </div>
                {checkoutStep > 1 && (
                  <button 
                    onClick={() => setCheckoutStep(s => (s - 1) as 1 | 2 | 3)}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
                  >
                    Go Back
                  </button>
                )}
              </div>

              {/* STEP 1: CHOOSE TICKETS */}
              {checkoutStep === 1 && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {tiersToUse.map(tier => {
                    const qty = cart[tier.name] || 0;
                    return (
                      <div
                        key={tier.name}
                        className={\`relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 \${
                          qty > 0
                            ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                            : 'bg-zinc-950/40 border-white/5 hover:border-white/10'
                        }\`}
                      >
                        <div className="relative z-10 flex-1">
                          <h3 className="font-bold text-base text-white">
                            {tier.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold tracking-tight text-white">
                              ₦{tier.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded-full">includes fees</span>
                          </div>
                          {tier.description && (
                            <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                              {tier.description}
                            </p>
                          )}
                        </div>

                        <div className="relative z-10 flex items-center justify-between sm:justify-end gap-4 sm:min-w-[120px]">
                           <span className="text-xs text-zinc-500 font-bold sm:hidden">Quantity</span>
                           <div className="flex items-center bg-zinc-950 rounded-xl border border-white/10 p-1 shrink-0">
                             <button 
                               onClick={() => handleQuantityChange(tier.name, -1)}
                               disabled={qty === 0}
                               className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                             >
                               <Minus className="h-4 w-4 text-white" />
                             </button>
                             <div className="w-10 text-center font-bold text-white tabular-nums text-lg">
                               {qty}
                             </div>
                             <button 
                               onClick={() => handleQuantityChange(tier.name, 1)}
                               className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
                             >
                               <Plus className="h-4 w-4 text-white" />
                             </button>
                           </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Desktop 'Continue' Button - Hidden on mobile because of fixed bottom bar */}
                  <div className="mt-6 border-t border-white/5 pt-6 hidden lg:flex justify-end">
                    <button
                      disabled={totalTickets === 0}
                      onClick={() => setCheckoutStep(2)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)] disabled:opacity-40 disabled:hover:bg-red-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONTACT & ATTENDEES */}
              {checkoutStep === 2 && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  {/* Primary Buyer Details */}
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">First Name</label>
                        <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Last Name</label>
                        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Email Address</label>
                      <input type="email" required value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="jane@example.com" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Confirm Email</label>
                      <input type="email" required value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="jane@example.com" className={\`w-full bg-zinc-950 border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all \${confirmEmail && confirmEmail !== buyerEmail ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'}\`} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Phone Number</label>
                      <input type="tel" required value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="08012345678" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                  </div>

                  {/* Ask to Assign Attendees */}
                  {totalTickets > 1 && (
                    <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:bg-zinc-950/80 transition-colors" onClick={() => setSendToOthers(!sendToOthers)}>
                      <div className={\`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors border \${sendToOthers ? 'bg-red-500 border-red-500' : 'bg-transparent border-zinc-600'}\`}>
                        {sendToOthers && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">Send tickets to different emails?</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">If you are buying for a group, check this box to assign unique names and emails to each ticket. Otherwise, all tickets will be sent to your email.</p>
                      </div>
                    </div>
                  )}

                  {/* Individual Attendees Breakdown */}
                  {sendToOthers && totalTickets > 1 && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-4">
                        {Object.entries(cart).flatMap(([tierName, qty]) => 
                          Array.from({ length: qty }).map((_, idx) => {
                            const key = \`\${tierName}-\${idx}\`;
                            const att = attendees[key] || { name: '', email: '' };
                            
                            return (
                              <div key={key} className="bg-zinc-950/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-600/50" />
                                <div className="flex items-center gap-2 mb-4">
                                  <UserCircle className="h-5 w-5 text-zinc-500" />
                                  <h4 className="font-bold text-sm text-white">{tierName}</h4>
                                  <span className="text-[10px] text-zinc-500 font-mono tracking-widest ml-auto">TICKET {idx + 1}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <input
                                    type="text"
                                    placeholder="Attendee Name (Optional)"
                                    value={att.name}
                                    onChange={e => setAttendees(prev => ({...prev, [key]: {...prev[key], name: e.target.value}}))}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                                  />
                                  <input
                                    type="email"
                                    placeholder="Attendee Email (Optional)"
                                    value={att.email}
                                    onChange={e => setAttendees(prev => ({...prev, [key]: {...prev[key], email: e.target.value}}))}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Desktop 'Continue' Button */}
                  <div className="mt-2 border-t border-white/5 pt-6 hidden lg:flex justify-end">
                    <button
                      disabled={!canProceedToPayment()}
                      onClick={() => setCheckoutStep(3)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)] disabled:opacity-40 disabled:hover:bg-red-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SECURE PAYMENT */}
              {checkoutStep === 3 && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Ready to complete your order</h3>
                      <p className="text-sm text-zinc-400">You will be securely redirected to Paystack to complete your ₦{totalAmount.toLocaleString()} purchase.</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Delivery Email</span>
                      <span className="text-sm text-white font-medium">{buyerEmail}</span>
                    </div>
                    <div className="border-t border-dashed border-white/10 my-4" />
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Total Tickets</span>
                      <span className="text-sm text-white font-medium">{totalTickets}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <PaystackButton
                      productionTitle={production.title}
                      productionId={production.id}
                      tierName="Multiple Tickets"
                      priceNGN={totalAmount}
                      userEmail={buyerEmail}
                      disabled={false}
                      onSuccess={handlePaymentSuccess}
                      className="w-full bg-white text-black font-bold py-5 px-8 rounded-xl hover:bg-zinc-100 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                    />
                    <div className="flex items-center justify-center gap-1.5 mt-4 opacity-60">
                       <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22S2 16.5 2 10V5L12 2L22 5V10C22 16.5 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                       <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Secured Checkout by Paystack</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary (Desktop Only) */}
          <div className="hidden lg:block w-[350px] xl:w-[400px] shrink-0 sticky top-24 pt-11">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-serif font-bold text-white mb-6 border-b border-white/5 pb-4">Summary</h3>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  <img src={production.posterUrl || ''} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border border-white/10 bg-white/5 w-fit">
                    {production.customEventType || production.eventType || 'Theatre'}
                  </span>
                  <h4 className="font-bold text-white text-sm truncate">{production.title}</h4>
                  <div className="text-[10px] text-zinc-400 mt-1 flex flex-col gap-0.5">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {production.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {production.showTime || 'TBA'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5 mb-6">                
                {totalTickets === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-2">Select tickets to see summary.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {Object.entries(cart).map(([tierName, qty]) => {
                      const tier = tiersToUse.find(t => t.name === tierName);
                      if (!tier || qty === 0) return null;
                      return (
                        <div key={tierName} className="flex justify-between items-start text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-300 font-medium">{qty} × {tierName}</span>
                          </div>
                          <span className="text-white font-bold">₦{(tier.price * qty).toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-white/10 pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-zinc-300 font-bold">₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 flex items-center gap-1">Fees <Info className="h-3 w-3" /></span>
                  <span className="text-zinc-300">Included</span>
                </div>
              </div>

              <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-end">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total</span>
                <span className="text-2xl font-bold text-red-500 tracking-tight">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sticky Mobile Bottom Bar */}
          {checkoutStep < 3 && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-full duration-300">
               <button
                 disabled={checkoutStep === 1 ? totalTickets === 0 : !canProceedToPayment()}
                 onClick={() => setCheckoutStep(s => (s + 1) as 2 | 3)}
                 className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:bg-red-600 text-white rounded-2xl py-3.5 px-6 flex justify-between items-center transition-all disabled:cursor-not-allowed shadow-xl"
               >
                  <span className="text-xl font-bold tracking-tight">₦{totalAmount.toLocaleString()}</span>
                  <span className="bg-white text-red-600 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1">
                    Continue
                  </span>
               </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
`
fs.writeFileSync('/Users/mac/.gemini/antigravity/scratch/curtain-call/src/app/tickets/[id]/page.tsx', code);
