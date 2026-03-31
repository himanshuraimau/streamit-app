import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Factory function that creates middleware to enforce role-based access control
 * 
 * This middleware:
 * 1. Accepts an array of allowed admin roles
 * 2. Checks if req.adminUser.role is in the allowed roles list
 * 3. Returns 403 if the role is not allowed
 * 
 * Usage:
 * router.use('/users', requirePermission([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userRoutes);
 * 
 * Requirements: 2.4, 17.8
 * 
 * @param allowedRoles - Array of UserRole values that are permitted to access the route
 * @returns Express middleware function
 */
export const requirePermission = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Step 1: Verify adminUser exists (should be set by adminAuthMiddleware)
    if (!req.adminUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    // Step 2: Check if the admin's role is in the allowed roles list
    if (!allowedRoles.includes(req.adminUser.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }

    // Step 3: Role is allowed, proceed to next middleware/handler
    next();
  };
};
