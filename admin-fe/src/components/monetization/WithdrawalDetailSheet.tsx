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
import type { WithdrawalEntry } from '@/lib/api/monetization.api';
import {
  formatCoins,
  formatCurrencyAmount,
  formatDateTime,
  getWithdrawalStatusVariant,
} from '@/lib/monetization';

interface WithdrawalDetailSheetProps {
  withdrawal: WithdrawalEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenWallet: (userId: string) => void;
  canManage: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function WithdrawalDetailSheet({
  withdrawal,
  open,
  onOpenChange,
  onOpenWallet,
  canManage,
  onApprove,
  onReject,
}: WithdrawalDetailSheetProps) {
  if (!withdrawal) return null;

  const canAct = canManage && ['PENDING', 'UNDER_REVIEW'].includes(withdrawal.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Withdrawal Details</SheetTitle>
          <SheetDescription>
            Review payout amounts, approval state, and payout metadata.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{withdrawal.userName}</div>
              <div className="text-sm text-muted-foreground">{withdrawal.userEmail}</div>
            </div>
            <Badge variant={getWithdrawalStatusVariant(withdrawal.status)}>
              {withdrawal.status}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onOpenWallet(withdrawal.userId)}>
              View Wallet
            </Button>
            {canAct ? (
              <>
                <Button onClick={onApprove}>Approve</Button>
                <Button variant="destructive" onClick={onReject}>
                  Reject
                </Button>
              </>
            ) : null}
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Requested Coins</div>
              <div className="font-medium">{formatCoins(withdrawal.amountCoins)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Coin to Paise Rate</div>
              <div className="font-medium">{withdrawal.coinToPaiseRate}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Gross Amount</div>
              <div className="font-medium">
                {formatCurrencyAmount(withdrawal.grossAmountPaise)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Platform Fee</div>
              <div className="font-medium">
                {formatCurrencyAmount(withdrawal.platformFeePaise)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Net Payout</div>
              <div className="font-medium">
                {formatCurrencyAmount(withdrawal.netAmountPaise)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payout Reference</div>
              <div className="font-medium">{withdrawal.payoutReference || '—'}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div>Requested: {formatDateTime(withdrawal.requestedAt)}</div>
            <div>Reviewed: {formatDateTime(withdrawal.reviewedAt)}</div>
            <div>Approved: {formatDateTime(withdrawal.approvedAt)}</div>
            <div>Rejected: {formatDateTime(withdrawal.rejectedAt)}</div>
            <div>Paid: {formatDateTime(withdrawal.paidAt)}</div>
            <div>Reviewer: {withdrawal.reviewerName || '—'}</div>
            <div>Reason: {withdrawal.reason || '—'}</div>
          </div>

          {withdrawal.metadata ? (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Metadata</div>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(withdrawal.metadata, null, 2)}
                </pre>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
