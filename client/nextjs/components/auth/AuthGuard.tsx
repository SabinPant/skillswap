"use client";

// components/AuthGuard.tsx
// Client-side route protector for authenticated pages.
//
// On mount, hydrates the auth store from localStorage (if a token exists)
// and validates it against GET /auth/me. While hydration is in progress,
// a loading spinner is shown — children never render before auth is confirmed.
// Unauthenticated users are redirected to /login.
//
// Data fetching inside children is gated by the same isAuthenticated check,
// so no API calls fire before the guard clears.

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Hydrate auth state from stored token on mount
  useEffect(() => {
    hydrate().finally(() => setHydrated(true));
  }, [hydrate]);

  // Redirect to login once hydration confirms the user is unauthenticated
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // Still checking — show spinner
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-copper-400 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated (redirect effect above will fire)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — render the protected content
  return <>{children}</>;
}
