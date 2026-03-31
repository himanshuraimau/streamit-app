import type {
  FinanceWithdrawalItem,
  PaginationMeta,
  WithdrawalStatus,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import {
  WITHDRAWAL_DECISION_META,
  WITHDRAWAL_FILTER_OPTIONS,
} from "../constants";
import type { FinanceNoticeState, WithdrawalDecision } from "../types";
import {
  getAvailableWithdrawalDecisions,
  getStatusBadgeClassName,
} from "../utils";
import { FinanceNotice } from "./FinanceNotice";
import { FinanceSectionCard } from "./FinanceSectionCard";
import { PaginationControls } from "./PaginationControls";

export function WithdrawalsSection({
  withdrawalStatus,
  withdrawalSearch,
  items,
  pagination,
  isLoading,
  isSubmitting,
  errorMessage,
  notice,
  onWithdrawalStatusChange,
  onWithdrawalSearchChange,
  onPreviousPage,
  onNextPage,
  onAction,
}: {
  withdrawalStatus: WithdrawalStatus | "ALL";
  withdrawalSearch: string;
  items: FinanceWithdrawalItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  notice: FinanceNoticeState | null;
  onWithdrawalStatusChange: (value: WithdrawalStatus | "ALL") => void;
  onWithdrawalSearchChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onAction: (
    withdrawal: FinanceWithdrawalItem,
    decision: WithdrawalDecision,
  ) => void;
}) {
  return (
    <FinanceSectionCard
      title="Withdrawal Queue"
      description="Review payout requests, hold risky settlements, and record payment confirmations with audit-ready notes."
    >
      <div className="space-y-4">
        {notice ? <FinanceNotice notice={notice} /> : null}
        {errorMessage ? (
          <FinanceNotice
            notice={{
              tone: "error",
              title: "Withdrawal queue could not be loaded",
              description: errorMessage,
            }}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
          <Select
            value={withdrawalStatus}
            onValueChange={(value) =>
              onWithdrawalStatusChange(value as WithdrawalStatus | "ALL")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Withdrawal status" />
            </SelectTrigger>
            <SelectContent>
              {WITHDRAWAL_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label="Search withdrawals"
            value={withdrawalSearch}
            onChange={(event) => onWithdrawalSearchChange(event.target.value)}
            placeholder="Search by creator, email, or payout reference"
          />
        </div>

        {isLoading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Loading withdrawal queue...
          </p>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-border/60 bg-background/35 p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {item.user.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(getStatusBadgeClassName(item.status))}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        @{item.user.username} · {item.user.email}
                      </p>
                      <p>Requested {formatDateTime(item.requestedAt)}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm text-foreground md:grid-cols-2 xl:grid-cols-3">
                      <p>Net amount: {formatCurrencyFromPaise(item.netAmountPaise)}</p>
                      <p>Gross amount: {formatCurrencyFromPaise(item.grossAmountPaise)}</p>
                      <p>Platform fee: {formatCurrencyFromPaise(item.platformFeePaise)}</p>
                      <p>Coins: {formatNumber(item.amountCoins)}</p>
                      <p>Payout reference: {item.payoutReference ?? "N/A"}</p>
                      <p>
                        Reviewed by:{" "}
                        {item.reviewer ? `@${item.reviewer.username}` : "N/A"}
                      </p>
                    </div>

                    {item.reason ? (
                      <div className="rounded-2xl border border-border/60 bg-card/50 px-3 py-2 text-sm text-muted-foreground">
                        {item.reason}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:max-w-xs xl:justify-end">
                    {getAvailableWithdrawalDecisions(item.status).map(
                      (decision) => {
                        const action = WITHDRAWAL_DECISION_META[decision];

                        return (
                          <Button
                            key={decision}
                            type="button"
                            variant={action.buttonVariant}
                            className={action.buttonClassName}
                            onClick={() => onAction(item, decision)}
                            disabled={isSubmitting}
                          >
                            {action.confirmLabel}
                          </Button>
                        );
                      },
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No withdrawal requests for this filter.
          </p>
        )}

        <PaginationControls
          page={pagination?.page ?? 1}
          totalPages={pagination?.totalPages ?? 1}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>
    </FinanceSectionCard>
  );
}
