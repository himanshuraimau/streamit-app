import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar, type FilterConfig } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { complianceApi, type AuditLogEntry } from '@/lib/api/compliance.api';
import { queryKeys } from '@/lib/queryKeys';
import { format } from 'date-fns';

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<Record<string, string>>({
    action: searchParams.get('action') || '',
    targetType: searchParams.get('targetType') || '',
    adminId: searchParams.get('adminId') || '',
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.compliance.auditLog({ page, search, ...filters }),
    queryFn: () =>
      complianceApi.getAuditLog({
        page,
        pageSize: 20,
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
        adminId: filters.adminId || undefined,
      }),
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    updateUrlParams({ search: value, page: '1' });
  };

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

  const filterConfigs: FilterConfig[] = [
    {
      key: 'action',
      label: 'Action Type',
      options: [
        { value: 'user_ban', label: 'User Ban' },
        { value: 'user_freeze', label: 'User Freeze' },
        { value: 'user_unfreeze', label: 'User Unfreeze' },
        { value: 'stream_kill', label: 'Stream Kill' },
        { value: 'content_remove', label: 'Content Remove' },
        { value: 'withdrawal_approve', label: 'Withdrawal Approve' },
        { value: 'withdrawal_reject', label: 'Withdrawal Reject' },
        { value: 'application_approve', label: 'Application Approve' },
        { value: 'application_reject', label: 'Application Reject' },
        { value: 'role_change', label: 'Role Change' },
        { value: 'settings_update', label: 'Settings Update' },
        { value: 'geo_block_create', label: 'Geo Block Create' },
      ],
    },
    {
      key: 'targetType',
      label: 'Target Type',
      options: [
        { value: 'user', label: 'User' },
        { value: 'stream', label: 'Stream' },
        { value: 'post', label: 'Post' },
        { value: 'short', label: 'Short' },
        { value: 'report', label: 'Report' },
        { value: 'withdrawal', label: 'Withdrawal' },
        { value: 'application', label: 'Application' },
      ],
    },
  ];

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), 'MMM d, yyyy HH:mm:ss')}
        </div>
      ),
    },
    {
      accessorKey: 'adminName',
      header: 'Admin',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.adminName}</div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.action.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'targetType',
      header: 'Target Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.targetType.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'targetId',
      header: 'Target ID',
      cell: ({ row }) => (
        <div className="font-mono text-xs text-muted-foreground">
          {row.original.targetId.substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: 'metadata',
      header: 'Details',
      cell: ({ row }) => {
        const metadata = row.original.metadata;
        if (!metadata || Object.keys(metadata).length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="text-sm text-muted-foreground max-w-xs truncate">
            {metadata.reason || metadata.message || JSON.stringify(metadata)}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          View all administrative actions performed on the platform
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={handlePaginationChange}
        toolbar={
          <FilterBar
            searchPlaceholder="Search audit log..."
            filters={filterConfigs}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            activeFilters={filters}
          />
        }
      />
    </div>
  );
}

export default AuditLogPage;
