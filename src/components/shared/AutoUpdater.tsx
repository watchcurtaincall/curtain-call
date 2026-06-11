'use client';

import { useEffect, useRef } from 'react';

export function AutoUpdater() {
  const currentVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (currentVersionRef.current === null) {
            currentVersionRef.current = data.version;
          } else if (currentVersionRef.current !== data.version && data.version !== 'dev') {
            console.log('New app version detected. Updating...');
            
            // Unregister Service Workers to clear PWA cache
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
              }
            }
            
            // Force hard reload from server
            window.location.reload();
          }
        }
      } catch (err) {
        // Ignore network errors (e.g. offline)
      }
    };

    checkVersion();

    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
