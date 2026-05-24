'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, BookOpen, Heart, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white py-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mb-12 animate-fade-down">
          <span className="text-xs bg-red-600/10 text-red-400 border border-red-600/25 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
            Our Mission
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4 mb-6">
            The Front Row Seat for African Theatre
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed font-light">
            Curtain Call is a premium living archive, ticketing gateway, and database dedicated to preserving, amplifying, and reviewing regional African stages, playbills, opinion pieces, and theatremaker histories.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md mb-10 animate-fade-up">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">Why Curtain Call?</h2>
          <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
            <p>
              African theatre is home to some of the most vibrant, expressive, and culturally significant stories in the world. However, much of this history has remained undocumented or confined to physical, fleeting playbills.
            </p>
            <p>
              We built Curtain Call to change that. By providing a unified digital catalog for stages and theatremakers, we empower creators to build persistent stageographies and preserve their cultural legacies for audiences worldwide.
            </p>
            <p>
              Whether you are a casual theatregoer looking to buy a Paystack-secured ticket, an active journalist applying to join our verified critic program, or a producer managing a production crew cast list—Curtain Call is your gateway.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-fade-up">
          {[
            {
              title: 'Cultural Archiving',
              desc: 'We treat theatrical cast lists, production histories, and playbills as high-priority historical records.',
              Icon: BookOpen,
              color: 'text-violet-400 border-violet-500/20 bg-violet-500/5'
            },
            {
              title: 'Curated Critique',
              desc: 'We support verified journalistic reviews and open audience feedback to elevate the calibre of stage productions.',
              Icon: Sparkles,
              color: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
            },
            {
              title: 'Secure Operations',
              desc: 'From Paystack seat vouchers to bank payouts for producers, financial and user operations are locked and secure.',
              Icon: Shield,
              color: 'text-green-400 border-green-500/20 bg-green-500/5'
            },
            {
              title: 'Creative Heart',
              desc: 'We put the artists first, mapping detailed directory portfolios to give creators the digital recognition they deserve.',
              Icon: Heart,
              color: 'text-red-400 border-red-500/20 bg-red-500/5'
            }
          ].map((val, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border ${val.color} flex flex-col gap-3`}>
              <val.Icon className="h-6 w-6" />
              <h3 className="font-serif font-bold text-white text-base">{val.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center py-6 border-t border-white/5">
          <p className="text-sm text-zinc-500">
            Curtain Call Ltd · Ikoyi, Lagos · Nigeria
          </p>
        </div>
      </div>
    </div>
  );
}
