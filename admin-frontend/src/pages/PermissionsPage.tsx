import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminPermissions,
  updateAdminPermissions,
  type AdminPermissionItem,
  type AnalyticsScopeAssignment,
  type ComplianceScope,
} from "../lib/admin-api";

const ANALYTICS_SCOPES: AnalyticsScopeAssignment[] = ["GROWTH", "FINANCE"];
const COMPLIANCE_SCOPES: ComplianceScope[] = [
  "LEGAL_CASES",
  "TAKEDOWNS",
  "GEOBLOCKS",
  "SETTINGS",
  "AUDIT",
  "EXPORTS",
];

type RoleFilter = "ALL" | "ADMIN" | "SUPER_ADMIN";

type ScopeDraft = {
  analyticsScopes: AnalyticsScopeAssignment[];
  complianceScopes: ComplianceScope[];
  reason: string;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function normalizeDraft(item: AdminPermissionItem, draft?: ScopeDraft): ScopeDraft {
  return {
    analyticsScopes: sortUnique(draft?.analyticsScopes ?? item.analyticsScopes),
    complianceScopes: sortUnique(draft?.complianceScopes ?? item.complianceScopes),
    reason: draft?.reason ?? "Updated permission scopes from admin control plane",
  };
}

export function PermissionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, ScopeDraft>>({});
  const [savingAdminId, setSavingAdminId] = useState<string | null>(null);

  const permissionsQuery = useQuery({
    queryKey: ["admin", "phase6", "permissions", search, roleFilter, page],
    queryFn: () =>
      listAdminPermissions({
        page,
        limit: 12,
        search: search.trim() || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter,
      }),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (payload: {
      adminId: string;
      body: Parameters<typeof updateAdminPermissions>[1];
    }) => updateAdminPermissions(payload.adminId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const permissionsData =
    permissionsQuery.data && permissionsQuery.data.success ? permissionsQuery.data.data : null;
  const permissionsError =
    permissionsQuery.data && !permissionsQuery.data.success ? permissionsQuery.data.error : null;

  const items = useMemo(() => permissionsData?.items ?? [], [permissionsData]);

  const updateDraft = (
    item: AdminPermissionItem,
    updater: (current: ScopeDraft) => ScopeDraft,
  ) => {
    setDrafts((prev) => {
      const current = normalizeDraft(item, prev[item.admin.id]);
      return {
        ...prev,
        [item.admin.id]: updater(current),
      };
    });
  };

  const handleToggleAnalyticsScope = (item: AdminPermissionItem, scope: AnalyticsScopeAssignment) => {
    updateDraft(item, (current) => {
      const hasScope = current.analyticsScopes.includes(scope);
      const nextScopes = hasScope
        ? current.analyticsScopes.filter((value) => value !== scope)
        : [...current.analyticsScopes, scope];

      return {
        ...current,
        analyticsScopes: sortUnique(nextScopes),
      };
    });
  };

  const handleToggleComplianceScope = (item: AdminPermissionItem, scope: ComplianceScope) => {
    updateDraft(item, (current) => {
      const hasScope = current.complianceScopes.includes(scope);
      const nextScopes = hasScope
        ? current.complianceScopes.filter((value) => value !== scope)
        : [...current.complianceScopes, scope];

      return {
        ...current,
        complianceScopes: sortUnique(nextScopes),
      };
    });
  };

  const handleReasonChange = (item: AdminPermissionItem, reason: string) => {
    updateDraft(item, (current) => ({
      ...current,
      reason,
    }));
  };

  const handleSaveScopes = async (item: AdminPermissionItem) => {
    const draft = normalizeDraft(item, drafts[item.admin.id]);

    if (!draft.analyticsScopes.length) {
      window.alert("At least one analytics scope is required.");
      return;
    }

    if (!draft.complianceScopes.length) {
      window.alert("At least one compliance scope is required.");
      return;
    }

    if (draft.reason.trim().length < 3) {
      window.alert("Reason must be at least 3 characters.");
      return;
    }

    setSavingAdminId(item.admin.id);

    try {
      const response = await updatePermissionsMutation.mutateAsync({
        adminId: item.admin.id,
        body: {
          analyticsScopes: draft.analyticsScopes,
          complianceScopes: draft.complianceScopes,
          reason: draft.reason.trim(),
        },
      });

      if (!response.success) {
        window.alert(response.error);
        return;
      }

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.admin.id];
        return next;
      });
    } finally {
      setSavingAdminId(null);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 6 Follow-Up</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Admin Permission Scopes</h2>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            aria-label="Search admin"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search by name, username, or email"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <select
            aria-label="Filter admin role"
            value={roleFilter}
            onChange={(event) => {
              setPage(1);
              setRoleFilter(event.target.value as RoleFilter);
            }}
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <button
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "permissions"] });
            }}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {permissionsError ? (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {permissionsError}
          </div>
        ) : null}

        {permissionsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading admin permission scopes...</p>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const draft = normalizeDraft(item, drafts[item.admin.id]);
              const isSaving = savingAdminId === item.admin.id;

              return (
                <article
                  key={item.admin.id}
                  className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{item.admin.name}</p>
                      <p className="text-zinc-400">
                        @{item.admin.username} · {item.admin.email}
                      </p>
                      <p className="text-zinc-500">
                        {item.admin.role} · Last login: {formatDateTime(item.admin.lastLoginAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                      Scopes: {item.source.analytics}/{item.source.compliance}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <fieldset className="rounded-lg border border-white/10 p-2">
                      <legend className="px-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                        Analytics
                      </legend>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {ANALYTICS_SCOPES.map((scope) => (
                          <label
                            key={scope}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-2 py-1 text-zinc-200"
                          >
                            <input
                              type="checkbox"
                              checked={draft.analyticsScopes.includes(scope)}
                              onChange={() => handleToggleAnalyticsScope(item, scope)}
                            />
                            {scope}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="rounded-lg border border-white/10 p-2">
                      <legend className="px-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                        Compliance
                      </legend>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {COMPLIANCE_SCOPES.map((scope) => (
                          <label
                            key={scope}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-2 py-1 text-zinc-200"
                          >
                            <input
                              type="checkbox"
                              checked={draft.complianceScopes.includes(scope)}
                              onChange={() => handleToggleComplianceScope(item, scope)}
                            />
                            {scope}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      aria-label={`Reason for ${item.admin.username} scope update`}
                      value={draft.reason}
                      onChange={(event) => handleReasonChange(item, event.target.value)}
                      placeholder="Reason for scope update"
                      className="rounded-lg border border-white/15 bg-[#09090b] px-3 py-2 text-xs text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveScopes(item)}
                      disabled={isSaving || updatePermissionsMutation.isPending}
                      className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-40"
                    >
                      {isSaving ? "Saving..." : "Save Scopes"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No admin accounts found for current filters.</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <p className="text-zinc-400">
            Page {permissionsData?.pagination.page ?? 1} / {Math.max(permissionsData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={(permissionsData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, permissionsData?.pagination.totalPages ?? 1))
              }
              disabled={(permissionsData?.pagination.page ?? 1) >= (permissionsData?.pagination.totalPages ?? 1)}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
