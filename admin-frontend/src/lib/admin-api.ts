export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  image: string | null;
  role: "USER" | "CREATOR" | "ADMIN" | "SUPER_ADMIN";
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

export type CreatorApplicationStatus =
  | "DRAFT"
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type ReportStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "DISMISSED";

export type StreamReportStatus =
  | "PENDING"
  | "REVIEWED"
  | "RESOLVED"
  | "DISMISSED";

export type PurchaseStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type WithdrawalStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "ON_HOLD"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

export type AdCampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type AnalyticsScope = "GROWTH" | "FINANCE" | "ALL";
export type AnalyticsScopeAssignment = Exclude<AnalyticsScope, "ALL">;
export type ComplianceScope =
  | "LEGAL_CASES"
  | "TAKEDOWNS"
  | "GEOBLOCKS"
  | "SETTINGS"
  | "AUDIT"
  | "EXPORTS";

export type LegalCaseType =
  | "COPYRIGHT"
  | "PLATFORM_POLICY"
  | "REGULATORY"
  | "PRIVACY"
  | "FRAUD"
  | "OTHER";

export type LegalCaseStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "RESOLVED"
  | "CLOSED";

export type TakedownReason =
  | "COPYRIGHT"
  | "LEGAL_ORDER"
  | "PLATFORM_POLICY"
  | "SAFETY"
  | "FRAUD"
  | "OTHER";

export type TakedownStatus =
  | "PENDING"
  | "EXECUTED"
  | "APPEALED"
  | "REVERSED"
  | "REJECTED";

export type GeoBlockReason =
  | "LEGAL"
  | "LICENSING"
  | "REGULATORY"
  | "SAFETY"
  | "OTHER";

export type GeoBlockStatus = "ACTIVE" | "DISABLED";

export type AnnouncementType =
  | "INFO"
  | "WARNING"
  | "MAINTENANCE"
  | "FEATURE"
  | "PROMOTION";

export type FinanceTransactionType = "PURCHASE" | "GIFT" | "WITHDRAWAL";

export interface DashboardSummary {
  users: {
    total: number;
    suspended: number;
  };
  creators: {
    approved: number;
    pendingApplications: number;
  };
  moderation: {
    pendingReports: number;
    pendingStreamReports: number;
  };
  streaming: {
    activeLiveStreams: number;
  };
  announcements: {
    active: number;
  };
  generatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  username: string;
  image: string | null;
  role: "USER" | "CREATOR" | "ADMIN" | "SUPER_ADMIN";
  isSuspended: boolean;
  suspendedReason: string | null;
  suspensionExpiresAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  creatorApplication: {
    status: CreatorApplicationStatus;
  } | null;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  username: string;
  image: string | null;
  role: "USER" | "CREATOR" | "ADMIN" | "SUPER_ADMIN";
  age: number | null;
  bio: string | null;
  phone: string | null;
  emailVerified: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  suspendedBy: string | null;
  suspendedAt: string | null;
  suspensionExpiresAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  creatorApplication: {
    id: string;
    status: CreatorApplicationStatus;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    rejectionReason: string | null;
  } | null;
  coinWallet: {
    id: string;
    balance: number;
    updatedAt: string;
  } | null;
}

export interface CreatorApplicationListItem {
  id: string;
  status: CreatorApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    image: string | null;
    role: "USER" | "CREATOR" | "ADMIN" | "SUPER_ADMIN";
  };
  identity: {
    idType: string;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
    isVerified: boolean;
  } | null;
  financial: {
    accountHolderName: string;
    ifscCode: string;
    isVerified: boolean;
  } | null;
  profile: {
    profilePictureUrl: string;
    bio: string;
    categories: string[];
  } | null;
}

export interface ModerationReportItem {
  id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolution: string | null;
  createdAt: string;
  streamId: string | null;
  reporter: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  reportedUser: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: UserListItem["role"];
    isSuspended: boolean;
  };
  post: {
    id: string;
    isHidden: boolean;
    content: string | null;
    author: {
      id: string;
      name: string;
      username: string;
    };
  } | null;
  comment: {
    id: string;
    isHidden: boolean;
    content: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
  } | null;
}

