import { Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CoinPackage } from '@/types/payment.types';
import { formatPrice, formatCoins } from '@/types/payment.types';

interface CoinPackageCardProps {
  package: CoinPackage;
  onPurchase: (packageId: string) => void;
  loading?: boolean;
}

export function CoinPackageCard({ package: pkg, onPurchase, loading }: CoinPackageCardProps) {
  const totalCoins = pkg.coins + pkg.bonusCoins;
  const hasBonus = pkg.bonusCoins > 0;

  return (
    <Card className={`relative overflow-hidden ${pkg.isFeatured ? 'border-2 border-amber-400' : ''}`}>
      {pkg.isFeatured && (
        <Badge className="absolute top-2 right-2 bg-amber-500">
          Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold">{pkg.name}</span>
          {hasBonus && <Sparkles className="h-5 w-5 text-amber-500" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Coin Display */}
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2">
            <Coins className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-3xl font-bold text-amber-600">
                {formatCoins(totalCoins)}
              </div>
              {hasBonus && (
                <div className="text-sm text-muted-foreground">
                  {formatCoins(pkg.coins)} + {formatCoins(pkg.bonusCoins)} bonus
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-center">
          <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
          <div className="text-sm text-muted-foreground">
            ≈ ₹{(pkg.price / 100 / pkg.coins).toFixed(2)}/coin
          </div>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-sm text-center text-muted-foreground">
            {pkg.description}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onPurchase(pkg.id)}
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
