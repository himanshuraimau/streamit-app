import { format } from 'date-fns';
import { Coins, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { CoinPurchase } from '@/types/payment.types';
import {
  formatPrice,
  formatCoins,
  getPurchaseStatusColor,
  getPurchaseStatusText,
} from '@/types/payment.types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PurchaseHistoryItemProps {
  purchase: CoinPurchase;
}

export function PurchaseHistoryItem({ purchase }: PurchaseHistoryItemProps) {
  const statusColor = getPurchaseStatusColor(purchase.status);
  const statusText = getPurchaseStatusText(purchase.status);

  const getStatusIcon = () => {
    switch (purchase.status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Package Info */}
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <div className="font-semibold">{purchase.package.name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>{formatCoins(purchase.totalCoins)} coins</span>
                {purchase.bonusCoins > 0 && (
                  <span className="text-amber-600">
                    (+{formatCoins(purchase.bonusCoins)} bonus)
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(purchase.createdAt), 'PPp')}
              </div>
            </div>
          </div>

          {/* Right: Price & Status */}
          <div className="text-right">
            <div className="font-bold">{formatPrice(purchase.amount)}</div>
            <Badge className={`${statusColor} mt-1`}>{statusText}</Badge>
            {purchase.failureReason && (
              <div className="text-xs text-red-600 mt-1">
                {purchase.failureReason}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
