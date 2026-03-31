import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdCampaign,
  exportAdCampaignAnalyticsCsv,
  getAdCampaignAnalytics,
  getFounderKpiSummary,
  listAdCampaigns,
  type AnalyticsScope,
  updateAdCampaignStatus,
  type AdCampaignStatus,
} from "../lib/admin-api";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatCurrencyFromPaise(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

const CAMPAIGN_STATUSES: Array<AdCampaignStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
];

const ANALYTICS_SCOPES: AnalyticsScope[] = ["GROWTH", "FINANCE", "ALL"];

export function AdsAnalyticsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<AdCampaignStatus | "ALL">("ALL");
  const [analyticsScope, setAnalyticsScope] = useState<AnalyticsScope>("GROWTH");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignStartAt, setCampaignStartAt] = useState("");
  const [campaignEndAt, setCampaignEndAt] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [totalBudget, setTotalBudget] = useState("");

  const campaignsQuery = useQuery({
    queryKey: ["admin", "ads", "campaigns", statusFilter, search, page],
    queryFn: () =>
      listAdCampaigns({
        page,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
  });

  const founderKpiQuery = useQuery({
    queryKey: ["admin", "ads", "kpis", analyticsScope],
    queryFn: () => getFounderKpiSummary({ scope: analyticsScope }),
  });

  const campaignAnalyticsQuery = useQuery({
    queryKey: ["admin", "ads", "campaign-analytics", selectedCampaignId, analyticsScope],
    queryFn: () => getAdCampaignAnalytics(selectedCampaignId as string),
    enabled: Boolean(selectedCampaignId && analyticsScope !== "FINANCE"),
  });

  const createCampaignMutation = useMutation({
    mutationFn: createAdCampaign,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "kpis"] });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: (payload: { campaignId: string; status: AdCampaignStatus; reason?: string }) =>
      updateAdCampaignStatus(payload.campaignId, {
        status: payload.status,
        reason: payload.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "kpis"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaign-analytics"] });
    },
  });

  const exportCampaignCsvMutation = useMutation({
    mutationFn: (campaignId: string) => exportAdCampaignAnalyticsCsv(campaignId),
  });

  const campaignsData =
    campaignsQuery.data && campaignsQuery.data.success ? campaignsQuery.data.data : null;
  const kpiData =
    founderKpiQuery.data && founderKpiQuery.data.success
      ? founderKpiQuery.data.data
      : null;
  const campaignAnalytics =
    campaignAnalyticsQuery.data && campaignAnalyticsQuery.data.success
      ? campaignAnalyticsQuery.data.data
      : null;
  const founderKpiError =
    founderKpiQuery.data && !founderKpiQuery.data.success ? founderKpiQuery.data.error : null;

  const campaignRows = useMemo(() => campaignsData?.items ?? [], [campaignsData]);

  const handleCreateCampaign = async () => {
    if (campaignName.trim().length < 3) {
      window.alert("Campaign name must be at least 3 characters.");
      return;
    }

    const response = await createCampaignMutation.mutateAsync({
      name: campaignName.trim(),
      objective: campaignObjective.trim() || undefined,
      startAt: campaignStartAt ? new Date(campaignStartAt).toISOString() : undefined,
      endAt: campaignEndAt ? new Date(campaignEndAt).toISOString() : undefined,
      dailyBudgetPaise: dailyBudget ? Number(dailyBudget) : undefined,
      totalBudgetPaise: totalBudget ? Number(totalBudget) : undefined,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setCampaignName("");
    setCampaignObjective("");
    setCampaignStartAt("");
    setCampaignEndAt("");
    setDailyBudget("");
    setTotalBudget("");
  };

  const handleChangeStatus = async (
    campaignId: string,
    currentStatus: AdCampaignStatus,
    nextStatus: AdCampaignStatus,
  ) => {
    if (currentStatus === nextStatus) {
      return;
    }

    const reason = window.prompt(
      `Optional note for ${currentStatus} -> ${nextStatus}:`,
      "Status updated by admin",
    );

    const response = await updateCampaignStatusMutation.mutateAsync({
      campaignId,
      status: nextStatus,
      reason: reason?.trim() || undefined,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleExportCampaignCsv = async () => {
    if (!selectedCampaignId) {
      return;
    }

    const response = await exportCampaignCsvMutation.mutateAsync(selectedCampaignId);
    if (!response.success) {
      window.alert(response.error);
      return;
    }

    const downloadUrl = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = response.data.fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 5</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Ads And Analytics</h2>
      </header>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Founder KPI Snapshot
          </h3>
          <div className="flex items-center gap-2">
            <select
              aria-label="Select KPI analytics scope"
              value={analyticsScope}
              onChange={(event) => {
                const nextScope = event.target.value as AnalyticsScope;
                setAnalyticsScope(nextScope);
                if (nextScope === "FINANCE") {
                  setSelectedCampaignId(null);
                }
              }}
              className="rounded-xl border border-white/20 bg-[#0d0d0f] px-3 py-2 text-xs font-medium text-zinc-100"
            >
              {ANALYTICS_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  Scope: {scope}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "kpis"] });
              }}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        {founderKpiQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading KPI summary...</p>
        ) : founderKpiError ? (
          <p className="text-sm text-rose-300">{founderKpiError}</p>
        ) : kpiData ? (
          <div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {kpiData.users ? <SummaryCard label="DAU" value={formatNumber(kpiData.users.dau)} /> : null}
              {kpiData.users ? <SummaryCard label="MAU" value={formatNumber(kpiData.users.mau)} /> : null}
              {kpiData.campaigns ? (
                <SummaryCard
                  label="Active Campaigns"
                  value={formatNumber(kpiData.campaigns.activeCount)}
                />
              ) : null}
              {kpiData.advertising ? (
                <SummaryCard
                  label="Ad Spend"
                  value={formatCurrencyFromPaise(kpiData.advertising.spendPaise)}
                />
              ) : null}
              {kpiData.advertising ? (
                <SummaryCard label="CTR" value={`${kpiData.advertising.ctrPercent.toFixed(2)}%`} />
              ) : null}
              {kpiData.advertising ? (
                <SummaryCard
                  label="Conversion"
                  value={`${kpiData.advertising.conversionPercent.toFixed(2)}%`}
                />
              ) : null}
              {kpiData.advertising ? (
                <SummaryCard label="CPM" value={`₹${kpiData.advertising.cpmInr.toFixed(2)}`} />
              ) : null}
              {kpiData.monetization ? (
                <SummaryCard
                  label="Revenue"
                  value={formatCurrencyFromPaise(kpiData.monetization.revenuePaise)}
                />
              ) : null}
              {kpiData.monetization ? (
                <SummaryCard
                  label="Purchases"
                  value={formatNumber(kpiData.monetization.completedPurchases)}
                />
              ) : null}
              {kpiData.monetization ? (
                <SummaryCard
                  label="Rev/Spend"
                  value={
                    kpiData.monetization.revenueToAdSpendRatio === null
                      ? "N/A"
                      : kpiData.monetization.revenueToAdSpendRatio.toFixed(2)
                  }
                />
              ) : null}
            </div>

            {kpiData.alerts ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-amber-200">
                  Alert Thresholds
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  Overspend at {kpiData.alerts.thresholds.overspendPercent}% budget usage, low CTR below {" "}
                  {kpiData.alerts.thresholds.lowCtrPercent}% after {" "}
                  {formatNumber(kpiData.alerts.thresholds.lowCtrMinImpressions)} impressions.
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  Active alerts: {formatNumber(kpiData.alerts.totals.totalAlerts)} (Overspend: {" "}
                  {formatNumber(kpiData.alerts.totals.overspendCampaigns)}, Low CTR: {" "}
                  {formatNumber(kpiData.alerts.totals.lowCtrCampaigns)})
                </p>

                {kpiData.alerts.items.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {kpiData.alerts.items.slice(0, 6).map((item) => (
                      <div
                        key={`${item.type}-${item.campaignId}`}
                        className="rounded-xl border border-white/10 bg-[#0d0d0f] px-3 py-2"
                      >
                        <p className="text-xs font-medium text-zinc-100">
                          {item.campaignName} ({item.type})
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">{item.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-400">No active campaign alerts.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">KPI summary unavailable.</p>
        )}
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
          Create Campaign
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs text-zinc-400">
            Campaign Name
            <input
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              placeholder="Summer Growth Push"
            />
          </label>

          <label className="text-xs text-zinc-400">
            Start At
            <input
              type="datetime-local"
              value={campaignStartAt}
              onChange={(event) => setCampaignStartAt(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-xs text-zinc-400">
            End At
            <input
              type="datetime-local"
              value={campaignEndAt}
              onChange={(event) => setCampaignEndAt(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-xs text-zinc-400">
            Daily Budget (paise)
            <input
              type="number"
              value={dailyBudget}
              onChange={(event) => setDailyBudget(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              placeholder="50000"
            />
          </label>

          <label className="text-xs text-zinc-400">
            Total Budget (paise)
            <input
              type="number"
              value={totalBudget}
              onChange={(event) => setTotalBudget(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              placeholder="300000"
            />
          </label>

          <label className="text-xs text-zinc-400 md:col-span-2 xl:col-span-3">
            Objective
            <input
              value={campaignObjective}
              onChange={(event) => setCampaignObjective(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              placeholder="Increase creator acquisition in high-retention cohorts"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleCreateCampaign()}
            disabled={createCampaignMutation.isPending}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
          >
            {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Campaigns
          </h3>

          <select
            aria-label="Filter campaigns by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdCampaignStatus | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
          >
            {CAMPAIGN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            aria-label="Search campaigns"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search campaign name"
            className="min-w-55 rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
          />
        </div>

        {campaignsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading campaigns...</p>
        ) : campaignRows.length === 0 ? (
          <p className="text-sm text-zinc-400">No campaigns found for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-6xl text-left text-sm text-zinc-200">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Spend</th>
                  <th className="px-2 py-2">CTR</th>
                  <th className="px-2 py-2">CPM</th>
                  <th className="px-2 py-2">Alerts</th>
                  <th className="px-2 py-2">Updated</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-white/5 hover:bg-white/3"
                  >
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCampaignId(campaign.id)}
                        aria-label={`View analytics for ${campaign.name}`}
                        className="text-left text-zinc-100 hover:text-sky-300"
                      >
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-xs text-zinc-500">
                          {campaign.objective || "No objective"}
                        </div>
                      </button>
                    </td>
                    <td className="px-2 py-3">{campaign.status}</td>
                    <td className="px-2 py-3">
                      {formatCurrencyFromPaise(campaign.analytics.spendPaise)}
                    </td>
                    <td className="px-2 py-3">{campaign.analytics.ctrPercent.toFixed(2)}%</td>
                    <td className="px-2 py-3">₹{campaign.analytics.cpmInr.toFixed(2)}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {campaign.analytics.alerts.isOverspend ? (
                          <span className="rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">
                            Overspend
                          </span>
                        ) : null}
                        {campaign.analytics.alerts.isLowCtr ? (
                          <span className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                            Low CTR
                          </span>
                        ) : null}
                        {!campaign.analytics.alerts.isOverspend && !campaign.analytics.alerts.isLowCtr ? (
                          <span className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                            Healthy
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-3">{formatDateTime(campaign.updatedAt)}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            void handleChangeStatus(campaign.id, campaign.status, "ACTIVE")
                          }
                          className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleChangeStatus(campaign.id, campaign.status, "PAUSED")
                          }
                          className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100"
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleChangeStatus(campaign.id, campaign.status, "COMPLETED")
                          }
                          className="rounded border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleChangeStatus(campaign.id, campaign.status, "ARCHIVED")
                          }
                          className="rounded border border-zinc-400/30 bg-zinc-500/10 px-2 py-1 text-[11px] text-zinc-200"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {campaignsData && campaignsData.pagination.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Page {campaignsData.pagination.page} of {campaignsData.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={campaignsData.pagination.page <= 1}
                className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, campaignsData.pagination.totalPages),
                  )
                }
                disabled={campaignsData.pagination.page >= campaignsData.pagination.totalPages}
                className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Campaign Analytics Drill-Down
          </h3>
          <button
            type="button"
            onClick={() => void handleExportCampaignCsv()}
            disabled={!selectedCampaignId || exportCampaignCsvMutation.isPending || analyticsScope === "FINANCE"}
            className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/20 disabled:opacity-40"
          >
            {exportCampaignCsvMutation.isPending ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {analyticsScope === "FINANCE" ? (
          <p className="text-sm text-zinc-400">
            Campaign performance drill-down is available only in GROWTH or ALL scope.
          </p>
        ) : !selectedCampaignId ? (
          <p className="text-sm text-zinc-400">
            Select a campaign from the table to view detailed analytics.
          </p>
        ) : campaignAnalyticsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading campaign analytics...</p>
        ) : campaignAnalytics ? (
          <div>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Impressions"
                value={formatNumber(campaignAnalytics.summary.impressions)}
              />
              <SummaryCard
                label="Clicks"
                value={formatNumber(campaignAnalytics.summary.clicks)}
              />
              <SummaryCard
                label="Conversions"
                value={formatNumber(campaignAnalytics.summary.conversions)}
              />
              <SummaryCard
                label="Spend"
                value={formatCurrencyFromPaise(campaignAnalytics.summary.spendPaise)}
              />
              <SummaryCard
                label="CTR"
                value={`${campaignAnalytics.summary.ctrPercent.toFixed(2)}%`}
              />
              <SummaryCard
                label="Budget Usage"
                value={
                  campaignAnalytics.summary.alerts.budgetUtilizationPercent === null
                    ? "N/A"
                    : `${campaignAnalytics.summary.alerts.budgetUtilizationPercent.toFixed(2)}%`
                }
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm text-zinc-200">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-zinc-400">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Impressions</th>
                    <th className="px-2 py-2">Clicks</th>
                    <th className="px-2 py-2">Conversions</th>
                    <th className="px-2 py-2">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignAnalytics.dailyMetrics.map((metric) => (
                    <tr key={metric.bucketDate} className="border-b border-white/5">
                      <td className="px-2 py-2">{formatDateTime(metric.bucketDate)}</td>
                      <td className="px-2 py-2">{formatNumber(metric.impressions)}</td>
                      <td className="px-2 py-2">{formatNumber(metric.clicks)}</td>
                      <td className="px-2 py-2">{formatNumber(metric.conversions)}</td>
                      <td className="px-2 py-2">{formatCurrencyFromPaise(metric.spendPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Analytics payload unavailable.</p>
        )}
      </section>
    </div>
  );
}
