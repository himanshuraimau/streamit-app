import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminSecuritySummary } from "../lib/admin-api";

const WINDOW_OPTIONS = [1, 3, 7, 14, 30];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function QueueCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
      <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value.toLocaleString()}</p>
    </article>
  );
}

export function SecurityHardeningPage() {
  const queryClient = useQueryClient();
  const [windowDays, setWindowDays] = useState(7);

  const summaryQuery = useQuery({
    queryKey: ["admin", "phase7", "security-summary", windowDays],
    queryFn: () => getAdminSecuritySummary({ days: windowDays }),
  });

  const summaryData =
    summaryQuery.data && summaryQuery.data.success ? summaryQuery.data.data : null;
  const summaryError =
    summaryQuery.data && !summaryQuery.data.success ? summaryQuery.data.error : null;

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 7</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Security And Hardening Ops</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Observability board for high-risk queues, privileged actions, and top operator activity.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400" htmlFor="security-window-days">
              Rolling Window
            </label>
            <select
              id="security-window-days"
              value={windowDays}
              onChange={(event) => setWindowDays(Number(event.target.value))}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            >
              {WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  Last {days} day{days > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["admin", "phase7", "security-summary"] });
            }}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {summaryError ? (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {summaryError}
          </div>
        ) : null}

        {summaryQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading security summary...</p>
        ) : summaryData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <QueueCard label="Pending Withdrawals" value={summaryData.queues.pendingWithdrawals} />
              <QueueCard label="Action Required Cases" value={summaryData.queues.actionRequiredLegalCases} />
              <QueueCard label="Pending Takedowns" value={summaryData.queues.pendingTakedowns} />
              <QueueCard label="Active Geo-Blocks" value={summaryData.queues.activeGeoBlocks} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Action Breakdown</h3>
                {summaryData.actionBreakdown.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-100 text-left text-xs">
                      <thead className="text-zinc-500">
                        <tr>
                          <th className="pb-2">Action</th>
                          <th className="pb-2">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.actionBreakdown.map((item) => (
                          <tr key={item.action} className="border-t border-white/5 text-zinc-300">
                            <td className="py-2 pr-2">{item.action}</td>
                            <td className="py-2">{item.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-400">No monitored actions in this window.</p>
                )}
              </article>

              <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Top Admin Activity</h3>
                {summaryData.topAdmins.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-100 text-left text-xs">
                      <thead className="text-zinc-500">
                        <tr>
                          <th className="pb-2">Admin</th>
                          <th className="pb-2">Role</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.topAdmins.map((item) => (
                          <tr key={item.admin.id} className="border-t border-white/5 text-zinc-300">
                            <td className="py-2 pr-2">
                              <p>{item.admin.name}</p>
                              <p className="text-zinc-500">@{item.admin.username}</p>
                            </td>
                            <td className="py-2 pr-2">{item.admin.role}</td>
                            <td className="py-2">{item.actionCount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-400">No operator activity for this window.</p>
                )}
              </article>
            </div>

            <p className="text-xs text-zinc-500">Generated at: {formatDateTime(summaryData.generatedAt)}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Security summary is not available.</p>
        )}
      </section>
    </div>
  );
}
