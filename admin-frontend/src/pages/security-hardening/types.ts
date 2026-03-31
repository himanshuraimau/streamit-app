import type { AdminNoticeState } from "@/components/admin/types";

export type SecurityNoticeState = AdminNoticeState;

export interface RolloutPolicyDialogState {
  enabled: boolean;
  superAdminBypass: boolean;
  allowedRoles: Array<"ADMIN" | "SUPER_ADMIN">;
  allowedCountries: string[];
  blockedMessage: string;
  reason: string;
  error: string | null;
}

export type AlertStatus = {
  count: number;
  threshold: number;
  isBreached: boolean;
  overBy: number;
};
