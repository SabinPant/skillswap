"use client";

// app/login/page.tsx
// Login page with email/password form.
//
// On successful login, redirects to /dashboard.
// Displays field-level validation errors from the backend's 422 response
// and domain errors (INVALID_CREDENTIALS, ACCOUNT_SUSPENDED) as a banner.
//
// Already-authenticated users are redirected to /dashboard on mount.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already logged in — skip the form
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;

      if (
        apiError.errors &&
        !Array.isArray(apiError.errors) &&
        Object.keys(apiError.errors).length > 0
      ) {
        setErrors(apiError.errors);
      } else {
        setGeneralError(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue exchanging skills
          </p>
        </div>

        {/* General error banner */}
        {generalError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {generalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
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
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600 focus:outline-none focus:ring-2 focus:ring-accent-teach-400 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Links */}
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-accent-teach-600 hover:text-accent-teach-500"
          >
            Create one
          </Link>
        </p>

        <p className="text-center text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-gray-500 hover:text-gray-700"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
