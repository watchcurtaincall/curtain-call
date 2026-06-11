'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Extract form data synchronously before any await
    const formElement = e.currentTarget as HTMLFormElement;
    const formData = new FormData(formElement);
    const enteredEmail = (formData.get('email') as string || '').trim();
    const enteredPassword = formData.get('password') as string || '';

    setLoading(true);
    setErrorMsg('');
    await new Promise(r => setTimeout(r, 1000));

    if (!enteredEmail) {
      setErrorMsg('Please enter your email address.');
      setLoading(false);
      return;
    }

    // Custom Administrator Credential Check
    if (enteredEmail.toLowerCase() === 'watchcurtaincall@gmail.com') {
      if (enteredPassword !== '11647Curtain_') {
        setErrorMsg('Invalid password for the Administrator account.');
        setLoading(false);
        return;
      }
    }

    try {
      await login(enteredEmail, enteredPassword);
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
      let msg = err.message || 'Invalid email or password.';
      if (msg.toLowerCase().includes('confirm')) {
        msg = 'Your email address has not been confirmed yet. Please verify your inbox for the confirmation code, or try signing in again.';
      }
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-zinc-400 text-sm">Sign in to review plays and manage your watchlist.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-zinc-300">Password</label>
                <Link href="#" className="text-xs text-red-500 hover:text-red-400 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                  required
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
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-8">
            Don&apos;t have an account? <Link href={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `/signup?redirect=${new URLSearchParams(window.location.search).get('redirect')}` : "/signup"} className="text-white font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
