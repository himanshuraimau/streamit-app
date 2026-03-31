import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  dispatchAdminSecurityAlerts,
  exportAdminSecurityOpsDigestCsv,
  getAdminRolloutStatus,
  getAdminSecuritySummary,
  updateAdminRolloutPolicy,
} from "@/lib/admin-api";
import { useFileExport } from "@/hooks/useFileExport";

import { DEFAULT_ROLLOUT_BLOCKED_MESSAGE } from "./constants";
import type { RolloutPolicyDialogState, SecurityNoticeState } from "./types";
import {
  getErrorMessage,
  getResponseErrorMessage,
  parseCountryCodes,
  validateDispatchAlerts,
  validateRolloutPolicy,
} from "./utils";

export function useSecurityHardeningPageController() {
  const queryClient = useQueryClient();
  const { downloadFile } = useFileExport();

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
  const [policyTouched, setPolicyTouched] = useState(false);

  const [dispatchNotice, setDispatchNotice] = useState<SecurityNoticeState | null>(null);
  const [digestNotice, setDigestNotice] = useState<SecurityNoticeState | null>(null);
  const [policyDialog, setPolicyDialog] = useState<RolloutPolicyDialogState | null>(null);

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
  const rolloutData =
    rolloutQuery.data && rolloutQuery.data.success ? rolloutQuery.data.data : null;

  const summaryError = getResponseErrorMessage(
    summaryQuery.data,
    summaryQuery.error,
    "Security summary is unavailable.",
  );
  const rolloutError = getResponseErrorMessage(
    rolloutQuery.data,
    rolloutQuery.error,
    "Rollout status is unavailable.",
  );

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

  const openRolloutPolicyDialog = () => {
    const allowedCountries = parseCountryCodes(effectivePolicyCountries);

    setPolicyDialog({
      enabled: effectivePolicyEnabled,
      superAdminBypass: effectivePolicySuperAdminBypass,
      allowedRoles: effectivePolicyRoles,
      allowedCountries,
      blockedMessage: effectivePolicyBlockedMessage,
      reason: policyReason,
      error: null,
    });
  };

  const closePolicyDialog = (open: boolean) => {
    if (!open && !updateRolloutPolicyMutation.isPending) {
      setPolicyDialog(null);
    }
  };

  const handleConfirmRolloutPolicy = async () => {
    if (!policyDialog) {
      return;
    }

    const validationError = validateRolloutPolicy(
      policyDialog.enabled,
      policyDialog.superAdminBypass,
      policyDialog.allowedRoles,
      policyDialog.blockedMessage,
      policyDialog.reason,
    );

    if (validationError) {
      setPolicyDialog((current) =>
        current
          ? {
              ...current,
              error: validationError,
            }
          : current,
      );
      return;
    }

    try {
      const response = await updateRolloutPolicyMutation.mutateAsync({
        enabled: policyDialog.enabled,
        superAdminBypass: policyDialog.superAdminBypass,
        allowedRoles: policyDialog.allowedRoles,
        allowedCountries: policyDialog.allowedCountries,
        blockedMessage: policyDialog.blockedMessage.trim(),
        reason: policyDialog.reason.trim(),
      });

      if (!response.success) {
        setPolicyDialog((current) =>
          current
            ? {
                ...current,
                error: response.error,
              }
            : current,
        );
        return;
      }

      setPolicyDialog(null);
      setPolicyTouched(false);
    } catch (error) {
      setPolicyDialog((current) =>
        current
          ? {
              ...current,
              error: getErrorMessage(
                error,
                "Something went wrong while updating the rollout policy.",
              ),
            }
          : current,
      );
    }
  };

  const handleDispatchSecurityAlerts = async () => {
    setDispatchNotice(null);

    const validationError = validateDispatchAlerts(dispatchReason, dispatchChannels);

    if (validationError) {
      setDispatchNotice({
        tone: "error",
        title: "Unable to dispatch alerts",
        description: validationError,
      });
      return;
    }

    try {
      const response = await dispatchAlertsMutation.mutateAsync({
        days: windowDays,
        dryRun: dispatchDryRun,
        channels: dispatchChannels,
        reason: dispatchReason.trim(),
      });

      if (!response.success) {
        setDispatchNotice({
          tone: "error",
          title: "Unable to dispatch alerts",
          description: response.error,
        });
        return;
      }

      const deliverySummary = response.data.deliveries
        .map((delivery) => `${delivery.channel}: ${delivery.status}`)
        .join(" | ");
      setDispatchNotice({
        tone: "success",
        title: "Alerts dispatched",
        description: `Dispatch ${response.data.dryRun ? "dry-run" : "live"} complete. Breached metrics: ${response.data.breachedMetrics.join(", ") || "none"}. ${deliverySummary}`,
      });
    } catch (error) {
      setDispatchNotice({
        tone: "error",
        title: "Unable to dispatch alerts",
        description: getErrorMessage(
          error,
          "Something went wrong while dispatching alerts.",
        ),
      });
    }
  };

  const handleExportOpsDigest = async () => {
    setDigestNotice(null);

    try {
      const response = await exportDigestMutation.mutateAsync({
        days: windowDays,
      });

      if (!response.success) {
        setDigestNotice({
          tone: "error",
          title: "Unable to export digest",
          description: response.error,
        });
        return;
      }

      downloadFile(response.data.blob, response.data.fileName);
      setDigestNotice({
        tone: "success",
        title: "Digest exported",
        description: `Ops digest exported for the last ${windowDays} day${windowDays > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      setDigestNotice({
        tone: "error",
        title: "Unable to export digest",
        description: getErrorMessage(
          error,
          "Something went wrong while exporting the digest.",
        ),
      });
    }
  };

  return {
    summarySection: {
      windowDays,
      summaryData,
      breachedAlertCount,
      isLoading: summaryQuery.isLoading,
      errorMessage: summaryError,
      onWindowDaysChange: setWindowDays,
      onRefresh: () => {
        void queryClient.invalidateQueries({ queryKey: ["admin", "phase7", "security-summary"] });
        void queryClient.invalidateQueries({ queryKey: ["admin", "phase7", "rollout-status"] });
      },
    },
    rolloutSection: {
      simulatedRole,
      simulatedCountry,
      rolloutData,
      rolloutError,
      isLoading: rolloutQuery.isLoading,
      onSimulatedRoleChange: setSimulatedRole,
      onSimulatedCountryChange: (value: string) =>
        setSimulatedCountry(value.toUpperCase()),
      onResetSimulation: () => {
        setSimulatedRole("");
        setSimulatedCountry("");
      },
    },
    policyEditorSection: {
      effectivePolicyEnabled,
      effectivePolicySuperAdminBypass,
      effectivePolicyRoles,
      effectivePolicyCountries,
      effectivePolicyBlockedMessage,
      policyReason,
      policyTouched,
      isSubmitting: updateRolloutPolicyMutation.isPending,
      onEnabledChange: (value: boolean) => {
        beginPolicyEdit();
        setPolicyEnabled(value);
      },
      onSuperAdminBypassChange: (value: boolean) => {
        beginPolicyEdit();
        setPolicySuperAdminBypass(value);
      },
      onToggleRole: togglePolicyRole,
      onCountriesChange: (value: string) => {
        beginPolicyEdit();
        setPolicyCountries(value.toUpperCase());
      },
      onBlockedMessageChange: (value: string) => {
        beginPolicyEdit();
        setPolicyBlockedMessage(value);
      },
      onReasonChange: (value: string) => {
        setPolicyTouched(true);
        setPolicyReason(value);
      },
      onSave: openRolloutPolicyDialog,
    },
    alertDispatchSection: {
      dispatchChannels,
      dispatchDryRun,
      dispatchReason,
      notice: dispatchNotice,
      isSubmitting: dispatchAlertsMutation.isPending,
      onToggleChannel: toggleDispatchChannel,
      onDryRunChange: setDispatchDryRun,
      onReasonChange: setDispatchReason,
      onDispatch: handleDispatchSecurityAlerts,
    },
    digestExportSection: {
      windowDays,
      notice: digestNotice,
      isExporting: exportDigestMutation.isPending,
      onExport: handleExportOpsDigest,
    },
    policyDialog: {
      dialog: policyDialog,
      isPending: updateRolloutPolicyMutation.isPending,
      onOpenChange: closePolicyDialog,
      onReasonChange: (value: string) =>
        setPolicyDialog((current) =>
          current
            ? {
                ...current,
                reason: value,
                error: null,
              }
            : current,
        ),
      onSubmit: handleConfirmRolloutPolicy,
    },
  };
}
