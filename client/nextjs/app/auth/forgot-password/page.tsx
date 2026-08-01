"use client";

// app/forgot-password/page.tsx
// Forgot password page — accepts an email and always shows a generic
// success message regardless of whether the email exists (enumeration
// protection, matching the backend's silent-return behaviour).
//
// Public route — no AuthGuard needed.

import { useState } from "react";
import Link from "next/link";
import { post } from "@/lib/api-client";
import type { ApiError } from "@/types/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await post("/auth/forgot-password", { email });
      // Always show success — the backend silently swallows unknown emails
      setSubmitted(true);
    } catch (err) {
      // Only network-level / unexpected errors would reach here;
      // the backend never returns domain errors for unknown emails.
      const apiError = err as ApiError;
      setError(apiError.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state — generic message, no indication of whether email existed
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
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
            Check your email
          </h1>
          <p className="text-sm text-surface-warm-500">
            If an account exists for {email}, we&apos;ve sent a password reset
            link. Please check your inbox and follow the instructions.
          </p>
          <Link
            href="/auth/login"
            className="inline-block w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600 focus:outline-none focus:ring-2 focus:ring-accent-teach-400"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display text-surface-ink-800">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-surface-warm-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-surface-ink-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600 focus:outline-none focus:ring-2 focus:ring-accent-teach-400 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-surface-warm-500">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-accent-teach-600 hover:text-accent-teach-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
