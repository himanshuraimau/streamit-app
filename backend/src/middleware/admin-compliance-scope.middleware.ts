import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { getAuthUser } from './auth.middleware';

export type AdminComplianceScope =
  | 'LEGAL_CASES'
  | 'TAKEDOWNS'
  | 'GEOBLOCKS'
  | 'SETTINGS'
  | 'AUDIT'
  | 'EXPORTS';

const ALL_COMPLIANCE_SCOPES: AdminComplianceScope[] = [
  'LEGAL_CASES',
  'TAKEDOWNS',
  'GEOBLOCKS',
  'SETTINGS',
  'AUDIT',
  'EXPORTS',
];

declare global {
  namespace Express {
    interface Request {
      adminComplianceScopes?: AdminComplianceScope[];
    }
  }
}

function parseAdminComplianceScopes(value?: string | null): AdminComplianceScope[] {
  if (!value) {
    return [];
  }

  const parsed = value
    .split(',')
    .map((scope) => scope.trim().toUpperCase())
    .filter((scope): scope is AdminComplianceScope =>
      ALL_COMPLIANCE_SCOPES.includes(scope as AdminComplianceScope)
    );

  return [...new Set(parsed)];
}

function getDefaultAdminComplianceScopes(_role?: UserRole): AdminComplianceScope[] {
  return [...ALL_COMPLIANCE_SCOPES];
}

async function getAdminComplianceScopes(
  adminId: string,
  role?: UserRole
): Promise<AdminComplianceScope[]> {
  const defaultScopes = getDefaultAdminComplianceScopes(role);
  const setting = await prisma.systemSetting.findUnique({
    where: {
      key: `admin.complianceScopes.${adminId}`,
    },
    select: {
      value: true,
    },
  });

  const configuredScopes = parseAdminComplianceScopes(setting?.value);
  if (configuredScopes.length === 0) {
    return defaultScopes;
  }

  return configuredScopes;
}

export const requireComplianceScopes = (requiredScopes: AdminComplianceScope[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser = getAuthUser(req, res);
      if (!authUser) {
        return;
      }

      const grantedScopes = await getAdminComplianceScopes(authUser.id, req.adminRole);
      const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));

      if (missingScopes.length > 0) {
        return res.status(403).json({
          success: false,
          error: `Missing compliance scope: ${missingScopes.join(', ')}`,
          access: {
            grantedScopes,
            requiredScopes,
          },
        });
      }

      req.adminComplianceScopes = grantedScopes;
      next();
    } catch (error) {
      console.error('[AdminComplianceScopeMiddleware] Error validating compliance scopes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate compliance access scope',
      });
    }
  };
};
