import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar, type FilterConfig } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adsApi, type AdCreative } from '@/lib/api/ads.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiMoreLine, RiEyeLine, RiEditLine, RiDeleteBinLine, RiAddLine } from '@remixicon/react';
import { format } from 'date-fns';

export function AdsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
    targetRegion: searchParams.get('targetRegion') || '',
    category: searchParams.get('category') || '',
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ads.list({ page, ...filters }),
    queryFn: () =>
      adsApi.list({
        page,
        pageSize: 20,
        status: filters.status ? (filters.status as 'active' | 'inactive') : undefined,
        targetRegion: filters.targetRegion || undefined,
        category: filters.category || undefined,
      }),
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

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'targetRegion',
      label: 'Region',
      options: [
        { value: 'US', label: 'United States' },
        { value: 'GB', label: 'United Kingdom' },
        { value: 'CA', label: 'Canada' },
        { value: 'AU', label: 'Australia' },
        { value: 'IN', label: 'India' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      options: [
        { value: 'gaming', label: 'Gaming' },
        { value: 'music', label: 'Music' },
        { value: 'sports', label: 'Sports' },
        { value: 'education', label: 'Education' },
        { value: 'entertainment', label: 'Entertainment' },
      ],
    },
  ];

  const columns: ColumnDef<AdCreative>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.title}</div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'targetRegion',
      header: 'Regions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.targetRegion.slice(0, 3).map((region) => (
            <Badge key={region} variant="outline" className="text-xs">
              {region}
            </Badge>
          ))}
          {row.original.targetRegion.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.targetRegion.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'cpm',
      header: 'CPM',
      cell: ({ row }) => `$${row.original.cpm.toFixed(2)}`,
    },
    {
      accessorKey: 'frequencyCap',
      header: 'Frequency Cap',
      cell: ({ row }) => `${row.original.frequencyCap}/day`,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <RiMoreLine className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/ads/${row.original.id}`)}>
              <RiEyeLine className="mr-2 h-4 w-4" />
              View Performance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/ads/${row.original.id}/edit`)}>
              <RiEditLine className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <RiDeleteBinLine className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advertisement Management</h1>
          <p className="text-muted-foreground">Create and manage ad campaigns</p>
        </div>
        <Button onClick={() => navigate('/ads/new')}>
          <RiAddLine className="mr-2 h-4 w-4" />
          Create Ad
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPaginationChange={handlePaginationChange}
        toolbar={
          <FilterBar
            searchPlaceholder="Search ads..."
            filters={filterConfigs}
            onSearchChange={() => {}}
            onFilterChange={handleFilterChange}
            activeFilters={filters}
          />
        }
      />
    </div>
  );
}

export default AdsPage;
