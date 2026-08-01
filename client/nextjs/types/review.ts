// types/review.ts
// Review types verified against backend response shapes.
//
// The review listing (findByReviewee) eager-loads reviewer with only:
//   id, name, avatar_public_id
// This is a lighter shape than PublicUser — no bio, location, or timestamps.
//
// reviewee_id is derived by the service (the other participant), never
// submitted by the client. The create request only needs skill_request_id,
// rating, and optional comment.

// ── Lightweight reviewer (eager-loaded on review listings) ─────────────

export interface ReviewReviewer {
  id: string;
  name: string;
  avatar_public_id: string | null;
}

// ── Review ─────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  skill_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number; // 1–5
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;

  // Eager-loaded by findByReviewee()
  reviewer?: ReviewReviewer;
}

// ── Request payload ────────────────────────────────────────────────────

export interface CreateReviewRequest {
  skill_request_id: string;
  rating: number;
  comment?: string;
}