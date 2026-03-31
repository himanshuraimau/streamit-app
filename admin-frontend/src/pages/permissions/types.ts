import type {
  AdminPermissionItem,
  AnalyticsScopeAssignment,
  ComplianceScope,
} from "../../lib/admin-api";

export type { AdminPermissionItem, AnalyticsScopeAssignment, ComplianceScope };

export type RoleFilter = "ALL" | "ADMIN" | "SUPER_ADMIN";

export interface ScopeDraft {
  analyticsScopes: AnalyticsScopeAssignment[];
  complianceScopes: ComplianceScope[];
  reason: string;
}
