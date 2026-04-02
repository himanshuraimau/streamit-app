import type { Request, Response } from 'express';
import { z } from 'zod';
import { DiscountCodesService } from '../services/discount-codes.service';
import {
  createDiscountCodeSchema,
  deleteDiscountCodeSchema,
  getDiscountCodeSchema,
  listDiscountCodesSchema,
  updateDiscountCodeSchema,
} from '../validations/discount-codes.schema';

export class DiscountCodesController {
  static async listDiscountCodes(req: Request, res: Response) {
    try {
      const params = listDiscountCodesSchema.parse(req.query);
      const result = await DiscountCodesService.listDiscountCodes(
        {
          search: params.search,
          status: params.status,
        },
        {
          page: params.page,
          pageSize: params.pageSize,
        }
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error listing discount codes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDiscountCodeById(req: Request, res: Response) {
    try {
      const params = getDiscountCodeSchema.parse({
        id: req.params.id,
      });

      const result = await DiscountCodesService.getDiscountCodeById(params.id);
      if (!result) {
        return res.status(404).json({ error: 'Discount code not found' });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error getting discount code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createDiscountCode(req: Request, res: Response) {
    try {
      const data = createDiscountCodeSchema.parse(req.body);
      const adminId = req.adminUser!.id;
      const result = await DiscountCodesService.createDiscountCode(data, adminId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes('Discount code') ||
          error.message.includes('promotional') ||
          error.message.includes('Percentage'))
      ) {
        return res.status(400).json({ error: error.message });
      }

      console.error('Error creating discount code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateDiscountCode(req: Request, res: Response) {
    try {
      const params = updateDiscountCodeSchema.parse({
        id: req.params.id,
        ...req.body,
      });

      const { id, ...data } = params;
      const adminId = req.adminUser!.id;
      const result = await DiscountCodesService.updateDiscountCode(id, data, adminId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message.includes('Discount code') ||
          error.message.includes('Max redemptions') ||
          error.message.includes('Percentage') ||
          error.message.includes('promotional')
        ) {
          return res.status(400).json({ error: error.message });
        }
      }

      console.error('Error updating discount code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteDiscountCode(req: Request, res: Response) {
    try {
      const params = deleteDiscountCodeSchema.parse({
        id: req.params.id,
      });

      const adminId = req.adminUser!.id;
      const result = await DiscountCodesService.deleteDiscountCode(params.id, adminId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }

      console.error('Error deleting discount code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
