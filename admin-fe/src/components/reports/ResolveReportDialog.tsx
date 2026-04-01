import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { reportsApi } from '@/lib/api/reports.api';
import type { ResolveReportData } from '@/lib/api/reports.api';

const resolveReportSchema = z.object({
  action: z.enum(['dismiss', 'warning_sent', 'content_removed', 'user_suspended', 'user_banned']),
  notes: z.string().min(10, 'Notes must be at least 10 characters'),
});

type ResolveReportFormData = z.infer<typeof resolveReportSchema>;

interface ResolveReportDialogProps {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResolveReportDialog({
  reportId,
  open,
  onOpenChange,
}: ResolveReportDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ResolveReportFormData>({
    resolver: zodResolver(resolveReportSchema),
    defaultValues: {
      action: 'dismiss',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ResolveReportData) => reportsApi.resolve(reportId, data),
    onSuccess: () => {
      toast.success('Report resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to resolve report');
    },
  });

  const onSubmit = (data: ResolveReportFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Report</DialogTitle>
          <DialogDescription>
            Select the action taken and provide notes for the resolution
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dismiss">Dismiss - No action needed</SelectItem>
                      <SelectItem value="warning_sent">Warning Sent</SelectItem>
                      <SelectItem value="content_removed">Content Removed</SelectItem>
                      <SelectItem value="user_suspended">User Suspended</SelectItem>
                      <SelectItem value="user_banned">User Banned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the resolution and any actions taken..."
                      rows={4}
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
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Resolving...' : 'Resolve Report'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
