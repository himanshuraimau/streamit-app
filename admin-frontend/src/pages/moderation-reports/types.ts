import type {
  ReportStatus,
  StreamReportStatus,
  ModerationReportItem,
  ModerationStreamReportItem,
} from "../../lib/admin-api";

export type {
  ReportStatus,
  StreamReportStatus,
  ModerationReportItem,
  ModerationStreamReportItem,
};

export interface ReportDecisionDialogState {
  isOpen: boolean;
  reportId: string | null;
  decision: "DISMISS" | "RESOLVE" | "HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_REPORTED_USER" | null;
}

export interface StreamReportDecisionDialogState {
  isOpen: boolean;
  streamReportId: string | null;
  status: StreamReportStatus | null;
}
