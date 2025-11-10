import { useEffect } from 'react';
import { Coins } from 'lucide-react';
import { usePayment } from '@/stores/payment.store';
import { formatCoins } from '@/types/payment.types';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export function CoinBalance() {
  const navigate = useNavigate();
  const { wallet, walletLoading, fetchWallet } = usePayment();

  useEffect(() => {
    // Fetch wallet on mount
    fetchWallet();
  }, [fetchWallet]);

  if (walletLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-16" />
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/coins/shop')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
      title="Buy more coins"
    >
      <Coins className="h-5 w-5 text-amber-600" />
      <span className="text-sm font-semibold text-amber-700">
        {wallet ? formatCoins(wallet.balance) : '0'}
      </span>
    </button>
  );
}
