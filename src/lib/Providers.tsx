'use client';

import { AuthProvider } from '@/lib/AuthContext';
import { WatchlistProvider } from '@/lib/WatchlistContext';
import { VerificationGuard } from '@/components/shared/VerificationGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <VerificationGuard>
          {children}
        </VerificationGuard>
      </WatchlistProvider>
    </AuthProvider>
  );
}
