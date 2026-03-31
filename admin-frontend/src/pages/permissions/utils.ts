import type { AdminPermissionItem, ScopeDraft } from "./types";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

export function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

export function normalizeDraft(item: AdminPermissionItem, draft?: ScopeDraft): ScopeDraft {
  return {
    analyticsScopes: sortUnique(draft?.analyticsScopes ?? item.analyticsScopes),
    complianceScopes: sortUnique(draft?.complianceScopes ?? item.complianceScopes),
    reason: draft?.reason ?? "Updated permission scopes from admin control plane",
  };
}
