import type { Request, Response, NextFunction } from 'express';
import { auth } from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from '../../lib/db';
import { UserRole } from '@prisma/client';
import { logger } from '../../lib/logger';

// Extend Express Request type to include adminUser
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        name: string;
        email: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

// Admin roles that are allowed to access admin panel
const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.MODERATOR,
  UserRole.FINANCE_ADMIN,
  UserRole.ADMIN, // This maps to support_admin in the requirements
  UserRole.COMPLIANCE_OFFICER,
];

/**
 * Middleware to verify admin session and role
 * 
 * This middleware:
 * 1. Verifies the session using Better Auth
 * 2. Checks that the user has an admin role
 * 3. Attaches the admin user to the request object
 * 
 * Returns:
 * - 401 if no valid session
 * - 403 if user is not an admin
 * 
 * Requirements: 1.1, 1.2, 2.1, 17.7, 17.10, 22.1, 22.2
 */
export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Step 1: Verify session using Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // Step 2: Return 401 if no session
    if (!session) {
      logger.authFailure(
        'unknown',
        req.ip || 'unknown',
        'No session found'
      );
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be signed in to access admin resources',
      });
    }

    // Step 3: Fetch user from database to get role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      logger.authFailure(
        session.user.email,
        req.ip || 'unknown',
        'User not found in database'
      );
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Step 4: Check if user has an admin role
    if (!ADMIN_ROLES.includes(user.role)) {
      logger.authzFailure(
        user.id,
        req.path,
        'User does not have admin role',
        req.ip || 'unknown'
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access admin resources',
      });
    }

    // Step 5: Attach admin user to request object
    req.adminUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.apiError(
      'Admin auth middleware error',
      error instanceof Error ? error : new Error(String(error)),
      {
        path: req.path,
        method: req.method,
        ip: req.ip,
      }
    );
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate admin user',
    });
  }
};
