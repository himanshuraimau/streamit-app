import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { monetizationApi, GiftParams } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';

interface GiftTransaction {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  giftName: string;
  coinAmount: number;
  quantity: number;
  streamId?: string;
  streamTitle?: string;
  createdAt: string;
}

export function GiftsPage() {
  const [params, setParams] = useState<GiftParams>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.gifts(params),
    queryFn: () => monetizationApi.getGifts(params),
  });

  const columns: ColumnDef<GiftTransaction>[] = [
    {
      accessorKey: 'senderName',
      header: 'Sender',
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver',
    },
    {
      accessorKey: 'giftName',
      header: 'Gift',
    },
    {
      accessorKey: 'coinAmount',
      header: 'Coin Amount',
      cell: ({ row }) => {
        const amount = row.original.coinAmount;
        const quantity = row.original.quantity;
        const total = amount * quantity;
        return (
          <div>
            <div>{total.toLocaleString()} coins</div>
            {quantity > 1 && (
              <div className="text-xs text-muted-foreground">
                {amount.toLocaleString()} × {quantity}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'streamTitle',
      header: 'Stream Context',
      cell: ({ row }) => {
        const title = row.original.streamTitle;
        return title ? (
          <div className="max-w-[200px] truncate">{title}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    // Search functionality can be extended if needed
    setParams((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Gift Transactions</h1>
        <p className="text-muted-foreground">
          View all virtual gift transactions on the platform
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          pageIndex: params.page! - 1,
          pageSize: params.pageSize!,
        }}
        pageCount={data?.data?.pagination?.totalPages || 0}
        onPaginationChange={(state) => {
          setParams((prev) => ({
            ...prev,
            page: state.pageIndex + 1,
            pageSize: state.pageSize,
          }));
        }}
        toolbar={
          <FilterBar
            searchPlaceholder="Filter gifts..."
            filters={[
              {
                key: 'minAmount',
                label: 'Min Amount',
                type: 'number',
              },
              {
                key: 'maxAmount',
                label: 'Max Amount',
                type: 'number',
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
