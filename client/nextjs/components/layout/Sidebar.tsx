"use client";

// components/layout/Sidebar.tsx
// Static navigation sidebar for authenticated pages.
//
// Desktop: persistent left sidebar (240px wide).
// Mobile: hidden by default — hamburger toggle to be added in a future pass.
//
// The unread message badge is a placeholder — it'll be wired to a
// conversations query hook when the chat UI is built.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skills", label: "Browse Skills" },
  { href: "/skills/manage", label: "Manage Skills" },
  { href: "/requests", label: "My Requests" },
  { href: "/conversations", label: "Conversations" },
  { href: "/profile", label: "Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      await logout();
      router.replace("/auth/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="flex w-60 flex-col border-r border-surface-warm-200 bg-surface-warm-50 px-4 py-6 h-full">
      {/* Logo / brand */}
      <Link
        href="/dashboard"
        className="mb-8 font-display text-xl font-semibold text-surface-ink-800"
      >
        SkillSwap
      </Link>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-teach-100 text-accent-teach-800"
                  : "text-surface-ink-600 hover:bg-surface-warm-200 hover:text-surface-ink-800"
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-teach-500 px-1.5 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-surface-warm-200 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isSigningOut}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-surface-ink-600 transition-colors hover:bg-surface-warm-200 hover:text-surface-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </button>
      </div>
    </aside>
  );
}
