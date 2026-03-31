import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAnnouncement,
  deleteAnnouncement,
  getSystemSettingHistory,
  listAnnouncements,
  listSystemSettings,
  rollbackSystemSetting,
  updateAnnouncement,
  updateSystemSetting,
  type AnnouncementItem,
  type SystemSettingItem,
  type SystemSettingVersionItem,
} from "@/lib/admin-api";

import type {
  ActiveFilter,
  AnnouncementTypeFilter,
  RoleFilter,
  VisibilityFilter,
} from "./constants";
import type {
  AnnouncementEditDialogState,
  SettingEditDialogState,
  SettingRollbackDialogState,
  SettingsNoticeState,
} from "./types";
import {
  getErrorMessage,
  getResponseErrorMessage,
  toIsoDateTime,
  validateAnnouncementForm,
  validateRollbackReason,
  validateSettingForm,
} from "./utils";

export function useSettingsAnnouncementsPageController() {
  const queryClient = useQueryClient();

  const [settingsSearch, setSettingsSearch] = useState("");
  const [settingsVisibility, setSettingsVisibility] =
    useState<VisibilityFilter>("ALL");
  const [settingsPage, setSettingsPage] = useState(1);
  const [selectedSettingKey, setSelectedSettingKey] = useState<string | null>(
    null,
  );

  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingReason, setNewSettingReason] = useState("");
  const [newSettingIsPublic, setNewSettingIsPublic] = useState(false);

  const [announcementsSearch, setAnnouncementsSearch] = useState("");
  const [announcementsType, setAnnouncementsType] =
    useState<AnnouncementTypeFilter>("ALL");
  const [announcementsActive, setAnnouncementsActive] =
    useState<ActiveFilter>("ALL");
  const [announcementsPage, setAnnouncementsPage] = useState(1);

  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementType, setNewAnnouncementType] = useState("INFO");
  const [newAnnouncementRole, setNewAnnouncementRole] =
    useState<RoleFilter>("ALL");
  const [newAnnouncementStartsAt, setNewAnnouncementStartsAt] = useState("");
  const [newAnnouncementEndsAt, setNewAnnouncementEndsAt] = useState("");
  const [newAnnouncementIsActive, setNewAnnouncementIsActive] = useState(true);
  const [newAnnouncementIsPinned, setNewAnnouncementIsPinned] = useState(false);

  const [settingsNotice, setSettingsNotice] =
    useState<SettingsNoticeState | null>(null);
  const [announcementsNotice, setAnnouncementsNotice] =
    useState<SettingsNoticeState | null>(null);
  const [settingEditDialog, setSettingEditDialog] =
    useState<SettingEditDialogState | null>(null);
  const [settingRollbackDialog, setSettingRollbackDialog] =
    useState<SettingRollbackDialogState | null>(null);
  const [announcementEditDialog, setAnnouncementEditDialog] =
    useState<AnnouncementEditDialogState | null>(null);
  const [announcementDeleteDialog, setAnnouncementDeleteDialog] = useState<{
    isOpen: boolean;
    announcementId: string | null;
    title: string;
  }>({
    isOpen: false,
    announcementId: null,
    title: "",
  });

  const settingsQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "settings",
      settingsSearch,
      settingsVisibility,
      settingsPage,
    ],
    queryFn: () =>
      listSystemSettings({
        page: settingsPage,
        limit: 10,
        search: settingsSearch.trim() || undefined,
        includePublic:
          settingsVisibility === "ALL"
            ? undefined
            : settingsVisibility === "PUBLIC"
              ? true
              : false,
      }),
  });

  const settingHistoryQuery = useQuery({
    queryKey: ["admin", "phase6", "settings-history", selectedSettingKey],
    queryFn: () => getSystemSettingHistory(selectedSettingKey as string),
    enabled: Boolean(selectedSettingKey),
  });

  const announcementsQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "announcements",
      announcementsSearch,
      announcementsType,
      announcementsActive,
      announcementsPage,
    ],
    queryFn: () =>
      listAnnouncements({
        page: announcementsPage,
        limit: 10,
        search: announcementsSearch.trim() || undefined,
        type: announcementsType === "ALL" ? undefined : announcementsType,
        isActive:
          announcementsActive === "ALL"
            ? undefined
            : announcementsActive === "ACTIVE"
              ? true
              : false,
      }),
  });

  const updateSettingMutation = useMutation({
    mutationFn: (payload: {
      settingKey: string;
      body: Parameters<typeof updateSystemSetting>[1];
    }) => updateSystemSetting(payload.settingKey, payload.body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "settings"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "settings-history"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "audit-history"],
      });
      setSelectedSettingKey(variables.settingKey);
    },
  });

  const rollbackSettingMutation = useMutation({
    mutationFn: rollbackSystemSetting,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "settings"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "settings-history"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "audit-history"],
      });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "announcements"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "audit-history"],
      });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: (payload: {
      announcementId: string;
      body: Parameters<typeof updateAnnouncement>[1];
    }) => updateAnnouncement(payload.announcementId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "announcements"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "audit-history"],
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "announcements"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "phase6", "audit-history"],
      });
    },
  });

  const settingsData =
    settingsQuery.data && settingsQuery.data.success
      ? settingsQuery.data.data
      : null;
  const settingsHistoryData =
    settingHistoryQuery.data && settingHistoryQuery.data.success
      ? settingHistoryQuery.data.data.items
      : [];
  const announcementsData =
    announcementsQuery.data && announcementsQuery.data.success
      ? announcementsQuery.data.data
      : null;

  const settingsError = getResponseErrorMessage(
    settingsQuery.data,
    settingsQuery.error,
    "Settings are unavailable.",
  );
  const settingsHistoryError = getResponseErrorMessage(
    settingHistoryQuery.data,
    settingHistoryQuery.error,
    "Setting history is unavailable.",
  );
  const announcementsError = getResponseErrorMessage(
    announcementsQuery.data,
    announcementsQuery.error,
    "Announcements are unavailable.",
  );

  const openSettingEditDialog = (setting: SystemSettingItem) => {
    setSettingEditDialog({
      setting,
      value: setting.value,
      isPublic: setting.isPublic,
      reason: "Updated setting from admin panel",
      error: null,
    });
  };

  const openSettingRollbackDialog = (version: SystemSettingVersionItem) => {
    setSettingRollbackDialog({
      version,
      reason: "Rollback requested by compliance admin",
      error: null,
    });
  };

  const openAnnouncementEditDialog = (announcement: AnnouncementItem) => {
    setAnnouncementEditDialog({
      announcement,
      title: announcement.title,
      content: announcement.content,
      error: null,
    });
  };

  const closeSettingEditDialog = (open: boolean) => {
    if (!open && !updateSettingMutation.isPending) {
      setSettingEditDialog(null);
    }
  };

  const closeSettingRollbackDialog = (open: boolean) => {
    if (!open && !rollbackSettingMutation.isPending) {
      setSettingRollbackDialog(null);
    }
  };

  const closeAnnouncementEditDialog = (open: boolean) => {
    if (!open && !updateAnnouncementMutation.isPending) {
      setAnnouncementEditDialog(null);
    }
  };

  const handleCreateOrUpdateSetting = async () => {
    setSettingsNotice(null);

    const settingKey = newSettingKey.trim();
    const value = newSettingValue;
    const reason = newSettingReason.trim();

    const validationError = validateSettingForm(settingKey, value, reason);

    if (validationError) {
      setSettingsNotice({
        tone: "error",
        title: "Unable to save setting",
        description: validationError,
      });
      return;
    }

    try {
      const response = await updateSettingMutation.mutateAsync({
        settingKey,
        body: {
          value,
          isPublic: newSettingIsPublic,
          reason,
        },
      });

      if (!response.success) {
        setSettingsNotice({
          tone: "error",
          title: "Unable to save setting",
          description: response.error,
        });
        return;
      }

      setSelectedSettingKey(settingKey);
      setNewSettingKey("");
      setNewSettingValue("");
      setNewSettingReason("");
      setNewSettingIsPublic(false);
      setSettingsNotice({
        tone: "success",
        title: "Setting saved",
        description: `${settingKey} has been updated successfully.`,
      });
    } catch (error) {
      setSettingsNotice({
        tone: "error",
        title: "Unable to save setting",
        description: getErrorMessage(
          error,
          "Something went wrong while saving the setting.",
        ),
      });
    }
  };

  const handleConfirmSettingEdit = async () => {
    if (!settingEditDialog) {
      return;
    }

    const validationError = validateSettingForm(
      settingEditDialog.setting.key,
      settingEditDialog.value,
      settingEditDialog.reason,
    );

    if (validationError) {
      setSettingEditDialog((current) =>
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
      const response = await updateSettingMutation.mutateAsync({
        settingKey: settingEditDialog.setting.key,
        body: {
          value: settingEditDialog.value,
          isPublic: settingEditDialog.isPublic,
          reason: settingEditDialog.reason.trim(),
        },
      });

      if (!response.success) {
        setSettingEditDialog((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setSelectedSettingKey(settingEditDialog.setting.key);
      setSettingEditDialog(null);
      setSettingsNotice({
        tone: "success",
        title: "Setting updated",
        description: `${settingEditDialog.setting.key} has been updated successfully.`,
      });
    } catch (error) {
      setSettingEditDialog((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while updating the setting.",
              ),
            }
          : current,
      );
    }
  };

  const handleConfirmSettingRollback = async () => {
    if (!settingRollbackDialog) {
      return;
    }

    const validationError = validateRollbackReason(
      settingRollbackDialog.reason,
    );

    if (validationError) {
      setSettingRollbackDialog((current) =>
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
      const response = await rollbackSettingMutation.mutateAsync({
        versionId: settingRollbackDialog.version.id,
        reason: settingRollbackDialog.reason.trim(),
      });

      if (!response.success) {
        setSettingRollbackDialog((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setSettingRollbackDialog(null);
      setSettingsNotice({
        tone: "success",
        title: "Setting rolled back",
        description: `${settingRollbackDialog.version.settingKey} has been rolled back to a previous version.`,
      });
    } catch (error) {
      setSettingRollbackDialog((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while rolling back the setting.",
              ),
            }
          : current,
      );
    }
  };

  const handleCreateAnnouncement = async () => {
    setAnnouncementsNotice(null);

    const title = newAnnouncementTitle.trim();
    const content = newAnnouncementContent.trim();

    const validationError = validateAnnouncementForm(title, content);

    if (validationError) {
      setAnnouncementsNotice({
        tone: "error",
        title: "Unable to create announcement",
        description: validationError,
      });
      return;
    }

    try {
      const response = await createAnnouncementMutation.mutateAsync({
        title,
        content,
        type: newAnnouncementType as any,
        isActive: newAnnouncementIsActive,
        startsAt: toIsoDateTime(newAnnouncementStartsAt),
        endsAt: toIsoDateTime(newAnnouncementEndsAt),
        targetRole: newAnnouncementRole === "ALL" ? null : newAnnouncementRole,
        isPinned: newAnnouncementIsPinned,
      });

      if (!response.success) {
        setAnnouncementsNotice({
          tone: "error",
          title: "Unable to create announcement",
          description: response.error,
        });
        return;
      }

      setNewAnnouncementTitle("");
      setNewAnnouncementContent("");
      setNewAnnouncementType("INFO");
      setNewAnnouncementRole("ALL");
      setNewAnnouncementStartsAt("");
      setNewAnnouncementEndsAt("");
      setNewAnnouncementIsActive(true);
      setNewAnnouncementIsPinned(false);
      setAnnouncementsNotice({
        tone: "success",
        title: "Announcement created",
        description: `${title} has been created successfully.`,
      });
    } catch (error) {
      setAnnouncementsNotice({
        tone: "error",
        title: "Unable to create announcement",
        description: getErrorMessage(
          error,
          "Something went wrong while creating the announcement.",
        ),
      });
    }
  };

  const handleConfirmAnnouncementEdit = async () => {
    if (!announcementEditDialog) {
      return;
    }

    const validationError = validateAnnouncementForm(
      announcementEditDialog.title,
      announcementEditDialog.content,
    );

    if (validationError) {
      setAnnouncementEditDialog((current) =>
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
      const response = await updateAnnouncementMutation.mutateAsync({
        announcementId: announcementEditDialog.announcement.id,
        body: {
          title: announcementEditDialog.title.trim(),
          content: announcementEditDialog.content.trim(),
        },
      });

      if (!response.success) {
        setAnnouncementEditDialog((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setAnnouncementEditDialog(null);
      setAnnouncementsNotice({
        tone: "success",
        title: "Announcement updated",
        description: `${announcementEditDialog.title} has been updated successfully.`,
      });
    } catch (error) {
      setAnnouncementEditDialog((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while updating the announcement.",
              ),
            }
          : current,
      );
    }
  };

  const handleToggleAnnouncementActive = async (
    announcementId: string,
    nextValue: boolean,
  ) => {
    setAnnouncementsNotice(null);

    try {
      const response = await updateAnnouncementMutation.mutateAsync({
        announcementId,
        body: {
          isActive: nextValue,
        },
      });

      if (!response.success) {
        setAnnouncementsNotice({
          tone: "error",
          title: "Unable to update announcement",
          description: response.error,
        });
        return;
      }

      setAnnouncementsNotice({
        tone: "success",
        title: "Announcement updated",
        description: `Announcement has been ${nextValue ? "activated" : "deactivated"}.`,
      });
    } catch (error) {
      setAnnouncementsNotice({
        tone: "error",
        title: "Unable to update announcement",
        description: getErrorMessage(
          error,
          "Something went wrong while updating the announcement.",
        ),
      });
    }
  };

  const handleToggleAnnouncementPinned = async (
    announcementId: string,
    nextValue: boolean,
  ) => {
    setAnnouncementsNotice(null);

    try {
      const response = await updateAnnouncementMutation.mutateAsync({
        announcementId,
        body: {
          isPinned: nextValue,
        },
      });

      if (!response.success) {
        setAnnouncementsNotice({
          tone: "error",
          title: "Unable to update announcement",
          description: response.error,
        });
        return;
      }

      setAnnouncementsNotice({
        tone: "success",
        title: "Announcement updated",
        description: `Announcement has been ${nextValue ? "pinned" : "unpinned"}.`,
      });
    } catch (error) {
      setAnnouncementsNotice({
        tone: "error",
        title: "Unable to update announcement",
        description: getErrorMessage(
          error,
          "Something went wrong while updating the announcement.",
        ),
      });
    }
  };

  const handleOpenDeleteDialog = (announcementId: string, title: string) => {
    setAnnouncementDeleteDialog({
      isOpen: true,
      announcementId,
      title,
    });
  };

  const handleCloseDeleteDialog = () => {
    setAnnouncementDeleteDialog({
      isOpen: false,
      announcementId: null,
      title: "",
    });
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementDeleteDialog.announcementId) return;

    setAnnouncementsNotice(null);

    try {
      const response = await deleteAnnouncementMutation.mutateAsync(
        announcementDeleteDialog.announcementId,
      );

      if (!response.success) {
        setAnnouncementsNotice({
          tone: "error",
          title: "Unable to delete announcement",
          description: response.error,
        });
        handleCloseDeleteDialog();
        return;
      }

      setAnnouncementsNotice({
        tone: "success",
        title: "Announcement deleted",
        description: "Announcement has been deleted successfully.",
      });
      handleCloseDeleteDialog();
    } catch (error) {
      setAnnouncementsNotice({
        tone: "error",
        title: "Unable to delete announcement",
        description: getErrorMessage(
          error,
          "Something went wrong while deleting the announcement.",
        ),
      });
      handleCloseDeleteDialog();
    }
  };

  return {
    settingsSection: {
      settingsSearch,
      settingsVisibility,
      settingsPage,
      selectedSettingKey,
      rows: settingsData?.items ?? [],
      pagination: settingsData?.pagination,
      isLoading: settingsQuery.isLoading,
      errorMessage: settingsError,
      notice: settingsNotice,
      onSearchChange: (value: string) => {
        setSettingsPage(1);
        setSettingsSearch(value);
      },
      onVisibilityChange: (value: VisibilityFilter) => {
        setSettingsPage(1);
        setSettingsVisibility(value);
      },
      onPreviousPage: () =>
        setSettingsPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setSettingsPage((current) =>
          Math.min(current + 1, settingsData?.pagination.totalPages ?? 1),
        ),
      onSelectSetting: setSelectedSettingKey,
      onEditSetting: openSettingEditDialog,
      onRefresh: () => {
        void queryClient.invalidateQueries({
          queryKey: ["admin", "phase6", "settings"],
        });
      },
    },
    settingCreateSection: {
      newSettingKey,
      newSettingValue,
      newSettingReason,
      newSettingIsPublic,
      isSubmitting: updateSettingMutation.isPending,
      onKeyChange: setNewSettingKey,
      onValueChange: setNewSettingValue,
      onReasonChange: setNewSettingReason,
      onIsPublicChange: setNewSettingIsPublic,
      onSubmit: handleCreateOrUpdateSetting,
    },
    settingHistorySection: {
      selectedSettingKey,
      historyItems: settingsHistoryData,
      isLoading: settingHistoryQuery.isLoading,
      errorMessage: settingsHistoryError,
      onRollback: openSettingRollbackDialog,
    },
    announcementsSection: {
      announcementsSearch,
      announcementsType,
      announcementsActive,
      announcementsPage,
      rows: announcementsData?.items ?? [],
      pagination: announcementsData?.pagination,
      isLoading: announcementsQuery.isLoading,
      isSubmitting:
        updateAnnouncementMutation.isPending ||
        deleteAnnouncementMutation.isPending,
      errorMessage: announcementsError,
      notice: announcementsNotice,
      onSearchChange: (value: string) => {
        setAnnouncementsPage(1);
        setAnnouncementsSearch(value);
      },
      onTypeChange: (value: AnnouncementTypeFilter) => {
        setAnnouncementsPage(1);
        setAnnouncementsType(value);
      },
      onActiveChange: (value: ActiveFilter) => {
        setAnnouncementsPage(1);
        setAnnouncementsActive(value);
      },
      onPreviousPage: () =>
        setAnnouncementsPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setAnnouncementsPage((current) =>
          Math.min(current + 1, announcementsData?.pagination.totalPages ?? 1),
        ),
      onEdit: openAnnouncementEditDialog,
      onToggleActive: handleToggleAnnouncementActive,
      onTogglePinned: handleToggleAnnouncementPinned,
      onDelete: handleOpenDeleteDialog,
      onRefresh: () => {
        void queryClient.invalidateQueries({
          queryKey: ["admin", "phase6", "announcements"],
        });
      },
    },
    announcementCreateSection: {
      newAnnouncementTitle,
      newAnnouncementContent,
      newAnnouncementType,
      newAnnouncementRole,
      newAnnouncementStartsAt,
      newAnnouncementEndsAt,
      newAnnouncementIsActive,
      newAnnouncementIsPinned,
      isSubmitting: createAnnouncementMutation.isPending,
      onTitleChange: setNewAnnouncementTitle,
      onContentChange: setNewAnnouncementContent,
      onTypeChange: setNewAnnouncementType,
      onRoleChange: setNewAnnouncementRole,
      onStartsAtChange: setNewAnnouncementStartsAt,
      onEndsAtChange: setNewAnnouncementEndsAt,
      onIsActiveChange: setNewAnnouncementIsActive,
      onIsPinnedChange: setNewAnnouncementIsPinned,
      onSubmit: handleCreateAnnouncement,
    },
    settingEditDialog: {
      dialog: settingEditDialog,
      isPending: updateSettingMutation.isPending,
      onOpenChange: closeSettingEditDialog,
      onValueChange: (value: string) =>
        setSettingEditDialog((current) =>
          current
            ? {
                ...current,
                value,
                error: null,
              }
            : current,
        ),
      onIsPublicChange: (value: boolean) =>
        setSettingEditDialog((current) =>
          current
            ? {
                ...current,
                isPublic: value,
                error: null,
              }
            : current,
        ),
      onReasonChange: (value: string) =>
        setSettingEditDialog((current) =>
          current
            ? {
                ...current,
                reason: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmSettingEdit,
    },
    settingRollbackDialog: {
      dialog: settingRollbackDialog,
      isPending: rollbackSettingMutation.isPending,
      onOpenChange: closeSettingRollbackDialog,
      onReasonChange: (value: string) =>
        setSettingRollbackDialog((current) =>
          current
            ? {
                ...current,
                reason: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmSettingRollback,
    },
    announcementEditDialog: {
      dialog: announcementEditDialog,
      isPending: updateAnnouncementMutation.isPending,
      onOpenChange: closeAnnouncementEditDialog,
      onTitleChange: (value: string) =>
        setAnnouncementEditDialog((current) =>
          current
            ? {
                ...current,
                title: value,
                error: null,
              }
            : current,
        ),
      onContentChange: (value: string) =>
        setAnnouncementEditDialog((current) =>
          current
            ? {
                ...current,
                content: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmAnnouncementEdit,
    },
    announcementDeleteDialog: {
      isOpen: announcementDeleteDialog.isOpen,
      title: announcementDeleteDialog.title,
      isPending: deleteAnnouncementMutation.isPending,
      onClose: handleCloseDeleteDialog,
      onConfirm: handleDeleteAnnouncement,
    },
  };
}
