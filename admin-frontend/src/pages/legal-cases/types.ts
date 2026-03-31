import type {
  LegalCaseStatus,
  LegalCaseType,
  LegalCaseListItem,
  LegalCaseDetail,
} from "../../lib/admin-api";

export type { LegalCaseStatus, LegalCaseType, LegalCaseListItem, LegalCaseDetail };

export interface CaseFormState {
  title: string;
  description: string;
  caseType: LegalCaseType;
  priority: string;
  targetType: string;
  targetId: string;
  requestedBy: string;
  assignedTo: string;
  dueAt: string;
}

export interface StatusUpdateDialogState {
  isOpen: boolean;
  legalCaseId: string | null;
}

export interface AssignDialogState {
  isOpen: boolean;
  legalCaseId: string | null;
  currentAssignee: string | null;
}
