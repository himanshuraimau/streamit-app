import { GeoBlockCreateSection } from "./components/GeoBlockCreateSection";
import { GeoBlockReasonDialog } from "./components/GeoBlockReasonDialog";
import { GeoBlocksSection } from "./components/GeoBlocksSection";
import { TakedownActionDialog } from "./components/TakedownActionDialog";
import { TakedownCreateSection } from "./components/TakedownCreateSection";
import { TakedownsSection } from "./components/TakedownsSection";
import { useTakedownsGeoBlocksPageController } from "./useTakedownsGeoBlocksPageController";

export function TakedownsGeoBlocksPage() {
  const controller = useTakedownsGeoBlocksPageController();

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b border-border/60 pb-5">
        <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Phase 6
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Takedowns And Geo-Blocks
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage content takedown requests and geographic restrictions for
            compliance with legal requirements and platform policies.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TakedownsSection {...controller.takedownsSection} />
        <GeoBlocksSection {...controller.geoBlocksSection} />
      </div>

      <TakedownCreateSection {...controller.takedownCreateSection} />
      <GeoBlockCreateSection {...controller.geoBlockCreateSection} />

      <TakedownActionDialog {...controller.takedownActionDialog} />
      <GeoBlockReasonDialog {...controller.geoBlockReasonDialog} />
    </div>
  );
}
