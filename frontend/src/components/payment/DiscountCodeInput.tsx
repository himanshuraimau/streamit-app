import { useState } from 'react';
import { Loader2, Tag, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { discountApi } from '@/lib/api/discount';
import type { DiscountValidationData } from '@/types/discount.types';
import { formatCoins } from '@/types/payment.types';

/**
 * DiscountCodeInput Component
 * Allows users to enter and validate discount codes
 * Requirements: 1.1, 1.3
 */
interface DiscountCodeInputProps {
  packageId: string;
  onDiscountApplied: (discount: DiscountValidationData | null) => void;
  disabled?: boolean;
}

export function DiscountCodeInput({
  packageId,
  onDiscountApplied,
  disabled = false,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidationData | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await discountApi.validateCode(code.trim().toUpperCase(), packageId);

    setLoading(false);

    if (result.success && result.data) {
      setAppliedDiscount(result.data);
      onDiscountApplied(result.data);
      setError(null);
    } else {
      setError(result.error || 'Invalid discount code');
      setAppliedDiscount(null);
      onDiscountApplied(null);
    }
  };

  const handleClear = () => {
    setCode('');
    setError(null);
    setAppliedDiscount(null);
    onDiscountApplied(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && !disabled) {
      handleValidate();
    }
  };

  // Show applied discount state
  if (appliedDiscount) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">
                {appliedDiscount.code}
              </span>
              <span className="text-sm text-green-600 dark:text-green-500 ml-2">
                +{formatCoins(appliedDiscount.bonusCoins)} bonus coins
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter discount code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading || disabled}
            className="pl-9 uppercase"
          />
        </div>
        <Button
          onClick={handleValidate}
          disabled={loading || disabled || !code.trim()}
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
