import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPaginationControls } from "@/components/admin/AdminPaginationControls";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  formatCurrencyFromPaise,
  formatDateTime,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  AdCampaignListItem,
  AdCampaignStatus,
  PaginationMeta,
} from "@/lib/admin-api";

import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_ACTIONS } from "../constants";
import type { AdsNoticeState, CampaignActionStatus } from "../types";
import {
  formatCurrencyAmount,
  formatPercentMetric,
  getAvailableCampaignStatusActions,
  getCampaignBudgetLabel,
  getCampaignHealthTone,
  getCampaignStatusBadgeClassName,
} from "../utils";

export function CampaignListSection({
  statusFilter,
  search,
  selectedCampaignId,
  rows,
  pagination,
  isLoading,
  isSubmitting,
  errorMessage,
  notice,
  onStatusFilterChange,
  onSearchChange,
  onSelectCampaign,
  onOpenStatusAction,
  onPreviousPage,
  onNextPage,
}: {
  statusFilter: AdCampaignStatus | "ALL";
  search: string;
  selectedCampaignId: string | null;
  rows: AdCampaignListItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  notice: AdsNoticeState | null;
  onStatusFilterChange: (value: AdCampaignStatus | "ALL") => void;
  onSearchChange: (value: string) => void;
  onSelectCampaign: (campaignId: string) => void;
  onOpenStatusAction: (
    campaign: AdCampaignListItem,
    nextStatus: CampaignActionStatus,
  ) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <AdminSectionCard
      eyebrow="Advertising"
      title="Campaigns"
      description="Search, triage, and transition campaign lifecycle state without leaving the analytics workspace."
    >
      <div className="space-y-4">
        {notice ? <AdminNotice notice={notice} /> : null}
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Campaigns are unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as AdCampaignStatus | "ALL")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Campaign status" />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label="Search campaigns"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search campaign name"
          />
        </div>

        {isLoading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No campaigns found for this filter.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full min-w-7xl text-left text-sm">
                <thead className="bg-background/65 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Budget</th>
                    <th className="px-4 py-3 font-medium">Spend</th>
                    <th className="px-4 py-3 font-medium">CTR</th>
                    <th className="px-4 py-3 font-medium">CPM</th>
                    <th className="px-4 py-3 font-medium">Health</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((campaign) => {
                    const health = getCampaignHealthTone(campaign);
                    const isSelected = selectedCampaignId === campaign.id;

                    return (
                      <tr
                        key={campaign.id}
                        className={cn(
                          "border-t border-border/60 align-top transition-colors",
                          isSelected && "bg-primary/6",
                        )}
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => onSelectCampaign(campaign.id)}
                            className="text-left"
                          >
                            <div className="font-medium text-foreground">
                              {campaign.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {campaign.objective || "No objective"}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              getCampaignStatusBadgeClassName(campaign.status),
                            )}
                          >
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {getCampaignBudgetLabel(campaign)}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {formatCurrencyFromPaise(campaign.analytics.spendPaise)}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {formatPercentMetric(campaign.analytics.ctrPercent)}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {formatCurrencyAmount(campaign.analytics.cpmInr)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={cn(health.className)}
                          >
                            {health.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatDateTime(campaign.updatedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {getAvailableCampaignStatusActions(
                              campaign.status,
                            ).map((nextStatus) => {
                              const action = CAMPAIGN_STATUS_ACTIONS[nextStatus];

                              return (
                                <Button
                                  key={nextStatus}
                                  type="button"
                                  variant={action.buttonVariant}
                                  size="xs"
                                  className={action.className}
                                  onClick={() =>
                                    onOpenStatusAction(campaign, nextStatus)
                                  }
                                  disabled={isSubmitting}
                                >
                                  {action.label}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <AdminPaginationControls
              page={pagination?.page ?? 1}
              totalPages={pagination?.totalPages ?? 1}
              onPreviousPage={onPreviousPage}
              onNextPage={onNextPage}
            />
          </div>
        )}
      </div>
    </AdminSectionCard>
  );
}
