import {
  AdCampaignStatus,
  AdminAction,
  GeoBlockStatus,
  ApplicationStatus,
  LegalCaseStatus,
  PurchaseStatus,
  ReportStatus,
  StreamReportStatus,
  TakedownStatus,
  UserRole,
  WithdrawalStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import {
  adminAdCampaignQuerySchema,
  adminApplicationsQuerySchema,
  adminCampaignAnalyticsQuerySchema,
  adminCommissionConfigSchema,
  adminCreateAdCampaignSchema,
  adminDispatchSecurityAlertsSchema,
  adminFinanceReconciliationQuerySchema,
  adminFinanceTransactionsQuerySchema,
  adminFounderKpiQuerySchema,
  adminPermissionsQuerySchema,
  adminRolloutStatusQuerySchema,
  adminUpdateRolloutPolicySchema,
  adminReportsQuerySchema,
  adminReviewReportSchema,
  adminSecuritySummaryQuerySchema,
  adminReviewStreamReportSchema,
  adminReviewWithdrawalSchema,
  adminStreamReportsQuerySchema,
  adminUpdatePermissionsSchema,
  adminUpdateAdCampaignStatusSchema,
  adminWithdrawalsQuerySchema,
  adminRejectApplicationSchema,
  adminUpdateSuspensionSchema,
  adminUsersQuerySchema,
} from '../lib/validations/admin.validation';
import { getAuthUser } from '../middleware/auth.middleware';
import {
  evaluateAdminRolloutAccess,
  extractAdminRequestCountry,
  getAdminRolloutConfig,
  invalidateAdminRolloutConfigCache,
} from '../middleware/admin-rollout.middleware';

type AdminAnalyticsScope = 'GROWTH' | 'FINANCE';
type RequestedAnalyticsScope = AdminAnalyticsScope | 'ALL';
type AdminComplianceScope =
  | 'LEGAL_CASES'
  | 'TAKEDOWNS'
  | 'GEOBLOCKS'
  | 'SETTINGS'
  | 'AUDIT'
  | 'EXPORTS';

type AdAlertThresholds = {
  lowCtrPercent: number;
  lowCtrMinImpressions: number;
  overspendPercent: number;
};

type SecuritySummaryAlertThresholds = {
  pendingWithdrawals: number;
  actionRequiredLegalCases: number;
  pendingTakedowns: number;
  activeGeoBlocks: number;
  monitoredActions: number;
};

type SecuritySummaryRunbooks = {
  security: string | null;
  compliance: string | null;
  finance: string | null;
};

type SecurityAlertChannel = 'SLACK' | 'PAGERDUTY';

type AdminSecuritySummaryPayload = {
  windowDays: number;
  queues: {
    pendingWithdrawals: number;
    actionRequiredLegalCases: number;
    pendingTakedowns: number;
    activeGeoBlocks: number;
  };
  actionBreakdown: Array<{
    action: AdminAction;
    count: number;
  }>;
  topAdmins: Array<{
    admin: {
      id: string;
      name: string;
      username: string;
      role: UserRole;
    };
    actionCount: number;
  }>;
  alerts: {
    thresholds: SecuritySummaryAlertThresholds;
    status: {
      pendingWithdrawals: {
        count: number;
        threshold: number;
        isBreached: boolean;
        overBy: number;
      };
      actionRequiredLegalCases: {
        count: number;
        threshold: number;
        isBreached: boolean;
        overBy: number;
      };
      pendingTakedowns: {
        count: number;
        threshold: number;
        isBreached: boolean;
        overBy: number;
      };
      activeGeoBlocks: {
        count: number;
        threshold: number;
        isBreached: boolean;
        overBy: number;
      };
      monitoredActions: {
        count: number;
        threshold: number;
        isBreached: boolean;
        overBy: number;
      };
    };
    runbooks: SecuritySummaryRunbooks;
  };
  generatedAt: string;
};

export class AdminController {
  private static readonly monitoredSecurityActions: AdminAction[] = [
    AdminAction.USER_SUSPENDED,
    AdminAction.WITHDRAWAL_APPROVED,
    AdminAction.WITHDRAWAL_REJECTED,
    AdminAction.WITHDRAWAL_HOLD,
    AdminAction.WITHDRAWAL_RELEASED,
    AdminAction.WITHDRAWAL_MARKED_PAID,
    AdminAction.SETTING_UPDATED,
    AdminAction.SETTING_ROLLED_BACK,
    AdminAction.TAKEDOWN_EXECUTED,
    AdminAction.TAKEDOWN_REVERSED,
    AdminAction.GEOBLOCK_UPDATED,
    AdminAction.GEOBLOCK_REMOVED,
    AdminAction.LEGAL_CASE_STATUS_CHANGED,
  ];

  private static async logAdminAction(input: {
    adminId: string;
    action: AdminAction;
    targetType: string;
    targetId: string;
    description: string;
    affectedUserId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    await prisma.adminActivityLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        description: input.description,
        affectedUserId: input.affectedUserId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
      },
    });
  }

  private static async getFinanceConfigValues() {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['finance.defaultCommissionRate', 'finance.coinToPaiseRate'],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    let commissionRate = 0.3;
    let coinToPaiseRate = 100;

    for (const setting of settings) {
      if (setting.key === 'finance.defaultCommissionRate') {
        const parsed = Number(setting.value);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 0.9) {
          commissionRate = parsed;
        }
      }

      if (setting.key === 'finance.coinToPaiseRate') {
        const parsed = Number(setting.value);
        if (Number.isInteger(parsed) && parsed >= 1) {
          coinToPaiseRate = parsed;
        }
      }
    }

    return {
      commissionRate,
      coinToPaiseRate,
    };
  }

  private static async getAdAlertThresholds(): Promise<AdAlertThresholds> {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'ads.alert.lowCtrPercent',
            'ads.alert.lowCtrMinImpressions',
            'ads.alert.overspendPercent',
          ],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    let lowCtrPercent = 0.8;
    let lowCtrMinImpressions = 1000;
    let overspendPercent = 100;

    for (const setting of settings) {
      if (setting.key === 'ads.alert.lowCtrPercent') {
        const parsed = Number(setting.value);
        if (!Number.isNaN(parsed) && parsed > 0) {
          lowCtrPercent = parsed;
        }
      }

      if (setting.key === 'ads.alert.lowCtrMinImpressions') {
        const parsed = Number(setting.value);
        if (Number.isInteger(parsed) && parsed >= 1) {
          lowCtrMinImpressions = parsed;
        }
      }

      if (setting.key === 'ads.alert.overspendPercent') {
        const parsed = Number(setting.value);
        if (!Number.isNaN(parsed) && parsed >= 1) {
          overspendPercent = parsed;
        }
      }
    }

    return {
      lowCtrPercent,
      lowCtrMinImpressions,
      overspendPercent,
    };
  }

  private static parseNonNegativeIntegerSetting(
    value: string | null | undefined,
    fallback: number
  ): number {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }

    return fallback;
  }

  private static async getSecuritySummaryConfig(): Promise<{
    thresholds: SecuritySummaryAlertThresholds;
    runbooks: SecuritySummaryRunbooks;
  }> {
    const defaultThresholds: SecuritySummaryAlertThresholds = {
      pendingWithdrawals: 75,
      actionRequiredLegalCases: 25,
      pendingTakedowns: 30,
      activeGeoBlocks: 200,
      monitoredActions: 250,
    };

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'admin.ops.alertThreshold.pendingWithdrawals',
            'admin.ops.alertThreshold.actionRequiredLegalCases',
            'admin.ops.alertThreshold.pendingTakedowns',
            'admin.ops.alertThreshold.activeGeoBlocks',
            'admin.ops.alertThreshold.monitoredActions',
            'admin.ops.runbook.security',
            'admin.ops.runbook.compliance',
            'admin.ops.runbook.finance',
          ],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    const thresholds = { ...defaultThresholds };
    const runbooks: SecuritySummaryRunbooks = {
      security: null,
      compliance: null,
      finance: null,
    };

    for (const setting of settings) {
      switch (setting.key) {
        case 'admin.ops.alertThreshold.pendingWithdrawals':
          thresholds.pendingWithdrawals = this.parseNonNegativeIntegerSetting(
            setting.value,
            defaultThresholds.pendingWithdrawals
          );
          break;
        case 'admin.ops.alertThreshold.actionRequiredLegalCases':
          thresholds.actionRequiredLegalCases = this.parseNonNegativeIntegerSetting(
            setting.value,
            defaultThresholds.actionRequiredLegalCases
          );
          break;
        case 'admin.ops.alertThreshold.pendingTakedowns':
          thresholds.pendingTakedowns = this.parseNonNegativeIntegerSetting(
            setting.value,
            defaultThresholds.pendingTakedowns
          );
          break;
        case 'admin.ops.alertThreshold.activeGeoBlocks':
          thresholds.activeGeoBlocks = this.parseNonNegativeIntegerSetting(
            setting.value,
            defaultThresholds.activeGeoBlocks
          );
          break;
        case 'admin.ops.alertThreshold.monitoredActions':
          thresholds.monitoredActions = this.parseNonNegativeIntegerSetting(
            setting.value,
            defaultThresholds.monitoredActions
          );
          break;
        case 'admin.ops.runbook.security':
          runbooks.security = setting.value.trim() || null;
          break;
        case 'admin.ops.runbook.compliance':
          runbooks.compliance = setting.value.trim() || null;
          break;
        case 'admin.ops.runbook.finance':
          runbooks.finance = setting.value.trim() || null;
          break;
        default:
          break;
      }
    }

    return {
      thresholds,
      runbooks,
    };
  }

  private static async buildSecuritySummaryPayload(
    days: number
  ): Promise<AdminSecuritySummaryPayload> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activityWhere: Prisma.AdminActivityLogWhereInput = {
      action: {
        in: this.monitoredSecurityActions,
      },
      createdAt: {
        gte: since,
      },
    };

    const [
      pendingWithdrawals,
      actionRequiredLegalCases,
      pendingTakedowns,
      activeGeoBlocks,
      actionGroups,
      adminGroups,
      config,
    ] = await Promise.all([
      prisma.creatorWithdrawalRequest.count({
        where: {
          status: {
            in: [
              WithdrawalStatus.PENDING,
              WithdrawalStatus.UNDER_REVIEW,
              WithdrawalStatus.ON_HOLD,
              WithdrawalStatus.APPROVED,
            ],
          },
        },
      }),
      prisma.legalCase.count({
        where: {
          status: {
            in: [
              LegalCaseStatus.OPEN,
              LegalCaseStatus.UNDER_REVIEW,
              LegalCaseStatus.ACTION_REQUIRED,
            ],
          },
        },
      }),
      prisma.takedownRequest.count({
        where: {
          status: {
            in: [TakedownStatus.PENDING, TakedownStatus.APPEALED],
          },
        },
      }),
      prisma.geoBlockRule.count({
        where: {
          status: GeoBlockStatus.ACTIVE,
        },
      }),
      prisma.adminActivityLog.groupBy({
        by: ['action'],
        where: activityWhere,
        _count: {
          _all: true,
        },
      }),
      prisma.adminActivityLog.groupBy({
        by: ['adminId'],
        where: activityWhere,
        _count: {
          adminId: true,
        },
        orderBy: {
          _count: {
            adminId: 'desc',
          },
        },
        take: 8,
      }),
      this.getSecuritySummaryConfig(),
    ]);

    const actionCountMap = new Map<AdminAction, number>();
    for (const group of actionGroups) {
      actionCountMap.set(group.action, group._count._all);
    }

    const actionBreakdown = this.monitoredSecurityActions
      .map((action) => ({
        action,
        count: actionCountMap.get(action) ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.action.localeCompare(b.action));

    const adminIds = adminGroups.map((group) => group.adminId);
    const admins = adminIds.length
      ? await prisma.user.findMany({
          where: {
            id: {
              in: adminIds,
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        })
      : [];

    const adminById = new Map(admins.map((admin) => [admin.id, admin]));

    const topAdmins = adminGroups
      .map((group) => {
        const admin = adminById.get(group.adminId);
        if (!admin) {
          return null;
        }

        return {
          admin,
          actionCount: group._count.adminId ?? 0,
        };
      })
      .filter(
        (
          item
        ): item is {
          admin: {
            id: string;
            name: string;
            username: string;
            role: UserRole;
          };
          actionCount: number;
        } => Boolean(item)
      );

    const totalMonitoredActions = actionBreakdown.reduce((sum, item) => sum + item.count, 0);

    const withAlertStatus = (item: { count: number; threshold: number }) => ({
      ...item,
      isBreached: item.count >= item.threshold,
      overBy: Math.max(item.count - item.threshold, 0),
    });

    return {
      windowDays: days,
      queues: {
        pendingWithdrawals,
        actionRequiredLegalCases,
        pendingTakedowns,
        activeGeoBlocks,
      },
      actionBreakdown,
      topAdmins,
      alerts: {
        thresholds: config.thresholds,
        status: {
          pendingWithdrawals: withAlertStatus({
            count: pendingWithdrawals,
            threshold: config.thresholds.pendingWithdrawals,
          }),
          actionRequiredLegalCases: withAlertStatus({
            count: actionRequiredLegalCases,
            threshold: config.thresholds.actionRequiredLegalCases,
          }),
          pendingTakedowns: withAlertStatus({
            count: pendingTakedowns,
            threshold: config.thresholds.pendingTakedowns,
          }),
          activeGeoBlocks: withAlertStatus({
            count: activeGeoBlocks,
            threshold: config.thresholds.activeGeoBlocks,
          }),
          monitoredActions: withAlertStatus({
            count: totalMonitoredActions,
            threshold: config.thresholds.monitoredActions,
          }),
        },
        runbooks: config.runbooks,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private static async getSecurityAlertWebhookUrls(): Promise<
    Record<SecurityAlertChannel, string | null>
  > {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['admin.ops.alertWebhook.slack', 'admin.ops.alertWebhook.pagerduty'],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    const urls: Record<SecurityAlertChannel, string | null> = {
      SLACK: null,
      PAGERDUTY: null,
    };

    for (const setting of settings) {
      if (setting.key === 'admin.ops.alertWebhook.slack') {
        urls.SLACK = setting.value.trim() || null;
      }

      if (setting.key === 'admin.ops.alertWebhook.pagerduty') {
        urls.PAGERDUTY = setting.value.trim() || null;
      }
    }

    return urls;
  }

  private static parseAdminAnalyticsScopes(value?: string | null): AdminAnalyticsScope[] {
    if (!value) {
      return [];
    }

    const parsed = value
      .split(',')
      .map((scope) => scope.trim().toUpperCase())
      .filter((scope): scope is AdminAnalyticsScope => scope === 'GROWTH' || scope === 'FINANCE');

    return [...new Set(parsed)];
  }

  private static getDefaultAdminAnalyticsScopes(role?: UserRole): AdminAnalyticsScope[] {
    if (role === UserRole.SUPER_ADMIN) {
      return ['GROWTH', 'FINANCE'];
    }

    return ['GROWTH'];
  }

  private static getRequiredAnalyticsScopes(scope: RequestedAnalyticsScope): AdminAnalyticsScope[] {
    if (scope === 'ALL') {
      return ['GROWTH', 'FINANCE'];
    }

    return [scope];
  }

  private static async getAdminAnalyticsScopes(
    adminId: string,
    role?: UserRole
  ): Promise<AdminAnalyticsScope[]> {
    const defaultScopes = this.getDefaultAdminAnalyticsScopes(role);
    const setting = await prisma.systemSetting.findUnique({
      where: {
        key: `admin.analyticsScopes.${adminId}`,
      },
      select: {
        value: true,
      },
    });

    const configuredScopes = this.parseAdminAnalyticsScopes(setting?.value);
    if (configuredScopes.length === 0) {
      return defaultScopes;
    }

    return configuredScopes;
  }

  private static parseAdminComplianceScopes(value?: string | null): AdminComplianceScope[] {
    if (!value) {
      return [];
    }

    const parsed = value
      .split(',')
      .map((scope) => scope.trim().toUpperCase())
      .filter(
        (scope): scope is AdminComplianceScope =>
          scope === 'LEGAL_CASES' ||
          scope === 'TAKEDOWNS' ||
          scope === 'GEOBLOCKS' ||
          scope === 'SETTINGS' ||
          scope === 'AUDIT' ||
          scope === 'EXPORTS'
      );

    return [...new Set(parsed)];
  }

  private static getDefaultAdminComplianceScopes(_role?: UserRole): AdminComplianceScope[] {
    return ['LEGAL_CASES', 'TAKEDOWNS', 'GEOBLOCKS', 'SETTINGS', 'AUDIT', 'EXPORTS'];
  }

  private static serializeScopes<TScope extends string>(scopes: TScope[]): string {
    return [...new Set(scopes)].join(',');
  }

  private static async ensureAdminAnalyticsScopes(
    req: Request,
    res: Response,
    requiredScopes: AdminAnalyticsScope[]
  ) {
    const authUser = getAuthUser(req, res);
    if (!authUser) {
      return null;
    }

    const grantedScopes = await this.getAdminAnalyticsScopes(authUser.id, req.adminRole);
    const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));

    if (missingScopes.length > 0) {
      res.status(403).json({
        success: false,
        error: `Missing analytics scope: ${missingScopes.join(', ')}`,
        access: {
          grantedScopes,
          requiredScopes,
        },
      });

      return null;
    }

    return {
      authUser,
      grantedScopes,
    };
  }

  private static evaluateCampaignAlerts(input: {
    impressions: number;
    clicks: number;
    spendPaise: number;
    totalBudgetPaise: number | null;
    thresholds: AdAlertThresholds;
  }) {
    const ctrPercent = input.impressions > 0 ? (input.clicks / input.impressions) * 100 : 0;
    const budgetUtilizationPercent =
      input.totalBudgetPaise && input.totalBudgetPaise > 0
        ? (input.spendPaise / input.totalBudgetPaise) * 100
        : null;

    const isLowCtr =
      input.impressions >= input.thresholds.lowCtrMinImpressions &&
      ctrPercent < input.thresholds.lowCtrPercent;

    const isOverspend =
      budgetUtilizationPercent !== null &&
      budgetUtilizationPercent >= input.thresholds.overspendPercent;

    return {
      isLowCtr,
      isOverspend,
      ctrPercent,
      budgetUtilizationPercent,
    };
  }

  private static escapeCsvCell(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const raw = String(value);
    if (raw.includes(',') || raw.includes('\n') || raw.includes('"')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }

    return raw;
  }

  private static getMetadataString(
    metadata: Prisma.JsonValue | null | undefined,
    key: string
  ): string {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return '';
    }

    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  }

  private static isPurchaseStatus(value: string): value is PurchaseStatus {
    return (Object.values(PurchaseStatus) as string[]).includes(value);
  }

  private static isWithdrawalStatus(value: string): value is WithdrawalStatus {
    return (Object.values(WithdrawalStatus) as string[]).includes(value);
  }

  private static canTransitionAdCampaignStatus(
    from: AdCampaignStatus,
    to: AdCampaignStatus
  ): boolean {
    if (from === to) {
      return true;
    }

    const allowedTransitions: Record<AdCampaignStatus, AdCampaignStatus[]> = {
      [AdCampaignStatus.DRAFT]: [AdCampaignStatus.SCHEDULED, AdCampaignStatus.ACTIVE],
      [AdCampaignStatus.SCHEDULED]: [AdCampaignStatus.ACTIVE, AdCampaignStatus.PAUSED],
      [AdCampaignStatus.ACTIVE]: [
        AdCampaignStatus.PAUSED,
        AdCampaignStatus.COMPLETED,
        AdCampaignStatus.ARCHIVED,
      ],
      [AdCampaignStatus.PAUSED]: [
        AdCampaignStatus.ACTIVE,
        AdCampaignStatus.COMPLETED,
        AdCampaignStatus.ARCHIVED,
      ],
      [AdCampaignStatus.COMPLETED]: [AdCampaignStatus.ARCHIVED],
      [AdCampaignStatus.ARCHIVED]: [],
    };

    return allowedTransitions[from].includes(to);
  }

  private static buildDateRangeFilter(
    from?: string,
    to?: string
  ): Prisma.DateTimeFilter | undefined {
    if (!from && !to) {
      return undefined;
    }

    const filter: Prisma.DateTimeFilter = {};

    if (from) {
      filter.gte = new Date(from);
    }

    if (to) {
      filter.lte = new Date(to);
    }

    return filter;
  }

  static async getAdminMe(req: Request, res: Response) {
    try {
      const user = getAuthUser(req, res);
      if (!user) return;

      const admin = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          role: true,
          isSuspended: true,
          createdAt: true,
          lastLoginAt: true,
          lastLoginIp: true,
        },
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Admin user not found',
        });
      }

      res.json({
        success: true,
        data: admin,
      });
    } catch (error) {
      console.error('[AdminController] Error getting admin profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin profile',
      });
    }
  }

  static async getDashboardSummary(_req: Request, res: Response) {
    try {
      const [
        totalUsers,
        suspendedUsers,
        approvedCreators,
        pendingCreatorApplications,
        pendingReports,
        pendingStreamReports,
        activeLiveStreams,
        activeAnnouncements,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { isSuspended: true },
        }),
        prisma.creatorApplication.count({
          where: { status: ApplicationStatus.APPROVED },
        }),
        prisma.creatorApplication.count({
          where: {
            status: {
              in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW],
            },
          },
        }),
        prisma.report.count({
          where: {
            status: {
              in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW],
            },
          },
        }),
        prisma.streamReport.count({
          where: {
            status: StreamReportStatus.PENDING,
          },
        }),
        prisma.stream.count({
          where: { isLive: true },
        }),
        prisma.announcement.count({
          where: { isActive: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            suspended: suspendedUsers,
          },
          creators: {
            approved: approvedCreators,
            pendingApplications: pendingCreatorApplications,
          },
          moderation: {
            pendingReports,
            pendingStreamReports,
          },
          streaming: {
            activeLiveStreams,
          },
          announcements: {
            active: activeAnnouncements,
          },
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[AdminController] Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard summary',
      });
    }
  }

  static async listAdminPermissions(req: Request, res: Response) {
    try {
      const query = adminPermissionsQuerySchema.parse(req.query);
      const { page, limit, search, role } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {
        role: {
          in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      };

      if (role) {
        if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
          return res.status(400).json({
            success: false,
            error: 'Permissions can only be managed for ADMIN and SUPER_ADMIN roles',
          });
        }

        where.role = role;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, admins] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            createdAt: true,
            lastLoginAt: true,
          },
        }),
      ]);

      const analyticsKeys = admins.map((admin) => `admin.analyticsScopes.${admin.id}`);
      const complianceKeys = admins.map((admin) => `admin.complianceScopes.${admin.id}`);

      const settings =
        analyticsKeys.length > 0 || complianceKeys.length > 0
          ? await prisma.systemSetting.findMany({
              where: {
                key: {
                  in: [...analyticsKeys, ...complianceKeys],
                },
              },
              select: {
                key: true,
                value: true,
                updatedAt: true,
              },
            })
          : [];

      const analyticsByAdminId = new Map<string, { value: string; updatedAt: Date }>();
      const complianceByAdminId = new Map<string, { value: string; updatedAt: Date }>();

      for (const setting of settings) {
        if (setting.key.startsWith('admin.analyticsScopes.')) {
          const adminId = setting.key.replace('admin.analyticsScopes.', '');
          analyticsByAdminId.set(adminId, {
            value: setting.value,
            updatedAt: setting.updatedAt,
          });
        }

        if (setting.key.startsWith('admin.complianceScopes.')) {
          const adminId = setting.key.replace('admin.complianceScopes.', '');
          complianceByAdminId.set(adminId, {
            value: setting.value,
            updatedAt: setting.updatedAt,
          });
        }
      }

      const items = admins.map((admin) => {
        const analyticsSetting = analyticsByAdminId.get(admin.id);
        const complianceSetting = complianceByAdminId.get(admin.id);

        const parsedAnalytics = this.parseAdminAnalyticsScopes(analyticsSetting?.value);
        const parsedCompliance = this.parseAdminComplianceScopes(complianceSetting?.value);

        const analyticsScopes =
          parsedAnalytics.length > 0
            ? parsedAnalytics
            : this.getDefaultAdminAnalyticsScopes(admin.role);

        const complianceScopes =
          parsedCompliance.length > 0
            ? parsedCompliance
            : this.getDefaultAdminComplianceScopes(admin.role);

        return {
          admin,
          analyticsScopes,
          complianceScopes,
          source: {
            analytics: parsedAnalytics.length > 0 ? 'configured' : 'default',
            compliance: parsedCompliance.length > 0 ? 'configured' : 'default',
          },
          updatedAt: [analyticsSetting?.updatedAt, complianceSetting?.updatedAt]
            .filter((value): value is Date => Boolean(value))
            .sort((a, b) => b.getTime() - a.getTime())[0]
            ?.toISOString(),
        };
      });

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing admin permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list admin permissions',
      });
    }
  }

  static async updateAdminPermissions(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { adminId } = req.params;
      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Admin ID is required',
        });
      }

      const payload = adminUpdatePermissionsSchema.parse(req.body);

      const targetAdmin = await prisma.user.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
        },
      });

      if (
        !targetAdmin ||
        (targetAdmin.role !== UserRole.ADMIN && targetAdmin.role !== UserRole.SUPER_ADMIN)
      ) {
        return res.status(404).json({
          success: false,
          error: 'Target admin was not found',
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const [existingAnalytics, existingCompliance] = await Promise.all([
          tx.systemSetting.findUnique({
            where: {
              key: `admin.analyticsScopes.${adminId}`,
            },
            select: {
              value: true,
            },
          }),
          tx.systemSetting.findUnique({
            where: {
              key: `admin.complianceScopes.${adminId}`,
            },
            select: {
              value: true,
            },
          }),
        ]);

        let nextAnalyticsValue = existingAnalytics?.value;
        let nextComplianceValue = existingCompliance?.value;

        if (payload.analyticsScopes) {
          const serialized = this.serializeScopes(payload.analyticsScopes);
          nextAnalyticsValue = serialized;

          await tx.systemSetting.upsert({
            where: {
              key: `admin.analyticsScopes.${adminId}`,
            },
            update: {
              value: serialized,
              description: 'Assigned analytics scopes for admin access control',
              updatedBy: authUser.id,
            },
            create: {
              key: `admin.analyticsScopes.${adminId}`,
              value: serialized,
              description: 'Assigned analytics scopes for admin access control',
              isPublic: false,
              updatedBy: authUser.id,
            },
          });
        }

        if (payload.complianceScopes) {
          const serialized = this.serializeScopes(payload.complianceScopes);
          nextComplianceValue = serialized;

          await tx.systemSetting.upsert({
            where: {
              key: `admin.complianceScopes.${adminId}`,
            },
            update: {
              value: serialized,
              description: 'Assigned compliance scopes for admin access control',
              updatedBy: authUser.id,
            },
            create: {
              key: `admin.complianceScopes.${adminId}`,
              value: serialized,
              description: 'Assigned compliance scopes for admin access control',
              isPublic: false,
              updatedBy: authUser.id,
            },
          });
        }

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.SETTING_UPDATED,
            targetType: 'admin_permission_scope',
            targetId: adminId,
            description: `Updated admin scopes for ${targetAdmin.username}`,
            metadata: {
              reason: payload.reason,
              previousAnalyticsScopes: this.parseAdminAnalyticsScopes(existingAnalytics?.value),
              nextAnalyticsScopes: this.parseAdminAnalyticsScopes(nextAnalyticsValue),
              previousComplianceScopes: this.parseAdminComplianceScopes(existingCompliance?.value),
              nextComplianceScopes: this.parseAdminComplianceScopes(nextComplianceValue),
            },
            ipAddress: req.ip,
          },
        });

        const resolvedAnalytics = this.parseAdminAnalyticsScopes(nextAnalyticsValue);
        const resolvedCompliance = this.parseAdminComplianceScopes(nextComplianceValue);

        return {
          admin: targetAdmin,
          analyticsScopes:
            resolvedAnalytics.length > 0
              ? resolvedAnalytics
              : this.getDefaultAdminAnalyticsScopes(targetAdmin.role),
          complianceScopes:
            resolvedCompliance.length > 0
              ? resolvedCompliance
              : this.getDefaultAdminComplianceScopes(targetAdmin.role),
          updatedBy: authUser.id,
          updatedAt: new Date().toISOString(),
        };
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error updating admin permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update admin permissions',
      });
    }
  }

  static async getRolloutStatus(req: Request, res: Response) {
    try {
      const query = adminRolloutStatusQuerySchema.parse(req.query);

      const evaluatedRole = query.role ?? req.adminRole;
      if (!evaluatedRole) {
        return res.status(500).json({
          success: false,
          error: 'Admin role is unavailable for rollout status evaluation',
        });
      }

      if (evaluatedRole !== UserRole.ADMIN && evaluatedRole !== UserRole.SUPER_ADMIN) {
        return res.status(400).json({
          success: false,
          error: 'Rollout status can only be evaluated for ADMIN or SUPER_ADMIN roles',
        });
      }

      const requestCountry = extractAdminRequestCountry(req);
      const evaluatedCountry = query.country ?? requestCountry;

      const config = await getAdminRolloutConfig();
      const evaluation = evaluateAdminRolloutAccess(config, evaluatedRole, evaluatedCountry);

      res.json({
        success: true,
        data: {
          config,
          context: {
            requestRole: req.adminRole ?? null,
            requestCountry,
            evaluatedRole,
            evaluatedCountry,
          },
          evaluation,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rollout status query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error fetching rollout status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rollout status',
      });
    }
  }

  static async updateRolloutPolicy(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminUpdateRolloutPolicySchema.parse(req.body);
      const dedupedRoles = [...new Set(payload.allowedRoles)];
      const dedupedCountries = [
        ...new Set(payload.allowedCountries.map((country) => country.toUpperCase())),
      ];

      if (payload.enabled && !payload.superAdminBypass && !dedupedRoles.includes('SUPER_ADMIN')) {
        return res.status(400).json({
          success: false,
          error:
            'Unsafe rollout policy: SUPER_ADMIN must remain allowed when super-admin bypass is disabled',
        });
      }

      const previousConfig = await getAdminRolloutConfig(true);

      const nextConfig = {
        enabled: payload.enabled,
        superAdminBypass: payload.superAdminBypass,
        allowedRoles: dedupedRoles,
        allowedCountries: dedupedCountries,
        blockedMessage: payload.blockedMessage.trim(),
      };

      await prisma.$transaction(async (tx) => {
        const upsertSetting = async (key: string, value: string, description: string) => {
          await tx.systemSetting.upsert({
            where: { key },
            update: {
              value,
              description,
              updatedBy: authUser.id,
            },
            create: {
              key,
              value,
              description,
              isPublic: false,
              updatedBy: authUser.id,
            },
          });
        };

        await Promise.all([
          upsertSetting(
            'admin.rollout.enabled',
            String(nextConfig.enabled),
            'Controls whether staged admin rollout gating is active'
          ),
          upsertSetting(
            'admin.rollout.superAdminBypass',
            String(nextConfig.superAdminBypass),
            'Allows super admin bypass during staged rollout'
          ),
          upsertSetting(
            'admin.rollout.allowedRoles',
            nextConfig.allowedRoles.join(','),
            'Comma-separated admin roles allowed during staged rollout'
          ),
          upsertSetting(
            'admin.rollout.allowedCountries',
            nextConfig.allowedCountries.join(','),
            'Comma-separated ISO countries allowed during staged rollout'
          ),
          upsertSetting(
            'admin.rollout.blockedMessage',
            nextConfig.blockedMessage,
            'Admin rollout access denial message shown to blocked admins'
          ),
        ]);

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.SETTING_UPDATED,
            targetType: 'admin_rollout_policy',
            targetId: 'global',
            description: 'Updated admin rollout policy',
            metadata: {
              reason: payload.reason,
              previousConfig,
              nextConfig,
            },
            ipAddress: req.ip,
          },
        });
      });

      invalidateAdminRolloutConfigCache();
      const updatedConfig = await getAdminRolloutConfig(true);

      res.json({
        success: true,
        data: {
          config: updatedConfig,
          updatedBy: authUser.id,
          reason: payload.reason,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rollout policy payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error updating rollout policy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update rollout policy',
      });
    }
  }

  static async dispatchSecurityAlerts(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminDispatchSecurityAlertsSchema.parse(req.body);
      const channels = [...new Set(payload.channels)] as SecurityAlertChannel[];

      const summaryData = await this.buildSecuritySummaryPayload(payload.days);

      const breachedItems = Object.entries(summaryData.alerts.status)
        .filter(([, status]) => status.isBreached)
        .map(([metric, status]) => ({
          metric,
          ...status,
        }));

      const webhookUrls = await this.getSecurityAlertWebhookUrls();

      const eventPayload = {
        eventType: 'ADMIN_SECURITY_THRESHOLD_BREACH',
        generatedAt: new Date().toISOString(),
        windowDays: summaryData.windowDays,
        queues: summaryData.queues,
        breachedItems,
        monitoredActions: summaryData.alerts.status.monitoredActions,
        runbooks: summaryData.alerts.runbooks,
      };

      const deliveries = await Promise.all(
        channels.map(async (channel) => {
          const url = webhookUrls[channel];

          if (!url) {
            return {
              channel,
              status: 'not-configured' as const,
              reason: 'Webhook URL not configured',
            };
          }

          if (payload.dryRun || breachedItems.length === 0) {
            return {
              channel,
              status: 'skipped' as const,
              reason: payload.dryRun
                ? 'Dry-run mode enabled'
                : 'No breached thresholds in selected window',
            };
          }

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventPayload),
            });

            if (!response.ok) {
              return {
                channel,
                status: 'failed' as const,
                reason: `Webhook request failed with status ${response.status}`,
              };
            }

            return {
              channel,
              status: 'sent' as const,
              reason: `Delivered with status ${response.status}`,
            };
          } catch (error) {
            return {
              channel,
              status: 'failed' as const,
              reason: error instanceof Error ? error.message : 'Unknown webhook delivery error',
            };
          }
        })
      );

      await this.logAdminAction({
        adminId: authUser.id,
        action: AdminAction.SETTING_UPDATED,
        targetType: 'admin_security_alert_dispatch',
        targetId: 'global',
        description: payload.dryRun
          ? 'Executed dry-run security alert dispatch'
          : 'Executed security alert dispatch',
        metadata: {
          reason: payload.reason,
          days: payload.days,
          channels,
          dryRun: payload.dryRun,
          breachedMetrics: breachedItems.map((item) => item.metric),
          deliveries,
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: {
          dryRun: payload.dryRun,
          days: payload.days,
          breachedCount: breachedItems.length,
          breachedMetrics: breachedItems.map((item) => item.metric),
          deliveries,
          summaryGeneratedAt: summaryData.generatedAt,
          triggeredBy: authUser.id,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid security alert dispatch payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error dispatching security alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to dispatch security alerts',
      });
    }
  }

  static async exportSecurityOpsDigestCsv(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const query = adminSecuritySummaryQuerySchema.parse(req.query);
      const summaryData = await this.buildSecuritySummaryPayload(query.days);
      const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

      const [rolloutConfig, rolloutUpdates] = await Promise.all([
        getAdminRolloutConfig(),
        prisma.adminActivityLog.findMany({
          where: {
            targetType: 'admin_rollout_policy',
            createdAt: {
              gte: since,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
        }),
      ]);

      const csvHeader = [
        'section',
        'metric',
        'value',
        'threshold',
        'isBreached',
        'note',
        'timestamp',
      ];
      const csvRows: Array<Array<string | number | boolean>> = [];

      const appendThresholdRow = (
        section: string,
        metric: string,
        status: {
          count: number;
          threshold: number;
          isBreached: boolean;
          overBy: number;
        }
      ) => {
        csvRows.push([
          section,
          metric,
          status.count,
          status.threshold,
          status.isBreached,
          status.overBy > 0 ? `over by ${status.overBy}` : 'within threshold',
          summaryData.generatedAt,
        ]);
      };

      appendThresholdRow(
        'queue_pressure',
        'pending_withdrawals',
        summaryData.alerts.status.pendingWithdrawals
      );
      appendThresholdRow(
        'queue_pressure',
        'action_required_legal_cases',
        summaryData.alerts.status.actionRequiredLegalCases
      );
      appendThresholdRow(
        'queue_pressure',
        'pending_takedowns',
        summaryData.alerts.status.pendingTakedowns
      );
      appendThresholdRow(
        'queue_pressure',
        'active_geo_blocks',
        summaryData.alerts.status.activeGeoBlocks
      );
      appendThresholdRow(
        'privileged_actions',
        'total_monitored_actions',
        summaryData.alerts.status.monitoredActions
      );

      for (const item of summaryData.actionBreakdown) {
        csvRows.push([
          'privileged_actions',
          'action_breakdown',
          item.count,
          '',
          '',
          `action=${item.action}`,
          summaryData.generatedAt,
        ]);
      }

      for (const item of summaryData.topAdmins) {
        csvRows.push([
          'privileged_actions',
          'top_admin_activity',
          item.actionCount,
          '',
          '',
          `${item.admin.name} (@${item.admin.username}) role=${item.admin.role}`,
          summaryData.generatedAt,
        ]);
      }

      csvRows.push([
        'rollout_decisions',
        'policy_updates_in_window',
        rolloutUpdates.length,
        '',
        '',
        'targetType=admin_rollout_policy',
        summaryData.generatedAt,
      ]);
      csvRows.push([
        'rollout_decisions',
        'rollout_enabled',
        rolloutConfig.enabled ? 'true' : 'false',
        '',
        '',
        'current_policy',
        summaryData.generatedAt,
      ]);
      csvRows.push([
        'rollout_decisions',
        'super_admin_bypass',
        rolloutConfig.superAdminBypass ? 'true' : 'false',
        '',
        '',
        'current_policy',
        summaryData.generatedAt,
      ]);
      csvRows.push([
        'rollout_decisions',
        'allowed_roles',
        rolloutConfig.allowedRoles.length ? rolloutConfig.allowedRoles.join('|') : 'ALL',
        '',
        '',
        'current_policy',
        summaryData.generatedAt,
      ]);
      csvRows.push([
        'rollout_decisions',
        'allowed_countries',
        rolloutConfig.allowedCountries.length ? rolloutConfig.allowedCountries.join('|') : 'ALL',
        '',
        '',
        'current_policy',
        summaryData.generatedAt,
      ]);

      for (const update of rolloutUpdates) {
        const reason = this.getMetadataString(update.metadata, 'reason');
        const noteParts = [
          `${update.admin.name} (@${update.admin.username}) role=${update.admin.role}`,
          reason ? `reason=${reason}` : null,
        ].filter((value): value is string => Boolean(value));

        csvRows.push([
          'rollout_decisions',
          'policy_update_event',
          update.id,
          '',
          '',
          noteParts.join(' | '),
          update.createdAt.toISOString(),
        ]);
      }

      const csvContent = [
        csvHeader.join(','),
        ...csvRows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(',')),
      ].join('\n');

      await this.logAdminAction({
        adminId: authUser.id,
        action: AdminAction.SETTING_UPDATED,
        targetType: 'admin_ops_digest_export',
        targetId: `${query.days}d`,
        description: 'Exported admin operations digest CSV',
        metadata: {
          days: query.days,
          generatedAt: summaryData.generatedAt,
          rolloutPolicyUpdates: rolloutUpdates.length,
          breachedMetrics: Object.entries(summaryData.alerts.status)
            .filter(([, status]) => status.isBreached)
            .map(([metric]) => metric),
        },
        ipAddress: req.ip,
      });

      const filename = `admin-ops-digest-${query.days}d-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid admin ops digest export query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error exporting admin ops digest CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export admin ops digest CSV',
      });
    }
  }

  static async getSecuritySummary(req: Request, res: Response) {
    try {
      const query = adminSecuritySummaryQuerySchema.parse(req.query);
      const data = await this.buildSecuritySummaryPayload(query.days);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid security summary query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error fetching security summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security summary',
      });
    }
  }

  static async listUsers(req: Request, res: Response) {
    try {
      const query = adminUsersQuerySchema.parse(req.query);
      const { page, limit, search, role, isSuspended } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isSuspended !== undefined) {
        where.isSuspended = isSuspended;
      }

      const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            role: true,
            isSuspended: true,
            suspendedReason: true,
            suspensionExpiresAt: true,
            createdAt: true,
            lastLoginAt: true,
            creatorApplication: {
              select: {
                status: true,
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          items: users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list users',
      });
    }
  }

  static async getUserDetail(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          role: true,
          age: true,
          bio: true,
          phone: true,
          emailVerified: true,
          isSuspended: true,
          suspendedReason: true,
          suspendedBy: true,
          suspendedAt: true,
          suspensionExpiresAt: true,
          adminNotes: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          lastLoginIp: true,
          creatorApplication: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              reviewedBy: true,
              rejectionReason: true,
            },
          },
          coinWallet: {
            select: {
              id: true,
              balance: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('[AdminController] Error getting user detail:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user detail',
      });
    }
  }

  static async updateUserSuspension(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      if (userId === authUser.id) {
        return res.status(400).json({
          success: false,
          error: 'You cannot change suspension status for your own account',
        });
      }

      const input = adminUpdateSuspensionSchema.parse(req.body);
      const currentAdminRole = req.adminRole;

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          role: true,
          isSuspended: true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      if (targetUser.role === UserRole.SUPER_ADMIN && currentAdminRole !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Only SUPER_ADMIN can modify suspension for another SUPER_ADMIN',
        });
      }

      const now = new Date();

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: input.isSuspended
          ? {
              isSuspended: true,
              suspendedReason: input.reason,
              suspendedAt: now,
              suspendedBy: authUser.id,
              suspensionExpiresAt: input.suspensionExpiresAt
                ? new Date(input.suspensionExpiresAt)
                : null,
            }
          : {
              isSuspended: false,
              suspendedReason: null,
              suspendedAt: null,
              suspendedBy: null,
              suspensionExpiresAt: null,
            },
        select: {
          id: true,
          name: true,
          role: true,
          isSuspended: true,
          suspendedReason: true,
          suspendedAt: true,
          suspensionExpiresAt: true,
          suspendedBy: true,
        },
      });

      await this.logAdminAction({
        adminId: authUser.id,
        action: input.isSuspended ? AdminAction.USER_SUSPENDED : AdminAction.USER_UNSUSPENDED,
        targetType: 'user',
        targetId: userId,
        description: input.isSuspended
          ? `Suspended user ${targetUser.name}`
          : `Removed suspension for user ${targetUser.name}`,
        affectedUserId: userId,
        metadata: {
          reason: input.reason ?? null,
          suspensionExpiresAt: input.suspensionExpiresAt ?? null,
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid suspension payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error updating suspension:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update suspension state',
      });
    }
  }

  static async listCreatorApplications(req: Request, res: Response) {
    try {
      const query = adminApplicationsQuerySchema.parse(req.query);
      const { page, limit, status } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.CreatorApplicationWhereInput = status
        ? { status }
        : {
            status: {
              in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW],
            },
          };

      const [total, items] = await prisma.$transaction([
        prisma.creatorApplication.count({ where }),
        prisma.creatorApplication.findMany({
          where,
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            reviewedBy: true,
            rejectionReason: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                image: true,
                role: true,
              },
            },
            identity: {
              select: {
                idType: true,
                idDocumentUrl: true,
                selfiePhotoUrl: true,
                isVerified: true,
              },
            },
            financial: {
              select: {
                accountHolderName: true,
                ifscCode: true,
                isVerified: true,
              },
            },
            profile: {
              select: {
                profilePictureUrl: true,
                bio: true,
                categories: true,
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing creator applications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list creator applications',
      });
    }
  }

  static async approveCreatorApplication(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { applicationId } = req.params;

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          error: 'Application ID is required',
        });
      }

      const application = await prisma.creatorApplication.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Creator application not found',
        });
      }

      if (application.status === ApplicationStatus.APPROVED) {
        return res.status(400).json({
          success: false,
          error: 'Application is already approved',
        });
      }

      if (application.status === ApplicationStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          error: 'Draft applications cannot be approved',
        });
      }

      const now = new Date();

      const updatedApplication = await prisma.$transaction(async (tx) => {
        const updated = await tx.creatorApplication.update({
          where: { id: applicationId },
          data: {
            status: ApplicationStatus.APPROVED,
            reviewedAt: now,
            reviewedBy: authUser.id,
            rejectionReason: null,
          },
          select: {
            id: true,
            status: true,
            reviewedAt: true,
            reviewedBy: true,
            rejectionReason: true,
            userId: true,
          },
        });

        if (application.user.role === UserRole.USER) {
          await tx.user.update({
            where: { id: application.user.id },
            data: {
              role: UserRole.CREATOR,
            },
          });
        }

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.CREATOR_APPLICATION_APPROVED,
            targetType: 'creator_application',
            targetId: applicationId,
            description: `Approved creator application for ${application.user.name}`,
            affectedUserId: application.user.id,
            metadata: {
              previousStatus: application.status,
              newStatus: ApplicationStatus.APPROVED,
            },
            ipAddress: req.ip,
          },
        });

        return updated;
      });

      res.json({
        success: true,
        data: updatedApplication,
      });
    } catch (error) {
      console.error('[AdminController] Error approving creator application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve creator application',
      });
    }
  }

  static async rejectCreatorApplication(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { applicationId } = req.params;

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          error: 'Application ID is required',
        });
      }

      const { reason } = adminRejectApplicationSchema.parse(req.body);

      const application = await prisma.creatorApplication.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Creator application not found',
        });
      }

      if (application.status === ApplicationStatus.REJECTED) {
        return res.status(400).json({
          success: false,
          error: 'Application is already rejected',
        });
      }

      if (application.status === ApplicationStatus.APPROVED) {
        return res.status(400).json({
          success: false,
          error: 'Approved application cannot be rejected directly',
        });
      }

      if (application.status === ApplicationStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          error: 'Draft applications cannot be rejected',
        });
      }

      const now = new Date();

      const updatedApplication = await prisma.$transaction(async (tx) => {
        const updated = await tx.creatorApplication.update({
          where: { id: applicationId },
          data: {
            status: ApplicationStatus.REJECTED,
            reviewedAt: now,
            reviewedBy: authUser.id,
            rejectionReason: reason,
          },
          select: {
            id: true,
            status: true,
            reviewedAt: true,
            reviewedBy: true,
            rejectionReason: true,
            userId: true,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.CREATOR_APPLICATION_REJECTED,
            targetType: 'creator_application',
            targetId: applicationId,
            description: `Rejected creator application for ${application.user.name}`,
            affectedUserId: application.user.id,
            metadata: {
              previousStatus: application.status,
              newStatus: ApplicationStatus.REJECTED,
              reason,
            },
            ipAddress: req.ip,
          },
        });

        return updated;
      });

      res.json({
        success: true,
        data: updatedApplication,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rejection payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error rejecting creator application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject creator application',
      });
    }
  }

  static async listReports(req: Request, res: Response) {
    try {
      const query = adminReportsQuerySchema.parse(req.query);
      const { page, limit, status } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.ReportWhereInput = status
        ? { status }
        : {
            status: {
              in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW],
            },
          };

      const [total, items] = await prisma.$transaction([
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            reason: true,
            description: true,
            status: true,
            reviewedAt: true,
            reviewedBy: true,
            resolution: true,
            createdAt: true,
            streamId: true,
            reporter: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            reportedUser: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                isSuspended: true,
              },
            },
            post: {
              select: {
                id: true,
                isHidden: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
            comment: {
              select: {
                id: true,
                isHidden: true,
                content: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list reports',
      });
    }
  }

  static async reviewReport(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { reportId } = req.params;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          error: 'Report ID is required',
        });
      }

      const input = adminReviewReportSchema.parse(req.body);

      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          post: {
            select: {
              id: true,
              isHidden: true,
            },
          },
          comment: {
            select: {
              id: true,
              isHidden: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      if (report.status === ReportStatus.RESOLVED || report.status === ReportStatus.DISMISSED) {
        return res.status(400).json({
          success: false,
          error: 'Report is already finalized',
        });
      }

      if (
        input.decision === 'SUSPEND_REPORTED_USER' &&
        report.reportedUser.role === UserRole.SUPER_ADMIN &&
        req.adminRole !== UserRole.SUPER_ADMIN
      ) {
        return res.status(403).json({
          success: false,
          error: 'Only SUPER_ADMIN can suspend another SUPER_ADMIN',
        });
      }

      const now = new Date();

      const result = await prisma.$transaction(async (tx) => {
        let reportStatus: ReportStatus;
        let action: AdminAction;
        let actionDescription: string;

        switch (input.decision) {
          case 'DISMISS': {
            reportStatus = ReportStatus.DISMISSED;
            action = AdminAction.REPORT_DISMISSED;
            actionDescription = `Dismissed report ${reportId}`;
            break;
          }
          case 'RESOLVE': {
            reportStatus = ReportStatus.RESOLVED;
            action = AdminAction.REPORT_REVIEWED;
            actionDescription = `Resolved report ${reportId}`;
            break;
          }
          case 'HIDE_POST': {
            if (!report.post?.id) {
              throw new Error('Report has no post target to hide');
            }

            await tx.post.update({
              where: { id: report.post.id },
              data: {
                isHidden: true,
                hiddenReason: input.resolution ?? report.reason,
                hiddenBy: authUser.id,
                hiddenAt: now,
              },
            });

            reportStatus = ReportStatus.RESOLVED;
            action = AdminAction.POST_HIDDEN;
            actionDescription = `Hidden reported post ${report.post.id}`;
            break;
          }
          case 'HIDE_COMMENT': {
            if (!report.comment?.id) {
              throw new Error('Report has no comment target to hide');
            }

            await tx.comment.update({
              where: { id: report.comment.id },
              data: {
                isHidden: true,
                hiddenReason: input.resolution ?? report.reason,
                hiddenBy: authUser.id,
                hiddenAt: now,
              },
            });

            reportStatus = ReportStatus.RESOLVED;
            action = AdminAction.COMMENT_HIDDEN;
            actionDescription = `Hidden reported comment ${report.comment.id}`;
            break;
          }
          case 'SUSPEND_REPORTED_USER': {
            await tx.user.update({
              where: { id: report.reportedUser.id },
              data: {
                isSuspended: true,
                suspendedReason: input.resolution ?? report.reason,
                suspendedBy: authUser.id,
                suspendedAt: now,
                suspensionExpiresAt: input.suspensionExpiresAt
                  ? new Date(input.suspensionExpiresAt)
                  : null,
              },
            });

            reportStatus = ReportStatus.RESOLVED;
            action = AdminAction.USER_SUSPENDED;
            actionDescription = `Suspended reported user ${report.reportedUser.name}`;
            break;
          }
          default: {
            throw new Error('Unsupported moderation decision');
          }
        }

        const updatedReport = await tx.report.update({
          where: { id: reportId },
          data: {
            status: reportStatus,
            reviewedAt: now,
            reviewedBy: authUser.id,
            resolution: input.resolution ?? null,
          },
          select: {
            id: true,
            status: true,
            reviewedAt: true,
            reviewedBy: true,
            resolution: true,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action,
            targetType: 'report',
            targetId: reportId,
            description: actionDescription,
            affectedUserId: report.reportedUser.id,
            metadata: {
              decision: input.decision,
              reportStatus,
              resolution: input.resolution ?? null,
            },
            ipAddress: req.ip,
          },
        });

        return updatedReport;
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid moderation review payload',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message.includes('no')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      console.error('[AdminController] Error reviewing report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review report',
      });
    }
  }

  static async listStreamReports(req: Request, res: Response) {
    try {
      const query = adminStreamReportsQuerySchema.parse(req.query);
      const { page, limit, status } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.StreamReportWhereInput = status
        ? { status }
        : {
            status: StreamReportStatus.PENDING,
          };

      const [total, items] = await prisma.$transaction([
        prisma.streamReport.count({ where }),
        prisma.streamReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            reason: true,
            description: true,
            status: true,
            reviewedAt: true,
            reviewedBy: true,
            createdAt: true,
            reporter: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            stream: {
              select: {
                id: true,
                title: true,
                isLive: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing stream reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list stream reports',
      });
    }
  }

  static async reviewStreamReport(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { streamReportId } = req.params;

      if (!streamReportId) {
        return res.status(400).json({
          success: false,
          error: 'Stream report ID is required',
        });
      }

      const input = adminReviewStreamReportSchema.parse(req.body);

      const streamReport = await prisma.streamReport.findUnique({
        where: { id: streamReportId },
        include: {
          stream: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
        },
      });

      if (!streamReport) {
        return res.status(404).json({
          success: false,
          error: 'Stream report not found',
        });
      }

      if (
        streamReport.status === StreamReportStatus.RESOLVED ||
        streamReport.status === StreamReportStatus.DISMISSED
      ) {
        return res.status(400).json({
          success: false,
          error: 'Stream report is already finalized',
        });
      }

      const now = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const updatedReport = await tx.streamReport.update({
          where: { id: streamReportId },
          data: {
            status: input.status,
            reviewedAt: now,
            reviewedBy: authUser.id,
          },
          select: {
            id: true,
            status: true,
            reviewedAt: true,
            reviewedBy: true,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action:
              input.status === StreamReportStatus.DISMISSED
                ? AdminAction.REPORT_DISMISSED
                : AdminAction.REPORT_REVIEWED,
            targetType: 'stream_report',
            targetId: streamReportId,
            description: `Updated stream report ${streamReportId} to ${input.status}`,
            affectedUserId: streamReport.stream.userId,
            metadata: {
              previousStatus: streamReport.status,
              newStatus: input.status,
              resolution: input.resolution ?? null,
            },
            ipAddress: req.ip,
          },
        });

        return updatedReport;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid stream report review payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error reviewing stream report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review stream report',
      });
    }
  }

  static async getFinanceSummary(_req: Request, res: Response) {
    try {
      const { commissionRate, coinToPaiseRate } = await this.getFinanceConfigValues();
      const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        walletsAggregate,
        walletsCount,
        purchaseGroups,
        giftAggregate,
        withdrawalGroups,
        stalePendingPurchases,
        highValuePendingWithdrawals,
      ] = await Promise.all([
        prisma.coinWallet.aggregate({
          _sum: {
            balance: true,
            totalEarned: true,
            totalSpent: true,
          },
        }),
        prisma.coinWallet.count(),
        prisma.coinPurchase.groupBy({
          by: ['status'],
          _count: {
            _all: true,
          },
          _sum: {
            amount: true,
            totalCoins: true,
          },
        }),
        prisma.giftTransaction.aggregate({
          _count: {
            _all: true,
          },
          _sum: {
            coinAmount: true,
          },
        }),
        prisma.creatorWithdrawalRequest.groupBy({
          by: ['status'],
          _count: {
            _all: true,
          },
          _sum: {
            netAmountPaise: true,
          },
        }),
        prisma.coinPurchase.count({
          where: {
            status: PurchaseStatus.PENDING,
            createdAt: {
              lt: staleThreshold,
            },
          },
        }),
        prisma.creatorWithdrawalRequest.count({
          where: {
            status: {
              in: [
                WithdrawalStatus.PENDING,
                WithdrawalStatus.UNDER_REVIEW,
                WithdrawalStatus.ON_HOLD,
              ],
            },
            netAmountPaise: {
              gte: 500000,
            },
          },
        }),
      ]);

      const completedPurchase = purchaseGroups.find(
        (group) => group.status === PurchaseStatus.COMPLETED
      );
      const pendingPurchase = purchaseGroups.find(
        (group) => group.status === PurchaseStatus.PENDING
      );
      const failedPurchase = purchaseGroups.find((group) => group.status === PurchaseStatus.FAILED);

      const withdrawalCountByStatus = {
        PENDING: 0,
        UNDER_REVIEW: 0,
        ON_HOLD: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
      };

      const withdrawalNetByStatus = {
        PENDING: 0,
        UNDER_REVIEW: 0,
        ON_HOLD: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
      };

      for (const group of withdrawalGroups) {
        withdrawalCountByStatus[group.status] = group._count._all;
        withdrawalNetByStatus[group.status] = group._sum.netAmountPaise ?? 0;
      }

      const totalGiftCoins = giftAggregate._sum.coinAmount ?? 0;
      const estimatedCreatorPayoutPaise = Math.floor(
        totalGiftCoins * coinToPaiseRate * (1 - commissionRate)
      );

      const trackedWithdrawalExposurePaise =
        withdrawalNetByStatus.PENDING +
        withdrawalNetByStatus.UNDER_REVIEW +
        withdrawalNetByStatus.ON_HOLD +
        withdrawalNetByStatus.APPROVED +
        withdrawalNetByStatus.PAID;

      res.json({
        success: true,
        data: {
          config: {
            commissionRate,
            coinToPaiseRate,
          },
          wallets: {
            totalWallets: walletsCount,
            totalBalanceCoins: walletsAggregate._sum.balance ?? 0,
            totalEarnedCoins: walletsAggregate._sum.totalEarned ?? 0,
            totalSpentCoins: walletsAggregate._sum.totalSpent ?? 0,
          },
          purchases: {
            completedCount: completedPurchase?._count._all ?? 0,
            completedVolumePaise: completedPurchase?._sum.amount ?? 0,
            completedCoins: completedPurchase?._sum.totalCoins ?? 0,
            pendingCount: pendingPurchase?._count._all ?? 0,
            failedCount: failedPurchase?._count._all ?? 0,
            stalePendingCount: stalePendingPurchases,
          },
          gifts: {
            totalTransactions: giftAggregate._count._all,
            totalCoinsMoved: totalGiftCoins,
            estimatedCreatorPayoutPaise,
          },
          withdrawals: {
            countByStatus: withdrawalCountByStatus,
            netAmountByStatusPaise: withdrawalNetByStatus,
            highValuePendingCount: highValuePendingWithdrawals,
          },
          reconciliation: {
            trackedWithdrawalExposurePaise,
            estimatedCreatorPayoutPaise,
            gapPaise: estimatedCreatorPayoutPaise - trackedWithdrawalExposurePaise,
          },
          anomalies: {
            count: stalePendingPurchases + highValuePendingWithdrawals,
            stalePendingPurchases,
            highValuePendingWithdrawals,
          },
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[AdminController] Error fetching finance summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch finance summary',
      });
    }
  }

  static async listFinanceTransactions(req: Request, res: Response) {
    try {
      const query = adminFinanceTransactionsQuerySchema.parse(req.query);
      const { page, limit, type, status, search, userId } = query;
      const skip = (page - 1) * limit;
      const { coinToPaiseRate } = await this.getFinanceConfigValues();

      if (type === 'PURCHASE') {
        if (status && !this.isPurchaseStatus(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid purchase status: ${status}`,
          });
        }

        const purchaseStatus = status && this.isPurchaseStatus(status) ? status : undefined;

        const where: Prisma.CoinPurchaseWhereInput = {};

        if (purchaseStatus) {
          where.status = purchaseStatus;
        }

        if (userId) {
          where.userId = userId;
        }

        if (search) {
          where.OR = [
            { orderId: { contains: search, mode: 'insensitive' } },
            { transactionId: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const [total, items] = await prisma.$transaction([
          prisma.coinPurchase.count({ where }),
          prisma.coinPurchase.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                },
              },
              package: {
                select: {
                  id: true,
                  name: true,
                  coins: true,
                },
              },
            },
          }),
        ]);

        return res.json({
          success: true,
          data: {
            type,
            items: items.map((item) => ({
              id: item.id,
              type,
              status: item.status,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              user: item.user,
              amountPaise: item.amount,
              totalCoins: item.totalCoins,
              package: item.package,
              orderId: item.orderId,
              transactionId: item.transactionId,
              failureReason: item.failureReason,
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      }

      if (type === 'GIFT') {
        if (status && status !== 'COMPLETED') {
          return res.status(400).json({
            success: false,
            error: 'Gift transactions only support status=COMPLETED',
          });
        }

        const where: Prisma.GiftTransactionWhereInput = {};
        const andFilters: Prisma.GiftTransactionWhereInput[] = [];

        if (userId) {
          andFilters.push({
            OR: [{ senderId: userId }, { receiverId: userId }],
          });
        }

        if (search) {
          andFilters.push({
            OR: [
              { sender: { username: { contains: search, mode: 'insensitive' } } },
              { receiver: { username: { contains: search, mode: 'insensitive' } } },
              { sender: { name: { contains: search, mode: 'insensitive' } } },
              { receiver: { name: { contains: search, mode: 'insensitive' } } },
              { gift: { name: { contains: search, mode: 'insensitive' } } },
              { stream: { title: { contains: search, mode: 'insensitive' } } },
            ],
          });
        }

        if (andFilters.length > 0) {
          where.AND = andFilters;
        }

        const [total, items] = await prisma.$transaction([
          prisma.giftTransaction.count({ where }),
          prisma.giftTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                },
              },
              gift: {
                select: {
                  id: true,
                  name: true,
                  coinPrice: true,
                },
              },
              stream: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          }),
        ]);

        return res.json({
          success: true,
          data: {
            type,
            items: items.map((item) => ({
              id: item.id,
              type,
              status: 'COMPLETED',
              createdAt: item.createdAt,
              sender: item.sender,
              receiver: item.receiver,
              gift: item.gift,
              stream: item.stream,
              coinAmount: item.coinAmount,
              amountPaise: item.coinAmount * coinToPaiseRate,
              quantity: item.quantity,
              message: item.message,
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      }

      if (status && !this.isWithdrawalStatus(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid withdrawal status: ${status}`,
        });
      }

      const withdrawalStatus = status && this.isWithdrawalStatus(status) ? status : undefined;

      const where: Prisma.CreatorWithdrawalRequestWhereInput = {};

      if (withdrawalStatus) {
        where.status = withdrawalStatus;
      }

      if (userId) {
        where.userId = userId;
      }

      if (search) {
        where.OR = [
          { payoutReference: { contains: search, mode: 'insensitive' } },
          { reason: { contains: search, mode: 'insensitive' } },
          { user: { username: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.creatorWithdrawalRequest.count({ where }),
        prisma.creatorWithdrawalRequest.findMany({
          where,
          orderBy: { requestedAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          type,
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid finance transaction query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing finance transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list finance transactions',
      });
    }
  }

  static async exportFinanceTransactionsCsv(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const query = adminFinanceTransactionsQuerySchema.parse(req.query);
      const { type, status, search, userId } = query;
      const { coinToPaiseRate } = await this.getFinanceConfigValues();
      const exportLimit = 5000;

      const header = [
        'type',
        'id',
        'createdAt',
        'updatedAt',
        'status',
        'primaryUser',
        'secondaryUser',
        'amountPaise',
        'coinAmount',
        'totalCoins',
        'orderId',
        'transactionId',
        'payoutReference',
        'giftName',
        'streamTitle',
        'reviewer',
        'reason',
      ];

      const rows: Array<Array<string | number | boolean | null | undefined>> = [];

      if (type === 'PURCHASE') {
        if (status && !this.isPurchaseStatus(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid purchase status: ${status}`,
          });
        }

        const purchaseStatus = status && this.isPurchaseStatus(status) ? status : undefined;
        const where: Prisma.CoinPurchaseWhereInput = {};

        if (purchaseStatus) {
          where.status = purchaseStatus;
        }

        if (userId) {
          where.userId = userId;
        }

        if (search) {
          where.OR = [
            { orderId: { contains: search, mode: 'insensitive' } },
            { transactionId: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const items = await prisma.coinPurchase.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: exportLimit,
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        });

        for (const item of items) {
          rows.push([
            type,
            item.id,
            item.createdAt.toISOString(),
            item.updatedAt.toISOString(),
            item.status,
            item.user.username,
            '',
            item.amount,
            '',
            item.totalCoins,
            item.orderId,
            item.transactionId,
            '',
            '',
            '',
            '',
            item.failureReason,
          ]);
        }
      } else if (type === 'GIFT') {
        if (status && status !== 'COMPLETED') {
          return res.status(400).json({
            success: false,
            error: 'Gift transactions only support status=COMPLETED',
          });
        }

        const where: Prisma.GiftTransactionWhereInput = {};
        const andFilters: Prisma.GiftTransactionWhereInput[] = [];

        if (userId) {
          andFilters.push({
            OR: [{ senderId: userId }, { receiverId: userId }],
          });
        }

        if (search) {
          andFilters.push({
            OR: [
              { sender: { username: { contains: search, mode: 'insensitive' } } },
              { receiver: { username: { contains: search, mode: 'insensitive' } } },
              { sender: { name: { contains: search, mode: 'insensitive' } } },
              { receiver: { name: { contains: search, mode: 'insensitive' } } },
              { gift: { name: { contains: search, mode: 'insensitive' } } },
              { stream: { title: { contains: search, mode: 'insensitive' } } },
            ],
          });
        }

        if (andFilters.length > 0) {
          where.AND = andFilters;
        }

        const items = await prisma.giftTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: exportLimit,
          include: {
            sender: {
              select: {
                username: true,
              },
            },
            receiver: {
              select: {
                username: true,
              },
            },
            gift: {
              select: {
                name: true,
              },
            },
            stream: {
              select: {
                title: true,
              },
            },
          },
        });

        for (const item of items) {
          rows.push([
            type,
            item.id,
            item.createdAt.toISOString(),
            item.createdAt.toISOString(),
            'COMPLETED',
            item.sender.username,
            item.receiver.username,
            item.coinAmount * coinToPaiseRate,
            item.coinAmount,
            '',
            '',
            '',
            '',
            item.gift.name,
            item.stream?.title ?? '',
            '',
            item.message,
          ]);
        }
      } else {
        if (status && !this.isWithdrawalStatus(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid withdrawal status: ${status}`,
          });
        }

        const withdrawalStatus = status && this.isWithdrawalStatus(status) ? status : undefined;
        const where: Prisma.CreatorWithdrawalRequestWhereInput = {};

        if (withdrawalStatus) {
          where.status = withdrawalStatus;
        }

        if (userId) {
          where.userId = userId;
        }

        if (search) {
          where.OR = [
            { payoutReference: { contains: search, mode: 'insensitive' } },
            { reason: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const items = await prisma.creatorWithdrawalRequest.findMany({
          where,
          orderBy: { requestedAt: 'desc' },
          take: exportLimit,
          include: {
            user: {
              select: {
                username: true,
              },
            },
            reviewer: {
              select: {
                username: true,
              },
            },
          },
        });

        for (const item of items) {
          rows.push([
            type,
            item.id,
            item.requestedAt.toISOString(),
            item.reviewedAt?.toISOString() ?? item.requestedAt.toISOString(),
            item.status,
            item.user.username,
            '',
            item.netAmountPaise,
            '',
            item.amountCoins,
            '',
            '',
            item.payoutReference,
            '',
            '',
            item.reviewer?.username,
            item.reason,
          ]);
        }
      }

      const csvContent = [
        header.join(','),
        ...rows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(',')),
      ].join('\n');

      await this.logAdminAction({
        adminId: authUser.id,
        action: AdminAction.SETTING_UPDATED,
        targetType: 'finance_transactions_export',
        targetId: type,
        description: `Exported finance ${type.toLowerCase()} transactions CSV`,
        metadata: {
          filters: {
            status: status ?? null,
            search: search ?? null,
            userId: userId ?? null,
          },
          exportedRows: rows.length,
        },
        ipAddress: req.ip,
      });

      const filename = `finance-${type.toLowerCase()}-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return res.status(200).send(csvContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid finance transaction export query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error exporting finance transactions CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export finance transactions CSV',
      });
    }
  }

  static async listWithdrawals(req: Request, res: Response) {
    try {
      const query = adminWithdrawalsQuerySchema.parse(req.query);
      const { page, limit, status, search, userId } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.CreatorWithdrawalRequestWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (userId) {
        where.userId = userId;
      }

      if (search) {
        where.OR = [
          { payoutReference: { contains: search, mode: 'insensitive' } },
          { reason: { contains: search, mode: 'insensitive' } },
          { user: { username: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.creatorWithdrawalRequest.count({ where }),
        prisma.creatorWithdrawalRequest.findMany({
          where,
          orderBy: { requestedAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid withdrawal query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing withdrawals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list withdrawals',
      });
    }
  }

  static async reviewWithdrawal(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { withdrawalId } = req.params;

      if (!withdrawalId) {
        return res.status(400).json({
          success: false,
          error: 'Withdrawal ID is required',
        });
      }

      const input = adminReviewWithdrawalSchema.parse(req.body);

      const withdrawal = await prisma.creatorWithdrawalRequest.findUnique({
        where: { id: withdrawalId },
        select: {
          id: true,
          userId: true,
          status: true,
          amountCoins: true,
          reason: true,
          payoutReference: true,
          netAmountPaise: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          error: 'Withdrawal request not found',
        });
      }

      const now = new Date();
      const updateData: Prisma.CreatorWithdrawalRequestUpdateInput = {
        reviewedAt: now,
        reviewer: {
          connect: {
            id: authUser.id,
          },
        },
      };

      let nextStatus: WithdrawalStatus;
      let action: AdminAction;
      let description: string;

      switch (input.decision) {
        case 'APPROVE': {
          if (
            withdrawal.status !== WithdrawalStatus.PENDING &&
            withdrawal.status !== WithdrawalStatus.UNDER_REVIEW &&
            withdrawal.status !== WithdrawalStatus.ON_HOLD
          ) {
            return res.status(400).json({
              success: false,
              error: `Cannot approve withdrawal in ${withdrawal.status} state`,
            });
          }

          nextStatus = WithdrawalStatus.APPROVED;
          action = AdminAction.WITHDRAWAL_APPROVED;
          description = `Approved withdrawal request ${withdrawalId}`;
          updateData.status = nextStatus;
          updateData.approvedAt = now;
          updateData.rejectedAt = null;
          if (input.reason) {
            updateData.reason = input.reason;
          }
          break;
        }
        case 'REJECT': {
          if (
            withdrawal.status === WithdrawalStatus.REJECTED ||
            withdrawal.status === WithdrawalStatus.PAID
          ) {
            return res.status(400).json({
              success: false,
              error: `Cannot reject withdrawal in ${withdrawal.status} state`,
            });
          }

          nextStatus = WithdrawalStatus.REJECTED;
          action = AdminAction.WITHDRAWAL_REJECTED;
          description = `Rejected withdrawal request ${withdrawalId}`;
          updateData.status = nextStatus;
          updateData.rejectedAt = now;
          updateData.approvedAt = null;
          updateData.paidAt = null;
          updateData.reason = input.reason;
          break;
        }
        case 'HOLD': {
          if (
            withdrawal.status === WithdrawalStatus.REJECTED ||
            withdrawal.status === WithdrawalStatus.PAID
          ) {
            return res.status(400).json({
              success: false,
              error: `Cannot put withdrawal on hold in ${withdrawal.status} state`,
            });
          }

          nextStatus = WithdrawalStatus.ON_HOLD;
          action = AdminAction.WITHDRAWAL_HOLD;
          description = `Placed withdrawal request ${withdrawalId} on hold`;
          updateData.status = nextStatus;
          updateData.reason = input.reason;
          break;
        }
        case 'RELEASE_HOLD': {
          if (withdrawal.status !== WithdrawalStatus.ON_HOLD) {
            return res.status(400).json({
              success: false,
              error: 'Only ON_HOLD withdrawals can be released',
            });
          }

          nextStatus = WithdrawalStatus.UNDER_REVIEW;
          action = AdminAction.WITHDRAWAL_RELEASED;
          description = `Released withdrawal request ${withdrawalId} from hold`;
          updateData.status = nextStatus;
          if (input.reason) {
            updateData.reason = input.reason;
          }
          break;
        }
        case 'MARK_PAID': {
          if (withdrawal.status !== WithdrawalStatus.APPROVED) {
            return res.status(400).json({
              success: false,
              error: 'Only APPROVED withdrawals can be marked as paid',
            });
          }

          nextStatus = WithdrawalStatus.PAID;
          action = AdminAction.WITHDRAWAL_MARKED_PAID;
          description = `Marked withdrawal request ${withdrawalId} as paid`;
          updateData.status = nextStatus;
          updateData.paidAt = now;
          updateData.payoutReference = input.payoutReference;
          if (input.reason) {
            updateData.reason = input.reason;
          }
          break;
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.creatorWithdrawalRequest.update({
          where: { id: withdrawalId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        });

        if (input.decision === 'REJECT') {
          await tx.coinWallet.upsert({
            where: {
              userId: withdrawal.userId,
            },
            create: {
              userId: withdrawal.userId,
              balance: withdrawal.amountCoins,
            },
            update: {
              balance: {
                increment: withdrawal.amountCoins,
              },
            },
          });
        }

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action,
            targetType: 'withdrawal',
            targetId: withdrawalId,
            description,
            affectedUserId: withdrawal.userId,
            metadata: {
              decision: input.decision,
              previousStatus: withdrawal.status,
              nextStatus,
              reason: input.reason ?? withdrawal.reason ?? null,
              payoutReference: input.payoutReference ?? withdrawal.payoutReference ?? null,
              netAmountPaise: withdrawal.netAmountPaise,
              refundedCoins: input.decision === 'REJECT' ? withdrawal.amountCoins : 0,
            },
            ipAddress: req.ip,
          },
        });

        return updatedRequest;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid withdrawal review payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error reviewing withdrawal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review withdrawal',
      });
    }
  }

  static async getCommissionConfig(_req: Request, res: Response) {
    try {
      const config = await this.getFinanceConfigValues();

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('[AdminController] Error fetching commission config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch commission config',
      });
    }
  }

  static async updateCommissionConfig(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminCommissionConfigSchema.parse(req.body);

      const config = await prisma.$transaction(async (tx) => {
        await tx.systemSetting.upsert({
          where: {
            key: 'finance.defaultCommissionRate',
          },
          update: {
            value: String(payload.commissionRate),
            description: 'Default platform commission rate for payout calculations',
            isPublic: false,
            updatedBy: authUser.id,
          },
          create: {
            key: 'finance.defaultCommissionRate',
            value: String(payload.commissionRate),
            description: 'Default platform commission rate for payout calculations',
            isPublic: false,
            updatedBy: authUser.id,
          },
        });

        await tx.systemSetting.upsert({
          where: {
            key: 'finance.coinToPaiseRate',
          },
          update: {
            value: String(payload.coinToPaiseRate),
            description: 'Coin to paise conversion rate for finance reconciliation',
            isPublic: false,
            updatedBy: authUser.id,
          },
          create: {
            key: 'finance.coinToPaiseRate',
            value: String(payload.coinToPaiseRate),
            description: 'Coin to paise conversion rate for finance reconciliation',
            isPublic: false,
            updatedBy: authUser.id,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.SETTING_UPDATED,
            targetType: 'system_setting',
            targetId: 'finance.config',
            description: 'Updated finance commission configuration',
            metadata: {
              commissionRate: payload.commissionRate,
              coinToPaiseRate: payload.coinToPaiseRate,
            },
            ipAddress: req.ip,
          },
        });

        return {
          commissionRate: payload.commissionRate,
          coinToPaiseRate: payload.coinToPaiseRate,
        };
      });

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid commission configuration payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error updating commission config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update commission config',
      });
    }
  }

  static async getFinanceReconciliation(req: Request, res: Response) {
    try {
      const query = adminFinanceReconciliationQuerySchema.parse(req.query);
      const dateFilter = this.buildDateRangeFilter(query.from, query.to);
      const { commissionRate, coinToPaiseRate } = await this.getFinanceConfigValues();

      const giftWhere: Prisma.GiftTransactionWhereInput = {};
      const purchaseWhere: Prisma.CoinPurchaseWhereInput = {
        status: PurchaseStatus.COMPLETED,
      };
      const withdrawalWhere: Prisma.CreatorWithdrawalRequestWhereInput = {};

      if (dateFilter) {
        giftWhere.createdAt = dateFilter;
        purchaseWhere.createdAt = dateFilter;
        withdrawalWhere.requestedAt = dateFilter;
      }

      const [giftAggregate, purchaseAggregate, withdrawalGroups] = await Promise.all([
        prisma.giftTransaction.aggregate({
          where: giftWhere,
          _count: {
            _all: true,
          },
          _sum: {
            coinAmount: true,
          },
        }),
        prisma.coinPurchase.aggregate({
          where: purchaseWhere,
          _count: {
            _all: true,
          },
          _sum: {
            amount: true,
            totalCoins: true,
          },
        }),
        prisma.creatorWithdrawalRequest.groupBy({
          where: withdrawalWhere,
          by: ['status'],
          _count: {
            _all: true,
          },
          _sum: {
            netAmountPaise: true,
          },
        }),
      ]);

      const withdrawalNetByStatus = {
        PENDING: 0,
        UNDER_REVIEW: 0,
        ON_HOLD: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
      };

      for (const group of withdrawalGroups) {
        withdrawalNetByStatus[group.status] = group._sum.netAmountPaise ?? 0;
      }

      const totalGiftCoins = giftAggregate._sum.coinAmount ?? 0;
      const estimatedCreatorPayoutPaise = Math.floor(
        totalGiftCoins * coinToPaiseRate * (1 - commissionRate)
      );

      const pendingSettlementPaise =
        withdrawalNetByStatus.PENDING +
        withdrawalNetByStatus.UNDER_REVIEW +
        withdrawalNetByStatus.ON_HOLD;

      const approvedNotPaidPaise = withdrawalNetByStatus.APPROVED;
      const paidOutPaise = withdrawalNetByStatus.PAID;
      const trackedExposurePaise = pendingSettlementPaise + approvedNotPaidPaise + paidOutPaise;

      res.json({
        success: true,
        data: {
          period: {
            from: query.from ?? null,
            to: query.to ?? null,
          },
          config: {
            commissionRate,
            coinToPaiseRate,
          },
          purchases: {
            completedCount: purchaseAggregate._count._all,
            completedVolumePaise: purchaseAggregate._sum.amount ?? 0,
            completedCoins: purchaseAggregate._sum.totalCoins ?? 0,
          },
          creatorEconomy: {
            giftTransactions: giftAggregate._count._all,
            totalGiftCoins,
            estimatedCreatorPayoutPaise,
          },
          withdrawals: {
            netAmountByStatusPaise: withdrawalNetByStatus,
            pendingSettlementPaise,
            approvedNotPaidPaise,
            paidOutPaise,
          },
          reconciliation: {
            trackedExposurePaise,
            estimatedCreatorPayoutPaise,
            gapPaise: estimatedCreatorPayoutPaise - trackedExposurePaise,
          },
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reconciliation query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error fetching finance reconciliation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch finance reconciliation',
      });
    }
  }

  static async exportFinanceReconciliationCsv(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const query = adminFinanceReconciliationQuerySchema.parse(req.query);
      const dateFilter = this.buildDateRangeFilter(query.from, query.to);
      const { commissionRate, coinToPaiseRate } = await this.getFinanceConfigValues();

      const giftWhere: Prisma.GiftTransactionWhereInput = {};
      const purchaseWhere: Prisma.CoinPurchaseWhereInput = {
        status: PurchaseStatus.COMPLETED,
      };
      const withdrawalWhere: Prisma.CreatorWithdrawalRequestWhereInput = {};

      if (dateFilter) {
        giftWhere.createdAt = dateFilter;
        purchaseWhere.createdAt = dateFilter;
        withdrawalWhere.requestedAt = dateFilter;
      }

      const [giftAggregate, purchaseAggregate, withdrawalGroups] = await Promise.all([
        prisma.giftTransaction.aggregate({
          where: giftWhere,
          _count: {
            _all: true,
          },
          _sum: {
            coinAmount: true,
          },
        }),
        prisma.coinPurchase.aggregate({
          where: purchaseWhere,
          _count: {
            _all: true,
          },
          _sum: {
            amount: true,
            totalCoins: true,
          },
        }),
        prisma.creatorWithdrawalRequest.groupBy({
          where: withdrawalWhere,
          by: ['status'],
          _count: {
            _all: true,
          },
          _sum: {
            netAmountPaise: true,
          },
        }),
      ]);

      const withdrawalNetByStatus = {
        PENDING: 0,
        UNDER_REVIEW: 0,
        ON_HOLD: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
      };

      for (const group of withdrawalGroups) {
        withdrawalNetByStatus[group.status] = group._sum.netAmountPaise ?? 0;
      }

      const totalGiftCoins = giftAggregate._sum.coinAmount ?? 0;
      const estimatedCreatorPayoutPaise = Math.floor(
        totalGiftCoins * coinToPaiseRate * (1 - commissionRate)
      );

      const pendingSettlementPaise =
        withdrawalNetByStatus.PENDING +
        withdrawalNetByStatus.UNDER_REVIEW +
        withdrawalNetByStatus.ON_HOLD;

      const approvedNotPaidPaise = withdrawalNetByStatus.APPROVED;
      const paidOutPaise = withdrawalNetByStatus.PAID;
      const trackedExposurePaise = pendingSettlementPaise + approvedNotPaidPaise + paidOutPaise;
      const generatedAt = new Date().toISOString();

      const header = ['metric', 'value', 'note', 'generatedAt'];
      const rows: Array<Array<string | number | boolean | null | undefined>> = [
        ['period.from', query.from ?? 'ALL', '', generatedAt],
        ['period.to', query.to ?? 'ALL', '', generatedAt],
        ['config.commissionRate', commissionRate, '', generatedAt],
        ['config.coinToPaiseRate', coinToPaiseRate, '', generatedAt],
        ['purchases.completedCount', purchaseAggregate._count._all, '', generatedAt],
        ['purchases.completedVolumePaise', purchaseAggregate._sum.amount ?? 0, '', generatedAt],
        ['purchases.completedCoins', purchaseAggregate._sum.totalCoins ?? 0, '', generatedAt],
        ['creatorEconomy.giftTransactions', giftAggregate._count._all, '', generatedAt],
        ['creatorEconomy.totalGiftCoins', totalGiftCoins, '', generatedAt],
        [
          'creatorEconomy.estimatedCreatorPayoutPaise',
          estimatedCreatorPayoutPaise,
          '',
          generatedAt,
        ],
        ['withdrawals.pendingSettlementPaise', pendingSettlementPaise, '', generatedAt],
        ['withdrawals.approvedNotPaidPaise', approvedNotPaidPaise, '', generatedAt],
        ['withdrawals.paidOutPaise', paidOutPaise, '', generatedAt],
        [
          'withdrawals.netAmountByStatusPaise.PENDING',
          withdrawalNetByStatus.PENDING,
          '',
          generatedAt,
        ],
        [
          'withdrawals.netAmountByStatusPaise.UNDER_REVIEW',
          withdrawalNetByStatus.UNDER_REVIEW,
          '',
          generatedAt,
        ],
        [
          'withdrawals.netAmountByStatusPaise.ON_HOLD',
          withdrawalNetByStatus.ON_HOLD,
          '',
          generatedAt,
        ],
        [
          'withdrawals.netAmountByStatusPaise.APPROVED',
          withdrawalNetByStatus.APPROVED,
          '',
          generatedAt,
        ],
        [
          'withdrawals.netAmountByStatusPaise.REJECTED',
          withdrawalNetByStatus.REJECTED,
          '',
          generatedAt,
        ],
        ['withdrawals.netAmountByStatusPaise.PAID', withdrawalNetByStatus.PAID, '', generatedAt],
        ['reconciliation.trackedExposurePaise', trackedExposurePaise, '', generatedAt],
        [
          'reconciliation.gapPaise',
          estimatedCreatorPayoutPaise - trackedExposurePaise,
          '',
          generatedAt,
        ],
      ];

      const csvContent = [
        header.join(','),
        ...rows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(',')),
      ].join('\n');

      await this.logAdminAction({
        adminId: authUser.id,
        action: AdminAction.SETTING_UPDATED,
        targetType: 'finance_reconciliation_export',
        targetId: 'finance',
        description: 'Exported finance reconciliation CSV snapshot',
        metadata: {
          period: {
            from: query.from ?? null,
            to: query.to ?? null,
          },
          trackedExposurePaise,
          estimatedCreatorPayoutPaise,
          gapPaise: estimatedCreatorPayoutPaise - trackedExposurePaise,
        },
        ipAddress: req.ip,
      });

      const filename = `finance-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return res.status(200).send(csvContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reconciliation export query parameters',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error exporting finance reconciliation CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export finance reconciliation CSV',
      });
    }
  }

  static async listAdCampaigns(req: Request, res: Response) {
    try {
      const query = adminAdCampaignQuerySchema.parse(req.query);
      const { page, limit, status, search } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.AdCampaignWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            objective: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.adCampaign.count({ where }),
        prisma.adCampaign.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const campaignIds = items.map((item) => item.id);
      const metricGroups =
        campaignIds.length > 0
          ? await prisma.adCampaignMetricDaily.groupBy({
              by: ['campaignId'],
              where: {
                campaignId: {
                  in: campaignIds,
                },
              },
              _sum: {
                impressions: true,
                clicks: true,
                conversions: true,
                spendPaise: true,
              },
            })
          : [];

      const metricsByCampaign = new Map(metricGroups.map((group) => [group.campaignId, group]));
      const alertThresholds = await this.getAdAlertThresholds();

      res.json({
        success: true,
        data: {
          items: items.map((item) => {
            const metric = metricsByCampaign.get(item.id);
            const impressions = metric?._sum.impressions ?? 0;
            const clicks = metric?._sum.clicks ?? 0;
            const conversions = metric?._sum.conversions ?? 0;
            const spendPaise = metric?._sum.spendPaise ?? item.spendPaise;
            const ctrPercent = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const conversionPercent = clicks > 0 ? (conversions / clicks) * 100 : 0;
            const cpmInr = impressions > 0 ? spendPaise / 100 / (impressions / 1000) : 0;
            const alertEvaluation = this.evaluateCampaignAlerts({
              impressions,
              clicks,
              spendPaise,
              totalBudgetPaise: item.totalBudgetPaise,
              thresholds: alertThresholds,
            });

            return {
              ...item,
              analytics: {
                impressions,
                clicks,
                conversions,
                spendPaise,
                ctrPercent,
                conversionPercent,
                cpmInr,
                alerts: {
                  isLowCtr: alertEvaluation.isLowCtr,
                  isOverspend: alertEvaluation.isOverspend,
                  budgetUtilizationPercent: alertEvaluation.budgetUtilizationPercent,
                  lowCtrThresholdPercent: alertThresholds.lowCtrPercent,
                  lowCtrMinImpressions: alertThresholds.lowCtrMinImpressions,
                  overspendThresholdPercent: alertThresholds.overspendPercent,
                },
              },
            };
          }),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign list query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error listing ad campaigns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list ad campaigns',
      });
    }
  }

  static async createAdCampaign(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminCreateAdCampaignSchema.parse(req.body);
      const now = new Date();
      const startAt = payload.startAt ? new Date(payload.startAt) : undefined;
      const endAt = payload.endAt ? new Date(payload.endAt) : undefined;

      let status: AdCampaignStatus = AdCampaignStatus.DRAFT;
      if (startAt && startAt > now) {
        status = AdCampaignStatus.SCHEDULED;
      }
      if (startAt && startAt <= now && (!endAt || endAt > now)) {
        status = AdCampaignStatus.ACTIVE;
      }

      const campaign = await prisma.$transaction(async (tx) => {
        const created = await tx.adCampaign.create({
          data: {
            name: payload.name,
            objective: payload.objective || null,
            status,
            startAt,
            endAt,
            dailyBudgetPaise: payload.dailyBudgetPaise,
            totalBudgetPaise: payload.totalBudgetPaise,
            targeting:
              payload.targeting !== undefined
                ? (payload.targeting as Prisma.InputJsonValue)
                : undefined,
            deliveryConfig:
              payload.deliveryConfig !== undefined
                ? (payload.deliveryConfig as Prisma.InputJsonValue)
                : undefined,
            createdBy: authUser.id,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.AD_CAMPAIGN_CREATED,
            targetType: 'ad_campaign',
            targetId: created.id,
            description: `Created ad campaign ${created.name}`,
            metadata: {
              status: created.status,
              startAt: created.startAt,
              endAt: created.endAt,
              dailyBudgetPaise: created.dailyBudgetPaise,
              totalBudgetPaise: created.totalBudgetPaise,
            },
            ipAddress: req.ip,
          },
        });

        return created;
      });

      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error creating ad campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create ad campaign',
      });
    }
  }

  static async updateAdCampaignStatus(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { campaignId } = req.params;
      if (!campaignId) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required',
        });
      }

      const payload = adminUpdateAdCampaignStatusSchema.parse(req.body);

      const existing = await prisma.adCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
      }

      if (!this.canTransitionAdCampaignStatus(existing.status, payload.status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid campaign status transition ${existing.status} -> ${payload.status}`,
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const campaign = await tx.adCampaign.update({
          where: { id: campaignId },
          data: {
            status: payload.status,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.AD_CAMPAIGN_STATUS_CHANGED,
            targetType: 'ad_campaign',
            targetId: campaign.id,
            description: `Changed campaign ${campaign.name} status to ${payload.status}`,
            metadata: {
              previousStatus: existing.status,
              nextStatus: payload.status,
              reason: payload.reason ?? null,
            },
            ipAddress: req.ip,
          },
        });

        return campaign;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign status payload',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error updating campaign status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update campaign status',
      });
    }
  }

  static async getAdCampaignAnalytics(req: Request, res: Response) {
    try {
      const accessContext = await this.ensureAdminAnalyticsScopes(req, res, ['GROWTH']);
      if (!accessContext) return;

      const { campaignId } = req.params;
      if (!campaignId) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required',
        });
      }

      const query = adminCampaignAnalyticsQuerySchema.parse(req.query);
      const dateFilter = this.buildDateRangeFilter(query.from, query.to);

      const campaign = await prisma.adCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
      }

      const where: Prisma.AdCampaignMetricDailyWhereInput = {
        campaignId,
      };

      if (dateFilter) {
        where.bucketDate = dateFilter;
      }

      const [totals, dailyMetrics] = await Promise.all([
        prisma.adCampaignMetricDaily.aggregate({
          where,
          _sum: {
            impressions: true,
            clicks: true,
            conversions: true,
            spendPaise: true,
          },
        }),
        prisma.adCampaignMetricDaily.findMany({
          where,
          orderBy: { bucketDate: 'asc' },
          select: {
            bucketDate: true,
            impressions: true,
            clicks: true,
            conversions: true,
            spendPaise: true,
          },
        }),
      ]);

      const impressions = totals._sum.impressions ?? 0;
      const clicks = totals._sum.clicks ?? 0;
      const conversions = totals._sum.conversions ?? 0;
      const spendPaise = totals._sum.spendPaise ?? campaign.spendPaise;
      const ctrPercent = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionPercent = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const cpmInr = impressions > 0 ? spendPaise / 100 / (impressions / 1000) : 0;
      const alertThresholds = await this.getAdAlertThresholds();
      const alertEvaluation = this.evaluateCampaignAlerts({
        impressions,
        clicks,
        spendPaise,
        totalBudgetPaise: campaign.totalBudgetPaise,
        thresholds: alertThresholds,
      });

      res.json({
        success: true,
        data: {
          campaign,
          access: {
            grantedScopes: accessContext.grantedScopes,
          },
          period: {
            from: query.from ?? null,
            to: query.to ?? null,
          },
          summary: {
            impressions,
            clicks,
            conversions,
            spendPaise,
            ctrPercent,
            conversionPercent,
            cpmInr,
            alerts: {
              isLowCtr: alertEvaluation.isLowCtr,
              isOverspend: alertEvaluation.isOverspend,
              budgetUtilizationPercent: alertEvaluation.budgetUtilizationPercent,
              lowCtrThresholdPercent: alertThresholds.lowCtrPercent,
              lowCtrMinImpressions: alertThresholds.lowCtrMinImpressions,
              overspendThresholdPercent: alertThresholds.overspendPercent,
            },
          },
          dailyMetrics,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign analytics query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error fetching campaign analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaign analytics',
      });
    }
  }

  static async exportAdCampaignAnalyticsCsv(req: Request, res: Response) {
    try {
      const accessContext = await this.ensureAdminAnalyticsScopes(req, res, ['GROWTH']);
      if (!accessContext) return;

      const { campaignId } = req.params;
      if (!campaignId) {
        return res.status(400).json({
          success: false,
          error: 'Campaign ID is required',
        });
      }

      const query = adminCampaignAnalyticsQuerySchema.parse(req.query);
      const dateFilter = this.buildDateRangeFilter(query.from, query.to);

      const campaign = await prisma.adCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
      }

      const where: Prisma.AdCampaignMetricDailyWhereInput = {
        campaignId,
      };

      if (dateFilter) {
        where.bucketDate = dateFilter;
      }

      const dailyMetrics = await prisma.adCampaignMetricDaily.findMany({
        where,
        orderBy: { bucketDate: 'asc' },
        select: {
          bucketDate: true,
          impressions: true,
          clicks: true,
          conversions: true,
          spendPaise: true,
        },
      });

      const csvHeader = [
        'campaignId',
        'campaignName',
        'bucketDate',
        'impressions',
        'clicks',
        'conversions',
        'spendPaise',
        'spendInr',
        'ctrPercent',
        'conversionPercent',
        'cpmInr',
      ];

      const csvRows = dailyMetrics.map((metric) => {
        const impressions = metric.impressions;
        const clicks = metric.clicks;
        const conversions = metric.conversions;
        const spendPaise = metric.spendPaise;
        const ctrPercent = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const conversionPercent = clicks > 0 ? (conversions / clicks) * 100 : 0;
        const cpmInr = impressions > 0 ? spendPaise / 100 / (impressions / 1000) : 0;

        return [
          campaign.id,
          campaign.name,
          metric.bucketDate.toISOString().slice(0, 10),
          impressions,
          clicks,
          conversions,
          spendPaise,
          (spendPaise / 100).toFixed(2),
          ctrPercent.toFixed(4),
          conversionPercent.toFixed(4),
          cpmInr.toFixed(4),
        ]
          .map((cell) => this.escapeCsvCell(cell))
          .join(',');
      });

      const csvContent = [csvHeader.join(','), ...csvRows].join('\n');
      const safeName = campaign.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const filename = `${safeName || campaign.id}-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Admin-Analytics-Scopes', accessContext.grantedScopes.join(','));

      return res.status(200).send(csvContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign analytics export query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error exporting campaign analytics CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export campaign analytics CSV',
      });
    }
  }

  static async getFounderKpiSummary(req: Request, res: Response) {
    try {
      const query = adminFounderKpiQuerySchema.parse(req.query);
      const requiredScopes = this.getRequiredAnalyticsScopes(query.scope);
      const accessContext = await this.ensureAdminAnalyticsScopes(req, res, requiredScopes);
      if (!accessContext) return;

      const includeGrowth = query.scope === 'GROWTH' || query.scope === 'ALL';
      const includeFinance = query.scope === 'FINANCE' || query.scope === 'ALL';

      const dateFilter = this.buildDateRangeFilter(query.from, query.to);
      const now = Date.now();
      const dauSince = new Date(now - 24 * 60 * 60 * 1000);
      const mauSince = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const metricWhere: Prisma.AdCampaignMetricDailyWhereInput = {};
      const purchaseWhere: Prisma.CoinPurchaseWhereInput = {
        status: PurchaseStatus.COMPLETED,
      };

      if (dateFilter) {
        metricWhere.bucketDate = dateFilter;
        purchaseWhere.createdAt = dateFilter;
      }

      const [
        campaignGroups,
        activeCampaignCount,
        metricAggregate,
        purchaseAggregate,
        dauUsers,
        mauUsers,
      ] = await Promise.all([
        prisma.adCampaign.groupBy({
          by: ['status'],
          _count: {
            _all: true,
          },
        }),
        prisma.adCampaign.count({
          where: {
            status: AdCampaignStatus.ACTIVE,
          },
        }),
        prisma.adCampaignMetricDaily.aggregate({
          where: metricWhere,
          _sum: {
            impressions: true,
            clicks: true,
            conversions: true,
            spendPaise: true,
          },
        }),
        prisma.coinPurchase.aggregate({
          where: purchaseWhere,
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
        }),
        prisma.session.findMany({
          where: {
            createdAt: {
              gte: dauSince,
            },
          },
          distinct: ['userId'],
          select: {
            userId: true,
          },
        }),
        prisma.session.findMany({
          where: {
            createdAt: {
              gte: mauSince,
            },
          },
          distinct: ['userId'],
          select: {
            userId: true,
          },
        }),
      ]);

      const campaignsByStatus: Record<AdCampaignStatus, number> = {
        DRAFT: 0,
        SCHEDULED: 0,
        ACTIVE: 0,
        PAUSED: 0,
        COMPLETED: 0,
        ARCHIVED: 0,
      };

      for (const group of campaignGroups) {
        campaignsByStatus[group.status] = group._count._all;
      }

      const impressions = metricAggregate._sum.impressions ?? 0;
      const clicks = metricAggregate._sum.clicks ?? 0;
      const conversions = metricAggregate._sum.conversions ?? 0;
      const adSpendPaise = metricAggregate._sum.spendPaise ?? 0;
      const revenuePaise = purchaseAggregate._sum.amount ?? 0;

      let alertsPayload: {
        thresholds: AdAlertThresholds;
        totals: {
          overspendCampaigns: number;
          lowCtrCampaigns: number;
          totalAlerts: number;
        };
        items: Array<{
          type: 'LOW_CTR' | 'OVERSPEND';
          campaignId: string;
          campaignName: string;
          status: AdCampaignStatus;
          ctrPercent: number;
          budgetUtilizationPercent: number | null;
          impressions: number;
          spendPaise: number;
          message: string;
        }>;
      } | null = null;

      if (includeGrowth) {
        const alertThresholds = await this.getAdAlertThresholds();
        const monitoredCampaigns = await prisma.adCampaign.findMany({
          where: {
            status: {
              in: [AdCampaignStatus.SCHEDULED, AdCampaignStatus.ACTIVE, AdCampaignStatus.PAUSED],
            },
          },
          select: {
            id: true,
            name: true,
            status: true,
            totalBudgetPaise: true,
            spendPaise: true,
          },
        });

        const monitoredCampaignIds = monitoredCampaigns.map((campaign) => campaign.id);
        const alertMetricWhere: Prisma.AdCampaignMetricDailyWhereInput = {
          campaignId: {
            in: monitoredCampaignIds,
          },
        };

        if (dateFilter) {
          alertMetricWhere.bucketDate = dateFilter;
        }

        const alertMetricGroups =
          monitoredCampaignIds.length > 0
            ? await prisma.adCampaignMetricDaily.groupBy({
                by: ['campaignId'],
                where: alertMetricWhere,
                _sum: {
                  impressions: true,
                  clicks: true,
                  spendPaise: true,
                },
              })
            : [];

        const metricsByCampaign = new Map(
          alertMetricGroups.map((group) => [group.campaignId, group])
        );

        let overspendCampaigns = 0;
        let lowCtrCampaigns = 0;
        const alertItems: Array<{
          type: 'LOW_CTR' | 'OVERSPEND';
          campaignId: string;
          campaignName: string;
          status: AdCampaignStatus;
          ctrPercent: number;
          budgetUtilizationPercent: number | null;
          impressions: number;
          spendPaise: number;
          message: string;
        }> = [];

        for (const campaign of monitoredCampaigns) {
          const metric = metricsByCampaign.get(campaign.id);
          const campaignImpressions = metric?._sum.impressions ?? 0;
          const campaignClicks = metric?._sum.clicks ?? 0;
          const campaignSpendPaise = metric?._sum.spendPaise ?? campaign.spendPaise;
          const evaluation = this.evaluateCampaignAlerts({
            impressions: campaignImpressions,
            clicks: campaignClicks,
            spendPaise: campaignSpendPaise,
            totalBudgetPaise: campaign.totalBudgetPaise,
            thresholds: alertThresholds,
          });

          if (evaluation.isOverspend) {
            overspendCampaigns += 1;
            alertItems.push({
              type: 'OVERSPEND',
              campaignId: campaign.id,
              campaignName: campaign.name,
              status: campaign.status,
              ctrPercent: evaluation.ctrPercent,
              budgetUtilizationPercent: evaluation.budgetUtilizationPercent,
              impressions: campaignImpressions,
              spendPaise: campaignSpendPaise,
              message: `Budget usage crossed ${alertThresholds.overspendPercent}%`,
            });
          }

          if (evaluation.isLowCtr) {
            lowCtrCampaigns += 1;
            alertItems.push({
              type: 'LOW_CTR',
              campaignId: campaign.id,
              campaignName: campaign.name,
              status: campaign.status,
              ctrPercent: evaluation.ctrPercent,
              budgetUtilizationPercent: evaluation.budgetUtilizationPercent,
              impressions: campaignImpressions,
              spendPaise: campaignSpendPaise,
              message: `CTR below ${alertThresholds.lowCtrPercent}% after ${alertThresholds.lowCtrMinImpressions} impressions`,
            });
          }
        }

        alertsPayload = {
          thresholds: alertThresholds,
          totals: {
            overspendCampaigns,
            lowCtrCampaigns,
            totalAlerts: alertItems.length,
          },
          items: alertItems.slice(0, 50),
        };
      }

      res.json({
        success: true,
        data: {
          period: {
            from: query.from ?? null,
            to: query.to ?? null,
          },
          scope: query.scope,
          access: {
            requiredScopes,
            grantedScopes: accessContext.grantedScopes,
          },
          users: includeGrowth
            ? {
                dau: dauUsers.length,
                mau: mauUsers.length,
              }
            : null,
          campaigns: includeGrowth
            ? {
                activeCount: activeCampaignCount,
                byStatus: campaignsByStatus,
              }
            : null,
          advertising: includeGrowth
            ? {
                impressions,
                clicks,
                conversions,
                spendPaise: adSpendPaise,
                ctrPercent: impressions > 0 ? (clicks / impressions) * 100 : 0,
                conversionPercent: clicks > 0 ? (conversions / clicks) * 100 : 0,
                cpmInr: impressions > 0 ? adSpendPaise / 100 / (impressions / 1000) : 0,
              }
            : null,
          monetization: includeFinance
            ? {
                completedPurchases: purchaseAggregate._count._all,
                revenuePaise,
                adSpendPaise,
                revenueToAdSpendRatio: adSpendPaise > 0 ? revenuePaise / adSpendPaise : null,
              }
            : null,
          alerts: includeGrowth ? alertsPayload : null,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid founder KPI query',
          details: error.issues,
        });
      }

      console.error('[AdminController] Error fetching founder KPI summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch founder KPI summary',
      });
    }
  }
}
