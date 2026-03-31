import type { FinanceReconciliationSummary } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  formatCurrencyFromPaise,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";

import type { FinanceNoticeState } from "../types";
import { FinanceNotice } from "./FinanceNotice";
import { FinanceSectionCard } from "./FinanceSectionCard";
import { SummaryMetricCard } from "./SummaryMetricCard";

export function ReconciliationSection({
  reconciliation,
  reconciliationFrom,
  reconciliationTo,
  isLoading,
  isRefreshing,
  isExporting,
  errorMessage,
  notice,
  onReconciliationFromChange,
  onReconciliationToChange,
  onRecompute,
  onExport,
}: {
  reconciliation: FinanceReconciliationSummary | null;
  reconciliationFrom: string;
  reconciliationTo: string;
  isLoading: boolean;
  isRefreshing: boolean;
  isExporting: boolean;
  errorMessage: string | null;
  notice: FinanceNoticeState | null;
  onReconciliationFromChange: (value: string) => void;
  onReconciliationToChange: (value: string) => void;
  onRecompute: () => void;
  onExport: () => void;
}) {
  return (
    <FinanceSectionCard
      title="Reconciliation Window"
      description="Inspect payout exposure across a custom time range and export a finance snapshot for audit follow-up."
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onRecompute}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Recomputing..." : "Recompute"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export snapshot"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {notice ? <FinanceNotice notice={notice} /> : null}
        {errorMessage ? (
          <FinanceNotice
            notice={{
              tone: "error",
              title: "Reconciliation data is unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormItem>
            <FormLabel htmlFor="reconciliation-from">From</FormLabel>
            <FormControl>
              <Input
                id="reconciliation-from"
                type="datetime-local"
                value={reconciliationFrom}
                onChange={(event) =>
                  onReconciliationFromChange(event.target.value)
                }
              />
            </FormControl>
            <FormDescription>
              Leave blank to include the earliest available finance activity.
            </FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="reconciliation-to">To</FormLabel>
            <FormControl>
              <Input
                id="reconciliation-to"
                type="datetime-local"
                value={reconciliationTo}
                onChange={(event) =>
                  onReconciliationToChange(event.target.value)
                }
              />
            </FormControl>
            <FormDescription>
              Leave blank to calculate up to the latest available event.
            </FormDescription>
          </FormItem>
        </div>

        {isLoading && !reconciliation ? (
          <p className="text-sm text-muted-foreground">
            Calculating reconciliation...
          </p>
        ) : reconciliation ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                Commission: {formatPercent(reconciliation.config.commissionRate)}
              </span>
              <span>
                Coin value: {reconciliation.config.coinToPaiseRate} paise
              </span>
              <span>
                Period: {formatDateTime(reconciliation.period.from)} to{" "}
                {formatDateTime(reconciliation.period.to)}
              </span>
              <span>Generated: {formatDateTime(reconciliation.generatedAt)}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SummaryMetricCard
                label="Completed Purchases"
                value={formatCurrencyFromPaise(
                  reconciliation.purchases.completedVolumePaise,
                )}
                caption={`${formatNumber(reconciliation.purchases.completedCount)} successful payments`}
              />
              <SummaryMetricCard
                label="Estimated Creator Payout"
                value={formatCurrencyFromPaise(
                  reconciliation.creatorEconomy.estimatedCreatorPayoutPaise,
                )}
                caption={`${formatNumber(reconciliation.creatorEconomy.totalGiftCoins)} gift coins tracked`}
              />
              <SummaryMetricCard
                label="Pending Settlement"
                value={formatCurrencyFromPaise(
                  reconciliation.withdrawals.pendingSettlementPaise,
                )}
                caption="Requests still pending or under review"
              />
              <SummaryMetricCard
                label="Approved, Not Paid"
                value={formatCurrencyFromPaise(
                  reconciliation.withdrawals.approvedNotPaidPaise,
                )}
                caption="Approved payouts still waiting for settlement"
              />
              <SummaryMetricCard
                label="Tracked Exposure"
                value={formatCurrencyFromPaise(
                  reconciliation.reconciliation.trackedExposurePaise,
                )}
                caption="Expected withdrawal-side exposure"
              />
              <SummaryMetricCard
                label="Reconciliation Gap"
                value={formatCurrencyFromPaise(
                  reconciliation.reconciliation.gapPaise,
                )}
                caption="Gap between tracked exposure and payout estimate"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Reconciliation data unavailable.
          </p>
        )}
      </div>
    </FinanceSectionCard>
  );
}
