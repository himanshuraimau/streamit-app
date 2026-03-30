import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listModerationReports,
  listModerationStreamReports,
  reviewModerationReport,
  reviewModerationStreamReport,
  type ReportStatus,
  type StreamReportStatus,
} from '../lib/admin-api';

function formatDateTime(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

export function ModerationReportsPage() {
  const queryClient = useQueryClient();

  const [reportPage, setReportPage] = useState(1);
  const [streamReportPage, setStreamReportPage] = useState(1);
  const [reportStatus, setReportStatus] = useState<ReportStatus | 'PENDING_REVIEW'>('PENDING_REVIEW');
  const [streamReportStatus, setStreamReportStatus] = useState<StreamReportStatus | 'PENDING_ONLY'>(
    'PENDING_ONLY'
  );

  const reportsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'reports', reportPage, reportStatus],
    queryFn: () =>
      listModerationReports({
        page: reportPage,
        limit: 10,
        status: reportStatus === 'PENDING_REVIEW' ? undefined : reportStatus,
      }),
  });

  const streamReportsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'stream-reports', streamReportPage, streamReportStatus],
    queryFn: () =>
      listModerationStreamReports({
        page: streamReportPage,
        limit: 10,
        status: streamReportStatus === 'PENDING_ONLY' ? undefined : streamReportStatus,
      }),
  });

  const reportActionMutation = useMutation({
    mutationFn: (payload: {
      reportId: string;
      decision: 'DISMISS' | 'RESOLVE' | 'HIDE_POST' | 'HIDE_COMMENT' | 'SUSPEND_REPORTED_USER';
      resolution?: string;
    }) =>
      reviewModerationReport(payload.reportId, {
        decision: payload.decision,
        resolution: payload.resolution,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'moderation', 'reports'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
    },
  });

  const streamReportActionMutation = useMutation({
    mutationFn: (payload: { streamReportId: string; status: StreamReportStatus; resolution?: string }) =>
      reviewModerationStreamReport(payload.streamReportId, {
        status: payload.status,
        resolution: payload.resolution,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'moderation', 'stream-reports'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
    },
  });

  const reportData = reportsQuery.data && reportsQuery.data.success ? reportsQuery.data.data : null;
  const reportError = reportsQuery.data && !reportsQuery.data.success ? reportsQuery.data.error : null;

  const streamReportData =
    streamReportsQuery.data && streamReportsQuery.data.success ? streamReportsQuery.data.data : null;
  const streamReportError =
    streamReportsQuery.data && !streamReportsQuery.data.success ? streamReportsQuery.data.error : null;

  const handleReportDecision = async (
    reportId: string,
    decision: 'DISMISS' | 'RESOLVE' | 'HIDE_POST' | 'HIDE_COMMENT' | 'SUSPEND_REPORTED_USER'
  ) => {
    let resolution: string | undefined;

    if (decision !== 'DISMISS') {
      const input = window.prompt('Resolution note (optional):', 'Actioned by moderator');
      resolution = input?.trim() || undefined;
    }

    const response = await reportActionMutation.mutateAsync({
      reportId,
      decision,
      resolution,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleStreamReportDecision = async (
    streamReportId: string,
    status: StreamReportStatus
  ) => {
    const resolution =
      status === 'DISMISSED'
        ? window.prompt('Dismissal note (optional):', 'False positive')?.trim() || undefined
        : undefined;

    const response = await streamReportActionMutation.mutateAsync({
      streamReportId,
      status,
      resolution,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 3</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Moderation Queue</h2>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              Content Reports
            </h3>
            <select
              value={reportStatus}
              onChange={(event) => {
                setReportPage(1);
                setReportStatus(event.target.value as ReportStatus | 'PENDING_REVIEW');
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100"
            >
              <option value="PENDING_REVIEW">Pending/Under Review</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          {reportError ? (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {reportError}
            </div>
          ) : null}

          {reportsQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading reports...</p>
          ) : reportData?.items.length ? (
            <div className="space-y-3">
              {reportData.items.map((report) => (
                <article key={report.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100">{report.reason}</p>
                      <p className="text-zinc-400">
                        Reporter: @{report.reporter.username} • Target: @{report.reportedUser.username}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">{report.status}</span>
                  </div>

                  <p className="mt-2 text-zinc-400">Created: {formatDateTime(report.createdAt)}</p>
                  <p className="mt-1 text-zinc-400">
                    Target Type: {report.post ? 'POST' : report.comment ? 'COMMENT' : report.streamId ? 'STREAM' : 'USER'}
                  </p>

                  {report.description ? (
                    <p className="mt-2 line-clamp-2 text-zinc-300">{report.description}</p>
                  ) : null}

                  {report.status === 'PENDING' || report.status === 'UNDER_REVIEW' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleReportDecision(report.id, 'DISMISS')}
                        disabled={reportActionMutation.isPending}
                        className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReportDecision(report.id, 'RESOLVE')}
                        disabled={reportActionMutation.isPending}
                        className="rounded-lg border border-emerald-400/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                      >
                        Resolve
                      </button>
                      {report.post ? (
                        <button
                          type="button"
                          onClick={() => void handleReportDecision(report.id, 'HIDE_POST')}
                          disabled={reportActionMutation.isPending}
                          className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                        >
                          Hide Post
                        </button>
                      ) : null}
                      {report.comment ? (
                        <button
                          type="button"
                          onClick={() => void handleReportDecision(report.id, 'HIDE_COMMENT')}
                          disabled={reportActionMutation.isPending}
                          className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                        >
                          Hide Comment
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleReportDecision(report.id, 'SUSPEND_REPORTED_USER')}
                        disabled={reportActionMutation.isPending}
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
              Page {reportData?.pagination.page ?? 1} / {Math.max(reportData?.pagination.totalPages ?? 1, 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReportPage((prev) => Math.max(prev - 1, 1))}
                disabled={(reportData?.pagination.page ?? 1) <= 1}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setReportPage((prev) => Math.min(prev + 1, reportData?.pagination.totalPages ?? 1))
                }
                disabled={(reportData?.pagination.page ?? 1) >= (reportData?.pagination.totalPages ?? 1)}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              Stream Reports
            </h3>
            <select
              value={streamReportStatus}
              onChange={(event) => {
                setStreamReportPage(1);
                setStreamReportStatus(event.target.value as StreamReportStatus | 'PENDING_ONLY');
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100"
            >
              <option value="PENDING_ONLY">Pending</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          {streamReportError ? (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {streamReportError}
            </div>
          ) : null}

          {streamReportsQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading stream reports...</p>
          ) : streamReportData?.items.length ? (
            <div className="space-y-3">
              {streamReportData.items.map((report) => (
                <article key={report.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100">{report.reason}</p>
                      <p className="text-zinc-400">
                        Stream: {report.stream.title} • @{report.stream.user.username}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">{report.status}</span>
                  </div>

                  <p className="mt-2 text-zinc-400">Reporter: @{report.reporter.username}</p>
                  <p className="mt-1 text-zinc-400">Created: {formatDateTime(report.createdAt)}</p>

                  {report.status === 'PENDING' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleStreamReportDecision(report.id, 'REVIEWED')}
                        disabled={streamReportActionMutation.isPending}
                        className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleStreamReportDecision(report.id, 'RESOLVED')}
                        disabled={streamReportActionMutation.isPending}
                        className="rounded-lg border border-emerald-400/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleStreamReportDecision(report.id, 'DISMISSED')}
                        disabled={streamReportActionMutation.isPending}
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
              Page {streamReportData?.pagination.page ?? 1} / {Math.max(streamReportData?.pagination.totalPages ?? 1, 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStreamReportPage((prev) => Math.max(prev - 1, 1))}
                disabled={(streamReportData?.pagination.page ?? 1) <= 1}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setStreamReportPage((prev) =>
                    Math.min(prev + 1, streamReportData?.pagination.totalPages ?? 1)
                  )
                }
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
        </section>
      </div>
    </div>
  );
}
