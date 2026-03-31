export function formatDateTime(value: string | null): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}
