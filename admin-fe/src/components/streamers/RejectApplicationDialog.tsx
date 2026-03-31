import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { streamersApi } from '@/lib/api/streamers.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { RiAlertLine } from '@remixicon/react';

const rejectApplicationSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type RejectApplicationFormData = z.infer<typeof rejectApplicationSchema>;

interface RejectApplicationDialogProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RejectApplicationDialog({
  applicationId,
  open,
  onOpenChange,
  onSuccess,
}: RejectApplicationDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RejectApplicationFormData>({
    resolver: zodResolver(rejectApplicationSchema),
    defaultValues: {
      reason: '',
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: RejectApplicationFormData) => {
      if (!applicationId) throw new Error('No application selected');
      return streamersApi.rejectApplication(applicationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.all });
      toast.success('Application rejected');
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject application');
    },
  });

  const onSubmit = async (data: RejectApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await rejectMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RiAlertLine className="h-5 w-5 text-destructive" />
            Reject Application
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this creator application. The applicant will be
            notified of your decision.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this application is being rejected..."
                      {...field}
                      rows={4}
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
