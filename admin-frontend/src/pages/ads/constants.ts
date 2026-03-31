import type { AdCampaignStatus, AnalyticsScope } from "@/lib/admin-api";

export const CAMPAIGN_STATUSES: Array<AdCampaignStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
];

export const ANALYTICS_SCOPES: AnalyticsScope[] = ["GROWTH", "FINANCE", "ALL"];

export const CAMPAIGN_STATUS_ACTIONS: Record<
  Exclude<AdCampaignStatus, "DRAFT" | "SCHEDULED">,
  {
    label: string;
    className: string;
    buttonVariant: "default" | "outline" | "secondary";
  }
> = {
  ACTIVE: {
    label: "Activate",
    className:
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
    buttonVariant: "outline",
  },
  PAUSED: {
    label: "Pause",
    className:
      "border-amber-500/35 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20",
    buttonVariant: "outline",
  },
  COMPLETED: {
    label: "Complete",
    className:
      "border-sky-500/35 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20",
    buttonVariant: "outline",
  },
  ARCHIVED: {
    label: "Archive",
    className:
      "border-zinc-500/35 bg-zinc-500/10 text-zinc-100 hover:bg-zinc-500/20",
    buttonVariant: "outline",
  },
};
