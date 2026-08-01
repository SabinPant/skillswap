"use client";

// components/dashboard/VerificationBanner.tsx
// Banner shown on the dashboard when the user's email is not yet verified.
//
// Reads email_verified_at from the auth store. If null, renders a
// persistent banner with a "Resend verification" button.
//
// Uses TanStack Query's useMutation for the resend API call —
// keeps the component thin (no manual loading/error state management).

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export default function VerificationBanner() {
  const { user, isEmailVerified, resendVerification } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  const mutation = useMutation({
    mutationFn: resendVerification,
  });

  // Already verified, no user, or dismissed — don't render
  if (isEmailVerified || !user || dismissed) {
    return null;
  }

  return (
    <div className="rounded-md border border-accent-teach-200 bg-accent-teach-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-accent-teach-800">
            Please verify your email to start exchanging skills
          </p>
          <p className="mt-1 text-sm text-accent-teach-600">
            We sent a verification email to{" "}
            <span className="font-medium">{user.email}</span>.
          </p>

          {mutation.isSuccess && (
            <p className="mt-2 text-sm font-medium text-state-success-600">
              Verification email resent — check your inbox!
            </p>
          )}

          {mutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(mutation.error as { message?: string })?.message ||
                "Failed to resend. Please try again."}
            </p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="mt-3 rounded-md bg-accent-teach-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
          >
            {mutation.isPending ? "Sending…" : "Resend verification email"}
          </button>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-accent-teach-400 hover:text-accent-teach-600"
          aria-label="Dismiss"
        >
          <svg
            className="h-5 w-5"
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
        </button>
      </div>
    </div>
  );
}
