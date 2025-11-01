import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); 

    // Find session by token
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Token expired' });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Optional auth middleware - attaches user if authenticated, but doesn't block if not
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    // Find session by token
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (session && session.expiresAt > new Date()) {
      req.user = session.user;
    }
    
    // Continue regardless of auth status
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue even if there's an error
    next();
  }
};