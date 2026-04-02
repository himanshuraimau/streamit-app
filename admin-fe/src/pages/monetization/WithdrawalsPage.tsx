import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { StatCard } from '@/components/common/StatCard';
import { ApproveWithdrawalDialog } from '@/components/monetization/ApproveWithdrawalDialog';
import { RejectWithdrawalDialog } from '@/components/monetization/RejectWithdrawalDialog';
import { WithdrawalDetailSheet } from '@/components/monetization/WithdrawalDetailSheet';
import { WalletDetailSheet } from '@/components/monetization/WalletDetailSheet';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { monetizationApi, type WithdrawalEntry } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import {
  formatCoins,
  formatCurrencyAmount,
  formatDateTime,
  getWithdrawalStatusVariant,
  toEndOfDayIso,
  toStartOfDayIso,
} from '@/lib/monetization';

interface WithdrawalFilters {
  userId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const defaultFilters: WithdrawalFilters = {
  userId: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

export function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const role = useAdminAuthStore((state) => state.user?.role);
  const canManage = role === 'super_admin' || role === 'finance_admin';

  const [activeTab, setActiveTab] = useState<WithdrawalEntry['status']>('PENDING');
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalEntry | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [walletUserId, setWalletUserId] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      status: activeTab,
      userId: filters.userId || undefined,
      dateFrom: toStartOfDayIso(filters.dateFrom),
      dateTo: toEndOfDayIso(filters.dateTo),
      amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
      amountMax: filters.amountMax ? Number(filters.amountMax) : undefined,
    }),
    [activeTab, filters, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.withdrawals.list(params),
    queryFn: () => monetizationApi.getWithdrawals(params),
    refetchInterval: activeTab === 'PENDING' ? 30000 : false,
  });

  const invalidateWithdrawals = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.monetization.withdrawals._def });
  };

  const openWallet = (userId: string) => {
    setWalletUserId(userId);
    setWalletOpen(true);
  };

  const columns: ColumnDef<WithdrawalEntry>[] = [
    {
      accessorKey: 'userName',
      header: 'Creator',
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
      accessorKey: 'amountCoins',
      header: 'Coins',
      cell: ({ row }) => formatCoins(row.original.amountCoins),
    },
    {
      accessorKey: 'netAmountPaise',
      header: 'Net Payout',
      cell: ({ row }) => formatCurrencyAmount(row.original.netAmountPaise),
    },
    {
      accessorKey: 'grossAmountPaise',
      header: 'Gross',
      cell: ({ row }) => formatCurrencyAmount(row.original.grossAmountPaise),
    },
    {
      accessorKey: 'platformFeePaise',
      header: 'Fee',
      cell: ({ row }) => formatCurrencyAmount(row.original.platformFeePaise),
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      cell: ({ row }) => formatDateTime(row.original.requestedAt),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getWithdrawalStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'reviewerName',
      header: 'Reviewer',
      cell: ({ row }) => row.original.reviewerName || '—',
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
            <DropdownMenuItem onClick={() => setSelectedWithdrawal(row.original)}>
              View Details
            </DropdownMenuItem>
            {canManage && ['PENDING', 'UNDER_REVIEW'].includes(row.original.status) ? (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedWithdrawal(row.original);
                    setApproveDialogOpen(true);
                  }}
                >
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    setSelectedWithdrawal(row.original);
                    setRejectDialogOpen(true);
                  }}
                >
                  Reject
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground">
          Track payout requests, approval state, and payout references.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Matching Requests"
          value={data?.summary.totalRecords || 0}
          description={`${data?.summary.pendingCount || 0} pending`}
        />
        <StatCard
          label="Coins Requested"
          value={formatCoins(data?.summary.totalCoins || 0)}
          description={`${data?.summary.underReviewCount || 0} under review`}
        />
        <StatCard
          label="Gross Value"
          value={formatCurrencyAmount(data?.summary.totalGrossAmountPaise || 0)}
          description={`${formatCurrencyAmount(data?.summary.totalPlatformFeePaise || 0)} total fee`}
        />
        <StatCard
          label="Net Value"
          value={formatCurrencyAmount(data?.summary.totalNetAmountPaise || 0)}
          description={`${data?.summary.approvedCount || 0} approved / ${data?.summary.paidCount || 0} paid`}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setPage(1);
          setActiveTab(value as WithdrawalEntry['status']);
        }}
      >
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW">Under Review</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={data?.pagination}
            onPaginationChange={setPage}
            toolbar={
              <div className="space-y-4">
                <FilterBar
                  searchPlaceholder="Filter by user ID..."
                  onSearchChange={(value) => {
                    setPage(1);
                    setFilters((prev) => ({ ...prev, userId: value }));
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
              </div>
            }
            emptyState={{
              title: 'No withdrawal requests found',
              description: 'Try another status or widen the date and amount filters.',
            }}
          />
        </TabsContent>
      </Tabs>

      <WithdrawalDetailSheet
        withdrawal={selectedWithdrawal}
        open={!!selectedWithdrawal}
        onOpenChange={(open) => {
          if (!open) setSelectedWithdrawal(null);
        }}
        onOpenWallet={openWallet}
        canManage={canManage}
        onApprove={() => setApproveDialogOpen(true)}
        onReject={() => setRejectDialogOpen(true)}
      />

      {selectedWithdrawal ? (
        <>
          <ApproveWithdrawalDialog
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            withdrawal={selectedWithdrawal}
            onSuccess={() => {
              invalidateWithdrawals();
              setSelectedWithdrawal(null);
            }}
          />
          <RejectWithdrawalDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            withdrawal={selectedWithdrawal}
            onSuccess={() => {
              invalidateWithdrawals();
              setSelectedWithdrawal(null);
            }}
          />
        </>
      ) : null}

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

export default WithdrawalsPage;
