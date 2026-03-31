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

export function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function validateSettingForm(
  settingKey: string,
  value: string,
  reason: string,
) {
  if (settingKey.trim().length < 1) {
    return "Setting key is required.";
  }

  if (value.length < 1) {
    return "Setting value is required.";
  }

  if (reason.trim().length < 3) {
    return "Reason must be at least 3 characters.";
  }

  return null;
}

export function validateRollbackReason(reason: string) {
  if (reason.trim().length < 3) {
    return "Rollback reason must be at least 3 characters.";
  }

  return null;
}

export function validateAnnouncementForm(title: string, content: string) {
  if (title.trim().length < 3) {
    return "Announcement title must be at least 3 characters.";
  }

  if (content.trim().length < 5) {
    return "Announcement content must be at least 5 characters.";
  }

  return null;
}
