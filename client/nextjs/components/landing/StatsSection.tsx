"use client";

// components/landing/StatsSection.tsx
// Fetches real platform stats from GET /api/v1/stats and displays them.

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api";

interface Stats {
  users: number;
  skills: number;
  requests_completed: number;
  average_rating: number;
}

export default function StatsSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => get<Stats>("/stats"),
    select: (res) => (res as ApiSuccess<Stats>).data,
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-8 border-y border-surface-ink-600 py-12 md:grid-cols-4 md:divide-x md:divide-surface-ink-600">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="mx-auto h-8 w-20 rounded bg-surface-ink-600" />
            <div className="mx-auto mt-2 h-4 w-28 rounded bg-surface-ink-600" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { num: stats.users.toLocaleString(), label: "Members exchanging skills" },
    { num: stats.skills.toLocaleString(), label: "Skills to learn & teach" },
    { num: stats.average_rating.toFixed(1), label: "Average session rating" },
    {
      num: stats.requests_completed.toLocaleString(),
      label: "Sessions completed",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-8 border-y border-surface-ink-600 py-12 md:grid-cols-4 md:divide-x md:divide-surface-ink-600">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <span className="block font-mono text-3xl font-semibold text-accent-teach-400">
            {item.num}
          </span>
          <span className="mt-2 block text-sm text-surface-warm-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
