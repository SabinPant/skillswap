"use client";

// components/skills/TeacherCard.tsx
// Card for a single teacher in the search results grid.
// If a teacher matches on multiple skills, they appear as multiple
// badges on the same card (deduplicated by teacher ID in the parent).

import Image from "next/image";
import Link from "next/link";
import type { PublicUser } from "@/types/user";
import { getCloudinaryUrl } from "@/lib/cloudinary";

interface TeacherSkill {
  skill_id: string;
  skill_name: string;
  proficiency_level: string;
}

interface TeacherCardProps {
  teacher: PublicUser;
  skills: TeacherSkill[];
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-accent-teach-100 text-xl font-bold text-accent-teach-400">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TeacherCard({ teacher, skills }: TeacherCardProps) {
  const avatarUrl = teacher.avatar_public_id
    ? getCloudinaryUrl(teacher.avatar_public_id, { width: 200, height: 200 })
    : null;

  return (
    <div className="rounded-lg border border-surface-warm-200 bg-white p-5 transition-colors hover:border-accent-teach-300">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={teacher.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            <InitialAvatar name={teacher.name} />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-surface-ink-800">
            {teacher.name}
          </h3>

          {teacher.bio && (
            <p className="mt-1 line-clamp-2 text-sm text-surface-warm-500">
              {teacher.bio}
            </p>
          )}

          {/* Skill badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill.skill_id}
                className="inline-flex items-center gap-1 rounded-full bg-accent-teach-50 px-2.5 py-0.5 text-xs font-medium text-accent-teach-700"
              >
                {skill.skill_name}
                <span className="text-accent-teach-400">·</span>
                <span className="capitalize">{skill.proficiency_level}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Send Request — links to the first matching skill */}
      <div className="mt-4">
        <Link
          href={`/requests/new?teacher=${teacher.id}&skill=${skills[0]?.skill_id ?? ""}`}
          className="block w-full rounded-md bg-accent-teach-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-teach-600"
        >
          Send Skill Request
        </Link>
      </div>
    </div>
  );
}
