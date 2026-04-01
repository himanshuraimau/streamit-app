import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';

/**
 * Global error handler middleware for admin routes
 * Logs all errors with full context and stack traces
 * 
 * Requirements: 28.2, 28.6
 */
export const adminErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error with full context
  logger.apiError(
    'Admin API error',
    error,
    {
      path: req.path,
      method: req.method,
      adminId: req.adminUser?.id,
      adminEmail: req.adminUser?.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: req.body,
      query: req.query,
      params: req.params,
    }
  );

  // Return error response
  res.status(500).json({
    error: 'Internal server error',
    message: error.message || 'An unexpected error occurred',
  });
};
