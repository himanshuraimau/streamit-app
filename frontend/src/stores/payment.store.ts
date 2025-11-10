import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { paymentApi } from '@/lib/api/payment';
import { toast } from 'sonner';
import type {
  CoinWallet,
  CoinPackage,
  CoinPurchase,
  PaginationParams,
  Gift,
  GiftTransaction,
  SendGiftRequest,
} from '@/types/payment.types';

interface PaymentState {
  // Wallet State
  wallet: CoinWallet | null;
  walletLoading: boolean;
  walletError: string | null;

  // Packages State
  packages: CoinPackage[];
  packagesLoading: boolean;
  packagesError: string | null;

  // Purchase History State
  purchases: CoinPurchase[];
  purchasesLoading: boolean;
  purchasesError: string | null;
  purchasesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Checkout State
  checkoutLoading: boolean;
  checkoutError: string | null;

  // Gift State
  gifts: Gift[];
  giftsLoading: boolean;
  giftsError: string | null;

  // Gift Transactions State
  giftsSent: GiftTransaction[];
  giftsSentLoading: boolean;
  giftsSentError: string | null;
  giftsSentPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  giftsReceived: GiftTransaction[];
  giftsReceivedLoading: boolean;
  giftsReceivedError: string | null;
  giftsReceivedPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  sendingGift: boolean;
  sendGiftError: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchPurchaseHistory: (params?: PaginationParams) => Promise<void>;
  createCheckout: (packageId: string) => Promise<string | null>; // Returns checkout URL
  verifyPurchase: (orderId: string) => Promise<CoinPurchase | null>;
  
  // Gift Actions
  fetchGifts: () => Promise<void>;
  sendGift: (request: SendGiftRequest) => Promise<GiftTransaction | null>;
  fetchGiftsSent: (params?: PaginationParams) => Promise<void>;
  fetchGiftsReceived: (params?: PaginationParams) => Promise<void>;
  
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  devtools(
    (set, get) => ({
      // Initial State
      wallet: null,
      walletLoading: false,
      walletError: null,

      packages: [],
      packagesLoading: false,
      packagesError: null,

      purchases: [],
      purchasesLoading: false,
      purchasesError: null,
      purchasesPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },

      checkoutLoading: false,
      checkoutError: null,

      // Gift Initial State
      gifts: [],
      giftsLoading: false,
      giftsError: null,

      giftsSent: [],
      giftsSentLoading: false,
      giftsSentError: null,
      giftsSentPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },

      giftsReceived: [],
      giftsReceivedLoading: false,
      giftsReceivedError: null,
      giftsReceivedPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },

      sendingGift: false,
      sendGiftError: null,

      // Fetch wallet balance
      fetchWallet: async () => {
        set({ walletLoading: true, walletError: null });
        
        try {
          const response = await paymentApi.getWallet();
          
          if (response.success && response.data) {
            set({ wallet: response.data, walletError: null });
          } else {
            set({ walletError: response.error || 'Failed to fetch wallet' });
          }
        } catch (error) {
          set({ walletError: 'Network error occurred' });
          console.error('Error fetching wallet:', error);
        } finally {
          set({ walletLoading: false });
        }
      },

      // Fetch available packages
      fetchPackages: async () => {
        set({ packagesLoading: true, packagesError: null });
        
        try {
          const response = await paymentApi.getPackages();
          
          if (response.success && response.data) {
            set({ packages: response.data, packagesError: null });
          } else {
            set({ packagesError: response.error || 'Failed to fetch packages' });
          }
        } catch (error) {
          set({ packagesError: 'Network error occurred' });
          console.error('Error fetching packages:', error);
        } finally {
          set({ packagesLoading: false });
        }
      },

      // Fetch purchase history
      fetchPurchaseHistory: async (params?: PaginationParams) => {
        set({ purchasesLoading: true, purchasesError: null });
        
        try {
          const response = await paymentApi.getPurchaseHistory(params);
          
          if (response.success && response.data) {
            set({
              purchases: response.data,
              purchasesPagination: response.pagination,
              purchasesError: null,
            });
          } else {
            set({ purchasesError: 'Failed to fetch purchase history' });
          }
        } catch (error) {
          set({ purchasesError: 'Network error occurred' });
          console.error('Error fetching purchases:', error);
        } finally {
          set({ purchasesLoading: false });
        }
      },

