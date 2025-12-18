import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Copy, Check, Ticket, Clock, AlertCircle } from 'lucide-react';
import { discountApi } from '@/lib/api/discount';
import type { DiscountCodeWithStatus } from '@/types/discount.types';
import {
  DiscountType,
  formatDiscountValue,
  getDiscountStatusText,
  getDiscountStatusColor,
  isCodeUsable,
} from '@/types/discount.types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * My Codes Page - Display user's discount codes
 * Requirements: 4.1, 4.2, 4.3
 */
export default function MyCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<DiscountCodeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch user's discount codes - Requirements: 4.1
  useEffect(() => {
    const fetchCodes = async () => {
      setLoading(true);
      setError(null);
      
      const response = await discountApi.getMyCodes();
      
      if (response.success && response.data) {
        setCodes(response.data);
      } else {
        setError(response.error || 'Failed to fetch discount codes');
      }
      
      setLoading(false);
    };

    fetchCodes();
  }, []);

  // Copy code to clipboard - Requirements: 4.3
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Format expiration date - Requirements: 4.2
  const formatExpiration = (expiresAt: string | null): string => {
    if (!expiresAt) return 'No expiration';
    
    const date = new Date(expiresAt);
    const now = new Date();
    
    if (date < now) {
      return 'Expired';
    }
    
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
    
    return `Expires ${date.toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900 rounded-lg">
              <Ticket className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Discount Codes</h1>
              <p className="text-sm text-muted-foreground">
                {codes.length > 0
                  ? `${codes.length} ${codes.length === 1 ? 'code' : 'codes'} available`
                  : 'View and manage your reward codes'}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : codes.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="p-12 text-center">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Discount Codes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Purchase coins to earn reward codes for future discounts!
              </p>
              <Button onClick={() => navigate('/coins/shop')}>
                Go to Coin Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Codes List - Requirements: 4.1, 4.2 */
          <div className="space-y-4">
            {codes.map((code) => (
              <Card 
                key={code.id} 
                className={`hover:shadow-md transition-shadow ${!isCodeUsable(code) ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-purple-900/50 rounded-lg">
                      <Tag className="h-6 w-6 text-purple-400" />
                    </div>

                    {/* Code Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-mono font-semibold text-purple-400">
                            {code.code}
                          </h3>
                          <p className="text-2xl font-bold text-foreground">
                            {formatDiscountValue(code.discountType, code.discountValue)}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              {code.discountType === DiscountType.PERCENTAGE 
                                ? 'bonus coins' 
                                : 'worth of bonus coins'}
                            </span>
                          </p>
                        </div>
                        <Badge className={getDiscountStatusColor(code)}>
                          {getDiscountStatusText(code)}
                        </Badge>
                      </div>

                      {/* Expiration - Requirements: 4.2 */}
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                        <Clock className="h-4 w-4" />
                        {formatExpiration(code.expiresAt)}
                      </p>
                      
                      {/* Description */}
                      {code.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {code.description}
                        </p>
                      )}
                    </div>

                    {/* Copy Button - Requirements: 4.3 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(code.code)}
                      disabled={!isCodeUsable(code)}
                      className="shrink-0"
                    >
                      {copiedCode === code.code ? (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        {!loading && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">About Discount Codes</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Reward codes are earned after successful coin purchases</li>
                <li>• Each code can only be used once</li>
                <li>• Codes have expiration dates - use them before they expire!</li>
                <li>• Apply codes at checkout to get bonus coins on your purchase</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
