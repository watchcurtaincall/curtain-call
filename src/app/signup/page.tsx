import Link from 'next/link';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Join the Audience</h1>
            <p className="text-zinc-400 text-sm">Create an account to track your theatre history, save your watchlist, and review plays.</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input 
                  type="password" 
                  placeholder="Create a strong password"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-6">
              Create Account <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-zinc-500 text-xs mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className="text-center text-zinc-400 text-sm mt-8">
            Already have an account? <Link href="/login" className="text-white font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
