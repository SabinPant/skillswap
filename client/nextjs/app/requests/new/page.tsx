"use client";

// app/requests/new/page.tsx
// Create a new skill request — pre-filled teacher & skill from query params.
//
// Query params: ?teacher={id}&skill={id}
// Both are required; missing params show an error.
//
// Fetches teacher name + avatar and skill name for the summary header.
// Form fields: message (optional), proposed date/time (optional), timezone.
// Submits POST /skill-requests, redirects to /requests/{id} on success.

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { get, post } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBanner from "@/components/dashboard/VerificationBanner";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import type { PublicUser } from "@/types/user";
import type { Skill } from "@/types/skill";
import type { SkillRequest } from "@/types/skillRequest";
import type { ApiSuccess, ApiError } from "@/types/api";

// ── Timezone helper ────────────────────────────────────────────────────

function getTimezoneOptions(): { value: string; label: string }[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (type: string) => string[];
  };
  if (intl.supportedValuesOf) {
    return intl.supportedValuesOf("timeZone").map((tz: string) => ({
      value: tz,
      label: tz.replace(/_/g, " "),
    }));
  }
  const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [{ value: current, label: current.replace(/_/g, " ") }];
}

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isEmailVerified } = useAuthStore();

  const teacherId = searchParams.get("teacher") ?? "";
  const skillId = searchParams.get("skill") ?? "";

  // ── Queries (enabled only when params present) ────────────────────
  const teacherQuery = useQuery({
    queryKey: ["users", teacherId],
    queryFn: () => get<PublicUser>(`/users/${teacherId}`),
    select: (res) => (res as ApiSuccess<PublicUser>).data,
    enabled: !!teacherId,
  });

  const skillQuery = useQuery({
    queryKey: ["skills", skillId],
    queryFn: () => get<Skill>(`/skills/${skillId}`),
    select: (res) => (res as ApiSuccess<Skill>).data,
    enabled: !!skillId,
  });

  const teacher = teacherQuery.data;
  const skill = skillQuery.data;
  const isTeacherLoading = teacherQuery.isLoading && !!teacherId;
  const isSkillLoading = skillQuery.isLoading && !!skillId;
  const teacherNotFound = teacherQuery.isError;
  const skillNotFound = skillQuery.isError;

  // ── Form state ────────────────────────────────────────────────────
  const [message, setMessage] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  // ── Mutation ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      post<SkillRequest>("/skill-requests", {
        teacher_id: teacherId,
        skill_id: skillId,
        message: message || undefined,
        proposed_at: proposedAt || undefined,
        timezone: timezone || undefined,
      }),
    onSuccess: (response) => {
      const data = (response as ApiSuccess<SkillRequest>).data;
      if (data?.id) {
        router.push(`/requests/${data.id}`);
      }
    },
    onError: (err) => {
      const apiErr = err as unknown as ApiError;
      if (apiErr.errors && !Array.isArray(apiErr.errors)) {
        setErrors(apiErr.errors);
      } else {
        setGeneralError(apiErr.message || "Failed to create request.");
      }
    },
  });

  // ── Derived ───────────────────────────────────────────────────────
  const missingParams = !teacherId || !skillId;
  const canSubmit = !missingParams && !createMutation.isPending;

  // ── Missing params ────────────────────────────────────────────────
  if (missingParams) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl p-4 md:p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              Invalid request link. Please browse skills and use the &ldquo;Send
              Request&rdquo; button.
            </p>
            <Link
              href="/skills"
              className="mt-3 inline-block text-sm font-medium text-red-700 underline"
            >
              Go to Browse Skills
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Loading / Errors ──────────────────────────────────────────────
  if (isTeacherLoading || isSkillLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl animate-pulse space-y-6 p-4 md:p-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-surface-warm-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-surface-warm-200" />
              <div className="h-3 w-24 rounded bg-surface-warm-200" />
            </div>
          </div>
          <div className="h-24 rounded bg-surface-warm-200" />
        </div>
      </DashboardLayout>
    );
  }

  if (teacherNotFound || skillNotFound) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl p-4 md:p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              {teacherNotFound ? "Teacher not found." : "Skill not found."}
            </p>
            <Link
              href="/skills"
              className="mt-3 inline-block text-sm font-medium text-red-700 underline"
            >
              Back to Browse Skills
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Page ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <h1 className="font-display text-2xl font-bold text-surface-ink-800">
          Send Skill Request
        </h1>

        {/* Email verification banner */}
        {!isEmailVerified && <VerificationBanner />}

        {/* Teacher + Skill summary */}
        <div className="flex items-center gap-4 rounded-lg border border-surface-warm-200 bg-white p-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-accent-teach-100">
            {teacher?.avatar_public_id ? (
              <Image
                src={getCloudinaryUrl(teacher.avatar_public_id, {
                  width: 100,
                  height: 100,
                })}
                alt={teacher.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-accent-teach-400">
                {teacher?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-surface-ink-800">{teacher?.name}</p>
            <p className="text-sm text-surface-warm-500">
              Teaching:{" "}
              <span className="font-medium text-accent-teach-600">
                {skill?.name}
              </span>
            </p>
          </div>
        </div>

        {/* General error */}
        {generalError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {generalError}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) createMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-surface-ink-700"
            >
              Message <span className="text-surface-warm-400">(optional)</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1 block w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
              placeholder="Introduce yourself and explain why you'd like to learn this skill..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message[0]}</p>
            )}
          </div>

          {/* Proposed date/time */}
          <div>
            <label
              htmlFor="proposed_at"
              className="block text-sm font-medium text-surface-ink-700"
            >
              Proposed date & time{" "}
              <span className="text-surface-warm-400">(optional)</span>
            </label>
            <input
              id="proposed_at"
              type="datetime-local"
              value={proposedAt}
              onChange={(e) => setProposedAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
            />
            {errors.proposed_at && (
              <p className="mt-1 text-sm text-red-600">
                {errors.proposed_at[0]}
              </p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-surface-ink-700"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 block w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone[0]}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={!canSubmit || createMutation.isPending}
              title={
                !isEmailVerified
                  ? "Verify your email to send requests"
                  : undefined
              }
              className="rounded-md bg-accent-teach-500 px-6 py-2 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
            >
              {createMutation.isPending ? "Sending..." : "Send Request"}
            </button>
            <Link
              href="/skills"
              className="text-sm text-surface-warm-500 hover:text-surface-ink-600"
            >
              Cancel
            </Link>
            {!isEmailVerified && (
              <p className="text-xs text-surface-warm-500">
                Verify your email to send requests.
              </p>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
