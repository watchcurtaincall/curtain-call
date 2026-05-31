'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';

// Utility function to convert Base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('You must grant permission to receive notifications.');
        setIsLoading(false);
        return;
      }

      // Subscribe to push service
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key is missing.');
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Send subscription to our backend
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (res.ok) {
        setIsSubscribed(true);
      } else {
        console.error('Failed to save subscription on server');
      }
    } catch (error) {
      console.error('Error during push subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleSubscribe}
      disabled={isSubscribed || isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
        isSubscribed
          ? 'bg-zinc-900 border-zinc-800 text-zinc-400 cursor-default'
          : 'bg-red-600/10 border-red-500/20 text-red-400 hover:bg-red-600/20 hover:border-red-500/40'
      }`}
    >
      {isSubscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {isLoading ? 'Enabling...' : isSubscribed ? 'Alerts Enabled' : 'Enable Live Alerts'}
    </button>
  );
}
