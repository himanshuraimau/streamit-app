import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/db';

declare global {
  namespace Express {
    interface Request {
      adminRole?: UserRole;
    }
  }
}

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

const getUserRole = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isSuspended: true,
    },
  });
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const user = await getUserRole(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: 'Suspended users cannot access admin endpoints',
      });
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    req.adminRole = user.role;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const requireAdminRole = (allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const user = await getUserRole(req.user.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      if (user.isSuspended) {
        return res.status(403).json({
          success: false,
          error: 'Suspended users cannot access admin endpoints',
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: `One of these roles is required: ${allowedRoles.join(', ')}`,
        });
      }

      req.adminRole = user.role;
      next();
    } catch (error) {
      console.error('Admin role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

export const requireSuperAdmin = requireAdminRole(['SUPER_ADMIN']);
