"use client";

// components/admin/AdminLayout.tsx
// Admin-only layout — checks role === 'admin', renders sidebar + content.
// If user is not admin, shows "Access denied."

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-warm-200">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Access denied
          </h1>
          <p className="mt-2 text-surface-warm-500">
            You need admin privileges to view this page.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-accent-teach-600 underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-warm-50">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-surface-warm-200 bg-surface-warm-50 px-4 py-6 md:flex">
        <Link
          href="/admin"
          className="mb-8 font-display text-lg font-semibold text-surface-ink-800"
        >
          Admin
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-teach-100 text-accent-teach-800"
                    : "text-surface-ink-600 hover:bg-surface-warm-200 hover:text-surface-ink-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
