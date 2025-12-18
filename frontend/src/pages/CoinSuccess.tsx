import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Coins, Gift, Copy, Check } from 'lucide-react';
import { usePayment } from '@/stores/payment.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCoins, formatPrice } from '@/types/payment.types';
import { discountApi } from '@/lib/api/discount';
import { formatDiscountValue, DiscountType } from '@/types/discount.types';
import type { CoinPurchase } from '@/types/payment.types';
import type { DiscountCode } from '@/types/discount.types';

export default function CoinSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const { verifyPurchase } = usePayment();
  const [purchase, setPurchase] = useState<CoinPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reward code state
  const [rewardCode, setRewardCode] = useState<DiscountCode | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    // Verify purchase with backend
    const verify = async () => {
      setLoading(true);
      try {
        const result = await verifyPurchase(orderId);
        if (result) {
          setPurchase(result);
          
          // If purchase is completed, fetch the latest reward code
          if (result.status === 'COMPLETED') {
            const rewardResponse = await discountApi.getLatestRewardCode();
            if (rewardResponse.success && rewardResponse.data) {
              setRewardCode(rewardResponse.data);
            }
          }
        } else {
          setError('Purchase not found');
        }
      } catch {
        setError('Failed to verify purchase');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [orderId, verifyPurchase]);

  // Copy reward code to clipboard
  const handleCopyCode = async () => {
    if (!rewardCode) return;
    
    try {
      await navigator.clipboard.writeText(rewardCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return 'No expiration';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Verifying Purchase...</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we confirm your payment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (error || !purchase) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Unable to verify purchase'}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/coins/shop')} className="w-full">
              Back to Shop
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success State
  if (purchase.status === 'COMPLETED') {
    return (
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="border-green-200">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <Coins className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-amber-700">
                +{formatCoins(purchase.totalCoins)}
              </div>
              <div className="text-sm text-muted-foreground">coins added to your wallet</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package:</span>
                <span className="font-semibold">{purchase.package.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold">{formatPrice(purchase.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono text-xs">{purchase.orderId}</span>
              </div>
            </div>

            {/* Reward Code Section - Requirements: 2.1, 2.3 */}
            {rewardCode && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">You earned a reward code!</span>
                </div>
                
                <div className="bg-white rounded-md p-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-lg font-bold text-purple-700">
                        {rewardCode.code}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDiscountValue(rewardCode.discountType as DiscountType, rewardCode.discountValue)} bonus coins
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Expires: {formatExpirationDate(rewardCode.expiresAt)}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Use this code on your next purchase for bonus coins!
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
              Go Home
            </Button>
            <Button onClick={() => navigate('/coins/history')} className="flex-1">
              View History
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Failed State
  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <Card className="border-red-200">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {purchase.failureReason || 'Your payment could not be processed'}
          </p>
          <div className="text-sm text-muted-foreground">
            Order ID: <span className="font-mono">{purchase.orderId}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={() => navigate('/coins/shop')} variant="outline" className="flex-1">
            Try Again
          </Button>
          <Button onClick={() => navigate('/')} className="flex-1">
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
