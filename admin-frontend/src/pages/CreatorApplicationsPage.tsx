import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveCreatorApplication,
  listCreatorApplications,
  rejectCreatorApplication,
  type CreatorApplicationStatus,
} from '../lib/admin-api';

function formatDateTime(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

export function CreatorApplicationsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CreatorApplicationStatus | 'PENDING_REVIEW'>('PENDING_REVIEW');

  const applicationsQuery = useQuery({
    queryKey: ['admin', 'creator-applications', page, status],
    queryFn: () =>
      listCreatorApplications({
        page,
        limit: 15,
        status: status === 'PENDING_REVIEW' ? undefined : status,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (applicationId: string) => approveCreatorApplication(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'creator-applications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { applicationId: string; reason: string }) =>
      rejectCreatorApplication(payload.applicationId, payload.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'creator-applications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const listError =
    applicationsQuery.data && !applicationsQuery.data.success ? applicationsQuery.data.error : null;

  const responseData =
    applicationsQuery.data && applicationsQuery.data.success ? applicationsQuery.data.data : null;

  const items = responseData?.items ?? [];
  const pagination = responseData?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  const handleApprove = async (applicationId: string) => {
    const response = await approveMutation.mutateAsync(applicationId);
    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = window.prompt('Rejection reason (minimum 5 chars):', 'Insufficient verification data');
    if (!reason || reason.trim().length < 5) {
      window.alert('A valid rejection reason is required.');
      return;
    }

    const response = await rejectMutation.mutateAsync({
      applicationId,
      reason: reason.trim(),
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Creator Applications</h2>
      </header>

      <section className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <select
          aria-label="Filter creator applications by status"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as CreatorApplicationStatus | 'PENDING_REVIEW');
          }}
          className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
        >
          <option value="PENDING_REVIEW">Pending/Under Review</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <button
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['admin', 'creator-applications'] })}
          aria-label="Refresh creator applications"
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

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
          Review Queue
        </h3>

        {applicationsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading applications...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-400">No applications found for this filter.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-[#0d0d0f] p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-100">{item.user.name}</p>
                    <p className="text-zinc-400">@{item.user.username} • {item.user.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">Application ID: {item.id}</p>
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      item.status === 'APPROVED'
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : item.status === 'REJECTED'
                          ? 'bg-red-500/15 text-red-200'
                          : 'bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-zinc-300 md:grid-cols-2">
                  <p>Submitted: {formatDateTime(item.submittedAt)}</p>
                  <p>Reviewed: {formatDateTime(item.reviewedAt)}</p>
                  <p>ID Type: {item.identity?.idType ?? 'N/A'}</p>
                  <p>Financial Verified: {item.financial?.isVerified ? 'Yes' : 'No'}</p>
                </div>

                {item.profile?.bio ? (
                  <p className="mt-3 line-clamp-3 text-zinc-400">{item.profile.bio}</p>
                ) : null}

                {item.status === 'PENDING' || item.status === 'UNDER_REVIEW' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(item.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="rounded-xl bg-emerald-500/80 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(item.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="rounded-xl bg-red-500/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                ) : item.status === 'REJECTED' && item.rejectionReason ? (
                  <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    Rejection reason: {item.rejectionReason}
                  </p>
                ) : null}
              </article>
            ))}
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
    </div>
  );
}
