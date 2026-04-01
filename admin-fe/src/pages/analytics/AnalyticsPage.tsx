import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics.api';
import type { DateRange } from '@/lib/api/analytics.api';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye, DollarSign, TrendingUp, Video, FileText, Radio } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: () => analyticsApi.getOverview(dateRange),
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics data
  });

  const { data: topStreamers, isLoading: streamersLoading } = useQuery({
    queryKey: ['analytics', 'streamers', dateRange],
    queryFn: () => analyticsApi.getTopStreamers(dateRange, 10),
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics data
  });

  const { data: topShorts, isLoading: shortsLoading } = useQuery({
    queryKey: ['analytics', 'content', 'shorts', dateRange],
    queryFn: () => analyticsApi.getTopContent(dateRange, 'shorts'),
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics data
  });

  const { data: topPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['analytics', 'content', 'posts', dateRange],
    queryFn: () => analyticsApi.getTopContent(dateRange, 'posts'),
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics data
  });

  const { data: topStreams, isLoading: streamsLoading } = useQuery({
    queryKey: ['analytics', 'content', 'streams', dateRange],
    queryFn: () => analyticsApi.getTopContent(dateRange, 'streams'),
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics data
  });

  const { data: conversionFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics', 'conversion', dateRange],
    queryFn: () => analyticsApi.getConversionFunnel(dateRange),
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics data
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Platform metrics and performance insights</p>
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

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : overview ? (
          <>
            <StatCard
              label="Daily Active Users"
              value={formatNumber(overview.dau)}
              changePercentage={overview.dauChange}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Monthly Active Users"
              value={formatNumber(overview.mau)}
              changePercentage={overview.mauChange}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Concurrent Viewers"
              value={formatNumber(overview.concurrentViewers)}
              icon={<Eye className="h-4 w-4" />}
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(overview.totalRevenue)}
              changePercentage={overview.revenueChange}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </>
        ) : null}
      </div>

      {/* DAU/MAU Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity Trend</CardTitle>
          <CardDescription>Daily and monthly active users over time</CardDescription>
        </CardHeader>
        <CardContent>
          {overviewLoading ? (
            <Skeleton className="h-[300px]" />
          ) : overview?.dauTrend && overview?.mauTrend ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={overview.dauTrend.map((dau, index) => ({
                  date: dau.date,
                  DAU: dau.value,
                  MAU: overview.mauTrend?.[index]?.value || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="DAU" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Area type="monotone" dataKey="MAU" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue per Streamer Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Streamers by Revenue</CardTitle>
          <CardDescription>Top 10 earning streamers in selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {streamersLoading ? (
            <Skeleton className="h-[300px]" />
          ) : topStreamers && topStreamers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStreamers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No streamer data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Content Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Top Shorts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Top Shorts
            </CardTitle>
            <CardDescription>By views</CardDescription>
          </CardHeader>
          <CardContent>
            {shortsLoading ? (
              <Skeleton className="h-[250px]" />
            ) : topShorts && topShorts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topShorts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="metric" fill="#8884d8" name="Views" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Top Posts
            </CardTitle>
            <CardDescription>By likes</CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <Skeleton className="h-[250px]" />
            ) : topPosts && topPosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topPosts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="metric" fill="#82ca9d" name="Likes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Streams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Top Streams
            </CardTitle>
            <CardDescription>By peak viewers</CardDescription>
          </CardHeader>
          <CardContent>
            {streamsLoading ? (
              <Skeleton className="h-[250px]" />
            ) : topStreams && topStreams.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topStreams} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="metric" fill="#ffc658" name="Peak Viewers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Viewer to gift buyer conversion metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <Skeleton className="h-[200px]" />
          ) : conversionFunnel ? (
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                label="Total Viewers"
                value={formatNumber(conversionFunnel.totalViewers)}
                icon={<Users className="h-4 w-4" />}
              />
              <StatCard
                label="Viewers Who Sent Gifts"
                value={formatNumber(conversionFunnel.viewersWhoSentGifts)}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatCard
                label="Average Gift Value"
                value={formatCurrency(conversionFunnel.averageGiftValue)}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <StatCard
                label="Conversion Rate"
                value={`${conversionFunnel.conversionPercentage.toFixed(2)}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                variant="positive"
              />
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No conversion data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
