"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/lib/api-client";
import AdminLayout from "@/components/admin/AdminLayout";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
  reviewer: { id: string; name: string; email: string };
  reviewee: { id: string; name: string; email: string };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="font-mono text-sm text-accent-teach-600">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => get<ReviewItem[]>("/admin/reviews"),
    select: (res) => {
      const r = res as unknown as {
        data: {
          data: ReviewItem[];
          current_page: number;
          last_page: number;
          total: number;
        };
      };
      return {
        data: r.data.data,
        current_page: r.data.current_page,
        last_page: r.data.last_page,
        total: r.data.total,
      };
    },
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => put(`/admin/reviews/${id}/hide`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-surface-warm-500">
            {data?.total ?? 0} reviews total.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-surface-warm-200 bg-white p-4"
              >
                <div className="h-4 w-40 rounded bg-surface-warm-200" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Failed to load reviews.</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-3">
            {data.data.map((review) => (
              <div
                key={review.id}
                className={`rounded-lg border p-4 ${review.is_hidden ? "border-red-200 bg-red-50" : "border-surface-warm-200 bg-white"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-surface-warm-400">
                        {review.reviewer?.name ?? "Unknown"} →{" "}
                        {review.reviewee?.name ?? "Unknown"}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-surface-ink-600">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-surface-warm-400">
                      {new Date(review.created_at).toLocaleDateString()}
                      {review.is_hidden && (
                        <span className="ml-2 text-red-600">
                          · Hidden from public
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => hideMutation.mutate(review.id)}
                    disabled={hideMutation.isPending}
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {review.is_hidden ? "Hidden" : "Hide"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