export interface ModerationStreamReportItem {
  id: string;
  reason: string;
  description: string | null;
  status: StreamReportStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  stream: {
    id: string;
    title: string;
    isLive: boolean;
    user: {
      id: string;
      name: string;
      username: string;
    };
  };
}

export interface FinanceSummary {
  config: {
    commissionRate: number;
    coinToPaiseRate: number;
  };
  wallets: {
    totalWallets: number;
    totalBalanceCoins: number;
    totalEarnedCoins: number;
    totalSpentCoins: number;
  };
  purchases: {
    completedCount: number;
    completedVolumePaise: number;
    completedCoins: number;
    pendingCount: number;
    failedCount: number;
    stalePendingCount: number;
  };
  gifts: {
    totalTransactions: number;
    totalCoinsMoved: number;
    estimatedCreatorPayoutPaise: number;
  };
  withdrawals: {
    countByStatus: Record<WithdrawalStatus, number>;
    netAmountByStatusPaise: Record<WithdrawalStatus, number>;
    highValuePendingCount: number;
  };
  reconciliation: {
    trackedWithdrawalExposurePaise: number;
    estimatedCreatorPayoutPaise: number;
    gapPaise: number;
  };
  anomalies: {
    count: number;
    stalePendingPurchases: number;
    highValuePendingWithdrawals: number;
  };
  generatedAt: string;
}

export interface FinanceTransactionItem {
  id: string;
  type: FinanceTransactionType;
  status: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  sender?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  receiver?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  package?: {
    id: string;
    name: string;
    coins: number;
  };
  gift?: {
    id: string;
    name: string;
    coinPrice: number;
  };
  stream?: {
    id: string;
    title: string;
  } | null;
  amountPaise?: number;
  totalCoins?: number;
  coinAmount?: number;
  orderId?: string;
  transactionId?: string | null;
  failureReason?: string | null;
  quantity?: number;
  message?: string | null;
  payoutReference?: string | null;
  reason?: string | null;
}

export interface FinanceTransactionListResponse {
  type: FinanceTransactionType;
  items: FinanceTransactionItem[];
  pagination: PaginationMeta;
}

export interface FinanceWithdrawalItem {
  id: string;
  userId: string;
  amountCoins: number;
  coinToPaiseRate: number;
  grossAmountPaise: number;
  platformFeePaise: number;
  netAmountPaise: number;
  status: WithdrawalStatus;
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  payoutReference: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  reviewer: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
}

export interface FinanceReconciliationSummary {
  period: {
    from: string | null;
    to: string | null;
  };
  config: {
    commissionRate: number;
    coinToPaiseRate: number;
  };
  purchases: {
    completedCount: number;
    completedVolumePaise: number;
    completedCoins: number;
  };
  creatorEconomy: {
    giftTransactions: number;
    totalGiftCoins: number;
    estimatedCreatorPayoutPaise: number;
  };
  withdrawals: {
    netAmountByStatusPaise: Record<WithdrawalStatus, number>;
    pendingSettlementPaise: number;
    approvedNotPaidPaise: number;
    paidOutPaise: number;
  };
  reconciliation: {
    trackedExposurePaise: number;
    estimatedCreatorPayoutPaise: number;
    gapPaise: number;
  };
  generatedAt: string;
}

export interface AdCampaignListItem {
  id: string;
  name: string;
  objective: string | null;
  status: AdCampaignStatus;
  startAt: string | null;
  endAt: string | null;
  dailyBudgetPaise: number | null;
  totalBudgetPaise: number | null;
  spendPaise: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  analytics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spendPaise: number;
    ctrPercent: number;
    conversionPercent: number;
    cpmInr: number;
    alerts: {
      isLowCtr: boolean;
      isOverspend: boolean;
      budgetUtilizationPercent: number | null;
      lowCtrThresholdPercent: number;
      lowCtrMinImpressions: number;
      overspendThresholdPercent: number;
    };
  };
}

