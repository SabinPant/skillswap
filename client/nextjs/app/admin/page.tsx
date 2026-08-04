"use client";

// app/admin/page.tsx
// Admin dashboard — platform overview with key metrics.
// Fetches from GET /api/v1/admin/stats.

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import AdminLayout from "@/components/admin/AdminLayout";
import type { ApiSuccess } from "@/types/api";

interface AdminStats {
  users: number;
  skills: number;
  total_requests: number;
  completed_requests: number;
  completion_rate: number;
  average_rating: number;
}

const metricCards = [
  {
    key: "users",
    label: "Total users",
    color: "text-accent-teach-600",
    bg: "bg-accent-teach-50",
  },
  {
    key: "skills",
    label: "Skills in taxonomy",
    color: "text-accent-learn-600",
    bg: "bg-accent-learn-50",
  },
  {
    key: "total_requests",
    label: "Total requests",
    color: "text-surface-ink-600",
    bg: "bg-surface-warm-200",
  },
  {
    key: "completion_rate",
    label: "Completion rate",
    suffix: "%",
    color: "text-state-success-600",
    bg: "bg-state-success-50",
  },
  {
    key: "average_rating",
    label: "Average rating",
    color: "text-accent-teach-600",
    bg: "bg-accent-teach-50",
  },
  {
    key: "completed_requests",
    label: "Completed sessions",
    color: "text-accent-learn-600",
    bg: "bg-accent-learn-50",
  },
];

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => get<AdminStats>("/admin/stats"),
    select: (res) => (res as ApiSuccess<AdminStats>).data,
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-surface-warm-500">
            Platform overview at a glance.
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-surface-warm-200 bg-white p-6"
              >
                <div className="h-3 w-20 rounded bg-surface-warm-200" />
                <div className="mt-3 h-7 w-16 rounded bg-surface-warm-200" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Failed to load stats.</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {stats && (
          <>
            {/* Metric cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metricCards.map((card) => {
                const value = stats[card.key as keyof AdminStats];
                const display =
                  typeof value === "number"
                    ? card.key === "average_rating"
                      ? value.toFixed(1)
                      : value.toLocaleString()
                    : value;

                return (
                  <div
                    key={card.key}
                    className={`rounded-lg border border-surface-warm-200 p-6 ${card.bg}`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-surface-warm-500">
                      {card.label}
                    </p>
                    <p
                      className={`mt-2 font-mono text-3xl font-semibold ${card.color}`}
                    >
                      {display}
                      {card.suffix || ""}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Completion bar */}
            <div className="rounded-lg border border-surface-warm-200 bg-white p-6">
              <h3 className="mb-4 font-display text-sm font-semibold text-surface-ink-700">
                Request completion
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-warm-200">
                  <div
                    className="h-full rounded-full bg-state-success-500 transition-all"
                    style={{
                      width: `${Math.min(stats.completion_rate, 100)}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-sm font-semibold text-surface-ink-700">
                  {stats.completion_rate}%
                </span>
              </div>
              <p className="mt-2 text-xs text-surface-warm-500">
                {stats.completed_requests} of {stats.total_requests} requests
                completed
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
