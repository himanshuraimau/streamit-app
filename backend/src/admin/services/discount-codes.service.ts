import { prisma } from '../../lib/db';
import type { Prisma, DiscountCode, DiscountType } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';

export type AdminDiscountCodeStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'MAXED_OUT';

export interface DiscountCodeFilters {
  search?: string;
  status?: AdminDiscountCodeStatus;
}

export interface CreateAdminDiscountCodeData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  codeType?: 'PROMOTIONAL' | 'REWARD';
  maxRedemptions?: number | null;
  isOneTimeUse?: boolean;
  minPurchaseAmount?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
  description?: string;
}

export interface UpdateAdminDiscountCodeData {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  codeType?: 'PROMOTIONAL' | 'REWARD';
  maxRedemptions?: number | null;
  isOneTimeUse?: boolean;
  minPurchaseAmount?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
  description?: string;
}

export interface AdminDiscountCodeDto {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  codeType: 'PROMOTIONAL';
  maxRedemptions: number | null;
  currentRedemptions: number;
  isOneTimeUse: boolean;
  minPurchaseAmount: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  description: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  derivedStatus: AdminDiscountCodeStatus;
  usagePercentage: number | null;
  hasPurchaseReferences: boolean;
}

export interface DiscountCodesSummary {
  totalRecords: number;
  activeCount: number;
  inactiveCount: number;
  expiredCount: number;
  maxedOutCount: number;
  totalRedemptions: number;
}

export interface PaginatedDiscountCodesResponse extends PaginatedResponse<AdminDiscountCodeDto> {
  summary: DiscountCodesSummary;
}

export interface DeleteDiscountCodeResult {
  mode: 'deleted' | 'archived';
  data: AdminDiscountCodeDto;
}

const buildPagination = (page: number, pageSize: number, totalCount: number) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    currentPage: page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const deriveStatus = (
  code: Pick<DiscountCode, 'isActive' | 'expiresAt' | 'maxRedemptions' | 'currentRedemptions'>
): AdminDiscountCodeStatus => {
  if (!code.isActive) {
    return 'INACTIVE';
  }

  if (code.expiresAt && code.expiresAt < new Date()) {
    return 'EXPIRED';
  }

  if (code.maxRedemptions !== null && code.currentRedemptions >= code.maxRedemptions) {
    return 'MAXED_OUT';
  }

  return 'ACTIVE';
};

const toDto = (code: DiscountCode, purchaseReferenceCount: number): AdminDiscountCodeDto => ({
  id: code.id,
  code: code.code,
  discountType: code.discountType,
  discountValue: code.discountValue,
  codeType: 'PROMOTIONAL',
  maxRedemptions: code.maxRedemptions,
  currentRedemptions: code.currentRedemptions,
  isOneTimeUse: code.isOneTimeUse,
  minPurchaseAmount: code.minPurchaseAmount,
  expiresAt: code.expiresAt,
  isActive: code.isActive,
  description: code.description,
  createdBy: code.createdBy,
  createdAt: code.createdAt,
  updatedAt: code.updatedAt,
  derivedStatus: deriveStatus(code),
  usagePercentage:
    code.maxRedemptions !== null && code.maxRedemptions > 0
      ? Math.min(100, Math.round((code.currentRedemptions / code.maxRedemptions) * 100))
      : null,
  hasPurchaseReferences: purchaseReferenceCount > 0,
});

const assertPromotionalCodeType = (codeType?: 'PROMOTIONAL' | 'REWARD') => {
  if (codeType && codeType !== 'PROMOTIONAL') {
    throw new Error('Admin discount management only supports promotional codes');
  }
};

const assertDiscountValue = (discountType: DiscountType, discountValue: number) => {
  if (discountType === 'PERCENTAGE' && discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100');
  }
};