export interface AdCampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    objective: string | null;
    status: AdCampaignStatus;
    startAt: string | null;
    endAt: string | null;
    dailyBudgetPaise: number | null;
    totalBudgetPaise: number | null;
    spendPaise: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  access: {
    grantedScopes: Array<Exclude<AnalyticsScope, "ALL">>;
  };
  period: {
    from: string | null;
    to: string | null;
  };
  summary: {
    impressions: number;
    clicks: number;
    conversions: number;
    spendPaise: number;
    ctrPercent: number;
    conversionPercent: number;
    cpmInr: number;
    alerts: {
      isLowCtr: boolean;
      isOverspend: boolean;
      budgetUtilizationPercent: number | null;
      lowCtrThresholdPercent: number;
      lowCtrMinImpressions: number;
      overspendThresholdPercent: number;
    };
  };
  dailyMetrics: Array<{
    bucketDate: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spendPaise: number;
  }>;
  generatedAt: string;
}

export interface FounderKpiSummary {
  period: {
    from: string | null;
    to: string | null;
  };
  scope: AnalyticsScope;
  access: {
    requiredScopes: Array<Exclude<AnalyticsScope, "ALL">>;
    grantedScopes: Array<Exclude<AnalyticsScope, "ALL">>;
  };
  users: {
    dau: number;
    mau: number;
  } | null;
  campaigns: {
    activeCount: number;
    byStatus: Record<AdCampaignStatus, number>;
  } | null;
  advertising: {
    impressions: number;
    clicks: number;
    conversions: number;
    spendPaise: number;
    ctrPercent: number;
    conversionPercent: number;
    cpmInr: number;
  } | null;
  monetization: {
    completedPurchases: number;
    revenuePaise: number;
    adSpendPaise: number;
    revenueToAdSpendRatio: number | null;
  } | null;
  alerts: {
    thresholds: {
      lowCtrPercent: number;
      lowCtrMinImpressions: number;
      overspendPercent: number;
    };
    totals: {
      overspendCampaigns: number;
      lowCtrCampaigns: number;
      totalAlerts: number;
    };
    items: Array<{
      type: "LOW_CTR" | "OVERSPEND";
      campaignId: string;
      campaignName: string;
      status: AdCampaignStatus;
      ctrPercent: number;
      budgetUtilizationPercent: number | null;
      impressions: number;
      spendPaise: number;
      message: string;
    }>;
  } | null;
  generatedAt: string;
}

export interface LegalCaseRecord {
  id: string;
  referenceCode: string;
  title: string;
  description: string | null;
  caseType: LegalCaseType;
  status: LegalCaseStatus;
  priority: number;
  targetType: string;
  targetId: string;
  requestedBy: string | null;
  assignedTo: string | null;
  createdBy: string;
  resolvedBy: string | null;
  resolutionNote: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LegalCaseListItem extends LegalCaseRecord {
  _count: {
    takedowns: number;
  };
}

export interface TakedownRecord {
  id: string;
  legalCaseId: string | null;
  targetType: string;
  targetId: string;
  reason: TakedownReason;
  status: TakedownStatus;
  note: string | null;
  executionNote: string | null;
  appealNote: string | null;
  requestedBy: string;
  executedBy: string | null;
  reversedBy: string | null;
  requestedAt: string;
  executedAt: string | null;
  appealedAt: string | null;
  reversedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TakedownListItem extends TakedownRecord {
  legalCase: {
    id: string;
    referenceCode: string;
    status: LegalCaseStatus;
  } | null;
}

export interface LegalCaseDetail extends LegalCaseRecord {
  takedowns: TakedownRecord[];
}

export interface GeoBlockRuleItem {
  id: string;
  targetType: string;
  targetId: string;
  countryCode: string;
  reason: GeoBlockReason;
  status: GeoBlockStatus;
  note: string | null;
  createdBy: string;
  updatedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettingItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

export interface SystemSettingVersionItem {
  id: string;
  settingKey: string;
  previousValue: string | null;
  newValue: string;
  previousIsPublic: boolean | null;
  newIsPublic: boolean;
  changeReason: string | null;
  changedBy: string;
  rollbackOfVersionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SettingRollbackResult {
  key: string;
  value?: string;
  deleted?: boolean;
  isPublic?: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  targetRole: AdminProfile["role"] | null;
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAuditItem {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  affectedUserId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    username: string;
    role: AdminProfile["role"];
  };
  affectedUser: {
    id: string;
    name: string;
    username: string;
    role: AdminProfile["role"];
  } | null;
}

export interface AdminPermissionItem {
  admin: {
    id: string;
    name: string;
    email: string;
    username: string;
    role: AdminProfile["role"];
    createdAt: string;
    lastLoginAt: string | null;
  };
  analyticsScopes: AnalyticsScopeAssignment[];
  complianceScopes: ComplianceScope[];
  source: {
    analytics: "configured" | "default";
    compliance: "configured" | "default";
  };
  updatedAt?: string;
}

export interface AdminSecuritySummary {
  windowDays: number;
  queues: {
    pendingWithdrawals: number;
    actionRequiredLegalCases: number;
    pendingTakedowns: number;
    activeGeoBlocks: number;
  };
  actionBreakdown: Array<{
    action: string;
    count: number;
  }>;
  topAdmins: Array<{
    admin: {
      id: string;
      name: string;
      username: string;
      role: AdminProfile["role"];
    };
    actionCount: number;
  }>;
  generatedAt: string;
}

export interface ComplianceAuditExportTokenResult {
  token: string;
  downloadPath: string;
  expiresAt: string;
  estimatedRows: number;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

interface SuspensionPayload {
  isSuspended: boolean;
  reason?: string;
  suspensionExpiresAt?: string | null;
}

interface CreatorDecisionResponse {
  id: string;
  status: CreatorApplicationStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  userId: string;
}

interface ModerationReportReviewResponse {
  id: string;
  status: ReportStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolution: string | null;
}

interface ModerationStreamReportReviewResponse {
  id: string;
  status: StreamReportStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function requestJson<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    const error =
      "error" in body
        ? body.error
        : `Request failed with status ${response.status}`;
    return {
      success: false,
      error,
    };
  }

