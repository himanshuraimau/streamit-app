import type { FinanceWithdrawalItem } from "@/lib/admin-api";

export interface FinanceNoticeState {
  tone: "success" | "error";
  title: string;
  description?: string;
}

export type WithdrawalDecision =
  | "APPROVE"
  | "REJECT"
  | "HOLD"
  | "RELEASE_HOLD"
  | "MARK_PAID";

export interface WithdrawalActionState {
  withdrawal: FinanceWithdrawalItem;
  decision: WithdrawalDecision;
  reason: string;
  payoutReference: string;
  error: string | null;
}
