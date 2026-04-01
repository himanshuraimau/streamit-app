import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { monetizationApi } from '@/lib/api/monetization.api';
import type { LedgerParams } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';

interface LedgerEntry {
  id: string;
  userId: string;
  userName: string;
  packageName: string;
  coins: number;
  bonusCoins: number;
  amount: number;
  status: string;
  paymentGateway: string;
  transactionId: string;
  createdAt: string;
}

export function LedgerPage() {
  const [params, setParams] = useState<LedgerParams>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.ledger(params),
    queryFn: () => monetizationApi.getLedger(params),
  });

  const columns: ColumnDef<LedgerEntry>[] = [
    {
      accessorKey: 'userName',
      header: 'User',
    },
    {
      accessorKey: 'packageName',
      header: 'Package',
    },
    {
      accessorKey: 'coins',
      header: 'Coins',
      cell: ({ row }) => {
        const coins = row.original.coins;
        const bonus = row.original.bonusCoins;
        return (
          <div>
            <div>{coins.toLocaleString()}</div>
            {bonus > 0 && (
              <div className="text-xs text-muted-foreground">
                +{bonus.toLocaleString()} bonus
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === 'COMPLETED'
            ? 'default'
            : status === 'PENDING'
              ? 'secondary'
              : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'paymentGateway',
      header: 'Gateway',
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setParams((prev) => ({ ...prev, userId: value, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Coin Purchase Ledger</h1>
        <p className="text-muted-foreground">
          View all coin purchase transactions
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          currentPage: params.page!,
          pageSize: params.pageSize!,
          totalPages: data?.data?.pagination?.totalPages || 0,
          hasNextPage: data?.data?.pagination?.hasNextPage || false,
          hasPreviousPage: data?.data?.pagination?.hasPreviousPage || false,
        }}
        onPaginationChange={(newPage) => {
          setParams((prev) => ({
            ...prev,
            page: newPage,
          }));
        }}
        toolbar={
          <FilterBar
            searchPlaceholder="Search by user ID..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { label: 'Completed', value: 'COMPLETED' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Failed', value: 'FAILED' },
                ],
              },
              {
                key: 'paymentGateway',
                label: 'Gateway',
                options: [
                  { label: 'Stripe', value: 'stripe' },
                  { label: 'PayPal', value: 'paypal' },
                  { label: 'Razorpay', value: 'razorpay' },
                ],
              },
            ]}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
          />
        }
      />
    </div>
  );
}

export default LedgerPage;
