import type { AdminNoticeState } from "@/components/admin/types";
import type {
  AnnouncementItem,
  SystemSettingItem,
  SystemSettingVersionItem,
} from "@/lib/admin-api";

export type SettingsNoticeState = AdminNoticeState;

export interface SettingEditDialogState {
  setting: SystemSettingItem;
  value: string;
  isPublic: boolean;
  reason: string;
  error: string | null;
}

export interface SettingRollbackDialogState {
  version: SystemSettingVersionItem;
  reason: string;
  error: string | null;
}

export interface AnnouncementEditDialogState {
  announcement: AnnouncementItem;
  title: string;
  content: string;
  error: string | null;
}
