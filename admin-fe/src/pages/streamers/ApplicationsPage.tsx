import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar, type FilterConfig } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { streamersApi, type CreatorApplication } from '@/lib/api/streamers.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiEyeLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  });

  const canReview = user?.role === 'super_admin' || user?.role === 'moderator';

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.streamers.applications({ page, ...filters }),
    queryFn: () =>
      streamersApi.listApplications({
        page,
        pageSize: 20,
        search: filters.search || undefined,
        status: filters.status || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => streamersApi.approveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.all });
      toast.success('Application approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve application');
    },
  });

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || '',
    }));
    setPage(1);
    updateUrlParams({ [key]: value || '', page: '1' });
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
    setPage(1);
    updateUrlParams({ search: value, page: '1' });
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

  const handleOpenApplication = (id: string) => {
    navigate(`/streamers/applications/${id}`);
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'UNDER_REVIEW', label: 'Under Review' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
      ],
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'UNDER_REVIEW':
        return 'secondary';
      case 'DRAFT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatSubmissionDate = (submittedAt: string | null) => {
    if (!submittedAt) {
      return 'Not submitted';
    }

    const submittedDate = new Date(submittedAt);
    if (Number.isNaN(submittedDate.getTime())) {
      return 'Invalid date';
    }

    return format(submittedDate, 'MMM d, yyyy HH:mm');
  };

  const columns: ColumnDef<CreatorApplication>[] = [
    {
      accessorKey: 'userName',
      header: 'Applicant',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.userName}</div>
          <div className="text-sm text-muted-foreground">{row.original.userEmail}</div>
          <div className="text-xs text-muted-foreground">@{row.original.userUsername}</div>
        </div>
      ),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submission Date',
      cell: ({ row }) => formatSubmissionDate(row.original.submittedAt),
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenApplication(row.original.id)}
          >
            <RiEyeLine className="mr-2 h-4 w-4" />
            View Details
          </Button>
          {canReview && row.original.status === 'PENDING' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => approveMutation.mutate(row.original.id)}
              >
                <RiCheckLine className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenApplication(row.original.id)}
              >
                <RiCloseLine className="mr-2 h-4 w-4" />
                Review
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Creator Applications</h1>
        <p className="text-muted-foreground">Review and manage creator application requests</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={handlePaginationChange}
        toolbar={
          <FilterBar
            searchPlaceholder="Search applications..."
            filters={filterConfigs}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            activeFilters={{ status: filters.status }}
          />
        }
      />
    </div>
  );
}

export default ApplicationsPage;
