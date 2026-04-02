import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

/**
 * Health Check Routes
 *
 * Provides health check endpoint for monitoring system status.
 *
 * Requirements: 28.3, 28.4
 */
const router = Router();

/**
 * GET /api/admin/health
 * Health check endpoint
 *
 * Returns:
 * - status: 'ok' or 'error'
 * - database: 'connected' or 'disconnected'
 * - timestamp: ISO 8601 timestamp
 *
 * Requirements: 28.3, 28.4
 */
router.get('/', HealthController.healthCheck);

export default router;
