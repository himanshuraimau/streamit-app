import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminNoticeState } from "@/components/admin/types";
import {
  createAdCampaign,
  exportAdCampaignAnalyticsCsv,
  getAdCampaignAnalytics,
  getFounderKpiSummary,
  listAdCampaigns,
  updateAdCampaignStatus,
  type AdCampaignListItem,
  type AdCampaignStatus,
  type AnalyticsScope,
} from "@/lib/admin-api";
import { useFileExport } from "@/hooks/useFileExport";

import type { CampaignActionStatus, CampaignStatusActionState } from "./types";
import {
  getErrorMessage,
  getResponseErrorMessage,
  normalizeOptionalText,
  validateCampaignForm,
} from "./utils";

export function useAdsAnalyticsPageController() {
  const queryClient = useQueryClient();
  const { downloadFile } = useFileExport();

  const [statusFilter, setStatusFilter] = useState<AdCampaignStatus | "ALL">(
    "ALL",
  );
  const [analyticsScope, setAnalyticsScope] =
    useState<AnalyticsScope>("GROWTH");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignStartAt, setCampaignStartAt] = useState("");
  const [campaignEndAt, setCampaignEndAt] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [totalBudget, setTotalBudget] = useState("");

  const [createNotice, setCreateNotice] =
    useState<AdminNoticeState | null>(null);
  const [campaignsNotice, setCampaignsNotice] =
    useState<AdminNoticeState | null>(null);
  const [analyticsNotice, setAnalyticsNotice] =
    useState<AdminNoticeState | null>(null);
  const [statusAction, setStatusAction] =
    useState<CampaignStatusActionState | null>(null);

  const campaignsQuery = useQuery({
    queryKey: ["admin", "ads", "campaigns", statusFilter, search, page],
    queryFn: () =>
      listAdCampaigns({
        page,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
  });

  const founderKpiQuery = useQuery({
    queryKey: ["admin", "ads", "kpis", analyticsScope],
    queryFn: () => getFounderKpiSummary({ scope: analyticsScope }),
  });

  const campaignAnalyticsQuery = useQuery({
    queryKey: ["admin", "ads", "campaign-analytics", selectedCampaignId],
    queryFn: () => getAdCampaignAnalytics(selectedCampaignId as string),
    enabled: Boolean(selectedCampaignId && analyticsScope !== "FINANCE"),
  });

  const createCampaignMutation = useMutation({
    mutationFn: createAdCampaign,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "kpis"] });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: (payload: {
      campaignId: string;
      status: AdCampaignStatus;
      reason?: string;
    }) =>
      updateAdCampaignStatus(payload.campaignId, {
        status: payload.status,
        reason: payload.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "kpis"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "ads", "campaign-analytics"],
      });
    },
  });

  const exportCampaignCsvMutation = useMutation({
    mutationFn: (campaignId: string) => exportAdCampaignAnalyticsCsv(campaignId),
  });

  const campaignsData =
    campaignsQuery.data && campaignsQuery.data.success
      ? campaignsQuery.data.data
      : null;
  const kpiData =
    founderKpiQuery.data && founderKpiQuery.data.success
      ? founderKpiQuery.data.data
      : null;
  const campaignAnalytics =
    campaignAnalyticsQuery.data && campaignAnalyticsQuery.data.success
      ? campaignAnalyticsQuery.data.data
      : null;

  const campaignsError = getResponseErrorMessage(
    campaignsQuery.data,
    campaignsQuery.error,
    "Campaign list is unavailable.",
  );
  const founderKpiError = getResponseErrorMessage(
    founderKpiQuery.data,
    founderKpiQuery.error,
    "Founder KPI snapshot is unavailable.",
  );
  const analyticsError = getResponseErrorMessage(
    campaignAnalyticsQuery.data,
    campaignAnalyticsQuery.error,
    "Campaign analytics are unavailable.",
  );

  const openStatusDialog = (
    campaign: AdCampaignListItem,
    nextStatus: CampaignActionStatus,
  ) => {
    if (campaign.status === nextStatus) {
      return;
    }

    setStatusAction({
      campaign,
      nextStatus,
      reason: "Status updated by admin",
      error: null,
    });
  };

  const closeStatusDialog = (open: boolean) => {
    if (!open && !updateCampaignStatusMutation.isPending) {
      setStatusAction(null);
    }
  };

  const handleAnalyticsScopeChange = (scope: AnalyticsScope) => {
    setAnalyticsScope(scope);
    if (scope === "FINANCE") {
      setSelectedCampaignId(null);
    }
  };

  const handleCreateCampaign = async () => {
    setCreateNotice(null);

    const validationError = validateCampaignForm({
      name: campaignName,
      startAt: campaignStartAt,
      endAt: campaignEndAt,
      dailyBudget,
      totalBudget,
    });

    if (validationError) {
      setCreateNotice({
        tone: "error",
        title: "Unable to create campaign",
        description: validationError,
      });
      return;
    }

    try {
      const response = await createCampaignMutation.mutateAsync({
        name: campaignName.trim(),
        objective: normalizeOptionalText(campaignObjective),
        startAt: campaignStartAt
          ? new Date(campaignStartAt).toISOString()
          : undefined,
        endAt: campaignEndAt ? new Date(campaignEndAt).toISOString() : undefined,
        dailyBudgetPaise: dailyBudget ? Number(dailyBudget) : undefined,
        totalBudgetPaise: totalBudget ? Number(totalBudget) : undefined,
      });

      if (!response.success) {
        setCreateNotice({
          tone: "error",
          title: "Unable to create campaign",
          description: response.error,
        });
        return;
      }

      setCampaignName("");
      setCampaignObjective("");
      setCampaignStartAt("");
      setCampaignEndAt("");
      setDailyBudget("");
      setTotalBudget("");
      setSelectedCampaignId(response.data.id);
      setCreateNotice({
        tone: "success",
        title: "Campaign created",
        description: `${response.data.name} is now available in the campaign queue.`,
      });
    } catch (error) {
      setCreateNotice({
        tone: "error",
        title: "Unable to create campaign",
        description: getErrorMessage(
          error,
          "Something went wrong while creating the campaign.",
        ),
      });
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAction) {
      return;
    }

    try {
      const response = await updateCampaignStatusMutation.mutateAsync({
        campaignId: statusAction.campaign.id,
        status: statusAction.nextStatus,
        reason: normalizeOptionalText(statusAction.reason),
      });

      if (!response.success) {
        setStatusAction((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setStatusAction(null);
      setCampaignsNotice({
        tone: "success",
        title: "Campaign status updated",
        description: `${statusAction.campaign.name} moved to ${statusAction.nextStatus}.`,
      });
    } catch (error) {
      setStatusAction((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while updating campaign status.",
              ),
            }
          : current,
      );
    }
  };

  const handleExportCampaignCsv = async () => {
    if (!selectedCampaignId) {
      return;
    }

    setAnalyticsNotice(null);

    try {
      const response = await exportCampaignCsvMutation.mutateAsync(
        selectedCampaignId,
      );

      if (!response.success) {
        setAnalyticsNotice({
          tone: "error",
          title: "Unable to export campaign analytics",
          description: response.error,
        });
        return;
      }

      downloadFile(response.data.blob, response.data.fileName);
      setAnalyticsNotice({
        tone: "success",
        title: "Campaign export ready",
        description: `Downloaded ${response.data.fileName}.`,
      });
    } catch (error) {
      setAnalyticsNotice({
        tone: "error",
        title: "Unable to export campaign analytics",
        description: getErrorMessage(
          error,
          "Something went wrong while exporting campaign analytics.",
        ),
      });
    }
  };

  return {
    founderKpiSection: {
      analyticsScope,
      kpiData,
      isLoading: founderKpiQuery.isLoading,
      isRefreshing: founderKpiQuery.isFetching,
      errorMessage: founderKpiError,
      onAnalyticsScopeChange: handleAnalyticsScopeChange,
      onRefresh: () => {
        void queryClient.invalidateQueries({ queryKey: ["admin", "ads", "kpis"] });
      },
      onSelectCampaign: setSelectedCampaignId,
    },
    campaignCreateSection: {
      campaignName,
      campaignObjective,
      campaignStartAt,
      campaignEndAt,
      dailyBudget,
      totalBudget,
      notice: createNotice,
      isCreating: createCampaignMutation.isPending,
      onCampaignNameChange: setCampaignName,
      onCampaignObjectiveChange: setCampaignObjective,
      onCampaignStartAtChange: setCampaignStartAt,
      onCampaignEndAtChange: setCampaignEndAt,
      onDailyBudgetChange: setDailyBudget,
      onTotalBudgetChange: setTotalBudget,
      onSubmit: handleCreateCampaign,
    },
    campaignListSection: {
      statusFilter,
      search,
      selectedCampaignId,
      rows: campaignsData?.items ?? [],
      pagination: campaignsData?.pagination,
      isLoading: campaignsQuery.isLoading,
      isSubmitting: updateCampaignStatusMutation.isPending,
      errorMessage: campaignsError,
      notice: campaignsNotice,
      onStatusFilterChange: (value: AdCampaignStatus | "ALL") => {
        setStatusFilter(value);
        setPage(1);
      },
      onSearchChange: (value: string) => {
        setSearch(value);
        setPage(1);
      },
      onSelectCampaign: setSelectedCampaignId,
      onOpenStatusAction: openStatusDialog,
      onPreviousPage: () => setPage((current) => Math.max(current - 1, 1)),
      onNextPage: () =>
        setPage((current) =>
          Math.min(current + 1, campaignsData?.pagination.totalPages ?? 1),
        ),
    },
    campaignAnalyticsSection: {
      analyticsScope,
      selectedCampaignId,
      analytics: campaignAnalytics,
      isLoading: campaignAnalyticsQuery.isLoading,
      isExporting: exportCampaignCsvMutation.isPending,
      errorMessage: analyticsError,
      notice: analyticsNotice,
      onExport: handleExportCampaignCsv,
    },
    statusDialog: {
      action: statusAction,
      isPending: updateCampaignStatusMutation.isPending,
      onOpenChange: closeStatusDialog,
      onReasonChange: (value: string) =>
        setStatusAction((current) =>
          current
            ? {
                ...current,
                reason: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmStatusChange,
    },
  };
}
