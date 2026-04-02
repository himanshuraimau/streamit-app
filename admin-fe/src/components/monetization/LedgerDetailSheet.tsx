import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { LedgerEntry } from '@/lib/api/monetization.api';
import {
  formatCoins,
  formatCurrencyAmount,
  formatDateTime,
  getPurchaseStatusVariant,
  prettifyGateway,
} from '@/lib/monetization';

interface LedgerDetailSheetProps {
  entry: LedgerEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenWallet: (userId: string) => void;
}

export function LedgerDetailSheet({
  entry,
  open,
  onOpenChange,
  onOpenWallet,
}: LedgerDetailSheetProps) {
  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Purchase Details</SheetTitle>
          <SheetDescription>
            Inspect payment, coin allocation, and discount context for this order.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{entry.userName}</div>
              <div className="text-sm text-muted-foreground">{entry.userEmail}</div>
            </div>
            <Badge variant={getPurchaseStatusVariant(entry.status)}>{entry.status}</Badge>
          </div>

          <Button variant="outline" onClick={() => onOpenWallet(entry.userId)}>
            View Wallet
          </Button>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Package</div>
              <div className="font-medium">{entry.packageName}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-medium">
                {formatCurrencyAmount(entry.amount, entry.currency)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Base Coins</div>
              <div className="font-medium">{formatCoins(entry.coins)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Bonus Coins</div>
              <div className="font-medium">
                {formatCoins(entry.bonusCoins + entry.discountBonusCoins)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Coins</div>
              <div className="font-medium">{formatCoins(entry.totalCoins)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Gateway</div>
              <div className="font-medium">{prettifyGateway(entry.paymentGateway)}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div>Order ID: {entry.orderId}</div>
            <div>Transaction ID: {entry.transactionId || '—'}</div>
            <div>Created: {formatDateTime(entry.createdAt)}</div>
            <div>Updated: {formatDateTime(entry.updatedAt)}</div>
            {entry.discountCode ? (
              <div>
                Discount: {entry.discountCode.code} ({entry.discountCode.codeType})
              </div>
            ) : (
              <div>Discount: —</div>
            )}
            {entry.failureReason ? <div>Failure Reason: {entry.failureReason}</div> : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
