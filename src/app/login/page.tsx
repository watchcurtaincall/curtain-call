'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Key, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & OTP verification states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const [isEnteringOtp, setIsEnteringOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // New password input states
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetFinished, setResetFinished] = useState(false);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email: resetEmail.trim() })
      });
      const data = await res.json();
      setLoading(false);
      
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send recovery code.');
      } else {
        setResetSuccess(true);
        setIsEnteringOtp(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the 4-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          email: resetEmail.trim(),
          code: otpCode.trim()
        })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid recovery code.');
      } else {
        setIsResettingPassword(true);
        setIsEnteringOtp(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: resetEmail.trim(),
          code: otpCode.trim(),
          newPassword
        })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to reset password.');
      } else {
        setResetFinished(true);
        // Clean session trigger to authenticate them using standard login function internally
        setTimeout(async () => {
          try {
            await login(resetEmail.trim(), newPassword);
            router.push('/profile');
          } catch {
            // If auto-login fails, redirect to login page directly to login manually
            setIsResettingPassword(false);
            setIsForgotPassword(false);
            setResetEmail('');
            setOtpCode('');
            setNewPassword('');
            setResetSuccess(false);
            setResetFinished(false);
            setErrorMsg('Password updated! Please sign in with your new password.');
          }
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  const resetViewStates = () => {
    setIsForgotPassword(false);
    setIsEnteringOtp(false);
    setIsResettingPassword(false);
    setResetEmail('');
    setOtpCode('');
    setNewPassword('');
    setResetSuccess(false);
    setResetFinished(false);
    setErrorMsg('');
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* VIEW 1: ENTER NEW PASSWORD */}
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
                  <p className="text-zinc-500 text-xs">Signing you in and redirecting to profile...</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleResetPassword}>
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
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Password <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : isEnteringOtp ? (
            /* VIEW 2: ENTER OTP CODE */
            <>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Verify Code</h1>
                <p className="text-zinc-400 text-sm">Enter the 4-digit verification code sent to <span className="text-white font-medium">{resetEmail}</span></p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Verification Code</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1234"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all font-mono text-center tracking-[8px] text-lg font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify Code <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <button
                type="button"
                onClick={resetViewStates}
                className="text-zinc-400 hover:text-white text-sm font-medium mt-6 block mx-auto transition-colors"
              >
                Cancel and Back to Sign In
              </button>
            </>
          ) : isForgotPassword ? (
            /* VIEW 3: REQUEST OTP EMAIL */
            <>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-zinc-400 text-sm">Enter your account email to receive a password reset code.</p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSendOtp}>
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Code <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <button
                type="button"
                onClick={resetViewStates}
                className="text-zinc-400 hover:text-white text-sm font-medium mt-6 block mx-auto transition-colors"
              >
                Back to Sign In
              </button>
            </>
          ) : (
            /* VIEW 4: STANDARD SIGN IN */
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