export class DiscountCodesService {
  private static async ensureUniqueCode(code: string, excludeId?: string) {
    const existingCode = await prisma.discountCode.findFirst({
      where: {
        code,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existingCode) {
      throw new Error('Discount code already exists');
    }
  }

  private static async getPurchaseReferenceMap(codeIds: string[]) {
    if (codeIds.length === 0) {
      return new Map<string, number>();
    }

    const groupedPurchases = await prisma.coinPurchase.groupBy({
      by: ['discountCodeId'],
      where: {
        discountCodeId: {
          in: codeIds,
        },
      },
      _count: {
        _all: true,
      },
    });

    return new Map(
      groupedPurchases
        .filter((row) => row.discountCodeId)
        .map((row) => [row.discountCodeId as string, row._count._all])
    );
  }

  static async listDiscountCodes(
    filters: DiscountCodeFilters,
    pagination: { page: number; pageSize: number }
  ): Promise<PaginatedDiscountCodesResponse> {
    const where: Prisma.DiscountCodeWhereInput = {
      codeType: 'PROMOTIONAL',
    };

    if (filters.search) {
      where.OR = [
        {
          code: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const allCodes = await prisma.discountCode.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const purchaseReferenceMap = await this.getPurchaseReferenceMap(
      allCodes.map((code) => code.id)
    );
    const enrichedCodes = allCodes.map((code) =>
      toDto(code, purchaseReferenceMap.get(code.id) ?? 0)
    );
    const filteredCodes = filters.status
      ? enrichedCodes.filter((code) => code.derivedStatus === filters.status)
      : enrichedCodes;

    const totalCount = filteredCodes.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    const data = filteredCodes.slice(start, start + pagination.pageSize);

    return {
      data,
      pagination: buildPagination(pagination.page, pagination.pageSize, totalCount),
      summary: {
        totalRecords: totalCount,
        activeCount: filteredCodes.filter((code) => code.derivedStatus === 'ACTIVE').length,
        inactiveCount: filteredCodes.filter((code) => code.derivedStatus === 'INACTIVE').length,
        expiredCount: filteredCodes.filter((code) => code.derivedStatus === 'EXPIRED').length,
        maxedOutCount: filteredCodes.filter((code) => code.derivedStatus === 'MAXED_OUT').length,
        totalRedemptions: filteredCodes.reduce((total, code) => total + code.currentRedemptions, 0),
      },
    };
  }

  static async getDiscountCodeById(id: string): Promise<AdminDiscountCodeDto | null> {
    const code = await prisma.discountCode.findFirst({
      where: {
        id,
        codeType: 'PROMOTIONAL',
      },
    });

    if (!code) {
      return null;
    }

    const purchaseReferenceMap = await this.getPurchaseReferenceMap([id]);
    return toDto(code, purchaseReferenceMap.get(id) ?? 0);
  }

  static async createDiscountCode(data: CreateAdminDiscountCodeData, adminId: string) {
    assertPromotionalCodeType(data.codeType);
    assertDiscountValue(data.discountType, data.discountValue);
    await this.ensureUniqueCode(data.code);

    const createdCode = await prisma.$transaction(async (tx) => {
      const code = await tx.discountCode.create({
        data: {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          codeType: 'PROMOTIONAL',
          createdBy: adminId,
          maxRedemptions: data.maxRedemptions ?? null,
          isOneTimeUse: data.isOneTimeUse ?? false,
          minPurchaseAmount: data.minPurchaseAmount ?? null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: data.isActive ?? true,
          description: data.description?.trim() || null,
        },
      });

      await AuditLogService.createLog(adminId, 'discount_code_create', 'discount_code', code.id, {
        code: code.code,
        discountType: code.discountType,
        discountValue: code.discountValue,
      });

      return code;
    });

    return toDto(createdCode, 0);
  }

  static async updateDiscountCode(id: string, data: UpdateAdminDiscountCodeData, adminId: string) {
    assertPromotionalCodeType(data.codeType);

    const existingCode = await prisma.discountCode.findFirst({
      where: {
        id,
        codeType: 'PROMOTIONAL',
      },
    });

    if (!existingCode) {
      throw new Error('Discount code not found');
    }

    const nextDiscountType = data.discountType ?? existingCode.discountType;
    const nextDiscountValue = data.discountValue ?? existingCode.discountValue;
    assertDiscountValue(nextDiscountType, nextDiscountValue);

    if (data.code) {
      await this.ensureUniqueCode(data.code, id);
    }

    const nextMaxRedemptions = data.maxRedemptions ?? existingCode.maxRedemptions;
    if (
      nextMaxRedemptions !== null &&
      nextMaxRedemptions !== undefined &&
      nextMaxRedemptions < existingCode.currentRedemptions
    ) {
      throw new Error('Max redemptions cannot be lower than current redemptions');
    }

    const updatedCode = await prisma.$transaction(async (tx) => {
      const code = await tx.discountCode.update({
        where: { id },
        data: {
          ...(data.code !== undefined && { code: data.code }),
          ...(data.discountType !== undefined && { discountType: data.discountType }),
          ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
          ...(data.maxRedemptions !== undefined && { maxRedemptions: data.maxRedemptions }),
          ...(data.isOneTimeUse !== undefined && { isOneTimeUse: data.isOneTimeUse }),
          ...(data.minPurchaseAmount !== undefined && {
            minPurchaseAmount: data.minPurchaseAmount,
          }),
          ...(data.expiresAt !== undefined && {
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.description !== undefined && { description: data.description?.trim() || null }),
        },
      });

      await AuditLogService.createLog(adminId, 'discount_code_update', 'discount_code', code.id, {
        code: code.code,
        changes: data,
      });

      return code;
    });

    const purchaseReferenceMap = await this.getPurchaseReferenceMap([id]);
    return toDto(updatedCode, purchaseReferenceMap.get(id) ?? 0);
  }

  static async deleteDiscountCode(id: string, adminId: string): Promise<DeleteDiscountCodeResult> {
    const existingCode = await prisma.discountCode.findFirst({
      where: {
        id,
        codeType: 'PROMOTIONAL',
      },
    });

    if (!existingCode) {
      throw new Error('Discount code not found');
    }

    const [redemptionCount, purchaseReferenceMap] = await Promise.all([
      prisma.discountRedemption.count({
        where: {
          discountCodeId: id,
        },
      }),
      this.getPurchaseReferenceMap([id]),
    ]);

    const purchaseReferenceCount = purchaseReferenceMap.get(id) ?? 0;
    const shouldArchive = redemptionCount > 0 || purchaseReferenceCount > 0;

    if (shouldArchive) {
      const archivedCode = await prisma.$transaction(async (tx) => {
        const code = await tx.discountCode.update({
          where: { id },
          data: {
            isActive: false,
          },
        });

        await AuditLogService.createLog(adminId, 'discount_code_delete', 'discount_code', code.id, {
          code: code.code,
          mode: 'archived',
          redemptionCount,
          purchaseReferenceCount,
        });

        return code;
      });

      return {
        mode: 'archived',
        data: toDto(archivedCode, purchaseReferenceCount),
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.discountCode.delete({
        where: { id },
      });

      await AuditLogService.createLog(adminId, 'discount_code_delete', 'discount_code', id, {
        code: existingCode.code,
        mode: 'deleted',
      });
    });

    return {
      mode: 'deleted',
      data: toDto(existingCode, 0),
    };
  }
}
