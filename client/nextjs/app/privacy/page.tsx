// app/privacy/page.tsx
// Privacy Policy — what data SkillSwap collects, how it's used,
// and your rights. Written to be readable, not just legally sound.

import type { Metadata } from "next";
import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — SkillSwap",
  description: "How SkillSwap collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-warm-200">
      <LandingHeader />

      <section className="bg-surface-ink-800 py-20 text-surface-warm-100 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent-teach-400">
            Privacy Policy
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            Your data,{" "}
            <span className="text-accent-learn-400">your control</span>.
          </h1>
          <p className="mt-4 text-surface-warm-300">
            Last updated: August 2026
          </p>
        </div>
      </section>

      <section className="bg-surface-warm-200 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <div className="space-y-16">
            {/* Overview */}
            <div>
              <h2 className="font-display text-2xl font-semibold">Overview</h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  SkillSwap is built on the principle that your data belongs to
                  you. We collect only what&apos;s necessary to make skill
                  exchange work — no more, no less. We never sell your data, we
                  never show ads, and we never share your information with third
                  parties except where required to provide the service (like
                  Cloudinary for avatar storage or Resend for email delivery).
                </p>
                <p>
                  This policy explains exactly what we collect, why we need it,
                  how long we keep it, and what rights you have over it.
                </p>
              </div>
            </div>

            {/* Information we collect */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Information we collect
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p className="font-semibold text-surface-ink-800">
                  Information you provide directly:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Account data.</strong> When you register, we collect
                    your full name, email address, and an optional location.
                    Your password is hashed with BCrypt — we never store or see
                    the plain text.
                  </li>
                  <li>
                    <strong>Profile data.</strong> Your bio, avatar image, and
                    skill listings (teach / learn) are stored to power your
                    public profile. Your avatar is uploaded to Cloudinary and
                    referenced by a public identifier.
                  </li>
                  <li>
                    <strong>Skill requests and messages.</strong> When you send
                    a skill request or chat with another user, those messages
                    and request details are stored so both participants can
                    reference them later.
                  </li>
                  <li>
                    <strong>Reviews.</strong> Ratings and comments you leave
                    after completed sessions are publicly visible on the
                    recipient&apos;s profile.
                  </li>
                </ul>
                <p className="font-semibold text-surface-ink-800 mt-6">
                  Information collected automatically:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Authentication tokens.</strong> When you log in, a
                    cryptographically random Sanctum token is generated and
                    stored (hashed) in our database. This token is used to
                    authenticate your API requests. It expires after 7 days and
                    is revoked when you log out or reset your password.
                  </li>
                  <li>
                    <strong>Email verification tokens.</strong> A single-use,
                    time-limited token (24 hours) is generated when you
                    register. It&apos;s stored in Redis with a SHA-256 hash and
                    deleted after successful verification.
                  </li>
                  <li>
                    <strong>Password reset tokens.</strong> A single-use,
                    time-limited token (1 hour) is generated when you request a
                    password reset. Same Redis-based storage as verification
                    tokens.
                  </li>
                  <li>
                    <strong>Rate limiting data.</strong> Your IP address is
                    temporarily stored in Redis to enforce rate limits on login
                    attempts, registration, and other sensitive endpoints. These
                    records expire automatically after their rate limit window
                    (typically 15 minutes to 1 hour).
                  </li>
                  <li>
                    <strong>Audit logs.</strong> Every skill request status
                    change and review creation writes an entry to an internal
                    audit log. This log records the action, the actor, the
                    entity affected, and relevant metadata — no message content
                    or personal data beyond what&apos;s necessary for the
                    record.
                  </li>
                </ul>
              </div>
            </div>

            {/* How we use it */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                How we use your information
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>To create and maintain your account.</li>
                  <li>
                    To display your public profile to other users (name, bio,
                    location, avatar, skills, ratings).
                  </li>
                  <li>
                    To enable skill requests, messaging, and reviews between
                    users.
                  </li>
                  <li>
                    To send transactional emails: email verification, password
                    reset, and notifications you&apos;ve opted into.
                  </li>
                  <li>
                    To enforce platform safety through rate limiting and audit
                    logging.
                  </li>
                  <li>
                    To improve the platform based on aggregated, anonymized
                    usage patterns.
                  </li>
                </ul>
                <p>
                  We do <strong>not</strong> use your data for advertising,
                  profiling, automated decision-making, or any purpose not
                  directly related to providing the SkillSwap service.
                </p>
              </div>
            </div>

            {/* Data storage & retention */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Data storage &amp; retention
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  Your personal data is stored in a PostgreSQL 15 database and
                  cached in Redis 7 for performance. Both run on servers you
                  control (self-hosted or managed providers like Render or
                  Neon). No data is stored on the client device beyond an
                  authentication token in your browser&apos;s localStorage.
                </p>
                <p>
                  <strong>Retention periods:</strong>
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Account data:</strong> Retained until you delete
                    your account.
                  </li>
                  <li>
                    <strong>Skill requests &amp; reviews:</strong> Retained even
                    after account deletion — the other participant still sees
                    their history with you, displayed as &ldquo;Deleted
                    User.&rdquo;
                  </li>
                  <li>
                    <strong>Messages:</strong> Immutable once sent. Retained
                    indefinitely for both participants.
                  </li>
                  <li>
                    <strong>Auth tokens:</strong> Deleted on logout, password
                    reset, or after 7-day expiry.
                  </li>
                  <li>
                    <strong>Verification &amp; reset tokens:</strong> Deleted
                    from Redis immediately after successful use, or after their
                    TTL expires (24 hours and 1 hour respectively).
                  </li>
                  <li>
                    <strong>Rate limit counters:</strong> Automatically expire
                    after their configured window (15 minutes to 1 hour).
                  </li>
                  <li>
                    <strong>Audit logs:</strong> Retained indefinitely for
                    platform integrity.
                  </li>
                </ul>
              </div>
            </div>

            {/* Third-party services */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Third-party services
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  SkillSwap relies on the following third-party services to
                  function:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Cloudinary.</strong> Avatar images and chat file
                    attachments are uploaded directly to Cloudinary from our
                    server. The frontend receives only a public identifier — the
                    raw file never transits through the client. See{" "}
                    <a
                      href="https://cloudinary.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-teach-600 underline"
                    >
                      Cloudinary&apos;s privacy policy
                    </a>
                    .
                  </li>
                  <li>
                    <strong>Resend.</strong> Transactional emails (verification,
                    password reset) are sent through Resend. See{" "}
                    <a
                      href="https://resend.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-teach-600 underline"
                    >
                      Resend&apos;s privacy policy
                    </a>
                    .
                  </li>
                </ul>
                <p>
                  No analytics, tracking, or advertising services are used
                  anywhere on SkillSwap.
                </p>
              </div>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="font-display text-2xl font-semibold">Cookies</h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  SkillSwap does not use cookies for authentication or tracking.
                  Authentication is handled entirely through Bearer tokens
                  stored in your browser&apos;s localStorage — not cookies. No
                  session cookies, no tracking cookies, no third-party cookies.
                </p>
                <p>
                  The only data stored in your browser is the authentication
                  token and a PusherJS transport preference for WebSocket
                  connections — both are essential for the platform to function
                  and are deleted when you log out.
                </p>
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="font-display text-2xl font-semibold">Security</h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>All passwords are hashed with BCrypt before storage.</li>
                  <li>
                    All API traffic is authenticated via cryptographically
                    random Bearer tokens.
                  </li>
                  <li>
                    Verification and reset tokens are single-use, SHA-256
                    hashed, and time-limited.
                  </li>
                  <li>
                    Rate limiting protects against brute-force attacks on login,
                    registration, and password reset.
                  </li>
                  <li>
                    File uploads are validated for MIME type and size
                    server-side before reaching Cloudinary.
                  </li>
                  <li>
                    Global exception handling ensures no stack traces, SQL
                    queries, or sensitive data ever leak to API responses.
                  </li>
                  <li>
                    Admin routes are protected by explicit middleware — role is
                    never inferred from client input.
                  </li>
                  <li>
                    All schema changes go through versioned database migrations
                    — no manual edits.
                  </li>
                </ul>
              </div>
            </div>

            {/* Your rights */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Your rights
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Access.</strong> You can view all your profile data,
                    skill listings, requests, messages, and reviews through the
                    platform interface at any time.
                  </li>
                  <li>
                    <strong>Correction.</strong> You can edit your profile
                    (name, bio, location, avatar) directly from the Profile
                    page. Skill listings can be added, updated, or removed from
                    the Manage Skills page.
                  </li>
                  <li>
                    <strong>Deletion.</strong> You can delete your account at
                    any time. Account deletion is a soft delete — your profile
                    is hidden, but your historical skill requests and reviews
                    are retained (displayed as &ldquo;Deleted User&rdquo;) so
                    the other participant&apos;s history remains intact.
                  </li>
                  <li>
                    <strong>Portability.</strong> You can request an export of
                    your data by contacting the administrator.
                  </li>
                  <li>
                    <strong>Objection.</strong> You can object to the processing
                    of your data by deleting your account or contacting the
                    administrator.
                  </li>
                </ul>
              </div>
            </div>

            {/* Data breach */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Data breach policy
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  In the event of a data breach, affected users will be notified
                  via the email address associated with their account within 72
                  hours of discovery. The breach will be documented, the attack
                  vector patched, and a post-mortem published if the scope
                  warrants it.
                </p>
              </div>
            </div>

            {/* Children */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Children&apos;s privacy
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  SkillSwap is not intended for users under the age of 13. We do
                  not knowingly collect data from children. If you believe a
                  child has provided personal information, contact the
                  administrator and the account will be removed.
                </p>
              </div>
            </div>

            {/* Changes */}
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Changes to this policy
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  This policy may be updated from time to time. Material changes
                  will be communicated to registered users via email. The date
                  at the top of this page indicates when the policy was last
                  revised.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="font-display text-2xl font-semibold">Contact</h2>
              <div className="mt-4 space-y-3 leading-relaxed text-surface-warm-700">
                <p>
                  For privacy-related questions, data export requests, or
                  account deletion, contact the administrator through the links
                  on the{" "}
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
