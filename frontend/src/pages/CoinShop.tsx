import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, ArrowLeft, History } from 'lucide-react';
import { usePayment } from '@/stores/payment.store';
import { CoinPackageCard } from '@/components/payment/CoinPackageCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CoinShop() {
  const navigate = useNavigate();
  const {
    wallet,
    packages,
    packagesLoading,
    packagesError,
    checkoutLoading,
    fetchWallet,
    fetchPackages,
    createCheckout,
  } = usePayment();

  useEffect(() => {
    fetchWallet();
    fetchPackages();
  }, [fetchWallet, fetchPackages]);

  const handlePurchase = async (packageId: string) => {
    const checkoutUrl = await createCheckout(packageId);
    
    if (checkoutUrl) {
      // Redirect to Dodo payment page
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Coins className="h-8 w-8 text-amber-500" />
              Coin Shop
            </h1>
            <p className="text-muted-foreground">
              Purchase coins to send gifts to your favorite creators
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => navigate('/coins/history')}>
          <History className="h-4 w-4 mr-2" />
          Purchase History
        </Button>
      </div>

      {/* Current Balance */}
      {wallet && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Coins className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Current Balance: <strong>{wallet.balance.toLocaleString()}</strong> coins
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {packagesError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{packagesError}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {packagesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      ) : (
        /* Package Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <CoinPackageCard
              key={pkg.id}
              package={pkg}
              onPurchase={handlePurchase}
              loading={checkoutLoading}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!packagesLoading && packages.length === 0 && (
        <div className="text-center py-12">
          <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Packages Available</h3>
          <p className="text-muted-foreground">
            Please check back later for coin packages.
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">About Coins</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Coins are used to send gifts to creators during live streams</li>
          <li>• Bonus coins are added automatically to select packages</li>
          <li>• All transactions are secured by Dodo Payments</li>
          <li>• Coins are non-refundable once purchased</li>
        </ul>
      </div>
    </div>
  );
}
