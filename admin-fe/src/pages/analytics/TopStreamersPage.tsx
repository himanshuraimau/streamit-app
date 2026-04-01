import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { analyticsApi } from '@/lib/api/analytics.api';
import type { DateRange, TopStreamer } from '@/lib/api/analytics.api';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, DollarSign, Eye, Clock, Gift } from 'lucide-react';

export function TopStreamersPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  const { data: streamers, isLoading } = useQuery({
    queryKey: ['analytics', 'streamers', dateRange],
    queryFn: () => analyticsApi.getTopStreamers(dateRange, 50),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const columns: ColumnDef<TopStreamer>[] = [
    {
      accessorKey: 'name',
      header: 'Streamer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">@{row.original.username}</p>
        </div>
      ),
    },
    {
      accessorKey: 'totalRevenue',
      header: 'Revenue',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatCurrency(row.original.totalRevenue)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'giftCount',
      header: 'Gifts Received',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(row.original.giftCount)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'averageViewers',
      header: 'Avg Viewers',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(row.original.averageViewers)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'streamHours',
      header: 'Stream Hours',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.streamHours.toFixed(1)}h</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Top Streamers
            </h1>
            <p className="text-muted-foreground">Highest earning streamers in selected period</p>
          </div>
        </div>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Streamers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{streamers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(streamers?.reduce((sum, s) => sum + s.totalRevenue, 0) || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gifts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(streamers?.reduce((sum, s) => sum + s.giftCount, 0) || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stream Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(streamers?.reduce((sum, s) => sum + s.streamHours, 0) || 0).toFixed(1)}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={streamers || []}
        isLoading={isLoading}
      />
    </div>
  );
}

export default TopStreamersPage;
