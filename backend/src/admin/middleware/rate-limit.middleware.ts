import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Rate limiting middleware for admin routes
 * 
 * This middleware implements rate limiting to protect admin endpoints from abuse:
 * - General admin routes: 1000 requests per 15 minutes
 * - Auth routes: 5 attempts per 15 minutes (stricter for brute force protection)
 * - Super admins in development: Skip rate limiting
 * 
 * Requirements: 22.8
 */

/**
 * General rate limiter for admin routes
 * Development: 1000 requests per 15 minutes
 * Production: 500 requests per 15 minutes (stricter)
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Stricter limit in production
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for super_admin in development only
    if (process.env.NODE_ENV === 'development' && req.adminUser?.role === 'SUPER_ADMIN') {
      return true;
    }
    return false;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later',
    });
  },
});

/**
 * Stricter rate limiter for auth routes
 * Development: 10 attempts per 15 minutes
 * Production: 5 attempts per 15 minutes (stricter to prevent brute force attacks)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 10, // Stricter limit in production
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts from this IP, please try again later',
    });
  },
});
