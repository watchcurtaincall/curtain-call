'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { ClientDB } from '@/lib/db';
import Link from 'next/link';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      const res = await ClientDB.subscribeToNewsletter(email);
      if (res.success) {
        setAlreadySubscribed(!!res.alreadySubscribed);
        setSubscribed(true);
        setEmail('');
      } else {
        alert(res.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-zinc-950 border-t border-white/5 py-16">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-4">
          The Front Row Seat
        </h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
          Join our newsletter to get weekly updates on new premieres, exclusive ticket offers, and the best of African theatre delivered straight to your inbox.
        </p>
        
        {subscribed ? (
          <div className="bg-zinc-900 border border-green-500/20 max-w-md mx-auto rounded-3xl p-6 flex flex-col items-center justify-center animate-fade-up">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-white">
              {alreadySubscribed ? "You're already subscribed!" : "You're Subscribed!"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {alreadySubscribed
                ? "No new welcome email was dispatched since your address is already whitelisted on our Front Row Seat newsletter list."
                : "Check your inbox for your welcoming Front Row Seat ticket!"}
            </p>
          </div>
        ) : (
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubscribe}>
            <div className="flex-1 relative">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address" 
                className="w-full bg-zinc-900 border border-white/10 rounded-full px-6 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm"
                required
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-white text-black font-bold px-8 py-3.5 rounded-full hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 text-sm"
            >
              {loading ? 'Subscribing...' : 'Subscribe'} <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        
        <p className="text-zinc-600 text-xs mt-4">
          By subscribing, you agree to our <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>. We won't spam you.
        </p>
      </div>
    </section>
  );
}
