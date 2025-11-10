import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GiftTransaction } from '@/types/payment.types';
import { formatCoins } from '@/types/payment.types';

interface GiftAnimationProps {
  gift: GiftTransaction;
  onComplete?: () => void;
}

function SingleGiftAnimation({ gift, onComplete }: GiftAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 5000); // Show gift for 5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -50 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 rounded-lg p-4 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        {/* Gift Image */}
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={gift.gift.imageUrl}
            alt={gift.gift.name}
            className="w-full h-full object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.textContent = '🎁';
              e.currentTarget.parentElement!.style.fontSize = '3rem';
              e.currentTarget.parentElement!.style.textAlign = 'center';
            }}
          />
        </div>

        {/* Gift Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-lg truncate">
              {gift.sender.name || gift.sender.username}
            </span>
            <span className="text-white/80 text-sm">sent</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-yellow-300 font-bold text-xl">
              {gift.gift.name}
            </span>
            <span className="text-yellow-200 text-sm">
              ({formatCoins(gift.coinAmount)} coins)
            </span>
          </div>

          {gift.message && (
            <div className="mt-2 text-white/90 text-sm italic truncate">
              "{gift.message}"
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface GiftAnimationOverlayProps {
  gifts: GiftTransaction[];
  onGiftComplete?: (giftId: string) => void;
}

export function GiftAnimationOverlay({ gifts, onGiftComplete }: GiftAnimationOverlayProps) {
  const [visibleGifts, setVisibleGifts] = useState<string[]>([]);

  useEffect(() => {
    // Show new gifts
    const newGifts = gifts.filter(g => !visibleGifts.includes(g.id));
    if (newGifts.length > 0) {
      setVisibleGifts(prev => [...prev, ...newGifts.map(g => g.id)]);
    }
  }, [gifts, visibleGifts]);

  const handleGiftComplete = (giftId: string) => {
    setVisibleGifts(prev => prev.filter(id => id !== giftId));
    onGiftComplete?.(giftId);
  };

  const visibleGiftObjects = gifts.filter(g => visibleGifts.includes(g.id));

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none max-w-sm">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleGiftObjects.map((gift) => (
            <SingleGiftAnimation
              key={gift.id}
              gift={gift}
              onComplete={() => handleGiftComplete(gift.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Simple component for showing gifts in a list (for history/profile)
export function GiftDisplay({ gift }: { gift: GiftTransaction }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg">
      <img
        src={gift.gift.imageUrl}
        alt={gift.gift.name}
        className="w-10 h-10 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.textContent = '🎁';
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            {gift.gift.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatCoins(gift.coinAmount)} coins
          </span>
        </div>
        {gift.message && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            "{gift.message}"
          </p>
        )}
      </div>
    </div>
  );
}
