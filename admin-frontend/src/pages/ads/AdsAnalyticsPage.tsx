import { CampaignAnalyticsSection } from "./components/CampaignAnalyticsSection";
import { CampaignCreateSection } from "./components/CampaignCreateSection";
import { CampaignListSection } from "./components/CampaignListSection";
import { CampaignStatusDialog } from "./components/CampaignStatusDialog";
import { FounderKpiSection } from "./components/FounderKpiSection";
import { useAdsAnalyticsPageController } from "./useAdsAnalyticsPageController";

export function AdsAnalyticsPage() {
  const controller = useAdsAnalyticsPageController();

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b border-border/60 pb-5">
        <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Phase 5
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Ads And Analytics
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Campaign lifecycle controls, founder KPI visibility, and analytics
            drill-down now live in a modular feature surface with dialog-based
            status transitions and shared admin UI primitives.
          </p>
        </div>
      </header>

      <FounderKpiSection {...controller.founderKpiSection} />
      <CampaignCreateSection {...controller.campaignCreateSection} />
      <CampaignListSection {...controller.campaignListSection} />
      <CampaignAnalyticsSection {...controller.campaignAnalyticsSection} />
      <CampaignStatusDialog {...controller.statusDialog} />
    </div>
  );
}
