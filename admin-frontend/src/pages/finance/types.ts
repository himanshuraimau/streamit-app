import type { AdminNoticeState } from "@/components/admin/types";
import type { FinanceWithdrawalItem } from "@/lib/admin-api";

export type FinanceNoticeState = AdminNoticeState;

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
