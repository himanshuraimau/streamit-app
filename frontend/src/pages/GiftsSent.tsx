import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift as GiftIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePayment } from '@/stores/payment.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCoins } from '@/types/payment.types';

export function GiftsSent() {
  const navigate = useNavigate();
  const {
    giftsSent,
    giftsSentLoading,
    giftsSentError,
    giftsSentPagination,
    fetchGiftsSent,
  } = usePayment();

  useEffect(() => {
    fetchGiftsSent({ page: 1, limit: 20 });
  }, [fetchGiftsSent]);

  const handleLoadMore = () => {
    if (giftsSentPagination.page < giftsSentPagination.totalPages) {
      fetchGiftsSent({ page: giftsSentPagination.page + 1, limit: 20 });
    }
  };

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
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <GiftIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gifts Sent</h1>
              <p className="text-sm text-muted-foreground">
                {giftsSentPagination.total > 0
                  ? `${giftsSentPagination.total} ${giftsSentPagination.total === 1 ? 'gift' : 'gifts'} sent`
                  : 'No gifts sent yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {giftsSentLoading && giftsSent.length === 0 ? (
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
        ) : giftsSentError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-500">{giftsSentError}</p>
              <Button
                onClick={() => fetchGiftsSent({ page: 1, limit: 20 })}
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : giftsSent.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Gifts Sent Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start supporting your favorite creators by sending gifts during their streams!
              </p>
              <Button onClick={() => navigate('/explore')}>
                Explore Streams
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {giftsSent.map((transaction) => (
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
                              Sent to{' '}
                              <button
                                onClick={() => navigate(`/@${transaction.receiver.username}`)}
                                className="font-medium text-foreground hover:underline"
                              >
                                @{transaction.receiver.username}
                              </button>
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                              {formatCoins(transaction.coinAmount)} coins
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
            {giftsSentPagination.page < giftsSentPagination.totalPages && (
              <div className="mt-6 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={giftsSentLoading}
                  variant="outline"
                >
                  {giftsSentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({giftsSentPagination.page} / {giftsSentPagination.totalPages})
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
