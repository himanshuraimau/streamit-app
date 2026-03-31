import type { CreatorApplicationStatus } from "./types";

export const APPLICATION_STATUSES: Array<CreatorApplicationStatus | "PENDING_REVIEW"> = [
  "PENDING_REVIEW",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];
