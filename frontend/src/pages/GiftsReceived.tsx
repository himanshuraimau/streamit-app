import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift as GiftIcon, Loader2, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { usePayment } from '@/stores/payment.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCoins } from '@/types/payment.types';

export function GiftsReceived() {
  const navigate = useNavigate();
  const {
    giftsReceived,
    giftsReceivedLoading,
    giftsReceivedError,
    giftsReceivedPagination,
    fetchGiftsReceived,
    wallet,
  } = usePayment();

  useEffect(() => {
    fetchGiftsReceived({ page: 1, limit: 20 });
  }, [fetchGiftsReceived]);

  const handleLoadMore = () => {
    if (giftsReceivedPagination.page < giftsReceivedPagination.totalPages) {
      fetchGiftsReceived({ page: giftsReceivedPagination.page + 1, limit: 20 });
    }
  };

  // Calculate total earnings from gifts (70% after platform commission)
  const totalEarned = wallet?.totalEarned || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gifts Received</h1>
              <p className="text-sm text-muted-foreground">
                {giftsReceivedPagination.total > 0
                  ? `${giftsReceivedPagination.total} ${giftsReceivedPagination.total === 1 ? 'gift' : 'gifts'} received`
                  : 'No gifts received yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Total Earned Card */}
        {totalEarned > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Earnings from Gifts
                  </p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCoins(totalEarned)} coins
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (70% of gift value after platform commission)
                  </p>
                </div>
                <GiftIcon className="w-16 h-16 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {giftsReceivedLoading && giftsReceived.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : giftsReceivedError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-500">{giftsReceivedError}</p>
              <Button
                onClick={() => fetchGiftsReceived({ page: 1, limit: 20 })}
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : giftsReceived.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Gifts Received Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start streaming and creating content to receive gifts from your supporters!
              </p>
              <Button onClick={() => navigate('/creator/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {giftsReceived.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Gift Image */}
                      <div className="w-16 h-16 shrink-0">
                        <img
                          src={transaction.gift.imageUrl}
                          alt={transaction.gift.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.textContent = '🎁';
                            e.currentTarget.parentElement!.style.fontSize = '2.5rem';
                          }}
                        />
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-semibold text-purple-600 dark:text-purple-400">
                              {transaction.gift.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              From{' '}
                              <button
                                onClick={() => navigate(`/@${transaction.sender.username}`)}
                                className="font-medium text-foreground hover:underline"
                              >
                                @{transaction.sender.username}
                              </button>
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              +{formatCoins(Math.floor(transaction.coinAmount * 0.7))} coins
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>

                        {transaction.message && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm italic">
                            "{transaction.message}"
                          </div>
                        )}

                        {transaction.stream && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            During stream: {transaction.stream.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {giftsReceivedPagination.page < giftsReceivedPagination.totalPages && (
              <div className="mt-6 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={giftsReceivedLoading}
                  variant="outline"
                >
                  {giftsReceivedLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({giftsReceivedPagination.page} / {giftsReceivedPagination.totalPages})
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
