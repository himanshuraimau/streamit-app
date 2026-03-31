import { useMemo } from "react";
import { AdminNotice } from "../../components/admin/AdminNotice";
import { usePermissionsPageController } from "./usePermissionsPageController";
import { ANALYTICS_SCOPES, COMPLIANCE_SCOPES } from "./constants";
import { formatDateTime, normalizeDraft } from "./utils";
import type { RoleFilter } from "./types";

export function PermissionsPage() {
  const controller = usePermissionsPageController();

  const permissionsData =
    controller.permissionsQuery.data && controller.permissionsQuery.data.success
      ? controller.permissionsQuery.data.data
      : null;
  const permissionsError =
    controller.permissionsQuery.data && !controller.permissionsQuery.data.success
      ? controller.permissionsQuery.data.error
      : null;

  const items = useMemo(() => permissionsData?.items ?? [], [permissionsData]);

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
            value={controller.search}
            onChange={(event) => controller.handleSearchChange(event.target.value)}
            placeholder="Search by name, username, or email"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <select
            aria-label="Filter admin role"
            value={controller.roleFilter}
            onChange={(event) =>
              controller.handleRoleFilterChange(event.target.value as RoleFilter)
            }
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <button
            type="button"
            onClick={controller.handleRefresh}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {permissionsError ? (
          <div className="mb-3">
            <AdminNotice
              notice={{
                tone: "error",
                title: "Error Loading Permissions",
                description: permissionsError,
              }}
            />
          </div>
        ) : null}

        {controller.validationError ? (
          <div className="mb-3">
            <AdminNotice
              notice={{
                tone: "error",
                title: "Validation Error",
                description: controller.validationError,
              }}
            />
          </div>
        ) : null}

        {controller.permissionsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading admin permission scopes...</p>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const draft = normalizeDraft(item, controller.drafts[item.admin.id]);
              const isSaving = controller.savingAdminId === item.admin.id;

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
                              onChange={() => controller.handleToggleAnalyticsScope(item, scope)}
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
                              onChange={() => controller.handleToggleComplianceScope(item, scope)}
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
                      onChange={(event) =>
                        controller.handleReasonChange(item, event.target.value)
                      }
                      placeholder="Reason for scope update"
                      className="rounded-lg border border-white/15 bg-[#09090b] px-3 py-2 text-xs text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        controller.setValidationError(null);
                        void controller.handleSaveScopes(item);
                      }}
                      disabled={isSaving || controller.updatePermissionsMutation.isPending}
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
            Page {permissionsData?.pagination.page ?? 1} /{" "}
            {Math.max(permissionsData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => controller.setPage((prev) => Math.max(prev - 1, 1))}
              disabled={(permissionsData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                controller.setPage((prev) =>
                  Math.min(prev + 1, permissionsData?.pagination.totalPages ?? 1),
                )
              }
              disabled={
                (permissionsData?.pagination.page ?? 1) >=
                (permissionsData?.pagination.totalPages ?? 1)
              }
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
