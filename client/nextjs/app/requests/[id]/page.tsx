"use client";

// app/requests/[id]/page.tsx
// Request detail page — shows status, participants, skill, message,
// and action buttons depending on role and current status.
//
// Actions per role + status:
// - Teacher + PENDING → Accept / Reject
// - Either participant + ACCEPTED → Cancel / Complete
// - Terminal states → read-only

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { get, put } from "@/lib/api-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCloudinaryUrl } from "@/lib/cloudinary";
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
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        STATUS_COLORS[status] || "bg-surface-warm-200 text-surface-warm-600"
      }`}
    >
      {status}
    </span>
  );
}

function Avatar({ name, publicId }: { name: string; publicId: string | null }) {
  const url = publicId
    ? getCloudinaryUrl(publicId, { width: 100, height: 100 })
    : null;

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-teach-100 text-sm font-bold text-accent-teach-400">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xl ${star <= rating ? "text-accent-teach-500" : "text-surface-warm-300"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const requestId = params.id;

  // ── Query ─────────────────────────────────────────────────────────
  const {
    data: request,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["skill-requests", requestId],
    queryFn: () => get<SkillRequest>(`/skill-requests/${requestId}`),
    select: (res) => (res as ApiSuccess<SkillRequest>).data,
    enabled: !!requestId && !!user,
  });

  // ── Role detection ────────────────────────────────────────────────
  const isTeacher = user?.id === request?.teacher_id;
  const isLearner = user?.id === request?.learner_id;
  const isParticipant = isTeacher || isLearner;
  const canAct =
    request?.status === "pending" || request?.status === "accepted";
  const currentUserReview = request?.current_user_review ?? null;
  const canLeaveReview =
    request?.status === "completed" && isParticipant && !currentUserReview;

  // ── Cancel state ──────────────────────────────────────────────────
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Action mutation helper ────────────────────────────────────────
  function useActionMutation(action: string) {
    return useMutation({
      mutationFn: (body?: Record<string, unknown>) =>
        put<SkillRequest>(`/skill-requests/${requestId}/${action}`, body),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["skill-requests", requestId],
        });
        setActionError(null);
        setShowCancelInput(false);
      },
      onError: (err) => {
        const apiErr = err as unknown as ApiError;
        setActionError(apiErr.message || `Failed to ${action}.`);
      },
    });
  }

  const acceptMutation = useActionMutation("accept");
  const rejectMutation = useActionMutation("reject");
  const completeMutation = useActionMutation("complete");
  const cancelMutation = useActionMutation("cancel");

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl animate-pulse space-y-6 p-4 md:p-8">
          <div className="h-6 w-24 rounded bg-surface-warm-200" />
          <div className="h-4 w-48 rounded bg-surface-warm-200" />
          <div className="h-20 rounded bg-surface-warm-200" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────
  if (isError || !request) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl p-4 md:p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              {isError
                ? (error as unknown as ApiError)?.message ||
                  "Failed to load request."
                : "Request not found."}
            </p>
            <Link
              href="/requests"
              className="mt-3 inline-block text-sm font-medium text-red-700 underline"
            >
              View all requests
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Skill Request
          </h1>
          <StatusBadge status={request.status} />
        </div>

        {/* Participants */}
        <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
          <div className="flex items-center gap-4">
            {/* Learner */}
            <div className="flex items-center gap-2">
              <Avatar
                name={request.learner?.name ?? "Unknown"}
                publicId={request.learner?.avatar_public_id ?? null}
              />
              <div>
                <p className="text-xs text-surface-warm-500">From</p>
                <p className="text-sm font-medium text-surface-ink-700">
                  {request.learner?.name ?? "Unknown"}
                </p>
              </div>
            </div>

            <span className="text-surface-warm-300">→</span>

            {/* Teacher */}
            <div className="flex items-center gap-2">
              <Avatar
                name={request.teacher?.name ?? "Unknown"}
                publicId={request.teacher?.avatar_public_id ?? null}
              />
              <div>
                <p className="text-xs text-surface-warm-500">To</p>
                <p className="text-sm font-medium text-surface-ink-700">
                  {request.teacher?.name ?? "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Skill */}
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-accent-teach-50 px-2.5 py-0.5 text-xs font-medium text-accent-teach-700">
              {request.skill?.name ?? "Unknown skill"}
            </span>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
            <h3 className="mb-2 font-display text-sm font-semibold text-surface-ink-700">
              Message
            </h3>
            <p className="text-sm leading-relaxed text-surface-ink-600">
              {request.message}
            </p>
          </div>
        )}

        {/* Proposed time */}
        {request.proposed_at && (
          <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
            <h3 className="mb-1 font-display text-sm font-semibold text-surface-ink-700">
              Proposed time
            </h3>
            <p className="text-sm text-surface-ink-600">
              {new Date(request.proposed_at).toLocaleString(undefined, {
                dateStyle: "full",
                timeStyle: "short",
              })}
              {request.timezone && (
                <span className="ml-1 text-surface-warm-400">
                  ({request.timezone})
                </span>
              )}
            </p>
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Action buttons */}
        {isParticipant && canAct && (
          <div className="space-y-4 rounded-lg border border-surface-warm-200 bg-white p-5">
            {/* Teacher + PENDING */}
            {isTeacher && request.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => acceptMutation.mutate({})}
                  disabled={acceptMutation.isPending}
                  className="flex-1 rounded-md bg-state-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-state-success-600 disabled:opacity-50"
                >
                  {acceptMutation.isPending ? "Accepting..." : "Accept"}
                </button>
                <button
                  onClick={() => rejectMutation.mutate({})}
                  disabled={rejectMutation.isPending}
                  className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </button>
              </div>
            )}

            {/* Either + ACCEPTED */}
            {request.status === "accepted" && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => completeMutation.mutate({})}
                    disabled={completeMutation.isPending}
                    className="flex-1 rounded-md bg-accent-learn-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-learn-600 disabled:opacity-50"
                  >
                    {completeMutation.isPending
                      ? "Completing..."
                      : "Mark as Completed"}
                  </button>

                  {!showCancelInput && (
                    <button
                      onClick={() => setShowCancelInput(true)}
                      className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>

                {/* Cancel reason input */}
                {showCancelInput && (
                  <div className="space-y-2">
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Why are you cancelling this request?"
                      className="w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (cancelReason.trim()) {
                            cancelMutation.mutate({
                              reason: cancelReason.trim(),
                            });
                          }
                        }}
                        disabled={
                          cancelMutation.isPending || !cancelReason.trim()
                        }
                        className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {cancelMutation.isPending
                          ? "Cancelling..."
                          : "Confirm Cancel"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCancelInput(false);
                          setCancelReason("");
                        }}
                        className="rounded-md border border-surface-warm-300 px-4 py-1.5 text-sm text-surface-ink-600 hover:bg-surface-warm-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Terminal state note */}
        {!canAct && isParticipant && (
          <div className="rounded-lg border border-surface-warm-200 bg-white p-5 text-center">
            <div className="space-y-3">
              <p className="text-sm text-surface-warm-500">
                This request is {request.status} — no further actions available.
              </p>

              {request.status === "completed" && (
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                  {canLeaveReview ? (
                    <Link
                      href={`/reviews/new?request=${request.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
                    >
                      Leave Review
                    </Link>
                  ) : (
                    <div className="w-full rounded-lg border border-surface-warm-200 bg-surface-warm-50 p-4 text-left sm:max-w-xl">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-surface-ink-700">
                          Your review
                        </p>
                        {currentUserReview && (
                          <ReadOnlyStars rating={currentUserReview.rating} />
                        )}
                      </div>
                      {currentUserReview?.comment ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-ink-600">
                          {currentUserReview.comment}
                        </p>
                      ) : (
                        <p className="text-sm text-surface-warm-500">
                          No comment left.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/requests"
          className="inline-flex items-center text-sm text-surface-warm-500 hover:text-surface-ink-600"
        >
          ← Back to all requests
        </Link>
      </div>
    </DashboardLayout>
  );
}
