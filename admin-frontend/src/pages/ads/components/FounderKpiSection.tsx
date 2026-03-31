import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrencyFromPaise,
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AnalyticsScope, FounderKpiSummary } from "@/lib/admin-api";

import { ANALYTICS_SCOPES } from "../constants";
import { formatCurrencyAmount, formatPercentMetric } from "../utils";

export function FounderKpiSection({
  analyticsScope,
  kpiData,
  isLoading,
  isRefreshing,
  errorMessage,
  onAnalyticsScopeChange,
  onRefresh,
  onSelectCampaign,
}: {
  analyticsScope: AnalyticsScope;
  kpiData: FounderKpiSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  onAnalyticsScopeChange: (value: AnalyticsScope) => void;
  onRefresh: () => void;
  onSelectCampaign: (campaignId: string) => void;
}) {
  return (
    <AdminSectionCard
      eyebrow="Analytics"
      title="Founder KPI Snapshot"
      description="Track growth, advertising efficiency, monetization, and alert pressure from one founder-level control surface."
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={analyticsScope}
            onValueChange={(value) => onAnalyticsScopeChange(value as AnalyticsScope)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Analytics scope" />
            </SelectTrigger>
            <SelectContent>
              {ANALYTICS_SCOPES.map((scope) => (
                <SelectItem key={scope} value={scope}>
                  Scope: {scope}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Founder KPIs are unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {isLoading && !kpiData ? (
          <p className="text-sm text-muted-foreground">
            Loading KPI summary...
          </p>
        ) : kpiData ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border/70 bg-background/45">
                Scope: {kpiData.scope}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/45">
                Generated: {formatDateTime(kpiData.generatedAt)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpiData.users ? (
                <AdminMetricCard label="DAU" value={formatNumber(kpiData.users.dau)} />
              ) : null}
              {kpiData.users ? (
                <AdminMetricCard label="MAU" value={formatNumber(kpiData.users.mau)} />
              ) : null}
              {kpiData.campaigns ? (
                <AdminMetricCard
                  label="Active Campaigns"
                  value={formatNumber(kpiData.campaigns.activeCount)}
                />
              ) : null}
              {kpiData.advertising ? (
                <AdminMetricCard
                  label="Ad Spend"
                  value={formatCurrencyFromPaise(kpiData.advertising.spendPaise)}
                />
              ) : null}
              {kpiData.advertising ? (
                <AdminMetricCard
                  label="CTR"
                  value={formatPercentMetric(kpiData.advertising.ctrPercent)}
                />
              ) : null}
              {kpiData.advertising ? (
                <AdminMetricCard
                  label="Conversion"
                  value={formatPercentMetric(kpiData.advertising.conversionPercent)}
                />
              ) : null}
              {kpiData.advertising ? (
                <AdminMetricCard
                  label="CPM"
                  value={formatCurrencyAmount(kpiData.advertising.cpmInr)}
                />
              ) : null}
              {kpiData.monetization ? (
                <AdminMetricCard
                  label="Revenue"
                  value={formatCurrencyFromPaise(kpiData.monetization.revenuePaise)}
                />
              ) : null}
              {kpiData.monetization ? (
                <AdminMetricCard
                  label="Purchases"
                  value={formatNumber(kpiData.monetization.completedPurchases)}
                />
              ) : null}
              {kpiData.monetization ? (
                <AdminMetricCard
                  label="Rev / Spend"
                  value={
                    kpiData.monetization.revenueToAdSpendRatio === null
                      ? "N/A"
                      : kpiData.monetization.revenueToAdSpendRatio.toFixed(2)
                  }
                />
              ) : null}
            </div>

            {kpiData.alerts ? (
              <div className="rounded-3xl border border-amber-500/25 bg-amber-500/6 p-4">
                <div className="flex flex-col gap-2">
                  <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-amber-200">
                    Alert Thresholds
                  </p>
                  <p className="text-sm text-foreground">
                    Overspend at {kpiData.alerts.thresholds.overspendPercent}% budget usage, low CTR below{" "}
                    {kpiData.alerts.thresholds.lowCtrPercent}% after{" "}
                    {formatNumber(kpiData.alerts.thresholds.lowCtrMinImpressions)} impressions.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Active alerts: {formatNumber(kpiData.alerts.totals.totalAlerts)}. Overspend:{" "}
                    {formatNumber(kpiData.alerts.totals.overspendCampaigns)}. Low CTR:{" "}
                    {formatNumber(kpiData.alerts.totals.lowCtrCampaigns)}.
                  </p>
                </div>

                {kpiData.alerts.items.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {kpiData.alerts.items.slice(0, 6).map((item) => (
                      <button
                        key={`${item.type}-${item.campaignId}`}
                        type="button"
                        onClick={() => onSelectCampaign(item.campaignId)}
                        className={cn(
                          "rounded-2xl border border-border/60 bg-background/55 p-4 text-left transition hover:bg-background/80",
                          item.type === "OVERSPEND"
                            ? "border-rose-500/25"
                            : "border-amber-500/25",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">
                            {item.campaignName}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              item.type === "OVERSPEND"
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-100",
                            )}
                          >
                            {item.type}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.message}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No active campaign alerts.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            KPI summary unavailable.
          </p>
        )}
      </div>
    </AdminSectionCard>
  );
}
