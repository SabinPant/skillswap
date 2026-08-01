// types/notification.ts
// Notification types verified against backend response shapes.
//
// The data payload varies by notification type. Four distinct shapes exist:
// - RequestData: skill request lifecycle events (6 types)
// - MessageData: new message received (with dedup counter)
// - SessionReminderData: scheduled reminder 24h before proposed session
// - Record<string, never>: fallback for any type that doesn't populate data
//
// is_read, unread_count, and is_dismissed are service-owned fields
// persisted via forceFill() — they are included in the API response.

import type { NotificationType } from './enums';

// ── Base notification (columns on the notifications table) ─────────────

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: RequestData | MessageData | SessionReminderData | Record<string, never>;
  is_read: boolean;
  unread_count: number;
  is_dismissed: boolean;
  created_at: string;
  updated_at: string;
}

// ── Data payloads by notification type ─────────────────────────────────

/**
 * Skill request lifecycle events:
 * request_received, request_accepted, request_rejected,
 * request_cancelled, request_completed, request_expired
 */
export interface RequestData {
  skill_request_id: string;
  skill_name: string;
  learner_name?: string; // only on request_received (NotifyTeacherOfNewRequest)
}

/**
 * New message received.
 * sender_name and preview are updated atomically via the Postgres || operator
 * on each new message in MessageSentListener.
 */
export interface MessageData {
  conversation_id: string;
  sender_name: string;
  preview: string;
  last_message_id: string;
}

/**
 * Session reminder (scheduled by SessionReminderJob).
 * Fires roughly 24 hours before the proposed session time.
 */
export interface SessionReminderData {
  skill_request_id: string;
  skill_name: string;
  proposed_at: string; // ISO 8601
}