import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar, type FilterConfig } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FreezeUserDialog } from '@/components/users/FreezeUserDialog';
import { BanUserDialog } from '@/components/users/BanUserDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usersApi, type User } from '@/lib/api/users.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiMoreLine, RiEyeLine, RiLockLine, RiBankLine, RiChatOffLine, RiKeyLine } from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<Record<string, string>>({
    role: searchParams.get('role') || '',
    isSuspended: searchParams.get('isSuspended') || '',
  });

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [disableChatDialogOpen, setDisableChatDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list({ page, search, ...filters }),
    queryFn: () =>
      usersApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
        role: filters.role || undefined,
        isSuspended: filters.isSuspended === 'true' ? true : filters.isSuspended === 'false' ? false : undefined,
      }),
  });

  // Mutations
  const disableChatMutation = useMutation({
    mutationFn: (userId: string) => usersApi.disableChat(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Chat disabled for 24 hours');
      setDisableChatDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to disable chat');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => usersApi.resetPassword(userId),
    onSuccess: () => {
      toast.success('Password reset email sent');
      setResetPasswordDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    updateUrlParams({ search: value, page: '1' });
  };

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || '',
    }));
    setPage(1);
    updateUrlParams({ [key]: value || '', page: '1' });
  };

  const handlePaginationChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams({ page: String(newPage) });
  };

  const updateUrlParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'USER', label: 'User' },
        { value: 'CREATOR', label: 'Creator' },
        { value: 'ADMIN', label: 'Admin' },
      ],
    },
    {
      key: 'isSuspended',
      label: 'Status',
      options: [
        { value: 'false', label: 'Active' },
        { value: 'true', label: 'Suspended' },
      ],
    },
  ];

  const columns: ColumnDef<User>[] = [
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
      accessorKey: 'username',
      header: 'Username',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: 'isSuspended',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isSuspended ? 'destructive' : 'default'}>
          {row.original.isSuspended ? 'Suspended' : 'Active'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) =>
        row.original.lastLoginAt
          ? format(new Date(row.original.lastLoginAt), 'MMM d, yyyy')
          : 'Never',
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
            <DropdownMenuItem onClick={() => navigate(`/users/${row.original.id}`)}>
              <RiEyeLine className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedUser(row.original);
                setFreezeDialogOpen(true);
              }}
            >
              <RiLockLine className="mr-2 h-4 w-4" />
              Freeze Account
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setSelectedUser(row.original);
                setBanDialogOpen(true);
              }}
            >
              <RiBankLine className="mr-2 h-4 w-4" />
              Ban User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedUser(row.original);
                setDisableChatDialogOpen(true);
              }}
            >
              <RiChatOffLine className="mr-2 h-4 w-4" />
              Disable Chat
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedUser(row.original);
                setResetPasswordDialogOpen(true);
              }}
            >
              <RiKeyLine className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={handlePaginationChange}
        toolbar={
          <FilterBar
            searchPlaceholder="Search by name, email, or username..."
            filters={filterConfigs}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            activeFilters={filters}
          />
        }
      />

      {/* Dialogs */}
      <FreezeUserDialog
        user={selectedUser}
        open={freezeDialogOpen}
        onOpenChange={setFreezeDialogOpen}
      />

      <BanUserDialog user={selectedUser} open={banDialogOpen} onOpenChange={setBanDialogOpen} />

      <ConfirmDialog
        open={disableChatDialogOpen}
        onOpenChange={setDisableChatDialogOpen}
        title="Disable Chat"
        description={`Are you sure you want to disable chat for ${selectedUser?.name}? They will not be able to participate in stream chats for 24 hours.`}
        confirmText="Disable Chat"
        onConfirm={() => selectedUser && disableChatMutation.mutate(selectedUser.id)}
      />

      <ConfirmDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
        title="Reset Password"
        description={`Are you sure you want to send a password reset email to ${selectedUser?.email}?`}
        confirmText="Send Reset Email"
        onConfirm={() => selectedUser && resetPasswordMutation.mutate(selectedUser.id)}
      />
    </div>
  );
}
