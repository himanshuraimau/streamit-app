import type { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { z } from 'zod';

// Validation schemas
const createPurchaseSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
});

const sendGiftSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  giftId: z.string().min(1, 'Gift ID is required'),
  streamId: z.string().optional(),
  message: z.string().max(200).optional(),
});

export class PaymentController {
  /**
   * Get user's coin wallet
   * GET /api/payment/wallet
   */
  static async getWallet(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const wallet = await PaymentService.getWallet(userId);
      
      res.json({ 
        success: true, 
        data: wallet 
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch wallet' 
      });
    }
  }

  /**
   * Get available coin packages
   * GET /api/payment/packages
   */
  static async getPackages(req: Request, res: Response) {
    try {
      const packages = await PaymentService.getPackages();
      
      res.json({ 
        success: true, 
        data: packages 
      });
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch packages' 
      });
    }
  }

  /**
   * Create checkout session for coin purchase
   * POST /api/payment/purchase
   */
  static async createPurchase(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { packageId } = createPurchaseSchema.parse(req.body);
      
      const result = await PaymentService.createCheckout(userId, packageId);
      
      res.json({ 
        success: true, 
        data: result,
        message: 'Checkout session created successfully'
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation error',
          details: error.issues
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create purchase' 
      });
    }
  }

  /**
   * Get available gifts
   * GET /api/payment/gifts
   */
  static async getGifts(req: Request, res: Response) {
    try {
      const gifts = await PaymentService.getGifts();
      
      res.json({ 
        success: true, 
        data: gifts 
      });
    } catch (error) {
      console.error('Error fetching gifts:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch gifts' 
      });
    }
  }

  /**
   * Send gift to creator
   * POST /api/payment/gift
   */
  static async sendGift(req: Request, res: Response) {
    try {
      const senderId = req.user!.id;
      const { receiverId, giftId, streamId, message } = sendGiftSchema.parse(req.body);
      
      // Can't gift yourself
      if (senderId === receiverId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot send a gift to yourself'
        });
      }
      
      const transaction = await PaymentService.sendGift(
        senderId, 
        receiverId, 
        giftId, 
        streamId,
        message
      );
      
      res.json({ 
        success: true, 
        data: transaction,
        message: 'Gift sent successfully' 
      });
    } catch (error) {
      console.error('Error sending gift:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation error',
          details: error.issues
        });
      }
      
      const status = error instanceof Error && error.message === 'Insufficient balance' ? 400 : 500;
      res.status(status).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send gift' 
      });
    }
  }

  /**
   * Get purchase history
   * GET /api/payment/purchases
   */
  static async getPurchases(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const result = await PaymentService.getPurchaseHistory(userId, limit, offset);
      
      res.json({ 
        success: true, 
        data: result.purchases,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      console.error('Error fetching purchases:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch purchase history' 
      });
    }
  }

  /**
   * Get gifts sent
   * GET /api/payment/gifts-sent
   */
  static async getGiftsSent(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const result = await PaymentService.getGiftsSent(userId, limit, offset);
      
      res.json({ 
        success: true, 
        data: result.gifts,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      console.error('Error fetching gifts sent:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch gifts sent' 
      });
    }
  }

  /**
   * Get gifts received (for creators)
   * GET /api/payment/gifts-received
   */
  static async getGiftsReceived(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const result = await PaymentService.getGiftsReceived(userId, limit, offset);
      
      res.json({ 
        success: true, 
        data: result.gifts,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      console.error('Error fetching gifts received:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch gifts received' 
      });
    }
  }
}
