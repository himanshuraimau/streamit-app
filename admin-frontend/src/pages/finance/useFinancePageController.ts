import { useState } from "react";
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
  type FinanceTransactionType,
  type FinanceWithdrawalItem,
  type WithdrawalStatus,
} from "@/lib/admin-api";
import { toIsoDateTime } from "@/lib/formatters";
import { useFileExport } from "@/hooks/useFileExport";

import { WITHDRAWAL_DECISION_META } from "./constants";
import type {
  FinanceNoticeState,
  WithdrawalActionState,
  WithdrawalDecision,
} from "./types";
import {
  getErrorMessage,
  getResponseErrorMessage,
  normalizeOptionalText,
  validateCommissionConfig,
  validateWithdrawalDecision,
} from "./utils";

export function useFinancePageController() {
  const queryClient = useQueryClient();
  const { downloadFile } = useFileExport();

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

  const [configNotice, setConfigNotice] =
    useState<FinanceNoticeState | null>(null);
  const [transactionsNotice, setTransactionsNotice] =
    useState<FinanceNoticeState | null>(null);
  const [withdrawalsNotice, setWithdrawalsNotice] =
    useState<FinanceNoticeState | null>(null);
  const [reconciliationNotice, setReconciliationNotice] =
    useState<FinanceNoticeState | null>(null);
  const [withdrawalAction, setWithdrawalAction] =
    useState<WithdrawalActionState | null>(null);

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
      decision: WithdrawalDecision;
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

  const summaryError = getResponseErrorMessage(
    summaryQuery.data,
    summaryQuery.error,
    "Finance summary is unavailable.",
  );
  const configError = getResponseErrorMessage(
    commissionConfigQuery.data,
    commissionConfigQuery.error,
    "Commission configuration is unavailable.",
  );
  const transactionsError = getResponseErrorMessage(
    transactionsQuery.data,
    transactionsQuery.error,
    "Transactions are unavailable.",
  );
  const withdrawalsError = getResponseErrorMessage(
    withdrawalsQuery.data,
    withdrawalsQuery.error,
    "Withdrawals are unavailable.",
  );
  const reconciliationError = getResponseErrorMessage(
    reconciliationQuery.data,
    reconciliationQuery.error,
    "Reconciliation data is unavailable.",
  );

  const effectiveCommissionRateInput =
    commissionRateInput || String(configData?.commissionRate ?? 0.3);
  const effectiveCoinToPaiseRateInput =
    coinToPaiseRateInput || String(configData?.coinToPaiseRate ?? 100);

  const openWithdrawalAction = (
    withdrawal: FinanceWithdrawalItem,
    decision: WithdrawalDecision,
  ) => {
    const meta = WITHDRAWAL_DECISION_META[decision];

    setWithdrawalAction({
      withdrawal,
      decision,
      reason: meta.defaultReason,
      payoutReference: meta.defaultPayoutReference,
      error: null,
    });
  };

  const updateWithdrawalActionState = (
    patch: Partial<WithdrawalActionState>,
  ) => {
    setWithdrawalAction((current) =>
      current
        ? {
            ...current,
            ...patch,
            error: null,
          }
        : current,
    );
  };

  const closeWithdrawalDialog = (open: boolean) => {
    if (!open && !reviewWithdrawalMutation.isPending) {
      setWithdrawalAction(null);
    }
  };

  const handleSaveCommissionConfig = async () => {
    setConfigNotice(null);

    const commissionRate = Number(effectiveCommissionRateInput);
    const coinToPaiseRate = Number(effectiveCoinToPaiseRateInput);
    const validationError = validateCommissionConfig(
      commissionRate,
      coinToPaiseRate,
    );

    if (validationError) {
      setConfigNotice({
        tone: "error",
        title: "Unable to save commission settings",
        description: validationError,
      });
      return;
    }

    try {
      const response = await updateConfigMutation.mutateAsync({
        commissionRate,
        coinToPaiseRate,
      });

      if (!response.success) {
        setConfigNotice({
          tone: "error",
          title: "Unable to save commission settings",
          description: response.error,
        });
        return;
      }

      setCommissionRateInput("");
      setCoinToPaiseRateInput("");
      setConfigNotice({
        tone: "success",
        title: "Finance configuration updated",
        description:
          "Commission and coin conversion settings have been saved and the finance snapshot was refreshed.",
      });
    } catch (error) {
      setConfigNotice({
        tone: "error",
        title: "Unable to save commission settings",
        description: getErrorMessage(
          error,
          "Something went wrong while saving finance settings.",
        ),
      });
    }
  };

  const handleConfirmWithdrawalAction = async () => {
    if (!withdrawalAction) {
      return;
    }

    const validationError = validateWithdrawalDecision(
      withdrawalAction.decision,
      withdrawalAction.reason,
      withdrawalAction.payoutReference,
    );

    if (validationError) {
      setWithdrawalAction((current) =>
        current
          ? {
              ...current,
              error: validationError,
            }
          : current,
      );
      return;
    }

    try {
      const response = await reviewWithdrawalMutation.mutateAsync({
        withdrawalId: withdrawalAction.withdrawal.id,
        decision: withdrawalAction.decision,
        reason: normalizeOptionalText(withdrawalAction.reason),
        payoutReference: normalizeOptionalText(withdrawalAction.payoutReference),
      });

      if (!response.success) {
        setWithdrawalAction((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      const meta = WITHDRAWAL_DECISION_META[withdrawalAction.decision];
      setWithdrawalAction(null);
      setWithdrawalsNotice({
        tone: "success",
        title: "Withdrawal updated",
        description: `Withdrawal for @${withdrawalAction.withdrawal.user.username} was ${meta.successLabel}.`,
      });
    } catch (error) {
      setWithdrawalAction((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while updating the withdrawal.",
              ),
            }
          : current,
      );
    }
  };

  const handleExportTransactions = async () => {
    setTransactionsNotice(null);

    try {
      const response = await exportTransactionsMutation.mutateAsync({
        type: transactionType,
        status: transactionStatus.trim() || undefined,
        search: transactionSearch.trim() || undefined,
      });

      if (!response.success) {
        setTransactionsNotice({
          tone: "error",
          title: "Unable to export transactions",
          description: response.error,
        });
        return;
      }

      downloadFile(response.data.blob, response.data.fileName);
      setTransactionsNotice({
        tone: "success",
        title: "Transactions export ready",
        description: `Downloaded ${response.data.fileName}.`,
      });
    } catch (error) {
      setTransactionsNotice({
        tone: "error",
        title: "Unable to export transactions",
        description: getErrorMessage(
          error,
          "Something went wrong while exporting transactions.",
        ),
      });
    }
  };

  const handleExportReconciliation = async () => {
    setReconciliationNotice(null);

    try {
      const response = await exportReconciliationMutation.mutateAsync({
        from: toIsoDateTime(reconciliationFrom),
        to: toIsoDateTime(reconciliationTo),
      });

      if (!response.success) {
        setReconciliationNotice({
          tone: "error",
          title: "Unable to export reconciliation snapshot",
          description: response.error,
        });
        return;
      }

      downloadFile(response.data.blob, response.data.fileName);
      setReconciliationNotice({
        tone: "success",
        title: "Reconciliation export ready",
        description: `Downloaded ${response.data.fileName}.`,
      });
    } catch (error) {
      setReconciliationNotice({
        tone: "error",
        title: "Unable to export reconciliation snapshot",
        description: getErrorMessage(
          error,
          "Something went wrong while exporting reconciliation data.",
        ),
      });
    }
  };

  return {
    summarySection: {
      summary,
      isLoading: summaryQuery.isLoading,
      isRefreshing: summaryQuery.isFetching,
      errorMessage: summaryError,
      onRefresh: () => {
        void queryClient.invalidateQueries({
          queryKey: ["admin", "finance", "summary"],
        });
      },
    },
    configSection: {
      config: configData,
      commissionRateInput: effectiveCommissionRateInput,
      coinToPaiseRateInput: effectiveCoinToPaiseRateInput,
      onCommissionRateChange: setCommissionRateInput,
      onCoinToPaiseRateChange: setCoinToPaiseRateInput,
      onSubmit: handleSaveCommissionConfig,
      isSaving: updateConfigMutation.isPending,
      notice:
        configNotice ??
        (configError
          ? {
              tone: "error" as const,
              title: "Finance configuration is unavailable",
              description: configError,
            }
          : null),
    },
    transactionsSection: {
      transactionType,
      transactionStatus,
      transactionSearch,
      rows: transactionsData?.items ?? [],
      pagination: transactionsData?.pagination,
      isLoading: transactionsQuery.isLoading,
      isExporting: exportTransactionsMutation.isPending,
      errorMessage: transactionsError,
      notice: transactionsNotice,
      onTransactionTypeChange: (value: FinanceTransactionType) => {
        setTransactionPage(1);
        setTransactionType(value);
        setTransactionStatus("");
      },
      onTransactionStatusChange: (value: string) => {
        setTransactionPage(1);
        setTransactionStatus(value);
      },
      onTransactionSearchChange: (value: string) => {
        setTransactionPage(1);
        setTransactionSearch(value);
      },
      onPreviousPage: () =>
        setTransactionPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setTransactionPage((current) =>
          Math.min(current + 1, transactionsData?.pagination.totalPages ?? 1),
        ),
      onExport: handleExportTransactions,
    },
    withdrawalsSection: {
      withdrawalStatus,
      withdrawalSearch,
      items: withdrawalsData?.items ?? [],
      pagination: withdrawalsData?.pagination,
      isLoading: withdrawalsQuery.isLoading,
      isSubmitting: reviewWithdrawalMutation.isPending,
      errorMessage: withdrawalsError,
      notice: withdrawalsNotice,
      onWithdrawalStatusChange: (value: WithdrawalStatus | "ALL") => {
        setWithdrawalPage(1);
        setWithdrawalStatus(value);
      },
      onWithdrawalSearchChange: (value: string) => {
        setWithdrawalPage(1);
        setWithdrawalSearch(value);
      },
      onPreviousPage: () =>
        setWithdrawalPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setWithdrawalPage((current) =>
          Math.min(current + 1, withdrawalsData?.pagination.totalPages ?? 1),
        ),
      onAction: openWithdrawalAction,
    },
    reconciliationSection: {
      reconciliation,
      reconciliationFrom,
      reconciliationTo,
      isLoading: reconciliationQuery.isLoading,
      isRefreshing: reconciliationQuery.isFetching,
      isExporting: exportReconciliationMutation.isPending,
      errorMessage: reconciliationError,
      notice: reconciliationNotice,
      onReconciliationFromChange: setReconciliationFrom,
      onReconciliationToChange: setReconciliationTo,
      onRecompute: () => {
        void queryClient.invalidateQueries({
          queryKey: ["admin", "finance", "reconciliation"],
        });
      },
      onExport: handleExportReconciliation,
    },
    withdrawalDialog: {
      action: withdrawalAction,
      isPending: reviewWithdrawalMutation.isPending,
      onOpenChange: closeWithdrawalDialog,
      onReasonChange: (value: string) =>
        updateWithdrawalActionState({ reason: value }),
      onPayoutReferenceChange: (value: string) =>
        updateWithdrawalActionState({ payoutReference: value }),
      onSubmit: handleConfirmWithdrawalAction,
    },
  };
}
