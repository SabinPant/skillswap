// types/skillRequest.ts
// SkillRequest types verified against backend response shapes.
//
// Two relationship-loading patterns exist:
// - findIncoming: eager-loads learner + skill
// - findOutgoing: eager-loads teacher + skill
// - findByIdForParticipant (show endpoint): no eager-loading
//
// The optional related fields (learner, teacher, skill) are only present
// when the backend includes them. Components should check for their
// presence before rendering.

import type { SkillRequestStatus } from './enums';
import type { PublicUser } from './user';
import type { Skill } from './skill';
import type { Review } from './review';

// ── Core model (columns on the skill_requests table) ───────────────────

export interface SkillRequest {
  id: string;
  learner_id: string;
  teacher_id: string;
  skill_id: string;
  status: SkillRequestStatus;
  message: string | null;
  proposed_at: string | null; // ISO 8601 (UTC)
  timezone: string | null;    // IANA timezone identifier
  cancellation_reason: string | null;
  cancelled_by: string | null;
  completed_by: string | null;
  completed_at: string | null; // ISO 8601
  expires_at: string | null;   // ISO 8601
  created_at: string;
  updated_at: string;
  current_user_has_reviewed?: boolean;
  current_user_review?: Review | null;

  // Eager-loaded relationships (only present when loaded by the backend)
  learner?: PublicUser;
  teacher?: PublicUser;
  skill?: Skill;
}

// ── Request payloads ───────────────────────────────────────────────────

export interface CreateSkillRequest {
  teacher_id: string;
  skill_id: string;
  message?: string;
  proposed_at?: string;
  timezone?: string;
}

export interface CancelSkillRequest {
  reason: string;
}