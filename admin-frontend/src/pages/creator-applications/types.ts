import type {
  CreatorApplicationStatus,
  CreatorApplicationListItem,
} from "../../lib/admin-api";

export type { CreatorApplicationStatus, CreatorApplicationListItem };

export interface RejectionDialogState {
  isOpen: boolean;
  applicationId: string | null;
}
