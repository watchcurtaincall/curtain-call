'use client';

import { AuthProvider } from '@/lib/AuthContext';
import { WatchlistProvider } from '@/lib/WatchlistContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WatchlistProvider>
        {children}
      </WatchlistProvider>
    </AuthProvider>
  );
}
