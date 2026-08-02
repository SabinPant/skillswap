"use client";

// app/skills/page.tsx
// Skill browse/search — the discovery engine.
//
// Users search by skill name (required, min 2 chars), optionally filter
// by category and minimum proficiency. Results are deduplicated by
// teacher ID so a teacher matching multiple skills shows as one card
// with multiple skill badges.
//
// Pagination: page-based via the PagePaginatedResponse envelope.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SkillSearchForm from "@/components/skills/SkillSearchForm";
import TeacherCard from "@/components/skills/TeacherCard";
import type { SkillCategory, ProficiencyLevel } from "@/types/enums";
import type { SearchResult } from "@/types/skill";
import type { PagePaginatedResponse } from "@/types/api";
import type { PublicUser } from "@/types/user";

interface GroupedTeacher {
  teacher: PublicUser;
  skills: { skill_id: string; skill_name: string; proficiency_level: string }[];
}

function groupByTeacher(results: SearchResult[]): GroupedTeacher[] {
  const map = new Map<string, GroupedTeacher>();

  for (const row of results) {
    const existing = map.get(row.id);
    const skillEntry = {
      skill_id: row.skill_id,
      skill_name: row.skill_name,
      proficiency_level: row.proficiency_level,
    };

    if (existing) {
      existing.skills.push(skillEntry);
    } else {
      map.set(row.id, {
        teacher: {
          id: row.id,
          name: row.name,
          bio: row.bio,
          location: row.location,
          avatar_public_id: row.avatar_public_id,
          created_at: row.created_at,
        },
        skills: [skillEntry],
      });
    }
  }

  return Array.from(map.values());
}

export default function SkillsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<SkillCategory | "">("");
  const [proficiency, setProficiency] = useState<ProficiencyLevel | "">("");
  const [page, setPage] = useState(1);

  const searchEnabled = searchTerm.trim().length >= 2;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["search", searchTerm, category, proficiency, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        skill: searchTerm.trim(),
        page: String(page),
      });
      if (category) params.set("category", category);
      if (proficiency) params.set("min_proficiency", proficiency);

      return get<SearchResult>(`/users/search?${params.toString()}`);
    },
    select: (response) => {
      const paginated =
        response as unknown as PagePaginatedResponse<SearchResult>;
      const rawResults: SearchResult[] = paginated.data.data;
      return {
        items: groupByTeacher(rawResults),
        currentPage: paginated.data.current_page,
        lastPage: paginated.data.last_page,
        total: paginated.data.total,
      };
    },
    enabled: searchEnabled,
  });

  const results = data?.items ?? [];
  const currentPage = data?.currentPage ?? 1;
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <h1 className="font-display text-2xl font-bold text-surface-ink-800">
          Browse Skills
        </h1>

        <SkillSearchForm
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          category={category}
          onCategoryChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          proficiency={proficiency}
          onProficiencyChange={(value) => {
            setProficiency(value);
            setPage(1);
          }}
        />

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-surface-warm-200 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-surface-warm-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-surface-warm-200" />
                    <div className="h-3 w-48 rounded bg-surface-warm-200" />
                    <div className="h-5 w-20 rounded-full bg-surface-warm-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              {(error as { message?: string })?.message ||
                "Failed to load results."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty (search not yet performed) */}
        {!searchEnabled && !isLoading && (
          <div className="rounded-lg border border-surface-warm-200 bg-white p-12 text-center">
            <p className="text-sm text-surface-warm-500">
              Enter a skill name above to find teachers.
            </p>
          </div>
        )}

        {/* Empty results */}
        {searchEnabled && !isLoading && !isError && results.length === 0 && (
          <div className="rounded-lg border border-surface-warm-200 bg-white p-12 text-center">
            <p className="text-sm text-surface-warm-500">
              No teachers found for &ldquo;{searchTerm}&rdquo;
              {category && ` in ${category}`}.
            </p>
            <p className="mt-1 text-xs text-surface-warm-400">
              Try a different search term or remove filters.
            </p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && !isError && results.length > 0 && (
          <>
            <p className="text-sm text-surface-warm-500">
              {total} teacher{total !== 1 ? "s" : ""} found
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((group) => (
                <TeacherCard
                  key={group.teacher.id}
                  teacher={group.teacher}
                  skills={group.skills}
                />
              ))}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-surface-warm-300 px-4 py-2 text-sm font-medium text-surface-ink-600 hover:bg-surface-warm-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-surface-warm-500">
                  Page {currentPage} of {lastPage}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage >= lastPage}
                  className="rounded-md border border-surface-warm-300 px-4 py-2 text-sm font-medium text-surface-ink-600 hover:bg-surface-warm-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
