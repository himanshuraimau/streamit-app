import { apiGet, apiPost } from '../api-client';
import type {
  DiscountValidationResult,
  DiscountCodesResponse,
} from '@/types/discount.types';

/**
 * Discount API Client
 * All functions use the apiFetch wrapper with automatic Bearer token
 * Requirements: 1.1, 4.1
 */
export const discountApi = {
  /**
   * Validate a discount code for a specific package
   * Returns bonus coins calculation if valid
   * Requirements: 1.1
   */
  async validateCode(code: string, packageId: string): Promise<DiscountValidationResult> {
    try {
      const response = await apiPost<DiscountValidationResult>(
        '/api/discount/validate',
        { code, packageId }
      );
      return response;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate discount code',
      };
    }
  },

  /**
   * Get current user's discount codes (reward codes)
   * Requirements: 4.1
   */
  async getMyCodes(): Promise<DiscountCodesResponse> {
    try {
      const response = await apiGet<DiscountCodesResponse>('/api/discount/my-codes');
      return response;
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch discount codes',
      };
    }
  },

  /**
   * Get the latest reward code for the current user
   * Used to display reward code on purchase success page
   * Requirements: 2.1, 2.3
   */
  async getLatestRewardCode(): Promise<{ success: boolean; data?: import('@/types/discount.types').DiscountCode; error?: string }> {
    try {
      const response = await apiGet<{ success: boolean; data?: import('@/types/discount.types').DiscountCode; error?: string }>(
        '/api/discount/latest-reward'
      );
      return response;
    } catch (error) {
      console.error('Error fetching latest reward code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reward code',
      };
    }
  },
};
