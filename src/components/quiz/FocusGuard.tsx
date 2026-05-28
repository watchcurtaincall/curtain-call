'use client';

import { useEffect, useRef } from 'react';

interface FocusGuardProps {
  active: boolean;
  onVoid: (reason: 'visibility' | 'blur' | 'unload') => void;
}

export function FocusGuard({ active, onVoid }: FocusGuardProps) {
  const activeRef = useRef(active);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (!activeRef.current) return;
      if (document.visibilityState === 'hidden') {
        onVoid('visibility');
      }
    };

    const handleBlur = () => {
      if (!activeRef.current) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        if (!document.hasFocus()) {
          onVoid('blur');
        }
      }, 50);
    };

    const handleBeforeUnload = () => {
      if (!activeRef.current) return;
      onVoid('unload');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [active, onVoid]);

  return null;
}
