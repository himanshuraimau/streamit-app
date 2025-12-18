import { Coins, Sparkles, Gift } from 'lucide-react';
import type { DiscountValidationData, DiscountType } from '@/types/discount.types';
import { formatCoins, formatPrice } from '@/types/payment.types';

/**
 * AppliedDiscount Component
 * Displays the applied discount code and bonus coins breakdown
 * Requirements: 1.2
 */
interface AppliedDiscountProps {
  discount: DiscountValidationData;
  packageCoins: number;
  packageBonusCoins: number;
}

export function AppliedDiscount({
  discount,
  packageCoins,
  packageBonusCoins,
}: AppliedDiscountProps) {
  // Total coins = base package coins + package bonus + discount bonus
  const totalCoins = packageCoins + packageBonusCoins + discount.bonusCoins;

  const formatDiscountLabel = (type: DiscountType, value: number): string => {
    if (type === 'PERCENTAGE') {
      return `${value}% bonus`;
    }
    // Fixed amount is in paise
    return `${formatPrice(value)} worth`;
  };

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <Gift className="h-5 w-5" />
        <span className="font-medium">Discount Applied!</span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        {/* Base coins */}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Base coins</span>
          <span className="flex items-center gap-1">
            <Coins className="h-4 w-4 text-amber-500" />
            {formatCoins(packageCoins)}
          </span>
        </div>

        {/* Package bonus (if any) */}
        {packageBonusCoins > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Package bonus</span>
            <span className="flex items-center gap-1 text-green-600">
              <Sparkles className="h-4 w-4" />
              +{formatCoins(packageBonusCoins)}
            </span>
          </div>
        )}

        {/* Discount bonus */}
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
          <span className="flex items-center gap-1">
            <span className="font-mono text-xs bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded">
              {discount.code}
            </span>
            <span className="text-xs text-muted-foreground">
              ({formatDiscountLabel(discount.discountType, discount.discountValue)})
            </span>
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="h-4 w-4" />
            +{formatCoins(discount.bonusCoins)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-amber-200 dark:border-amber-700 my-2" />

        {/* Total */}
        <div className="flex items-center justify-between font-medium text-base">
          <span>Total coins you'll receive</span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Coins className="h-5 w-5" />
            {formatCoins(totalCoins)}
          </span>
        </div>
      </div>
    </div>
  );
}
