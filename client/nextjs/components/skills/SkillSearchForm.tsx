"use client";

// components/skills/SkillSearchForm.tsx
// Search bar + optional filters for browsing teachers by skill.
// The parent page manages the actual query; this component
// only lifts filter state up via onChange props.

import type { SkillCategory, ProficiencyLevel } from "@/types/enums";

interface SkillSearchFormProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  category: SkillCategory | "";
  onCategoryChange: (value: SkillCategory | "") => void;
  proficiency: ProficiencyLevel | "";
  onProficiencyChange: (value: ProficiencyLevel | "") => void;
}

const CATEGORIES: SkillCategory[] = [
  "programming",
  "design",
  "music",
  "languages",
  "fitness",
  "cooking",
  "photography",
  "marketing",
  "business",
  "other",
];

const PROFICIENCIES: ProficiencyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export default function SkillSearchForm({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  proficiency,
  onProficiencyChange,
}: SkillSearchFormProps) {
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div>
        <label htmlFor="skill-search" className="sr-only">
          Search by skill name
        </label>
        <input
          id="skill-search"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by skill (e.g. Java, guitar, photography)"
          className="w-full rounded-md border border-surface-warm-300 px-4 py-2.5 text-sm placeholder:text-surface-warm-400 focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
          autoComplete="off"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Category dropdown */}
        <div className="flex-1 min-w-40">
          <label htmlFor="category-filter" className="sr-only">
            Category
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) =>
              onCategoryChange(e.target.value as SkillCategory | "")
            }
            className="w-full rounded-md border border-surface-warm-300 px-3 py-2.5 text-sm text-surface-ink-700 focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Proficiency dropdown */}
        <div className="flex-1 min-w-40">
          <label htmlFor="proficiency-filter" className="sr-only">
            Minimum proficiency
          </label>
          <select
            id="proficiency-filter"
            value={proficiency}
            onChange={(e) =>
              onProficiencyChange(e.target.value as ProficiencyLevel | "")
            }
            className="w-full rounded-md border border-surface-warm-300 px-3 py-2.5 text-sm text-surface-ink-700 focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
          >
            <option value="">Any proficiency</option>
            {PROFICIENCIES.map((prof) => (
              <option key={prof} value={prof}>
                {prof.charAt(0).toUpperCase() + prof.slice(1)}+
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
