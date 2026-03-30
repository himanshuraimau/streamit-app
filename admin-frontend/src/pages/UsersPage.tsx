import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUserDetail,
  listAdminUsers,
  updateAdminUserSuspension,
  type UserListItem,
} from '../lib/admin-api';

function roleStyle(role: UserListItem['role']) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'border-amber-300/40 bg-amber-500/10 text-amber-200';
    case 'ADMIN':
      return 'border-sky-300/40 bg-sky-500/10 text-sky-200';
    case 'CREATOR':
      return 'border-emerald-300/40 bg-emerald-500/10 text-emerald-200';
    default:
      return 'border-zinc-300/20 bg-zinc-500/10 text-zinc-200';
  }
}

function formatDateTime(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

export function UsersPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'ALL' | UserListItem['role']>('ALL');
  const [suspensionFilter, setSuspensionFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'users', page, search, role, suspensionFilter],
    queryFn: () =>
      listAdminUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: role === 'ALL' ? undefined : role,
        isSuspended:
          suspensionFilter === 'ALL' ? undefined : suspensionFilter === 'SUSPENDED',
      }),
  });

  const users = listQuery.data && listQuery.data.success ? listQuery.data.data.items : [];
  const pagination =
    listQuery.data && listQuery.data.success
      ? listQuery.data.data.pagination
      : { page: 1, limit: 15, total: 0, totalPages: 1 };

  const selectedId = useMemo(() => {
    if (selectedUserId) return selectedUserId;
    return users[0]?.id ?? null;
  }, [selectedUserId, users]);

  const detailQuery = useQuery({
    queryKey: ['admin', 'user-detail', selectedId],
    queryFn: () => getAdminUserDetail(selectedId ?? ''),
    enabled: Boolean(selectedId),
  });

  const selectedDetail =
    detailQuery.data && detailQuery.data.success ? detailQuery.data.data : null;

  const updateSuspensionMutation = useMutation({
    mutationFn: (payload: { userId: string; isSuspended: boolean; reason?: string }) =>
      updateAdminUserSuspension(payload.userId, {
        isSuspended: payload.isSuspended,
        reason: payload.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
    },
  });

  const listError = listQuery.data && !listQuery.data.success ? listQuery.data.error : null;
  const detailError = detailQuery.data && !detailQuery.data.success ? detailQuery.data.error : null;

  const handleToggleSuspension = async () => {
    if (!selectedDetail) return;

    const nextState = !selectedDetail.isSuspended;
    let reason: string | undefined;

    if (nextState) {
      const reasonPrompt = window.prompt('Enter suspension reason (required):', 'Policy violation');
      if (!reasonPrompt || reasonPrompt.trim().length < 3) {
        window.alert('Suspension reason is required.');
        return;
      }
      reason = reasonPrompt.trim();
    }

    const response = await updateSuspensionMutation.mutateAsync({
      userId: selectedDetail.id,
      isSuspended: nextState,
      reason,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">User Management</h2>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#111113] p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Search by name, username, email"
          className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
        />

        <select
          value={role}
          onChange={(event) => {
            setPage(1);
            setRole(event.target.value as 'ALL' | UserListItem['role']);
          }}
          className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="CREATOR">Creator</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>

        <select
          value={suspensionFilter}
          onChange={(event) => {
            setPage(1);
            setSuspensionFilter(event.target.value as 'ALL' | 'ACTIVE' | 'SUSPENDED');
          }}
          className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
        >
          <option value="ALL">All States</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <button
          type="button"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10"
        >
          Refresh
        </button>
      </section>

      {listError ? (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {listError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">Users</h3>

          {listQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-zinc-400">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
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
                      onClick={() => setSelectedUserId(user.id)}
                      className={`cursor-pointer border-t border-white/5 transition hover:bg-white/[0.03] ${
                        selectedId === user.id ? 'bg-white/[0.06]' : ''
                      }`}
                    >
                      <td className="py-3">
                        <p className="font-medium text-zinc-100">{user.name}</p>
                        <p className="text-xs text-zinc-500">@{user.username}</p>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs ${roleStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-300">
                        {user.creatorApplication?.status ?? 'NONE'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            user.isSuspended
                              ? 'bg-red-500/15 text-red-200'
                              : 'bg-emerald-500/15 text-emerald-200'
                          }`}
                        >
                          {user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
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
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-white/15 px-3 py-1 text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-white/15 px-3 py-1 text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">User Detail</h3>

          {detailError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {detailError}
            </div>
          ) : detailQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading user detail...</p>
          ) : selectedDetail ? (
            <div className="space-y-4 text-sm text-zinc-300">
              <div>
                <p className="text-zinc-500">Name</p>
                <p className="text-zinc-100">{selectedDetail.name}</p>
              </div>
              <div>
                <p className="text-zinc-500">Email</p>
                <p>{selectedDetail.email}</p>
              </div>
              <div>
                <p className="text-zinc-500">Role</p>
                <p>{selectedDetail.role}</p>
              </div>
              <div>
                <p className="text-zinc-500">Current State</p>
                <p>{selectedDetail.isSuspended ? 'SUSPENDED' : 'ACTIVE'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Suspension Reason</p>
                <p>{selectedDetail.suspendedReason ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Wallet Balance</p>
                <p>{selectedDetail.coinWallet?.balance ?? 0}</p>
              </div>
              <div>
                <p className="text-zinc-500">Creator Application</p>
                <p>{selectedDetail.creatorApplication?.status ?? 'NONE'}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleToggleSuspension()}
                disabled={updateSuspensionMutation.isPending}
                className={`w-full rounded-xl px-3 py-2 text-sm font-medium text-white ${
                  selectedDetail.isSuspended
                    ? 'bg-emerald-500/80 hover:bg-emerald-500'
                    : 'bg-red-500/80 hover:bg-red-500'
                } disabled:opacity-40`}
              >
                {updateSuspensionMutation.isPending
                  ? 'Updating...'
                  : selectedDetail.isSuspended
                    ? 'Unsuspend User'
                    : 'Suspend User'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Select a user to view details.</p>
          )}
        </section>
      </div>
    </div>
  );
}
