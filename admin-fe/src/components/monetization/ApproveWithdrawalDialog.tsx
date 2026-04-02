import { useMutation } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { monetizationApi } from '@/lib/api/monetization.api';
import { formatCoins, formatCurrencyAmount } from '@/lib/monetization';
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  userName: string;
  amountCoins: number;
  grossAmountPaise: number;
  netAmountPaise: number;
  platformFeePaise: number;
}

interface ApproveWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: Withdrawal;
  onSuccess: () => void;
}

export function ApproveWithdrawalDialog({
  open,
  onOpenChange,
  withdrawal,
  onSuccess,
}: ApproveWithdrawalDialogProps) {
  const approveMutation = useMutation({
    mutationFn: () => monetizationApi.approveWithdrawal(withdrawal.id),
    onSuccess: () => {
      toast.success('Withdrawal approved successfully');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve withdrawal');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Withdrawal Request</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to approve this withdrawal? This action
                will deduct coins from the creator's wallet and cannot be undone.
              </p>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Creator:</span>
                  <span className="text-sm">{withdrawal.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount (Coins):</span>
                  <span className="text-sm">{formatCoins(withdrawal.amountCoins)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Gross:</span>
                  <span className="text-sm">{formatCurrencyAmount(withdrawal.grossAmountPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Platform Fee:</span>
                  <span className="text-sm">
                    {formatCurrencyAmount(withdrawal.platformFeePaise)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-sm font-medium">Net Payout:</span>
                  <span className="text-sm">
                    {formatCurrencyAmount(withdrawal.netAmountPaise)}
                  </span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approveMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              approveMutation.mutate();
            }}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
