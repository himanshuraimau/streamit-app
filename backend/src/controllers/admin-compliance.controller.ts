import { AdminAction, LegalCaseStatus, TakedownStatus, type Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/db';
import {
  adminAnnouncementQuerySchema,
  adminAuditHistoryQuerySchema,
  adminComplianceExportDownloadQuerySchema,
  adminComplianceExportRequestSchema,
  adminCreateAnnouncementSchema,
  adminCreateGeoBlockSchema,
  adminCreateLegalCaseSchema,
  adminCreateTakedownSchema,
  adminGeoBlockQuerySchema,
  adminLegalCaseQuerySchema,
  adminRollbackSettingSchema,
  adminSettingsQuerySchema,
  adminTakedownActionSchema,
  adminTakedownQuerySchema,
  adminUpdateAnnouncementSchema,
  adminUpdateGeoBlockSchema,
  adminUpdateLegalCaseSchema,
  adminUpdateSettingSchema,
} from '../lib/validations/admin.validation';
import { getAuthUser } from '../middleware/auth.middleware';

type SignedComplianceExportPayload = {
  adminId: string;
  expiresAt: number;
  nonce: string;
  filters: {
    action?: string;
    targetType?: string;
    search?: string;
    from?: string;
    to?: string;
  };
};

const complianceExportTokenPayloadSchema = z.object({
  adminId: z.string().min(1),
  expiresAt: z.number().int().positive(),
  nonce: z.string().min(8),
  filters: z.object({
    action: z.string().optional(),
    targetType: z.string().optional(),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export class AdminComplianceController {
  private static readonly complianceAuditTargetTypes = [
    'legal_case',
    'takedown',
    'geo_block_rule',
    'system_setting',
    'announcement',
    'admin_permission_scope',
    'compliance_export',
  ];

  private static readonly complianceAuditActions: AdminAction[] = [
    AdminAction.LEGAL_CASE_CREATED,
    AdminAction.LEGAL_CASE_STATUS_CHANGED,
    AdminAction.LEGAL_CASE_ASSIGNED,
    AdminAction.TAKEDOWN_CREATED,
    AdminAction.TAKEDOWN_EXECUTED,
    AdminAction.TAKEDOWN_APPEALED,
    AdminAction.TAKEDOWN_REVERSED,
    AdminAction.GEOBLOCK_CREATED,
    AdminAction.GEOBLOCK_UPDATED,
    AdminAction.GEOBLOCK_REMOVED,
    AdminAction.SETTING_UPDATED,
    AdminAction.SETTING_ROLLED_BACK,
    AdminAction.ANNOUNCEMENT_CREATED,
    AdminAction.ANNOUNCEMENT_UPDATED,
    AdminAction.ANNOUNCEMENT_DELETED,
  ];

  private static buildLegalReferenceCode() {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `LC-${stamp}-${random}`;
  }

  private static escapeCsvCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const raw = String(value);
    if (raw.includes(',') || raw.includes('\n') || raw.includes('"')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }

    return raw;
  }

  private static buildComplianceAuditWhere(input: {
    action?: string;
    targetType?: string;
    search?: string;
    from?: string;
    to?: string;
  }): Prisma.AdminActivityLogWhereInput {
    const where: Prisma.AdminActivityLogWhereInput = {
      OR: [
        {
          targetType: {
            in: this.complianceAuditTargetTypes,
          },
        },
        {
          action: {
            in: this.complianceAuditActions,
          },
        },
      ],
    };

    const andFilters: Prisma.AdminActivityLogWhereInput[] = [];

    if (input.action) {
      andFilters.push({
        action: input.action as AdminAction,
      });
    }

    if (input.targetType) {
      andFilters.push({
        targetType: input.targetType,
      });
    }

    if (input.from || input.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (input.from) {
        createdAt.gte = new Date(input.from);
      }
      if (input.to) {
        createdAt.lte = new Date(input.to);
      }

      andFilters.push({
        createdAt,
      });
    }

    if (input.search) {
      andFilters.push({
        OR: [
          { description: { contains: input.search, mode: 'insensitive' } },
          { targetId: { contains: input.search, mode: 'insensitive' } },
          { admin: { name: { contains: input.search, mode: 'insensitive' } } },
          { admin: { username: { contains: input.search, mode: 'insensitive' } } },
        ],
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    return where;
  }

  private static getComplianceExportSigningSecret(): string {
    return (
      process.env.ADMIN_EXPORT_SIGNING_SECRET ??
      process.env.BETTER_AUTH_SECRET ??
      'streamit-admin-export-dev-secret'
    );
  }

  private static signComplianceExportToken(payload: SignedComplianceExportPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const signature = createHmac('sha256', this.getComplianceExportSigningSecret())
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  private static verifyComplianceExportToken(token: string): SignedComplianceExportPayload | null {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, encodedSignature] = parts;
    if (!encodedPayload || !encodedSignature) {
      return null;
    }

    const expectedSignature = createHmac('sha256', this.getComplianceExportSigningSecret())
      .update(encodedPayload)
      .digest('base64url');

    const providedBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf-8')
      ) as SignedComplianceExportPayload;

      return complianceExportTokenPayloadSchema.parse(payload);
    } catch {
      return null;
    }
  }

  static async listLegalCases(req: Request, res: Response) {
    try {
      const query = adminLegalCaseQuerySchema.parse(req.query);
      const { page, limit, status, caseType, search, assignedTo } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.LegalCaseWhereInput = {};
      if (status) where.status = status;
      if (caseType) where.caseType = caseType;
      if (assignedTo) where.assignedTo = assignedTo;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { referenceCode: { contains: search, mode: 'insensitive' } },
          { targetType: { contains: search, mode: 'insensitive' } },
          { targetId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.legalCase.count({ where }),
        prisma.legalCase.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                takedowns: true,
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
          error: 'Invalid legal case query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error listing legal cases:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list legal cases',
      });
    }
  }

  static async createLegalCase(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminCreateLegalCaseSchema.parse(req.body);

      const created = await prisma.$transaction(async (tx) => {
        const legalCase = await tx.legalCase.create({
          data: {
            referenceCode: this.buildLegalReferenceCode(),
            title: payload.title,
            description: payload.description,
            caseType: payload.caseType,
            priority: payload.priority,
            targetType: payload.targetType,
            targetId: payload.targetId,
            requestedBy: payload.requestedBy,
            assignedTo: payload.assignedTo,
            createdBy: authUser.id,
            dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
            metadata:
              payload.metadata !== undefined
                ? (payload.metadata as Prisma.InputJsonValue)
                : undefined,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.LEGAL_CASE_CREATED,
            targetType: 'legal_case',
            targetId: legalCase.id,
            description: `Created legal case ${legalCase.referenceCode}`,
            metadata: {
              caseType: legalCase.caseType,
              priority: legalCase.priority,
              targetType: legalCase.targetType,
              targetId: legalCase.targetId,
            },
            ipAddress: req.ip,
          },
        });

        return legalCase;
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid legal case payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error creating legal case:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create legal case',
      });
    }
  }

  static async getLegalCaseDetail(req: Request, res: Response) {
    try {
      const { legalCaseId } = req.params;
      if (!legalCaseId) {
        return res.status(400).json({
          success: false,
          error: 'Legal case ID is required',
        });
      }

      const legalCase = await prisma.legalCase.findUnique({
        where: { id: legalCaseId },
        include: {
          takedowns: {
            orderBy: { requestedAt: 'desc' },
          },
        },
      });

      if (!legalCase) {
        return res.status(404).json({
          success: false,
          error: 'Legal case not found',
        });
      }

      res.json({
        success: true,
        data: legalCase,
      });
    } catch (error) {
      console.error('[AdminComplianceController] Error fetching legal case detail:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch legal case detail',
      });
    }
  }

  static async updateLegalCase(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { legalCaseId } = req.params;
      if (!legalCaseId) {
        return res.status(400).json({
          success: false,
          error: 'Legal case ID is required',
        });
      }

      const payload = adminUpdateLegalCaseSchema.parse(req.body);

      const existing = await prisma.legalCase.findUnique({
        where: { id: legalCaseId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Legal case not found',
        });
      }

      const now = new Date();
      const data: Prisma.LegalCaseUpdateInput = {};

      if (payload.status) {
        data.status = payload.status;
        if (payload.status === LegalCaseStatus.RESOLVED) {
          data.resolvedAt = now;
          data.resolvedBy = authUser.id;
        }
        if (payload.status === LegalCaseStatus.CLOSED) {
          data.closedAt = now;
          if (!existing.resolvedBy) {
            data.resolvedBy = authUser.id;
          }
          if (!existing.resolvedAt) {
            data.resolvedAt = now;
          }
        }
      }

      if (payload.assignedTo !== undefined) {
        data.assignedTo = payload.assignedTo;
      }

      if (payload.priority !== undefined) {
        data.priority = payload.priority;
      }

      if (payload.resolutionNote !== undefined) {
        data.resolutionNote = payload.resolutionNote;
      }

      if (payload.dueAt !== undefined) {
        data.dueAt = payload.dueAt ? new Date(payload.dueAt) : null;
      }

      if (payload.metadata !== undefined) {
        data.metadata = payload.metadata as Prisma.InputJsonValue;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const legalCase = await tx.legalCase.update({
          where: { id: legalCaseId },
          data,
        });

        const assignmentChanged =
          payload.assignedTo !== undefined && payload.assignedTo !== existing.assignedTo;
        const action = assignmentChanged
          ? AdminAction.LEGAL_CASE_ASSIGNED
          : AdminAction.LEGAL_CASE_STATUS_CHANGED;

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action,
            targetType: 'legal_case',
            targetId: legalCase.id,
            description: assignmentChanged
              ? `Updated legal case assignee for ${legalCase.referenceCode}`
              : `Updated legal case status for ${legalCase.referenceCode}`,
            metadata: {
              previousStatus: existing.status,
              nextStatus: legalCase.status,
              previousAssignedTo: existing.assignedTo,
              nextAssignedTo: legalCase.assignedTo,
            },
            ipAddress: req.ip,
          },
        });

        return legalCase;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid legal case update payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error updating legal case:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update legal case',
      });
    }
  }

  static async listTakedowns(req: Request, res: Response) {
    try {
      const query = adminTakedownQuerySchema.parse(req.query);
      const { page, limit, status, reason, search } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.TakedownRequestWhereInput = {};
      if (status) where.status = status;
      if (reason) where.reason = reason;
      if (search) {
        where.OR = [
          { targetType: { contains: search, mode: 'insensitive' } },
          { targetId: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.takedownRequest.count({ where }),
        prisma.takedownRequest.findMany({
          where,
          orderBy: { requestedAt: 'desc' },
          skip,
          take: limit,
          include: {
            legalCase: {
              select: {
                id: true,
                referenceCode: true,
                status: true,
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
          error: 'Invalid takedown query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error listing takedowns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list takedowns',
      });
    }
  }

  static async createTakedown(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminCreateTakedownSchema.parse(req.body);

      if (payload.legalCaseId) {
        const legalCase = await prisma.legalCase.findUnique({
          where: { id: payload.legalCaseId },
          select: { id: true },
        });

        if (!legalCase) {
          return res.status(404).json({
            success: false,
            error: 'Associated legal case not found',
          });
        }
      }

      const created = await prisma.$transaction(async (tx) => {
        const takedown = await tx.takedownRequest.create({
          data: {
            legalCaseId: payload.legalCaseId,
            targetType: payload.targetType,
            targetId: payload.targetId,
            reason: payload.reason,
            note: payload.note,
            requestedBy: authUser.id,
            metadata:
              payload.metadata !== undefined
                ? (payload.metadata as Prisma.InputJsonValue)
                : undefined,
          },
          include: {
            legalCase: {
              select: {
                id: true,
                referenceCode: true,
              },
            },
          },
        });

        if (payload.legalCaseId) {
          await tx.legalCase.update({
            where: { id: payload.legalCaseId },
            data: {
              status: LegalCaseStatus.ACTION_REQUIRED,
            },
          });
        }

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.TAKEDOWN_CREATED,
            targetType: 'takedown',
            targetId: takedown.id,
            description: `Created takedown request for ${takedown.targetType}:${takedown.targetId}`,
            metadata: {
              reason: takedown.reason,
              legalCaseId: takedown.legalCaseId,
            },
            ipAddress: req.ip,
          },
        });

        return takedown;
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid takedown payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error creating takedown:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create takedown',
      });
    }
  }

  static async applyTakedownAction(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { takedownId } = req.params;
      if (!takedownId) {
        return res.status(400).json({
          success: false,
          error: 'Takedown ID is required',
        });
      }

      const payload = adminTakedownActionSchema.parse(req.body);

      const existing = await prisma.takedownRequest.findUnique({
        where: { id: takedownId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Takedown request not found',
        });
      }

      const now = new Date();
      const data: Prisma.TakedownRequestUpdateInput = {};
      let action: AdminAction;

      if (payload.action === 'EXECUTE') {
        if (
          existing.status !== TakedownStatus.PENDING &&
          existing.status !== TakedownStatus.APPEALED
        ) {
          return res.status(400).json({
            success: false,
            error: `Cannot execute takedown in ${existing.status} state`,
          });
        }

        data.status = TakedownStatus.EXECUTED;
        data.executedAt = now;
        data.executedBy = authUser.id;
        data.executionNote = payload.note;
        action = AdminAction.TAKEDOWN_EXECUTED;
      } else if (payload.action === 'APPEAL') {
        if (existing.status !== TakedownStatus.EXECUTED) {
          return res.status(400).json({
            success: false,
            error: 'Only executed takedowns can be appealed',
          });
        }

        data.status = TakedownStatus.APPEALED;
        data.appealedAt = now;
        data.appealNote = payload.note ?? null;
        action = AdminAction.TAKEDOWN_APPEALED;
      } else if (payload.action === 'REVERSE') {
        if (
          existing.status !== TakedownStatus.EXECUTED &&
          existing.status !== TakedownStatus.APPEALED
        ) {
          return res.status(400).json({
            success: false,
            error: `Cannot reverse takedown in ${existing.status} state`,
          });
        }

        data.status = TakedownStatus.REVERSED;
        data.reversedAt = now;
        data.reversedBy = authUser.id;
        data.executionNote = payload.note;
        action = AdminAction.TAKEDOWN_REVERSED;
      } else {
        if (
          existing.status !== TakedownStatus.PENDING &&
          existing.status !== TakedownStatus.APPEALED
        ) {
          return res.status(400).json({
            success: false,
            error: `Cannot reject takedown in ${existing.status} state`,
          });
        }

        data.status = TakedownStatus.REJECTED;
        data.executionNote = payload.note ?? null;
        action = AdminAction.TAKEDOWN_REVERSED;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const takedown = await tx.takedownRequest.update({
          where: { id: takedownId },
          data,
        });

        if (takedown.legalCaseId) {
          if (takedown.status === TakedownStatus.EXECUTED) {
            await tx.legalCase.update({
              where: { id: takedown.legalCaseId },
              data: {
                status: LegalCaseStatus.RESOLVED,
                resolvedAt: now,
                resolvedBy: authUser.id,
              },
            });
          }

          if (takedown.status === TakedownStatus.REVERSED) {
            await tx.legalCase.update({
              where: { id: takedown.legalCaseId },
              data: {
                status: LegalCaseStatus.UNDER_REVIEW,
              },
            });
          }
        }

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action,
            targetType: 'takedown',
            targetId: takedown.id,
            description: `Takedown ${takedown.id} action ${payload.action}`,
            metadata: {
              previousStatus: existing.status,
              nextStatus: takedown.status,
              note: payload.note ?? null,
            },
            ipAddress: req.ip,
          },
        });

        return takedown;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid takedown action payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error applying takedown action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to apply takedown action',
      });
    }
  }

  static async listGeoBlocks(req: Request, res: Response) {
    try {
      const query = adminGeoBlockQuerySchema.parse(req.query);
      const { page, limit, status, reason, countryCode, targetType, search } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.GeoBlockRuleWhereInput = {};
      if (status) where.status = status;
      if (reason) where.reason = reason;
      if (countryCode) where.countryCode = countryCode.toUpperCase();
      if (targetType) where.targetType = targetType;
      if (search) {
        where.OR = [
          { targetId: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.geoBlockRule.count({ where }),
        prisma.geoBlockRule.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
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
          error: 'Invalid geoblock query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error listing geoblocks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list geoblocks',
      });
    }
  }

  static async createGeoBlock(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminCreateGeoBlockSchema.parse(req.body);

      const created = await prisma.$transaction(async (tx) => {
        const rule = await tx.geoBlockRule.create({
          data: {
            targetType: payload.targetType,
            targetId: payload.targetId,
            countryCode: payload.countryCode,
            reason: payload.reason,
            note: payload.note,
            expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
            createdBy: authUser.id,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.GEOBLOCK_CREATED,
            targetType: 'geo_block_rule',
            targetId: rule.id,
            description: `Created geo-block rule for ${rule.targetType}:${rule.targetId} in ${rule.countryCode}`,
            metadata: {
              reason: rule.reason,
              status: rule.status,
            },
            ipAddress: req.ip,
          },
        });

        return rule;
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid geoblock payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error creating geoblock:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create geoblock',
      });
    }
  }

  static async updateGeoBlock(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { geoBlockId } = req.params;
      if (!geoBlockId) {
        return res.status(400).json({
          success: false,
          error: 'Geo-block ID is required',
        });
      }

      const payload = adminUpdateGeoBlockSchema.parse(req.body);

      const existing = await prisma.geoBlockRule.findUnique({
        where: { id: geoBlockId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Geo-block rule not found',
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const rule = await tx.geoBlockRule.update({
          where: { id: geoBlockId },
          data: {
            status: payload.status,
            reason: payload.reason,
            note: payload.note,
            expiresAt:
              payload.expiresAt !== undefined
                ? payload.expiresAt
                  ? new Date(payload.expiresAt)
                  : null
                : undefined,
            updatedBy: authUser.id,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.GEOBLOCK_UPDATED,
            targetType: 'geo_block_rule',
            targetId: rule.id,
            description: `Updated geo-block rule ${rule.id}`,
            metadata: {
              previousStatus: existing.status,
              nextStatus: rule.status,
              previousReason: existing.reason,
              nextReason: rule.reason,
            },
            ipAddress: req.ip,
          },
        });

        return rule;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid geoblock update payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error updating geoblock:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update geoblock',
      });
    }
  }

  static async removeGeoBlock(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { geoBlockId } = req.params;
      if (!geoBlockId) {
        return res.status(400).json({
          success: false,
          error: 'Geo-block ID is required',
        });
      }

      const existing = await prisma.geoBlockRule.findUnique({
        where: { id: geoBlockId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Geo-block rule not found',
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.geoBlockRule.delete({
          where: { id: geoBlockId },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.GEOBLOCK_REMOVED,
            targetType: 'geo_block_rule',
            targetId: geoBlockId,
            description: `Removed geo-block rule ${geoBlockId}`,
            metadata: {
              targetType: existing.targetType,
              targetId: existing.targetId,
              countryCode: existing.countryCode,
            },
            ipAddress: req.ip,
          },
        });
      });

      res.json({
        success: true,
        data: {
          id: geoBlockId,
        },
      });
    } catch (error) {
      console.error('[AdminComplianceController] Error removing geoblock:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove geoblock',
      });
    }
  }

  static async listSystemSettings(req: Request, res: Response) {
    try {
      const query = adminSettingsQuerySchema.parse(req.query);
      const { page, limit, search, includePublic } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.SystemSettingWhereInput = {};
      if (search) {
        where.OR = [
          { key: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (includePublic !== undefined) {
        where.isPublic = includePublic;
      }

      const [total, items] = await prisma.$transaction([
        prisma.systemSetting.count({ where }),
        prisma.systemSetting.findMany({
          where,
          orderBy: { key: 'asc' },
          skip,
          take: limit,
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
          error: 'Invalid settings query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error listing system settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list system settings',
      });
    }
  }

  static async updateSystemSetting(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { settingKey } = req.params;
      if (!settingKey) {
        return res.status(400).json({
          success: false,
          error: 'Setting key is required',
        });
      }

      const payload = adminUpdateSettingSchema.parse(req.body);
      const normalizedKey = decodeURIComponent(settingKey);

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.systemSetting.findUnique({
          where: { key: normalizedKey },
        });

        const updated = await tx.systemSetting.upsert({
          where: { key: normalizedKey },
          update: {
            value: payload.value,
            isPublic: payload.isPublic ?? existing?.isPublic ?? false,
            updatedBy: authUser.id,
          },
          create: {
            key: normalizedKey,
            value: payload.value,
            isPublic: payload.isPublic ?? false,
            updatedBy: authUser.id,
          },
        });

        await tx.systemSettingVersion.create({
          data: {
            settingKey: normalizedKey,
            previousValue: existing?.value ?? null,
            newValue: updated.value,
            previousIsPublic: existing?.isPublic ?? null,
            newIsPublic: updated.isPublic,
            changeReason: payload.reason,
            changedBy: authUser.id,
            metadata:
              payload.metadata !== undefined
                ? (payload.metadata as Prisma.InputJsonValue)
                : undefined,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.SETTING_UPDATED,
            targetType: 'system_setting',
            targetId: normalizedKey,
            description: `Updated system setting ${normalizedKey}`,
            metadata: {
              previousValue: existing?.value ?? null,
              nextValue: updated.value,
              previousIsPublic: existing?.isPublic ?? null,
              nextIsPublic: updated.isPublic,
              reason: payload.reason,
            },
            ipAddress: req.ip,
          },
        });

        return updated;
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid system setting payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error updating system setting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update system setting',
      });
    }
  }

  static async getSystemSettingHistory(req: Request, res: Response) {
    try {
      const { settingKey } = req.params;
      if (!settingKey) {
        return res.status(400).json({
          success: false,
          error: 'Setting key is required',
        });
      }

      const normalizedKey = decodeURIComponent(settingKey);
      const items = await prisma.systemSettingVersion.findMany({
        where: {
          settingKey: normalizedKey,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      res.json({
        success: true,
        data: {
          items,
        },
      });
    } catch (error) {
      console.error('[AdminComplianceController] Error fetching system setting history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system setting history',
      });
    }
  }

  static async rollbackSystemSetting(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminRollbackSettingSchema.parse(req.body);

      const rolledBack = await prisma.$transaction(async (tx) => {
        const version = await tx.systemSettingVersion.findUnique({
          where: {
            id: payload.versionId,
          },
        });

        if (!version) {
          throw new Error('Setting version not found');
        }

        if (version.previousValue === null) {
          await tx.systemSetting.deleteMany({
            where: {
              key: version.settingKey,
            },
          });

          await tx.systemSettingVersion.create({
            data: {
              settingKey: version.settingKey,
              previousValue: version.newValue,
              newValue: '',
              previousIsPublic: version.newIsPublic,
              newIsPublic: false,
              changeReason: payload.reason,
              changedBy: authUser.id,
              rollbackOfVersionId: version.id,
              metadata: {
                mode: 'delete',
              },
            },
          });

          await tx.adminActivityLog.create({
            data: {
              adminId: authUser.id,
              action: AdminAction.SETTING_ROLLED_BACK,
              targetType: 'system_setting',
              targetId: version.settingKey,
              description: `Rolled back setting ${version.settingKey} by deleting key`,
              metadata: {
                rollbackVersionId: version.id,
                reason: payload.reason,
              },
              ipAddress: req.ip,
            },
          });

          return {
            key: version.settingKey,
            deleted: true,
          };
        }

        const existing = await tx.systemSetting.findUnique({
          where: { key: version.settingKey },
        });

        const restored = await tx.systemSetting.upsert({
          where: { key: version.settingKey },
          update: {
            value: version.previousValue,
            isPublic: version.previousIsPublic ?? false,
            updatedBy: authUser.id,
          },
          create: {
            key: version.settingKey,
            value: version.previousValue,
            isPublic: version.previousIsPublic ?? false,
            updatedBy: authUser.id,
          },
        });

        await tx.systemSettingVersion.create({
          data: {
            settingKey: version.settingKey,
            previousValue: existing?.value ?? null,
            newValue: restored.value,
            previousIsPublic: existing?.isPublic ?? null,
            newIsPublic: restored.isPublic,
            changeReason: payload.reason,
            changedBy: authUser.id,
            rollbackOfVersionId: version.id,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.SETTING_ROLLED_BACK,
            targetType: 'system_setting',
            targetId: version.settingKey,
            description: `Rolled back setting ${version.settingKey}`,
            metadata: {
              rollbackVersionId: version.id,
              reason: payload.reason,
            },
            ipAddress: req.ip,
          },
        });

        return restored;
      });

      res.json({
        success: true,
        data: rolledBack,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rollback payload',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Setting version not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      console.error('[AdminComplianceController] Error rolling back system setting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to rollback system setting',
      });
    }
  }

  static async listAnnouncements(req: Request, res: Response) {
    try {
      const query = adminAnnouncementQuerySchema.parse(req.query);
      const { page, limit, isActive, type, search } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.AnnouncementWhereInput = {};
      if (isActive !== undefined) where.isActive = isActive;
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, items] = await prisma.$transaction([
        prisma.announcement.count({ where }),
        prisma.announcement.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
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
          error: 'Invalid announcement query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error listing announcements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list announcements',
      });
    }
  }

  static async createAnnouncement(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminCreateAnnouncementSchema.parse(req.body);

      const created = await prisma.$transaction(async (tx) => {
        const announcement = await tx.announcement.create({
          data: {
            title: payload.title,
            content: payload.content,
            type: payload.type,
            isActive: payload.isActive,
            startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
            endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
            targetRole: payload.targetRole ?? null,
            isPinned: payload.isPinned,
            createdBy: authUser.id,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.ANNOUNCEMENT_CREATED,
            targetType: 'announcement',
            targetId: announcement.id,
            description: `Created announcement ${announcement.title}`,
            metadata: {
              type: announcement.type,
              isActive: announcement.isActive,
              targetRole: announcement.targetRole,
            },
            ipAddress: req.ip,
          },
        });

        return announcement;
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid announcement payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error creating announcement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create announcement',
      });
    }
  }

  static async updateAnnouncement(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { announcementId } = req.params;
      if (!announcementId) {
        return res.status(400).json({
          success: false,
          error: 'Announcement ID is required',
        });
      }

      const payload = adminUpdateAnnouncementSchema.parse(req.body);

      const existing = await prisma.announcement.findUnique({
        where: { id: announcementId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Announcement not found',
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const announcement = await tx.announcement.update({
          where: { id: announcementId },
          data: {
            title: payload.title,
            content: payload.content,
            type: payload.type,
            isActive: payload.isActive,
            startsAt:
              payload.startsAt !== undefined
                ? payload.startsAt
                  ? new Date(payload.startsAt)
                  : null
                : undefined,
            endsAt:
              payload.endsAt !== undefined
                ? payload.endsAt
                  ? new Date(payload.endsAt)
                  : null
                : undefined,
            targetRole: payload.targetRole,
            isPinned: payload.isPinned,
          },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.ANNOUNCEMENT_UPDATED,
            targetType: 'announcement',
            targetId: announcement.id,
            description: `Updated announcement ${announcement.title}`,
            metadata: {
              previousType: existing.type,
              nextType: announcement.type,
              previousIsActive: existing.isActive,
              nextIsActive: announcement.isActive,
            },
            ipAddress: req.ip,
          },
        });

        return announcement;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid announcement update payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error updating announcement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update announcement',
      });
    }
  }

  static async deleteAnnouncement(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const { announcementId } = req.params;
      if (!announcementId) {
        return res.status(400).json({
          success: false,
          error: 'Announcement ID is required',
        });
      }

      const existing = await prisma.announcement.findUnique({
        where: { id: announcementId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Announcement not found',
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.announcement.delete({
          where: { id: announcementId },
        });

        await tx.adminActivityLog.create({
          data: {
            adminId: authUser.id,
            action: AdminAction.ANNOUNCEMENT_DELETED,
            targetType: 'announcement',
            targetId: announcementId,
            description: `Deleted announcement ${existing.title}`,
            metadata: {
              type: existing.type,
            },
            ipAddress: req.ip,
          },
        });
      });

      res.json({
        success: true,
        data: {
          id: announcementId,
        },
      });
    } catch (error) {
      console.error('[AdminComplianceController] Error deleting announcement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete announcement',
      });
    }
  }

  static async generateComplianceAuditExport(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const payload = adminComplianceExportRequestSchema.parse(req.body);
      const where = this.buildComplianceAuditWhere({
        action: payload.action,
        targetType: payload.targetType,
        search: payload.search,
        from: payload.from,
        to: payload.to,
      });

      const rowCount = await prisma.adminActivityLog.count({ where });
      const nonce = randomBytes(8).toString('hex');
      const expiresAt = Date.now() + payload.expiresInMinutes * 60 * 1000;

      const token = this.signComplianceExportToken({
        adminId: authUser.id,
        expiresAt,
        nonce,
        filters: {
          action: payload.action,
          targetType: payload.targetType,
          search: payload.search,
          from: payload.from,
          to: payload.to,
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: authUser.id,
          action: AdminAction.SETTING_UPDATED,
          targetType: 'compliance_export',
          targetId: nonce,
          description: 'Generated signed compliance export download token',
          metadata: {
            estimatedRows: Math.min(rowCount, 5000),
            expiresInMinutes: payload.expiresInMinutes,
            filters: {
              action: payload.action ?? null,
              targetType: payload.targetType ?? null,
              search: payload.search ?? null,
              from: payload.from ?? null,
              to: payload.to ?? null,
            },
          },
          ipAddress: req.ip,
        },
      });

      res.json({
        success: true,
        data: {
          token,
          downloadPath: `/api/admin/compliance/audit-history/export/download?token=${encodeURIComponent(token)}`,
          expiresAt: new Date(expiresAt).toISOString(),
          estimatedRows: Math.min(rowCount, 5000),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid compliance export payload',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error generating compliance export:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance export',
      });
    }
  }

  static async downloadComplianceAuditExport(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) return;

      const query = adminComplianceExportDownloadQuerySchema.parse(req.query);
      const tokenPayload = this.verifyComplianceExportToken(query.token);

      if (!tokenPayload) {
        return res.status(401).json({
          success: false,
          error: 'Invalid export token',
        });
      }

      if (tokenPayload.adminId !== authUser.id) {
        return res.status(403).json({
          success: false,
          error: 'Export token is not valid for this admin session',
        });
      }

      if (Date.now() > tokenPayload.expiresAt) {
        return res.status(410).json({
          success: false,
          error: 'Export token has expired. Generate a new signed token.',
        });
      }

      const where = this.buildComplianceAuditWhere(tokenPayload.filters);
      const items = await prisma.adminActivityLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: 5000,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
          affectedUser: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
      });

      const rows = items.map((item) => {
        return [
          item.createdAt.toISOString(),
          item.action,
          item.targetType,
          item.targetId,
          item.description,
          item.admin.name,
          item.admin.username,
          item.admin.role,
          item.affectedUser?.username ?? '',
          item.ipAddress ?? '',
          item.metadata ? JSON.stringify(item.metadata) : '',
        ]
          .map((cell) => this.escapeCsvCell(cell))
          .join(',');
      });

      const header = [
        'createdAt',
        'action',
        'targetType',
        'targetId',
        'description',
        'adminName',
        'adminUsername',
        'adminRole',
        'affectedUsername',
        'ipAddress',
        'metadataJson',
      ];

      const csv = [header.join(','), ...rows].join('\n');
      const filename = `compliance-audit-export-${new Date().toISOString().slice(0, 10)}.csv`;

      await prisma.adminActivityLog.create({
        data: {
          adminId: authUser.id,
          action: AdminAction.SETTING_UPDATED,
          targetType: 'compliance_export',
          targetId: tokenPayload.nonce,
          description: 'Downloaded signed compliance export file',
          metadata: {
            exportedRows: items.length,
            tokenExpiresAt: new Date(tokenPayload.expiresAt).toISOString(),
          },
          ipAddress: req.ip,
        },
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid compliance export download query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error downloading compliance export:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download compliance export',
      });
    }
  }

  static async listComplianceAuditHistory(req: Request, res: Response) {
    try {
      const query = adminAuditHistoryQuerySchema.parse(req.query);
      const { page, limit, action, targetType, search } = query;
      const skip = (page - 1) * limit;

      const where = this.buildComplianceAuditWhere({
        action,
        targetType,
        search,
      });

      const [total, items] = await prisma.$transaction([
        prisma.adminActivityLog.count({ where }),
        prisma.adminActivityLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
            affectedUser: {
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
          error: 'Invalid audit history query',
          details: error.issues,
        });
      }

      console.error('[AdminComplianceController] Error listing compliance audit history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list compliance audit history',
      });
    }
  }
}
