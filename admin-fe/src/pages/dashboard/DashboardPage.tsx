import { useQuery } from '@tanstack/react-query';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { analyticsApi } from '@/lib/api/analytics.api';
import { reportsApi } from '@/lib/api/reports.api';
import { streamersApi } from '@/lib/api/streamers.api';
import { usersApi } from '@/lib/api/users.api';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Radio, Flag, DollarSign, TrendingUp, AlertCircle, Video, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const { user } = useAdminAuthStore();

  // Fetch dashboard data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', '7days'],
    queryFn: () => analyticsApi.getOverview('7days'),
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'list', 1, 5],
    queryFn: () => reportsApi.list({ page: 1, pageSize: 5, status: 'PENDING' }),
  });

  const { data: liveStreams, isLoading: streamsLoading } = useQuery({
    queryKey: ['streamers', 'live'],
    queryFn: () => streamersApi.listLiveStreams(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: async () => {
      const response = await usersApi.list({ page: 1, pageSize: 1 });
      return response;
    },
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </header>

      {/* Key Metrics */}
      <section aria-label="Platform statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewLoading || usersLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatCard
                label="Total Users"
                value={formatNumber(usersData?.pagination?.totalCount || 0)}
                icon={<Users className="h-4 w-4" />}
              />
              <StatCard
                label="Active Streams"
                value={formatNumber(liveStreams?.length || 0)}
                icon={<Radio className="h-4 w-4" />}
              />
              <StatCard
                label="Pending Reports"
                value={formatNumber(reportsData?.pagination?.totalCount || 0)}
                icon={<Flag className="h-4 w-4" />}
                variant={reportsData?.pagination?.totalCount ? 'warning' : 'default'}
              />
              <StatCard
                label="Revenue (7d)"
                value={formatCurrency(overview?.totalRevenue || 0)}
                changePercentage={overview?.revenueChange}
                icon={<DollarSign className="h-4 w-4" />}
              />
            </>
          )}
        </div>
      </section>

      {/* User Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>Daily active users over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {overviewLoading ? (
            <Skeleton className="h-[250px]" />
          ) : overview?.dauTrend && overview.dauTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={overview.dauTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Active Users" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              No activity data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Live Streams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Live Streams
              </span>
              <Badge variant="secondary">{liveStreams?.length || 0}</Badge>
            </CardTitle>
            <CardDescription>Currently streaming</CardDescription>
          </CardHeader>
          <CardContent>
            {streamsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : liveStreams && liveStreams.length > 0 ? (
              <div className="space-y-3">
                {liveStreams.slice(0, 5).map((stream: any) => (
                  <div key={stream.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{stream.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{stream.userName}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{stream.currentViewers || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                No live streams
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pending Reports
              </span>
              <Badge variant="destructive">{reportsData?.pagination?.totalCount || 0}</Badge>
            </CardTitle>
            <CardDescription>Require attention</CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : reportsData?.data && reportsData.data.length > 0 ? (
              <div className="space-y-3">
                {reportsData.data.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{report.reason}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        by {report.reporterName}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {report.category}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                No pending reports
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>Users active today</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{formatNumber(overview?.dau || 0)}</p>
                {overview?.dauChange !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className={`h-4 w-4 ${overview.dauChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={overview.dauChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {overview.dauChange >= 0 ? '+' : ''}{overview.dauChange.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs yesterday</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Concurrent Viewers</CardTitle>
            <CardDescription>Watching live streams now</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{formatNumber(overview?.concurrentViewers || 0)}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  <span>Across {liveStreams?.length || 0} streams</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Viewers to gift senders</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{(overview?.conversionRate || 0).toFixed(2)}%</p>
                {overview?.conversionChange !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className={`h-4 w-4 ${overview.conversionChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={overview.conversionChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {overview.conversionChange >= 0 ? '+' : ''}{overview.conversionChange.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
