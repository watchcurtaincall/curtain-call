'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useWatchlist } from '@/lib/WatchlistContext';

export function WatchlistButton({ productionId, compact = false }: { productionId: string; compact?: boolean }) {
  const { toggle, isInWatchlist } = useWatchlist();
  const saved = isInWatchlist(productionId);

  const classes = compact
    ? `w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border ${
        saved
          ? 'bg-red-650/15 border-red-650/40 text-red-400'
          : 'bg-zinc-900 border-white/5 text-white hover:bg-zinc-800'
      }`
    : `flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-base transition-all border ${
        saved
          ? 'bg-red-600/15 border-red-600/40 text-red-400 hover:bg-red-600/25'
          : 'bg-zinc-900 border-white/10 text-white hover:bg-zinc-800'
      }`;

  return (
    <button
      onClick={() => toggle(productionId)}
      className={classes}
    >
      {saved ? (
        <><BookmarkCheck className="h-4 w-4 text-red-400" /> {compact ? 'Saved' : 'Saved to List'}</>
      ) : (
        <><Bookmark className="h-4 w-4" /> {compact ? 'Watchlist' : 'Add to Watchlist'}</>
      )}
    </button>
  );
}
