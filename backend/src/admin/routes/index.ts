import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.middleware';
import { adminErrorHandler } from '../middleware/error-handler.middleware';
import { UserRole } from '@prisma/client';

/**
 * Main admin router that registers all admin module routes
 *
 * This router:
 * 1. Imports all module-specific routers
 * 2. Applies requirePermission middleware to each route group
 * 3. Exports the configured adminRouter for registration in main app
 *
 * Note: adminAuthMiddleware is applied at the app level in index.ts
 * before this router is mounted, so all routes here are already authenticated.
 *
 * Requirements: 17.6, 17.8
 */

const adminRouter = Router();

// TODO: Import module routers as they are implemented
import adminAuthRouter from './admin-auth.route';
import healthRouter from './health.route';
import userMgmtRouter from './user-mgmt.route';
import streamerMgmtRouter from './streamer-mgmt.route';
import contentModRouter from './content-mod.route';
import reportsRouter from './reports.route';
import monetizationRouter from './monetization.route';
import adsRouter from './ads.route';
import analyticsRouter from './analytics.route';
import complianceRouter from './compliance.route';
import settingsRouter from './settings.route';

// Health check route (no authentication required)
// Requirements: 28.3, 28.4
adminRouter.use('/health', healthRouter);

// Auth routes (no permission check - handled within the auth routes)
adminRouter.use('/auth', adminAuthRouter);

// User Management Module
// Allowed roles: super_admin, support_admin (ADMIN), compliance_officer
adminRouter.use(
  '/users',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER]),
  userMgmtRouter
);

// Streamer Management Module
// Allowed roles: super_admin, moderator, support_admin (ADMIN)
adminRouter.use(
  '/streamers',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.ADMIN]),
  streamerMgmtRouter
);

// Content Moderation Module
// Allowed roles: super_admin, moderator
adminRouter.use(
  '/moderation',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
  contentModRouter
);

// Reports Module
// Allowed roles: super_admin, moderator, support_admin (ADMIN), compliance_officer
adminRouter.use(
  '/reports',
  requirePermission([
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.ADMIN,
    UserRole.COMPLIANCE_OFFICER,
  ]),
  reportsRouter
);

// Monetization Module
// Allowed roles: super_admin, finance_admin, compliance_officer
adminRouter.use(
  '/monetization',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPLIANCE_OFFICER]),
  monetizationRouter
);

// Ads Module
// Allowed roles: super_admin, finance_admin
adminRouter.use(
  '/ads',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  adsRouter
);

// Analytics Module
// Allowed roles: super_admin, moderator, finance_admin, compliance_officer
adminRouter.use(
  '/analytics',
  requirePermission([
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.FINANCE_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
  ]),
  analyticsRouter
);

// Compliance Module
// Allowed roles: super_admin, compliance_officer
adminRouter.use(
  '/compliance',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER]),
  complianceRouter
);

// Settings Module
// Allowed roles: super_admin only
adminRouter.use('/settings', requirePermission([UserRole.SUPER_ADMIN]), settingsRouter);

// Error handler - must be last
adminRouter.use(adminErrorHandler);

export { adminRouter };
