import type { FinanceSummary } from "@/lib/admin-api";
import {
  formatCurrencyFromPaise,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { Button } from "@/components/ui/button";

import { FinanceNotice } from "./FinanceNotice";
import { FinanceSectionCard } from "./FinanceSectionCard";
import { SummaryMetricCard } from "./SummaryMetricCard";

export function FinanceSnapshotSection({
  summary,
  isLoading,
  isRefreshing,
  errorMessage,
  onRefresh,
}: {
  summary: FinanceSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
}) {
  return (
    <FinanceSectionCard
      title="Finance Snapshot"
      description="Track wallet liquidity, purchase volume, payout exposure, and anomaly signals from one operating view."
      action={
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full lg:w-auto"
        >
          {isRefreshing ? "Refreshing..." : "Refresh snapshot"}
        </Button>
      }
    >
      {errorMessage ? (
        <div className="mb-4">
          <FinanceNotice
            notice={{
              tone: "error",
              title: "Finance summary is unavailable",
              description: errorMessage,
            }}
          />
        </div>
      ) : null}

      {isLoading && !summary ? (
        <p className="text-sm text-muted-foreground">
          Loading finance summary...
        </p>
      ) : summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryMetricCard
              label="Wallet Balance"
              value={`${formatNumber(summary.wallets.totalBalanceCoins)} coins`}
              caption={`${formatNumber(summary.wallets.totalWallets)} active wallets`}
            />
            <SummaryMetricCard
              label="Purchase Volume"
              value={formatCurrencyFromPaise(summary.purchases.completedVolumePaise)}
              caption={`${formatNumber(summary.purchases.completedCount)} completed purchases`}
            />
            <SummaryMetricCard
              label="Estimated Creator Payout"
              value={formatCurrencyFromPaise(
                summary.gifts.estimatedCreatorPayoutPaise,
              )}
              caption={`${formatNumber(summary.gifts.totalTransactions)} gift transfers`}
            />
            <SummaryMetricCard
              label="Reconciliation Gap"
              value={formatCurrencyFromPaise(summary.reconciliation.gapPaise)}
              caption="Delta between tracked exposure and payout estimate"
            />
            <SummaryMetricCard
              label="Pending Withdrawals"
              value={formatNumber(
                summary.withdrawals.countByStatus.PENDING +
                  summary.withdrawals.countByStatus.UNDER_REVIEW +
                  summary.withdrawals.countByStatus.ON_HOLD,
              )}
              caption={`${formatNumber(summary.withdrawals.highValuePendingCount)} high-value requests`}
            />
            <SummaryMetricCard
              label="Paid Withdrawals"
              value={formatCurrencyFromPaise(
                summary.withdrawals.netAmountByStatusPaise.PAID,
              )}
              caption="Net payouts already settled"
            />
            <SummaryMetricCard
              label="Stale Pending Purchases"
              value={formatNumber(summary.purchases.stalePendingCount)}
              caption={`${formatNumber(summary.purchases.pendingCount)} purchases still pending`}
            />
            <SummaryMetricCard
              label="Anomalies"
              value={formatNumber(summary.anomalies.count)}
              caption={`${formatNumber(summary.anomalies.highValuePendingWithdrawals)} payout anomalies`}
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              Commission: {formatPercent(summary.config.commissionRate)}
            </span>
            <span>
              Coin value: {summary.config.coinToPaiseRate} paise per coin
            </span>
            <span>Generated: {formatDateTime(summary.generatedAt)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Finance summary is unavailable.
        </p>
      )}
    </FinanceSectionCard>
  );
}
