import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  icon?: React.ReactNode;
  description?: string;
}

export function StatCard({
  label,
  value,
  changePercentage,
  trend,
  variant = 'default',
  icon,
  description,
}: StatCardProps) {
  // Auto-determine trend from changePercentage if not provided
  const determinedTrend = trend || (
    changePercentage === undefined ? 'neutral' :
    changePercentage > 0 ? 'up' :
    changePercentage < 0 ? 'down' :
    'neutral'
  );

  // Auto-determine variant from trend if not explicitly set
  const determinedVariant = variant === 'default' ? (
    determinedTrend === 'up' ? 'positive' :
    determinedTrend === 'down' ? 'negative' :
    'default'
  ) : variant;

  const TrendIcon = determinedTrend === 'up' ? ArrowUp : 
                    determinedTrend === 'down' ? ArrowDown : 
                    Minus;

  const trendColorClass = determinedVariant === 'positive' 
    ? 'text-green-600 dark:text-green-400' 
    : determinedVariant === 'negative' 
    ? 'text-red-600 dark:text-red-400'
    : determinedVariant === 'warning'
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-muted-foreground';

  const trendLabel = determinedTrend === 'up' ? 'increased' : 
                     determinedTrend === 'down' ? 'decreased' : 
                     'unchanged';

  return (
    <Card role="article" aria-label={`${label} statistic`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon && <div className="text-muted-foreground" aria-hidden="true">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-label={`${label}: ${value}`}>{value}</div>
        {changePercentage !== undefined && (
          <div 
            className={cn('flex items-center text-xs mt-1', trendColorClass)}
            aria-label={`${trendLabel} by ${Math.abs(changePercentage).toFixed(1)} percent from previous period`}
          >
            <TrendIcon className="mr-1 h-3 w-3" aria-hidden="true" />
            <span aria-hidden="true">
              {Math.abs(changePercentage).toFixed(1)}% from previous period
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
