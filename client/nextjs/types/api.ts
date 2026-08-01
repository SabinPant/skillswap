// types/api.ts
// Generic response envelope types verified against the backend's actual
// wire shapes (ApiResponseTrait, CursorPaginator, LengthAwarePaginator).
//
// Key findings from verification:
// - meta is only present when non-empty (optional on the type)
// - data can be null (204 No Content: logout, delete skill, delete user-skill)
// - Cursor paginator nests items + metadata under data (data.data, data.next_cursor)
// - Page paginator nests items + metadata under data (data.data, data.current_page, etc.)

// ── Success ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T | null;
  meta?: Record<string, unknown>;
}

// ── Paginated responses (both variants nest everything under data) ──────

/** Cursor-paginated list (messages, notifications, skill-request lists). */
export interface CursorPaginatedResponse<T> {
  success: true;
  data: {
    data: T[];
    next_cursor: string | null;
    per_page: number;
  };
}

/** Page-based paginated list (admin users, public reviews). */
export interface PagePaginatedResponse<T> {
  success: true;
  data: {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

// ── Error ──────────────────────────────────────────────────────────────

/**
 * errors is populated (Record<string, string[]>) for 422 validation failures,
 * and empty ([]) for domain exceptions (409, 400, 403, etc.).
 */
export interface ApiError {
  success: false;
  message: string;
  code: string;
  timestamp: string; // ISO 8601
  errors: Record<string, string[]> | [];
}