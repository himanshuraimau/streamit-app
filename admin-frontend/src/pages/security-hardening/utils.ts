export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getResponseErrorMessage(
  response: { success: boolean; error?: string } | undefined,
  error: unknown,
  fallback: string,
) {
  if (response && !response.success) {
    return response.error ?? fallback;
  }

  if (error) {
    return getErrorMessage(error, fallback);
  }

  return null;
}

export function validateRolloutPolicy(
  enabled: boolean,
  superAdminBypass: boolean,
  allowedRoles: Array<"ADMIN" | "SUPER_ADMIN">,
  blockedMessage: string,
  reason: string,
) {
  if (blockedMessage.trim().length < 10) {
    return "Blocked message must be at least 10 characters.";
  }

  if (reason.trim().length < 3) {
    return "Reason must be at least 3 characters.";
  }

  if (enabled && !superAdminBypass && !allowedRoles.includes("SUPER_ADMIN")) {
    return "Unsafe policy: SUPER_ADMIN must remain allowed when bypass is disabled.";
  }

  return null;
}

export function validateDispatchAlerts(
  reason: string,
  channels: Array<"SLACK" | "PAGERDUTY">,
) {
  if (reason.trim().length < 3) {
    return "Dispatch reason must be at least 3 characters.";
  }

  if (!channels.length) {
    return "Select at least one dispatch channel.";
  }

  return null;
}

export function parseCountryCodes(input: string): string[] {
  return [
    ...new Set(
      input
        .split(",")
        .map((country) => country.trim().toUpperCase())
        .filter((country) => /^[A-Z]{2}$/.test(country)),
    ),
  ];
}
