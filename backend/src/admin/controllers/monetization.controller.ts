import type { Request, Response } from 'express';
import { z } from 'zod';
import { MonetizationService } from '../services/monetization.service';
import {
  ledgerFiltersSchema,
  withdrawalFiltersSchema,
  giftFiltersSchema,
  walletDetailsSchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
} from '../validations/monetization.schema';

/**
 * Controller for monetization and wallet management
 * Handles coin ledger, withdrawals, gifts, and wallet operations
 *
 * Requirements: 17.2
 */
export class MonetizationController {
  /**
   * Get coin purchase ledger with filtering and pagination
   * GET /api/admin/monetization/ledger
   *
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  static async getCoinLedger(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = ledgerFiltersSchema.parse(req.query);

      // Convert date strings to Date objects
      const filters = {
        userId: params.userId,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        status: params.status,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
        paymentGateway: params.paymentGateway,
      };

      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      // Call service
      const result = await MonetizationService.getCoinLedger(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error getting coin ledger:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get withdrawal requests with filtering and pagination
   * GET /api/admin/monetization/withdrawals
   *
   * Requirements: 8.5, 8.6, 8.7
   */
  static async getWithdrawals(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = withdrawalFiltersSchema.parse(req.query);

      // Convert date strings to Date objects
      const filters = {
        status: params.status,
        userId: params.userId,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
      };

      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      // Call service
      const result = await MonetizationService.getWithdrawals(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error getting withdrawals:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Approve a withdrawal request
   * PATCH /api/admin/monetization/withdrawals/:id/approve
   *
   * Requirements: 8.8, 29.2, 29.11, 29.12, 29.15
   */
  static async approveWithdrawal(req: Request, res: Response) {
    try {
      // Validate parameters
      const params = approveWithdrawalSchema.parse({
        id: req.params.id,
      });

      // Get admin ID from authenticated user
      const adminId = (req as any).adminUser.id;

      // Call service
      const result = await MonetizationService.approveWithdrawal(params.id, adminId);

      // Return response
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      if (error instanceof Error) {
        // Handle business logic errors
        if (error.message.includes('not found') || error.message.includes('does not have')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Cannot approve') || error.message.includes('Insufficient')) {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Error approving withdrawal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Reject a withdrawal request
   * PATCH /api/admin/monetization/withdrawals/:id/reject
   *
   * Requirements: 8.9
   */
  static async rejectWithdrawal(req: Request, res: Response) {
    try {
      // Validate parameters
      const params = rejectWithdrawalSchema.parse({
        id: req.params.id,
        reason: req.body.reason,
      });

      // Get admin ID from authenticated user
      const adminId = (req as any).adminUser.id;

      // Call service
      const result = await MonetizationService.rejectWithdrawal(params.id, params.reason, adminId);

      // Return response
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error rejecting withdrawal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get gift transactions with filtering and pagination
   * GET /api/admin/monetization/gifts
   *
   * Requirements: 8.10, 8.11
   */
  static async getGiftTransactions(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = giftFiltersSchema.parse(req.query);

      // Convert date strings to Date objects
      const filters = {
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
      };

      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      // Call service
      const result = await MonetizationService.getGiftTransactions(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error getting gift transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get wallet details for a specific user
   * GET /api/admin/monetization/wallets/:userId
   *
   * Requirements: 8.12
   */
  static async getWalletDetails(req: Request, res: Response) {
    try {
      // Validate parameters
      const params = walletDetailsSchema.parse({
        userId: req.params.userId,
      });

      // Call service
      const result = await MonetizationService.getWalletDetails(params.userId);

      if (!result) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error getting wallet details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
