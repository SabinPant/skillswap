// app/trust/page.tsx
// Trust & Safety — how SkillSwap builds trust through reputation,
// reviews, and moderation. No payment = social enforcement.

import type { Metadata } from "next";
import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "Trust & Safety — SkillSwap",
  description:
    "How SkillSwap builds trust through reputation, reviews, and moderation — no money involved.",
};

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-surface-warm-200">
      <LandingHeader />

      {/* Hero */}
      <section className="bg-surface-ink-800 py-20 text-surface-warm-100 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-learn-400">
            Trust &amp; Safety
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            Trust built on{" "}
            <span className="text-accent-teach-400">reputation</span>, not{" "}
            <span className="text-accent-learn-400">money</span>.
          </h1>
          <p className="mt-4 text-surface-warm-300">
            No payments. No escrow. Just a community where your track record
            speaks for itself.
          </p>
        </div>
      </section>

      {/* How reputation works */}
      <section className="bg-surface-warm-200 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-2xl font-semibold">
            How reputation works
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-surface-warm-700">
            <p>
              SkillSwap replaces payment with reputation. Every completed
              session ends with both participants rating each other on a 1–5
              star scale and leaving an optional comment. These reviews are
              public and permanently linked to your profile.
            </p>
            <p>
              Your profile shows your average rating, total sessions taught, and
              total sessions learned — three numbers that give other members a
              clear picture of your experience before they ever send you a
              request.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Star ratings",
                desc: "1–5 stars after every completed session. Both participants review each other independently.",
              },
              {
                title: "Written reviews",
                desc: "Optional comments provide context beyond the rating. Visible on your public profile.",
              },
              {
                title: "Session count",
                desc: "Total sessions taught and learned are tracked separately. A high count builds trust over time.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-surface-warm-200 bg-white p-5"
              >
                <h3 className="font-display font-semibold text-surface-ink-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-surface-warm-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Moderation */}
      <section className="bg-surface-warm-100 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-2xl font-semibold">
            How we moderate
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-surface-warm-700">
            <p>
              While the community is largely self-regulating through reviews,
              SkillSwap has moderation tools to handle edge cases:
            </p>
            <ul className="list-disc space-y-3 pl-5">
              <li>
                <strong className="text-surface-ink-800">
                  Review moderation.
                </strong>{" "}
                Admin can hide a review&apos;s comment if it violates community
                guidelines. The numeric rating still counts toward the
                recipient&apos;s average — only the written content is hidden
                from public view.
              </li>
              <li>
                <strong className="text-surface-ink-800">
                  Account suspension.
                </strong>{" "}
                Admin can temporarily suspend accounts that repeatedly violate
                guidelines. Suspended users cannot log in, send requests, or
                accept requests, but their historical data remains visible to
                people they&apos;ve interacted with.
              </li>
              <li>
                <strong className="text-surface-ink-800">Audit logs.</strong>{" "}
                Every skill request status change and every review creation
                writes to an internal audit log. Nothing happens silently — if a
                dispute ever needs investigation, the record is there.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="bg-surface-warm-200 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="font-display text-2xl font-semibold">
            Tips for safe exchanges
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-surface-warm-700">
            <ul className="list-disc space-y-3 pl-5">
              <li>
                <strong className="text-surface-ink-800">
                  Read profiles first.
                </strong>{" "}
                Check someone&apos;s rating, review history, and completed
                sessions before sending a request.
              </li>
              <li>
                <strong className="text-surface-ink-800">
                  Use the built-in chat.
                </strong>{" "}
                All communication should happen through SkillSwap&apos;s
                messaging system — it keeps a record and ensures both
                participants are who they say they are.
              </li>
              <li>
                <strong className="text-surface-ink-800">
                  Meet in public spaces.
                </strong>{" "}
                For in-person sessions, choose a public place like a library,
                café, or community center.
              </li>
              <li>
                <strong className="text-surface-ink-800">
                  Share video links in chat.
                </strong>{" "}
                For online sessions, share the meeting link through
                SkillSwap&apos;s chat — not through external messaging apps.
              </li>
              <li>
                <strong className="text-surface-ink-800">
                  Leave honest reviews.
                </strong>{" "}
                Your review helps the next person make an informed decision.
                Rate fairly and write constructively.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What to do */}
      <section className="bg-surface-ink-800 py-16 text-surface-warm-100 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <h2 className="font-display text-2xl font-semibold">
            Something go wrong?
          </h2>
          <p className="mt-6 leading-relaxed text-surface-warm-300">
            If you experience harassment, inappropriate behavior, or any other
            issue, contact the administrator directly.{" "}
            <span className="text-accent-teach-400">
              In-app reporting is on the roadmap.
            </span>{" "}
            For now, reach out through the platform&apos;s support channels or
            the contact information listed on the About page.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
