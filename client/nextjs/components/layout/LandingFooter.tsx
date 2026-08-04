// components/layout/LandingFooter.tsx
// Public footer for landing, About, Trust, Privacy, and Terms pages.

import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-surface-ink-900 py-12 text-surface-warm-300">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex flex-col gap-8 border-b border-surface-ink-700 pb-10 md:flex-row md:justify-between">
          <div>
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
            <p className="mt-3 max-w-[26ch] font-display text-sm italic text-surface-warm-500">
              Skills change hands. Nothing else does.
            </p>
          </div>
          <div className="flex gap-10">
            <div>
              <h4 className="mb-3 font-mono text-[0.7rem] uppercase tracking-widest text-surface-warm-500">
                Product
              </h4>
              <Link
                href="/#how-it-works"
                className="mb-2 block text-sm transition hover:text-surface-warm-50"
              >
                How it works
              </Link>
              <Link
                href="/skills"
                className="mb-2 block text-sm transition hover:text-surface-warm-50"
              >
                Browse skills
              </Link>
              <Link
                href="/auth/register"
                className="block text-sm transition hover:text-surface-warm-50"
              >
                Join free
              </Link>
            </div>
            <div>
              <h4 className="mb-3 font-mono text-[0.7rem] uppercase tracking-widest text-surface-warm-500">
                Company
              </h4>
              <Link
                href="/about"
                className="mb-2 block text-sm transition hover:text-surface-warm-50"
              >
                About
              </Link>
              <Link
                href="/trust"
                className="block text-sm transition hover:text-surface-warm-50"
              >
                Trust and safety
              </Link>
            </div>
            <div>
              <h4 className="mb-3 font-mono text-[0.7rem] uppercase tracking-widest text-surface-warm-500">
                Legal
              </h4>
              <Link
                href="/privacy"
                className="mb-2 block text-sm transition hover:text-surface-warm-50"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="block text-sm transition hover:text-surface-warm-50"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 font-mono text-xs text-surface-warm-700">
          <span>© 2026 SkillSwap</span>
          <span>⇄</span>
        </div>
      </div>
    </footer>
  );
}
