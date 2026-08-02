'use client';

// hooks/useWebSocket.ts
// Shared WebSocket hook — subscribes to a private channel
// via Laravel Echo + Reverb and fires a callback when a
// specified event arrives.
//
// channelName: full channel name without "private-" prefix
//   e.g. "conversation.abc" or "user.xyz"
// eventName: the event to listen for (e.g. ".message.sent" or ".notification.sent")
//   defaults to ".message.sent" for convenience
// onEvent: callback fired when the event arrives — typed as unknown;
//   each caller casts to the expected shape

import { useEffect, useRef } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/store/authStore';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

function createEcho(token: string): Echo<'pusher'> {
  return new Echo({
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
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

export function useWebSocket(
  channelName: string,
  onEvent: (event: unknown) => void,
  eventName = '.message.sent',
) {
  const token = useAuthStore((s) => s.token);
  const echoRef = useRef<Echo<'pusher'> | null>(null);
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  });

  useEffect(() => {
    if (!token || !channelName) return;

    if (
      echoRef.current?.connector?.options?.auth?.headers?.Authorization !==
      `Bearer ${token}`
    ) {
      echoRef.current?.disconnect();
      echoRef.current = createEcho(token);
    } else if (!echoRef.current) {
      echoRef.current = createEcho(token);
    }

    const channel = echoRef.current.private(channelName);

    channel.listen(eventName, (event: unknown) => {
      callbackRef.current(event);
    });

    return () => {
      channel.stopListening(eventName);
      echoRef.current?.leave(channelName);
    };
  }, [channelName, token, eventName]);
}