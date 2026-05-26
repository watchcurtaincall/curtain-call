'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, AtSign } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ClientDB } from '@/lib/db';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration form inputs
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    await new Promise(r => setTimeout(r, 1200));

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      setLoading(false);
      return;
    }
    
    // Optional username uniqueness check
    if (username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      // Username validation: letters, numbers, underscores only
      if (!/^[a-z0-9_]+$/i.test(cleanUsername)) {
        setErrorMsg('Username can only contain letters, numbers, and underscores.');
        setLoading(false);
        return;
      }
      
      const existingProfiles = ClientDB.getSignups();
      const usernameExists = existingProfiles.some(p => {
        const u = p.username || (p.handle && !p.handle.startsWith('@') ? p.handle : '');
        return u.toLowerCase() === cleanUsername || (p.handle && p.handle.toLowerCase() === cleanUsername);
      });
      
      if (usernameExists) {
        setErrorMsg('This username is already taken. Please choose another one.');
        setLoading(false);
        return;
      }
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    // Register and log in
    try {
      await signUp(email.trim(), password, name.trim(), username.trim() || undefined);
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) {
          router.push(redirect);
          return;
        }
      }
      router.push('/profile');
    } catch (err: any) {
      let msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('exceeded')) {
        msg = 'Signup request rate limit exceeded. Please wait a moment and try again, or contact support.';
      }
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Join the Audience</h1>
            <p className="text-zinc-400 text-sm">Create an account to track your theatre history, save your watchlist, and review plays.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-zinc-300">Username</label>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Optional</span>
              </div>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="theatrefan"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all text-sm"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                If set, this name will show up on reviews instead of your real name to protect your privacy.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
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
