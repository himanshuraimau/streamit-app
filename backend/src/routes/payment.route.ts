import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * /api/payment/wallet:
 *   get:
 *     summary: Get the authenticated user's coin wallet balance
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: integer
 *                   description: Coin balance
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/wallet', requireAuth, PaymentController.getWallet);

/**
 * @swagger
 * /api/payment/packages:
 *   get:
 *     summary: Get available coin purchase packages (public)
 *     tags: [Payment]
 *     security: []
 *     responses:
 *       200:
 *         description: List of coin packages with prices
 */
router.get('/packages', PaymentController.getPackages);

/**
 * @swagger
 * /api/payment/purchase:
 *   post:
 *     summary: Purchase a coin package (creates a Dodo Payments checkout)
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId]
 *             properties:
 *               packageId:
 *                 type: string
 *               discountCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/purchase', requireAuth, PaymentController.createPurchase);

/**
 * @swagger
 * /api/payment/gifts:
 *   get:
 *     summary: Get all available gift items (public)
 *     tags: [Payment]
 *     security: []
 *     responses:
 *       200:
 *         description: List of gifts with coin cost and display info
 */
router.get('/gifts', PaymentController.getGifts);

/**
 * @swagger
 * /api/payment/gift:
 *   post:
 *     summary: Send a gift to a creator during a stream
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [giftId, recipientId]
 *             properties:
 *               giftId:
 *                 type: string
 *               recipientId:
 *                 type: string
 *               streamId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gift sent, new wallet balance returned
 *       400:
 *         description: Insufficient coins
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/gift', requireAuth, PaymentController.sendGift);

/**
 * @swagger
 * /api/payment/penny-tip:
 *   post:
 *     summary: Send a 1-coin penny tip to a creator
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId]
 *             properties:
 *               recipientId:
 *                 type: string
 *               streamId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tip sent
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/penny-tip', requireAuth, PaymentController.sendPennyTip);

/**
 * @swagger
 * /api/payment/withdrawals:
 *   post:
 *     summary: Submit a withdrawal request as an approved creator
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amountCoins]
 *             properties:
 *               amountCoins:
 *                 type: integer
 *                 minimum: 1
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal request submitted
 *       400:
 *         description: Validation or balance failure
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not an approved creator
 *   get:
 *     summary: Get authenticated creator withdrawal history
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: false
 *     responses:
 *       200:
 *         description: Paginated withdrawal history
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/withdrawals', requireAuth, PaymentController.createWithdrawalRequest);
router.get('/withdrawals', requireAuth, PaymentController.getWithdrawals);

/**
 * @swagger
 * /api/payment/purchases:
 *   get:
 *     summary: Get the authenticated user's coin purchase history
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of past coin purchases
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/purchases', requireAuth, PaymentController.getPurchases);

/**
 * @swagger
 * /api/payment/gifts-sent:
 *   get:
 *     summary: Get the list of gifts the user has sent
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of sent gifts
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/gifts-sent', requireAuth, PaymentController.getGiftsSent);

/**
 * @swagger
 * /api/payment/gifts-received:
 *   get:
 *     summary: Get the list of gifts the user (creator) has received
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of received gifts with sender info
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/gifts-received', requireAuth, PaymentController.getGiftsReceived);

export default router;
