"use client";

// app/conversations/[id]/page.tsx
// Message thread — real-time chat with infinite scroll and attachments.
//
// Fetches message history via useInfiniteQuery (newest first, cursor-paginated).
// Sends text/attachment via useMutation, inserts optimistically into cache.
// Receives messages in real time via useWebSocket, dedup by message ID.
// Implicit mark-read on first fetch (backend handles it).
// Own messages right-aligned, others left-aligned.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { get, post } from "@/lib/api-client";
import { useWebSocket } from "@/hooks/useWebSocket";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import type { Message } from "@/types/message";
import type {
  CursorPaginatedResponse,
  ApiSuccess,
  ApiError,
} from "@/types/api";

interface MessagePage {
  data: Message[];
  next_cursor: string | null;
}

export default function ConversationThreadPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const shouldScrollRef = useRef(false);
  const prevMessageCountRef = useRef(0);

  // ── Infinite query for messages (newest first) ─────────────────────
  const {
    data: messagePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrorObj,
    refetch,
  } = useInfiniteQuery<MessagePage>({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const url = cursor
        ? `/conversations/${conversationId}/messages?cursor=${cursor}`
        : `/conversations/${conversationId}/messages`;
      const res = await get<Message>(url);
      const paginated = res as unknown as CursorPaginatedResponse<Message>;
      return {
        data: paginated.data.data,
        next_cursor: paginated.data.next_cursor,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!userId,
  });

  // Flatten all messages from pages in chronological order (oldest top, newest bottom)
  const messages = useMemo(() => {
    if (!messagePages?.pages) return [];
    return messagePages.pages.flatMap((p) => p.data).reverse();
  }, [messagePages]);

  const markShouldScroll = useCallback(() => {
    shouldScrollRef.current = true;
  }, []);

  // ── Dedup-safe cache insertion ────────────────────────────────────
  const addMessageToCache = useCallback(
    (message: Message) => {
      let wasAdded = false;

      queryClient.setQueryData<{
        pages: MessagePage[];
        pageParams: unknown[];
      }>(["messages", conversationId], (old) => {
        if (!old) return old;
        // Check if this message already exists in any page
        const exists = old.pages.some((page) =>
          page.data.some((m) => m.id === message.id),
        );
        if (exists) return old;

        wasAdded = true;

        // Prepend to the first (newest) page
        const newPages = old.pages.map((page, index) => {
          if (index === 0) {
            return { ...page, data: [message, ...page.data] };
          }
          return page;
        });

        return { ...old, pages: newPages };
      });

      if (wasAdded) {
        markShouldScroll();
      }
    },
    [queryClient, conversationId, markShouldScroll],
  );

  // ── Send message mutation ─────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async () => {
      setSendError(null);
      if (file) {
        const formData = new FormData();
        formData.append("content", text);
        formData.append("attachment", file);
        return post<Message>(
          `/conversations/${conversationId}/messages`,
          formData,
        );
      }
      return post<Message>(`/conversations/${conversationId}/messages`, {
        content: text,
      });
    },
    onSuccess: (response) => {
      setSendError(null);
      const message = (response as ApiSuccess<Message>).data;
      if (message) {
        addMessageToCache(message);
      }
      setText("");
      setFile(null);
    },
    onError: (error) => {
      const apiError = error as unknown as ApiError;
      if (apiError.errors && !Array.isArray(apiError.errors)) {
        const first = Object.values(apiError.errors)[0];
        if (first?.length) {
          setSendError(first[0]);
          return;
        }
      }
      setSendError(apiError?.message || "Failed to send message.");
    },
  });

  // ── WebSocket for real-time messages ──────────────────────────────
  useWebSocket(
    `conversation.${conversationId}`,
    (event: unknown) => {
      console.log("[WS] received:", event);
      const message = event as Message;
      addMessageToCache(message);
    },
    ".message.sent",
  );

  // ── Scroll to bottom on new messages ──────────────────────────────
  useEffect(() => {
    const isInitialLoad =
      prevMessageCountRef.current === 0 && messages.length > 0;

    if (shouldScrollRef.current || isInitialLoad) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }

    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // ── Handler helpers ───────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    sendMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const isOwn = (senderId: string) => senderId === userId;

  // ── Render attachment ─────────────────────────────────────────────
  const renderAttachment = (msg: Message) => {
    const isImage =
      msg.type === "image" ||
      (msg.attachment_mime_type &&
        msg.attachment_mime_type.startsWith("image/"));
    if (msg.attachment_public_id) {
      if (isImage) {
        return (
          <Image
            src={getCloudinaryUrl(msg.attachment_public_id, {
              width: 400,
              height: 300,
            })}
            alt={msg.attachment_original_filename || "attachment"}
            width={400}
            height={300}
            className="mt-2 rounded-md object-cover"
          />
        );
      }
      return (
        <a
          href={getCloudinaryUrl(msg.attachment_public_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-accent-teach-600 underline"
        >
          {msg.attachment_original_filename || "Download file"}
        </a>
      );
    }
    return null;
  };

  // ── Input Area ────────────────────────────────────────────────────
  const renderInputArea = () => (
    <div className="border-t border-surface-warm-200 bg-white p-4">
      {sendError && (
        <p className="mb-2 text-xs font-medium text-red-600">{sendError}</p>
      )}
      <form onSubmit={handleSend} className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none rounded-md border border-surface-warm-300 px-3 py-2 text-sm focus:border-accent-teach-500 focus:outline-none focus:ring-1 focus:ring-accent-teach-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-surface-warm-300 px-3 py-2 text-sm text-surface-ink-600 hover:bg-surface-warm-100"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
          {file && (
            <span className="self-center text-xs text-surface-warm-500">
              {file.name}
            </span>
          )}
          <button
            type="submit"
            disabled={sendMutation.isPending || (!text.trim() && !file)}
            className="rounded-md bg-accent-teach-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-teach-600 disabled:opacity-50"
          >
            {sendMutation.isPending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );

  // ── Loading skeleton ──────────────────────────────────────────────
  if (messagesLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div className="h-16 w-48 animate-pulse rounded-lg bg-surface-warm-200" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (messagesError) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-700">
              {(messagesErrorObj as unknown as ApiError)?.message ||
                "Failed to load messages."}
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

  // ── Empty state ───────────────────────────────────────────────────
  if (!messagesLoading && messages.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-surface-warm-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
          {/* Input area even when empty */}
          {renderInputArea()}
        </div>
      </DashboardLayout>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="border-b border-surface-warm-200 bg-white p-4">
          <Link
            href="/conversations"
            className="text-sm text-surface-warm-500 hover:text-surface-ink-600"
          >
            ← Back to conversations
          </Link>
        </div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
        >
          {/* Load older messages button */}
          {hasNextPage && (
            <div className="text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-accent-teach-600 hover:text-accent-teach-700 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load older messages"}
              </button>
            </div>
          )}

          {messages.map((msg) => {
            const own = isOwn(msg.sender_id);
            return (
              <div
                key={msg.id}
                className={`flex ${own ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    own
                      ? "bg-accent-teach-500 text-white"
                      : "bg-surface-warm-100 text-surface-ink-700"
                  }`}
                >
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {renderAttachment(msg)}
                  <p
                    className={`mt-1 text-xs ${
                      own ? "text-accent-teach-200" : "text-surface-warm-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Message input */}
        {renderInputArea()}
      </div>
    </DashboardLayout>
  );
}