      // Create checkout and redirect to Dodo
      createCheckout: async (packageId: string) => {
        set({ checkoutLoading: true, checkoutError: null });
        
        try {
          const response = await paymentApi.createCheckout(packageId);
          
          if (response.success && response.data) {
            toast.success('Redirecting to payment...');
            set({ checkoutError: null });
            return response.data.checkoutUrl;
          } else {
            const error = response.error || 'Failed to create checkout';
            set({ checkoutError: error });
            toast.error(error);
            return null;
          }
        } catch (error) {
          const errorMsg = 'Network error occurred';
          set({ checkoutError: errorMsg });
          toast.error(errorMsg);
          console.error('Error creating checkout:', error);
          return null;
        } finally {
          set({ checkoutLoading: false });
        }
      },

      // Verify purchase after payment
      verifyPurchase: async (orderId: string) => {
        try {
          const response = await paymentApi.verifyPurchase(orderId);
          
          if (response.success && response.data) {
            // Refresh wallet after successful purchase
            await get().fetchWallet();
            return response.data;
          } else {
            toast.error('Failed to verify purchase');
            return null;
          }
        } catch (error) {
          console.error('Error verifying purchase:', error);
          toast.error('Failed to verify purchase');
          return null;
        }
      },

      // Fetch available gifts
      fetchGifts: async () => {
        set({ giftsLoading: true, giftsError: null });
        
        try {
          const response = await paymentApi.getGifts();
          
          if (response.success && response.data) {
            set({ gifts: response.data, giftsError: null });
          } else {
            set({ giftsError: response.error || 'Failed to fetch gifts' });
          }
        } catch (error) {
          set({ giftsError: 'Network error occurred' });
          console.error('Error fetching gifts:', error);
        } finally {
          set({ giftsLoading: false });
        }
      },

      // Send gift to creator
      sendGift: async (request: SendGiftRequest) => {
        set({ sendingGift: true, sendGiftError: null });
        
        try {
          const response = await paymentApi.sendGift(request);
          
          if (response.success && response.data) {
            toast.success('Gift sent successfully! 🎁');
            
            // Refresh wallet balance after sending gift
            get().fetchWallet();
            
            return response.data;
          } else {
            const errorMsg = response.error || 'Failed to send gift';
            set({ sendGiftError: errorMsg });
            toast.error(errorMsg);
            return null;
          }
        } catch (error) {
          const errorMsg = 'Network error occurred';
          set({ sendGiftError: errorMsg });
          toast.error(errorMsg);
          console.error('Error sending gift:', error);
          return null;
        } finally {
          set({ sendingGift: false });
        }
      },

      // Fetch gifts sent by user
      fetchGiftsSent: async (params: PaginationParams = {}) => {
        set({ giftsSentLoading: true, giftsSentError: null });
        
        try {
          const response = await paymentApi.getGiftsSent(params);
          
          if (response.success && response.data) {
            set({
              giftsSent: response.data,
              giftsSentPagination: response.pagination,
              giftsSentError: null,
            });
          } else {
            set({ giftsSentError: 'Failed to fetch gifts sent' });
          }
        } catch (error) {
          set({ giftsSentError: 'Network error occurred' });
          console.error('Error fetching gifts sent:', error);
        } finally {
          set({ giftsSentLoading: false });
        }
      },

      // Fetch gifts received by user
      fetchGiftsReceived: async (params: PaginationParams = {}) => {
        set({ giftsReceivedLoading: true, giftsReceivedError: null });
        
        try {
          const response = await paymentApi.getGiftsReceived(params);
          
          if (response.success && response.data) {
            set({
              giftsReceived: response.data,
              giftsReceivedPagination: response.pagination,
              giftsReceivedError: null,
            });
          } else {
            set({ giftsReceivedError: 'Failed to fetch gifts received' });
          }
        } catch (error) {
          set({ giftsReceivedError: 'Network error occurred' });
          console.error('Error fetching gifts received:', error);
        } finally {
          set({ giftsReceivedLoading: false });
        }
      },

      // Reset store
      reset: () =>
        set({
          wallet: null,
          walletLoading: false,
          walletError: null,
          packages: [],
          packagesLoading: false,
          packagesError: null,
          purchases: [],
          purchasesLoading: false,
          purchasesError: null,
          purchasesPagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
          checkoutLoading: false,
          checkoutError: null,
          gifts: [],
          giftsLoading: false,
          giftsError: null,
          giftsSent: [],
          giftsSentLoading: false,
          giftsSentError: null,
          giftsSentPagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
          giftsReceived: [],
          giftsReceivedLoading: false,
          giftsReceivedError: null,
          giftsReceivedPagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
          sendingGift: false,
          sendGiftError: null,
        }),
    }),
    {
      name: 'payment-store',
    }
  )
);

// Custom hook for easy access
export const usePayment = () => {
  return usePaymentStore();
};
