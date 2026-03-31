import type {
  FinanceTransactionItem,
  WithdrawalStatus,
} from "@/lib/admin-api";
import { formatCurrencyFromPaise, formatNumber } from "@/lib/formatters";

import type { WithdrawalDecision } from "./types";

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getResponseErrorMessage(
  response: { success: boolean; error?: string } | undefined,
  error: unknown,
  fallback: string,
) {
  if (response && !response.success) {
    return response.error ?? fallback;
  }

  if (error) {
    return getErrorMessage(error, fallback);
  }

  return null;
}

export function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function validateCommissionConfig(
  commissionRate: number,
  coinToPaiseRate: number,
) {
  if (
    Number.isNaN(commissionRate) ||
    commissionRate < 0 ||
    commissionRate > 0.9
  ) {
    return "Commission rate must be a number between 0 and 0.9.";
  }

  if (!Number.isInteger(coinToPaiseRate) || coinToPaiseRate < 1) {
    return "Coin to paise rate must be a positive integer.";
  }

  return null;
}

export function validateWithdrawalDecision(
  decision: WithdrawalDecision,
  reason: string,
  payoutReference: string,
) {
  const normalizedReason = reason.trim();
  const normalizedPayoutReference = payoutReference.trim();

  if (
    (decision === "REJECT" || decision === "HOLD") &&
    normalizedReason.length < 3
  ) {
    return "A reason of at least 3 characters is required.";
  }

  if (decision === "MARK_PAID" && normalizedPayoutReference.length < 3) {
    return "A payout reference is required.";
  }

  return null;
}

export function getTransactionPartyLabel(item: FinanceTransactionItem) {
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

export function getTransactionAmountLabel(item: FinanceTransactionItem) {
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

export function getStatusBadgeClassName(status: string) {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "APPROVED":
    case "PAID":
    case "SUCCESS":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "PENDING":
    case "UNDER_REVIEW":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "ON_HOLD":
      return "border-orange-500/30 bg-orange-500/10 text-orange-100";
    case "FAILED":
    case "REJECTED":
    case "DISMISSED":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    default:
      return "border-border/70 bg-muted/40 text-muted-foreground";
  }
}

export function getAvailableWithdrawalDecisions(status: WithdrawalStatus) {
  const decisions: WithdrawalDecision[] = [];

  if (status === "PENDING" || status === "UNDER_REVIEW" || status === "ON_HOLD") {
    decisions.push("APPROVE");
  }

  if (status === "PENDING" || status === "UNDER_REVIEW" || status === "APPROVED") {
    decisions.push("HOLD");
  }

  if (status === "ON_HOLD") {
    decisions.push("RELEASE_HOLD");
  }

  if (status !== "PAID" && status !== "REJECTED") {
    decisions.push("REJECT");
  }

  if (status === "APPROVED") {
    decisions.push("MARK_PAID");
  }

  return decisions;
}
