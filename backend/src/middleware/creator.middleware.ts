import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

/**
 * Middleware to ensure user is an approved creator
 * Must be used after requireAuth middleware
 */
export const requireCreator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userId = req.user.id;

    // Check if user has a creator application
    const application = await prisma.creatorApplication.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (!application) {
      return res.status(403).json({
        success: false,
        error: 'Creator application required',
        message: 'Please apply to become a creator first.',
      });
    }

    if (application.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: 'Creator approval required',
        message: `Your creator application status is: ${application.status}. Only approved creators can access this feature.`,
        applicationStatus: application.status,
      });
    }

    // User is an approved creator, continue
    next();
  } catch (error) {
    console.error('Creator middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Middleware to check if user owns a specific stream
 * Expects req.params.userId or req.body.userId
 */
export const requireStreamOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const currentUserId = req.user.id;
    const targetUserId = req.params.userId || req.body.userId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required',
      });
    }

    if (currentUserId !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only manage your own stream.',
      });
    }

    next();
  } catch (error) {
    console.error('Stream ownership middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
