import type { AnnouncementType, AdminProfile } from "@/lib/admin-api";

export const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "INFO",
  "WARNING",
  "MAINTENANCE",
  "FEATURE",
  "PROMOTION",
];

export const ROLE_OPTIONS: Array<AdminProfile["role"] | "ALL"> = [
  "ALL",
  "USER",
  "CREATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export type VisibilityFilter = "ALL" | "PUBLIC" | "PRIVATE";
export type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type AnnouncementTypeFilter = AnnouncementType | "ALL";
export type RoleFilter = AdminProfile["role"] | "ALL";
