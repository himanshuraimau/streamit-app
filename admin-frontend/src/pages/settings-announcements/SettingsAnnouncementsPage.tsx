import { AnnouncementCreateSection } from "./components/AnnouncementCreateSection";
import { AnnouncementDeleteDialog } from "./components/AnnouncementDeleteDialog";
import { AnnouncementEditDialog } from "./components/AnnouncementEditDialog";
import { AnnouncementsSection } from "./components/AnnouncementsSection";
import { SettingCreateSection } from "./components/SettingCreateSection";
import { SettingEditDialog } from "./components/SettingEditDialog";
import { SettingHistorySection } from "./components/SettingHistorySection";
import { SettingRollbackDialog } from "./components/SettingRollbackDialog";
import { SystemSettingsSection } from "./components/SystemSettingsSection";
import { useSettingsAnnouncementsPageController } from "./useSettingsAnnouncementsPageController";

export function SettingsAnnouncementsPage() {
  const controller = useSettingsAnnouncementsPageController();

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b border-border/60 pb-5">
        <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Phase 6
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Settings And Announcements
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage system configuration settings with full version history and
            rollback capabilities. Create and manage platform announcements with
            role-based targeting and scheduling.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SystemSettingsSection {...controller.settingsSection} />
        <SettingHistorySection {...controller.settingHistorySection} />
      </div>

      <SettingCreateSection {...controller.settingCreateSection} />
      <AnnouncementsSection {...controller.announcementsSection} />
      <AnnouncementCreateSection {...controller.announcementCreateSection} />

      <SettingEditDialog {...controller.settingEditDialog} />
      <SettingRollbackDialog {...controller.settingRollbackDialog} />
      <AnnouncementEditDialog {...controller.announcementEditDialog} />
      <AnnouncementDeleteDialog {...controller.announcementDeleteDialog} />
    </div>
  );
}
