'use client';

import React, { useState, useEffect } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Ticket as TicketIcon, Mail, CheckCircle2, QrCode, Calendar, MapPin, Clock, Info, Loader2 } from 'lucide-react';
import { PaystackButton } from '@/components/payments/PaystackButton';
import { useAuth } from '@/lib/AuthContext';

function generateQRCodeSVG(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const size = 15;
  const cells: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
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

  const rects: any[] = [];
  const cellSize = 10;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y][x]) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * cellSize}
            y={y * cellSize}
            width={cellSize}
            height={cellSize}
            fill="black"
          />
        );
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${size * cellSize} ${size * cellSize}`} className="w-16 h-16 bg-white p-1 rounded-lg shadow-md shrink-0">
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
  const bars: any[] = [];
  let currentX = 0;
  
  for (let i = 0; i < barsCount; i++) {
    const bit = (Math.abs(hash) >> (i % 24)) & 3;
    const barWidth = bit === 0 ? 1 : bit === 1 ? 2 : bit === 2 ? 3 : 1.5;
    const isGap = i % 2 === 1;
    
    if (!isGap) {
      bars.push(
        <rect
          key={i}
          x={currentX}
          y={0}
          width={barWidth}
          height={30}
          fill="currentColor"
        />
      );
    }
    currentX += barWidth + (isGap ? 1.5 : 1);
  }
  
  return (
    <svg viewBox={`0 0 ${currentX} 30`} className="w-full h-7 text-zinc-700/60 print:text-black">
      {bars}
    </svg>
  );
}

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState({ name: 'General Admission', price: 5000, description: '' });
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
          tier: matchedTicket.tier,
          quantity: 1,
          tickets: [{ reference: matchedTicket.reference, gatePass: matchedTicket.gatePass }]
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
        if (fetched.ticketTiers && fetched.ticketTiers.length > 0) {
          const firstTier = fetched.ticketTiers[0];
          setSelectedTier({ name: firstTier.name, price: Number(firstTier.price) || 0, description: firstTier.description || '' });
        }
      }
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono text-xs">
        <span className="animate-pulse flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading secure checkout gateway...</span>
      </div>
    );
  }

  if (!production) {
    notFound();
  }

  const tiersToUse = (production?.ticketTiers && production.ticketTiers.length > 0)
    ? production.ticketTiers.map(t => ({ name: t.name, price: Number(t.price) || 0, description: t.description || '' }))
    : [
        { name: 'General Admission', price: 5000, description: 'Standard entry pass' },
        { name: 'VIP Pass', price: 15000, description: 'Front row seating with complimentary drinks' },
        { name: 'VVIP Premium Cabin', price: 40000, description: 'Access to backstage, premium lounge, and valet' },
      ];

  const handlePaymentSuccess = async (reference: string) => {
    const recipient = email || 'guest@curtaincall.ng';
    const purchasedTickets: { reference: string; gatePass: string }[] = [];

    try {
      ClientDB.saveProfile({
        email: recipient.toLowerCase(),
        name: recipient.split('@')[0],
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        isVerified: true
      });
    } catch (e) {}

    for (let i = 0; i < quantity; i++) {
      const ticketRef = quantity > 1 ? `${reference}-${i + 1}` : reference;
      const randDigits = Math.floor(100 + Math.random() * 900);
      const gatePass = `CC-${randDigits}`;
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
    const subject = `Your Curtain Call Admission Pass: ${production?.title || 'Event Ticket'}`;
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
          Don't forget to mark your calendar! The event is scheduled to take place at <strong>${production?.venue}</strong> on <strong>${showDateFormatted}</strong>. We recommend arriving early.
        </p>
        
        <p style="font-size: 11px; color: #71717a; text-align: center; font-family: monospace; line-height: 1.5; margin: 0;">
          CURTAIN CALL DIGITAL TICKETING AGENT · POWERED BY RESEND
        </p>
      </div>
    `;

    try {
      await ClientDB.sendEmail(recipient, subject, htmlContent);
    } catch (err) {}
  };

  const isTheatre = !production?.eventType || production?.eventType === 'Theatre';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-20 bg-zinc-950 overflow-hidden">
      {/* Immersive Blurred Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-40 mix-blend-luminosity transform scale-105" 
        style={{ backgroundImage: `url(${production?.posterUrl || ''})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-zinc-950/60 z-0" />
      <div className="absolute inset-0 backdrop-blur-3xl z-0" />

      {successData ? (
        /* ── GORGEOUS PREMIUM SUCCESS RECEIPT PASS ── */
        <div className="relative z-10 max-w-xl w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_80px_rgba(34,197,94,0.15)] overflow-hidden animate-fade-up print-wrapper">
          <style>{`
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
          `}</style>
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400 no-print" />
          
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5 no-print shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
 
          <h1 className="text-2xl font-serif font-bold text-white mb-1 no-print">Tickets Secured!</h1>
          <p className="text-xs text-zinc-400 mb-8 no-print">
            Your {successData.quantity} admission pass{successData.quantity > 1 ? 'es have' : ' has'} been secured and sent to <span className="text-zinc-200 font-semibold">{email || 'guest@curtaincall.ng'}</span>.
          </p>
 
          <div className="flex flex-col gap-5 overflow-y-auto max-h-[500px] pr-1.5 [scrollbar-width:none] mb-8 print-ticket-container">
            {successData.tickets.map((t, index) => (
              <div key={index} className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 text-left relative overflow-hidden shrink-0 print-ticket-card flex flex-col md:flex-row gap-4 items-stretch justify-between shadow-2xl">
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-green-500/10 rounded-full blur-2xl no-print" />
                
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block mb-1">Pass #{index + 1} of {successData.quantity}</span>
                        <h3 className="text-lg font-serif font-bold text-white truncate">
                          {production.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-zinc-300 truncate flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" /> {production.venue}
                    </div>
                    
                    <div className="mt-2 flex gap-2">
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border shadow-inner ${
                         isTheatre
                           ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                           : 'bg-red-500/10 text-red-300 border-red-500/20'
                       }`}>
                         {production.customEventType || production.eventType || 'Theatre'}
                       </span>
                    </div>
                  </div>
 
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs border-t border-dashed border-white/10 pt-3 print-dashed-line">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block mb-0.5">Tier</span>
                      <span className="text-white font-bold">{successData.tier}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block mb-0.5">Date</span>
                      <span className="text-white font-bold">
                        {production.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Scheduled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block mb-0.5">Time</span>
                      <span className="text-white font-bold">{production.showTime || '7:00 PM'}</span>
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
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Gate Code</span>
                    <span className="text-sm text-green-400 font-mono font-bold tracking-widest uppercase block mt-1">
                      {t.gatePass}
                    </span>
                    <span className="text-[8px] text-zinc-600 font-mono block truncate max-w-[120px] mx-auto mt-1">Ref: {t.reference}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
 
          <p className="text-[10px] text-zinc-500 leading-relaxed mb-6 font-mono no-print">
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
              href={isTheatre ? `/productions/${production.slug || production.id}` : `/events/${production.slug || production.id}`}
              className="flex-1 bg-white text-black font-bold py-4 px-6 rounded-2xl hover:bg-zinc-100 transition-all text-sm shadow-xl text-center flex items-center justify-center"
            >
              Back to Details
            </Link>
          </div>
        </div>
      ) : (
        /* ── TWO COLUMN PREMIUM CHECKOUT UI ── */
        <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch animate-fade-up">
          
          {/* Left Column: Event Context */}
          <div className="flex-1 lg:max-w-[400px] flex flex-col">
            <Link
              href={isTheatre ? `/productions/${production.slug || production.id}` : `/events/${production.slug || production.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-bold mb-6 w-fit"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Event
            </Link>

            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex-1 shadow-2xl flex flex-col">
              <div className="h-48 sm:h-64 relative bg-zinc-800">
                <img src={production.posterUrl || ''} alt={production.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                   <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-widest border backdrop-blur-md ${
                     isTheatre
                       ? 'bg-purple-500/20 text-purple-100 border-purple-500/30'
                       : 'bg-red-500/20 text-red-100 border-red-500/30'
                   }`}>
                     {production.customEventType || production.eventType || 'Theatre'}
                   </span>
                   <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight drop-shadow-md">
                     {production.title}
                   </h2>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950/50 rounded-2xl p-4 border border-white/5">
                    <Calendar className="h-4 w-4 text-zinc-400 mb-2" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-0.5">Date</span>
                    <span className="text-sm text-white font-medium">
                      {production.showDate ? new Date(production.showDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                    </span>
                  </div>
                  <div className="bg-zinc-950/50 rounded-2xl p-4 border border-white/5">
                    <Clock className="h-4 w-4 text-zinc-400 mb-2" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-0.5">Time</span>
                    <span className="text-sm text-white font-medium">{production.showTime || 'TBA'}</span>
                  </div>
                </div>

                <div className="bg-zinc-950/50 rounded-2xl p-4 border border-white/5 flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-0.5">Location</span>
                    <span className="text-sm text-white font-medium leading-snug block">{production.venue}</span>
                    {production.city && <span className="text-xs text-zinc-400 block mt-0.5">{production.city}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Interactive Form */}
          <div className="flex-[1.5] bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                <TicketIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Select Tickets</h1>
                <p className="text-sm text-zinc-400 mt-0.5">Secure your entry pass instantly.</p>
              </div>
            </div>

            <div className="flex flex-col gap-8 flex-1">
              
              {/* Tiers List */}
              <div className="flex flex-col gap-3">
                {tiersToUse.map(tier => (
                  <div
                    key={tier.name}
                    onClick={() => setSelectedTier(tier)}
                    className={`relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                      selectedTier.name === tier.name
                        ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                        : 'bg-zinc-950/40 border-white/5 hover:border-white/15 hover:bg-zinc-950/80'
                    }`}
                  >
                    {/* Active Gradient Border Overlay */}
                    {selectedTier.name === tier.name && (
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedTier.name === tier.name ? 'border-red-500' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                          {selectedTier.name === tier.name && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                        </div>
                        <h3 className={`font-bold text-base transition-colors ${selectedTier.name === tier.name ? 'text-white' : 'text-zinc-300'}`}>
                          {tier.name}
                        </h3>
                      </div>
                      {tier.description && (
                        <p className="text-xs text-zinc-500 mt-2 pl-6 max-w-sm leading-relaxed flex items-start gap-1.5">
                          <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                          {tier.description}
                        </p>
                      )}
                    </div>

                    <div className="relative z-10 flex flex-col sm:items-end pl-6 sm:pl-0">
                      <span className={`text-xl font-bold font-mono tracking-tight transition-colors ${selectedTier.name === tier.name ? 'text-white' : 'text-zinc-400'}`}>
                        ₦{tier.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1 hidden sm:block">Per Ticket</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Purchase Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-auto pt-8 border-t border-white/5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Delivery Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Where should we send tickets?"
                    className={`w-full bg-zinc-950 border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner ${
                      email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-white/5 focus:border-white/20'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all shadow-inner cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Ticket{i > 0 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total & Checkout Action */}
              <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 mt-2">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Total Amount</span>
                  <div className="text-3xl font-bold text-white font-mono tracking-tight">
                    <span className="text-zinc-500 text-xl font-sans mr-1">₦</span>
                    {(selectedTier.price * quantity).toLocaleString()}
                  </div>
                </div>

                <div className="w-full sm:w-auto min-w-[200px]">
                  <PaystackButton
                    productionTitle={production.title}
                    productionId={production.id}
                    tierName={selectedTier.name}
                    priceNGN={selectedTier.price * quantity}
                    userEmail={email}
                    disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                    onSuccess={handlePaymentSuccess}
                    className="w-full bg-white text-black font-bold py-4 px-8 rounded-xl hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center justify-center gap-1.5 mt-3 opacity-60">
                     <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22S2 16.5 2 10V5L12 2L22 5V10C22 16.5 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                     <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Secured Checkout</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
