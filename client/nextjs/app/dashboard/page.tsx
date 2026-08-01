"use client";

// app/dashboard/page.tsx
// Dashboard — the home base after login.
//
// Composed of independent widgets, each with its own data fetching
// and error handling. No single loading state for the whole page —
// each widget handles its own loading/error/success states via
// TanStack Query.
//
// Widgets to be built:
// - VerificationBanner (if email unverified)
// - SkillSummaryCard
// - RequestsPanel (incoming + outgoing)
// - QuickActions

import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBanner from "@/components/dashboard/VerificationBanner";
import SkillSummaryCard from "@/components/dashboard/SkillSummaryCard";
import RequestsPanel from "@/components/dashboard/RequestsPanel";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-surface-ink-800">
          Dashboard
        </h1>

        {/* Verification banner — to be built */}
        <VerificationBanner />

        {/* Skill summary + quick actions — left column on desktop */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <SkillSummaryCard />
            <QuickActions />
          </div>

          {/* Requests panel — right column on desktop */}
          <div>
            <RequestsPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
