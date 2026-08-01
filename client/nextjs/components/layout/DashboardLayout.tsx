"use client";

// components/layout/DashboardLayout.tsx
// Authenticated app shell — wraps protected pages in AuthGuard,
// then renders a mobile header (with hamburger toggle) + persistent
// desktop sidebar + scrollable main content area.
//
// Mobile: sidebar is hidden behind a hamburger toggle with overlay.
// Desktop: sidebar is always visible (240px), no header bar needed.

import { useState, type ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Mobile header — visible only below md breakpoint */}
        <header className="flex items-center justify-between border-b border-surface-warm-200 bg-surface-warm-50 px-4 py-3 md:hidden">
          <span className="font-display text-lg font-semibold text-surface-ink-800">
            SkillSwap
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-surface-ink-600 hover:bg-surface-warm-200"
            aria-label="Toggle navigation"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 z-50 h-full w-60 bg-surface-warm-50 shadow-lg">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Desktop sidebar — always visible */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
