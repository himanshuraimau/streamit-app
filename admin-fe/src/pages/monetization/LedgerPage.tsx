import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { StatCard } from '@/components/common/StatCard';
import { WalletDetailSheet } from '@/components/monetization/WalletDetailSheet';
import { LedgerDetailSheet } from '@/components/monetization/LedgerDetailSheet';
import { monetizationApi, type LedgerEntry } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import {
  formatCoins,
  formatCurrencyAmount,
  getPurchaseStatusVariant,
  prettifyGateway,
  toEndOfDayIso,
  toStartOfDayIso,
} from '@/lib/monetization';

interface LedgerFilterState {
  userId: string;
  status: string;
  paymentGateway: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const defaultFilters: LedgerFilterState = {
  userId: '',
  status: '',
  paymentGateway: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

export function LedgerPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LedgerFilterState>(defaultFilters);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [walletUserId, setWalletUserId] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      userId: filters.userId || undefined,
      status: filters.status || undefined,
      paymentGateway: filters.paymentGateway || undefined,
      dateFrom: toStartOfDayIso(filters.dateFrom),
      dateTo: toEndOfDayIso(filters.dateTo),
      amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
      amountMax: filters.amountMax ? Number(filters.amountMax) : undefined,
    }),
    [filters, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.ledger(params),
    queryFn: () => monetizationApi.getLedger(params),
  });

  const openWallet = (userId: string) => {
    setWalletUserId(userId);
    setWalletOpen(true);
  };

  const columns: ColumnDef<LedgerEntry>[] = [
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.userName}</div>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => openWallet(row.original.userId)}
          >
            {row.original.userEmail}
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'packageName',
      header: 'Package',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.packageName}</div>
          <div className="text-xs text-muted-foreground">{row.original.orderId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'totalCoins',
      header: 'Coins',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{formatCoins(row.original.totalCoins)}</div>
          <div className="text-xs text-muted-foreground">
            Base {formatCoins(row.original.coins)}
            {row.original.bonusCoins > 0 ? ` • Bonus ${formatCoins(row.original.bonusCoins)}` : ''}
            {row.original.discountBonusCoins > 0
              ? ` • Discount ${formatCoins(row.original.discountBonusCoins)}`
              : ''}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => formatCurrencyAmount(row.original.amount, row.original.currency),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getPurchaseStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'paymentGateway',
      header: 'Gateway',
      cell: ({ row }) => prettifyGateway(row.original.paymentGateway),
    },
    {
      accessorKey: 'discountCode',
      header: 'Discount',
      cell: ({ row }) =>
        row.original.discountCode ? (
          <div className="text-sm">
            <div className="font-medium">{row.original.discountCode.code}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.discountCode.codeType}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(row.original)}>
          View
        </Button>
      ),
    },
  ];

  const toolbar = (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Filter by user ID..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Failed', value: 'FAILED' },
              { label: 'Refunded', value: 'REFUNDED' },
            ],
          },
          {
            key: 'paymentGateway',
            label: 'Gateway',
            options: [
              { label: 'Dodo', value: 'dodo' },
              { label: 'Stripe', value: 'stripe' },
              { label: 'PayPal', value: 'paypal' },
              { label: 'Razorpay', value: 'razorpay' },
            ],
          },
        ]}
        activeFilters={{
          status: filters.status,
          paymentGateway: filters.paymentGateway,
        }}
        onSearchChange={(value) => {
          setPage(1);
          setFilters((prev) => ({ ...prev, userId: value }));
        }}
        onFilterChange={(key, value) => {
          setPage(1);
          setFilters((prev) => ({ ...prev, [key]: value || '' }));
        }}
      />

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
          placeholder="Min amount (paise)"
          value={filters.amountMin}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, amountMin: event.target.value }));
          }}
        />
        <Input
          type="number"
          placeholder="Max amount (paise)"
          value={filters.amountMax}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, amountMax: event.target.value }));
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coin Purchase Ledger</h1>
        <p className="text-muted-foreground">
          Review purchases, discounts, and gateway activity with wallet drill-ins.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrencyAmount(
            data?.summary.totalAmount || 0,
            data?.summary.currency || 'INR'
          )}
          description={`${data?.summary.totalRecords || 0} matching purchases`}
        />
        <StatCard
          label="Completed"
          value={data?.summary.completedCount || 0}
          description={`${data?.summary.pendingCount || 0} pending`}
        />
        <StatCard
          label="Coins Sold"
          value={formatCoins(data?.summary.totalCoins || 0)}
          description={`${formatCoins(data?.summary.totalBonusCoins || 0)} bonus coins`}
        />
        <StatCard
          label="Discount Bonus"
          value={formatCoins(data?.summary.totalDiscountBonusCoins || 0)}
          description={`${data?.summary.failedCount || 0} failed / ${data?.summary.refundedCount || 0} refunded`}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={setPage}
        toolbar={toolbar}
        emptyState={{
          title: 'No ledger entries found',
          description: 'Try adjusting the date, amount, or gateway filters.',
        }}
      />

      <LedgerDetailSheet
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
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

export default LedgerPage;
