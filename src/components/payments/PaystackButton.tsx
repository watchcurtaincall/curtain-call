'use client';

import { useState, useEffect } from 'react';
import { Ticket, Loader2 } from 'lucide-react';
import { openPaystackCheckout, PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

interface PaystackButtonProps {
  productionTitle: string;
  productionId: string;
  tierName: string;
  priceNGN: number;
  userEmail?: string;
  onSuccess?: (ref: string) => void;
  className?: string;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

export function PaystackButton({
  productionTitle,
  productionId,
  tierName,
  priceNGN,
  userEmail = 'guest@curtaincall.ng',
  onSuccess,
  className,
  disabled,
  metadata,
}: PaystackButtonProps) {
  const [loaded, setLoaded] = useState(false);
  const [paying, setPaying] = useState(false);

  // Load Paystack inline script
  useEffect(() => {
    if (document.getElementById('paystack-inline')) { setLoaded(true); return; }
    const script = document.createElement('script');
    script.id = 'paystack-inline';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handlePay = () => {
    if (!loaded) return;
    setPaying(true);
    openPaystackCheckout({
      email: userEmail,
      amount: priceNGN * 100, // convert to kobo
      metadata: {
        production_id: productionId,
        production_title: productionTitle,
        tier: tierName,
        ...metadata,
      },
      onSuccess: (ref) => {
        setPaying(false);
        onSuccess?.(ref);
      },
      onClose: () => setPaying(false),
    });
  };

  return (
    <button
      onClick={handlePay}
      disabled={!loaded || paying || disabled}
      className={className || 'flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
    >
      {paying
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
        : <><Ticket className="h-4 w-4" /> Buy Ticket — ₦{priceNGN.toLocaleString()}</>
      }
    </button>
  );
}
