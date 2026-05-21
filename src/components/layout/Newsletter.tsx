'use client';

import { Send } from 'lucide-react';

export function Newsletter() {
  return (
    <section className="bg-zinc-950 border-t border-white/5 py-16">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-4">
          The Front Row Seat
        </h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
          Join our newsletter to get weekly updates on new premieres, exclusive ticket offers, and the best of African theatre delivered straight to your inbox.
        </p>
        
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-1 relative">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="w-full bg-zinc-900 border border-white/10 rounded-full px-6 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-white text-black font-bold px-8 py-3.5 rounded-full hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            Subscribe <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-zinc-600 text-xs mt-4">
          By subscribing, you agree to our Privacy Policy. We won't spam you.
        </p>
      </div>
    </section>
  );
}
