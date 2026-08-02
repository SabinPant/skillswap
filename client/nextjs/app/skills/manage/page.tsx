"use client";

// app/skills/manage/page.tsx
// Skill management — add, update, and remove skills the user
// can teach or wants to learn.
//
// Two sections: "I can teach" and "I want to learn". Each skill
// card shows the skill name, category, and proficiency with
// edit/delete actions. An "Add Skill" form lets the user pick
// from the global taxonomy (excluding already-added skills).

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { get, post, put, del } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Skill } from "@/types/skill";
import type { UserSkill } from "@/types/skill";
import type { ApiSuccess, ApiError } from "@/types/api";
import type { ProficiencyLevel } from "@/types/enums";

const PROFICIENCIES: ProficiencyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export default function ManageSkillsPage() {
  const queryClient = useQueryClient();

  // ── Queries ───────────────────────────────────────────────────────
  const allSkillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: () => get<Skill[]>("/skills"),
    select: (res) => (res as ApiSuccess<Skill[]>).data ?? [],
  });

  const userSkillsQuery = useQuery({
    queryKey: ["user-skills"],
    queryFn: () => get<UserSkill[]>("/user-skills"),
    select: (res) => (res as ApiSuccess<UserSkill[]>).data ?? [],
  });

  const allSkills = allSkillsQuery.data ?? [];
  const userSkills = userSkillsQuery.data ?? [];

  const teachSkills = userSkills.filter((s) => s.can_teach);
  const learnSkills = userSkills.filter((s) => s.wants_to_learn);

  // Skills the user hasn't added yet (for the add dropdown)
  const addedSkillIds = new Set(userSkills.map((s) => s.skill_id));
  const availableSkills = allSkills.filter((s) => !addedSkillIds.has(s.id));

  // ── Add form state ────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillId, setNewSkillId] = useState("");
  const [newProficiency, setNewProficiency] =
    useState<ProficiencyLevel>("beginner");
  const [newCanTeach, setNewCanTeach] = useState(true);
  const [newWantsToLearn, setNewWantsToLearn] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── Edit state ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProficiency, setEditProficiency] =
    useState<ProficiencyLevel>("beginner");
  const [editCanTeach, setEditCanTeach] = useState(false);
  const [editWantsToLearn, setEditWantsToLearn] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: () =>
      post<UserSkill>("/user-skills", {
        skill_id: newSkillId,
        proficiency_level: newProficiency,
        can_teach: newCanTeach,
        wants_to_learn: newWantsToLearn,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });
      setShowAddForm(false);
      setNewSkillId("");
      setNewProficiency("beginner");
      setNewCanTeach(true);
      setNewWantsToLearn(false);
      setAddError(null);
    },
    onError: (err) => {
      setAddError(
        (err as unknown as ApiError).message || "Failed to add skill.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      put<UserSkill>(`/user-skills/${id}`, {
        proficiency_level: editProficiency,
        can_teach: editCanTeach,
        wants_to_learn: editWantsToLearn,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });
      setEditingId(null);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(
        (err as unknown as ApiError).message || "Failed to update skill.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/user-skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });
    },
  });

  // ── Loading ───────────────────────────────────────────────────────
  if (userSkillsQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl animate-pulse space-y-6 p-4 md:p-8">
          <div className="h-6 w-32 rounded bg-surface-warm-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-warm-200" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Page ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Manage Skills
          </h1>
          <Link
            href="/skills"
            className="text-sm text-surface-warm-500 hover:text-surface-ink-600"
          >
            ← Browse skills
          </Link>
        </div>

        {/* ── Add Skill button ──────────────────────────────────────── */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
          >
            + Add Skill
          </button>
        )}

        {/* ── Add form ──────────────────────────────────────────────── */}
        {showAddForm && (
          <div className="rounded-lg border border-accent-teach-200 bg-accent-teach-50 p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-surface-ink-700">
              Add a new skill
            </h3>

            {addError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {addError}
              </div>
            )}

            <div className="space-y-4">
              {/* Skill dropdown */}
              <div>
                <label className="block text-sm font-medium text-surface-ink-700">
                  Skill
                </label>
                <select
                  value={newSkillId}
                  onChange={(e) => setNewSkillId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                >
                  <option value="">Select a skill...</option>
                  {availableSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Proficiency */}
              <div>
                <label className="block text-sm font-medium text-surface-ink-700">
                  Proficiency
                </label>
                <select
                  value={newProficiency}
                  onChange={(e) =>
                    setNewProficiency(e.target.value as ProficiencyLevel)
                  }
                  className="mt-1 block w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm capitalize focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                >
                  {PROFICIENCIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newCanTeach}
                    onChange={(e) => {
                      setNewCanTeach(e.target.checked);
                      if (!e.target.checked && !newWantsToLearn) {
                        setNewWantsToLearn(true);
                      }
                    }}
                    className="h-4 w-4 rounded border-surface-warm-300 text-accent-teach-500 focus:ring-accent-teach-400"
                  />
                  I can teach this
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newWantsToLearn}
                    onChange={(e) => {
                      setNewWantsToLearn(e.target.checked);
                      if (!e.target.checked && !newCanTeach) {
                        setNewCanTeach(true);
                      }
                    }}
                    className="h-4 w-4 rounded border-surface-warm-300 text-accent-learn-500 focus:ring-accent-learn-400"
                  />
                  I want to learn this
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!newSkillId || addMutation.isPending}
                  className="rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
                >
                  {addMutation.isPending ? "Adding..." : "Add Skill"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md border border-surface-warm-300 px-4 py-2 text-sm text-surface-ink-600 hover:bg-surface-warm-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── I can teach ────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-surface-ink-800">
            I can teach ({teachSkills.length})
          </h2>

          {teachSkills.length === 0 ? (
            <p className="rounded-lg border border-surface-warm-200 bg-white p-6 text-center text-sm text-surface-warm-500">
              No skills listed yet. Add a skill above to start teaching.
            </p>
          ) : (
            <div className="space-y-3">
              {teachSkills.map((us) => (
                <div
                  key={us.id}
                  className="rounded-lg border border-surface-warm-200 bg-white p-4"
                >
                  {editingId === us.id ? (
                    /* ── Edit mode ──────────────────────────────────── */
                    <div className="space-y-3">
                      {editError && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                          {editError}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4">
                        <select
                          value={editProficiency}
                          onChange={(e) =>
                            setEditProficiency(
                              e.target.value as ProficiencyLevel,
                            )
                          }
                          className="rounded-md border border-surface-warm-300 px-3 py-1.5 text-sm capitalize focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                        >
                          {PROFICIENCIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editCanTeach}
                            onChange={(e) => {
                              setEditCanTeach(e.target.checked);
                              if (!e.target.checked && !editWantsToLearn) {
                                setEditWantsToLearn(true);
                              }
                            }}
                            className="h-4 w-4 rounded border-surface-warm-300 text-accent-teach-500 focus:ring-accent-teach-400"
                          />
                          Teach
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editWantsToLearn}
                            onChange={(e) => {
                              setEditWantsToLearn(e.target.checked);
                              if (!e.target.checked && !editCanTeach) {
                                setEditCanTeach(true);
                              }
                            }}
                            className="h-4 w-4 rounded border-surface-warm-300 text-accent-learn-500 focus:ring-accent-learn-400"
                          />
                          Learn
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMutation.mutate(us.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-md bg-accent-teach-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-surface-warm-300 px-3 py-1.5 text-sm text-surface-ink-600 hover:bg-surface-warm-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ──────────────────────────────────── */
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-surface-ink-700">
                          {us.skill.name}
                        </p>
                        <p className="text-xs text-surface-warm-400">
                          {us.skill.category} · {us.proficiency_level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(us.id);
                            setEditProficiency(us.proficiency_level);
                            setEditCanTeach(us.can_teach);
                            setEditWantsToLearn(us.wants_to_learn);
                            setEditError(null);
                          }}
                          className="text-sm text-accent-teach-600 hover:text-accent-teach-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remove this skill?")) {
                              deleteMutation.mutate(us.id);
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── I want to learn ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-surface-ink-800">
            I want to learn ({learnSkills.length})
          </h2>

          {learnSkills.length === 0 ? (
            <p className="rounded-lg border border-surface-warm-200 bg-white p-6 text-center text-sm text-surface-warm-500">
              No skills listed yet. Add a skill above to start learning.
            </p>
          ) : (
            <div className="space-y-3">
              {learnSkills.map((us) => (
                <div
                  key={us.id}
                  className="rounded-lg border border-surface-warm-200 bg-white p-4"
                >
                  {editingId === us.id ? (
                    <div className="space-y-3">
                      {editError && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                          {editError}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4">
                        <select
                          value={editProficiency}
                          onChange={(e) =>
                            setEditProficiency(
                              e.target.value as ProficiencyLevel,
                            )
                          }
                          className="rounded-md border border-surface-warm-300 px-3 py-1.5 text-sm capitalize focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
                        >
                          {PROFICIENCIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editCanTeach}
                            onChange={(e) => {
                              setEditCanTeach(e.target.checked);
                              if (!e.target.checked && !editWantsToLearn) {
                                setEditWantsToLearn(true);
                              }
                            }}
                            className="h-4 w-4 rounded border-surface-warm-300 text-accent-teach-500 focus:ring-accent-teach-400"
                          />
                          Teach
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editWantsToLearn}
                            onChange={(e) => {
                              setEditWantsToLearn(e.target.checked);
                              if (!e.target.checked && !editCanTeach) {
                                setEditCanTeach(true);
                              }
                            }}
                            className="h-4 w-4 rounded border-surface-warm-300 text-accent-learn-500 focus:ring-accent-learn-400"
                          />
                          Learn
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMutation.mutate(us.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-md bg-accent-teach-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-surface-warm-300 px-3 py-1.5 text-sm text-surface-ink-600 hover:bg-surface-warm-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-surface-ink-700">
                          {us.skill.name}
                        </p>
                        <p className="text-xs text-surface-warm-400">
                          {us.skill.category} · {us.proficiency_level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(us.id);
                            setEditProficiency(us.proficiency_level);
                            setEditCanTeach(us.can_teach);
                            setEditWantsToLearn(us.wants_to_learn);
                            setEditError(null);
                          }}
                          className="text-sm text-accent-teach-600 hover:text-accent-teach-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remove this skill?")) {
                              deleteMutation.mutate(us.id);
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
