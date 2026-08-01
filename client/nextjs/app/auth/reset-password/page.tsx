"use client";

// app/auth/reset-password/page.tsx
// Reset password page — deep-linked from the password reset email.
//
// Reads the token from ?token= in the URL, shows a new password form,
// and calls POST /auth/reset-password on submit.
//
// On success, the backend revokes all existing tokens, so the user
// must log in again. A success message with a link to /auth/login is shown.
//
// States:
// - Missing token: error immediately (derived from URL, no effect needed)
// - Form: password + confirmation fields
// - Loading: submitting
// - Success: password reset → link to sign in
// - Error: invalid/expired token or server error

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { post } from "@/lib/api-client";
import type { ApiError } from "@/types/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(
    token
      ? null
      : "No reset token found. Please check your email link and try again.",
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Missing token — show error (no form)
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
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
            Invalid link
          </h1>
          <p className="text-sm text-surface-warm-500">{generalError}</p>
          <Link
            href="/auth/forgot-password"
            className="inline-block w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
            Password reset
          </h1>
          <p className="text-sm text-surface-warm-500">
            Your password has been reset successfully. Please sign in with your
            new password.
          </p>
          <Link
            href="/auth/login"
            className="inline-block w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Form state
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setLoading(true);

    try {
      await post("/auth/reset-password", {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      const apiError = err as ApiError;

      if (
        apiError.errors &&
        !Array.isArray(apiError.errors) &&
        Object.keys(apiError.errors).length > 0
      ) {
        setErrors(apiError.errors);
      } else {
        setGeneralError(
          apiError.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display text-surface-ink-800">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-surface-warm-500">
            Enter your new password below.
          </p>
        </div>

        {generalError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-surface-ink-700"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium text-surface-ink-700"
            >
              Confirm new password
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600 focus:outline-none focus:ring-2 focus:ring-accent-teach-400 disabled:opacity-50"
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
