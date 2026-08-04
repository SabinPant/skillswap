"use client";

// app/admin/users/page.tsx
// Admin user management — list all users, suspend/unsuspend.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/lib/api-client";
import AdminLayout from "@/components/admin/AdminLayout";
import type { AuthUser } from "@/types/user";

interface PaginatedUsers {
  data: AuthUser[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => get<AuthUser[]>("/admin/users"),
    select: (res) => {
      const r = res as unknown as { data: PaginatedUsers };
      return r.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => put(`/admin/users/${id}/suspend`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => put(`/admin/users/${id}/unsuspend`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-ink-800">
            Users
          </h1>
          <p className="mt-1 text-sm text-surface-warm-500">
            {data?.total ?? 0} registered users.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-surface-warm-200 bg-white p-4"
              >
                <div className="h-4 w-40 rounded bg-surface-warm-200" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Failed to load users.</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <div className="overflow-hidden rounded-lg border border-surface-warm-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-warm-200 bg-surface-warm-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-surface-warm-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-warm-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-warm-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-warm-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-surface-warm-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-warm-100">
                {data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-warm-50">
                    <td className="px-4 py-3 font-medium text-surface-ink-700">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-surface-warm-500">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-accent-teach-100 text-accent-teach-700"
                            : "bg-surface-warm-200 text-surface-warm-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.is_suspended
                            ? "bg-red-100 text-red-700"
                            : "bg-state-success-100 text-state-success-700"
                        }`}
                      >
                        {user.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== "admin" &&
                        (user.is_suspended ? (
                          <button
                            onClick={() => unsuspendMutation.mutate(user.id)}
                            disabled={unsuspendMutation.isPending}
                            className="text-sm font-medium text-state-success-600 hover:text-state-success-700 disabled:opacity-50"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendMutation.mutate(user.id)}
                            disabled={suspendMutation.isPending}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
