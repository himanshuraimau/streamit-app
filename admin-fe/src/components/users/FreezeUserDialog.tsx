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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { usersApi, type User } from '@/lib/api/users.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

const freezeUserSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expiresAt: z.string().optional(),
});

type FreezeUserFormData = z.infer<typeof freezeUserSchema>;

interface FreezeUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FreezeUserDialog({ user, open, onOpenChange }: FreezeUserDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FreezeUserFormData>({
    resolver: zodResolver(freezeUserSchema),
    defaultValues: {
      reason: '',
      expiresAt: '',
    },
  });

  const freezeMutation = useMutation({
    mutationFn: (data: FreezeUserFormData) => {
      if (!user) throw new Error('No user selected');
      return usersApi.freeze(user.id, {
        reason: data.reason,
        expiresAt: data.expiresAt || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User account frozen successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to freeze user account');
    },
  });

  const onSubmit = async (data: FreezeUserFormData) => {
    setIsSubmitting(true);
    try {
      await freezeMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Freeze User Account</DialogTitle>
          <DialogDescription>
            Temporarily suspend {user?.name}'s account. The user will not be able to access the
            platform until the suspension is lifted.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this account is being frozen..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for indefinite suspension
                  </p>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Freezing...' : 'Freeze Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
