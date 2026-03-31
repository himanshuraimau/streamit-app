import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

// GET /api/admin/analytics/overview - Get overview metrics
router.get('/overview', AnalyticsController.getOverview);

// GET /api/admin/analytics/streamers - Get top streamers by revenue
router.get('/streamers', AnalyticsController.getTopStreamers);

// GET /api/admin/analytics/content - Get top content by engagement
router.get('/content', AnalyticsController.getTopContent);

// GET /api/admin/analytics/conversion - Get conversion funnel metrics
router.get('/conversion', AnalyticsController.getConversionFunnel);

export default router;
