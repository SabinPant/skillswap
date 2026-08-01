"use client";

// components/layout/DashboardLayout.tsx
// Authenticated app shell — wraps protected pages in AuthGuard,
// then renders a persistent sidebar + scrollable main content area.
//
// Mobile: sidebar is hidden (collapsed), content takes full width.
// Desktop: sidebar is visible (240px), content fills remaining space.

import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
