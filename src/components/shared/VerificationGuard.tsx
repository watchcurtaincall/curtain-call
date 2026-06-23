'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Mail, Lock, Loader2, LogOut, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { syncFromSupabase } from '@/lib/db';

export function VerificationGuard({ children }: { children: React.ReactNode }) {
  const { user, verifyCode, resendVerificationCode, logout } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Resend OTP Code state
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!user || user.isVerified) {
    return <>{children}</>;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const ok = await verifyCode(otpCode.trim());
      if (ok) {
        setSuccess(true);
        // Force database pull to synchronize freshly unlocked critic features in background
        syncFromSupabase().catch(err => console.error('[VerificationGuard] syncFromSupabase background failed:', err));
      } else {
        setErrorMsg('Invalid 4-digit verification code. Please check your email inbox or spam folder.');
      }
    } catch (err) {
      setErrorMsg('Verification system encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResending(true);
    setErrorMsg('');
    try {
      await resendVerificationCode();
      setResendTimer(30);
    } catch (err) {
      setErrorMsg('Failed to dispatch a new verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto">
      {/* Decorative atmospheric ambient blur */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        
        {success ? (
          <div className="flex flex-col items-center animate-fade-up py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Verification Successful!</h2>
            <p className="text-zinc-400 text-sm mb-6 px-4">
              Welcome to the front row! Your digital profile is active and fully verified.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono bg-zinc-900/60 px-4 py-2 rounded-xl border border-white/5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Initializing dynamic workspace session...
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Header branding */}
            <div className="mb-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white">Verify Your Account</h2>
              <p className="text-zinc-400 text-xs mt-1 bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-full font-mono">
                {user.email}
              </p>
            </div>

            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              We've dispatched a **4-digit confirmation code** to your registered email address. Please input the code below to unlock the platform.
              <br />
              <span className="text-xs text-zinc-500 block mt-2">
                ✉️ Don't see it? Please **check your spam or junk folder**.
              </span>
            </p>

            {errorMsg && (
              <div className="w-full mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-start gap-2 text-left font-medium">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="w-full space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Enter 4-digit code"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-center text-2xl font-bold font-mono tracking-[8px] text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-700 placeholder:text-base placeholder:tracking-normal"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify and Enter Stage</span>
                )}
              </button>
            </form>

            {/* Verification options & actions */}
            <div className="w-full border-t border-white/5 mt-6 pt-5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendTimer > 0}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium disabled:text-zinc-600"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
              
              <button
                type="button"
                onClick={() => logout()}
                className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out / Start Over</span>
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
