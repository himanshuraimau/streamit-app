import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyTakedownAction,
  createGeoBlock,
  createTakedown,
  listGeoBlocks,
  listTakedowns,
  removeGeoBlock,
  updateGeoBlock,
  type GeoBlockReason,
  type GeoBlockRuleItem,
  type GeoBlockStatus,
  type TakedownListItem,
  type TakedownReason,
  type TakedownStatus,
} from "@/lib/admin-api";

import type {
  GeoBlockReasonDialogState,
  TakedownAction,
  TakedownActionDialogState,
  TakedownsNoticeState,
} from "./types";
import {
  getErrorMessage,
  getResponseErrorMessage,
  toIsoDateTime,
  validateGeoBlockForm,
  validateGeoBlockReason,
  validateTakedownAction,
  validateTakedownForm,
} from "./utils";

export function useTakedownsGeoBlocksPageController() {
  const queryClient = useQueryClient();

  const [takedownStatus, setTakedownStatus] = useState<TakedownStatus | "ALL">("ALL");
  const [takedownReason, setTakedownReason] = useState<TakedownReason | "ALL">("ALL");
  const [takedownSearch, setTakedownSearch] = useState("");
  const [takedownPage, setTakedownPage] = useState(1);

  const [geoStatus, setGeoStatus] = useState<GeoBlockStatus | "ALL">("ALL");
  const [geoReason, setGeoReason] = useState<GeoBlockReason | "ALL">("ALL");
  const [geoCountryCode, setGeoCountryCode] = useState("");
  const [geoSearch, setGeoSearch] = useState("");
  const [geoPage, setGeoPage] = useState(1);

  const [newTakedownLegalCaseId, setNewTakedownLegalCaseId] = useState("");
  const [newTakedownTargetType, setNewTakedownTargetType] = useState("post");
  const [newTakedownTargetId, setNewTakedownTargetId] = useState("");
  const [newTakedownReason, setNewTakedownReason] = useState<TakedownReason>("COPYRIGHT");
  const [newTakedownNote, setNewTakedownNote] = useState("");

  const [newGeoTargetType, setNewGeoTargetType] = useState("stream");
  const [newGeoTargetId, setNewGeoTargetId] = useState("");
  const [newGeoCountryCode, setNewGeoCountryCode] = useState("IN");
  const [newGeoReason, setNewGeoReason] = useState<GeoBlockReason>("REGULATORY");
  const [newGeoNote, setNewGeoNote] = useState("");
  const [newGeoExpiresAt, setNewGeoExpiresAt] = useState("");

  const [takedownsNotice, setTakedownsNotice] = useState<TakedownsNoticeState | null>(null);
  const [geoBlocksNotice, setGeoBlocksNotice] = useState<TakedownsNoticeState | null>(null);
  const [takedownActionDialog, setTakedownActionDialog] = useState<TakedownActionDialogState | null>(null);
  const [geoBlockReasonDialog, setGeoBlockReasonDialog] = useState<GeoBlockReasonDialogState | null>(null);

  const takedownsQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "takedowns",
      takedownStatus,
      takedownReason,
      takedownSearch,
      takedownPage,
    ],
    queryFn: () =>
      listTakedowns({
        page: takedownPage,
        limit: 10,
        status: takedownStatus === "ALL" ? undefined : takedownStatus,
        reason: takedownReason === "ALL" ? undefined : takedownReason,
        search: takedownSearch.trim() || undefined,
      }),
  });

  const geoBlocksQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "geoblocks",
      geoStatus,
      geoReason,
      geoCountryCode,
      geoSearch,
      geoPage,
    ],
    queryFn: () =>
      listGeoBlocks({
        page: geoPage,
        limit: 10,
        status: geoStatus === "ALL" ? undefined : geoStatus,
        reason: geoReason === "ALL" ? undefined : geoReason,
        countryCode: geoCountryCode.trim() || undefined,
        search: geoSearch.trim() || undefined,
      }),
  });

  const createTakedownMutation = useMutation({
    mutationFn: createTakedown,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "takedowns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const takedownActionMutation = useMutation({
    mutationFn: (payload: {
      takedownId: string;
      action: TakedownAction;
      note?: string;
    }) =>
      applyTakedownAction(payload.takedownId, {
        action: payload.action,
        note: payload.note,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "takedowns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-case-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const createGeoBlockMutation = useMutation({
    mutationFn: createGeoBlock,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const updateGeoBlockMutation = useMutation({
    mutationFn: (payload: {
      geoBlockId: string;
      body: Parameters<typeof updateGeoBlock>[1];
    }) => updateGeoBlock(payload.geoBlockId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const removeGeoBlockMutation = useMutation({
    mutationFn: removeGeoBlock,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const takedownData =
    takedownsQuery.data && takedownsQuery.data.success ? takedownsQuery.data.data : null;
  const geoData =
    geoBlocksQuery.data && geoBlocksQuery.data.success ? geoBlocksQuery.data.data : null;

  const takedownError = getResponseErrorMessage(
    takedownsQuery.data,
    takedownsQuery.error,
    "Takedowns are unavailable.",
  );
  const geoError = getResponseErrorMessage(
    geoBlocksQuery.data,
    geoBlocksQuery.error,
    "Geo-blocks are unavailable.",
  );

  const openTakedownActionDialog = (
    takedown: TakedownListItem,
    action: TakedownAction,
  ) => {
    const requiresNote = action === "EXECUTE" || action === "REVERSE";
    const defaultNote = requiresNote
      ? action === "EXECUTE"
        ? "Legal action executed"
        : "Takedown reversed after review"
      : "";

    setTakedownActionDialog({
      takedown,
      action,
      note: defaultNote,
      error: null,
    });
  };

  const openGeoBlockReasonDialog = (geoBlock: GeoBlockRuleItem) => {
    setGeoBlockReasonDialog({
      geoBlock,
      reason: geoBlock.reason,
      error: null,
    });
  };

  const closeTakedownActionDialog = (open: boolean) => {
    if (!open && !takedownActionMutation.isPending) {
      setTakedownActionDialog(null);
    }
  };

  const closeGeoBlockReasonDialog = (open: boolean) => {
    if (!open && !updateGeoBlockMutation.isPending) {
      setGeoBlockReasonDialog(null);
    }
  };

  const handleCreateTakedown = async () => {
    setTakedownsNotice(null);

    const targetType = newTakedownTargetType.trim();
    const targetId = newTakedownTargetId.trim();

    const validationError = validateTakedownForm(targetType, targetId);

    if (validationError) {
      setTakedownsNotice({
        tone: "error",
        title: "Unable to create takedown",
        description: validationError,
      });
      return;
    }

    try {
      const response = await createTakedownMutation.mutateAsync({
        legalCaseId: newTakedownLegalCaseId.trim() || undefined,
        targetType,
        targetId,
        reason: newTakedownReason,
        note: newTakedownNote.trim() || undefined,
      });

      if (!response.success) {
        setTakedownsNotice({
          tone: "error",
          title: "Unable to create takedown",
          description: response.error,
        });
        return;
      }

      setNewTakedownLegalCaseId("");
      setNewTakedownTargetType("post");
      setNewTakedownTargetId("");
      setNewTakedownReason("COPYRIGHT");
      setNewTakedownNote("");
      setTakedownsNotice({
        tone: "success",
        title: "Takedown created",
        description: `Takedown request for ${targetType}:${targetId} has been created.`,
      });
    } catch (error) {
      setTakedownsNotice({
        tone: "error",
        title: "Unable to create takedown",
        description: getErrorMessage(
          error,
          "Something went wrong while creating the takedown.",
        ),
      });
    }
  };

  const handleConfirmTakedownAction = async () => {
    if (!takedownActionDialog) {
      return;
    }

    const validationError = validateTakedownAction(
      takedownActionDialog.action,
      takedownActionDialog.note,
    );

    if (validationError) {
      setTakedownActionDialog((current) =>
        current
          ? {
              ...current,
              error: validationError,
            }
          : current,
      );
      return;
    }

    try {
      const response = await takedownActionMutation.mutateAsync({
        takedownId: takedownActionDialog.takedown.id,
        action: takedownActionDialog.action,
        note: takedownActionDialog.note.trim() || undefined,
      });

      if (!response.success) {
        setTakedownActionDialog((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setTakedownActionDialog(null);
      setTakedownsNotice({
        tone: "success",
        title: "Takedown action applied",
        description: `${takedownActionDialog.action} action has been applied successfully.`,
      });
    } catch (error) {
      setTakedownActionDialog((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while applying the takedown action.",
              ),
            }
          : current,
      );
    }
  };

  const handleCreateGeoBlock = async () => {
    setGeoBlocksNotice(null);

    const targetType = newGeoTargetType.trim();
    const targetId = newGeoTargetId.trim();
    const countryCode = newGeoCountryCode.trim().toUpperCase();

    const validationError = validateGeoBlockForm(targetType, targetId, countryCode);

    if (validationError) {
      setGeoBlocksNotice({
        tone: "error",
        title: "Unable to create geo-block",
        description: validationError,
      });
      return;
    }

    try {
      const response = await createGeoBlockMutation.mutateAsync({
        targetType,
        targetId,
        countryCode,
        reason: newGeoReason,
        note: newGeoNote.trim() || undefined,
        expiresAt: toIsoDateTime(newGeoExpiresAt),
      });

      if (!response.success) {
        setGeoBlocksNotice({
          tone: "error",
          title: "Unable to create geo-block",
          description: response.error,
        });
        return;
      }

      setNewGeoTargetType("stream");
      setNewGeoTargetId("");
      setNewGeoCountryCode("IN");
      setNewGeoReason("REGULATORY");
      setNewGeoNote("");
      setNewGeoExpiresAt("");
      setGeoBlocksNotice({
        tone: "success",
        title: "Geo-block created",
        description: `Geo-block rule for ${targetType}:${targetId} in ${countryCode} has been created.`,
      });
    } catch (error) {
      setGeoBlocksNotice({
        tone: "error",
        title: "Unable to create geo-block",
        description: getErrorMessage(
          error,
          "Something went wrong while creating the geo-block.",
        ),
      });
    }
  };

  const handleToggleGeoBlockStatus = async (
    geoBlockId: string,
    status: GeoBlockStatus,
  ) => {
    setGeoBlocksNotice(null);

    const nextStatus: GeoBlockStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    try {
      const response = await updateGeoBlockMutation.mutateAsync({
        geoBlockId,
        body: {
          status: nextStatus,
        },
      });

      if (!response.success) {
        setGeoBlocksNotice({
          tone: "error",
          title: "Unable to update geo-block",
          description: response.error,
        });
        return;
      }

      setGeoBlocksNotice({
        tone: "success",
        title: "Geo-block updated",
        description: `Geo-block has been ${nextStatus === "ACTIVE" ? "activated" : "disabled"}.`,
      });
    } catch (error) {
      setGeoBlocksNotice({
        tone: "error",
        title: "Unable to update geo-block",
        description: getErrorMessage(
          error,
          "Something went wrong while updating the geo-block.",
        ),
      });
    }
  };

  const handleConfirmGeoBlockReasonChange = async () => {
    if (!geoBlockReasonDialog) {
      return;
    }

    const validationError = validateGeoBlockReason(geoBlockReasonDialog.reason);

    if (validationError) {
      setGeoBlockReasonDialog((current) =>
        current
          ? {
              ...current,
              error: validationError,
            }
          : current,
      );
      return;
    }

    try {
      const response = await updateGeoBlockMutation.mutateAsync({
        geoBlockId: geoBlockReasonDialog.geoBlock.id,
        body: {
          reason: geoBlockReasonDialog.reason.toUpperCase() as GeoBlockReason,
        },
      });

      if (!response.success) {
        setGeoBlockReasonDialog((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setGeoBlockReasonDialog(null);
      setGeoBlocksNotice({
        tone: "success",
        title: "Geo-block reason updated",
        description: "Geo-block reason has been updated successfully.",
      });
    } catch (error) {
      setGeoBlockReasonDialog((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while updating the geo-block reason.",
              ),
            }
          : current,
      );
    }
  };

  const handleRemoveGeoBlock = async (geoBlockId: string) => {
    setGeoBlocksNotice(null);

    try {
      const response = await removeGeoBlockMutation.mutateAsync(geoBlockId);

      if (!response.success) {
        setGeoBlocksNotice({
          tone: "error",
          title: "Unable to remove geo-block",
          description: response.error,
        });
        return;
      }

      setGeoBlocksNotice({
        tone: "success",
        title: "Geo-block removed",
        description: "Geo-block rule has been removed successfully.",
      });
    } catch (error) {
      setGeoBlocksNotice({
        tone: "error",
        title: "Unable to remove geo-block",
        description: getErrorMessage(
          error,
          "Something went wrong while removing the geo-block.",
        ),
      });
    }
  };

  return {
    takedownsSection: {
      takedownStatus,
      takedownReason,
      takedownSearch,
      takedownPage,
      rows: takedownData?.items ?? [],
      pagination: takedownData?.pagination,
      isLoading: takedownsQuery.isLoading,
      isSubmitting: takedownActionMutation.isPending,
      errorMessage: takedownError,
      notice: takedownsNotice,
      onStatusChange: (value: TakedownStatus | "ALL") => {
        setTakedownPage(1);
        setTakedownStatus(value);
      },
      onReasonChange: (value: TakedownReason | "ALL") => {
        setTakedownPage(1);
        setTakedownReason(value);
      },
      onSearchChange: (value: string) => {
        setTakedownPage(1);
        setTakedownSearch(value);
      },
      onPreviousPage: () =>
        setTakedownPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setTakedownPage((current) =>
          Math.min(current + 1, takedownData?.pagination.totalPages ?? 1),
        ),
      onAction: openTakedownActionDialog,
      onRefresh: () => {
        void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "takedowns"] });
      },
    },
    takedownCreateSection: {
      newTakedownLegalCaseId,
      newTakedownTargetType,
      newTakedownTargetId,
      newTakedownReason,
      newTakedownNote,
      isSubmitting: createTakedownMutation.isPending,
      onLegalCaseIdChange: setNewTakedownLegalCaseId,
      onTargetTypeChange: setNewTakedownTargetType,
      onTargetIdChange: setNewTakedownTargetId,
      onReasonChange: setNewTakedownReason,
      onNoteChange: setNewTakedownNote,
      onSubmit: handleCreateTakedown,
    },
    geoBlocksSection: {
      geoStatus,
      geoReason,
      geoCountryCode,
      geoSearch,
      geoPage,
      rows: geoData?.items ?? [],
      pagination: geoData?.pagination,
      isLoading: geoBlocksQuery.isLoading,
      isSubmitting:
        updateGeoBlockMutation.isPending || removeGeoBlockMutation.isPending,
      errorMessage: geoError,
      notice: geoBlocksNotice,
      onStatusChange: (value: GeoBlockStatus | "ALL") => {
        setGeoPage(1);
        setGeoStatus(value);
      },
      onReasonChange: (value: GeoBlockReason | "ALL") => {
        setGeoPage(1);
        setGeoReason(value);
      },
      onCountryCodeChange: (value: string) => {
        setGeoPage(1);
        setGeoCountryCode(value.toUpperCase());
      },
      onSearchChange: (value: string) => {
        setGeoPage(1);
        setGeoSearch(value);
      },
      onPreviousPage: () => setGeoPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setGeoPage((current) =>
          Math.min(current + 1, geoData?.pagination.totalPages ?? 1),
        ),
      onToggleStatus: handleToggleGeoBlockStatus,
      onEditReason: openGeoBlockReasonDialog,
      onRemove: handleRemoveGeoBlock,
      onRefresh: () => {
        void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      },
    },
    geoBlockCreateSection: {
      newGeoTargetType,
      newGeoTargetId,
      newGeoCountryCode,
      newGeoReason,
      newGeoNote,
      newGeoExpiresAt,
      isSubmitting: createGeoBlockMutation.isPending,
      onTargetTypeChange: setNewGeoTargetType,
      onTargetIdChange: setNewGeoTargetId,
      onCountryCodeChange: (value: string) =>
        setNewGeoCountryCode(value.toUpperCase()),
      onReasonChange: setNewGeoReason,
      onNoteChange: setNewGeoNote,
      onExpiresAtChange: setNewGeoExpiresAt,
      onSubmit: handleCreateGeoBlock,
    },
    takedownActionDialog: {
      dialog: takedownActionDialog,
      isPending: takedownActionMutation.isPending,
      onOpenChange: closeTakedownActionDialog,
      onNoteChange: (value: string) =>
        setTakedownActionDialog((current) =>
          current
            ? {
                ...current,
                note: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmTakedownAction,
    },
    geoBlockReasonDialog: {
      dialog: geoBlockReasonDialog,
      isPending: updateGeoBlockMutation.isPending,
      onOpenChange: closeGeoBlockReasonDialog,
      onReasonChange: (value: string) =>
        setGeoBlockReasonDialog((current) =>
          current
            ? {
                ...current,
                reason: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmGeoBlockReasonChange,
    },
  };
}
