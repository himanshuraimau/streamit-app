import type { AdminNoticeState } from "@/components/admin/types";
import type { AdCampaignListItem, AdCampaignStatus } from "@/lib/admin-api";

export type AdsNoticeState = AdminNoticeState;
export type CampaignActionStatus = Exclude<
  AdCampaignStatus,
  "DRAFT" | "SCHEDULED"
>;

export interface CampaignStatusActionState {
  campaign: AdCampaignListItem;
  nextStatus: CampaignActionStatus;
  reason: string;
  error: string | null;
}
