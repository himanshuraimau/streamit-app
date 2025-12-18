import { apiGet, apiPost } from '../api-client';
import type {
  CoinWallet,
  CoinPackage,
  CoinPurchase,
  CheckoutSessionResponse,
  PaginatedResponse,
  ApiResponse,
  PaginationParams,
  Gift,
  GiftTransaction,
  SendGiftRequest,
} from '@/types/payment.types';

/**
 * Payment API Client
 * All functions use the apiFetch wrapper with automatic Bearer token
 */
export const paymentApi = {
  /**
   * Get current user's coin wallet
   */
  async getWallet(): Promise<ApiResponse<CoinWallet>> {
    try {
      const response = await apiGet<ApiResponse<CoinWallet>>('/api/payment/wallet');
      return response;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch wallet',
      };
    }
  },

  /**
   * Get all available coin packages
   */
  async getPackages(): Promise<ApiResponse<CoinPackage[]>> {
    try {
      const response = await apiGet<ApiResponse<CoinPackage[]>>('/api/payment/packages');
      return response;
    } catch (error) {
      console.error('Error fetching packages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch packages',
      };
    }
  },

  /**
   * Create checkout session for coin purchase
   * Returns Dodo checkout URL to redirect user to
   * @param packageId - The coin package to purchase
   * @param discountCode - Optional discount code to apply (Requirements: 1.4)
   */
  async createCheckout(packageId: string, discountCode?: string): Promise<ApiResponse<CheckoutSessionResponse>> {
    try {
      const response = await apiPost<ApiResponse<CheckoutSessionResponse>>(
        '/api/payment/purchase',
        { packageId, discountCode }
      );
      return response;
    } catch (error) {
      console.error('Error creating checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout',
      };
    }
  },

  /**
   * Get user's purchase history with pagination
   */
  async getPurchaseHistory(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<CoinPurchase>> {
    try {
      const { page = 1, limit = 20 } = params;
      const response = await apiGet<PaginatedResponse<CoinPurchase>>(
        `/api/payment/purchases?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
  },

  /**
   * Verify purchase status by orderId
   * Used after returning from Dodo payment page
   */
  async verifyPurchase(orderId: string): Promise<ApiResponse<CoinPurchase>> {
    try {
      // We can find the purchase in history by orderId
      const historyResponse = await this.getPurchaseHistory({ page: 1, limit: 50 });
      
      if (historyResponse.success && historyResponse.data) {
        const purchase = historyResponse.data.find(p => p.orderId === orderId);
        
        if (purchase) {
          return {
            success: true,
            data: purchase,
          };
        }
      }
      
      return {
        success: false,
        error: 'Purchase not found',
      };
    } catch (error) {
      console.error('Error verifying purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify purchase',
      };
    }
  },
  
  /**
   * Get all available gifts
   */
  async getGifts(): Promise<ApiResponse<Gift[]>> {
    try {
      const response = await apiGet<ApiResponse<Gift[]>>('/api/payment/gifts');
      return response;
    } catch (error) {
      console.error('Error fetching gifts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gifts',
      };
    }
  },

  /**
   * Send a gift to a creator
   */
  async sendGift(request: SendGiftRequest): Promise<ApiResponse<GiftTransaction>> {
    try {
      const response = await apiPost<ApiResponse<GiftTransaction>>(
        '/api/payment/gift',
        request
      );
      return response;
    } catch (error) {
      console.error('Error sending gift:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send gift',
      };
    }
  },

  /**
   * Get gifts sent by current user
   */
  async getGiftsSent(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<GiftTransaction>> {
    try {
      const { page = 1, limit = 20 } = params;
      const response = await apiGet<PaginatedResponse<GiftTransaction>>(
        `/api/payment/gifts-sent?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching gifts sent:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
  },

  /**
   * Get gifts received by current user (for creators)
   */
  async getGiftsReceived(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<GiftTransaction>> {
    try {
      const { page = 1, limit = 20 } = params;
      const response = await apiGet<PaginatedResponse<GiftTransaction>>(
        `/api/payment/gifts-received?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching gifts received:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
  },
};
