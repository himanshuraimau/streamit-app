import type {
  AdCampaignListItem,
  AdCampaignStatus,
} from "@/lib/admin-api";
import { formatCurrencyFromPaise } from "@/lib/formatters";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatPercentMetric(value: number) {
  return `${value.toFixed(2)}%`;
}

export function formatCurrencyAmount(value: number) {
  return currencyFormatter.format(value);
}

export function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function validateCampaignForm(input: {
  name: string;
  startAt: string;
  endAt: string;
  dailyBudget: string;
  totalBudget: string;
}) {
  if (input.name.trim().length < 3) {
    return "Campaign name must be at least 3 characters.";
  }

  const dailyBudget = input.dailyBudget.trim();
  if (
    dailyBudget &&
    (!Number.isInteger(Number(dailyBudget)) || Number(dailyBudget) < 1)
  ) {
    return "Daily budget must be a positive integer in paise.";
  }

  const totalBudget = input.totalBudget.trim();
  if (
    totalBudget &&
    (!Number.isInteger(Number(totalBudget)) || Number(totalBudget) < 1)
  ) {
    return "Total budget must be a positive integer in paise.";
  }

  if (input.startAt && input.endAt) {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);

    if (end.getTime() < start.getTime()) {
      return "Campaign end time must be after the start time.";
    }
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getResponseErrorMessage(
  response: { success: boolean; error?: string } | undefined,
  error: unknown,
  fallback: string,
) {
  if (response && !response.success) {
    return response.error ?? fallback;
  }

  if (error) {
    return getErrorMessage(error, fallback);
  }

  return null;
}

export function getCampaignStatusBadgeClassName(status: AdCampaignStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "PAUSED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "COMPLETED":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100";
    case "ARCHIVED":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-100";
    case "SCHEDULED":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-100";
    case "DRAFT":
    default:
      return "border-border/70 bg-muted/40 text-muted-foreground";
  }
}

export function getCampaignHealthTone(
  campaign: AdCampaignListItem,
) {
  if (campaign.analytics.alerts.isOverspend) {
    return {
      label: "Overspend",
      className: "border-rose-500/30 bg-rose-500/10 text-rose-100",
    };
  }

  if (campaign.analytics.alerts.isLowCtr) {
    return {
      label: "Low CTR",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    };
  }

  return {
    label: "Healthy",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  };
}

export function getAvailableCampaignStatusActions(currentStatus: AdCampaignStatus) {
  const actions: Array<Exclude<AdCampaignStatus, "DRAFT" | "SCHEDULED">> = [
    "ACTIVE",
    "PAUSED",
    "COMPLETED",
    "ARCHIVED",
  ];

  return actions.filter((status) => status !== currentStatus);
}

export function getCampaignBudgetLabel(campaign: AdCampaignListItem) {
  if (campaign.totalBudgetPaise !== null) {
    return formatCurrencyFromPaise(campaign.totalBudgetPaise);
  }

  if (campaign.dailyBudgetPaise !== null) {
    return `${formatCurrencyFromPaise(campaign.dailyBudgetPaise)} / day`;
  }

  return "Budget not set";
}
