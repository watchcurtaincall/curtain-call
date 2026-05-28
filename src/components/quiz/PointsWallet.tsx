'use client';

import { useState } from 'react';
import { Coins, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface PointsWalletProps {
  userId: string;
  balance: number;
  onConverted?: (newBalance: number) => void;
}

const CONVERSION_RATE = 1; // 1 pt = ₦1
const MIN_POINTS = 1000;

export function PointsWallet({ userId, balance, onConverted }: PointsWalletProps) {
  const [state, setState] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [nairaValue, setNairaValue] = useState(0);

  const cashValue = Math.floor(balance / CONVERSION_RATE);
  const canConvert = balance >= MIN_POINTS;

  const handleConvert = async () => {
    if (!canConvert || state === 'converting') return;
    setState('converting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/quiz/points/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pointsToConvert: balance }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      setNairaValue(data.nairaAdded);
      setState('success');
      onConverted?.(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Conversion failed');
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <p className="font-serif font-bold text-white text-base">Points Converted!</p>
          <p className="text-zinc-400 text-xs mt-1">
            ₦{nairaValue.toLocaleString()} added to your producer wallet for withdrawal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Coins className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-white font-serif font-bold text-sm">Quiz Points Wallet</p>
          <p className="text-zinc-500 text-xs">Convert points to cash in your Producer Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Balance</p>
          <p className="text-2xl font-bold font-serif text-amber-400 mt-1">{balance.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">pts</p>
        </div>
        <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Cash Value</p>
          <p className="text-2xl font-bold font-serif text-emerald-400 mt-1">₦{cashValue.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">at 1000pts/₦1000</p>
        </div>
      </div>

      {state === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/5 border border-red-500/10 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={!canConvert || state === 'converting'}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95"
      >
        {state === 'converting' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Converting…</>
        ) : (
          <>Convert All to Cash <ArrowRight className="h-4 w-4" /></>
        )}
      </button>

      {!canConvert && (
        <p className="text-center text-zinc-600 text-xs">
          Minimum {MIN_POINTS.toLocaleString()} pts needed to convert ({MIN_POINTS - balance} more to go)
        </p>
      )}
    </div>
  );
}
