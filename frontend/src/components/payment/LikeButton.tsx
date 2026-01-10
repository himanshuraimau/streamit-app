import { useState, useCallback, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HeartBurstAnimation } from './HeartBurstAnimation';
import { paymentApi } from '@/lib/api/payment';
import { usePayment } from '@/stores/payment.store';

interface LikeButtonProps {
  creatorId: string;
  streamId: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onInsufficientBalance?: () => void;
  className?: string;
}

/**
 * LikeButton Component (Penny Tip)
 * 
 * Displays a gold coin icon with "1" badge that sends a 1-coin tip to the creator.
 * Shows heart burst animation on success and prompts for coin purchase on insufficient balance.
 * 
 * Requirements:
 * - 3.1: Display like/coin button with "1" coin indicator
 * - 3.2: Display heart burst animation on tap
 * - 3.3: Deduct 1 coin from viewer's wallet
 * - 3.5: Display prompt to purchase coins if insufficient balance
 */
export function LikeButton({
  creatorId,
  streamId,
  disabled = false,
  onSuccess,
  onInsufficientBalance,
  className,
}: LikeButtonProps) {
  const navigate = useNavigate();
  const { wallet, fetchWallet } = usePayment();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);

  // Fetch wallet on mount to check balance
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return;

    // Check balance before making API call
    if (wallet && wallet.balance < 1) {
      setShowInsufficientDialog(true);
      onInsufficientBalance?.();
      return;
    }

    setIsLoading(true);

    try {
      const response = await paymentApi.sendPennyTip({
        creatorId,
        streamId,
      });

      if (response.success && response.data) {
        // Trigger heart burst animation
        setShowAnimation(true);
        
        // Refresh wallet balance
        fetchWallet();
        
        // Call success callback
        onSuccess?.();
        
        // Show subtle success feedback
        toast.success('Tip sent! ❤️', {
          duration: 2000,
          position: 'bottom-center',
        });
      } else {
        // Handle insufficient balance error from API
        if (response.error === 'Insufficient balance') {
          setShowInsufficientDialog(true);
          onInsufficientBalance?.();
        } else {
          toast.error(response.error || 'Failed to send tip');
        }
      }
    } catch (error) {
      console.error('Error sending penny tip:', error);
      toast.error('Failed to send tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, streamId, isLoading, disabled, wallet, fetchWallet, onSuccess, onInsufficientBalance]);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
  }, []);

  const handleBuyCoins = useCallback(() => {
    setShowInsufficientDialog(false);
    navigate('/coins/shop');
  }, [navigate]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClick}
                  disabled={isLoading || disabled}
                  className={`relative group ${className}`}
                  aria-label="Send penny tip"
                >
                  {/* Gold coin icon */}
                  <Coins 
                    className={`w-6 h-6 transition-colors ${
                      isLoading 
                        ? 'text-amber-400/50' 
                        : 'text-amber-500 group-hover:text-amber-400'
                    }`} 
                  />
                  
                  {/* "1" badge */}
                  <span 
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center 
                      text-[10px] font-bold rounded-full transition-colors ${
                      isLoading
                        ? 'bg-amber-400/50 text-white/50'
                        : 'bg-amber-500 text-white group-hover:bg-amber-400'
                    }`}
                  >
                    1
                  </span>

                  {/* Loading spinner overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  )}
                </Button>
              </motion.div>

              {/* Heart burst animation */}
              <HeartBurstAnimation
                isActive={showAnimation}
                onComplete={handleAnimationComplete}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Send 1 coin tip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Insufficient Balance Dialog */}
      <Dialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Insufficient Coins
            </DialogTitle>
            <DialogDescription>
              You don't have enough coins to send a tip. Would you like to purchase more coins?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current balance</p>
              <p className="text-2xl font-bold text-amber-500">
                {wallet?.balance ?? 0} coins
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowInsufficientDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuyCoins}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Coins className="w-4 h-4 mr-2" />
              Buy Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
