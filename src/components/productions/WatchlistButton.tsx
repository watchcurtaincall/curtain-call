'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useWatchlist } from '@/lib/WatchlistContext';

export function WatchlistButton({ productionId }: { productionId: string }) {
  const { toggle, isInWatchlist } = useWatchlist();
  const saved = isInWatchlist(productionId);

  return (
    <button
      onClick={() => toggle(productionId)}
      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-base transition-all border ${
        saved
          ? 'bg-red-600/15 border-red-600/40 text-red-400 hover:bg-red-600/25'
          : 'bg-zinc-900 border-white/10 text-white hover:bg-zinc-800'
      }`}
    >
      {saved ? (
        <><BookmarkCheck className="h-5 w-5" /> Saved to List</>
      ) : (
        <><Bookmark className="h-5 w-5" /> Add to Watchlist</>
      )}
    </button>
  );
}
