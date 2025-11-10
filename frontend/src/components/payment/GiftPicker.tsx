import { useEffect, useState } from 'react';
import { Coins, Send, Loader2 } from 'lucide-react';
import { usePayment } from '@/stores/payment.store';
import { formatCoins } from '@/types/payment.types';
import type { Gift } from '@/types/payment.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface GiftPickerProps {
  open: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  streamId?: string;
  onSuccess?: () => void;
}

export function GiftPicker({
  open,
  onClose,
  receiverId,
  receiverName,
  streamId,
  onSuccess,
}: GiftPickerProps) {
  const {
    gifts,
    giftsLoading,
    wallet,
    fetchGifts,
    fetchWallet,
    sendGift,
    sendingGift,
  } = usePayment();

  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchWallet();
    }
  }, [open, fetchGifts, fetchWallet]);

  const handleSendGift = async () => {
    if (!selectedGift) return;

    const result = await sendGift({
      receiverId,
      giftId: selectedGift.id,
      streamId,
      message: message.trim() || undefined,
    });

    if (result) {
      onClose();
      setSelectedGift(null);
      setMessage('');
      onSuccess?.();
    }
  };

  const canAfford = (gift: Gift) => {
    if (!wallet) return false;
    return wallet.balance >= gift.coinPrice;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Send Gift to {receiverName}
          </DialogTitle>
          <DialogDescription>
            Choose a gift to show your support
            {wallet && (
              <span className="block mt-1 text-sm font-medium text-amber-600">
                Your balance: {formatCoins(wallet.balance)} coins
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Gift Grid */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Select a Gift</Label>
            
            {giftsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : gifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No gifts available at the moment
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {gifts.map((gift) => {
                  const affordable = canAfford(gift);
                  const isSelected = selectedGift?.id === gift.id;

                  return (
                    <button
                      key={gift.id}
                      onClick={() => setSelectedGift(gift)}
                      disabled={!affordable || sendingGift}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${isSelected 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }
                        ${!affordable 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer hover:scale-105'
                        }
                      `}
                    >
                      {/* Gift Image */}
                      <div className="aspect-square mb-2 flex items-center justify-center">
                        <img
                          src={gift.imageUrl}
                          alt={gift.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to emoji if image fails
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.textContent = '🎁';
                          }}
                        />
                      </div>

                      {/* Gift Name */}
                      <div className="text-xs font-medium text-center mb-1 truncate">
                        {gift.name}
                      </div>

                      {/* Coin Price */}
                      <div className="flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Coins className="w-3 h-3" />
                        <span>{formatCoins(gift.coinPrice)}</span>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}

                      {/* Can't Afford Overlay */}
                      {!affordable && (
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-white bg-red-500 px-2 py-1 rounded">
                            Low Balance
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Message */}
          {selectedGift && (
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Add a Message (Optional)
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Say something nice to ${receiverName}...`}
                maxLength={200}
                rows={3}
                disabled={sendingGift}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/200
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sendingGift}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendGift}
              disabled={!selectedGift || sendingGift || !canAfford(selectedGift)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {sendingGift ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Gift
                  {selectedGift && (
                    <span className="ml-2 text-xs">
                      ({formatCoins(selectedGift.coinPrice)} coins)
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
