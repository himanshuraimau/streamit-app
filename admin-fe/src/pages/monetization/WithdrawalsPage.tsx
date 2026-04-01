import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { monetizationApi } from '@/lib/api/monetization.api';
import type { WithdrawalParams } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import { ApproveWithdrawalDialog } from '@/components/monetization/ApproveWithdrawalDialog';
import { RejectWithdrawalDialog } from '@/components/monetization/RejectWithdrawalDialog';

interface Withdrawal {
  id: string;
  creatorId: string;
  creatorName: string;
  amountCoins: number;
  amountCurrency: number;
  currency: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  status: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export function WithdrawalsPage() {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const [params, setParams] = useState<WithdrawalParams>({
    page: 1,
    pageSize: 20,
    status: 'PENDING',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.withdrawals.list(params),
    queryFn: () => monetizationApi.getWithdrawals(params),
    refetchInterval: params.status === 'PENDING' ? 30000 : false,
    staleTime: params.status === 'PENDING' ? 1000 * 30 : 1000 * 60 * 5, // 30s for pending, 5min for others
  });

  const columns: ColumnDef<Withdrawal>[] = [
    {
      accessorKey: 'creatorName',
      header: 'Creator',
    },
    {
      accessorKey: 'amountCoins',
      header: 'Amount (Coins)',
      cell: ({ row }) => row.original.amountCoins.toLocaleString(),
    },
    {
      accessorKey: 'amountCurrency',
      header: 'Amount (Currency)',
      cell: ({ row }) =>
        `${row.original.currency} ${row.original.amountCurrency.toFixed(2)}`,
    },
    {
      accessorKey: 'bankDetails',
      header: 'Bank Details',
      cell: ({ row }) => {
        const bank = row.original.bankDetails;
        return (
          <div className="text-sm">
            <div>{bank.accountName}</div>
            <div className="text-muted-foreground">
              {bank.bankName} - {bank.accountNumber}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'requestedAt',
      header: 'Request Date',
      cell: ({ row }) => new Date(row.original.requestedAt).toLocaleString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === 'APPROVED'
            ? 'default'
            : status === 'PENDING'
              ? 'secondary'
              : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const withdrawal = row.original;
        if (withdrawal.status !== 'PENDING') return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedWithdrawal(withdrawal);
                  setApproveDialogOpen(true);
                }}
              >
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedWithdrawal(withdrawal);
                  setRejectDialogOpen(true);
                }}
                className="text-destructive"
              >
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setParams((prev) => ({ ...prev, status: value, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground">
          Manage creator withdrawal requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
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
          />
        </TabsContent>
      </Tabs>

      {selectedWithdrawal && (
        <>
          <ApproveWithdrawalDialog
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            withdrawal={selectedWithdrawal}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: queryKeys.monetization.withdrawals._def,
              });
              setSelectedWithdrawal(null);
            }}
          />
          <RejectWithdrawalDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            withdrawal={selectedWithdrawal}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: queryKeys.monetization.withdrawals._def,
              });
              setSelectedWithdrawal(null);
            }}
          />
        </>
      )}
    </div>
  );
}

export default WithdrawalsPage;
