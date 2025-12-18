import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, ArrowLeft, History, Tag, Ticket } from 'lucide-react';
import { usePayment } from '@/stores/payment.store';
import { CoinPackageCard } from '@/components/payment/CoinPackageCard';
import { DiscountCodeInput } from '@/components/payment/DiscountCodeInput';
import { AppliedDiscount } from '@/components/payment/AppliedDiscount';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DiscountValidationData } from '@/types/discount.types';
import type { CoinPackage } from '@/types/payment.types';

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

  // Discount code state - Requirements: 1.1
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidationData | null>(null);

  useEffect(() => {
    fetchWallet();
    fetchPackages();
  }, [fetchWallet, fetchPackages]);

  // Auto-select first package when packages load
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      // Select the featured package or first one
      const featured = packages.find(p => p.isFeatured);
      setSelectedPackage(featured || packages[0]);
    }
  }, [packages, selectedPackage]);

  // Handle discount code application - Requirements: 1.1
  const handleDiscountApplied = (discount: DiscountValidationData | null) => {
    setAppliedDiscount(discount);
  };

  // Handle package selection
  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    // Clear discount when package changes since it was validated for a different package
    setAppliedDiscount(null);
  };

  // Handle purchase with discount code - Requirements: 1.4
  const handlePurchase = async (packageId: string) => {
    const checkoutUrl = await createCheckout(
      packageId,
      appliedDiscount?.code // Pass discount code if applied
    );
    
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/coins/my-codes')}>
            <Ticket className="h-4 w-4 mr-2" />
            My Codes
          </Button>
          <Button variant="outline" onClick={() => navigate('/coins/history')}>
            <History className="h-4 w-4 mr-2" />
            Purchase History
          </Button>
        </div>
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
        <>
          {/* Package Grid - Requirements: 1.2 - Show bonus coins when discount applied */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                package={pkg}
                onPurchase={handlePurchase}
                onSelect={handlePackageSelect}
                loading={checkoutLoading}
                isSelected={selectedPackage?.id === pkg.id}
                discountBonusCoins={
                  selectedPackage?.id === pkg.id && appliedDiscount
                    ? appliedDiscount.bonusCoins
                    : undefined
                }
              />
            ))}
          </div>

          {/* Discount Code Section - Requirements: 1.1 */}
          {selectedPackage && (
            <div className="mt-8 max-w-md mx-auto space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Have a discount code?</span>
              </div>
              
              <DiscountCodeInput
                packageId={selectedPackage.id}
                onDiscountApplied={handleDiscountApplied}
                disabled={checkoutLoading}
              />

              {/* Applied Discount Display - Requirements: 1.2 */}
              {appliedDiscount && (
                <AppliedDiscount
                  discount={appliedDiscount}
                  packageCoins={selectedPackage.coins}
                  packageBonusCoins={selectedPackage.bonusCoins}
                />
              )}
            </div>
          )}
        </>
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
          <li>• Use discount codes to get extra bonus coins on your purchase</li>
          <li>• All transactions are secured by Dodo Payments</li>
          <li>• Coins are non-refundable once purchased</li>
        </ul>
      </div>
    </div>
  );
}
