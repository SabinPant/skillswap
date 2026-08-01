"use client";

// app/providers.tsx
// Client-side providers — wraps the app in TanStack Query's
// QueryClientProvider. Separated from layout.tsx because the
// provider requires 'use client' and layout.tsx is a Server Component.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s before data is considered stale
            retry: 1, // retry once on failure
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
