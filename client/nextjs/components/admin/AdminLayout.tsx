"use client";

// components/admin/AdminLayout.tsx
// Admin-only layout — checks role === 'admin', renders sidebar + content.
// Mobile: hamburger toggle with slide-out sidebar.
// Desktop: persistent sidebar with sign out at bottom.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      router.replace("/auth/login");
    } finally {
      setSigningOut(false);
    }
  };

  // Hydrating — show spinner
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-warm-200">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-teach-500 border-t-transparent" />
      </div>
    );
  }

  // Not admin
  if (user.role !== "admin") {
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
    <div className="flex min-h-screen flex-col bg-surface-warm-50 md:flex-row">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-surface-warm-200 bg-surface-warm-50 px-4 py-3 md:hidden">
        <span className="font-display text-lg font-semibold text-surface-ink-800">
          Admin
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
          <div className="absolute left-0 top-0 z-50 flex h-full w-56 flex-col bg-surface-warm-50 px-4 py-6 shadow-lg">
            <Link
              href="/admin"
              className="mb-8 font-display text-lg font-semibold text-surface-ink-800"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
            <nav className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
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
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="mt-auto rounded-md px-3 py-2 text-left text-sm font-medium text-surface-warm-500 transition-colors hover:bg-surface-warm-200 hover:text-red-600 disabled:opacity-50"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r border-surface-warm-200 bg-surface-warm-50 px-4 py-6 md:flex">
        <Link
          href="/admin"
          className="mb-8 font-display text-lg font-semibold text-surface-ink-800"
        >
          Admin
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
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
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="mt-auto rounded-md px-3 py-2 text-left text-sm font-medium text-surface-warm-500 transition-colors hover:bg-surface-warm-200 hover:text-red-600 disabled:opacity-50"
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
