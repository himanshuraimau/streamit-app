import {
  AdCampaignStatus,
  AnnouncementType,
  ApplicationStatus,
  GeoBlockReason,
  GeoBlockStatus,
  LegalCaseStatus,
  LegalCaseType,
  ReportStatus,
  StreamReportStatus,
  TakedownReason,
  TakedownStatus,
  UserRole,
  WithdrawalStatus,
} from '@prisma/client';
import { z } from 'zod';

const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.enum(UserRole).optional(),
  isSuspended: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const adminUpdateSuspensionSchema = z
  .object({
    isSuspended: z.boolean(),
    reason: z.string().trim().min(3).max(500).optional(),
    suspensionExpiresAt: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.isSuspended && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reason is required when suspending a user',
        path: ['reason'],
      });
    }
  });

export const adminApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ApplicationStatus).optional(),
});

export const adminRejectApplicationSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export const adminReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(ReportStatus).optional(),
});

export const adminReviewReportSchema = z.object({
  decision: z.enum(['DISMISS', 'RESOLVE', 'HIDE_POST', 'HIDE_COMMENT', 'SUSPEND_REPORTED_USER']),
  resolution: z.string().trim().min(3).max(2000).optional(),
  suspensionExpiresAt: z.string().datetime().optional().nullable(),
});

export const adminStreamReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(StreamReportStatus).optional(),
});

export const adminReviewStreamReportSchema = z.object({
  status: z.nativeEnum(StreamReportStatus),
  resolution: z.string().trim().min(3).max(2000).optional(),
});

export const adminFinanceTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['PURCHASE', 'GIFT', 'WITHDRAWAL']).default('PURCHASE'),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
  userId: z.string().trim().optional(),
});

export const adminWithdrawalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(WithdrawalStatus).optional(),
  search: z.string().trim().optional(),
  userId: z.string().trim().optional(),
});

export const adminReviewWithdrawalSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT', 'HOLD', 'RELEASE_HOLD', 'MARK_PAID']),
    reason: z.string().trim().min(3).max(1000).optional(),
    payoutReference: z.string().trim().min(3).max(255).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.decision === 'REJECT' || value.decision === 'HOLD') && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reason is required for rejection or hold decisions',
        path: ['reason'],
      });
    }

    if (value.decision === 'MARK_PAID' && !value.payoutReference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'payoutReference is required when marking withdrawal as paid',
        path: ['payoutReference'],
      });
    }
  });

export const adminCommissionConfigSchema = z.object({
  commissionRate: z.number().min(0).max(0.9),
  coinToPaiseRate: z.number().int().min(1).max(100000),
});

export const adminFinanceReconciliationQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const adminAdCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(AdCampaignStatus).optional(),
  search: z.string().trim().optional(),
});

export const adminCreateAdCampaignSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    objective: z.string().trim().max(1000).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    dailyBudgetPaise: z.number().int().min(0).optional(),
    totalBudgetPaise: z.number().int().min(0).optional(),
    targeting: z.record(z.string(), z.unknown()).optional(),
    deliveryConfig: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startAt && value.endAt) {
      const start = new Date(value.startAt);
      const end = new Date(value.endAt);
      if (start >= end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endAt must be later than startAt',
          path: ['endAt'],
        });
      }
    }

    if (
      value.dailyBudgetPaise !== undefined &&
      value.totalBudgetPaise !== undefined &&
      value.dailyBudgetPaise > value.totalBudgetPaise
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dailyBudgetPaise cannot exceed totalBudgetPaise',
        path: ['dailyBudgetPaise'],
      });
    }
  });

export const adminUpdateAdCampaignStatusSchema = z.object({
  status: z.nativeEnum(AdCampaignStatus),
  reason: z.string().trim().max(500).optional(),
});

export const adminCampaignAnalyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const adminFounderKpiQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  scope: z.enum(['GROWTH', 'FINANCE', 'ALL']).default('ALL'),
});

const adminAnalyticsScopeSchema = z.enum(['GROWTH', 'FINANCE']);
const adminComplianceScopeSchema = z.enum([
  'LEGAL_CASES',
  'TAKEDOWNS',
  'GEOBLOCKS',
  'SETTINGS',
  'AUDIT',
  'EXPORTS',
]);

