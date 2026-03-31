import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import type { UserListItem } from "../types";
import { roleStyle, formatDateTime } from "../utils";

interface UsersListSectionProps {
  query: UseQueryResult<
    | { success: true; data: { items: UserListItem[]; pagination: any } }
    | { success: false; error: string }
  >;
  users: UserListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  selectedId: string | null;
  onSelectUser: (userId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function UsersListSection({
  query,
  users,
  pagination,
  selectedId,
  onSelectUser,
  onPreviousPage,
  onNextPage,
}: UsersListSectionProps) {
  return (
    <AdminSectionCard title="Users" description="Browse and select users to view details">
      {query.isLoading ? (
        <p className="text-sm text-zinc-400">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-zinc-400">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-208 text-left text-sm">
            <thead className="text-zinc-400">
              <tr>
                <th className="pb-2">User</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Application</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectUser(user.id);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Select user ${user.name}`}
                  className={`cursor-pointer border-t border-white/5 transition hover:bg-white/3 ${
                    selectedId === user.id ? "bg-white/6" : ""
                  }`}
                >
                  <td className="py-3">
                    <p className="font-medium text-zinc-100">{user.name}</p>
                    <p className="text-xs text-zinc-500">@{user.username}</p>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${roleStyle(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-300">
                    {user.creatorApplication?.status ?? "NONE"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        user.isSuspended
                          ? "bg-red-500/15 text-red-200"
                          : "bg-emerald-500/15 text-emerald-200"
                      }`}
                    >
                      {user.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-300">{formatDateTime(user.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
        <p className="text-zinc-400">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)} • Total {pagination.total}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-white/15 px-3 py-1 text-zinc-200 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-white/15 px-3 py-1 text-zinc-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </AdminSectionCard>
  );
}
