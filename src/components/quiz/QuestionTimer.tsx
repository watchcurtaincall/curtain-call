'use client';

import { useEffect, useRef, useState } from 'react';

interface QuestionTimerProps {
  onExpire: () => void;
}

export function QuestionTimer({ onExpire }: QuestionTimerProps) {
  const duration = 5000; // 5 seconds
  const [timeLeft, setTimeLeft] = useState(duration);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = null;
    hasExpiredRef.current = false;
    setTimeLeft(duration);

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);

      setTimeLeft(remaining);

      if (remaining > 0) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire();
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onExpire]);

  const percentage = (timeLeft / duration) * 100;
  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div className="w-full flex flex-col gap-3 items-center">
      {/* Shrinking red/orange glow progress bar */}
      <div className="w-full h-2.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Large countdown text */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Time Remaining:</span>
        <span className={`text-2xl font-bold font-mono tracking-tight ${secondsLeft <= 2 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
          {secondsLeft}s
        </span>
      </div>
    </div>
  );
}
