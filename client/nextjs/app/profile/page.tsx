"use client";

// app/profile/page.tsx
// Own profile page — view and edit the authenticated user's profile.
//
// Two API calls on mount (both disabled until user is available):
// - GET /users/{id} → PublicUser (name, bio, location, avatar, created_at)
// - GET /user-skills → UserSkill[] (teach/learn listing with skill relation)
//
// Edit mode: inline form for name/bio/location, plus avatar upload via
// file input that submits immediately on file selection.
//
// Mutations read the live auth store state inside onSuccess (not the
// closure-captured user) to safely merge only their owned fields even
// when two mutations resolve in quick succession.
//
// NOTE: /users/[id] (public profiles) is a separate page that uses
// URL params for the user ID and fetches different data (public profile
// + reviews). This page always uses the auth store's user.id.

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { get, put, post } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import type { PublicUser, AuthUser } from "@/types/user";
import type { UserSkill } from "@/types/skill";
import type { ApiSuccess, ApiError } from "@/types/api";

export default function ProfilePage() {
  // ── All hooks must be called unconditionally ──────────────────────
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");

  const userId = user?.id;

  // Profile query — disabled until we have a user ID
  const profileQuery = useQuery({
    queryKey: ["users", userId],
    queryFn: () => get<PublicUser>(`/users/${userId}`),
    select: (res) => (res as ApiSuccess<PublicUser>).data,
    enabled: !!userId,
  });

  // Skills query — disabled until we have a user ID
  const skillsQuery = useQuery({
    queryKey: ["user-skills"],
    queryFn: () => get<UserSkill[]>("/user-skills"),
    select: (res) => (res as ApiSuccess<UserSkill[]>).data ?? [],
    enabled: !!userId,
  });

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; bio?: string; location?: string }) =>
      put<AuthUser>(`/users/${userId}`, data),
    onSuccess: (response) => {
      const updated = (response as ApiSuccess<AuthUser>).data;
      // Read the live store value, not the closure-captured user, so
      // concurrent avatar uploads aren't overwritten by a stale spread.
      const current = useAuthStore.getState().user;
      if (updated && current) {
        setUser({
          ...current,
          name: updated.name,
          bio: updated.bio,
          location: updated.location,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
      setEditing(false);
    },
  });

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return post<AuthUser>(`/users/${userId}/avatar`, formData);
    },
    onSuccess: (response) => {
      const updated = (response as ApiSuccess<AuthUser>).data;
      // Read the live store value so a concurrent profile-update
      // mutation's changes aren't lost.
      const current = useAuthStore.getState().user;
      if (updated && current) {
        setUser({ ...current, avatar_public_id: updated.avatar_public_id });
      }
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });

  const queryClient = useQueryClient();

  // ── Derived data ──────────────────────────────────────────────────
  const profile = profileQuery.data;
  const skills = skillsQuery.data ?? [];
  const teachSkills = skills.filter((s) => s.can_teach);
  const learnSkills = skills.filter((s) => s.wants_to_learn);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;
  const avatarUrl = profile?.avatar_public_id
    ? getCloudinaryUrl(profile.avatar_public_id, { width: 200, height: 200 })
    : null;
  const initial = (profile?.name ?? user?.name ?? "?").charAt(0).toUpperCase();

  // ── Handlers ──────────────────────────────────────────────────────
  function handleSave() {
    updateMutation.mutate({
      name,
      bio: bio || undefined,
      location: location || undefined,
    });
  }

  function handleCancel() {
    const p = profileQuery.data;
    setName(p?.name ?? user?.name ?? "");
    setBio(p?.bio ?? user?.bio ?? "");
    setLocation(p?.location ?? user?.location ?? "");
    setEditing(false);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  }

  function getMutationError(err: unknown): string {
    const apiErr = err as ApiError;
    // If the backend returned field-level errors, show the first one
    if (apiErr.errors && !Array.isArray(apiErr.errors)) {
      const first = Object.values(apiErr.errors)[0];
      if (first?.length) {
        // Check for file upload failure and give a more helpful message
        if (first[0] === "The avatar failed to upload.") {
          return "The image could not be uploaded. Please ensure the file is a JPEG, PNG, or WebP image under 2 MB.";
        }
        return first[0];
      }
    }
    return apiErr.message || "Something went wrong.";
  }

  // ── Loading (also covers the brief moment before AuthGuard hydrates) ──
  if (!userId || profileQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl animate-pulse space-y-6 p-4 md:p-8">
          <div className="h-24 w-24 rounded-full bg-surface-warm-200" />
          <div className="h-6 w-48 rounded bg-surface-warm-200" />
          <div className="h-4 w-64 rounded bg-surface-warm-200" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (profileQuery.isError) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">Failed to load profile.</p>
            <button
              onClick={() => profileQuery.refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── View / Edit ───────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Profile
          </h1>
          {!editing && (
            <button
              onClick={() => {
                setName(profile?.name ?? user.name);
                setBio(profile?.bio ?? user.bio ?? "");
                setLocation(profile?.location ?? user.location ?? "");
                setEditing(true);
              }}
              className="rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* ── Left column: Avatar & skills ─────────────────────────── */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-accent-teach-100">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={profile?.name ?? user.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-accent-teach-400">
                    {initial}
                  </div>
                )}
                {avatarMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>

              {editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-accent-teach-600 hover:text-accent-teach-700"
                    disabled={avatarMutation.isPending}
                  >
                    {avatarMutation.isPending ? "Uploading…" : "Change photo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {avatarMutation.isError && (
                    <p className="text-xs text-red-600">
                      {getMutationError(avatarMutation.error)}
                    </p>
                  )}
                </>
              )}

              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-center text-sm font-medium focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-lg font-semibold text-surface-ink-800">
                  {profile?.name ?? user.name}
                </h2>
              )}

              {memberSince && (
                <p className="text-xs text-surface-warm-500">
                  Member since {memberSince}
                </p>
              )}
            </div>

            {/* Skills */}
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-surface-ink-700">
                Skills
              </h3>
              {skillsQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-4 w-full animate-pulse rounded bg-surface-warm-200"
                    />
                  ))}
                </div>
              ) : skills.length === 0 ? (
                <p className="text-sm text-surface-warm-500">
                  No skills listed yet.{" "}
                  <a href="/skills" className="text-accent-teach-600 underline">
                    Add your first skill
                  </a>
                </p>
              ) : (
                <div className="space-y-4">
                  {teachSkills.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-surface-warm-500">
                        Teaches ({teachSkills.length})
                      </p>
                      <ul className="space-y-1">
                        {teachSkills.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-accent-teach-400" />
                            <span className="text-surface-ink-700">
                              {s.skill.name}
                            </span>
                            <span className="text-xs text-surface-warm-400">
                              {s.proficiency_level}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {learnSkills.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-surface-warm-500">
                        Wants to learn ({learnSkills.length})
                      </p>
                      <ul className="space-y-1">
                        {learnSkills.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-accent-learn-400" />
                            <span className="text-surface-ink-700">
                              {s.skill.name}
                            </span>
                            <span className="text-xs text-surface-warm-400">
                              {s.proficiency_level}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Bio & Location ─────────────────────────── */}
          <div className="space-y-6 md:col-span-2">
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-surface-ink-700">
                Bio
              </h3>
              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                  placeholder="Tell others about yourself…"
                />
              ) : (
                <p className="text-sm leading-relaxed text-surface-ink-600">
                  {profile?.bio || "No bio yet."}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-surface-ink-700">
                Location
              </h3>
              {editing ? (
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                  placeholder="City, Country"
                />
              ) : (
                <p className="text-sm text-surface-ink-600">
                  {profile?.location || "No location set."}
                </p>
              )}
            </div>

            {/* Edit mode actions */}
            {editing && (
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="rounded-md bg-accent-teach-500 px-6 py-2 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="rounded-md border border-surface-warm-300 px-6 py-2 text-sm font-medium text-surface-ink-600 hover:bg-surface-warm-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                {updateMutation.isError && (
                  <p className="text-sm text-red-600">
                    {getMutationError(updateMutation.error)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
