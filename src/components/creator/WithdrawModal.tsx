'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Banknote, ChevronDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getBanks, resolveAccount, type Bank } from '@/lib/paystack';
import { ClientDB } from '@/lib/db';
import { useAuth } from '@/lib/AuthContext';

interface WithdrawModalProps {
  availableBalance: number;
  onClose: () => void;
}

type Step = 'amount' | 'account' | 'confirm' | 'otp' | 'processing' | 'success' | 'error';

export function WithdrawModal({ availableBalance, onClose }: WithdrawModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Load banks once and apply saved details
  useEffect(() => {
    getBanks().then(banksData => {
      setBanks(banksData);
      if (user?.email) {
        const saved = ClientDB.getUserBankDetails(user.email);
        if (saved) {
          setAccountNumber(saved.accountNumber);
          const b = banksData.find(b => b.code === saved.bankCode) || null;
          setSelectedBank(b);
        }
      }
    });
  }, [user?.email]);

  // Auto-resolve when account number hits 10 digits and bank is selected
  const resolve = useCallback(async () => {
    if (accountNumber.length !== 10 || !selectedBank) return;
    setResolving(true);
    setResolveError('');
    setResolvedName('');
    try {
      const result = await resolveAccount(accountNumber, selectedBank.code);
      setResolvedName(result.account_name);
    } catch {
      setResolveError('Could not verify account. Please check your details.');
    } finally {
      setResolving(false);
    }
  }, [accountNumber, selectedBank]);

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      resolve();
    } else {
      setResolvedName('');
      setResolveError('');
    }
  }, [accountNumber, selectedBank, resolve]);

  // Trap body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const canProceedAmount = parsedAmount >= 1000 && parsedAmount <= availableBalance;
  const canProceedAccount = resolvedName && !resolveError && selectedBank;

  const handleSendOtp = async () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setStep('processing'); // show loader while sending
    try {
      const recipient = user?.email || 'unknown@curtaincall.ng';
      const subject = `Your Withdrawal OTP 🔐`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Curtain Call Financials</span>
            <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 0;"></div>
          </div>
          <h2 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; margin-top: 0; text-align: center; font-weight: bold;">Authorize Withdrawal</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            You are trying to withdraw <strong>₦${parsedAmount.toLocaleString()}</strong> to ${resolvedName}. Please use the OTP below to confirm your request:
          </p>
          <h1 style="text-align: center; font-size: 40px; letter-spacing: 8px; color: #eab308; margin: 30px 0; font-family: monospace;">${otp}</h1>
          <p style="color: #71717a; font-size: 11px; text-align: center; font-family: monospace; border-top: 1px solid #27272a; padding-top: 20px;">
            If you did not request this, please contact support immediately.
          </p>
        </div>
      `;
      await ClientDB.sendEmail(recipient, subject, emailHtml);
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP email.');
      setStep('error');
    }
  };

  const handleVerifyOtpAndWithdraw = async () => {
    if (otpCode !== generatedOtp) {
      setOtpError('Invalid OTP code. Please try again.');
      return;
    }

    setStep('processing');
    try {
      const withdrawalId = `w_req_${Date.now()}`;
      const newRequest = {
        id: withdrawalId,
        email: user?.email || 'unknown@curtaincall.ng',
        amount: parsedAmount,
        bankName: selectedBank?.name || 'Unknown Bank',
        accountNumber: accountNumber,
        accountName: resolvedName,
        status: 'Pending' as const,
        timestamp: new Date().toLocaleString()
      };

      // Submit withdrawal request to ClientDB
      ClientDB.submitWithdrawal(newRequest);

      // Send pending email notification
      const recipient = user?.email || 'unknown@curtaincall.ng';
      const subject = `Withdrawal Request Initiated 💸 - ₦${parsedAmount.toLocaleString()}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Curtain Call Financials</span>
            <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 0;"></div>
          </div>
          
          <h2 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; margin-top: 0; text-align: center; font-weight: bold;">Withdrawal Request Initiated</h2>
          
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            We have received your request to withdraw your ticket sales earnings. Your request is currently undergoing review.
          </p>
          
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 25px; margin: 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Amount Requested</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: bold;">₦${parsedAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Target Bank</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${selectedBank?.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Account Number</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-family: monospace;">${accountNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Account Name</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${resolvedName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Request Status</td>
                <td style="padding: 8px 0; font-size: 12px; color: #eab308; text-align: right; font-weight: bold;">Pending Review</td>
              </tr>
            </table>
          </div>

          <div style="background-color: rgba(234, 179, 8, 0.04); border: 1px solid rgba(234, 179, 8, 0.15); border-radius: 12px; padding: 15px; margin-bottom: 25px; text-align: center;">
            <p style="color: #eab308; font-size: 13px; margin: 0; line-height: 1.5; font-weight: 500;">
              🕒 Notice: Payout reviews usually take between 24 to 48 hours to be fully approved and cleared into your bank account. (Usually within 24 hours on working days).
            </p>
          </div>
          
          <p style="color: #71717a; font-size: 11px; line-height: 1.6; border-top: 1px solid #27272a; padding-top: 25px; margin-top: 30px; text-align: center; font-family: monospace;">
            This is an automated financial notification from Curtain Call Ltd.
          </p>
        </div>
      `;

      await ClientDB.sendEmail(recipient, subject, emailHtml);
      
      // Send notification to Admin
      const adminRecipient = 'watchcurtaincall@gmail.com';
      const adminSubject = `ACTION REQUIRED: New Withdrawal Request 💸 - ₦${parsedAmount.toLocaleString()}`;
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <h2 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; margin-top: 0; text-align: center; font-weight: bold;">New Withdrawal Request Pending</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            A creator has submitted a withdrawal request. Please review and process it from the Admin Dashboard.
          </p>
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 25px; margin: 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Creator Email</td>
                <td style="padding: 8px 0; font-size: 12px; color: #ffffff; text-align: right; font-weight: bold;">${recipient}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Amount Requested</td>
                <td style="padding: 8px 0; font-size: 14px; color: #eab308; text-align: right; font-weight: bold;">₦${parsedAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Target Bank</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${selectedBank?.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Account Number</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-family: monospace;">${accountNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Account Name</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${resolvedName}</td>
              </tr>
            </table>
          </div>
          <p style="color: #71717a; font-size: 11px; line-height: 1.6; text-align: center; font-family: monospace;">
            Curtain Call Admin Automated Notification
          </p>
        </div>
      `;
      await ClientDB.sendEmail(adminRecipient, adminSubject, adminEmailHtml);

      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer initiation failed. Please try again.');
      setStep('error');
    }
  };

  const formatNGN = (n: number) =>
    '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={step !== 'processing' ? onClose : undefined} />

      <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {step !== 'processing' && step !== 'success' && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="px-6 pb-8 pt-4">

          {/* ── AMOUNT ── */}
          {step === 'amount' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-serif font-bold text-white">Withdraw Funds</h2>
                <p className="text-sm text-zinc-500 mt-1">Available: <span className="text-white font-medium">{formatNGN(availableBalance)}</span></p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg font-medium">₦</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(raw ? Number(raw).toLocaleString() : '');
                    }}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-4 py-4 text-2xl font-serif font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2 mt-1">
                  {[10000, 25000, 50000].filter(v => v <= availableBalance).map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(v.toLocaleString())}
                      className="flex-1 text-xs py-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
                    >
                      ₦{(v / 1000)}k
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(availableBalance.toLocaleString())}
                    className="flex-1 text-xs py-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
                  >
                    Max
                  </button>
                </div>
                {parsedAmount > 0 && parsedAmount < 1000 && (
                  <p className="text-xs text-red-500 mt-1">Minimum withdrawal is ₦1,000</p>
                )}
                {parsedAmount > availableBalance && (
                  <p className="text-xs text-red-500 mt-1">Amount exceeds your available balance</p>
                )}
              </div>

              <button
                onClick={() => setStep('account')}
                disabled={!canProceedAmount}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {step === 'account' && (
            <div className="flex flex-col gap-5">
              <div>
                <button onClick={() => setStep('amount')} className="text-xs text-zinc-500 hover:text-white mb-3 flex items-center gap-1">← Back</button>
                <h2 className="text-xl font-serif font-bold text-white">Bank Account</h2>
                <p className="text-sm text-zinc-500 mt-1">Where should we send {formatNGN(parsedAmount)}?</p>
              </div>

              {/* Bank selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Select Bank</label>
                <div className="relative">
                  <select
                    value={selectedBank?.code || ''}
                    onChange={e => {
                      const bank = banks.find(b => b.code === e.target.value) || null;
                      setSelectedBank(bank);
                    }}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white appearance-none focus:outline-none focus:border-white/25 transition-colors"
                  >
                    <option value="">Choose your bank</option>
                    {banks.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Account number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit account number"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors font-mono tracking-widest"
                />

                {/* Verification state */}
                {resolving && (
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />
                    <span className="text-xs text-zinc-400">Verifying account…</span>
                  </div>
                )}
                {resolvedName && !resolving && (
                  <div className="flex items-center gap-2 mt-1 p-3 bg-green-500/8 border border-green-500/20 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400">Account verified</p>
                      <p className="text-sm font-semibold text-white">{resolvedName}</p>
                    </div>
                  </div>
                )}
                {resolveError && !resolving && (
                  <div className="flex items-center gap-2 mt-1 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-400">{resolveError}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep('confirm')}
                disabled={!canProceedAccount}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Review Withdrawal
              </button>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && (
            <div className="flex flex-col gap-5">
              <div>
                <button onClick={() => setStep('account')} className="text-xs text-zinc-500 hover:text-white mb-3 flex items-center gap-1">← Back</button>
                <h2 className="text-xl font-serif font-bold text-white">Confirm Withdrawal</h2>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-2xl divide-y divide-white/5">
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-zinc-400">Amount</span>
                  <span className="text-base font-bold text-white">{formatNGN(parsedAmount)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-zinc-400">Bank</span>
                  <span className="text-sm font-medium text-white">{selectedBank?.name}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-zinc-400">Account</span>
                  <span className="text-sm font-mono text-white">{accountNumber}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-zinc-400">Account Name</span>
                  <span className="text-sm font-semibold text-green-400">{resolvedName}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-zinc-400">Balance After</span>
                  <span className="text-sm font-medium text-zinc-300">{formatNGN(availableBalance - parsedAmount)}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 text-center">Payouts are processed within 24 hours via Paystack Transfers.</p>

              <button
                onClick={handleSendOtp}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Banknote className="h-5 w-5" />
                Confirm Withdrawal
              </button>
            </div>
          )}

          {/* ── OTP ── */}
          {step === 'otp' && (
            <div className="flex flex-col gap-5">
              <div>
                <button onClick={() => setStep('confirm')} className="text-xs text-zinc-500 hover:text-white mb-3 flex items-center gap-1">← Back</button>
                <h2 className="text-xl font-serif font-bold text-white">Security Check</h2>
                <p className="text-sm text-zinc-400 mt-1">We sent a 4-digit code to <span className="text-white font-medium">{user?.email}</span></p>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpCode}
                  onChange={e => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    setOtpError('');
                  }}
                  placeholder="Enter 4-digit OTP"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl tracking-[1em] font-mono font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/25 transition-colors"
                />
                {otpError && <p className="text-xs text-red-500 text-center mt-2">{otpError}</p>}
              </div>

              <button
                onClick={handleVerifyOtpAndWithdraw}
                disabled={otpCode.length !== 4}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
              >
                Verify & Withdraw
              </button>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
              <div>
                <h2 className="text-lg font-serif font-bold text-white">Processing Transfer</h2>
                <p className="text-sm text-zinc-400 mt-1">Please wait while we process your withdrawal…</p>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Withdrawal Initiated</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  <span className="text-white font-semibold">{formatNGN(parsedAmount)}</span> is on its way to <span className="text-white font-semibold">{resolvedName}</span> at {selectedBank?.name}.<br />
                  <span className="text-xs text-zinc-500 mt-1 block">Processing time: up to 24 hours.</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Transfer Failed</h2>
                <p className="text-sm text-zinc-400">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('confirm')} className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors">
                  Try Again
                </button>
                <button onClick={onClose} className="bg-zinc-900 border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
