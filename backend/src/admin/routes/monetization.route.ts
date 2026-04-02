import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { MonetizationController } from '../controllers/monetization.controller';
import { DiscountCodesController } from '../controllers/discount-codes.controller';
import { requirePermission } from '../middleware/permissions.middleware';

/**
 * Monetization routes
 * Handles coin ledger, withdrawals, gifts, and wallet operations
 *
 * Requirements: 17.4
 */
const router = Router();

router.get('/overview', MonetizationController.getOverview);

/**
 * GET /api/admin/monetization/ledger
 * Get coin purchase ledger with filtering and pagination
 *
 * Query parameters:
 * - userId: Filter by user ID
 * - dateFrom: Filter by start date (ISO 8601)
 * - dateTo: Filter by end date (ISO 8601)
 * - status: Filter by purchase status (PENDING, COMPLETED, FAILED, REFUNDED)
 * - amountMin: Filter by minimum amount
 * - amountMax: Filter by maximum amount
 * - paymentGateway: Filter by payment gateway
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 */
router.get('/ledger', MonetizationController.getCoinLedger);

/**
 * GET /api/admin/monetization/withdrawals
 * Get withdrawal requests with filtering and pagination
 *
 * Query parameters:
 * - status: Filter by withdrawal status (PENDING, UNDER_REVIEW, ON_HOLD, APPROVED, REJECTED, PAID)
 * - userId: Filter by user ID
 * - dateFrom: Filter by start date (ISO 8601)
 * - dateTo: Filter by end date (ISO 8601)
 * - amountMin: Filter by minimum amount in coins
 * - amountMax: Filter by maximum amount in coins
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 */
router.get('/withdrawals', MonetizationController.getWithdrawals);

/**
 * PATCH /api/admin/monetization/withdrawals/:id/approve
 * Approve a withdrawal request
 *
 * This operation is atomic:
 * - Updates withdrawal status to APPROVED
 * - Deducts coins from creator wallet
 * - Creates audit log entry
 * - All changes are rolled back if any step fails
 *
 * Path parameters:
 * - id: Withdrawal request ID
 */
router.patch(
  '/withdrawals/:id/approve',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  MonetizationController.approveWithdrawal
);

/**
 * PATCH /api/admin/monetization/withdrawals/:id/reject
 * Reject a withdrawal request
 *
 * Path parameters:
 * - id: Withdrawal request ID
 *
 * Body:
 * - reason: Rejection reason (required, 10-500 characters)
 */
router.patch(
  '/withdrawals/:id/reject',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  MonetizationController.rejectWithdrawal
);

/**
 * GET /api/admin/monetization/gifts
 * Get gift transactions with filtering and pagination
 *
 * Query parameters:
 * - dateFrom: Filter by start date (ISO 8601)
 * - dateTo: Filter by end date (ISO 8601)
 * - amountMin: Filter by minimum coin amount
 * - amountMax: Filter by maximum coin amount
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 */
router.get('/gifts', MonetizationController.getGiftTransactions);

/**
 * GET /api/admin/monetization/wallets/:userId
 * Get wallet details for a specific user
 *
 * Path parameters:
 * - userId: User ID
 *
 * Returns:
 * - Wallet balance, total earned, total spent
 * - Recent transactions (last 20)
 */
router.get('/wallets/:userId', MonetizationController.getWalletDetails);

router.get('/discount-codes', DiscountCodesController.listDiscountCodes);
router.get('/discount-codes/:id', DiscountCodesController.getDiscountCodeById);
router.post(
  '/discount-codes',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  DiscountCodesController.createDiscountCode
);
router.patch(
  '/discount-codes/:id',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  DiscountCodesController.updateDiscountCode
);
router.delete(
  '/discount-codes/:id',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  DiscountCodesController.deleteDiscountCode
);

export default router;
