// components/layout/LandingHeader.tsx
// Public header for landing, About, Trust, Privacy, and Terms pages.
// Sticky nav with logo, links, and CTA — matches the landing page design.

import Link from "next/link";

export default function LandingHeader() {
  return (
    <nav className="sticky top-0 z-10 border-b border-surface-ink-600 bg-surface-ink-800">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg font-semibold text-surface-warm-100"
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              d="M6 12c2-5 8-7 13-5"
              stroke="#b8863f"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M15 5l4 2-3 4"
              stroke="#b8863f"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M26 20c-2 5-8 7-13 5"
              stroke="#4b8e8d"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M17 27l-4-2 3-4"
              stroke="#4b8e8d"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          SkillSwap
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/#how-it-works"
            className="hidden text-sm text-surface-warm-300 transition hover:text-surface-warm-50 sm:inline"
          >
            How it works
          </Link>
          <Link
            href="/about"
            className="hidden text-sm text-surface-warm-300 transition hover:text-surface-warm-50 sm:inline"
          >
            About
          </Link>
          <Link
            href="/auth/login"
            className="hidden text-sm text-surface-warm-300 transition hover:text-surface-warm-50 sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-surface-ink-900 transition hover:opacity-90"
          >
            Join free
          </Link>
        </div>
      </div>
    </nav>
  );
}
