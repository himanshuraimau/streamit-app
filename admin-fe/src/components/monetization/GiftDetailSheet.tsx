import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { GiftEntry } from '@/lib/api/monetization.api';
import { formatCoins, formatDateTime } from '@/lib/monetization';

interface GiftDetailSheetProps {
  gift: GiftEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenWallet: (userId: string) => void;
}

export function GiftDetailSheet({
  gift,
  open,
  onOpenChange,
  onOpenWallet,
}: GiftDetailSheetProps) {
  if (!gift) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Gift Transaction</SheetTitle>
          <SheetDescription>
            Review sender, receiver, stream context, and gift message details.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Sender</div>
              <div className="font-medium">{gift.senderName}</div>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => onOpenWallet(gift.senderId)}>
                  View Sender Wallet
                </Button>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Receiver</div>
              <div className="font-medium">{gift.receiverName}</div>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => onOpenWallet(gift.receiverId)}>
                  View Receiver Wallet
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <div className="text-muted-foreground">Gift</div>
              <div className="font-medium">{gift.giftName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Coin Amount</div>
              <div className="font-medium">{formatCoins(gift.coinAmount)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Quantity</div>
              <div className="font-medium">{gift.quantity}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Stream Context</div>
              <div className="font-medium">{gift.streamTitle || 'Direct / no stream'}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div>Created: {formatDateTime(gift.createdAt)}</div>
            <div>Stream ID: {gift.streamId || '—'}</div>
            <div>Message: {gift.message || '—'}</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
