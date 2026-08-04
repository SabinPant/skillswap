// app/page.tsx
// Public landing page – dark/light banded sections, "Exchange Ledger" aesthetic.
// Sections: Hero, How it works, Popular skills (real data), Stats, CTA, Footer.

import Link from "next/link";
import PopularSkills from "@/components/landing/PopularSkills";
import StatsSection from "@/components/landing/StatsSection";
import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-warm-200">
      {/* ── Nav ────────────────────────────────────────────────── */}

      <LandingHeader />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="bg-surface-ink-800 py-20 text-surface-warm-100 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left: headline + CTA */}
            <div>
              <p className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-learn-400">
                A skill exchange, not a marketplace
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.12] md:text-5xl">
                <span className="text-accent-teach-400">Teach</span> what you
                know.
                <br />
                <span className="text-accent-learn-400">Learn</span> what you
                don&apos;t.
              </h1>
              <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-surface-warm-300 md:text-lg">
                SkillSwap is a community where people trade skills directly no
                tuition, no fees. You teach guitar, someone teaches you Spanish.
                Reputation, not payment, keeps it honest.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/auth/register"
                  className="rounded-md bg-accent-teach-500 px-6 py-3 text-base font-semibold text-surface-ink-900 transition hover:opacity-90"
                >
                  Join SkillSwap
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-md border border-accent-learn-500 px-6 py-3 text-base font-semibold text-accent-learn-400 transition hover:opacity-90"
                >
                  See how it works
                </Link>
              </div>
            </div>

            {/* Right: ledger card */}
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-sm rounded-lg border border-surface-ink-600 bg-surface-ink-700 p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-surface-ink-600 pb-3">
                  <span className="font-mono text-xs text-surface-warm-500">
                    RECENT EXCHANGE
                  </span>
                  <span className="rounded bg-state-success-500/20 px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-state-success-400">
                    Complete
                  </span>
                </div>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-teach-100 text-sm font-bold text-accent-teach-600">
                      S
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="font-display font-semibold">Sabin</span>
                      <span className="text-surface-warm-400"> teaches </span>
                      <span className="font-medium text-accent-teach-400">
                        Java
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span className="font-mono text-lg text-surface-warm-500">
                      ⇄
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-learn-100 text-sm font-bold text-accent-learn-600">
                      P
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="font-display font-semibold">Prime</span>
                      <span className="text-surface-warm-400"> teaches </span>
                      <span className="font-medium text-accent-learn-400">
                        Photography
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-surface-ink-600 pt-3">
                  <span className="font-mono text-xs text-surface-warm-500">
                    📍 Kathmandu
                  </span>
                  <span className="text-surface-warm-500">·</span>
                  <span className="font-mono text-xs text-accent-teach-400">
                    ★ 4.9
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-surface-warm-200 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-teach-600">
            How it works
          </p>
          <h2 className="mb-14 font-display text-2xl font-semibold md:text-3xl">
            Four steps to your next skill
          </h2>
          <div className="grid grid-cols-1 divide-y divide-surface-warm-300 border-t border-surface-warm-300 md:grid-cols-4 md:divide-x md:divide-y-0">
            {[
              {
                num: "01",
                title: "List your skills",
                desc: "Add what you can teach and what you want to learn. Takes two minutes.",
              },
              {
                num: "02",
                title: "Find a match",
                desc: "Search by skill, category, or location for someone teaching what you want.",
              },
              {
                num: "03",
                title: "Exchange",
                desc: "Message, agree on a time, and meet — in person or online.",
              },
              {
                num: "04",
                title: "Review",
                desc: "Rate each other after the session. Reputation keeps SkillSwap honest.",
              },
            ].map((step) => (
              <div key={step.num} className="px-4 py-8 md:px-6 md:py-10">
                <span className="font-mono text-sm text-accent-teach-600">
                  {step.num}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-warm-700">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular skills (real data) ──────────────────────────── */}
      <section className="bg-surface-warm-100 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-learn-600">
            Explore skills
          </p>
          <h2 className="mb-10 font-display text-2xl font-semibold md:text-3xl">
            Popular skills being exchanged right now
          </h2>
          <PopularSkills />
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <StatsSection />

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-surface-warm-200 py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">
            Ready to trade skills?
          </h2>
          <p className="mt-4 text-surface-warm-700">
            Join a community where your knowledge is the only currency.
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-block rounded-md bg-accent-teach-500 px-8 py-3 text-base font-semibold text-surface-ink-900 transition hover:opacity-90"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <LandingFooter />
    </div>
  );
}
