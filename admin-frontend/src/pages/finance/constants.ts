import type {
  FinanceTransactionType,
  WithdrawalStatus,
} from "@/lib/admin-api";

import type { WithdrawalDecision } from "./types";

export const TRANSACTION_TYPE_OPTIONS: FinanceTransactionType[] = [
  "PURCHASE",
  "GIFT",
  "WITHDRAWAL",
];

export const WITHDRAWAL_FILTER_OPTIONS: Array<WithdrawalStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "ON_HOLD",
  "APPROVED",
  "REJECTED",
  "PAID",
];

export const WITHDRAWAL_DECISION_META: Record<
  WithdrawalDecision,
  {
    title: string;
    description: string;
    confirmLabel: string;
    successLabel: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    reasonRequired: boolean;
    defaultReason: string;
    payoutReferenceLabel: string;
    payoutReferencePlaceholder: string;
    payoutReferenceRequired: boolean;
    defaultPayoutReference: string;
    buttonVariant: "default" | "outline" | "destructive" | "secondary";
    buttonClassName?: string;
  }
> = {
  APPROVE: {
    title: "Approve withdrawal",
    description:
      "Move this request into the approved queue so the payout can be settled.",
    confirmLabel: "Approve withdrawal",
    successLabel: "approved",
    reasonLabel: "Reviewer note",
    reasonPlaceholder: "Reviewed by finance admin",
    reasonRequired: false,
    defaultReason: "Reviewed by finance admin",
    payoutReferenceLabel: "Payout reference",
    payoutReferencePlaceholder: "",
    payoutReferenceRequired: false,
    defaultPayoutReference: "",
    buttonVariant: "outline",
    buttonClassName:
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
  },
  REJECT: {
    title: "Reject withdrawal",
    description:
      "Reject this request and leave a clear audit reason for the creator and finance team.",
    confirmLabel: "Reject withdrawal",
    successLabel: "rejected",
    reasonLabel: "Rejection reason",
    reasonPlaceholder: "Requires manual verification",
    reasonRequired: true,
    defaultReason: "Requires manual verification",
    payoutReferenceLabel: "Payout reference",
    payoutReferencePlaceholder: "",
    payoutReferenceRequired: false,
    defaultPayoutReference: "",
    buttonVariant: "destructive",
  },
  HOLD: {
    title: "Place withdrawal on hold",
    description:
      "Pause settlement while the request is manually reviewed. A reason is required.",
    confirmLabel: "Place on hold",
    successLabel: "placed on hold",
    reasonLabel: "Hold reason",
    reasonPlaceholder: "Requires manual verification",
    reasonRequired: true,
    defaultReason: "Requires manual verification",
    payoutReferenceLabel: "Payout reference",
    payoutReferencePlaceholder: "",
    payoutReferenceRequired: false,
    defaultPayoutReference: "",
    buttonVariant: "outline",
    buttonClassName:
      "border-amber-500/35 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20",
  },
  RELEASE_HOLD: {
    title: "Release withdrawal hold",
    description:
      "Return this request to the approved queue so settlement can continue.",
    confirmLabel: "Release hold",
    successLabel: "released from hold",
    reasonLabel: "Release note",
    reasonPlaceholder: "Hold released after review",
    reasonRequired: false,
    defaultReason: "Hold released after review",
    payoutReferenceLabel: "Payout reference",
    payoutReferencePlaceholder: "",
    payoutReferenceRequired: false,
    defaultPayoutReference: "",
    buttonVariant: "outline",
    buttonClassName:
      "border-sky-500/35 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20",
  },
  MARK_PAID: {
    title: "Mark withdrawal as paid",
    description:
      "Finalize settlement, record the payout reference, and leave an optional payment note.",
    confirmLabel: "Mark as paid",
    successLabel: "marked as paid",
    reasonLabel: "Payment note",
    reasonPlaceholder: "Settled successfully",
    reasonRequired: false,
    defaultReason: "Settled successfully",
    payoutReferenceLabel: "Payout reference",
    payoutReferencePlaceholder: "UTR-",
    payoutReferenceRequired: true,
    defaultPayoutReference: "UTR-",
    buttonVariant: "outline",
    buttonClassName:
      "border-indigo-500/35 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20",
  },
};
