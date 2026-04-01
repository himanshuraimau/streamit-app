import type { Request, Response } from 'express';
import { prisma } from '../../lib/db';

/**
 * Health Check Controller
 * 
 * Handles health check endpoint for monitoring system status:
 * - GET /api/admin/health: Check database connectivity and API status
 * 
 * Requirements: 28.3, 28.4
 */
export class HealthController {
  /**
   * Health check endpoint
   * GET /api/admin/health
   * 
   * Checks database connectivity and returns API status with timestamp.
   * 
   * Requirements: 28.3, 28.4
   */
  static async healthCheck(_req: Request, res: Response) {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;

      // Return success response with database status, API status, and timestamp
      res.json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Return error response with database disconnected status
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
