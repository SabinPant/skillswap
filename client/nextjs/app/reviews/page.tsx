"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { get, post } from "@/lib/api-client";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { SkillRequest } from "@/types/skillRequest";
import type { CreateReviewRequest, Review } from "@/types/review";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teach-400 focus:ring-offset-2 ${
            star <= value ? "text-accent-teach-500" : "text-surface-warm-300"
          }`}
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
        >
          ★
        </button>
      ))}
      <span className="ml-1 text-sm text-surface-warm-500">{value}/5</span>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");
  const { user } = useAuthStore();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const requestQuery = useQuery({
    queryKey: ["skill-requests", requestId],
    queryFn: () => get<SkillRequest>(`/skill-requests/${requestId}`),
    select: (res) => (res as ApiSuccess<SkillRequest>).data,
    enabled: !!requestId && !!user,
  });

  const request = requestQuery.data;
  const alreadyReviewed = !!request?.current_user_has_reviewed;

  const reviewee = useMemo(() => {
    if (!request || !user) return null;

    if (user.id === request.learner_id) {
      return request.teacher ?? null;
    }

    if (user.id === request.teacher_id) {
      return request.learner ?? null;
    }

    return null;
  }, [request, user]);

  const submitMutation = useMutation({
    mutationFn: async (payload: CreateReviewRequest) => {
      const response = await post<Review>("/reviews", {
        skill_request_id: payload.skill_request_id,
        rating: payload.rating,
        comment: payload.comment,
      });
      return response.data;
    },
    onSuccess: () => {
      router.replace(`/requests/${requestId}`);
    },
    onError: (err) => {
      const apiError = err as unknown as ApiError;

      if (
        apiError.errors &&
        !Array.isArray(apiError.errors) &&
        Object.keys(apiError.errors).length > 0
      ) {
        setFieldErrors(apiError.errors);
        setGeneralError(null);
      } else {
        setGeneralError(apiError.message || "Failed to submit review.");
      }
    },
  });

  const clearErrors = () => {
    setFieldErrors({});
    setGeneralError(null);
  };

  const requestLoadError = requestQuery.isError
    ? (requestQuery.error as unknown as ApiError)?.message ||
      "Failed to load request details."
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!requestId) {
      setGeneralError("Missing request ID.");
      return;
    }

    if (!reviewee) {
      setGeneralError("Could not determine who you are reviewing.");
      return;
    }

    submitMutation.mutate({
      skill_request_id: requestId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (!requestId) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-8 md:px-8">
          <div className="w-full rounded-2xl border border-surface-warm-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="font-display text-2xl font-bold text-surface-ink-800">
              Review
            </h1>
            <p className="mt-3 text-sm text-red-700">
              Missing request ID. Return to the request detail page and try
              again.
            </p>
            <Link
              href="/requests"
              className="mt-4 inline-flex rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              View requests
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (requestQuery.isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-8 md:px-8">
          <div className="w-full animate-pulse space-y-4 rounded-2xl border border-surface-warm-200 bg-white p-6 shadow-sm md:p-8">
            <div className="h-8 w-40 rounded bg-surface-warm-200" />
            <div className="h-4 w-56 rounded bg-surface-warm-200" />
            <div className="h-24 rounded bg-surface-warm-200" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (requestQuery.isError || !request) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-8 md:px-8">
          <div className="w-full rounded-2xl border border-surface-warm-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="font-display text-2xl font-bold text-surface-ink-800">
              Review
            </h1>
            <p className="mt-3 text-sm text-red-700">
              {requestLoadError ||
                generalError ||
                "Failed to load request details."}
            </p>
            <Link
              href="/requests"
              className="mt-4 inline-flex rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              Back to requests
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (request.status !== "completed") {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-8 md:px-8">
          <div className="w-full rounded-2xl border border-surface-warm-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="font-display text-2xl font-bold text-surface-ink-800">
              Review not available
            </h1>
            <p className="mt-3 text-sm text-surface-warm-600">
              This request must be completed before a review can be submitted.
            </p>
            <Link
              href={`/requests/${request.id}`}
              className="mt-4 inline-flex rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              Back to request
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (alreadyReviewed) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-8 md:px-8">
          <div className="w-full rounded-2xl border border-surface-warm-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="font-display text-2xl font-bold text-surface-ink-800">
              Review already submitted
            </h1>
            <p className="mt-3 text-sm text-surface-warm-600">
              You have already reviewed {reviewee?.name ?? "this participant"}{" "}
              for this request.
            </p>
            <Link
              href={`/requests/${request.id}`}
              className="mt-4 inline-flex rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              Back to request
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 md:px-8 md:py-8">
        <div className="rounded-2xl border border-surface-warm-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-surface-ink-800 md:text-3xl">
              Leave a review
            </h1>
            <p className="text-sm text-surface-warm-500">
              Review{" "}
              <span className="font-medium text-surface-ink-700">
                {reviewee?.name ?? "the other participant"}
              </span>
            </p>
            <p className="text-sm text-surface-warm-500">
              Skill:{" "}
              <span className="font-medium text-surface-ink-700">
                {request.skill?.name ?? "Unknown skill"}
              </span>
            </p>
          </div>

          {generalError && (
            <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
              <p>{generalError}</p>
              {generalError.includes("already reviewed") && (
                <Link
                  href={`/requests/${request.id}`}
                  className="mt-2 inline-block font-medium underline"
                >
                  Back to request
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-surface-ink-700">
                Rating
              </label>
              <div className="mt-2">
                <StarRating value={rating} onChange={setRating} />
              </div>
              {fieldErrors.rating && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.rating[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-surface-ink-700"
              >
                Comment{" "}
                <span className="text-surface-warm-400">(optional)</span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="What was helpful, what could be better, any details you want to share..."
                className="mt-2 block w-full rounded-md border border-surface-warm-300 px-3 py-2 text-sm shadow-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
              />
              {fieldErrors.comment && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.comment[0]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/requests/${request.id}`}
                className="inline-flex items-center justify-center rounded-md border border-surface-warm-300 px-4 py-2 text-sm font-medium text-surface-ink-600 hover:bg-surface-warm-100"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-teach-600 focus:outline-none focus:ring-2 focus:ring-accent-teach-400 disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
