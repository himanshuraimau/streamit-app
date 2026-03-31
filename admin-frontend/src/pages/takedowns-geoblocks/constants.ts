import type {
  TakedownStatus,
  TakedownReason,
  GeoBlockStatus,
  GeoBlockReason,
} from "@/lib/admin-api";

export const TAKEDOWN_STATUS_OPTIONS: Array<TakedownStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "EXECUTED",
  "APPEALED",
  "REVERSED",
  "REJECTED",
];

export const TAKEDOWN_REASON_OPTIONS: Array<TakedownReason | "ALL"> = [
  "ALL",
  "COPYRIGHT",
  "LEGAL_ORDER",
  "PLATFORM_POLICY",
  "SAFETY",
  "FRAUD",
  "OTHER",
];

export const GEOBLOCK_STATUS_OPTIONS: Array<GeoBlockStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "DISABLED",
];

export const GEOBLOCK_REASON_OPTIONS: Array<GeoBlockReason | "ALL"> = [
  "ALL",
  "LEGAL",
  "LICENSING",
  "REGULATORY",
  "SAFETY",
  "OTHER",
];

export const TAKEDOWN_ACTION_META: Record<
  "EXECUTE" | "APPEAL" | "REVERSE" | "REJECT",
  {
    title: string;
    description: string;
    confirmLabel: string;
    noteLabel: string;
    notePlaceholder: string;
    noteRequired: boolean;
    defaultNote: string;
  }
> = {
  EXECUTE: {
    title: "Execute Takedown",
    description: "Execute this takedown request and apply the content restriction.",
    confirmLabel: "Execute Takedown",
    noteLabel: "Execution note (required)",
    notePlaceholder: "Legal action executed",
    noteRequired: true,
    defaultNote: "Legal action executed",
  },
  APPEAL: {
    title: "Appeal Takedown",
    description: "Mark this takedown as appealed for further review.",
    confirmLabel: "Appeal Takedown",
    noteLabel: "Appeal note (optional)",
    notePlaceholder: "Appeal submitted for review",
    noteRequired: false,
    defaultNote: "",
  },
  REVERSE: {
    title: "Reverse Takedown",
    description: "Reverse this takedown and restore the content.",
    confirmLabel: "Reverse Takedown",
    noteLabel: "Reversal note (required)",
    notePlaceholder: "Takedown reversed after review",
    noteRequired: true,
    defaultNote: "Takedown reversed after review",
  },
  REJECT: {
    title: "Reject Takedown",
    description: "Reject this takedown request without executing it.",
    confirmLabel: "Reject Takedown",
    noteLabel: "Rejection note (optional)",
    notePlaceholder: "Request rejected",
    noteRequired: false,
    defaultNote: "",
  },
};
