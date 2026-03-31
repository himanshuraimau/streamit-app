import type { AdminNoticeState } from "@/components/admin/types";
import type { TakedownListItem, GeoBlockRuleItem } from "@/lib/admin-api";

export type TakedownsNoticeState = AdminNoticeState;

export type TakedownAction = "EXECUTE" | "APPEAL" | "REVERSE" | "REJECT";

export interface TakedownActionDialogState {
  takedown: TakedownListItem;
  action: TakedownAction;
  note: string;
  error: string | null;
}

export interface GeoBlockReasonDialogState {
  geoBlock: GeoBlockRuleItem;
  reason: string;
  error: string | null;
}
