import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminPermissions, updateAdminPermissions } from "../../lib/admin-api";
import type { AdminPermissionItem, RoleFilter, ScopeDraft } from "./types";
import { normalizeDraft, sortUnique } from "./utils";

export function usePermissionsPageController() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, ScopeDraft>>({});
  const [savingAdminId, setSavingAdminId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const permissionsQuery = useQuery({
    queryKey: ["admin", "phase6", "permissions", search, roleFilter, page],
    queryFn: () =>
      listAdminPermissions({
        page,
        limit: 12,
        search: search.trim() || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter,
      }),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (payload: {
      adminId: string;
      body: Parameters<typeof updateAdminPermissions>[1];
    }) => updateAdminPermissions(payload.adminId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const handleRoleFilterChange = (value: RoleFilter) => {
    setPage(1);
    setRoleFilter(value);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "permissions"] });
  };

  const updateDraft = (
    item: AdminPermissionItem,
    updater: (current: ScopeDraft) => ScopeDraft,
  ) => {
    setDrafts((prev) => {
      const current = normalizeDraft(item, prev[item.admin.id]);
      return {
        ...prev,
        [item.admin.id]: updater(current),
      };
    });
  };

  const handleToggleAnalyticsScope = (
    item: AdminPermissionItem,
    scope: string,
  ) => {
    updateDraft(item, (current) => {
      const hasScope = current.analyticsScopes.includes(scope as any);
      const nextScopes = hasScope
        ? current.analyticsScopes.filter((value) => value !== scope)
        : [...current.analyticsScopes, scope as any];

      return {
        ...current,
        analyticsScopes: sortUnique(nextScopes),
      };
    });
  };

  const handleToggleComplianceScope = (
    item: AdminPermissionItem,
    scope: string,
  ) => {
    updateDraft(item, (current) => {
      const hasScope = current.complianceScopes.includes(scope as any);
      const nextScopes = hasScope
        ? current.complianceScopes.filter((value) => value !== scope)
        : [...current.complianceScopes, scope as any];

      return {
        ...current,
        complianceScopes: sortUnique(nextScopes),
      };
    });
  };

  const handleReasonChange = (item: AdminPermissionItem, reason: string) => {
    updateDraft(item, (current) => ({
      ...current,
      reason,
    }));
  };

  const handleSaveScopes = async (item: AdminPermissionItem) => {
    setValidationError(null);
    const draft = normalizeDraft(item, drafts[item.admin.id]);

    if (!draft.analyticsScopes.length) {
      setValidationError("At least one analytics scope is required.");
      return { success: false };
    }

    if (!draft.complianceScopes.length) {
      setValidationError("At least one compliance scope is required.");
      return { success: false };
    }

    if (draft.reason.trim().length < 3) {
      setValidationError("Reason must be at least 3 characters.");
      return { success: false };
    }

    setSavingAdminId(item.admin.id);

    try {
      const response = await updatePermissionsMutation.mutateAsync({
        adminId: item.admin.id,
        body: {
          analyticsScopes: draft.analyticsScopes,
          complianceScopes: draft.complianceScopes,
          reason: draft.reason.trim(),
        },
      });

      if (!response.success) {
        setValidationError(response.error);
        return { success: false };
      }

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.admin.id];
        return next;
      });

      return { success: true };
    } finally {
      setSavingAdminId(null);
    }
  };

  return {
    // Filters and pagination
    search,
    roleFilter,
    page,
    setPage,
    handleSearchChange,
    handleRoleFilterChange,
    handleRefresh,

    // Query
    permissionsQuery,

    // Mutations
    updatePermissionsMutation,

    // Drafts
    drafts,
    savingAdminId,
    validationError,
    setValidationError,

    // Actions
    handleToggleAnalyticsScope,
    handleToggleComplianceScope,
    handleReasonChange,
    handleSaveScopes,
  };
}