  return body;
}

async function requestCsv(
  path: string,
  fallbackFileName = "campaign-analytics.csv",
): Promise<ApiResponse<{ blob: Blob; fileName: string }>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "text/csv",
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as ApiFailure;
      if ("error" in body && body.error) {
        errorMessage = body.error;
      }
    } catch {
      // Keep fallback error message when response is not JSON.
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] ?? fallbackFileName;
  const blob = await response.blob();

  return {
    success: true,
    data: {
      blob,
      fileName,
    },
  };
}

function buildQuery(
  query: Record<string, string | number | boolean | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getAdminMe() {
  return requestJson<AdminProfile>("/api/admin/me");
}

export async function getAdminDashboardSummary() {
  return requestJson<DashboardSummary>("/api/admin/dashboard/summary");
}

export async function listAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserListItem["role"];
  isSuspended?: boolean;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    role: params.role,
    isSuspended: params.isSuspended,
  });

  return requestJson<PaginatedResponse<UserListItem>>(
    `/api/admin/users${query}`,
  );
}

export async function getAdminUserDetail(userId: string) {
  return requestJson<UserDetail>(`/api/admin/users/${userId}`);
}

export async function updateAdminUserSuspension(
  userId: string,
  payload: SuspensionPayload,
) {
  return requestJson<UserDetail>(`/api/admin/users/${userId}/suspension`, {
    method: "PATCH",
    body: payload,
  });
}

export async function listCreatorApplications(params: {
  page?: number;
  limit?: number;
  status?: CreatorApplicationStatus;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
  });

  return requestJson<PaginatedResponse<CreatorApplicationListItem>>(
    `/api/admin/creators/applications${query}`,
  );
}

export async function approveCreatorApplication(applicationId: string) {
  return requestJson<CreatorDecisionResponse>(
    `/api/admin/creators/applications/${applicationId}/approve`,
    {
      method: "POST",
    },
  );
}

export async function rejectCreatorApplication(
  applicationId: string,
  reason: string,
) {
  return requestJson<CreatorDecisionResponse>(
    `/api/admin/creators/applications/${applicationId}/reject`,
    {
      method: "POST",
      body: { reason },
    },
  );
}

export async function listModerationReports(params: {
  page?: number;
  limit?: number;
  status?: ReportStatus;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
  });

  return requestJson<PaginatedResponse<ModerationReportItem>>(
    `/api/admin/moderation/reports${query}`,
  );
}

