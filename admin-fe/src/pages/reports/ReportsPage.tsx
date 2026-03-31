import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reportsApi, Report } from '@/lib/api/reports.api';
import { Eye } from 'lucide-react';

export function ReportsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page, pageSize, search, statusFilter, categoryFilter],
    queryFn: () =>
      reportsApi.list({
        page,
        pageSize,
        status: statusFilter as any,
        reasonCategory: categoryFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    refetchInterval: (query) => {
      // Only auto-refresh if there are pending reports
      const hasPending = query.state.data?.data?.some(
        (report: Report) => report.status === 'PENDING'
      );
      return hasPending ? 30000 : false;
    },
  });

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'UNDER_REVIEW':
        return 'secondary';
      case 'RESOLVED':
        return 'outline';
      case 'DISMISSED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: 'reporterName',
      header: 'Reporter',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.reporterName}</p>
          <p className="text-xs text-muted-foreground">@{row.original.reporterUsername}</p>
        </div>
      ),
    },
    {
      accessorKey: 'reportedUserName',
      header: 'Target',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.reportedUserName}</p>
          <p className="text-xs text-muted-foreground">@{row.original.reportedUserUsername}</p>
        </div>
      ),
    },
    {
      accessorKey: 'reasonCategory',
      header: 'Category',
      cell: ({ row }) => <Badge variant="outline">{row.original.reasonCategory}</Badge>,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={getPriorityVariant(row.original.priority)}>
          {row.original.priority.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'reportCount',
      header: 'Reports',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.reportCount}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/reports/${row.original.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Complaints</h1>
        <p className="text-muted-foreground">
          Review and resolve user reports
        </p>
      </div>

      <FilterBar
        searchPlaceholder="Search by reporter or target..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'All', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Under Review', value: 'UNDER_REVIEW' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Dismissed', value: 'DISMISSED' },
            ],
            value: statusFilter,
          },
          {
            key: 'category',
            label: 'Category',
            options: [
              { label: 'All', value: '' },
              { label: 'Harassment', value: 'harassment' },
              { label: 'Spam', value: 'spam' },
              { label: 'Inappropriate Content', value: 'inappropriate' },
              { label: 'Copyright', value: 'copyright' },
              { label: 'Other', value: 'other' },
            ],
            value: categoryFilter,
          },
        ]}
        onSearchChange={setSearch}
        onFilterChange={(key, value) => {
          if (key === 'status') setStatusFilter(value);
          if (key === 'category') setCategoryFilter(value);
        }}
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={{
          pageIndex: page - 1,
          pageSize,
        }}
        onPaginationChange={(updater) => {
          const newState = typeof updater === 'function' 
            ? updater({ pageIndex: page - 1, pageSize })
            : updater;
          setPage(newState.pageIndex + 1);
        }}
        pageCount={data?.pagination?.totalPages || 0}
      />
    </div>
  );
}
