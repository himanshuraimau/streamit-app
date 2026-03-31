import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/formatters";

import { QueueCard } from "./components/QueueCard";
import { RolloutPolicyDialog } from "./components/RolloutPolicyDialog";
import { WINDOW_OPTIONS } from "./constants";
import { useSecurityHardeningPageController } from "./useSecurityHardeningPageController";

export function SecurityHardeningPage() {
  const controller = useSecurityHardeningPageController();
  const { summarySection, rolloutSection, policyEditorSection, alertDispatchSection, digestExportSection, policyDialog } = controller;

  const runbookItems = summarySection.summaryData
    ? [
        {
          label: "Security incident runbook",
          href: summarySection.summaryData.alerts.runbooks.security,
        },
        {
          label: "Compliance escalation runbook",
          href: summarySection.summaryData.alerts.runbooks.compliance,
        },
        {
          label: "Finance queue runbook",
          href: summarySection.summaryData.alerts.runbooks.finance,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b border-border/60 pb-5">
        <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Phase 7
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Security And Hardening Ops
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Observability board for high-risk queues, privileged actions, and top operator activity.
          </p>
        </div>
      </header>

      <AdminSectionCard
        title="Security Summary"
        description="Monitor queue thresholds and privileged actions"
        action={
          <div className="flex items-center gap-2">
            <Select
              value={String(summarySection.windowDays)}
              onValueChange={(value) => summarySection.onWindowDaysChange(Number(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    Last {days} day{days > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={summarySection.onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {summarySection.errorMessage ? (
            <AdminNotice
              notice={{
                tone: "error",
                title: "Security summary unavailable",
                description: summarySection.errorMessage,
              }}
            />
          ) : null}

          {/* Rollout Gate Status */}
          <div className="rounded-xl border border-border bg-card p-3">
            <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Rollout Gate Status</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Select
                value={rolloutSection.simulatedRole}
                onValueChange={(value) =>
                  rolloutSection.onSimulatedRoleChange(value as "" | "ADMIN" | "SUPER_ADMIN")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role: request context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Role: request context</SelectItem>
                  <SelectItem value="ADMIN">Role: ADMIN</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Role: SUPER_ADMIN</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={rolloutSection.simulatedCountry}
                onChange={(event) => rolloutSection.onSimulatedCountryChange(event.target.value)}
                maxLength={2}
                placeholder="Country (e.g. IN)"
                className="text-xs"
              />
              <Button onClick={rolloutSection.onResetSimulation} variant="outline" size="sm">
                Reset
              </Button>
            </div>

            {/* Policy Editor */}
            <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Rollout Policy Editor</p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={policyEditorSection.effectivePolicyEnabled}
                    onChange={(event) => policyEditorSection.onEnabledChange(event.target.checked)}
                  />
                  Rollout enabled
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={policyEditorSection.effectivePolicySuperAdminBypass}
                    onChange={(event) => policyEditorSection.onSuperAdminBypassChange(event.target.checked)}
                  />
                  Super-admin bypass
                </label>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={policyEditorSection.effectivePolicyRoles.includes("ADMIN")}
                    onChange={() => policyEditorSection.onToggleRole("ADMIN")}
                  />
                  Allow ADMIN role
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={policyEditorSection.effectivePolicyRoles.includes("SUPER_ADMIN")}
                    onChange={() => policyEditorSection.onToggleRole("SUPER_ADMIN")}
                  />
                  Allow SUPER_ADMIN role
                </label>
              </div>

              <Input
                value={policyEditorSection.effectivePolicyCountries}
                onChange={(event) => policyEditorSection.onCountriesChange(event.target.value)}
                placeholder="Allowed countries (comma-separated, e.g. IN, US, AE)"
                className="mt-2 text-xs"
              />

              <Textarea
                value={policyEditorSection.effectivePolicyBlockedMessage}
                onChange={(event) => policyEditorSection.onBlockedMessageChange(event.target.value)}
                rows={2}
                placeholder="Blocked message shown to out-of-rollout admins"
                className="mt-2 text-xs"
              />

              <Input
                value={policyEditorSection.policyReason}
                onChange={(event) => policyEditorSection.onReasonChange(event.target.value)}
                placeholder="Reason for rollout policy update"
                className="mt-2 text-xs"
              />

              <div className="mt-2 flex justify-end">
                <Button
                  onClick={policyEditorSection.onSave}
                  disabled={policyEditorSection.isSubmitting}
                >
                  {policyEditorSection.isSubmitting ? "Saving Policy..." : "Save Rollout Policy"}
                </Button>
              </div>
            </div>

            {/* Rollout Status Display */}
            {rolloutSection.rolloutError ? (
              <p className="mt-2 text-xs text-destructive">{rolloutSection.rolloutError}</p>
            ) : rolloutSection.isLoading ? (
              <p className="mt-2 text-xs text-muted-foreground">Loading rollout policy...</p>
            ) : rolloutSection.rolloutData ? (
              <div className="mt-2 space-y-2 text-xs">
                <p className="text-foreground">
                  Rollout is <span className="font-semibold">{rolloutSection.rolloutData.config.enabled ? "ENABLED" : "DISABLED"}</span>.
                </p>
                <p className="text-muted-foreground">
                  Evaluated context: role {rolloutSection.rolloutData.context.evaluatedRole} • country {rolloutSection.rolloutData.context.evaluatedCountry ?? "UNKNOWN"}
                </p>
                <p className={rolloutSection.rolloutData.evaluation.allowed ? "text-emerald-600" : "text-rose-600"}>
                  Decision: {rolloutSection.rolloutData.evaluation.allowed ? "ACCESS ALLOWED" : "ACCESS BLOCKED"}
                  {rolloutSection.rolloutData.evaluation.matchedBypass ? " (super-admin bypass)" : ""}
                </p>
                {rolloutSection.rolloutData.evaluation.reasons.length ? (
                  <p className="text-rose-600">Reasons: {rolloutSection.rolloutData.evaluation.reasons.join(", ")}</p>
                ) : null}
                <p className="text-muted-foreground">
                  Allowed roles: {rolloutSection.rolloutData.config.allowedRoles.length ? rolloutSection.rolloutData.config.allowedRoles.join(", ") : "ALL admin roles"}
                </p>
                <p className="text-muted-foreground">
                  Allowed countries: {rolloutSection.rolloutData.config.allowedCountries.length ? rolloutSection.rolloutData.config.allowedCountries.join(", ") : "ALL countries"}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Rollout policy unavailable.</p>
            )}
          </div>

          {/* Alert Summary */}
          {summarySection.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading security summary...</p>
          ) : summarySection.summaryData ? (
            <div className="space-y-4">
              {summarySection.breachedAlertCount > 0 ? (
                <AdminNotice
                  notice={{
                    tone: "error",
                    title: `${summarySection.breachedAlertCount} alert threshold${summarySection.breachedAlertCount > 1 ? "s" : ""} breached`,
                    description: "Review the queue metrics below for details.",
                  }}
                />
              ) : (
                <AdminNotice
                  notice={{
                    tone: "success",
                    title: "All thresholds healthy",
                    description: "All configured queue thresholds are currently within range.",
                  }}
                />
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <QueueCard
                  label="Pending Withdrawals"
                  status={summarySection.summaryData.alerts.status.pendingWithdrawals}
                />
                <QueueCard
                  label="Action Required Cases"
                  status={summarySection.summaryData.alerts.status.actionRequiredLegalCases}
                />
                <QueueCard
                  label="Pending Takedowns"
                  status={summarySection.summaryData.alerts.status.pendingTakedowns}
                />
                <QueueCard
                  label="Active Geo-Blocks"
                  status={summarySection.summaryData.alerts.status.activeGeoBlocks}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Monitored Action Alerting</h3>
                <p className="mt-2 text-sm text-foreground">
                  {summarySection.summaryData.alerts.status.monitoredActions.count.toLocaleString()} privileged actions in the last{" "}
                  {summarySection.summaryData.windowDays} day{summarySection.summaryData.windowDays > 1 ? "s" : ""}.
                </p>
                <p
                  className={`mt-1 text-xs ${
                    summarySection.summaryData.alerts.status.monitoredActions.isBreached ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  Threshold {summarySection.summaryData.alerts.status.monitoredActions.threshold.toLocaleString()} •{" "}
                  {summarySection.summaryData.alerts.status.monitoredActions.isBreached
                    ? `over by ${summarySection.summaryData.alerts.status.monitoredActions.overBy.toLocaleString()}`
                    : "within expected bounds"}
                </p>
              </div>

              {/* Runbooks */}
              <div className="rounded-xl border border-border bg-card p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Runbooks</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {runbookItems.map((runbook) => (
                    <div key={runbook.label} className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground">{runbook.label}</p>
                      {runbook.href ? (
                        <a
                          href={runbook.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-sky-600 hover:text-sky-500"
                        >
                          Open runbook
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Not configured</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Configure runbook URLs with keys: admin.ops.runbook.security, admin.ops.runbook.compliance,
                  admin.ops.runbook.finance.
                </p>
              </div>

              {/* Alert Routing */}
              <div className="rounded-xl border border-border bg-card p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Alert Routing Relay</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Dispatch threshold breach payloads to configured channels.
                </p>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={alertDispatchSection.dispatchChannels.includes("SLACK")}
                      onChange={() => alertDispatchSection.onToggleChannel("SLACK")}
                    />
                    Slack
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={alertDispatchSection.dispatchChannels.includes("PAGERDUTY")}
                      onChange={() => alertDispatchSection.onToggleChannel("PAGERDUTY")}
                    />
                    PagerDuty
                  </label>
                </div>

                <label className="mt-2 inline-flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={alertDispatchSection.dispatchDryRun}
                    onChange={(event) => alertDispatchSection.onDryRunChange(event.target.checked)}
                  />
                  Dry-run only (no outbound webhook request)
                </label>

                <Input
                  value={alertDispatchSection.dispatchReason}
                  onChange={(event) => alertDispatchSection.onReasonChange(event.target.value)}
                  placeholder="Dispatch reason"
                  className="mt-2 text-xs"
                />

                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={alertDispatchSection.onDispatch}
                    disabled={alertDispatchSection.isSubmitting}
                  >
                    {alertDispatchSection.isSubmitting ? "Dispatching..." : "Dispatch Alerts"}
                  </Button>
                </div>

                <AdminNotice notice={alertDispatchSection.notice} />
              </div>

              {/* Ops Digest Export */}
              <div className="rounded-xl border border-border bg-card p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Weekly Ops Digest Export</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Export queue pressure, privileged action telemetry, and rollout decision events.
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Export window: last {digestExportSection.windowDays} day{digestExportSection.windowDays > 1 ? "s" : ""}
                  </p>
                  <Button
                    onClick={digestExportSection.onExport}
                    disabled={digestExportSection.isExporting}
                    variant="outline"
                  >
                    {digestExportSection.isExporting ? "Exporting..." : "Export Digest CSV"}
                  </Button>
                </div>

                <AdminNotice notice={digestExportSection.notice} />
              </div>

              {/* Action Breakdown and Top Admins */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-3">
                  <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Action Breakdown</h3>
                  {summarySection.summaryData.actionBreakdown.length ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="pb-2">Action</th>
                            <th className="pb-2">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summarySection.summaryData.actionBreakdown.map((item) => (
                            <tr key={item.action} className="border-t border-border text-foreground">
                              <td className="py-2 pr-2">{item.action}</td>
                              <td className="py-2">{item.count.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No monitored actions in this window.</p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <h3 className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Top Admin Activity</h3>
                  {summarySection.summaryData.topAdmins.length ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="pb-2">Admin</th>
                            <th className="pb-2">Role</th>
                            <th className="pb-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summarySection.summaryData.topAdmins.map((item) => (
                            <tr key={item.admin.id} className="border-t border-border text-foreground">
                              <td className="py-2 pr-2">
                                <p>{item.admin.name}</p>
                                <p className="text-muted-foreground">@{item.admin.username}</p>
                              </td>
                              <td className="py-2 pr-2">{item.admin.role}</td>
                              <td className="py-2">{item.actionCount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No operator activity for this window.</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Generated at: {formatDateTime(summarySection.summaryData.generatedAt)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Security summary is not available.</p>
          )}
        </div>
      </AdminSectionCard>

      <RolloutPolicyDialog {...policyDialog} />
    </div>
  );
}