export async function reviewModerationReport(
  reportId: string,
  payload: {
    decision:
      | "DISMISS"
      | "RESOLVE"
      | "HIDE_POST"
      | "HIDE_COMMENT"
      | "SUSPEND_REPORTED_USER";
    resolution?: string;
    suspensionExpiresAt?: string | null;
  },
) {
  return requestJson<ModerationReportReviewResponse>(
    `/api/admin/moderation/reports/${reportId}/review`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function listModerationStreamReports(params: {
  page?: number;
  limit?: number;
  status?: StreamReportStatus;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
  });

  return requestJson<PaginatedResponse<ModerationStreamReportItem>>(
    `/api/admin/moderation/stream-reports${query}`,
  );
}

export async function reviewModerationStreamReport(
  streamReportId: string,
  payload: {
    status: StreamReportStatus;
    resolution?: string;
  },
) {
  return requestJson<ModerationStreamReportReviewResponse>(
    `/api/admin/moderation/stream-reports/${streamReportId}/review`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function getFinanceSummary() {
  return requestJson<FinanceSummary>("/api/admin/finance/summary");
}

export async function listFinanceTransactions(params: {
  page?: number;
  limit?: number;
  type?: FinanceTransactionType;
  status?: string;
  search?: string;
  userId?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    type: params.type,
    status: params.status,
    search: params.search,
    userId: params.userId,
  });

  return requestJson<FinanceTransactionListResponse>(
    `/api/admin/finance/transactions${query}`,
  );
}

export async function listFinanceWithdrawals(params: {
  page?: number;
  limit?: number;
  status?: WithdrawalStatus;
  search?: string;
  userId?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    search: params.search,
    userId: params.userId,
  });

  return requestJson<PaginatedResponse<FinanceWithdrawalItem>>(
    `/api/admin/finance/withdrawals${query}`,
  );
}

export async function reviewFinanceWithdrawal(
  withdrawalId: string,
  payload: {
    decision: "APPROVE" | "REJECT" | "HOLD" | "RELEASE_HOLD" | "MARK_PAID";
    reason?: string;
    payoutReference?: string;
  },
) {
  return requestJson<FinanceWithdrawalItem>(
    `/api/admin/finance/withdrawals/${withdrawalId}/review`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function getFinanceCommissionConfig() {
  return requestJson<{ commissionRate: number; coinToPaiseRate: number }>(
    "/api/admin/finance/config/commission",
  );
}

export async function updateFinanceCommissionConfig(payload: {
  commissionRate: number;
  coinToPaiseRate: number;
}) {
  return requestJson<{ commissionRate: number; coinToPaiseRate: number }>(
    "/api/admin/finance/config/commission",
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function getFinanceReconciliation(params?: {
  from?: string;
  to?: string;
}) {
  const query = buildQuery({
    from: params?.from,
    to: params?.to,
  });

  return requestJson<FinanceReconciliationSummary>(
    `/api/admin/finance/reconciliation${query}`,
  );
}

export async function listAdCampaigns(params: {
  page?: number;
  limit?: number;
  status?: AdCampaignStatus;
  search?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    search: params.search,
  });

  return requestJson<PaginatedResponse<AdCampaignListItem>>(
    `/api/admin/ads/campaigns${query}`,
  );
}

export async function createAdCampaign(payload: {
  name: string;
  objective?: string;
  startAt?: string;
  endAt?: string;
  dailyBudgetPaise?: number;
  totalBudgetPaise?: number;
  targeting?: Record<string, unknown>;
  deliveryConfig?: Record<string, unknown>;
}) {
  return requestJson<AdCampaignListItem>("/api/admin/ads/campaigns", {
    method: "POST",
    body: payload,
  });
}

export async function updateAdCampaignStatus(
  campaignId: string,
  payload: {
    status: AdCampaignStatus;
    reason?: string;
  },
) {
  return requestJson<AdCampaignListItem>(
    `/api/admin/ads/campaigns/${campaignId}/status`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function getAdCampaignAnalytics(
  campaignId: string,
  params?: {
    from?: string;
    to?: string;
  },
) {
  const query = buildQuery({
    from: params?.from,
    to: params?.to,
  });

  return requestJson<AdCampaignAnalytics>(
    `/api/admin/ads/campaigns/${campaignId}/analytics${query}`,
  );
}

export async function exportAdCampaignAnalyticsCsv(
  campaignId: string,
  params?: {
    from?: string;
    to?: string;
  },
) {
  const query = buildQuery({
    from: params?.from,
    to: params?.to,
  });

  return requestCsv(`/api/admin/ads/campaigns/${campaignId}/analytics/export${query}`);
}

export async function getFounderKpiSummary(params?: {
  from?: string;
  to?: string;
  scope?: AnalyticsScope;
}) {
  const query = buildQuery({
    from: params?.from,
    to: params?.to,
    scope: params?.scope,
  });

  return requestJson<FounderKpiSummary>(`/api/admin/ads/kpis/summary${query}`);
}

export async function listAdminPermissions(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: Extract<AdminProfile["role"], "ADMIN" | "SUPER_ADMIN">;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    role: params.role,
  });

  return requestJson<PaginatedResponse<AdminPermissionItem>>(
    `/api/admin/permissions/admin-scopes${query}`,
  );
}

export async function updateAdminPermissions(
  adminId: string,
  payload: {
    analyticsScopes?: AnalyticsScopeAssignment[];
    complianceScopes?: ComplianceScope[];
    reason: string;
  },
) {
  return requestJson<{
    admin: AdminPermissionItem["admin"];
    analyticsScopes: AnalyticsScopeAssignment[];
    complianceScopes: ComplianceScope[];
    updatedBy: string;
    updatedAt: string;
  }>(`/api/admin/permissions/admin-scopes/${adminId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function getAdminSecuritySummary(params?: { days?: number }) {
  const query = buildQuery({
    days: params?.days,
  });

  return requestJson<AdminSecuritySummary>(`/api/admin/ops/security-summary${query}`);
}

export async function listLegalCases(params: {
  page?: number;
  limit?: number;
  status?: LegalCaseStatus;
  caseType?: LegalCaseType;
  search?: string;
  assignedTo?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    caseType: params.caseType,
    search: params.search,
    assignedTo: params.assignedTo,
  });

  return requestJson<PaginatedResponse<LegalCaseListItem>>(
    `/api/admin/compliance/legal-cases${query}`,
  );
}

export async function createLegalCase(payload: {
  title: string;
  description?: string;
  caseType: LegalCaseType;
  priority?: number;
  targetType: string;
  targetId: string;
  requestedBy?: string;
  assignedTo?: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}) {
  return requestJson<LegalCaseRecord>("/api/admin/compliance/legal-cases", {
    method: "POST",
    body: payload,
  });
}

export async function getLegalCaseDetail(legalCaseId: string) {
  return requestJson<LegalCaseDetail>(
    `/api/admin/compliance/legal-cases/${legalCaseId}`,
  );
}

export async function updateLegalCase(
  legalCaseId: string,
  payload: {
    status?: LegalCaseStatus;
    assignedTo?: string | null;
    priority?: number;
    resolutionNote?: string;
    dueAt?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  return requestJson<LegalCaseRecord>(
    `/api/admin/compliance/legal-cases/${legalCaseId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function listTakedowns(params: {
  page?: number;
  limit?: number;
  status?: TakedownStatus;
  reason?: TakedownReason;
  search?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    reason: params.reason,
    search: params.search,
  });

  return requestJson<PaginatedResponse<TakedownListItem>>(
    `/api/admin/compliance/takedowns${query}`,
  );
}

export async function createTakedown(payload: {
  legalCaseId?: string;
  targetType: string;
  targetId: string;
  reason: TakedownReason;
  note?: string;
  metadata?: Record<string, unknown>;
}) {
  return requestJson<TakedownListItem>("/api/admin/compliance/takedowns", {
    method: "POST",
    body: payload,
  });
}

export async function applyTakedownAction(
  takedownId: string,
  payload: {
    action: "EXECUTE" | "APPEAL" | "REVERSE" | "REJECT";
    note?: string;
  },
) {
  return requestJson<TakedownRecord>(
    `/api/admin/compliance/takedowns/${takedownId}/action`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function listGeoBlocks(params: {
  page?: number;
  limit?: number;
  status?: GeoBlockStatus;
  reason?: GeoBlockReason;
  countryCode?: string;
  targetType?: string;
  search?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: params.status,
    reason: params.reason,
    countryCode: params.countryCode,
    targetType: params.targetType,
    search: params.search,
  });

  return requestJson<PaginatedResponse<GeoBlockRuleItem>>(
    `/api/admin/compliance/geoblocks${query}`,
  );
}

export async function createGeoBlock(payload: {
  targetType: string;
  targetId: string;
  countryCode: string;
  reason: GeoBlockReason;
  note?: string;
  expiresAt?: string;
}) {
  return requestJson<GeoBlockRuleItem>("/api/admin/compliance/geoblocks", {
    method: "POST",
    body: payload,
  });
}

export async function updateGeoBlock(
  geoBlockId: string,
  payload: {
    status?: GeoBlockStatus;
    reason?: GeoBlockReason;
    note?: string;
    expiresAt?: string | null;
  },
) {
  return requestJson<GeoBlockRuleItem>(
    `/api/admin/compliance/geoblocks/${geoBlockId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function removeGeoBlock(geoBlockId: string) {
  return requestJson<{ id: string }>(
    `/api/admin/compliance/geoblocks/${geoBlockId}`,
    {
      method: "DELETE",
    },
  );
}

export async function listSystemSettings(params: {
  page?: number;
  limit?: number;
  search?: string;
  includePublic?: boolean;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    includePublic: params.includePublic,
  });

  return requestJson<PaginatedResponse<SystemSettingItem>>(
    `/api/admin/settings/system${query}`,
  );
}

export async function updateSystemSetting(
  settingKey: string,
  payload: {
    value: string;
    isPublic?: boolean;
    reason: string;
    metadata?: Record<string, unknown>;
  },
) {
  return requestJson<SystemSettingItem>(
    `/api/admin/settings/system/${encodeURIComponent(settingKey)}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function getSystemSettingHistory(settingKey: string) {
  return requestJson<{ items: SystemSettingVersionItem[] }>(
    `/api/admin/settings/system/${encodeURIComponent(settingKey)}/history`,
  );
}

export async function rollbackSystemSetting(payload: {
  versionId: string;
  reason: string;
}) {
  return requestJson<SettingRollbackResult>("/api/admin/settings/system/rollback", {
    method: "POST",
    body: payload,
  });
}

export async function listAnnouncements(params: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: AnnouncementType;
  search?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    isActive: params.isActive,
    type: params.type,
    search: params.search,
  });

  return requestJson<PaginatedResponse<AnnouncementItem>>(
    `/api/admin/settings/announcements${query}`,
  );
}

export async function createAnnouncement(payload: {
  title: string;
  content: string;
  type?: AnnouncementType;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  targetRole?: AdminProfile["role"] | null;
  isPinned?: boolean;
}) {
  return requestJson<AnnouncementItem>("/api/admin/settings/announcements", {
    method: "POST",
    body: payload,
  });
}

export async function updateAnnouncement(
  announcementId: string,
  payload: {
    title?: string;
    content?: string;
    type?: AnnouncementType;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    targetRole?: AdminProfile["role"] | null;
    isPinned?: boolean;
  },
) {
  return requestJson<AnnouncementItem>(
    `/api/admin/settings/announcements/${announcementId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function deleteAnnouncement(announcementId: string) {
  return requestJson<{ id: string }>(
    `/api/admin/settings/announcements/${announcementId}`,
    {
      method: "DELETE",
    },
  );
}

export async function listComplianceAuditHistory(params: {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  search?: string;
}) {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    action: params.action,
    targetType: params.targetType,
    search: params.search,
  });

  return requestJson<PaginatedResponse<ComplianceAuditItem>>(
    `/api/admin/compliance/audit-history${query}`,
  );
}

export async function generateComplianceAuditExport(payload: {
  action?: string;
  targetType?: string;
  search?: string;
  from?: string;
  to?: string;
  expiresInMinutes?: number;
}) {
  return requestJson<ComplianceAuditExportTokenResult>(
    "/api/admin/compliance/audit-history/export",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function downloadComplianceAuditExport(token: string) {
  const query = buildQuery({ token });
  return requestCsv(
    `/api/admin/compliance/audit-history/export/download${query}`,
    "compliance-audit-export.csv",
  );
}
