import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { usePayment } from '@/stores/payment.store';
import { PurchaseHistoryItem } from '@/components/payment/PurchaseHistoryItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PurchaseHistory() {
  const navigate = useNavigate();
  const {
    purchases,
    purchasesLoading,
    purchasesError,
    purchasesPagination,
    fetchPurchaseHistory,
  } = usePayment();

  useEffect(() => {
    fetchPurchaseHistory({ page: 1, limit: 20 });
  }, [fetchPurchaseHistory]);

  const handleLoadMore = () => {
    const nextPage = purchasesPagination.page + 1;
    if (nextPage <= purchasesPagination.totalPages) {
      fetchPurchaseHistory({ page: nextPage, limit: 20 });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Purchase History
          </h1>
          <p className="text-muted-foreground">View all your coin purchase transactions</p>
        </div>
      </div>

      {/* Error State */}
      {purchasesError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{purchasesError}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {purchasesLoading && purchases.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Purchase List */}
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <PurchaseHistoryItem key={purchase.id} purchase={purchase} />
            ))}
          </div>

          {/* Load More */}
          {purchasesPagination.page < purchasesPagination.totalPages && (
            <div className="text-center mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={purchasesLoading}
                variant="outline"
              >
                {purchasesLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Showing {purchases.length} of {purchasesPagination.total} transactions
          </div>
        </>
      )}

      {/* Empty State */}
      {!purchasesLoading && purchases.length === 0 && (
        <div className="text-center py-12">
          <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Purchases Yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven't made any coin purchases yet
          </p>
          <Button onClick={() => navigate('/coins/shop')}>
            Go to Coin Shop
          </Button>
        </div>
      )}
    </div>
  );
}
