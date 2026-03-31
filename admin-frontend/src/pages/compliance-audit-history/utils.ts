export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

export function formatMetadata(value: Record<string, unknown> | null): string {
  if (!value) return "-";

  const entries = Object.entries(value).slice(0, 4);
  if (!entries.length) return "-";

  return entries
    .map(([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`)
    .join(" | ");
}

export function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}
