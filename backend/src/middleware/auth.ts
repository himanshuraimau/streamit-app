import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { createErrorResponse, ErrorCode } from '../types/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        username: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use Better Auth to get session from cookies
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      return res.status(401).json(
        createErrorResponse('You must be signed in to access this resource', ErrorCode.UNAUTHORIZED)
      );
    }

    // Attach user info to request
    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username: session.user.email?.split('@')[0] || 'user', // Fallback username
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json(
      createErrorResponse('Authentication failed. Please sign in again.', ErrorCode.UNAUTHORIZED)
    );
  }
};

/**
 * Optional auth middleware - attaches user if authenticated, but doesn't block if not
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use Better Auth to get session from cookies
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session) {
      // Attach user info to request if authenticated
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        username: session.user.email?.split('@')[0] || 'user',
      };
    }
    
    // Continue regardless of auth status
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue even if there's an error
    next();
  }
};