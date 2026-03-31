import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import type { StreamReportStatus, ModerationStreamReportItem } from "../types";
import { STREAM_REPORT_STATUSES } from "../constants";
import { formatDateTime } from "../utils";

interface StreamReportsSectionProps {
  query: UseQueryResult<
    | { success: true; data: { items: ModerationStreamReportItem[]; pagination: any } }
    | { success: false; error: string }
  >;
  streamReportStatus: StreamReportStatus | "PENDING_ONLY";
  onStatusChange: (value: StreamReportStatus | "PENDING_ONLY") => void;
  onDecision: (streamReportId: string, status: StreamReportStatus) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isPending: boolean;
}

export function StreamReportsSection({
  query,
  streamReportStatus,
  onStatusChange,
  onDecision,
  onPreviousPage,
  onNextPage,
  isPending,
}: StreamReportsSectionProps) {
  const streamReportData = query.data && query.data.success ? query.data.data : null;
  const streamReportError = query.data && !query.data.success ? query.data.error : null;

  return (
    <AdminSectionCard
      title="Stream Reports"
      description="Review and action reported live streams"
      action={
        <select
          aria-label="Filter stream reports by status"
          value={streamReportStatus}
          onChange={(event) =>
            onStatusChange(event.target.value as StreamReportStatus | "PENDING_ONLY")
          }
          className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100"
        >
          {STREAM_REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "PENDING_ONLY" ? "Pending" : status}
            </option>
          ))}
        </select>
      }
    >
      {streamReportError ? (
        <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {streamReportError}
        </div>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-zinc-400">Loading stream reports...</p>
      ) : streamReportData?.items.length ? (
        <div className="space-y-3">
          {streamReportData.items.map((report) => (
            <article
              key={report.id}
              className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-100">{report.reason}</p>
                  <p className="text-zinc-400">
                    Stream: {report.stream.title} • @{report.stream.user.username}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                  {report.status}
                </span>
              </div>

              <p className="mt-2 text-zinc-400">Reporter: @{report.reporter.username}</p>
              <p className="mt-1 text-zinc-400">Created: {formatDateTime(report.createdAt)}</p>

              {report.status === "PENDING" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onDecision(report.id, "REVIEWED")}
                    disabled={isPending}
                    className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision(report.id, "RESOLVED")}
                    disabled={isPending}
                    className="rounded-lg border border-emerald-400/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision(report.id, "DISMISSED")}
                    disabled={isPending}
                    className="rounded-lg border border-red-400/30 px-2 py-1 text-red-200 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No stream reports found.</p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <p className="text-zinc-400">
          Page {streamReportData?.pagination.page ?? 1} /{" "}
          {Math.max(streamReportData?.pagination.totalPages ?? 1, 1)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={(streamReportData?.pagination.page ?? 1) <= 1}
            className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={
              (streamReportData?.pagination.page ?? 1) >=
              (streamReportData?.pagination.totalPages ?? 1)
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
