'use client';

import { Flame, Zap } from 'lucide-react';

interface StreakBadgeProps {
  count: number;
  className?: string;
}

export function StreakBadge({ count, className = '' }: StreakBadgeProps) {
  if (count === 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-500 text-xs font-bold ${className}`}>
        <Zap className="h-3.5 w-3.5" />
        <span>No streak yet</span>
      </div>
    );
  }

  const isMilestone = count === 7 || count === 30 || count === 100;
  const color =
    count >= 100 ? 'from-rose-600 to-red-500 border-red-400/30 shadow-red-900/40' :
    count >= 30  ? 'from-orange-600 to-amber-500 border-amber-400/30 shadow-amber-900/30' :
    count >= 7   ? 'from-amber-600 to-yellow-500 border-yellow-400/30 shadow-yellow-900/30' :
                   'from-zinc-700 to-zinc-600 border-white/10 shadow-black/20';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${color} border shadow-lg text-white text-xs font-bold transition-transform hover:scale-105 ${className} ${isMilestone ? 'animate-pulse' : ''}`}
    >
      <Flame className="h-3.5 w-3.5 drop-shadow" />
      <span>{count} day{count !== 1 ? 's' : ''}</span>
      {isMilestone && (
        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">
          {count === 7 ? '🔥' : count === 30 ? '⭐' : '👑'}
        </span>
      )}
    </div>
  );
}
