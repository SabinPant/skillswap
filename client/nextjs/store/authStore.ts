// store/authStore.ts
// Zustand store for authentication state.
//
// Responsibilities:
// - Hold the current user (AuthUser) and token in memory
// - Persist/restore token from localStorage for session survival
// - Provide login, register, logout, and hydrate actions
// - Keep isAuthenticated and isEmailVerified as plain booleans
//   updated synchronously with every state change (no getters)
//
// Token refresh is handled transparently by the API client (lib/api-client.ts).

import { create } from 'zustand';
import type { AuthUser, AuthResponse } from '@/types/user';
import { post, get, del } from '@/lib/api-client';

// ── Store shape ────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    location?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

// ── Store implementation ───────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isEmailVerified: false,

  // ── Actions ─────────────────────────────────────────────────────────

  /**
   * Authenticate with email and password.
   * Stores the returned user and token in state + localStorage.
   */
  login: async (email: string, password: string) => {
    const response = await post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    const { user, token } = response.data!;

    localStorage.setItem('auth_token', token);
    set({
      user,
      token,
      isAuthenticated: true,
      isEmailVerified: user.email_verified_at !== null,
    });
  },

  /**
   * Register a new account.
   * Stores the returned user and token in state + localStorage.
   */
  register: async (data) => {
    const response = await post<AuthResponse>('/auth/register', data);

    const { user, token } = response.data!;

    localStorage.setItem('auth_token', token);
    set({
      user,
      token,
      isAuthenticated: true,
      isEmailVerified: user.email_verified_at !== null,
    });
  },

  /**
   * Log out — revoke the server-side token, then clear local state.
   */
  logout: async () => {
    try {
      await del('/auth/logout');
    } finally {
      // Always clear local state, even if the server call fails
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isEmailVerified: false,
      });
    }
  },

  /**
   * Hydrate user state from a stored token on app load.
   * Called once when the app mounts — if the token is valid,
   * fetches the current user from GET /auth/me.
   */
  hydrate: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Temporarily set the token so the API client can use it
    set({ token });

    try {
      const response = await get<AuthUser>('/auth/me');
      const user = response.data as AuthUser | null;

      set({
        user,
        isAuthenticated: true,
        isEmailVerified: user?.email_verified_at !== null,
      });
    } catch {
      // Token is invalid or expired — clear everything
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isEmailVerified: false,
      });
    }
  },

  /**
   * Update the cached user after profile changes or email verification.
   */
  setUser: (user: AuthUser) => {
    set({
      user,
      isEmailVerified: user.email_verified_at !== null,
    });
  },
}));