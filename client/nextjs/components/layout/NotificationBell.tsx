"use client";

// components/layout/NotificationBell.tsx
// Notification bell with unread badge and dropdown.
// Fetches notifications via TanStack Query, listens for real-time
// updates via useWebSocket, and supports mark-read / mark-all-read.

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { get, put } from "@/lib/api-client";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Notification } from "@/types/notification";

// ── Helpers ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getNotificationLink(notification: Notification): string {
  const data = notification.data as Record<string, string> | undefined;
  const requestId = data?.skill_request_id;
  const conversationId = data?.conversation_id;

  switch (notification.type) {
    case "message_received":
      return conversationId ? `/conversations/${conversationId}` : "/dashboard";
    case "request_received":
    case "request_accepted":
    case "request_rejected":
    case "request_cancelled":
    case "request_completed":
    case "request_expired":
    case "session_reminder":
    case "review_received":
      return requestId ? `/requests/${requestId}` : "/dashboard";
    default:
      return "/dashboard";
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenRealtimeIds = useRef(new Set<string>());
  const userId = user?.id;

  // ── Fetch notifications ────────────────────────────────────────────
  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => get<unknown>("/notifications"),
    select: (res) => {
      const response = res as { data: { data: Notification[] } };
      const items = response.data?.data ?? [];
      return Array.from(new Map(items.map((item) => [item.id, item])).values());
    },
    enabled: !!userId,
  });

  const { data: realtimeUnreadCount } = useQuery<number | null>({
    queryKey: ["notification-badge-count", userId],
    queryFn: async () => null,
    enabled: false,
  });

  const fetchedUnreadCount =
    notifications?.filter((n) => !n.is_read).length ?? 0;
  const unreadCount = realtimeUnreadCount ?? fetchedUnreadCount;

  // ── Mark one as read ───────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.setQueryData(["notification-badge-count", userId], null);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // ── Mark all as read ───────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: () => put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.setQueryData(["notification-badge-count", userId], null);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // ── Real-time updates ──────────────────────────────────────────────
  const handleRealtime = useCallback(
    (event: unknown) => {
      const incoming = event as {
        id?: unknown;
        type?: unknown;
        unread_count?: unknown;
      };

      if (typeof incoming.id !== "string") {
        return;
      }

      if (seenRealtimeIds.current.has(incoming.id)) {
        return;
      }

      seenRealtimeIds.current.add(incoming.id);

      if (typeof incoming.unread_count === "number") {
        queryClient.setQueryData(
          ["notification-badge-count", userId],
          incoming.unread_count,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [queryClient, userId],
  );

  useWebSocket(
    userId ? `user.${userId}` : "",
    handleRealtime,
    ".notification.sent",
  );

  // ── Close dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-surface-ink-600 hover:bg-surface-warm-200"
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-surface-warm-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-warm-100 px-4 py-3">
            <h3 className="font-display text-sm font-semibold text-surface-ink-700">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-accent-teach-600 hover:text-accent-teach-700 disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 w-3/4 rounded bg-surface-warm-200" />
                  <div className="h-2 w-1/2 rounded bg-surface-warm-200" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600">Failed to load</p>
              <button
                onClick={() => refetch()}
                className="mt-1 text-xs text-red-600 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && notifications?.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-surface-warm-500">
                No notifications yet
              </p>
            </div>
          )}

          {/* List */}
          {!isLoading &&
            !isError &&
            notifications &&
            notifications.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      if (!n.is_read) {
                        await markReadMutation.mutateAsync(n.id);
                      }
                      setOpen(false);
                      router.push(getNotificationLink(n));
                    }}
                    className={`flex w-full gap-3 border-b border-surface-warm-50 px-4 py-3 text-left transition-colors hover:bg-surface-warm-50 ${
                      !n.is_read ? "bg-accent-teach-50/50" : ""
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5">
                      {!n.is_read && (
                        <span className="block h-2 w-2 rounded-full bg-accent-teach-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-surface-ink-700">
                        {n.title}
                      </p>
                      <p className="truncate text-xs text-surface-warm-500">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-surface-warm-400">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
