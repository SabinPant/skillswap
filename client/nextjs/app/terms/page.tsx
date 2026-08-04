// app/terms/page.tsx
// Terms of Service — rules, responsibilities, and limitations
// for using SkillSwap.

import type { Metadata } from "next";
import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "Terms of Service — SkillSwap",
  description: "The rules and responsibilities for using SkillSwap.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-warm-200">
      <LandingHeader />

      <section className="bg-surface-ink-800 py-20 text-surface-warm-100 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-learn-400">
            Terms of Service
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            The rules of <span className="text-accent-teach-400">exchange</span>
            .
          </h1>
          <p className="mt-4 text-surface-warm-300">
            Last updated: August 2026
          </p>
        </div>
      </section>

      <section className="bg-surface-warm-200 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <div className="space-y-16">
            {/* Acceptance */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                1. Acceptance of terms
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  By creating an account on SkillSwap, you agree to these Terms
                  of Service. If you do not agree, do not use the platform.
                  These terms may be updated from time to time — continued use
                  after changes constitutes acceptance.
                </p>
              </div>
            </div>

            {/* Eligibility */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                2. Eligibility
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  You must be at least 13 years old to use SkillSwap. By
                  registering, you represent that you meet this age requirement.
                  Accounts found to be in violation will be suspended.
                </p>
              </div>
            </div>

            {/* Account responsibility */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                3. Account responsibility
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your login credentials.
                  </li>
                  <li>
                    You are responsible for all activity that occurs under your
                    account.
                  </li>
                  <li>
                    You must provide accurate and truthful information when
                    creating your profile and listing skills.
                  </li>
                  <li>
                    You may not create multiple accounts to manipulate ratings,
                    reviews, or the skill request system.
                  </li>
                  <li>
                    You may not impersonate another person or misrepresent your
                    skills or qualifications.
                  </li>
                </ul>
              </div>
            </div>

            {/* User conduct */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                4. User conduct
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>When using SkillSwap, you agree not to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Harass, abuse, or threaten other users.</li>
                  <li>
                    Post inappropriate, offensive, or illegal content in your
                    profile, messages, or reviews.
                  </li>
                  <li>
                    Use the platform for any commercial purpose not related to
                    skill exchange.
                  </li>
                  <li>
                    Attempt to circumvent the reputation system through fake
                    reviews or coordinated rating manipulation.
                  </li>
                  <li>
                    Upload malicious files, attempt to exploit security
                    vulnerabilities, or interfere with the platform&apos;s
                    operation.
                  </li>
                  <li>
                    Use automated tools (bots, scrapers) to access the platform
                    without permission.
                  </li>
                </ul>
                <p>
                  Violation of these terms may result in account suspension or
                  termination at the administrator&apos;s discretion.
                </p>
              </div>
            </div>

            {/* Skill requests and sessions */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                5. Skill requests and sessions
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    SkillSwap facilitates connections between users but does not
                    guarantee the quality of any session.
                  </li>
                  <li>
                    Users are solely responsible for coordinating session
                    logistics — time, location, and format — through the
                    platform&apos;s chat system.
                  </li>
                  <li>
                    SkillSwap does not host video calls, provide meeting spaces,
                    or mediate disputes between users.
                  </li>
                  <li>
                    Neither party is obligated to complete a session. Either
                    participant may cancel an accepted request with a reason.
                  </li>
                  <li>
                    Sessions are a mutual agreement between two individuals.
                    SkillSwap bears no liability for outcomes, damages, or
                    disputes arising from sessions.
                  </li>
                </ul>
              </div>
            </div>

            {/* No payment */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                6. No payment, no fees
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  SkillSwap does not process payments, charge commissions, or
                  facilitate financial transactions of any kind. The platform is
                  designed for reciprocal skill exchange only. Any financial
                  arrangements made between users outside the platform are not
                  endorsed, facilitated, or mediated by SkillSwap.
                </p>
              </div>
            </div>

            {/* Intellectual property */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                7. Intellectual property
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  You retain ownership of all content you create and share on
                  SkillSwap — your profile, messages, skill listings, and
                  reviews. By posting content, you grant SkillSwap a
                  non-exclusive, royalty-free license to display it on the
                  platform as necessary to provide the service (e.g., showing
                  your profile to other users).
                </p>
                <p>
                  The SkillSwap name, logo, and platform code are the property
                  of the platform owner. You may not copy, modify, or
                  redistribute them without permission.
                </p>
              </div>
            </div>

            {/* Termination */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                8. Account termination
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>By you.</strong> You may delete your account at any
                    time. Deletion is a soft delete — your profile is hidden,
                    but your historical skill requests and reviews are retained
                    (displayed as &ldquo;Deleted User&rdquo;) to preserve the
                    other participant&apos;s history.
                  </li>
                  <li>
                    <strong>By us.</strong> SkillSwap reserves the right to
                    suspend or terminate accounts that violate these terms, at
                    the administrator&apos;s sole discretion. Suspended users
                    may appeal by contacting the administrator.
                  </li>
                </ul>
              </div>
            </div>

            {/* Disclaimer */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                9. Disclaimer of warranties
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  SkillSwap is provided &ldquo;as is&rdquo; and &ldquo;as
                  available&rdquo; without warranties of any kind, either
                  express or implied. We do not warrant that the platform will
                  be uninterrupted, error-free, or completely secure. You use
                  SkillSwap at your own risk.
                </p>
              </div>
            </div>

            {/* Limitation of liability */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                10. Limitation of liability
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  To the fullest extent permitted by law, SkillSwap and its
                  owner shall not be liable for any indirect, incidental,
                  special, or consequential damages arising from your use of the
                  platform — including but not limited to disputes between
                  users, session outcomes, data loss, or reputational harm.
                </p>
              </div>
            </div>

            {/* Governing law */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                11. Governing law
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  These terms are governed by the laws of Nepal. Any disputes
                  shall be resolved in the courts of Kathmandu, Nepal.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                12. Contact
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  For questions about these terms, contact the administrator
                  through the links on the{" "}
                  <a href="/about" className="text-accent-teach-600 underline">
                    About page
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