export const adminPermissionsQuerySchema = z.object({
  ...paginationSchema,
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const adminUpdatePermissionsSchema = z
  .object({
    analyticsScopes: z.array(adminAnalyticsScopeSchema).min(1).optional(),
    complianceScopes: z.array(adminComplianceScopeSchema).min(1).optional(),
    reason: z.string().trim().min(3).max(500),
  })
  .refine(
    (payload) => payload.analyticsScopes !== undefined || payload.complianceScopes !== undefined,
    {
      message: 'At least one scope group is required',
    }
  );

export const adminLegalCaseQuerySchema = z.object({
  ...paginationSchema,
  status: z.nativeEnum(LegalCaseStatus).optional(),
  caseType: z.nativeEnum(LegalCaseType).optional(),
  search: z.string().trim().optional(),
  assignedTo: z.string().trim().optional(),
});

export const adminCreateLegalCaseSchema = z.object({
  title: z.string().trim().min(5).max(180),
  description: z.string().trim().max(4000).optional(),
  caseType: z.nativeEnum(LegalCaseType),
  priority: z.number().int().min(1).max(5).default(3),
  targetType: z.string().trim().min(2).max(64),
  targetId: z.string().trim().min(1).max(191),
  requestedBy: z.string().trim().max(191).optional(),
  assignedTo: z.string().trim().max(191).optional(),
  dueAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const adminUpdateLegalCaseSchema = z
  .object({
    status: z.nativeEnum(LegalCaseStatus).optional(),
    assignedTo: z.string().trim().max(191).optional().nullable(),
    priority: z.number().int().min(1).max(5).optional(),
    resolutionNote: z.string().trim().max(4000).optional(),
    dueAt: z.string().datetime().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export const adminTakedownQuerySchema = z.object({
  ...paginationSchema,
  status: z.nativeEnum(TakedownStatus).optional(),
  reason: z.nativeEnum(TakedownReason).optional(),
  search: z.string().trim().optional(),
});

export const adminCreateTakedownSchema = z.object({
  legalCaseId: z.string().trim().max(191).optional(),
  targetType: z.string().trim().min(2).max(64),
  targetId: z.string().trim().min(1).max(191),
  reason: z.nativeEnum(TakedownReason),
  note: z.string().trim().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const adminTakedownActionSchema = z
  .object({
    action: z.enum(['EXECUTE', 'APPEAL', 'REVERSE', 'REJECT']),
    note: z.string().trim().min(3).max(2000).optional(),
  })
  .superRefine((payload, ctx) => {
    if ((payload.action === 'EXECUTE' || payload.action === 'REVERSE') && !payload.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'note is required for execute and reverse actions',
        path: ['note'],
      });
    }
  });

export const adminGeoBlockQuerySchema = z.object({
  ...paginationSchema,
  status: z.nativeEnum(GeoBlockStatus).optional(),
  reason: z.nativeEnum(GeoBlockReason).optional(),
  countryCode: z.string().trim().length(2).optional(),
  targetType: z.string().trim().max(64).optional(),
  search: z.string().trim().optional(),
});

export const adminCreateGeoBlockSchema = z.object({
  targetType: z.string().trim().min(2).max(64),
  targetId: z.string().trim().min(1).max(191),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase()),
  reason: z.nativeEnum(GeoBlockReason),
  note: z.string().trim().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const adminUpdateGeoBlockSchema = z
  .object({
    status: z.nativeEnum(GeoBlockStatus).optional(),
    reason: z.nativeEnum(GeoBlockReason).optional(),
    note: z.string().trim().max(2000).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export const adminSettingsQuerySchema = z.object({
  ...paginationSchema,
  search: z.string().trim().optional(),
  includePublic: z.coerce.boolean().optional(),
});

export const adminUpdateSettingSchema = z.object({
  value: z.string().min(1),
  isPublic: z.boolean().optional(),
  reason: z.string().trim().min(3).max(2000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const adminRollbackSettingSchema = z.object({
  versionId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(2000),
});

export const adminAnnouncementQuerySchema = z.object({
  ...paginationSchema,
  isActive: z.coerce.boolean().optional(),
  type: z.nativeEnum(AnnouncementType).optional(),
  search: z.string().trim().optional(),
});

export const adminCreateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(180),
  content: z.string().trim().min(5).max(5000),
  type: z.nativeEnum(AnnouncementType).default(AnnouncementType.INFO),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  targetRole: z.nativeEnum(UserRole).optional().nullable(),
  isPinned: z.boolean().default(false),
});

export const adminUpdateAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3).max(180).optional(),
    content: z.string().trim().min(5).max(5000).optional(),
    type: z.nativeEnum(AnnouncementType).optional(),
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().optional().nullable(),
    endsAt: z.string().datetime().optional().nullable(),
    targetRole: z.nativeEnum(UserRole).optional().nullable(),
    isPinned: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export const adminAuditHistoryQuerySchema = z.object({
  ...paginationSchema,
  action: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

const complianceAuditFilterSchema = z.object({
  action: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
  search: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const adminComplianceExportRequestSchema = complianceAuditFilterSchema.extend({
  expiresInMinutes: z.coerce.number().int().min(5).max(120).default(30),
});

export const adminComplianceExportDownloadQuerySchema = z.object({
  token: z.string().trim().min(24).max(5000),
});

export const adminSecuritySummaryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
});

export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
export type AdminUpdateSuspensionInput = z.infer<typeof adminUpdateSuspensionSchema>;
export type AdminApplicationsQueryInput = z.infer<typeof adminApplicationsQuerySchema>;
export type AdminRejectApplicationInput = z.infer<typeof adminRejectApplicationSchema>;
export type AdminReportsQueryInput = z.infer<typeof adminReportsQuerySchema>;
export type AdminReviewReportInput = z.infer<typeof adminReviewReportSchema>;
export type AdminStreamReportsQueryInput = z.infer<typeof adminStreamReportsQuerySchema>;
export type AdminReviewStreamReportInput = z.infer<typeof adminReviewStreamReportSchema>;
export type AdminFinanceTransactionsQueryInput = z.infer<
  typeof adminFinanceTransactionsQuerySchema
>;
export type AdminWithdrawalsQueryInput = z.infer<typeof adminWithdrawalsQuerySchema>;
export type AdminReviewWithdrawalInput = z.infer<typeof adminReviewWithdrawalSchema>;
export type AdminCommissionConfigInput = z.infer<typeof adminCommissionConfigSchema>;
export type AdminFinanceReconciliationQueryInput = z.infer<
  typeof adminFinanceReconciliationQuerySchema
>;
export type AdminAdCampaignQueryInput = z.infer<typeof adminAdCampaignQuerySchema>;
export type AdminCreateAdCampaignInput = z.infer<typeof adminCreateAdCampaignSchema>;
export type AdminUpdateAdCampaignStatusInput = z.infer<typeof adminUpdateAdCampaignStatusSchema>;
export type AdminCampaignAnalyticsQueryInput = z.infer<typeof adminCampaignAnalyticsQuerySchema>;
export type AdminFounderKpiQueryInput = z.infer<typeof adminFounderKpiQuerySchema>;
export type AdminPermissionsQueryInput = z.infer<typeof adminPermissionsQuerySchema>;
export type AdminUpdatePermissionsInput = z.infer<typeof adminUpdatePermissionsSchema>;
export type AdminLegalCaseQueryInput = z.infer<typeof adminLegalCaseQuerySchema>;
export type AdminCreateLegalCaseInput = z.infer<typeof adminCreateLegalCaseSchema>;
export type AdminUpdateLegalCaseInput = z.infer<typeof adminUpdateLegalCaseSchema>;
export type AdminTakedownQueryInput = z.infer<typeof adminTakedownQuerySchema>;
export type AdminCreateTakedownInput = z.infer<typeof adminCreateTakedownSchema>;
export type AdminTakedownActionInput = z.infer<typeof adminTakedownActionSchema>;
export type AdminGeoBlockQueryInput = z.infer<typeof adminGeoBlockQuerySchema>;
export type AdminCreateGeoBlockInput = z.infer<typeof adminCreateGeoBlockSchema>;
export type AdminUpdateGeoBlockInput = z.infer<typeof adminUpdateGeoBlockSchema>;
export type AdminSettingsQueryInput = z.infer<typeof adminSettingsQuerySchema>;
export type AdminUpdateSettingInput = z.infer<typeof adminUpdateSettingSchema>;
export type AdminRollbackSettingInput = z.infer<typeof adminRollbackSettingSchema>;
export type AdminAnnouncementQueryInput = z.infer<typeof adminAnnouncementQuerySchema>;
export type AdminCreateAnnouncementInput = z.infer<typeof adminCreateAnnouncementSchema>;
export type AdminUpdateAnnouncementInput = z.infer<typeof adminUpdateAnnouncementSchema>;
export type AdminAuditHistoryQueryInput = z.infer<typeof adminAuditHistoryQuerySchema>;
export type AdminComplianceExportRequestInput = z.infer<typeof adminComplianceExportRequestSchema>;
export type AdminComplianceExportDownloadQueryInput = z.infer<
  typeof adminComplianceExportDownloadQuerySchema
>;
export type AdminSecuritySummaryQueryInput = z.infer<typeof adminSecuritySummaryQuerySchema>;
