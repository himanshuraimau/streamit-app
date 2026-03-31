import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adsApi } from '@/lib/api/ads.api';
import { queryKeys } from '@/lib/queryKeys';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface AdPerformanceChartProps {
  adId: string;
}

export function AdPerformanceChart({ adId }: AdPerformanceChartProps) {
  const { data: performance, isLoading } = useQuery({
    queryKey: queryKeys.ads.performance(adId),
    queryFn: () => adsApi.getPerformance(adId),
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: 'Impressions',
      value: performance.impressions.toLocaleString(),
      description: 'Total ad views',
    },
    {
      title: 'Clicks',
      value: performance.clicks.toLocaleString(),
      description: 'Total ad clicks',
    },
    {
      title: 'CTR',
      value: `${performance.ctr.toFixed(2)}%`,
      description: 'Click-through rate',
    },
    {
      title: 'Total Spend',
      value: `$${performance.totalSpend.toFixed(2)}`,
      description: 'Total campaign cost',
    },
    {
      title: 'Average CPM',
      value: `$${performance.averageCpm.toFixed(2)}`,
      description: 'Cost per thousand impressions',
    },
  ];

  // Sample data for charts (in real implementation, this would come from API)
  const impressionData = [
    { date: 'Mon', impressions: Math.floor(performance.impressions * 0.12) },
    { date: 'Tue', impressions: Math.floor(performance.impressions * 0.15) },
    { date: 'Wed', impressions: Math.floor(performance.impressions * 0.18) },
    { date: 'Thu', impressions: Math.floor(performance.impressions * 0.14) },
    { date: 'Fri', impressions: Math.floor(performance.impressions * 0.16) },
    { date: 'Sat', impressions: Math.floor(performance.impressions * 0.13) },
    { date: 'Sun', impressions: Math.floor(performance.impressions * 0.12) },
  ];

  const clickData = [
    { date: 'Mon', clicks: Math.floor(performance.clicks * 0.11) },
    { date: 'Tue', clicks: Math.floor(performance.clicks * 0.14) },
    { date: 'Wed', clicks: Math.floor(performance.clicks * 0.17) },
    { date: 'Thu', clicks: Math.floor(performance.clicks * 0.15) },
    { date: 'Fri', clicks: Math.floor(performance.clicks * 0.18) },
    { date: 'Sat', clicks: Math.floor(performance.clicks * 0.13) },
    { date: 'Sun', clicks: Math.floor(performance.clicks * 0.12) },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Impressions Over Time</CardTitle>
            <CardDescription>Daily impression count for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={impressionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="impressions" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clicks Over Time</CardTitle>
            <CardDescription>Daily click count for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clickData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
