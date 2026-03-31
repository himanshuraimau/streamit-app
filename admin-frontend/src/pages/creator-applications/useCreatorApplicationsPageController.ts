import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveCreatorApplication,
  listCreatorApplications,
  rejectCreatorApplication,
} from "../../lib/admin-api";
import type { CreatorApplicationStatus, RejectionDialogState } from "./types";

export function useCreatorApplicationsPageController() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CreatorApplicationStatus | "PENDING_REVIEW">(
    "PENDING_REVIEW",
  );
  const [rejectionDialog, setRejectionDialog] = useState<RejectionDialogState>({
    isOpen: false,
    applicationId: null,
  });

  const applicationsQuery = useQuery({
    queryKey: ["admin", "creator-applications", page, status],
    queryFn: () =>
      listCreatorApplications({
        page,
        limit: 15,
        status: status === "PENDING_REVIEW" ? undefined : status,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (applicationId: string) => approveCreatorApplication(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "creator-applications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { applicationId: string; reason: string }) =>
      rejectCreatorApplication(payload.applicationId, payload.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "creator-applications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const handleStatusChange = (value: CreatorApplicationStatus | "PENDING_REVIEW") => {
    setPage(1);
    setStatus(value);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "creator-applications"] });
  };

  const handleApprove = async (applicationId: string) => {
    const response = await approveMutation.mutateAsync(applicationId);
    if (!response.success) {
      return { success: false, error: response.error };
    }
    return { success: true };
  };

  const handleOpenRejectionDialog = (applicationId: string) => {
    setRejectionDialog({ isOpen: true, applicationId });
  };

  const handleCloseRejectionDialog = () => {
    setRejectionDialog({ isOpen: false, applicationId: null });
  };

  const handleReject = async (reason: string) => {
    if (!rejectionDialog.applicationId) {
      return { success: false, error: "No application selected" };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: "A valid rejection reason is required (min 5 characters)." };
    }

    const response = await rejectMutation.mutateAsync({
      applicationId: rejectionDialog.applicationId,
      reason: reason.trim(),
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    handleCloseRejectionDialog();
    return { success: true };
  };

  return {
    // Filters and pagination
    page,
    setPage,
    status,
    handleStatusChange,
    handleRefresh,

    // Query
    applicationsQuery,

    // Mutations
    approveMutation,
    rejectMutation,

    // Actions
    handleApprove,

    // Rejection dialog
    rejectionDialog,
    handleOpenRejectionDialog,
    handleCloseRejectionDialog,
    handleReject,
  };
}
