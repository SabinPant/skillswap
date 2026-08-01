// types/user.ts
// User resource types verified against the backend's actual response shapes.
//
// Two distinct shapes exist:
// - AuthUser: the full model (returned by /auth/me, /auth/register, /auth/login)
// - PublicUser: curated public fields only (returned by /users/{id})
//
// password is never exposed — Laravel's $hidden on the User model strips it.

import type { UserRole } from './enums';

// ── Full authenticated user ────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: string | null;
  bio: string | null;
  avatar_public_id: string | null;
  email_verified_at: string | null; // ISO 8601
  is_suspended: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ── Public profile (returned by GET /users/{id}) ────────────────────────

export interface PublicUser {
  id: string;
  name: string;
  bio: string | null;
  location: string | null;
  avatar_public_id: string | null;
  created_at: string; // ISO 8601
}

// ── Auth payloads ───────────────────────────────────────────────────────

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  location?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}