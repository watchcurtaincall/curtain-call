'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface WatchlistContextType {
  watchlist: string[];
  toggle: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  toggle: () => {},
  isInWatchlist: () => false,
});

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_watchlist');
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('cc_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((id: string) => watchlist.includes(id), [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, toggle, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
