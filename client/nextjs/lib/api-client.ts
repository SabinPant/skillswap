// lib/api-client.ts
// Typed fetch wrapper for the SkillSwap REST API.
//
// Responsibilities:
// - Attach Sanctum Bearer token from localStorage
// - Parse JSON and validate the response envelope
// - Normalise errors into a thrown ApiError object
// - Handle 401 by attempting token refresh, then redirecting to /login
// - Support multipart FormData for file uploads (avatar, chat attachments)

import type {
  ApiSuccess,
  ApiError,
  CursorPaginatedResponse,
  PagePaginatedResponse,
} from '@/types/api';

// ── Configuration ──────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ── Response type used internally by request() ─────────────────────────

type ApiResponse<T> =
  | ApiSuccess<T>
  | CursorPaginatedResponse<T>
  | PagePaginatedResponse<T>;

// ── Public API ─────────────────────────────────────────────────────────

/**
 * GET a resource or a list.
 * Returns any of the three envelope shapes since GET endpoints
 * can return single resources, cursor-paginated lists, or page-paginated lists.
 */
export async function get<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  return request<T>(path, { ...options, method: 'GET' });
}

/**
 * POST JSON or FormData to create a resource.
 * POST endpoints always return a plain ApiSuccess (never paginated).
 */
export async function post<T>(
  path: string,
  body?: Record<string, unknown> | FormData,
  options?: RequestInit,
): Promise<ApiSuccess<T>> {
  return request<T>(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }) as Promise<ApiSuccess<T>>;
}

/**
 * PUT JSON to update a resource.
 * PUT endpoints always return a plain ApiSuccess (never paginated).
 */
export async function put<T>(
  path: string,
  body?: Record<string, unknown>,
  options?: RequestInit,
): Promise<ApiSuccess<T>> {
  return request<T>(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<ApiSuccess<T>>;
}

/**
 * DELETE a resource.
 * DELETE endpoints return ApiSuccess<null> (204 No Content or 200 with null data).
 */
export async function del(
  path: string,
  options?: RequestInit,
): Promise<ApiSuccess<null>> {
  return request<null>(path, { ...options, method: 'DELETE' }) as Promise<ApiSuccess<null>>;
}

// ── Internal request handler ───────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData — the browser sets it with the boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return { success: true, data: null };
  }

  const json = await response.json();

  if (!response.ok) {
    // 401 — try token refresh, then redirect
    if (response.status === 401 && token) {
      const refreshed = await tryRefresh(token);
      if (refreshed) {
        // Retry the original request with the new token
        headers['Authorization'] = `Bearer ${refreshed}`;
        const retryResponse = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }
      // Refresh failed or retry still failed — clear token and redirect
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    // Normalise all errors to the ApiError shape
    const error: ApiError = {
      success: false,
      message: json.message || 'An unexpected error occurred',
      code: json.code || 'INTERNAL_ERROR',
      timestamp: json.timestamp || new Date().toISOString(),
      errors: json.errors || [],
    };

    throw error;
  }

  return json;
}

// ── Token refresh ──────────────────────────────────────────────────────

/**
 * Attempt to refresh the current token.
 * Returns the new token string, or null if refresh failed.
 */
async function tryRefresh(currentToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!response.ok) return null;

    const json: ApiSuccess<{ token: string }> = await response.json();
    const newToken = json.data?.token;

    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      return newToken;
    }

    return null;
  } catch {
    return null;
  }
}