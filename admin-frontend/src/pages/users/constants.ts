import type { UserListItem } from "./types";

export const USER_ROLES: Array<"ALL" | UserListItem["role"]> = [
  "ALL",
  "USER",
  "CREATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export const SUSPENSION_FILTERS = ["ALL", "ACTIVE", "SUSPENDED"] as const;
