import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dispatchAdminSecurityAlerts,
  exportAdminSecurityOpsDigestCsv,
  getAdminRolloutStatus,
  getAdminSecuritySummary,
  updateAdminRolloutPolicy,
} from "../lib/admin-api";

const WINDOW_OPTIONS = [1, 3, 7, 14, 30];
const DEFAULT_ROLLOUT_BLOCKED_MESSAGE =
  "Admin access is currently in staged rollout. Contact platform operations for access.";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

type AlertStatus = {
  count: number;
  threshold: number;
  isBreached: boolean;
  overBy: number;
};

function QueueCard({ label, status }: { label: string; status: AlertStatus }) {
  const toneClass = status.isBreached
    ? "border-rose-400/35 bg-rose-500/10"
    : "border-emerald-400/30 bg-emerald-500/10";

  return (
    <article className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{status.count.toLocaleString()}</p>
      <p className="mt-1 text-xs text-zinc-400">
        Threshold {status.threshold.toLocaleString()} • {status.isBreached ? "Alerting" : "Within range"}
      </p>
    </article>
  );
}

export function SecurityHardeningPage() {
  const queryClient = useQueryClient();
  const [windowDays, setWindowDays] = useState(7);
  const [simulatedRole, setSimulatedRole] = useState<"" | "ADMIN" | "SUPER_ADMIN">("");
  const [simulatedCountry, setSimulatedCountry] = useState("");
  const [policyEnabled, setPolicyEnabled] = useState(false);
  const [policySuperAdminBypass, setPolicySuperAdminBypass] = useState(true);
  const [policyRoles, setPolicyRoles] = useState<Array<"ADMIN" | "SUPER_ADMIN">>([
    "ADMIN",
    "SUPER_ADMIN",
  ]);
  const [policyCountries, setPolicyCountries] = useState("");
  const [policyBlockedMessage, setPolicyBlockedMessage] = useState(
    DEFAULT_ROLLOUT_BLOCKED_MESSAGE,
  );
  const [policyReason, setPolicyReason] = useState("Phase 8 rollout policy update");
  const [dispatchReason, setDispatchReason] = useState("Phase 8 alert routing verification");
  const [dispatchDryRun, setDispatchDryRun] = useState(true);
  const [dispatchChannels, setDispatchChannels] = useState<Array<"SLACK" | "PAGERDUTY">>([
    "SLACK",
    "PAGERDUTY",
  ]);
  const [dispatchResultNotice, setDispatchResultNotice] = useState<string | null>(null);
  const [digestExportNotice, setDigestExportNotice] = useState<string | null>(null);
  const [policyTouched, setPolicyTouched] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ["admin", "phase7", "security-summary", windowDays],
    queryFn: () => getAdminSecuritySummary({ days: windowDays }),
  });

  const rolloutQuery = useQuery({
    queryKey: ["admin", "phase7", "rollout-status", simulatedRole, simulatedCountry],
    queryFn: () =>
      getAdminRolloutStatus({
        role: simulatedRole || undefined,
        country: simulatedCountry.trim() ? simulatedCountry.trim().toUpperCase() : undefined,
      }),
  });

  const updateRolloutPolicyMutation = useMutation({
    mutationFn: updateAdminRolloutPolicy,
    onSuccess: (response) => {
      if (!response.success) {
        return;
      }

      setPolicyTouched(false);
      setPolicyReason("Phase 8 rollout policy update");
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase7", "rollout-status"] });
    },
  });

  const dispatchAlertsMutation = useMutation({
    mutationFn: dispatchAdminSecurityAlerts,
  });

  const exportDigestMutation = useMutation({
    mutationFn: exportAdminSecurityOpsDigestCsv,
  });

  const summaryData =
    summaryQuery.data && summaryQuery.data.success ? summaryQuery.data.data : null;
  const summaryError =
    summaryQuery.data && !summaryQuery.data.success ? summaryQuery.data.error : null;
  const rolloutData =
    rolloutQuery.data && rolloutQuery.data.success ? rolloutQuery.data.data : null;
  const rolloutError = rolloutQuery.data && !rolloutQuery.data.success ? rolloutQuery.data.error : null;

  const rolloutRolesFromConfig: Array<"ADMIN" | "SUPER_ADMIN"> =
    rolloutData && rolloutData.config.allowedRoles.length
      ? [...rolloutData.config.allowedRoles]
      : ["ADMIN", "SUPER_ADMIN"];
  const rolloutCountriesFromConfig = rolloutData?.config.allowedCountries.join(", ") ?? "";
  const rolloutBlockedMessageFromConfig =
    rolloutData?.config.blockedMessage ?? DEFAULT_ROLLOUT_BLOCKED_MESSAGE;

  const effectivePolicyEnabled = policyTouched
    ? policyEnabled
    : (rolloutData?.config.enabled ?? false);
  const effectivePolicySuperAdminBypass = policyTouched
    ? policySuperAdminBypass
    : (rolloutData?.config.superAdminBypass ?? true);
  const effectivePolicyRoles = policyTouched ? policyRoles : rolloutRolesFromConfig;
  const effectivePolicyCountries = policyTouched ? policyCountries : rolloutCountriesFromConfig;
  const effectivePolicyBlockedMessage = policyTouched
    ? policyBlockedMessage
    : rolloutBlockedMessageFromConfig;

  const breachedAlertCount = summaryData
    ? Object.values(summaryData.alerts.status).filter((item) => item.isBreached).length
    : 0;

  const runbookItems = summaryData
    ? [
        {
          label: "Security incident runbook",
          href: summaryData.alerts.runbooks.security,
        },
        {
          label: "Compliance escalation runbook",
          href: summaryData.alerts.runbooks.compliance,
        },
        {
          label: "Finance queue runbook",
          href: summaryData.alerts.runbooks.finance,
        },
      ]
    : [];

  const beginPolicyEdit = () => {
    if (policyTouched) {
      return;
    }

    setPolicyEnabled(rolloutData?.config.enabled ?? false);
    setPolicySuperAdminBypass(rolloutData?.config.superAdminBypass ?? true);
    setPolicyRoles(rolloutRolesFromConfig);
    setPolicyCountries(rolloutCountriesFromConfig);
    setPolicyBlockedMessage(rolloutBlockedMessageFromConfig);
    setPolicyTouched(true);
  };

  const togglePolicyRole = (role: "ADMIN" | "SUPER_ADMIN") => {
    const baseRoles: Array<"ADMIN" | "SUPER_ADMIN"> = effectivePolicyRoles;
    beginPolicyEdit();
    setPolicyRoles(() => {
      if (baseRoles.includes(role)) {
        return baseRoles.filter((item) => item !== role);
      }

      return [...baseRoles, role];
    });
  };

  const toggleDispatchChannel = (channel: "SLACK" | "PAGERDUTY") => {
    setDispatchChannels((current) => {
      if (current.includes(channel)) {
        return current.filter((item) => item !== channel);
      }

      return [...current, channel];
    });
  };

  const handleSaveRolloutPolicy = async () => {
    const resolvedEnabled = effectivePolicyEnabled;
    const resolvedSuperAdminBypass = effectivePolicySuperAdminBypass;
    const resolvedRoles = effectivePolicyRoles;
    const resolvedBlockedMessage = effectivePolicyBlockedMessage;

    const allowedCountries = [...new Set(
      effectivePolicyCountries
        .split(",")
        .map((country) => country.trim().toUpperCase())
        .filter((country) => /^[A-Z]{2}$/.test(country)),
    )];

    const blockedMessage = resolvedBlockedMessage.trim();
    const reason = policyReason.trim();

    if (blockedMessage.length < 10) {
      window.alert("Blocked message must be at least 10 characters.");
      return;
    }

    if (reason.length < 3) {
      window.alert("Reason must be at least 3 characters.");
      return;
    }

    if (resolvedEnabled && !resolvedSuperAdminBypass && !resolvedRoles.includes("SUPER_ADMIN")) {
      window.alert("Unsafe policy: SUPER_ADMIN must remain allowed when bypass is disabled.");
      return;
    }

    const preview = [
      `Enabled: ${resolvedEnabled ? "yes" : "no"}`,
      `Super-admin bypass: ${resolvedSuperAdminBypass ? "yes" : "no"}`,
      `Allowed roles: ${resolvedRoles.length ? resolvedRoles.join(", ") : "ALL admin roles"}`,
      `Allowed countries: ${allowedCountries.length ? allowedCountries.join(", ") : "ALL countries"}`,
    ].join("\n");

    const confirmed = window.confirm(`Apply rollout policy update?\n\n${preview}`);
    if (!confirmed) {
      return;
    }

    const response = await updateRolloutPolicyMutation.mutateAsync({
      enabled: resolvedEnabled,
      superAdminBypass: resolvedSuperAdminBypass,
      allowedRoles: resolvedRoles,
      allowedCountries,
      blockedMessage,
      reason,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setPolicyTouched(false);
  };

  const handleDispatchSecurityAlerts = async () => {
    if (dispatchReason.trim().length < 3) {
      window.alert("Dispatch reason must be at least 3 characters.");
      return;
    }

    if (!dispatchChannels.length) {
      window.alert("Select at least one dispatch channel.");
      return;
    }

    const response = await dispatchAlertsMutation.mutateAsync({
      days: windowDays,
      dryRun: dispatchDryRun,
      channels: dispatchChannels,
      reason: dispatchReason.trim(),
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    const deliverySummary = response.data.deliveries
      .map((delivery) => `${delivery.channel}: ${delivery.status}`)
      .join(" | ");
    setDispatchResultNotice(
      `Dispatch ${response.data.dryRun ? "dry-run" : "live"} complete. Breached metrics: ${response.data.breachedMetrics.join(
        ", ",
      ) || "none"}. ${deliverySummary}`,
    );
  };

  const handleExportOpsDigest = async () => {
    const response = await exportDigestMutation.mutateAsync({
      days: windowDays,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    const downloadUrl = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = response.data.fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);

    setDigestExportNotice(
      `Ops digest exported for the last ${windowDays} day${windowDays > 1 ? "s" : ""}.`,
    );
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 7</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Security And Hardening Ops</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Observability board for high-risk queues, privileged actions, and top operator activity.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400" htmlFor="security-window-days">
              Rolling Window
            </label>
            <select
              id="security-window-days"
              value={windowDays}
              onChange={(event) => setWindowDays(Number(event.target.value))}
              aria-label="Select security summary rolling window"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            >
              {WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  Last {days} day{days > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["admin", "phase7", "security-summary"] });
              void queryClient.invalidateQueries({ queryKey: ["admin", "phase7", "rollout-status"] });
            }}
            aria-label="Refresh security summary"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {summaryError ? (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {summaryError}
          </div>
        ) : null}

        <article className="mb-4 rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
          <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Rollout Gate Status</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
            <select
              aria-label="Simulate rollout role"
              value={simulatedRole}
              onChange={(event) => setSimulatedRole(event.target.value as "" | "ADMIN" | "SUPER_ADMIN")}
              className="rounded-lg border border-white/15 bg-[#111113] px-2 py-2 text-xs text-zinc-100"
            >
              <option value="">Role: request context</option>
              <option value="ADMIN">Role: ADMIN</option>
              <option value="SUPER_ADMIN">Role: SUPER_ADMIN</option>
            </select>
            <input
              aria-label="Simulate rollout country"
              value={simulatedCountry}
              onChange={(event) => setSimulatedCountry(event.target.value.toUpperCase())}
              maxLength={2}
              placeholder="Country (e.g. IN)"
              className="rounded-lg border border-white/15 bg-[#111113] px-2 py-2 text-xs text-zinc-100"
            />
            <button
              type="button"
              onClick={() => {
                setSimulatedRole("");
                setSimulatedCountry("");
              }}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-[#111113] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Rollout Policy Editor</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={effectivePolicyEnabled}
                  onChange={(event) => {
                    beginPolicyEdit();
                    setPolicyEnabled(event.target.checked);
                  }}
                />
                Rollout enabled
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={effectivePolicySuperAdminBypass}
                  onChange={(event) => {
                    beginPolicyEdit();
                    setPolicySuperAdminBypass(event.target.checked);
                  }}
                />
                Super-admin bypass
              </label>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={effectivePolicyRoles.includes("ADMIN")}
                  onChange={() => togglePolicyRole("ADMIN")}
                />
                Allow ADMIN role
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={effectivePolicyRoles.includes("SUPER_ADMIN")}
                  onChange={() => togglePolicyRole("SUPER_ADMIN")}
                />
                Allow SUPER_ADMIN role
              </label>
            </div>

            <input
              aria-label="Allowed rollout countries"
              value={effectivePolicyCountries}
              onChange={(event) => {
                beginPolicyEdit();
                setPolicyCountries(event.target.value.toUpperCase());
              }}
              placeholder="Allowed countries (comma-separated, e.g. IN, US, AE)"
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />

            <textarea
              aria-label="Rollout blocked message"
              value={effectivePolicyBlockedMessage}
              onChange={(event) => {
                beginPolicyEdit();
                setPolicyBlockedMessage(event.target.value);
              }}
              rows={2}
              placeholder="Blocked message shown to out-of-rollout admins"
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />

            <input
              aria-label="Rollout update reason"
              value={policyReason}
              onChange={(event) => {
                setPolicyTouched(true);
                setPolicyReason(event.target.value);
              }}
              placeholder="Reason for rollout policy update"
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSaveRolloutPolicy()}
                disabled={updateRolloutPolicyMutation.isPending}
                className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {updateRolloutPolicyMutation.isPending ? "Saving Policy..." : "Save Rollout Policy"}
              </button>
            </div>
          </div>

          {rolloutError ? (
            <p className="mt-2 text-xs text-rose-200">{rolloutError}</p>
          ) : rolloutQuery.isLoading ? (
            <p className="mt-2 text-xs text-zinc-400">Loading rollout policy...</p>
          ) : rolloutData ? (
            <div className="mt-2 space-y-2 text-xs">
              <p className="text-zinc-200">
                Rollout is <span className="font-semibold">{rolloutData.config.enabled ? "ENABLED" : "DISABLED"}</span>.
              </p>
              <p className="text-zinc-400">
                Evaluated context: role {rolloutData.context.evaluatedRole} • country {rolloutData.context.evaluatedCountry ?? "UNKNOWN"}
              </p>
              <p className={rolloutData.evaluation.allowed ? "text-emerald-200" : "text-rose-200"}>
                Decision: {rolloutData.evaluation.allowed ? "ACCESS ALLOWED" : "ACCESS BLOCKED"}
                {rolloutData.evaluation.matchedBypass ? " (super-admin bypass)" : ""}
              </p>
              {rolloutData.evaluation.reasons.length ? (
                <p className="text-rose-200">Reasons: {rolloutData.evaluation.reasons.join(", ")}</p>
              ) : null}
              <p className="text-zinc-500">
                Allowed roles: {rolloutData.config.allowedRoles.length ? rolloutData.config.allowedRoles.join(", ") : "ALL admin roles"}
              </p>
              <p className="text-zinc-500">
                Allowed countries: {rolloutData.config.allowedCountries.length ? rolloutData.config.allowedCountries.join(", ") : "ALL countries"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-zinc-400">Rollout policy unavailable.</p>
          )}
        </article>

        {summaryQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading security summary...</p>
        ) : summaryData ? (
          <div className="space-y-4">
            {breachedAlertCount > 0 ? (
              <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {breachedAlertCount} alert threshold{breachedAlertCount > 1 ? "s" : ""} breached in the selected
                window.
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                All configured queue thresholds are currently healthy.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <QueueCard
                label="Pending Withdrawals"
                status={summaryData.alerts.status.pendingWithdrawals}
              />
              <QueueCard
                label="Action Required Cases"
                status={summaryData.alerts.status.actionRequiredLegalCases}
              />
              <QueueCard
                label="Pending Takedowns"
                status={summaryData.alerts.status.pendingTakedowns}
              />
              <QueueCard
                label="Active Geo-Blocks"
                status={summaryData.alerts.status.activeGeoBlocks}
              />
            </div>

            <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
              <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Monitored Action Alerting</h3>
              <p className="mt-2 text-sm text-zinc-200">
                {summaryData.alerts.status.monitoredActions.count.toLocaleString()} privileged actions in the last{" "}
                {summaryData.windowDays} day{summaryData.windowDays > 1 ? "s" : ""}.
              </p>
              <p
                className={`mt-1 text-xs ${
                  summaryData.alerts.status.monitoredActions.isBreached ? "text-rose-200" : "text-emerald-200"
                }`}
              >
                Threshold {summaryData.alerts.status.monitoredActions.threshold.toLocaleString()} •{" "}
                {summaryData.alerts.status.monitoredActions.isBreached
                  ? `over by ${summaryData.alerts.status.monitoredActions.overBy.toLocaleString()}`
                  : "within expected bounds"}
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
              <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Runbooks</h3>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                {runbookItems.map((runbook) => (
                  <div key={runbook.label} className="rounded-lg border border-white/10 bg-[#111113] px-3 py-2">
                    <p className="text-xs text-zinc-400">{runbook.label}</p>
                    {runbook.href ? (
                      <a
                        href={runbook.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-sky-300 hover:text-sky-200"
                      >
                        Open runbook
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500">Not configured</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Configure runbook URLs with keys: admin.ops.runbook.security, admin.ops.runbook.compliance,
                admin.ops.runbook.finance.
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
              <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Alert Routing Relay</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Dispatch threshold breach payloads to configured channels (`admin.ops.alertWebhook.slack` and
                `admin.ops.alertWebhook.pagerduty`).
              </p>

              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={dispatchChannels.includes("SLACK")}
                    onChange={() => toggleDispatchChannel("SLACK")}
                  />
                  Slack
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={dispatchChannels.includes("PAGERDUTY")}
                    onChange={() => toggleDispatchChannel("PAGERDUTY")}
                  />
                  PagerDuty
                </label>
              </div>

              <label className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={dispatchDryRun}
                  onChange={(event) => setDispatchDryRun(event.target.checked)}
                />
                Dry-run only (no outbound webhook request)
              </label>

              <input
                aria-label="Alert dispatch reason"
                value={dispatchReason}
                onChange={(event) => setDispatchReason(event.target.value)}
                placeholder="Dispatch reason"
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#111113] px-3 py-2 text-xs text-zinc-100"
              />

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleDispatchSecurityAlerts()}
                  disabled={dispatchAlertsMutation.isPending}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-40"
                >
                  {dispatchAlertsMutation.isPending ? "Dispatching..." : "Dispatch Alerts"}
                </button>
              </div>

              {dispatchResultNotice ? (
                <p className="mt-2 text-xs text-zinc-400">{dispatchResultNotice}</p>
              ) : null}
            </article>

            <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
              <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Weekly Ops Digest Export</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Export queue pressure, privileged action telemetry, and rollout decision events for the selected
                rolling window.
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  Export window: last {windowDays} day{windowDays > 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => void handleExportOpsDigest()}
                  disabled={exportDigestMutation.isPending}
                  className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/20 disabled:opacity-40"
                >
                  {exportDigestMutation.isPending ? "Exporting..." : "Export Digest CSV"}
                </button>
              </div>

              {digestExportNotice ? (
                <p className="mt-2 text-xs text-zinc-400">{digestExportNotice}</p>
              ) : null}
            </article>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Action Breakdown</h3>
                {summaryData.actionBreakdown.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-104 text-left text-xs" aria-label="Action breakdown table">
                      <thead className="text-zinc-500">
                        <tr>
                          <th className="pb-2">Action</th>
                          <th className="pb-2">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.actionBreakdown.map((item) => (
                          <tr key={item.action} className="border-t border-white/5 text-zinc-300">
                            <td className="py-2 pr-2">{item.action}</td>
                            <td className="py-2">{item.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-400">No monitored actions in this window.</p>
                )}
              </article>

              <article className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
                <h3 className="text-xs uppercase tracking-[0.13em] text-zinc-500">Top Admin Activity</h3>
                {summaryData.topAdmins.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-104 text-left text-xs" aria-label="Top admin activity table">
                      <thead className="text-zinc-500">
                        <tr>
                          <th className="pb-2">Admin</th>
                          <th className="pb-2">Role</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.topAdmins.map((item) => (
                          <tr key={item.admin.id} className="border-t border-white/5 text-zinc-300">
                            <td className="py-2 pr-2">
                              <p>{item.admin.name}</p>
                              <p className="text-zinc-500">@{item.admin.username}</p>
                            </td>
                            <td className="py-2 pr-2">{item.admin.role}</td>
                            <td className="py-2">{item.actionCount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-400">No operator activity for this window.</p>
                )}
              </article>
            </div>

            <p className="text-xs text-zinc-500">Generated at: {formatDateTime(summaryData.generatedAt)}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Security summary is not available.</p>
        )}
      </section>
    </div>
  );
}
