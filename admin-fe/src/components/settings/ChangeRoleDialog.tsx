import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  FormDescription,
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
import { settingsApi, type AdminUser } from '@/lib/api/settings.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { useEffect } from 'react';

const changeRoleSchema = z.object({
  role: z.enum(['super_admin', 'moderator', 'finance_admin', 'support_admin', 'compliance_officer']),
});

type ChangeRoleFormData = z.infer<typeof changeRoleSchema>;

interface ChangeRoleDialogProps {
  admin: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({ admin, open, onOpenChange }: ChangeRoleDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ChangeRoleFormData>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      role: admin?.role || 'support_admin',
    },
  });

  // Update form when admin changes
  useEffect(() => {
    if (admin) {
      form.reset({ role: admin.role });
    }
  }, [admin, form]);

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: ChangeRoleFormData['role'] }) =>
      settingsApi.updateAdminRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.admins });
      toast.success('Admin role updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update admin role');
    },
  });

  const onSubmit = (data: ChangeRoleFormData) => {
    if (!admin) return;
    changeRoleMutation.mutate({ id: admin.id, role: data.role });
  };

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Admin Role</DialogTitle>
          <DialogDescription>
            Update the role for {admin.name} ({admin.email})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="finance_admin">Finance Admin</SelectItem>
                      <SelectItem value="support_admin">Support Admin</SelectItem>
                      <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This will immediately update the admin's permissions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Changing an admin's role will immediately affect their
                access permissions. This action will be logged in the audit trail.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changeRoleMutation.isPending}>
                {changeRoleMutation.isPending ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
