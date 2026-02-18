import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { DiscountController } from '../controllers/discount.controller';

const router = Router();

/**
 * @swagger
 * /api/discount/validate:
 *   post:
 *     summary: Validate a discount code and return its value
 *     tags: [Discount]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *               packageId:
 *                 type: string
 *                 description: Optional — validate against a specific package
 *     responses:
 *       200:
 *         description: Discount details (valid, percent off, new price)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 percentOff:
 *                   type: number
 *                 newPrice:
 *                   type: number
 *       400:
 *         description: Invalid or expired discount code
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/validate', requireAuth, DiscountController.validateCode);

/**
 * @swagger
 * /api/discount/my-codes:
 *   get:
 *     summary: Get the authenticated user's discount codes
 *     tags: [Discount]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of discount codes assigned to the user
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-codes', requireAuth, DiscountController.getUserCodes);

/**
 * @swagger
 * /api/discount/latest-reward:
 *   get:
 *     summary: Get the user's most recent reward-based discount code
 *     tags: [Discount]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Latest reward code, or null if none exists
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/latest-reward', requireAuth, DiscountController.getLatestRewardCode);

export default router;
