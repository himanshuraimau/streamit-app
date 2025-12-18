import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { DiscountController } from '../controllers/discount.controller';

const router = Router();

/**
 * Discount Routes
 * Requirements: 1.1, 4.1
 */

// Validate discount code (requires auth)
// POST /api/discount/validate
router.post('/validate', requireAuth, DiscountController.validateCode);

// Get user's discount codes (requires auth)
// GET /api/discount/my-codes
router.get('/my-codes', requireAuth, DiscountController.getUserCodes);

// Get latest reward code (requires auth)
// GET /api/discount/latest-reward
// Requirements: 2.1, 2.3
router.get('/latest-reward', requireAuth, DiscountController.getLatestRewardCode);

export default router;
