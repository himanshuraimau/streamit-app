import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCurrencyFromPaise,
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  AdCampaignAnalytics,
  AnalyticsScope,
} from "@/lib/admin-api";

import {
  formatPercentMetric,
  getCampaignStatusBadgeClassName,
} from "../utils";
import type { AdsNoticeState } from "../types";

export function CampaignAnalyticsSection({
  analyticsScope,
  selectedCampaignId,
  analytics,
  isLoading,
  isExporting,
  errorMessage,
  notice,
  onExport,
}: {
  analyticsScope: AnalyticsScope;
  selectedCampaignId: string | null;
  analytics: AdCampaignAnalytics | null;
  isLoading: boolean;
  isExporting: boolean;
  errorMessage: string | null;
  notice: AdsNoticeState | null;
  onExport: () => void;
}) {
  return (
    <AdminSectionCard
      eyebrow="Advertising"
      title="Campaign Analytics Drill-Down"
      description="Inspect selected campaign performance over time and export a reporting snapshot for stakeholders."
      action={
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={
            !selectedCampaignId ||
            analyticsScope === "FINANCE" ||
            isExporting
          }
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      }
    >
      <div className="space-y-4">
        {notice ? <AdminNotice notice={notice} /> : null}
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Campaign analytics are unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {analyticsScope === "FINANCE" ? (
          <p className="text-sm text-muted-foreground">
            Campaign performance drill-down is available only in GROWTH or ALL
            scope.
          </p>
        ) : !selectedCampaignId ? (
          <p className="text-sm text-muted-foreground">
            Select a campaign from the table to view detailed analytics.
          </p>
        ) : isLoading && !analytics ? (
          <p className="text-sm text-muted-foreground">
            Loading campaign analytics...
          </p>
        ) : analytics ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  getCampaignStatusBadgeClassName(analytics.campaign.status),
                )}
              >
                {analytics.campaign.status}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/45">
                Generated: {formatDateTime(analytics.generatedAt)}
              </Badge>
            </div>

            <div className="rounded-3xl border border-border/60 bg-background/35 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-lg font-medium text-foreground">
                    {analytics.campaign.name}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {analytics.campaign.objective || "No objective"}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Period: {formatDateTime(analytics.period.from)} to{" "}
                    {formatDateTime(analytics.period.to)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AdminMetricCard
                label="Impressions"
                value={formatNumber(analytics.summary.impressions)}
              />
              <AdminMetricCard
                label="Clicks"
                value={formatNumber(analytics.summary.clicks)}
              />
              <AdminMetricCard
                label="Conversions"
                value={formatNumber(analytics.summary.conversions)}
              />
              <AdminMetricCard
                label="Spend"
                value={formatCurrencyFromPaise(analytics.summary.spendPaise)}
              />
              <AdminMetricCard
                label="CTR"
                value={formatPercentMetric(analytics.summary.ctrPercent)}
              />
              <AdminMetricCard
                label="Budget Usage"
                value={
                  analytics.summary.alerts.budgetUtilizationPercent === null
                    ? "N/A"
                    : formatPercentMetric(
                        analytics.summary.alerts.budgetUtilizationPercent,
                      )
                }
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full min-w-5xl text-left text-sm">
                <thead className="bg-background/65 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Impressions</th>
                    <th className="px-4 py-3 font-medium">Clicks</th>
                    <th className="px-4 py-3 font-medium">Conversions</th>
                    <th className="px-4 py-3 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyMetrics.map((metric) => (
                    <tr key={metric.bucketDate} className="border-t border-border/60">
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(metric.bucketDate)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatNumber(metric.impressions)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatNumber(metric.clicks)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatNumber(metric.conversions)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrencyFromPaise(metric.spendPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Analytics payload unavailable.
          </p>
        )}
      </div>
    </AdminSectionCard>
  );
}
