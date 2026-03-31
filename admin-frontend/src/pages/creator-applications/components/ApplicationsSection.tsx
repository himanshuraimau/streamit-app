import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import type { CreatorApplicationListItem } from "../types";
import { formatDateTime } from "../utils";

interface ApplicationsSectionProps {
  query: UseQueryResult<
    | { success: true; data: { items: CreatorApplicationListItem[]; pagination: any } }
    | { success: false; error: string }
  >;
  onApprove: (applicationId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (applicationId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function ApplicationsSection({
  query,
  onApprove,
  onReject,
  onPreviousPage,
  onNextPage,
  isApproving,
  isRejecting,
}: ApplicationsSectionProps) {
  const responseData = query.data && query.data.success ? query.data.data : null;
  const items = responseData?.items ?? [];
  const pagination = responseData?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <AdminSectionCard title="Review Queue" description="Review and action creator applications">
      {query.isLoading ? (
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
                  <p className="text-zinc-400">
                    @{item.user.username} • {item.user.email}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Application ID: {item.id}</p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    item.status === "APPROVED"
                      ? "bg-emerald-500/15 text-emerald-200"
                      : item.status === "REJECTED"
                        ? "bg-red-500/15 text-red-200"
                        : "bg-amber-500/15 text-amber-200"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-zinc-300 md:grid-cols-2">
                <p>Submitted: {formatDateTime(item.submittedAt)}</p>
                <p>Reviewed: {formatDateTime(item.reviewedAt)}</p>
                <p>ID Type: {item.identity?.idType ?? "N/A"}</p>
                <p>Financial Verified: {item.financial?.isVerified ? "Yes" : "No"}</p>
              </div>

              {item.profile?.bio ? (
                <p className="mt-3 line-clamp-3 text-zinc-400">{item.profile.bio}</p>
              ) : null}

              {item.status === "PENDING" || item.status === "UNDER_REVIEW" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onApprove(item.id)}
                    disabled={isApproving || isRejecting}
                    className="rounded-xl bg-emerald-500/80 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(item.id)}
                    disabled={isApproving || isRejecting}
                    className="rounded-xl bg-red-500/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              ) : item.status === "REJECTED" && item.rejectionReason ? (
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
