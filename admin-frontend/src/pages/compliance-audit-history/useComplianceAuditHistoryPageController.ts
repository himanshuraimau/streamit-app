import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadComplianceAuditExport,
  generateComplianceAuditExport,
  listComplianceAuditHistory,
} from "../../lib/admin-api";
import type { ComplianceAuditExportTokenResult } from "./types";
import { toIsoDateTime } from "./utils";

export function useComplianceAuditHistoryPageController() {
  const queryClient = useQueryClient();

  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportExpiryMinutes, setExportExpiryMinutes] = useState(30);
  const [lastExportToken, setLastExportToken] =
    useState<ComplianceAuditExportTokenResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const auditHistoryQuery = useQuery({
    queryKey: ["admin", "phase6", "audit-history", actionFilter, targetTypeFilter, search, page],
    queryFn: () =>
      listComplianceAuditHistory({
        page,
        limit: 20,
        action: actionFilter.trim() || undefined,
        targetType: targetTypeFilter.trim() || undefined,
        search: search.trim() || undefined,
      }),
  });

  const generateExportMutation = useMutation({
    mutationFn: generateComplianceAuditExport,
    onSuccess: (response) => {
      if (response.success) {
        setLastExportToken(response.data);
      }
    },
  });

  const downloadExportMutation = useMutation({
    mutationFn: downloadComplianceAuditExport,
  });

  const handleActionFilterChange = (value: string) => {
    setPage(1);
    setActionFilter(value);
  };

  const handleTargetTypeFilterChange = (value: string) => {
    setPage(1);
    setTargetTypeFilter(value);
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
  };

  const handleGenerateExport = async () => {
    setExportError(null);
    const response = await generateExportMutation.mutateAsync({
      action: actionFilter.trim() || undefined,
      targetType: targetTypeFilter.trim() || undefined,
      search: search.trim() || undefined,
      from: toIsoDateTime(exportFrom),
      to: toIsoDateTime(exportTo),
      expiresInMinutes: exportExpiryMinutes,
    });

    if (!response.success) {
      setExportError(response.error);
      return { success: false };
    }

    setLastExportToken(response.data);
    return { success: true };
  };

  const handleDownloadSignedExport = async () => {
    setExportError(null);

    if (!lastExportToken) {
      setExportError("Generate a signed token first.");
      return { success: false };
    }

    const response = await downloadExportMutation.mutateAsync(lastExportToken.token);
    if (!response.success) {
      setExportError(response.error);
      return { success: false };
    }

    const downloadUrl = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = response.data.fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);

    return { success: true };
  };

  return {
    // Filters and pagination
    actionFilter,
    targetTypeFilter,
    search,
    page,
    setPage,
    handleActionFilterChange,
    handleTargetTypeFilterChange,
    handleSearchChange,
    handleRefresh,

    // Export
    exportFrom,
    setExportFrom,
    exportTo,
    setExportTo,
    exportExpiryMinutes,
    setExportExpiryMinutes,
    lastExportToken,
    exportError,
    setExportError,

    // Queries and mutations
    auditHistoryQuery,
    generateExportMutation,
    downloadExportMutation,

    // Actions
    handleGenerateExport,
    handleDownloadSignedExport,
  };
}
