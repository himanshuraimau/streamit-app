import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import type { ReportStatus, ModerationReportItem } from "../types";
import { REPORT_STATUSES } from "../constants";
import { formatDateTime } from "../utils";

interface ContentReportsSectionProps {
  query: UseQueryResult<
    | { success: true; data: { items: ModerationReportItem[]; pagination: any } }
    | { success: false; error: string }
  >;
  reportStatus: ReportStatus | "PENDING_REVIEW";
  onStatusChange: (value: ReportStatus | "PENDING_REVIEW") => void;
  onDecision: (
    reportId: string,
    decision: "DISMISS" | "RESOLVE" | "HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_REPORTED_USER",
  ) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isPending: boolean;
}

export function ContentReportsSection({
  query,
  reportStatus,
  onStatusChange,
  onDecision,
  onPreviousPage,
  onNextPage,
  isPending,
}: ContentReportsSectionProps) {
  const reportData = query.data && query.data.success ? query.data.data : null;
  const reportError = query.data && !query.data.success ? query.data.error : null;

  return (
    <AdminSectionCard
      title="Content Reports"
      description="Review and action reported content"
      action={
        <select
          aria-label="Filter content reports by status"
          value={reportStatus}
          onChange={(event) =>
            onStatusChange(event.target.value as ReportStatus | "PENDING_REVIEW")
          }
          className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100"
        >
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "PENDING_REVIEW" ? "Pending/Under Review" : status}
            </option>
          ))}
        </select>
      }
    >
      {reportError ? (
        <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {reportError}
        </div>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-zinc-400">Loading reports...</p>
      ) : reportData?.items.length ? (
        <div className="space-y-3">
          {reportData.items.map((report) => (
            <article
              key={report.id}
              className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-100">{report.reason}</p>
                  <p className="text-zinc-400">
                    Reporter: @{report.reporter.username} • Target: @
                    {report.reportedUser.username}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                  {report.status}
                </span>
              </div>

              <p className="mt-2 text-zinc-400">Created: {formatDateTime(report.createdAt)}</p>
              <p className="mt-1 text-zinc-400">
                Target Type:{" "}
                {report.post
                  ? "POST"
                  : report.comment
                    ? "COMMENT"
                    : report.streamId
                      ? "STREAM"
                      : "USER"}
              </p>

              {report.description ? (
                <p className="mt-2 line-clamp-2 text-zinc-300">{report.description}</p>
              ) : null}

              {report.status === "PENDING" || report.status === "UNDER_REVIEW" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onDecision(report.id, "DISMISS")}
                    disabled={isPending}
                    className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision(report.id, "RESOLVE")}
                    disabled={isPending}
                    className="rounded-lg border border-emerald-400/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  {report.post ? (
                    <button
                      type="button"
                      onClick={() => onDecision(report.id, "HIDE_POST")}
                      disabled={isPending}
                      className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                    >
                      Hide Post
                    </button>
                  ) : null}
                  {report.comment ? (
                    <button
                      type="button"
                      onClick={() => onDecision(report.id, "HIDE_COMMENT")}
                      disabled={isPending}
                      className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                    >
                      Hide Comment
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onDecision(report.id, "SUSPEND_REPORTED_USER")}
                    disabled={isPending}
                    className="rounded-lg border border-red-400/30 px-2 py-1 text-red-200 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Suspend User
                  </button>
                </div>
              ) : report.resolution ? (
                <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300">
                  Resolution: {report.resolution}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No reports found.</p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <p className="text-zinc-400">
          Page {reportData?.pagination.page ?? 1} /{" "}
          {Math.max(reportData?.pagination.totalPages ?? 1, 1)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={(reportData?.pagination.page ?? 1) <= 1}
            className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={
              (reportData?.pagination.page ?? 1) >= (reportData?.pagination.totalPages ?? 1)
            }
            className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </AdminSectionCard>
  );
}
