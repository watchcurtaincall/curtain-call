'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/db';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password views & inputs
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Recovery landing views & inputs
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetFinished, setResetFinished] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Supabase redirects password resets with hash anchors like #access_token=...&type=recovery
    const isRecovery = window.location.hash.includes('type=recovery') || window.location.search.includes('recovery=true');
    if (isRecovery) {
      setIsResettingPassword(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      if (!supabase) {
        throw new Error('Database connection is not available.');
      }
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/login?recovery=true`
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      if (!supabase) {
        throw new Error('Database connection is not available.');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setResetFinished(true);
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* View 1: Recovery Reset Password */}
          {isResettingPassword ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">New Password</h1>
                <p className="text-zinc-400 text-sm">Create a new secure password for your account.</p>
              </div>

              {resetFinished ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="text-green-300 font-medium">Password updated successfully!</p>
                  <p className="text-zinc-500 text-xs">Redirecting you to your profile page...</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                          required
                          minLength={8}
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
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update Password <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : isForgotPassword ? (
            /* View 2: Forgot Password Form */
            <>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-zinc-400 text-sm">Enter your email and we&apos;ll send you a password recovery link.</p>
              </div>

              {resetSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                    <Key className="h-5 w-5" />
                  </div>
                  <p className="text-zinc-200 font-medium">Recovery email sent!</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Check your inbox (and spam folder) for the password reset link to create your new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setResetSuccess(false); setResetEmail(''); setErrorMsg(''); }}
                    className="text-white hover:underline text-sm font-medium mt-4 block mx-auto"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={e => setResetEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setErrorMsg(''); }}
                    className="text-zinc-400 hover:text-white text-sm font-medium mt-6 block mx-auto transition-colors"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </>
          ) : (
            /* View 3: Standard Login Form */
            <>
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
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setErrorMsg(''); }}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Forgot password?
                    </button>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
