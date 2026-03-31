import type { Request, Response } from 'express';
import { auth } from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Admin Authentication Controller
 * 
 * Handles admin authentication endpoints:
 * - POST /api/admin/auth/sign-in: Authenticate admin user
 * - POST /api/admin/auth/sign-out: Sign out admin user
 * - GET /api/admin/auth/session: Get current admin session
 * 
 * Requirements: 1.1, 1.4, 1.5, 1.6
 */
export class AdminAuthController {
  /**
   * Sign in admin user
   * POST /api/admin/auth/sign-in
   * 
   * This endpoint uses Better Auth's built-in sign-in functionality.
   * The actual authentication is handled by Better Auth at /api/auth/sign-in/email
   * 
   * Requirements: 1.1, 1.4
   */
  static async signIn(req: Request, res: Response) {
    try {
      // Better Auth handles sign-in at /api/auth/sign-in/email
      // This endpoint is a proxy that delegates to Better Auth
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required',
        });
      }

      // Call Better Auth sign-in endpoint
      const signInResponse = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
        headers: fromNodeHeaders(req.headers),
      });

      // Better Auth returns the session and user data
      if (!signInResponse) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      // Return session data
      res.json({
        success: true,
        user: signInResponse.user,
        session: signInResponse.session,
      });
    } catch (error) {
      console.error('Admin sign-in error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to sign in',
      });
    }
  }

  /**
   * Sign out admin user
   * POST /api/admin/auth/sign-out
   * 
   * Requirements: 1.6
   */
  static async signOut(req: Request, res: Response) {
    try {
      // Call Better Auth sign-out
      await auth.api.signOut({
        headers: fromNodeHeaders(req.headers),
      });

      res.json({
        success: true,
        message: 'Signed out successfully',
      });
    } catch (error) {
      console.error('Admin sign-out error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to sign out',
      });
    }
  }

  /**
   * Get current admin session
   * GET /api/admin/auth/session
   * 
   * Requirements: 1.5
   */
  static async getSession(req: Request, res: Response) {
    try {
      // Get session from Better Auth
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No active session',
        });
      }

      // Return session data with user info
      res.json({
        success: true,
        user: session.user,
        session: session.session,
      });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get session',
      });
    }
  }
}
