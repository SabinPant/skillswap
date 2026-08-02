"use client";

// app/conversations/page.tsx
// Conversation list (inbox) — shows all conversations sorted by
// most recent message, with unread counts and last message previews.
//
// Batch-fetches other participants' profiles via useQueries.
// Listens for message_received notifications to invalidate and
// re-fetch in real time.

import { useMemo } from "react";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { get } from "@/lib/api-client";
import { useWebSocket } from "@/hooks/useWebSocket";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import type { Conversation } from "@/types/message";
import type { PublicUser } from "@/types/user";
import type {
  ApiSuccess,
  ApiError,
  CursorPaginatedResponse,
  PagePaginatedResponse,
} from "@/types/api";
import type { Notification } from "@/types/notification";

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // ── Conversations query ────────────────────────────────────────────
  const {
    data: conversations,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => get<Conversation[]>("/conversations"),
    select: (res) => (res as ApiSuccess<Conversation[]>).data ?? [],
    enabled: !!userId,
  });

  // ── Derive other participant IDs ──────────────────────────────────
  const otherParticipantIds = useMemo(() => {
    if (!conversations || !userId) return [];
    const ids = new Set<string>();
    for (const c of conversations) {
      ids.add(c.user_one_id === userId ? c.user_two_id : c.user_one_id);
    }
    return Array.from(ids);
  }, [conversations, userId]);

  // ── Batch-fetch participant profiles ─────────────────────────────
  const profileResults = useQueries({
    queries: otherParticipantIds.map((id) => ({
      queryKey: ["users", id],
      queryFn: () => get<PublicUser>(`/users/${id}`),
      select: (
        res:
          | ApiSuccess<PublicUser>
          | CursorPaginatedResponse<PublicUser>
          | PagePaginatedResponse<PublicUser>,
      ) => (res as ApiSuccess<PublicUser>).data,
      enabled: !!userId,
    })),
  });

  // Build a lookup map: participant ID → profile (or null if failed)
  const profileMap = useMemo(() => {
    const map = new Map<string, PublicUser | null>();
    otherParticipantIds.forEach((id, i) => {
      map.set(id, profileResults[i]?.data ?? null);
    });
    return map;
  }, [otherParticipantIds, profileResults]);

  // ── Real-time: invalidate on message_received notification ────────
  useWebSocket(
    userId ? `user.${userId}` : "",
    (event: unknown) => {
      const notification = event as Notification;
      if (notification.type === "message_received") {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
    ".notification.sent",
  );

  // ── Helper: get other participant info ────────────────────────────
  function getOtherParticipant(convo: Conversation): {
    name: string;
    avatarPublicId: string | null;
    initial: string;
  } {
    const otherId =
      convo.user_one_id === userId ? convo.user_two_id : convo.user_one_id;
    const profile = profileMap.get(otherId);
    return {
      name: profile?.name ?? "Unknown User",
      avatarPublicId: profile?.avatar_public_id ?? null,
      initial: (profile?.name ?? "?").charAt(0).toUpperCase(),
    };
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading || !userId) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl animate-pulse space-y-3 p-4 md:p-8">
          <div className="h-8 w-40 rounded bg-surface-warm-200" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-surface-warm-200 bg-white p-4"
            >
              <div className="h-12 w-12 rounded-full bg-surface-warm-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-surface-warm-200" />
                <div className="h-3 w-48 rounded bg-surface-warm-200" />
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              {(error as unknown as ApiError)?.message ||
                "Failed to load conversations."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────
  if (!conversations || conversations.length === 0) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Conversations
          </h1>
          <div className="mt-8 rounded-lg border border-surface-warm-200 bg-white p-12 text-center">
            <p className="text-sm text-surface-warm-500">
              Conversations unlock when you send or receive a skill request.
            </p>
            <Link
              href="/skills"
              className="mt-3 inline-block rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600"
            >
              Browse skills
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── List ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <h1 className="font-display text-2xl font-bold text-surface-ink-800">
          Conversations
        </h1>

        <div className="space-y-2">
          {conversations.map((convo) => {
            const other = getOtherParticipant(convo);
            const preview =
              convo.last_message_preview ?? convo.messages?.[0]?.content;
            const unread = convo.unread_count ?? 0;

            return (
              <Link
                key={convo.id}
                href={`/conversations/${convo.id}`}
                className="flex items-center gap-4 rounded-lg border border-surface-warm-200 bg-white p-4 transition-colors hover:border-accent-teach-300 hover:shadow-sm"
              >
                {/* Avatar */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-accent-teach-100">
                  {other.avatarPublicId ? (
                    <Image
                      src={getCloudinaryUrl(other.avatarPublicId, {
                        width: 100,
                        height: 100,
                      })}
                      alt={other.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-accent-teach-400">
                      {other.initial}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-surface-ink-700">
                      {other.name}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-teach-500 px-1.5 text-xs font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  {preview && (
                    <p className="mt-0.5 truncate text-xs text-surface-warm-400">
                      {preview}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
