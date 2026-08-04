"use client";

// components/landing/PopularSkills.tsx
// Fetches the global skill taxonomy and shows them as trade-card badges.
// Uses TanStack Query – the data is public, no auth required.

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { get } from "@/lib/api-client";
import type { Skill } from "@/types/skill";
import type { ApiSuccess } from "@/types/api";

export default function PopularSkills() {
  const {
    data: skills,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["skills"],
    queryFn: () => get<Skill[]>("/skills"),
    select: (res) => (res as ApiSuccess<Skill[]>).data ?? [],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-md bg-surface-warm-300"
          />
        ))}
      </div>
    );
  }

  if (isError || !skills?.length) {
    return (
      <p className="text-sm text-surface-warm-500">
        Skills are loading — check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {skills.slice(0, 12).map((skill) => (
        <Link
          key={skill.id}
          href={`/skills?search=${encodeURIComponent(skill.name)}`}
          className="inline-flex items-center gap-2 rounded-full border border-accent-teach-200 bg-white px-4 py-2 text-sm font-medium text-surface-ink-700 transition hover:border-accent-teach-400 hover:shadow-sm"
        >
          <span className="text-accent-teach-500">·</span>
          {skill.name}
          <span className="text-xs text-surface-warm-400">
            {skill.category}
          </span>
        </Link>
      ))}
    </div>
  );
}
