import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { StatCard } from '@/components/common/StatCard';
import { GiftDetailSheet } from '@/components/monetization/GiftDetailSheet';
import { WalletDetailSheet } from '@/components/monetization/WalletDetailSheet';
import { monetizationApi, type GiftEntry } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCoins, formatDateTime, toEndOfDayIso, toStartOfDayIso } from '@/lib/monetization';

interface GiftFilters {
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const defaultFilters: GiftFilters = {
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

export function GiftsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedGift, setSelectedGift] = useState<GiftEntry | null>(null);
  const [walletUserId, setWalletUserId] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      dateFrom: toStartOfDayIso(filters.dateFrom),
      dateTo: toEndOfDayIso(filters.dateTo),
      amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
      amountMax: filters.amountMax ? Number(filters.amountMax) : undefined,
    }),
    [filters, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.gifts(params),
    queryFn: () => monetizationApi.getGifts(params),
  });

  const openWallet = (userId: string) => {
    setWalletUserId(userId);
    setWalletOpen(true);
  };

  const columns: ColumnDef<GiftEntry>[] = [
    {
      accessorKey: 'senderName',
      header: 'Sender',
      cell: ({ row }) => (
        <button className="font-medium hover:underline" onClick={() => openWallet(row.original.senderId)}>
          {row.original.senderName}
        </button>
      ),
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver',
      cell: ({ row }) => (
        <button className="font-medium hover:underline" onClick={() => openWallet(row.original.receiverId)}>
          {row.original.receiverName}
        </button>
      ),
    },
    {
      accessorKey: 'giftName',
      header: 'Gift',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.giftName}</div>
          <div className="text-xs text-muted-foreground">Qty {row.original.quantity}</div>
        </div>
      ),
    },
    {
      accessorKey: 'coinAmount',
      header: 'Coins',
      cell: ({ row }) => formatCoins(row.original.coinAmount),
    },
    {
      accessorKey: 'streamTitle',
      header: 'Stream Context',
      cell: ({ row }) => row.original.streamTitle || 'Direct / no stream',
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) =>
        row.original.message ? (
          <div className="max-w-[220px] truncate">{row.original.message}</div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedGift(row.original)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gift Transactions</h1>
        <p className="text-muted-foreground">
          Review gift activity, sender and receiver wallets, and stream context.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Transactions"
          value={data?.summary.totalRecords || 0}
          description={`${data?.summary.uniqueSenders || 0} unique senders`}
        />
        <StatCard
          label="Coins Gifted"
          value={formatCoins(data?.summary.totalCoins || 0)}
          description={`${data?.summary.totalQuantity || 0} gift units`}
        />
        <StatCard
          label="Unique Receivers"
          value={data?.summary.uniqueReceivers || 0}
          description="Users who received gifts"
        />
        <StatCard
          label="Avg Coins / Txn"
          value={
            data?.summary.totalRecords
              ? formatCoins(Math.round(data.summary.totalCoins / data.summary.totalRecords))
              : 0
          }
          description="Based on current filters"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={setPage}
        toolbar={
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, dateFrom: event.target.value }));
              }}
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, dateTo: event.target.value }));
              }}
            />
            <Input
              type="number"
              placeholder="Min coins"
              value={filters.amountMin}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, amountMin: event.target.value }));
              }}
            />
            <Input
              type="number"
              placeholder="Max coins"
              value={filters.amountMax}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, amountMax: event.target.value }));
              }}
            />
          </div>
        }
        emptyState={{
          title: 'No gift transactions found',
          description: 'Try widening the date or coin filters.',
        }}
      />

      <GiftDetailSheet
        gift={selectedGift}
        open={!!selectedGift}
        onOpenChange={(open) => {
          if (!open) setSelectedGift(null);
        }}
        onOpenWallet={openWallet}
      />

      <WalletDetailSheet
        userId={walletUserId}
        open={walletOpen}
        onOpenChange={(open) => {
          setWalletOpen(open);
          if (!open) setWalletUserId(null);
        }}
      />
    </div>
  );
}

export default GiftsPage;
