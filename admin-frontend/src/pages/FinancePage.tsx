import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exportFinanceReconciliationCsv,
  exportFinanceTransactionsCsv,
  getFinanceCommissionConfig,
  getFinanceReconciliation,
  getFinanceSummary,
  listFinanceTransactions,
  listFinanceWithdrawals,
  reviewFinanceWithdrawal,
  updateFinanceCommissionConfig,
  type FinanceTransactionItem,
  type FinanceTransactionType,
  type WithdrawalStatus,
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

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

const WITHDRAWAL_FILTER_OPTIONS: Array<WithdrawalStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "ON_HOLD",
  "APPROVED",
  "REJECTED",
  "PAID",
];

export function FinancePage() {
  const queryClient = useQueryClient();

  const [transactionType, setTransactionType] =
    useState<FinanceTransactionType>("PURCHASE");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionPage, setTransactionPage] = useState(1);

  const [withdrawalStatus, setWithdrawalStatus] = useState<
    WithdrawalStatus | "ALL"
  >("ALL");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  const [reconciliationFrom, setReconciliationFrom] = useState("");
  const [reconciliationTo, setReconciliationTo] = useState("");

  const [commissionRateInput, setCommissionRateInput] = useState("");
  const [coinToPaiseRateInput, setCoinToPaiseRateInput] = useState("");
  const [transactionsExportNotice, setTransactionsExportNotice] = useState<string | null>(null);
  const [reconciliationExportNotice, setReconciliationExportNotice] = useState<string | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["admin", "finance", "summary"],
    queryFn: getFinanceSummary,
  });

  const transactionsQuery = useQuery({
    queryKey: [
      "admin",
      "finance",
      "transactions",
      transactionType,
      transactionStatus,
      transactionSearch,
      transactionPage,
    ],
    queryFn: () =>
      listFinanceTransactions({
        type: transactionType,
        page: transactionPage,
        limit: 10,
        status: transactionStatus.trim() || undefined,
        search: transactionSearch.trim() || undefined,
      }),
  });

  const withdrawalsQuery = useQuery({
    queryKey: [
      "admin",
      "finance",
      "withdrawals",
      withdrawalStatus,
      withdrawalSearch,
      withdrawalPage,
    ],
    queryFn: () =>
      listFinanceWithdrawals({
        page: withdrawalPage,
        limit: 10,
        status: withdrawalStatus === "ALL" ? undefined : withdrawalStatus,
        search: withdrawalSearch.trim() || undefined,
      }),
  });

  const commissionConfigQuery = useQuery({
    queryKey: ["admin", "finance", "config"],
    queryFn: getFinanceCommissionConfig,
  });

  const reconciliationQuery = useQuery({
    queryKey: [
      "admin",
      "finance",
      "reconciliation",
      reconciliationFrom,
      reconciliationTo,
    ],
    queryFn: () =>
      getFinanceReconciliation({
        from: toIsoDateTime(reconciliationFrom),
        to: toIsoDateTime(reconciliationTo),
      }),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (payload: {
      commissionRate: number;
      coinToPaiseRate: number;
    }) => updateFinanceCommissionConfig(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "summary"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "config"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "reconciliation"],
      });
    },
  });

  const reviewWithdrawalMutation = useMutation({
    mutationFn: (payload: {
      withdrawalId: string;
      decision: "APPROVE" | "REJECT" | "HOLD" | "RELEASE_HOLD" | "MARK_PAID";
      reason?: string;
      payoutReference?: string;
    }) =>
      reviewFinanceWithdrawal(payload.withdrawalId, {
        decision: payload.decision,
        reason: payload.reason,
        payoutReference: payload.payoutReference,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "summary"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "withdrawals"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "transactions"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "reconciliation"],
      });
    },
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: exportFinanceTransactionsCsv,
  });

  const exportReconciliationMutation = useMutation({
    mutationFn: exportFinanceReconciliationCsv,
  });

  const summary =
    summaryQuery.data && summaryQuery.data.success
      ? summaryQuery.data.data
      : null;
  const configData =
    commissionConfigQuery.data && commissionConfigQuery.data.success
      ? commissionConfigQuery.data.data
      : null;
  const transactionsData =
    transactionsQuery.data && transactionsQuery.data.success
      ? transactionsQuery.data.data
      : null;
  const withdrawalsData =
    withdrawalsQuery.data && withdrawalsQuery.data.success
      ? withdrawalsQuery.data.data
      : null;
  const reconciliation =
    reconciliationQuery.data && reconciliationQuery.data.success
      ? reconciliationQuery.data.data
      : null;

  const transactionRows = useMemo(
    () => transactionsData?.items ?? [],
    [transactionsData],
  );

  const effectiveCommissionRateInput =
    commissionRateInput || String(configData?.commissionRate ?? 0.3);
  const effectiveCoinToPaiseRateInput =
    coinToPaiseRateInput || String(configData?.coinToPaiseRate ?? 100);

  const handleSaveCommissionConfig = async () => {
    const commissionRate = Number(effectiveCommissionRateInput);
    const coinToPaiseRate = Number(effectiveCoinToPaiseRateInput);

    if (
      Number.isNaN(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 0.9
    ) {
      window.alert("Commission rate must be a number between 0 and 0.9");
      return;
    }

    if (!Number.isInteger(coinToPaiseRate) || coinToPaiseRate < 1) {
      window.alert("Coin to paise rate must be a positive integer");
      return;
    }

    const response = await updateConfigMutation.mutateAsync({
      commissionRate,
      coinToPaiseRate,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleWithdrawalDecision = async (
    withdrawalId: string,
    decision: "APPROVE" | "REJECT" | "HOLD" | "RELEASE_HOLD" | "MARK_PAID",
  ) => {
    let reason: string | undefined;
    let payoutReference: string | undefined;

    if (decision === "REJECT" || decision === "HOLD") {
      const input = window.prompt(
        "Reason (required):",
        "Requires manual verification",
      );
      if (!input || input.trim().length < 3) {
        window.alert("A reason of at least 3 characters is required.");
        return;
      }
      reason = input.trim();
    }

    if (decision === "APPROVE" || decision === "RELEASE_HOLD") {
      const input = window.prompt(
        "Optional reviewer note:",
        "Reviewed by finance admin",
      );
      reason = input?.trim() || undefined;
    }

    if (decision === "MARK_PAID") {
      const payoutInput = window.prompt("Payout reference (required):", "UTR-");
      if (!payoutInput || payoutInput.trim().length < 3) {
        window.alert("A payout reference is required.");
        return;
      }
      payoutReference = payoutInput.trim();
      const reasonInput = window.prompt(
        "Optional payment note:",
        "Settled successfully",
      );
      reason = reasonInput?.trim() || undefined;
    }

    const response = await reviewWithdrawalMutation.mutateAsync({
      withdrawalId,
      decision,
      reason,
      payoutReference,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const downloadCsv = (blob: Blob, fileName: string) => {
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleExportTransactions = async () => {
    const response = await exportTransactionsMutation.mutateAsync({
      type: transactionType,
      status: transactionStatus.trim() || undefined,
      search: transactionSearch.trim() || undefined,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    downloadCsv(response.data.blob, response.data.fileName);
    setTransactionsExportNotice(
      `Exported ${transactionType.toLowerCase()} transactions snapshot successfully.`,
    );
  };

  const handleExportReconciliation = async () => {
    const response = await exportReconciliationMutation.mutateAsync({
      from: toIsoDateTime(reconciliationFrom),
      to: toIsoDateTime(reconciliationTo),
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    downloadCsv(response.data.blob, response.data.fileName);
    setReconciliationExportNotice("Exported reconciliation snapshot successfully.");
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
          Phase 4
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          Finance And Withdrawals
        </h2>
      </header>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Finance Snapshot
          </h3>
          <button
            type="button"
            onClick={() =>
              void queryClient.invalidateQueries({
                queryKey: ["admin", "finance", "summary"],
              })
            }
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {summaryQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading finance summary...</p>
        ) : summary ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Wallet Balance"
              value={`${formatNumber(summary.wallets.totalBalanceCoins)} coins`}
            />
            <SummaryCard
              label="Purchase Volume"
              value={formatCurrencyFromPaise(
                summary.purchases.completedVolumePaise,
              )}
            />
            <SummaryCard
              label="Estimated Creator Payout"
              value={formatCurrencyFromPaise(
                summary.gifts.estimatedCreatorPayoutPaise,
              )}
            />
            <SummaryCard
              label="Reconciliation Gap"
              value={formatCurrencyFromPaise(summary.reconciliation.gapPaise)}
            />
            <SummaryCard
              label="Pending Withdrawals"
              value={formatNumber(
                summary.withdrawals.countByStatus.PENDING +
                  summary.withdrawals.countByStatus.UNDER_REVIEW +
                  summary.withdrawals.countByStatus.ON_HOLD,
              )}
            />
            <SummaryCard
              label="Paid Withdrawals"
              value={formatCurrencyFromPaise(
                summary.withdrawals.netAmountByStatusPaise.PAID,
              )}
            />
            <SummaryCard
              label="Stale Pending Purchases"
              value={formatNumber(summary.purchases.stalePendingCount)}
            />
            <SummaryCard
              label="Anomalies"
              value={formatNumber(summary.anomalies.count)}
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Finance summary is unavailable.
          </p>
        )}
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
          Commission Configuration
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs text-zinc-400">
            Commission Rate
            <input
              value={effectiveCommissionRateInput}
              onChange={(event) => setCommissionRateInput(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Coin To Paise Rate
            <input
              value={effectiveCoinToPaiseRateInput}
              onChange={(event) => setCoinToPaiseRateInput(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleSaveCommissionConfig()}
              disabled={updateConfigMutation.isPending}
              className="w-full rounded-xl border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Transaction Investigation
          </h3>
          <select
            aria-label="Filter transactions by type"
            value={transactionType}
            onChange={(event) => {
              setTransactionPage(1);
              setTransactionType(event.target.value as FinanceTransactionType);
              setTransactionStatus("");
            }}
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100"
          >
            <option value="PURCHASE">Purchase</option>
            <option value="GIFT">Gift</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
          <input
            aria-label="Filter transactions by status"
            value={transactionStatus}
            onChange={(event) => {
              setTransactionPage(1);
              setTransactionStatus(event.target.value);
            }}
            placeholder="Status filter"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <input
            aria-label="Search transactions"
            value={transactionSearch}
            onChange={(event) => {
              setTransactionPage(1);
              setTransactionSearch(event.target.value);
            }}
            placeholder="Search by user/ref"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => void handleExportTransactions()}
            disabled={exportTransactionsMutation.isPending}
            className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-100 hover:bg-sky-500/20 disabled:opacity-40"
          >
            {exportTransactionsMutation.isPending ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {transactionsExportNotice ? (
          <p className="mb-3 text-xs text-zinc-400">{transactionsExportNotice}</p>
        ) : null}

        {transactionsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading transactions...</p>
        ) : transactionRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-xs">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-2">When</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Party</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactionRows.map((item) => {
                  const party = getTransactionPartyLabel(item);
                  const amountLabel = getTransactionAmountLabel(item);

                  return (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-t border-white/5"
                    >
                      <td className="py-2 text-zinc-300">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="py-2 text-zinc-200">{item.type}</td>
                      <td className="py-2 text-zinc-300">{item.status}</td>
                      <td className="py-2 text-zinc-300">{party}</td>
                      <td className="py-2 text-zinc-200">{amountLabel}</td>
                      <td className="py-2 text-zinc-400">
                        {item.orderId ??
                          item.transactionId ??
                          item.payoutReference ??
                          item.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            No transactions for current filter.
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <p className="text-zinc-400">
            Page {transactionsData?.pagination.page ?? 1} /{" "}
            {Math.max(transactionsData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setTransactionPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={(transactionsData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setTransactionPage((prev) =>
                  Math.min(
                    prev + 1,
                    transactionsData?.pagination.totalPages ?? 1,
                  ),
                )
              }
              disabled={
                (transactionsData?.pagination.page ?? 1) >=
                (transactionsData?.pagination.totalPages ?? 1)
              }
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Withdrawal Queue
          </h3>
          <select
            aria-label="Filter withdrawal queue by status"
            value={withdrawalStatus}
            onChange={(event) => {
              setWithdrawalPage(1);
              setWithdrawalStatus(
                event.target.value as WithdrawalStatus | "ALL",
              );
            }}
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100"
          >
            {WITHDRAWAL_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            aria-label="Search withdrawals"
            value={withdrawalSearch}
            onChange={(event) => {
              setWithdrawalPage(1);
              setWithdrawalSearch(event.target.value);
            }}
            placeholder="Search by user/ref"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {withdrawalsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading withdrawal queue...</p>
        ) : withdrawalsData?.items.length ? (
          <div className="space-y-3">
            {withdrawalsData.items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {item.user.name}
                    </p>
                    <p className="text-zinc-400">
                      @{item.user.username} • {item.user.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                    {item.status}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-zinc-300 md:grid-cols-2">
                  <p>Requested: {formatDateTime(item.requestedAt)}</p>
                  <p>Amount: {formatCurrencyFromPaise(item.netAmountPaise)}</p>
                  <p>Coins: {formatNumber(item.amountCoins)}</p>
                  <p>Payout Ref: {item.payoutReference ?? "N/A"}</p>
                </div>

                {item.reason ? (
                  <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300">
                    Note: {item.reason}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {(item.status === "PENDING" ||
                    item.status === "UNDER_REVIEW" ||
                    item.status === "ON_HOLD") && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleWithdrawalDecision(item.id, "APPROVE")
                      }
                      disabled={reviewWithdrawalMutation.isPending}
                      className="rounded-md border border-emerald-400/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                    >
                      Approve
                    </button>
                  )}

                  {(item.status === "PENDING" ||
                    item.status === "UNDER_REVIEW" ||
                    item.status === "APPROVED") && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleWithdrawalDecision(item.id, "HOLD")
                      }
                      disabled={reviewWithdrawalMutation.isPending}
                      className="rounded-md border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                    >
                      Hold
                    </button>
                  )}

                  {item.status === "ON_HOLD" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleWithdrawalDecision(item.id, "RELEASE_HOLD")
                      }
                      disabled={reviewWithdrawalMutation.isPending}
                      className="rounded-md border border-sky-400/30 px-2 py-1 text-sky-200 hover:bg-sky-500/10 disabled:opacity-40"
                    >
                      Release Hold
                    </button>
                  )}

                  {item.status !== "PAID" && item.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleWithdrawalDecision(item.id, "REJECT")
                      }
                      disabled={reviewWithdrawalMutation.isPending}
                      className="rounded-md border border-red-400/30 px-2 py-1 text-red-200 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  )}

                  {item.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleWithdrawalDecision(item.id, "MARK_PAID")
                      }
                      disabled={reviewWithdrawalMutation.isPending}
                      className="rounded-md border border-indigo-400/30 px-2 py-1 text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-40"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            No withdrawal requests for this filter.
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <p className="text-zinc-400">
            Page {withdrawalsData?.pagination.page ?? 1} /{" "}
            {Math.max(withdrawalsData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWithdrawalPage((prev) => Math.max(prev - 1, 1))}
              disabled={(withdrawalsData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setWithdrawalPage((prev) =>
                  Math.min(
                    prev + 1,
                    withdrawalsData?.pagination.totalPages ?? 1,
                  ),
                )
              }
              disabled={
                (withdrawalsData?.pagination.page ?? 1) >=
                (withdrawalsData?.pagination.totalPages ?? 1)
              }
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
          Reconciliation Window
        </h3>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs text-zinc-400">
            From
            <input
              type="datetime-local"
              value={reconciliationFrom}
              onChange={(event) => setReconciliationFrom(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="text-xs text-zinc-400">
            To
            <input
              type="datetime-local"
              value={reconciliationTo}
              onChange={(event) => setReconciliationTo(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <div className="flex items-end">
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() =>
                  void queryClient.invalidateQueries({
                    queryKey: ["admin", "finance", "reconciliation"],
                  })
                }
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10"
              >
                Recompute
              </button>
              <button
                type="button"
                onClick={() => void handleExportReconciliation()}
                disabled={exportReconciliationMutation.isPending}
                className="w-full rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/20 disabled:opacity-40"
              >
                {exportReconciliationMutation.isPending ? "Exporting..." : "Export Snapshot CSV"}
              </button>
            </div>
          </div>
        </div>

        {reconciliationExportNotice ? (
          <p className="mb-3 text-xs text-zinc-400">{reconciliationExportNotice}</p>
        ) : null}

        {reconciliationQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Calculating reconciliation...</p>
        ) : reconciliation ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Completed Purchases"
              value={formatCurrencyFromPaise(
                reconciliation.purchases.completedVolumePaise,
              )}
            />
            <SummaryCard
              label="Estimated Creator Payout"
              value={formatCurrencyFromPaise(
                reconciliation.creatorEconomy.estimatedCreatorPayoutPaise,
              )}
            />
            <SummaryCard
              label="Tracked Exposure"
              value={formatCurrencyFromPaise(
                reconciliation.reconciliation.trackedExposurePaise,
              )}
            />
            <SummaryCard
              label="Reconciliation Gap"
              value={formatCurrencyFromPaise(
                reconciliation.reconciliation.gapPaise,
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Reconciliation data unavailable.
          </p>
        )}
      </section>
    </div>
  );
}

function getTransactionPartyLabel(item: FinanceTransactionItem) {
  if (item.type === "PURCHASE") {
    return item.user ? `@${item.user.username}` : "N/A";
  }

  if (item.type === "GIFT") {
    if (item.sender && item.receiver) {
      return `@${item.sender.username} -> @${item.receiver.username}`;
    }
    return "N/A";
  }

  return item.user ? `@${item.user.username}` : "N/A";
}

function getTransactionAmountLabel(item: FinanceTransactionItem) {
  if (item.type === "GIFT" && typeof item.coinAmount === "number") {
    return `${formatNumber(item.coinAmount)} coins`;
  }

  if (typeof item.amountPaise === "number") {
    return formatCurrencyFromPaise(item.amountPaise);
  }

  if (typeof item.totalCoins === "number") {
    return `${formatNumber(item.totalCoins)} coins`;
  }

  return "N/A";
}
