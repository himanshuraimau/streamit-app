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
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  creatorName: string;
  amountCoins: number;
  amountCurrency: number;
  currency: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
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
                  <span className="text-sm">{withdrawal.creatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount (Coins):</span>
                  <span className="text-sm">
                    {withdrawal.amountCoins.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount (Currency):</span>
                  <span className="text-sm">
                    {withdrawal.currency} {withdrawal.amountCurrency.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="text-sm font-medium mb-1">Bank Details:</div>
                  <div className="text-sm space-y-1">
                    <div>Account: {withdrawal.bankDetails.accountName}</div>
                    <div>Bank: {withdrawal.bankDetails.bankName}</div>
                    <div>Number: {withdrawal.bankDetails.accountNumber}</div>
                  </div>
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
