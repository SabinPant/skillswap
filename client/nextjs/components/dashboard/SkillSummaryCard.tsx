"use client";

// components/dashboard/SkillSummaryCard.tsx
// Dashboard widget showing the user's skill counts (teach / learn).
//
// Fetches user skills via TanStack Query, computes teach/learn counts
// client-side, and renders a card with two stats and a "Manage Skills" link.
//
// States:
// - Loading: skeleton placeholder matching the card's shape
// - Empty: prompt to add first skill
// - Error: inline error message with retry button
// - Success: teach + learn counts with colored accents

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { get } from "@/lib/api-client";
import type { UserSkill } from "@/types/skill";
import type { ApiSuccess } from "@/types/api";

export default function SkillSummaryCard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user-skills"],
    queryFn: () => get<UserSkill[]>("/user-skills"),
    select: (response) => {
      // Extract the skills array from the success envelope
      const skills = (response as ApiSuccess<UserSkill[]>).data ?? [];
      return {
        teach: skills.filter((s) => s.can_teach).length,
        learn: skills.filter((s) => s.wants_to_learn).length,
        total: skills.length,
      };
    },
  });

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-lg border border-surface-warm-200 bg-white p-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-surface-warm-200 mb-4" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-2">
            <div className="h-8 w-12 rounded bg-surface-warm-200" />
            <div className="h-3 w-16 rounded bg-surface-warm-200" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-8 w-12 rounded bg-surface-warm-200" />
            <div className="h-3 w-16 rounded bg-surface-warm-200" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">
          {(error as { message?: string })?.message || "Failed to load skills."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────
  if (!data || data.total === 0) {
    return (
      <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
        <h3 className="font-display text-sm font-semibold text-surface-ink-700">
          Your Skills
        </h3>
        <p className="mt-2 text-sm text-surface-warm-500">
          List skills you can teach or want to learn to start exchanging.
        </p>
        <Link
          href="/skills"
          className="mt-3 inline-block rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
        >
          Add your first skill
        </Link>
      </div>
    );
  }

  // ── Data display ──────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-surface-ink-700 mb-4">
        Your Skills
      </h3>
      <div className="flex gap-6">
        {/* Teach count */}
        <div className="flex-1">
          <p className="text-2xl font-bold text-accent-teach-600 font-mono">
            {data.teach}
          </p>
          <p className="text-xs text-surface-warm-500 mt-0.5">You teach</p>
        </div>

        {/* Learn count */}
        <div className="flex-1">
          <p className="text-2xl font-bold text-accent-learn-600 font-mono">
            {data.learn}
          </p>
          <p className="text-xs text-surface-warm-500 mt-0.5">
            You want to learn
          </p>
        </div>
      </div>

      <Link
        href="/skills"
        className="mt-4 inline-flex items-center text-sm font-medium text-accent-teach-600 hover:text-accent-teach-700"
      >
        Manage your skills
        <svg
          className="ml-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}
