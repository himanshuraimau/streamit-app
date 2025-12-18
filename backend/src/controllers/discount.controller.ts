import type { Request, Response } from 'express';
import { DiscountService } from '../services/discount.service';
import { validateCodeSchema } from '../lib/validations/discount.validation';
import { z } from 'zod';

export class DiscountController {
  /**
   * Validate a discount code for a specific package
   * POST /api/discount/validate
   * Requirements: 1.1
   */
  static async validateCode(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { code, packageId } = validateCodeSchema.parse(req.body);

      const result = await DiscountService.validateCode(code, packageId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.errorCode,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Error validating discount code:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to validate discount code',
      });
    }
  }

  /**
   * Get user's discount codes (reward codes)
   * GET /api/discount/my-codes
   * Requirements: 4.1
   */
  static async getUserCodes(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const codes = await DiscountService.getUserCodes(userId);

      res.json({
        success: true,
        data: codes,
      });
    } catch (error) {
      console.error('Error fetching user codes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch discount codes',
      });
    }
  }

  /**
   * Get the latest reward code for the user
   * GET /api/discount/latest-reward
   * Requirements: 2.1, 2.3
   */
  static async getLatestRewardCode(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const rewardCode = await DiscountService.getLatestRewardCode(userId);

      res.json({
        success: true,
        data: rewardCode,
      });
    } catch (error) {
      console.error('Error fetching latest reward code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reward code',
      });
    }
  }
}
