import { Router } from 'express';
import { AdminAuthController } from '../controllers/admin-auth.controller';

/**
 * Admin Authentication Routes
 * 
 * Routes:
 * - POST /api/admin/auth/sign-in: Sign in admin user
 * - POST /api/admin/auth/sign-out: Sign out admin user
 * - GET /api/admin/auth/session: Get current admin session
 * 
 * Note: These routes do NOT require adminAuthMiddleware as they are
 * used for authentication itself. The /auth/* routes are excluded
 * from the middleware in the main admin router.
 * 
 * Requirements: 1.1, 1.4, 1.5, 1.6
 */
const router = Router();

// POST /api/admin/auth/sign-in
router.post('/sign-in', AdminAuthController.signIn);

// POST /api/admin/auth/sign-out
router.post('/sign-out', AdminAuthController.signOut);

// GET /api/admin/auth/session
router.get('/session', AdminAuthController.getSession);

export default router;
