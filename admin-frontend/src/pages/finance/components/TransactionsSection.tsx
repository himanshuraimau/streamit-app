import type {
  FinanceTransactionItem,
  FinanceTransactionType,
  PaginationMeta,
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
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { TRANSACTION_TYPE_OPTIONS } from "../constants";
import type { FinanceNoticeState } from "../types";
import {
  getStatusBadgeClassName,
  getTransactionAmountLabel,
  getTransactionPartyLabel,
} from "../utils";
import { FinanceNotice } from "./FinanceNotice";
import { FinanceSectionCard } from "./FinanceSectionCard";
import { PaginationControls } from "./PaginationControls";

export function TransactionsSection({
  transactionType,
  transactionStatus,
  transactionSearch,
  rows,
  pagination,
  isLoading,
  isExporting,
  errorMessage,
  notice,
  onTransactionTypeChange,
  onTransactionStatusChange,
  onTransactionSearchChange,
  onPreviousPage,
  onNextPage,
  onExport,
}: {
  transactionType: FinanceTransactionType;
  transactionStatus: string;
  transactionSearch: string;
  rows: FinanceTransactionItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isExporting: boolean;
  errorMessage: string | null;
  notice: FinanceNoticeState | null;
  onTransactionTypeChange: (value: FinanceTransactionType) => void;
  onTransactionStatusChange: (value: string) => void;
  onTransactionSearchChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onExport: () => void;
}) {
  return (
    <FinanceSectionCard
      title="Transaction Investigation"
      description="Filter purchases, gifts, and withdrawal ledger events without leaving the main finance workspace."
      action={
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={isExporting}
          className="w-full lg:w-auto"
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      }
    >
      <div className="space-y-4">
        {notice ? <FinanceNotice notice={notice} /> : null}
        {errorMessage ? (
          <FinanceNotice
            notice={{
              tone: "error",
              title: "Transactions could not be loaded",
              description: errorMessage,
            }}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_180px_1fr]">
          <Select
            value={transactionType}
            onValueChange={(value) =>
              onTransactionTypeChange(value as FinanceTransactionType)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Transaction type" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label="Filter transactions by status"
            value={transactionStatus}
            onChange={(event) => onTransactionStatusChange(event.target.value)}
            placeholder="Status filter"
          />

          <Input
            aria-label="Search transactions"
            value={transactionSearch}
            onChange={(event) => onTransactionSearchChange(event.target.value)}
            placeholder="Search by username, order, or payout reference"
          />
        </div>

        {isLoading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Loading transactions...
          </p>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-background/65 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Party</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const reference =
                    item.orderId ??
                    item.transactionId ??
                    item.payoutReference ??
                    item.id;

                  const supplementalNote =
                    item.failureReason ?? item.reason ?? item.message;

                  return (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-t border-border/60 bg-card/20"
                    >
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/45"
                        >
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-foreground">
                        {getTransactionPartyLabel(item)}
                      </td>
                      <td className="px-4 py-3 align-top font-medium text-foreground">
                        {getTransactionAmountLabel(item)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <p className="font-mono text-xs text-foreground">
                            {reference}
                          </p>
                          {supplementalNote ? (
                            <p className="text-xs text-muted-foreground">
                              {supplementalNote}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge
                          variant="outline"
                          className={cn(getStatusBadgeClassName(item.status))}
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No transactions for the current filter set.
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
