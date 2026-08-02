'use client';

// hooks/useWebSocket.ts
// Shared WebSocket hook — subscribes to a private conversation channel
// via Laravel Echo + Reverb and fires a callback when a new message
// arrives. Dedup logic belongs in the callback, not here.
//
// onMessage is stored in a ref so the effect doesn't re-subscribe
// on every render — only conversationId or token changes trigger
// a new subscription.

import { useEffect, useRef } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/store/authStore';
import type { Message } from '@/types/message';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// Pusher needs to be available globally for laravel-echo
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

export function useWebSocket(
  conversationId: string,
  onMessage: (message: Message) => void,
) {
  const token = useAuthStore((s) => s.token);
  const echoRef = useRef<Echo<'pusher'> | null>(null);
  const callbackRef = useRef(onMessage);

  // Keep the callback ref current without triggering re-subscriptions
  useEffect(() => {
    callbackRef.current = onMessage;
  });

  useEffect(() => {
    if (!token || !conversationId) return;

    // If token changed, disconnect the old Echo instance first
    const currentAuth = `Bearer ${token}`;
    if (echoRef.current?.connector?.options?.auth?.headers?.Authorization !== currentAuth) {
      echoRef.current?.disconnect();
      echoRef.current = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) ?? 8080,
        wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) ?? 8080,
        forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
        encrypted: true,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        auth: {
          headers: { Authorization: currentAuth },
        },
      });
    } else if (!echoRef.current) {
      // First mount — create Echo instance
      echoRef.current = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) ?? 8080,
        wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) ?? 8080,
        forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
        encrypted: true,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        auth: {
          headers: { Authorization: currentAuth },
        },
      });
    }

    const channel = echoRef.current.private(`conversation.${conversationId}`);

    channel.listen('.message.sent', (event: Message) => {
      callbackRef.current(event);
    });

    return () => {
      channel.stopListening('.message.sent');
      echoRef.current?.leave(`conversation.${conversationId}`);
    };
  }, [conversationId, token]);
}