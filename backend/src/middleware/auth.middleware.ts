import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { createErrorResponse, ErrorCode } from '../types/errors.types';
import type { WebhookEvent } from 'livekit-server-sdk';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        username: string;
      };
      webhookEvent?: WebhookEvent;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use Better Auth to get session from cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res
        .status(401)
        .json(
          createErrorResponse(
            'You must be signed in to access this resource',
            ErrorCode.UNAUTHORIZED
          )
        );
    }

    // Attach user info to request
    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username: session.user.username ?? session.user.email?.split('@')[0] ?? 'user',
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res
      .status(401)
      .json(
        createErrorResponse('Authentication failed. Please sign in again.', ErrorCode.UNAUTHORIZED)
      );
  }
};

/**
 * Extract the authenticated user from the request, or send a 401 and return null.
 *
 * Usage in controllers (replaces the repetitive !userId guard):
 *
 *   const user = getAuthUser(req, res);
 *   if (!user) return;          // 401 already sent
 *   const { id: userId } = user; // fully typed, no ! needed
 */
export function getAuthUser(req: Request, res: Response): Required<Express.Request>['user'] | null {
  if (!req.user) {
    res.status(401).json(createErrorResponse('Authentication required', ErrorCode.UNAUTHORIZED));
    return null;
  }
  return req.user;
}

/**
 * Optional auth middleware - attaches user if authenticated, but doesn't block if not
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Use Better Auth to get session from cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      // Attach user info to request if authenticated
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        username: session.user.username ?? session.user.email?.split('@')[0] ?? 'user',
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
