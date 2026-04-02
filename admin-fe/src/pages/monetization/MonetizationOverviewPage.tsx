import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { monetizationApi } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCoins, formatCurrencyAmount, formatDateTime } from '@/lib/monetization';
import { Coins, Gift, Ticket, Wallet } from 'lucide-react';

export function MonetizationOverviewPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.overview(),
    queryFn: () => monetizationApi.getOverview(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monetization Overview</h1>
        <p className="text-muted-foreground">
          Track payments, withdrawals, gifting activity, and promotional code usage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
        ) : (
          <>
            <StatCard
              label="Completed Revenue"
              value={formatCurrencyAmount(
                data?.metrics.totalRevenueAmount || 0,
                data?.metrics.revenueCurrency || 'INR'
              )}
              description={`${data?.metrics.completedPurchasesCount || 0} completed purchases`}
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Open Withdrawals"
              value={formatCoins(data?.metrics.openWithdrawalCoins || 0)}
              description={`${data?.metrics.openWithdrawalCount || 0} requests waiting`}
              icon={<Coins className="h-4 w-4" />}
            />
            <StatCard
              label="Gifts (30d)"
              value={formatCoins(data?.metrics.giftsLast30DaysCoins || 0)}
              description={`${data?.metrics.giftsLast30DaysCount || 0} recent gift transactions`}
              icon={<Gift className="h-4 w-4" />}
            />
            <StatCard
              label="Active Promo Codes"
              value={data?.metrics.activePromotionalCodesCount || 0}
              description={`${data?.metrics.redeemedPromotionalCodesCount || 0} have redemptions`}
              icon={<Ticket className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Purchases</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/monetization/ledger')}>
              Open Ledger
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : data?.recentPurchases.length ? (
              data.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{purchase.userName}</div>
                      <div className="text-sm text-muted-foreground">{purchase.packageName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrencyAmount(purchase.amount, purchase.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCoins(purchase.totalCoins)} coins
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(purchase.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No purchase activity yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Open Withdrawals</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/monetization/withdrawals')}
            >
              Review Requests
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : data?.pendingWithdrawals.length ? (
              data.pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{withdrawal.userName}</div>
                      <div className="text-sm text-muted-foreground">{withdrawal.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCoins(withdrawal.amountCoins)} coins</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrencyAmount(withdrawal.netAmountPaise)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(withdrawal.requestedAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No open withdrawals.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Gifts</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/monetization/gifts')}>
              Open Gifts
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : data?.recentGifts.length ? (
              data.recentGifts.map((gift) => (
                <div key={gift.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {gift.senderName} to {gift.receiverName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {gift.giftName}
                        {gift.streamTitle ? ` • ${gift.streamTitle}` : ''}
                      </div>
                    </div>
                    <div className="font-medium">{formatCoins(gift.coinAmount)} coins</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(gift.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No recent gifting activity.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Promotional Codes</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/monetization/discounts')}
            >
              Manage Codes
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : data?.activeDiscountCodes.length ? (
              data.activeDiscountCodes.map((code) => (
                <div key={code.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{code.code}</div>
                      <div className="text-sm text-muted-foreground">
                        {code.discountType === 'PERCENTAGE'
                          ? `${code.discountValue}% bonus`
                          : formatCurrencyAmount(code.discountValue)}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{code.currentRedemptions} redemptions</div>
                      <div className="text-muted-foreground">
                        {code.maxRedemptions ? `of ${code.maxRedemptions}` : 'Unlimited'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No active promotional codes.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MonetizationOverviewPage;
