import type { UserListItem } from "./types";

export function roleStyle(role: UserListItem["role"]): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "border-amber-300/40 bg-amber-500/10 text-amber-200";
    case "ADMIN":
      return "border-sky-300/40 bg-sky-500/10 text-sky-200";
    case "CREATOR":
      return "border-emerald-300/40 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-zinc-300/20 bg-zinc-500/10 text-zinc-200";
  }
}

export function formatDateTime(value: string | null): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}
