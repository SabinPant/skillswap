'use client';

// hooks/useWebSocket.ts
// Shared WebSocket hook — subscribes to a private Pusher channel
// via Laravel Reverb. Uses a module‑level shared Pusher instance so
// the connection survives React StrictMode remounts.
//
// channelName – full channel name WITHOUT the "private-" prefix
//   e.g. "conversation.abc" or "user.xyz"
// eventName  – the event to listen for (with or without a leading dot)
//   e.g. "message.sent" or ".message.sent"
// onEvent    – callback fired when the event arrives

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/store/authStore';

// ------------------------------------------------------------------ //
//  Module‑level shared Pusher instance — persists across remounts    //
// ------------------------------------------------------------------ //

let pusherInstance: Pusher | null = null;
let currentToken: string | null = null;

function getPusher(token: string): Pusher {
  if (pusherInstance && currentToken === token) {
    return pusherInstance;
  }

  pusherInstance?.disconnect();

  pusherInstance = new Pusher(
    process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    {
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost',
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      forceTLS: false,
      enabledTransports: ['ws'],
      authorizer: (channel: { name: string }) => ({
        authorize: (
          socketId: string,
          callback: (
            err: Error | null,
            authData: { auth: string } | null,
          ) => void,
        ) => {
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            },
          )
            .then((r) => r.json())
            .then((data) => callback(null, data))
            .catch((err) => callback(err, null));
        },
      }),
    },
  );

  currentToken = token;
  return pusherInstance;
}

// ------------------------------------------------------------------ //
//  Hook                                                              //
// ------------------------------------------------------------------ //

export function useWebSocket(
  channelName: string,
  onEvent: (event: unknown) => void,
  eventName = 'message.sent',
) {
  const token = useAuthStore((s) => s.token);
  const callbackRef = useRef(onEvent);

  // Keep callback ref current without re‑subscribing
  useEffect(() => {
    callbackRef.current = onEvent;
  });

  useEffect(() => {
    if (!token || !channelName) return;

    const pusher = getPusher(token);
    const fullChannel = `private-${channelName}`;

    // Normalise the event name — Pusher receives events without a
    // leading dot, but callers may pass ".message.sent" for Echo compat.
    const key = eventName.startsWith('.') ? eventName.slice(1) : eventName;

    const channel = pusher.subscribe(fullChannel);
    channel.bind(key, (event: unknown) => {
      callbackRef.current(event);
    });

    return () => {
      channel.unbind(key);
      pusher.unsubscribe(fullChannel);
    };
  }, [channelName, token, eventName]);
}