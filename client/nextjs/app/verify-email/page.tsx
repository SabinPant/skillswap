"use client";

// app/verify-email/page.tsx
// Email verification page — deep-linked from the verification email.
//
// Reads the token from ?token= in the URL, calls POST /auth/verify-email
// on mount, and updates the cached user in the auth store on success.
//
// States handled:
// - Missing token: no ?token= param → error immediately (derived, not effect)
// - Loading: verifying token (spinner)
// - Success: email verified → redirect to /dashboard after 2s
// - Error: invalid/expired token → show message + link to dashboard

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { post } from "@/lib/api-client";
import type { AuthUser } from "@/types/user";
import type { ApiError } from "@/types/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const token = searchParams.get("token");

  // Missing token is derived synchronously from props — no effect needed
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    token
      ? ""
      : "No verification token found. Please check your email link and try again.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const verify = async () => {
      try {
        const response = await post<AuthUser>("/auth/verify-email", { token });

        if (cancelled) return;

        if (response.data) {
          setUser(response.data);
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        if (cancelled) return;

        const apiError = err as ApiError;
        setStatus("error");
        setErrorMessage(
          apiError.message || "Verification failed. The link may have expired.",
        );
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, setUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Loading state */}
        {status === "loading" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-accent-teach-500 border-t-transparent" />
            <h1 className="text-2xl font-bold font-display text-surface-ink-800">
              Verifying your email...
            </h1>
            <p className="text-sm text-surface-warm-500">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {/* Success state */}
        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-state-success-100">
              <svg
                className="h-6 w-6 text-state-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-display text-surface-ink-800">
              Email verified!
            </h1>
            <p className="text-sm text-surface-warm-500">
              Your email has been confirmed. Redirecting to your dashboard...
            </p>
          </>
        )}

        {/* Error state */}
        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-display text-surface-ink-800">
              Verification failed
            </h1>
            <p className="text-sm text-surface-warm-500">{errorMessage}</p>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="inline-block w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600 focus:outline-none focus:ring-2 focus:ring-accent-teach-400"
              >
                Go to dashboard
              </Link>
              <p className="text-xs text-surface-warm-400">
                Need a new verification email?{" "}
                <Link
                  href="/dashboard"
                  className="underline hover:text-surface-warm-600"
                >
                  Go to your dashboard to resend it
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
