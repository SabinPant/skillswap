"use client";

// components/dashboard/QuickActions.tsx
// Static quick-action buttons for the dashboard.
// No data fetching — just styled links to key pages.

import Link from "next/link";

const actions = [
  {
    href: "/skills",
    label: "Browse Skills",
    description: "Find someone to learn from",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    href: "/requests",
    label: "My Requests",
    description: "View incoming and outgoing",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    href: "/conversations",
    label: "Conversations",
    description: "Chat with your connections",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-lg border border-surface-warm-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-surface-ink-700 mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-md p-3 text-sm transition-colors hover:bg-surface-warm-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-teach-50 text-accent-teach-600">
              {action.icon}
            </span>
            <div>
              <p className="font-medium text-surface-ink-700">{action.label}</p>
              <p className="text-xs text-surface-warm-500">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
