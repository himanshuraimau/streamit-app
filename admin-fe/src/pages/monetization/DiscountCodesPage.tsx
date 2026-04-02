import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { monetizationApi, type DiscountCode } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrencyAmount, formatDateTime, getDiscountStatusVariant } from '@/lib/monetization';
import { toast } from 'sonner';

export function DiscountCodesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'MAXED_OUT'>('');
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);

  const params = {
    page,
    pageSize: 20,
    search: search || undefined,
    status: status || undefined,
  } as const;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.discounts.list(params),
    queryFn: () => monetizationApi.getDiscountCodes(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => monetizationApi.deleteDiscountCode(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monetization.discounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monetization.overview() });
      toast.success(
        result.mode === 'archived'
          ? 'Discount code archived because it has usage history.'
          : 'Discount code deleted successfully.'
      );
      setSelectedCode(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete discount code');
    },
  });

  const columns: ColumnDef<DiscountCode>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.code}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.description || 'No description'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'discountValue',
      header: 'Value',
      cell: ({ row }) =>
        row.original.discountType === 'PERCENTAGE'
          ? `${row.original.discountValue}%`
          : formatCurrencyAmount(row.original.discountValue),
    },
    {
      accessorKey: 'currentRedemptions',
      header: 'Usage',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.currentRedemptions}
            {row.original.maxRedemptions !== null ? ` / ${row.original.maxRedemptions}` : ' / ∞'}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.usagePercentage !== null
              ? `${row.original.usagePercentage}% used`
              : 'Unlimited redemptions'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'derivedStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getDiscountStatusVariant(row.original.derivedStatus)}>
          {row.original.derivedStatus}
        </Badge>
      ),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Validity',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.expiresAt ? formatDateTime(row.original.expiresAt) : 'No expiry'}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.isOneTimeUse ? 'One-time per user' : 'Reusable'}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/monetization/discounts/${row.original.id}/edit`)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setSelectedCode(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discount Codes</h1>
          <p className="text-muted-foreground">
            Create and manage promotional discount codes for coin purchases.
          </p>
        </div>
        <Button onClick={() => navigate('/monetization/discounts/new')}>Create Discount Code</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Codes"
          value={data?.summary.totalRecords || 0}
          description={`${data?.summary.activeCount || 0} currently active`}
        />
        <StatCard
          label="Redemptions"
          value={data?.summary.totalRedemptions || 0}
          description={`${data?.summary.maxedOutCount || 0} maxed out`}
        />
        <StatCard
          label="Inactive"
          value={data?.summary.inactiveCount || 0}
          description={`${data?.summary.expiredCount || 0} expired`}
        />
        <StatCard
          label="Search Scope"
          value={search ? 'Filtered' : 'All'}
          description={status ? `Status: ${status}` : 'All statuses'}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={setPage}
        toolbar={
          <FilterBar
            searchPlaceholder="Search code or description..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Inactive', value: 'INACTIVE' },
                  { label: 'Expired', value: 'EXPIRED' },
                  { label: 'Maxed Out', value: 'MAXED_OUT' },
                ],
              },
            ]}
            activeFilters={{ status }}
            onSearchChange={(value) => {
              setPage(1);
              setSearch(value);
            }}
            onFilterChange={(key, value) => {
              if (key === 'status') {
                setPage(1);
                setStatus((value as '' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'MAXED_OUT') || '');
              }
            }}
          />
        }
        emptyState={{
          title: 'No discount codes found',
          description: 'Try another search term or create a new promotional code.',
          action: {
            label: 'Create Discount Code',
            onClick: () => navigate('/monetization/discounts/new'),
          },
        }}
      />

      <ConfirmDialog
        open={!!selectedCode}
        onOpenChange={(open) => {
          if (!open) setSelectedCode(null);
        }}
        title="Delete Discount Code"
        description={
          selectedCode
            ? selectedCode.currentRedemptions > 0 || selectedCode.hasPurchaseReferences
              ? 'This code already has purchase or redemption history. Deleting it will archive and deactivate it instead.'
              : 'This code has no usage history and will be permanently deleted.'
            : ''
        }
        confirmText={deleteMutation.isPending ? 'Working...' : 'Delete'}
        variant="destructive"
        onConfirm={() => {
          if (selectedCode) {
            deleteMutation.mutate(selectedCode.id);
          }
        }}
      />
    </div>
  );
}

export default DiscountCodesPage;
