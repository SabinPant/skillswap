"use client";

// app/requests/page.tsx
// Full request list — incoming (as teacher) and outgoing (as learner).
//
// Two tabs toggle between the two lists. Each list is fetched
// independently via TanStack Query. Status badges match the detail page.
// Empty states prompt the user to browse skills.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { get } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { SkillRequest } from "@/types/skillRequest";
import type { ApiSuccess, ApiError } from "@/types/api";

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
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_COLORS[status] || "bg-surface-warm-200 text-surface-warm-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function RequestsPage() {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");

  const incomingQuery = useQuery({
    queryKey: ["skill-requests", "incoming"],
    queryFn: () => get<SkillRequest[]>("/skill-requests?role=teacher"),
    select: (res) => (res as ApiSuccess<SkillRequest[]>).data ?? [],
  });

  const outgoingQuery = useQuery({
    queryKey: ["skill-requests", "outgoing"],
    queryFn: () => get<SkillRequest[]>("/skill-requests?role=learner"),
    select: (res) => (res as ApiSuccess<SkillRequest[]>).data ?? [],
  });

  const activeQuery = tab === "incoming" ? incomingQuery : outgoingQuery;
  const requests = activeQuery.data ?? [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const error = activeQuery.error;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <h1 className="font-display text-2xl font-bold text-surface-ink-800">
          My Requests
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-surface-warm-200">
          <button
            onClick={() => setTab("incoming")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "incoming"
                ? "border-b-2 border-accent-teach-500 text-accent-teach-700"
                : "text-surface-warm-500 hover:text-surface-ink-600"
            }`}
          >
            Incoming
          </button>
          <button
            onClick={() => setTab("outgoing")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "outgoing"
                ? "border-b-2 border-accent-teach-500 text-accent-teach-700"
                : "text-surface-warm-500 hover:text-surface-ink-600"
            }`}
          >
            Outgoing
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-surface-warm-200 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-surface-warm-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-surface-warm-200" />
                    <div className="h-3 w-24 rounded bg-surface-warm-200" />
                  </div>
                  <div className="h-5 w-16 rounded bg-surface-warm-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              {(error as unknown as ApiError)?.message ||
                "Failed to load requests."}
            </p>
            <button
              onClick={() => activeQuery.refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && requests.length === 0 && (
          <div className="rounded-lg border border-surface-warm-200 bg-white p-12 text-center">
            <p className="text-sm text-surface-warm-500">
              {tab === "incoming"
                ? "No incoming requests yet. When someone wants to learn from you, they'll appear here."
                : "No outgoing requests yet."}
            </p>
            <Link
              href="/skills"
              className="mt-3 inline-block rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              Browse skills
            </Link>
          </div>
        )}

        {/* Request list */}
        {!isLoading && !isError && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => {
              const otherPerson =
                tab === "incoming" ? req.learner : req.teacher;

              return (
                <Link
                  key={req.id}
                  href={`/requests/${req.id}`}
                  className="block rounded-lg border border-surface-warm-200 bg-white p-4 transition-colors hover:border-accent-teach-300 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-teach-100 text-sm font-bold text-accent-teach-400">
                      {(otherPerson?.name ?? "?").charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-surface-ink-700">
                        {tab === "incoming"
                          ? `${otherPerson?.name ?? "Unknown"} wants to learn ${req.skill?.name ?? "a skill"}`
                          : `You want to learn ${req.skill?.name ?? "a skill"} from ${otherPerson?.name ?? "Unknown"}`}
                      </p>
                      <p className="mt-0.5 text-xs text-surface-warm-400">
                        {req.proposed_at
                          ? new Date(req.proposed_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "No date proposed"}
                      </p>
                    </div>

                    {/* Status */}
                    <StatusBadge status={req.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* New request button */}
        <Link
          href="/skills"
          className="inline-flex items-center text-sm font-medium text-accent-teach-600 hover:text-accent-teach-700"
        >
          ← Browse more skills
        </Link>
      </div>
    </DashboardLayout>
  );
}
