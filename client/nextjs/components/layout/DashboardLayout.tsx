"use client";

import { useState, type ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* --- Mobile Header --- */}
        <header className="flex items-center justify-between border-b border-surface-warm-200 bg-surface-warm-50 px-4 py-3 md:hidden">
          <span className="font-display text-lg font-semibold text-surface-ink-800">
            SkillSwap
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell />
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
          </div>
        </header>

        {/* --- Mobile Sidebar Overlay --- */}
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

        {/* --- Desktop Sidebar --- */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* --- Main Content Area Wrapper --- */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Desktop Header (Hidden on Mobile) */}
          <header className="hidden md:flex h-16 items-center justify-end border-b border-surface-warm-200 bg-surface-warm-50 px-8">
            <NotificationBell />
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
