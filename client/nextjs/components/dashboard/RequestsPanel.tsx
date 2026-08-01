"use client";

// components/dashboard/RequestsPanel.tsx
// Dashboard widget showing the user's latest incoming and outgoing
// skill requests (5 each), with status badges and links to view all.
//
// Fetches both directions in parallel via TanStack Query, slices
// the first 5 from each array client-side.
//
// States per direction:
// - Loading: skeleton rows
// - Empty: friendly message
// - Error: inline error with retry
// - Success: request list with status badges

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { get } from "@/lib/api-client";
import type { SkillRequest } from "@/types/skillRequest";
import type { ApiSuccess } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-state-success-100 text-state-success-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-accent-learn-100 text-accent-learn-700",
  cancelled: "bg-surface-warm-200 text-surface-warm-600",
  expired: "bg-surface-warm-200 text-surface-warm-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_COLORS[status] || "bg-surface-warm-200 text-surface-warm-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function RequestsPanel() {
  const incoming = useQuery({
    queryKey: ["skill-requests", "incoming"],
    queryFn: () => get<SkillRequest[]>("/skill-requests?role=teacher"),
    select: (response) => {
      const items = (response as ApiSuccess<SkillRequest[]>).data ?? [];
      return items.slice(0, 5);
    },
  });

  const outgoing = useQuery({
    queryKey: ["skill-requests", "outgoing"],
    queryFn: () => get<SkillRequest[]>("/skill-requests?role=learner"),
    select: (response) => {
      const items = (response as ApiSuccess<SkillRequest[]>).data ?? [];
      return items.slice(0, 5);
    },
  });

  // ── Loading skeleton ──────────────────────────────────────────────
  if (incoming.isLoading || outgoing.isLoading) {
    return (
      <div className="rounded-lg border border-surface-warm-200 bg-white p-5 animate-pulse">
        <div className="h-4 w-28 rounded bg-surface-warm-200 mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2 border-b border-surface-warm-100 last:border-0"
          >
            <div className="h-8 w-8 rounded-full bg-surface-warm-200" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-32 rounded bg-surface-warm-200" />
              <div className="h-3 w-20 rounded bg-surface-warm-200" />
            </div>
            <div className="h-5 w-16 rounded bg-surface-warm-200" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error states ──────────────────────────────────────────────────
  if (incoming.isError && outgoing.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">Failed to load requests.</p>
        <button
          onClick={() => {
            incoming.refetch();
            outgoing.refetch();
          }}
          className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];
  const isEmpty = incomingList.length === 0 && outgoingList.length === 0;

  // ── Empty state ───────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
        <h3 className="font-display text-sm font-semibold text-surface-ink-700">
          Skill Requests
        </h3>
        <p className="mt-2 text-sm text-surface-warm-500">
          When someone wants to learn from you or you request a teacher,
          they&apos;ll appear here.
        </p>
        <Link
          href="/skills"
          className="mt-3 inline-block rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
        >
          Browse skills to get started
        </Link>
      </div>
    );
  }

  // ── Data display ──────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-surface-ink-700 mb-4">
        Skill Requests
      </h3>

      {/* Incoming requests */}
      {incomingList.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-surface-warm-500 uppercase tracking-wide mb-2">
            Incoming ({incomingList.length})
          </p>
          <ul className="space-y-2">
            {incomingList.map((req) => (
              <li key={req.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-surface-ink-700 truncate">
                  <span className="font-medium">
                    {req.learner?.name ?? "Unknown"}
                  </span>
                  {" wants to learn "}
                  <span className="font-medium">
                    {req.skill?.name ?? "a skill"}
                  </span>
                </span>
                <StatusBadge status={req.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outgoing requests */}
      {outgoingList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-warm-500 uppercase tracking-wide mb-2">
            Outgoing ({outgoingList.length})
          </p>
          <ul className="space-y-2">
            {outgoingList.map((req) => (
              <li key={req.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-surface-ink-700 truncate">
                  <span className="font-medium">You</span>
                  {" want to learn "}
                  <span className="font-medium">
                    {req.skill?.name ?? "a skill"}
                  </span>
                  {" from "}
                  <span className="font-medium">
                    {req.teacher?.name ?? "Unknown"}
                  </span>
                </span>
                <StatusBadge status={req.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/requests"
        className="mt-4 inline-flex items-center text-sm font-medium text-accent-teach-600 hover:text-accent-teach-700"
      >
        View all requests
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
