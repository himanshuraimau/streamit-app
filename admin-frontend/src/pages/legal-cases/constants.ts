import type { LegalCaseStatus, LegalCaseType } from "./types";

export const LEGAL_CASE_STATUSES: Array<LegalCaseStatus | "ALL"> = [
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "RESOLVED",
  "CLOSED",
];

export const LEGAL_CASE_TYPES: Array<LegalCaseType | "ALL"> = [
  "ALL",
  "COPYRIGHT",
  "PLATFORM_POLICY",
  "REGULATORY",
  "PRIVACY",
  "FRAUD",
  "OTHER",
];

export const UPDATABLE_STATUSES: LegalCaseStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "RESOLVED",
  "CLOSED",
];
