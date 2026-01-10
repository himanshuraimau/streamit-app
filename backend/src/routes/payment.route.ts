import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

/**
 * Payment Routes
 */

// Wallet endpoint (requires auth)
router.get('/wallet', requireAuth, PaymentController.getWallet);

// Coin packages (public)
router.get('/packages', PaymentController.getPackages);

// Purchase coins (requires auth)
router.post('/purchase', requireAuth, PaymentController.createPurchase);

// Gifts endpoints
router.get('/gifts', PaymentController.getGifts); // Public - view available gifts
router.post('/gift', requireAuth, PaymentController.sendGift); // Send gift to creator

// Penny tip endpoint (requires auth)
router.post('/penny-tip', requireAuth, PaymentController.sendPennyTip);

// Transaction history (requires auth)
router.get('/purchases', requireAuth, PaymentController.getPurchases);
router.get('/gifts-sent', requireAuth, PaymentController.getGiftsSent);
router.get('/gifts-received', requireAuth, PaymentController.getGiftsReceived);

export default router;
