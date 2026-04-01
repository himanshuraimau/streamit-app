import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateAdminDialog } from '@/components/settings/CreateAdminDialog';
import { ChangeRoleDialog } from '@/components/settings/ChangeRoleDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { settingsApi, type AdminUser } from '@/lib/api/settings.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiMoreLine, RiUserSettingsLine, RiDeleteBinLine, RiAddLine } from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  moderator: 'Moderator',
  finance_admin: 'Finance Admin',
  support_admin: 'Support Admin',
  compliance_officer: 'Compliance Officer',
};

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  super_admin: 'destructive',
  moderator: 'default',
  finance_admin: 'secondary',
  support_admin: 'outline',
  compliance_officer: 'default',
};

export function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: queryKeys.settings.admins,
    queryFn: () => settingsApi.listAdmins(),
    staleTime: 1000 * 60 * 5, // 5 minutes for admin list
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.admins });
      toast.success('Admin deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete admin');
    },
  });

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={ROLE_VARIANTS[row.original.role] || 'default'}>
          {ROLE_LABELS[row.original.role] || row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <RiMoreLine className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedAdmin(row.original);
                setChangeRoleDialogOpen(true);
              }}
            >
              <RiUserSettingsLine className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setSelectedAdmin(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              <RiDeleteBinLine className="mr-2 h-4 w-4" />
              Delete Admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Roles</h1>
          <p className="text-muted-foreground">
            Manage administrator accounts and permissions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <RiAddLine className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={admins || []}
        isLoading={isLoading}
      />

      <CreateAdminDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ChangeRoleDialog
        admin={selectedAdmin}
        open={changeRoleDialogOpen}
        onOpenChange={setChangeRoleDialogOpen}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Admin"
        description={`Are you sure you want to delete ${selectedAdmin?.name}? This action cannot be undone and will revoke all admin access.`}
        confirmText="Delete Admin"
        variant="destructive"
        onConfirm={() => selectedAdmin && deleteAdminMutation.mutate(selectedAdmin.id)}
      />
    </div>
  );
}

export default AdminRolesPage;
