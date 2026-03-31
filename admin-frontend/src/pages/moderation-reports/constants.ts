import type { ReportStatus, StreamReportStatus } from "./types";

export const REPORT_STATUSES: Array<ReportStatus | "PENDING_REVIEW"> = [
  "PENDING_REVIEW",
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "DISMISSED",
];

export const STREAM_REPORT_STATUSES: Array<StreamReportStatus | "PENDING_ONLY"> = [
  "PENDING_ONLY",
  "PENDING",
  "REVIEWED",
  "RESOLVED",
  "DISMISSED",
];
