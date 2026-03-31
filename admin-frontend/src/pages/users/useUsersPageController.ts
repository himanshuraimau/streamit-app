import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUserDetail,
  listAdminUsers,
  updateAdminUserSuspension,
} from "../../lib/admin-api";
import type { UserListItem, SuspensionDialogState } from "./types";

export function useUsersPageController() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | UserListItem["role"]>("ALL");
  const [suspensionFilter, setSuspensionFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [suspensionDialog, setSuspensionDialog] = useState<SuspensionDialogState>({
    isOpen: false,
    userId: null,
    currentlySuspended: false,
  });

  const listQuery = useQuery({
    queryKey: ["admin", "users", page, search, role, suspensionFilter],
    queryFn: () =>
      listAdminUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: role === "ALL" ? undefined : role,
        isSuspended: suspensionFilter === "ALL" ? undefined : suspensionFilter === "SUSPENDED",
      }),
  });

  const users = listQuery.data && listQuery.data.success ? listQuery.data.data.items : [];
  const pagination =
    listQuery.data && listQuery.data.success
      ? listQuery.data.data.pagination
      : { page: 1, limit: 15, total: 0, totalPages: 1 };

  const selectedId = selectedUserId ?? users[0]?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ["admin", "user-detail", selectedId],
    queryFn: () => getAdminUserDetail(selectedId ?? ""),
    enabled: Boolean(selectedId),
  });

  const selectedDetail =
    detailQuery.data && detailQuery.data.success ? detailQuery.data.data : null;

  const updateSuspensionMutation = useMutation({
    mutationFn: (payload: { userId: string; isSuspended: boolean; reason?: string }) =>
      updateAdminUserSuspension(payload.userId, {
        isSuspended: payload.isSuspended,
        reason: payload.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "summary"] });
    },
  });

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const handleRoleChange = (value: "ALL" | UserListItem["role"]) => {
    setPage(1);
    setRole(value);
  };

  const handleSuspensionFilterChange = (value: "ALL" | "ACTIVE" | "SUSPENDED") => {
    setPage(1);
    setSuspensionFilter(value);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleOpenSuspensionDialog = (userId: string, currentlySuspended: boolean) => {
    setSuspensionDialog({ isOpen: true, userId, currentlySuspended });
  };

  const handleCloseSuspensionDialog = () => {
    setSuspensionDialog({ isOpen: false, userId: null, currentlySuspended: false });
  };

  const handleToggleSuspension = async (reason?: string) => {
    if (!suspensionDialog.userId) return { success: false, error: "No user selected" };

    const nextState = !suspensionDialog.currentlySuspended;

    if (nextState && (!reason || reason.trim().length < 3)) {
      return { success: false, error: "Suspension reason is required (min 3 characters)." };
    }

    const response = await updateSuspensionMutation.mutateAsync({
      userId: suspensionDialog.userId,
      isSuspended: nextState,
      reason: reason?.trim(),
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    handleCloseSuspensionDialog();
    return { success: true };
  };

  return {
    // Filters and pagination
    page,
    setPage,
    search,
    role,
    suspensionFilter,
    handleSearchChange,
    handleRoleChange,
    handleSuspensionFilterChange,
    handleRefresh,

    // Queries
    listQuery,
    detailQuery,
    users,
    pagination,

    // Selected user
    selectedId,
    selectedUserId,
    setSelectedUserId,
    selectedDetail,

    // Mutations
    updateSuspensionMutation,

    // Suspension dialog
    suspensionDialog,
    handleOpenSuspensionDialog,
    handleCloseSuspensionDialog,
    handleToggleSuspension,
  };
}
