import { Coins, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CoinPackage } from '@/types/payment.types';
import { formatPrice, formatCoins } from '@/types/payment.types';

interface CoinPackageCardProps {
  package: CoinPackage;
  onPurchase: (packageId: string) => void;
  onSelect?: (pkg: CoinPackage) => void;
  loading?: boolean;
  isSelected?: boolean;
  discountBonusCoins?: number;
}

export function CoinPackageCard({ 
  package: pkg, 
  onPurchase, 
  onSelect,
  loading, 
  isSelected = false,
  discountBonusCoins,
}: CoinPackageCardProps) {
  const hasPackageBonus = pkg.bonusCoins > 0;
  const hasDiscountBonus = discountBonusCoins !== undefined && discountBonusCoins > 0;
  const totalCoins = pkg.coins + pkg.bonusCoins + (discountBonusCoins || 0);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(pkg);
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all ${
        pkg.isFeatured ? 'border-2 border-amber-400' : ''
      } ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:border-primary/50'
      }`}
      onClick={handleCardClick}
    >
      {pkg.isFeatured && (
        <Badge className="absolute top-2 right-2 bg-amber-500">
          Popular
        </Badge>
      )}

      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold">{pkg.name}</span>
          {(hasPackageBonus || hasDiscountBonus) && <Sparkles className="h-5 w-5 text-amber-500" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2">
            <Coins className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-3xl font-bold text-amber-600">
                {formatCoins(totalCoins)}
              </div>
              {(hasPackageBonus || hasDiscountBonus) && (
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <div>{formatCoins(pkg.coins)} base</div>
                  {hasPackageBonus && (
                    <div className="text-green-600">+{formatCoins(pkg.bonusCoins)} bonus</div>
                  )}
                  {hasDiscountBonus && (
                    <div className="text-amber-600 font-medium">
                      +{formatCoins(discountBonusCoins!)} discount bonus
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
          <div className="text-sm text-muted-foreground">
            ≈ ₹{(pkg.price / 100 / pkg.coins).toFixed(2)}/coin
          </div>
        </div>

        {pkg.description && (
          <p className="text-sm text-center text-muted-foreground">
            {pkg.description}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onPurchase(pkg.id);
          }}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Processing...' : 'Purchase'}
        </Button>
      </CardFooter>
    </Card>
  );
}
