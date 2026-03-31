import type { UserListItem, UserDetail } from "../../lib/admin-api";

export type { UserListItem, UserDetail };

export interface SuspensionDialogState {
  isOpen: boolean;
  userId: string | null;
  currentlySuspended: boolean;
}
