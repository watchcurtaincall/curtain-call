'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Key, Eye, HelpCircle } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white py-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mb-12 animate-fade-down">
          <span className="text-xs bg-red-600/10 text-red-400 border border-red-600/25 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
            Legal Policy
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4 mb-6">
            Privacy Policy & Terms
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed font-light">
            Effective Date: May 24, 2026. This policy outlines how Curtain Call collects, processes, and protects your personal and transaction data.
          </p>
        </div>

        {/* Content Panels */}
        <div className="flex flex-col gap-8 mb-12 animate-fade-up">
          
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              1. Payouts & Transaction Security
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              All ticket purchases are secured via 3D Secure Paystack checkout layers. Curtain Call acts as an escrow gateway. Ticket funds (minus our standard 5% platform fee) are credited to the producer's available balance instantly and remain protected.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When producers request withdrawals, payouts are reviewed and processed within 24 to 48 hours to prevent fraud or credential hijacking. Approved withdrawals are transferred securely to verified bank routing details.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-violet-400" />
              2. Authentication & Account Access
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We leverage secure OAuth 2.0 logins and verified credentials. Your email profile is locked to your account structure, ensuring critic badges and financial earnings can only be claimed, written, or withdrawn by the verified account owner. We do not store plain-text passwords or share account profiles.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-400" />
              3. Data Retention & Third Parties
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Data regarding your showlists, reviews, and directory submissions is stored to build persistent archives. Transaction histories are kept for regulatory compliance. We do not sell user data to advertising third parties. Delivery emails (like ticket vouchers) are processed via secure email transaction handlers (Resend/SendGrid).
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-400" />
              4. Contact & Support
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              If you have any questions, wish to dispute a transaction, or claim a theatremaker directory profile listing, please contact our curation board at:
              <br />
              <span className="font-mono text-white mt-2 block">support@curtaincall.ng</span>
            </p>
          </div>

        </div>

        <div className="text-center py-6 border-t border-white/5">
          <p className="text-sm text-zinc-500">
            Curtain Call Ltd · 10 Glover Road, Ikoyi, Lagos
          </p>
        </div>
      </div>
    </div>
  );
}
