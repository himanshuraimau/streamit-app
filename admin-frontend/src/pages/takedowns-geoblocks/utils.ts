import type { GeoBlockReason } from "@/lib/admin-api";
import { GEOBLOCK_REASON_OPTIONS } from "./constants";

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

export function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function validateTakedownForm(
  targetType: string,
  targetId: string,
) {
  if (targetType.trim().length < 2) {
    return "Target type must be at least 2 characters.";
  }

  if (targetId.trim().length < 1) {
    return "Target ID is required.";
  }

  return null;
}

export function validateTakedownAction(
  action: "EXECUTE" | "APPEAL" | "REVERSE" | "REJECT",
  note: string,
) {
  const requiresNote = action === "EXECUTE" || action === "REVERSE";

  if (requiresNote && note.trim().length < 3) {
    return "This action requires a note with at least 3 characters.";
  }

  return null;
}

export function validateGeoBlockForm(
  targetType: string,
  targetId: string,
  countryCode: string,
) {
  if (targetType.trim().length < 2) {
    return "Target type must be at least 2 characters.";
  }

  if (targetId.trim().length < 1) {
    return "Target ID is required.";
  }

  if (countryCode.trim().length !== 2) {
    return "Country code must be exactly 2 characters.";
  }

  return null;
}

export function validateGeoBlockReason(reason: string) {
  const validReasons = GEOBLOCK_REASON_OPTIONS.filter((item) => item !== "ALL");

  if (!validReasons.includes(reason.toUpperCase() as GeoBlockReason)) {
    return "Invalid geoblock reason value.";
  }

  return null;
}
