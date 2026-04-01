import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { analyticsApi } from '@/lib/api/analytics.api';
import type { DateRange, TopContent } from '@/lib/api/analytics.api';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Video, Eye, Heart, Share2 } from 'lucide-react';

export function TopShortsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  const { data: shorts, isLoading } = useQuery({
    queryKey: ['analytics', 'content', 'shorts', dateRange],
    queryFn: () => analyticsApi.getTopContent(dateRange, 'shorts'),
  });

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const columns: ColumnDef<TopContent>[] = [
    {
      accessorKey: 'title',
      header: 'Short',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{row.original.title}</p>
          <p className="text-sm text-muted-foreground truncate">by {row.original.authorName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'views',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(row.original.views)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'likes',
      header: 'Likes',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(row.original.likes)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'engagement',
      header: 'Engagement',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {formatNumber(row.original.engagement)}
        </Badge>
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
              <Video className="h-6 w-6" />
              Top Shorts
            </h1>
            <p className="text-muted-foreground">Most viewed shorts in selected period</p>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Shorts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{shorts?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(shorts?.reduce((sum, s) => sum + s.views, 0) || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(shorts?.reduce((sum, s) => sum + s.engagement, 0) || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={shorts || []}
        isLoading={isLoading}
      />
    </div>
  );
}

export default TopShortsPage;
