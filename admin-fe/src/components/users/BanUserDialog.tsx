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
import { usersApi, type User } from '@/lib/api/users.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { RiAlertLine } from '@remixicon/react';

const banUserSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type BanUserFormData = z.infer<typeof banUserSchema>;

interface BanUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BanUserDialog({ user, open, onOpenChange }: BanUserDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BanUserFormData>({
    resolver: zodResolver(banUserSchema),
    defaultValues: {
      reason: '',
    },
  });

  const banMutation = useMutation({
    mutationFn: (data: BanUserFormData) => {
      if (!user) throw new Error('No user selected');
      return usersApi.ban(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User permanently banned');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to ban user');
    },
  });

  const onSubmit = async (data: BanUserFormData) => {
    setIsSubmitting(true);
    try {
      await banMutation.mutateAsync(data);
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
            Ban User Permanently
          </DialogTitle>
          <DialogDescription>
            This action will permanently ban {user?.name} from the platform. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Warning</p>
          <p className="text-sm text-muted-foreground">
            The user will lose access to all platform features and will not be able to create a new
            account with the same email address.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Ban *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this user is being permanently banned..."
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
                {isSubmitting ? 'Banning...' : 'Ban User Permanently'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
