// app/about/page.tsx
// About SkillSwap — the mission, the builder, and the vision.

import type { Metadata } from "next";
import Link from "next/link";
import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "About — SkillSwap",
  description:
    "Built by one developer who believes skills matter more than money.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-warm-200">
      <LandingHeader />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-surface-ink-800 py-20 text-surface-warm-100 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-teach-400">
            About SkillSwap
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            Built by one developer who believes{" "}
            <span className="text-accent-teach-400">skills</span> matter more
            than <span className="text-accent-learn-400">money</span>.
          </h1>
        </div>
      </section>

      {/* ── The Problem ───────────────────────────────────────── */}
      <section className="bg-surface-warm-200 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-2xl font-semibold">
            Why SkillSwap exists
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-surface-warm-700">
            <p>
              Learning a new skill usually costs money courses, tutors,
              subscriptions. But what if the person who wants to learn guitar
              already knows something the guitar teacher wants to learn, like
              Spanish or Python?
            </p>
            <p>
              SkillSwap flips the model. Instead of paying for lessons, you
              trade skills directly with another person. Your knowledge is the
              currency. Reputation built through reviews and completed sessions
              keeps the community honest, not payment escrow or platform fees.
            </p>
            <p>
              No ads. No subscriptions. No commissions. Just a place where
              people exchange what they know, one session at a time.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-surface-warm-100 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-2xl font-semibold">
            How the platform works
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              {
                step: "01",
                title: "List your skills",
                desc: "Add skills you can teach and skills you want to learn.",
              },
              {
                step: "02",
                title: "Find a match",
                desc: "Search by skill name, category, or location.",
              },
              {
                step: "03",
                title: "Send a request",
                desc: "Propose a time and message. Chat unlocks automatically.",
              },
              {
                step: "04",
                title: "Complete & review",
                desc: "Mark the session complete and rate each other.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-surface-warm-200 bg-white p-5"
              >
                <span className="font-mono text-sm text-accent-teach-600">
                  {item.step}
                </span>
                <h3 className="mt-2 font-display font-semibold">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-surface-warm-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Builder ───────────────────────────────────────── */}
      <section className="bg-surface-warm-200 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-2xl font-semibold">The builder</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-surface-warm-700">
            <p>
              <span className="font-semibold text-surface-ink-800">I Am</span> a
              full-stack developer based in Kathmandu, Nepal. I built SkillSwap
              as a solo project designing the database schema, writing every API
              endpoint, and crafting the frontend from scratch to prove that a
              peer-to-peer skill exchange platform can be built by one person
              with modern tools.
            </p>
            <p>
              The backend is built with Laravel 13 and PostgreSQL 15, the
              frontend with Next.js 16 and TypeScript, styled with Tailwind CSS
              v4. Real-time chat runs on Laravel Reverb (WebSockets), file
              uploads go through Cloudinary, and the whole system is
              containerized with Docker. Automated tests cover every critical
              path 104 tests, 241 assertions, CI-green.
            </p>
            <p>
              I hold five AWS certifications and builds backend systems in Java,
              Spring Boot, Node.js, NestJS, and Express. Right now focusing on
              system design and reliability, working toward enterprise-grade
              infrastructure where correctness and scale are critical.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="https://github.com/SabinPant"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-surface-ink-600 px-4 py-2 text-sm font-medium text-surface-ink-700 transition hover:bg-surface-ink-600 hover:text-surface-warm-50"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
              </svg>
              GitHub
            </Link>
            <Link
              href="https://www.linkedin.com/in/sabinpant/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-surface-ink-600 px-4 py-2 text-sm font-medium text-surface-ink-700 transition hover:bg-surface-ink-600 hover:text-surface-warm-50"
            >
              LinkedIn
            </Link>
            <Link
              href="https://sabinpant.com.np/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-surface-ink-600 px-4 py-2 text-sm font-medium text-surface-ink-700 transition hover:bg-surface-ink-600 hover:text-surface-warm-50"
            >
              Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ── The Vision ────────────────────────────────────────── */}
      <section className="bg-surface-ink-800 py-16 text-surface-warm-100 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <h2 className="font-display text-2xl font-semibold">The vision</h2>
          <p className="mt-6 leading-relaxed text-surface-warm-300">
            SkillSwap is built to grow into a global community where anyone can
            exchange skills freely no fees, no ads, no gatekeepers. The roadmap
            includes smart matching algorithms, in-app scheduling, video call
            integration, group sessions, and skill endorsements. But the core
            idea will always stay the same:{" "}
            <span className="text-accent-teach-400">teach what you know</span>,{" "}
            <span className="text-accent-learn-400">
              learn what you don&apos;t
            </span>
            .
          </p>
          <div className="mt-8">
            <Link
              href="/auth/register"
              className="inline-block rounded-md bg-accent-teach-500 px-6 py-3 text-base font-semibold text-surface-ink-900 transition hover:opacity-90"
            >
              Join the community
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
