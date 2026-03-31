import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { monetizationApi } from '@/lib/api/monetization.api';
import { toast } from 'sonner';

const rejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

interface Withdrawal {
  id: string;
  creatorName: string;
  amountCoins: number;
  amountCurrency: number;
  currency: string;
}

interface RejectWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: Withdrawal;
  onSuccess: () => void;
}

export function RejectWithdrawalDialog({
  open,
  onOpenChange,
  withdrawal,
  onSuccess,
}: RejectWithdrawalDialogProps) {
  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: '',
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: RejectFormData) =>
      monetizationApi.rejectWithdrawal(withdrawal.id, data),
    onSuccess: () => {
      toast.success('Withdrawal rejected successfully');
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject withdrawal');
    },
  });

  const onSubmit = (data: RejectFormData) => {
    rejectMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Withdrawal Request</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this withdrawal request from{' '}
            {withdrawal.creatorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4 space-y-2 my-4">
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
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for rejection..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
