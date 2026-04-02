import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { monetizationApi } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCoins, formatDateTime } from '@/lib/monetization';

interface WalletDetailSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDetailSheet({
  userId,
  open,
  onOpenChange,
}: WalletDetailSheetProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monetization.wallet(userId || ''),
    queryFn: () => monetizationApi.getWalletDetails(userId!),
    enabled: !!userId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Wallet Details</SheetTitle>
          <SheetDescription>
            Review the user wallet balance and recent coin movements.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-6 py-6">
            <Card>
              <CardHeader>
                <CardTitle>{data.userName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">{data.userEmail}</div>
                <div>User ID: {data.userId}</div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Balance</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCoins(data.balance)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Earned</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCoins(data.totalEarned)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Spent</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCoins(data.totalSpent)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((transaction) => (
                      <div
                        key={`${transaction.type}-${transaction.id}`}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(transaction.createdAt)}
                            </div>
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              transaction.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {transaction.amount >= 0 ? '+' : ''}
                            {formatCoins(transaction.amount)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No wallet transactions available yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-6 text-sm text-muted-foreground">Wallet not found.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
