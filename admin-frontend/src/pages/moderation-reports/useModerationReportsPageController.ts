import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listModerationReports,
  listModerationStreamReports,
  reviewModerationReport,
  reviewModerationStreamReport,
} from "../../lib/admin-api";
import type {
  ReportStatus,
  StreamReportStatus,
  ReportDecisionDialogState,
  StreamReportDecisionDialogState,
} from "./types";

export function useModerationReportsPageController() {
  const queryClient = useQueryClient();

  const [reportPage, setReportPage] = useState(1);
  const [streamReportPage, setStreamReportPage] = useState(1);
  const [reportStatus, setReportStatus] = useState<ReportStatus | "PENDING_REVIEW">("PENDING_REVIEW");
  const [streamReportStatus, setStreamReportStatus] = useState<StreamReportStatus | "PENDING_ONLY">(
    "PENDING_ONLY",
  );

  const [reportDecisionDialog, setReportDecisionDialog] = useState<ReportDecisionDialogState>({
    isOpen: false,
    reportId: null,
    decision: null,
  });

  const [streamReportDecisionDialog, setStreamReportDecisionDialog] =
    useState<StreamReportDecisionDialogState>({
      isOpen: false,
      streamReportId: null,
      status: null,
    });

  const reportsQuery = useQuery({
    queryKey: ["admin", "moderation", "reports", reportPage, reportStatus],
    queryFn: () =>
      listModerationReports({
        page: reportPage,
        limit: 10,
        status: reportStatus === "PENDING_REVIEW" ? undefined : reportStatus,
      }),
  });

  const streamReportsQuery = useQuery({
    queryKey: ["admin", "moderation", "stream-reports", streamReportPage, streamReportStatus],
    queryFn: () =>
      listModerationStreamReports({
        page: streamReportPage,
        limit: 10,
        status: streamReportStatus === "PENDING_ONLY" ? undefined : streamReportStatus,
      }),
  });

  const reportActionMutation = useMutation({
    mutationFn: (payload: {
      reportId: string;
      decision: "DISMISS" | "RESOLVE" | "HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_REPORTED_USER";
      resolution?: string;
    }) =>
      reviewModerationReport(payload.reportId, {
        decision: payload.decision,
        resolution: payload.resolution,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
    },
  });

  const streamReportActionMutation = useMutation({
    mutationFn: (payload: {
      streamReportId: string;
      status: StreamReportStatus;
      resolution?: string;
    }) =>
      reviewModerationStreamReport(payload.streamReportId, {
        status: payload.status,
        resolution: payload.resolution,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "stream-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
    },
  });

  const handleReportStatusChange = (value: ReportStatus | "PENDING_REVIEW") => {
    setReportPage(1);
    setReportStatus(value);
  };

  const handleStreamReportStatusChange = (value: StreamReportStatus | "PENDING_ONLY") => {
    setStreamReportPage(1);
    setStreamReportStatus(value);
  };

  const handleOpenReportDecisionDialog = (
    reportId: string,
    decision: "DISMISS" | "RESOLVE" | "HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_REPORTED_USER",
  ) => {
    setReportDecisionDialog({ isOpen: true, reportId, decision });
  };

  const handleCloseReportDecisionDialog = () => {
    setReportDecisionDialog({ isOpen: false, reportId: null, decision: null });
  };

  const handleReportDecision = async (resolution?: string) => {
    if (!reportDecisionDialog.reportId || !reportDecisionDialog.decision) {
      return { success: false, error: "No report or decision selected" };
    }

    const response = await reportActionMutation.mutateAsync({
      reportId: reportDecisionDialog.reportId,
      decision: reportDecisionDialog.decision,
      resolution,
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    handleCloseReportDecisionDialog();
    return { success: true };
  };

  const handleOpenStreamReportDecisionDialog = (
    streamReportId: string,
    status: StreamReportStatus,
  ) => {
    setStreamReportDecisionDialog({ isOpen: true, streamReportId, status });
  };

  const handleCloseStreamReportDecisionDialog = () => {
    setStreamReportDecisionDialog({ isOpen: false, streamReportId: null, status: null });
  };

  const handleStreamReportDecision = async (resolution?: string) => {
    if (!streamReportDecisionDialog.streamReportId || !streamReportDecisionDialog.status) {
      return { success: false, error: "No stream report or status selected" };
    }

    const response = await streamReportActionMutation.mutateAsync({
      streamReportId: streamReportDecisionDialog.streamReportId,
      status: streamReportDecisionDialog.status,
      resolution,
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    handleCloseStreamReportDecisionDialog();
    return { success: true };
  };

  return {
    // Content reports
    reportPage,
    setReportPage,
    reportStatus,
    handleReportStatusChange,
    reportsQuery,

    // Stream reports
    streamReportPage,
    setStreamReportPage,
    streamReportStatus,
    handleStreamReportStatusChange,
    streamReportsQuery,

    // Mutations
    reportActionMutation,
    streamReportActionMutation,

    // Report decision dialog
    reportDecisionDialog,
    handleOpenReportDecisionDialog,
    handleCloseReportDecisionDialog,
    handleReportDecision,

    // Stream report decision dialog
    streamReportDecisionDialog,
    handleOpenStreamReportDecisionDialog,
    handleCloseStreamReportDecisionDialog,
    handleStreamReportDecision,
  };
}
