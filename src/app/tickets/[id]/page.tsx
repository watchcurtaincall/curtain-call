'use client';

import React, { useState, useEffect } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Ticket as TicketIcon, Mail, CheckCircle2, QrCode } from 'lucide-react';
import { PaystackButton } from '@/components/payments/PaystackButton';

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState({ name: 'General Admission', price: 5000 });
  const [successData, setSuccessData] = useState<{ reference: string; tier: string } | null>(null);

  useEffect(() => {
    params.then(resolved => {
      const fetched = ClientDB.getProductionById(resolved.id);
      setProduction(fetched || null);
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

  const standardTiers = [
    { name: 'General Admission', price: 5000 },
    { name: 'VIP Pass', price: 15000 },
    { name: 'VVIP Premium Cabin', price: 40000 },
  ];

  const handlePaymentSuccess = (reference: string) => {
    setSuccessData({
      reference,
      tier: selectedTier.name,
    });
  };

  return (
    <div className="flex flex-col min-h-screen container mx-auto px-4 py-16 items-center justify-center bg-zinc-950">
      
      {successData ? (
        /* ── GORGEOUS PREMIUM SUCCESS RECEIPT PASS ── */
        <div className="max-w-md w-full bg-zinc-900 border-2 border-green-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-fade-up">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-500" />
          
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>

          <h1 className="text-2xl font-serif font-bold text-white mb-1">
            Ticket Confirmed!
          </h1>
          <p className="text-xs text-zinc-500 mb-6">
            Your admission pass has been secured and sent to <span className="text-zinc-300 font-semibold">{email || 'guest@curtaincall.ng'}</span>.
          </p>

          {/* Ticket Card Pass UI */}
          <div className="bg-zinc-950 border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden mb-6">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-green-500/5 rounded-full blur-xl" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Admission Pass</span>
                <h3 className="text-base font-serif font-bold text-white truncate max-w-[200px] mt-0.5">
                  {production.title}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-green-400 bg-green-600/10 px-2 py-0.5 rounded border border-green-500/20 font-mono">
                PAID
              </span>
            </div>

            <div className="border-t border-dashed border-white/10 my-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Tier</span>
                <span className="text-xs text-zinc-200 font-semibold">{successData.tier}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Reference</span>
                <span className="text-xs text-zinc-200 font-mono font-semibold">{successData.reference.substring(0, 10)}...</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Venue</span>
                <span className="text-xs text-zinc-200 font-semibold">{production.venue}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Gate Pass</span>
                <span className="text-xs text-green-400 font-mono font-bold flex items-center gap-1">
                  <QrCode className="h-3.5 w-3.5" /> CC-{successData.reference.substring(0, 6).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 leading-relaxed mb-6 font-mono">
            PRESENT THIS DIGITAL PASS OR REFERENCE CODE AT THE VENUE GATE.
          </p>

          <Link
            href={`/productions/${production.id}`}
            className="block w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors text-sm shadow-xl"
          >
            Back to Show Details
          </Link>
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
                className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Tier Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Select Ticket Tier
              </label>
              <div className="flex flex-col gap-2">
                {standardTiers.map(tier => (
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

            {/* Paystack Checkout Button Container */}
            <div className="mt-2">
              <PaystackButton
                productionTitle={production.title}
                productionId={production.id}
                tierName={selectedTier.name}
                priceNGN={selectedTier.price}
                userEmail={email || 'guest@curtaincall.ng'}
                onSuccess={handlePaymentSuccess}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-[9px] text-center text-zinc-500 mt-2 font-mono uppercase">
                Secured via Paystack 3D Secure
              </p>
            </div>

            {/* Cancel/Back link */}
            <Link
              href={`/productions/${production.id}`}
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
