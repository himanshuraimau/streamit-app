import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar, type FilterConfig } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApplicationDetailSheet } from '@/components/streamers/ApplicationDetailSheet';
import { streamersApi, type CreatorApplication } from '@/lib/api/streamers.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiEyeLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
  });

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.streamers.applications({ page, ...filters }),
    queryFn: () =>
      streamersApi.listApplications({
        page,
        pageSize: 20,
        status: filters.status || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => streamersApi.approveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.all });
      toast.success('Application approved successfully');
      setSheetOpen(false);
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

  const handleViewApplication = (id: string) => {
    setSelectedApplicationId(id);
    setSheetOpen(true);
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
      default:
        return 'outline';
    }
  };

  const columns: ColumnDef<CreatorApplication>[] = [
    {
      accessorKey: 'applicantName',
      header: 'Applicant',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.applicantName}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submission Date',
      cell: ({ row }) => format(new Date(row.original.submittedAt), 'MMM d, yyyy HH:mm'),
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
            onClick={() => handleViewApplication(row.original.id)}
          >
            <RiEyeLine className="mr-2 h-4 w-4" />
            View
          </Button>
          {row.original.status === 'PENDING' && (
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
                onClick={() => handleViewApplication(row.original.id)}
              >
                <RiCloseLine className="mr-2 h-4 w-4" />
                Reject
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
            onSearchChange={() => {}}
            onFilterChange={handleFilterChange}
            activeFilters={filters}
          />
        }
      />

      <ApplicationDetailSheet
        applicationId={selectedApplicationId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

export default ApplicationsPage;
