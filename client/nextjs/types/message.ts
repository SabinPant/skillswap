// types/message.ts
// Conversation and Message types verified against backend response shapes.
//
// The Conversation list (findByUser) includes:
// - the last message preview (eager-loaded via messages relation, limit 1)
// - unread_count (computed via withCount subquery)
// - last_message_at and last_message_preview (denormalized on the row)
// - user_one_id / user_two_id (raw IDs — no eager-loaded user objects)
//
// The broadcast payload (MessageSent::broadcastWith) shares the same shape
// as the REST Message response, with an optional attachment object.

import type { MessageType } from './enums';

// ── Conversation (list item) ───────────────────────────────────────────

export interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  initiating_skill_request_id: string | null;
  last_message_at: string | null;     // ISO 8601
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;

  // Eager-loaded by findByUser()
  messages?: Message[];               // latest message only (limit 1)
  unread_count?: number;              // computed via withCount subquery
}

// ── Message ────────────────────────────────────────────────────────────

export interface AttachmentMeta {
  public_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  attachment_public_id: string | null;
  attachment_original_filename: string | null;
  attachment_mime_type: string | null;
  attachment_size_bytes: number | null;
  is_read: boolean;
  created_at: string; // ISO 8601

  // Only present in broadcast payloads when an attachment exists
  attachment?: AttachmentMeta;
}

// ── Request payload ────────────────────────────────────────────────────

export interface SendMessageRequest {
  content?: string;
  attachment?: File; // FormData file field
}