import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Coins, HandCoins, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePayment } from '@/stores/payment.store';
import {
  formatCoins,
  formatPrice,
  getWithdrawalStatusColor,
  getWithdrawalStatusText,
  WithdrawalStatus,
} from '@/types/payment.types';

export default function Earnings() {
  const {
    wallet,
    walletLoading,
    fetchWallet,
    withdrawalRequests,
    withdrawalSummary,
    withdrawalRequestsLoading,
    withdrawalRequestsError,
    withdrawalRequestsPagination,
    submittingWithdrawal,
    submitWithdrawalError,
    fetchWithdrawalRequests,
    submitWithdrawalRequest,
  } = usePayment();

  const [amountCoins, setAmountCoins] = useState('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchWithdrawalRequests({ page, limit: 10 });
  }, [fetchWithdrawalRequests, page]);

  const parsedAmount = Number.parseInt(amountCoins, 10) || 0;
  const coinToPaiseRate = withdrawalRequests[0]?.coinToPaiseRate ?? 100;

  const estimatedPayoutPaise = useMemo(() => {
    if (parsedAmount <= 0) return 0;
    return parsedAmount * coinToPaiseRate;
  }, [parsedAmount, coinToPaiseRate]);

  const paidCoins = useMemo(() => {
    return withdrawalRequests
      .filter((request) => request.status === WithdrawalStatus.PAID)
      .reduce((sum, request) => sum + request.amountCoins, 0);
  }, [withdrawalRequests]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (parsedAmount <= 0) {
      toast.error('Enter a valid coin amount');
      return;
    }

    if (parsedAmount > (wallet?.balance ?? 0)) {
      toast.error('Requested amount exceeds your wallet balance');
      return;
    }

    const submitted = await submitWithdrawalRequest({
      amountCoins: parsedAmount,
      reason: reason.trim() || undefined,
    });

    if (submitted) {
      setAmountCoins('');
      setReason('');
      if (page !== 1) {
        setPage(1);
      }
    }
  };

  const totalPages = Math.max(withdrawalRequestsPagination.totalPages, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Earnings & Withdrawals</h1>
        <p className="text-zinc-400">
          Submit payout requests and track their progress through finance review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Available Coins</p>
              <p className="text-xl font-semibold text-white">
                {walletLoading ? '...' : formatCoins(wallet?.balance ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Pending Withdrawals</p>
              <p className="text-xl font-semibold text-white">
                {formatCoins(withdrawalSummary.pendingCoins)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Paid Out (Loaded Page)</p>
              <p className="text-xl font-semibold text-white">{formatCoins(paidCoins)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="amountCoins">
                Amount (coins)
              </Label>
              <Input
                id="amountCoins"
                type="number"
                min={1}
                value={amountCoins}
                onChange={(event) => setAmountCoins(event.target.value)}
                placeholder="Enter coin amount"
                className="bg-zinc-950 border-zinc-700 text-white"
                disabled={submittingWithdrawal}
              />
              <p className="text-xs text-zinc-400">
                Available: {formatCoins(wallet?.balance ?? withdrawalSummary.availableCoins)} coins
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="withdrawalReason">
                Notes for Finance Team (optional)
              </Label>
              <Textarea
                id="withdrawalReason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Any payout context or destination notes"
                className="bg-zinc-950 border-zinc-700 text-white"
                disabled={submittingWithdrawal}
              />
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
              <p className="text-xs text-zinc-400">Estimated payout</p>
              <p className="text-sm text-zinc-200 mt-1">
                {parsedAmount > 0
                  ? `${formatCoins(parsedAmount)} coins ≈ ${formatPrice(estimatedPayoutPaise)}`
                  : 'Enter amount to preview payout'}
              </p>
            </div>

            {submitWithdrawalError && (
              <Alert variant="destructive">
                <AlertDescription>{submitWithdrawalError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={submittingWithdrawal || walletLoading}
            >
              {submittingWithdrawal ? 'Submitting...' : 'Submit Withdrawal Request'}
            </Button>
          </form>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Withdrawal History</h2>
            <span className="text-xs text-zinc-400">
              {withdrawalRequestsPagination.total} total requests
            </span>
          </div>

          {withdrawalRequestsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{withdrawalRequestsError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {withdrawalRequestsLoading && withdrawalRequests.length === 0 && (
              <p className="text-zinc-400 text-sm">Loading requests...</p>
            )}

            {!withdrawalRequestsLoading && withdrawalRequests.length === 0 && (
              <p className="text-zinc-400 text-sm">
                No withdrawal requests yet. Submit your first request from the form.
              </p>
            )}

            {withdrawalRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white font-medium">
                      {formatCoins(request.amountCoins)} coins • {formatPrice(request.netAmountPaise)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Requested {new Date(request.requestedAt).toLocaleString()}
                    </p>
                    {request.payoutReference && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Ref: {request.payoutReference}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={getWithdrawalStatusColor(request.status)}
                  >
                    {getWithdrawalStatusText(request.status)}
                  </Badge>
                </div>

                {request.reason && (
                  <p className="text-xs text-zinc-300 mt-3 border-t border-zinc-800 pt-3">
                    {request.reason}
                  </p>
                )}
              </div>
            ))}
          </div>

          {withdrawalRequestsPagination.total > 0 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-zinc-400">
                Page {withdrawalRequestsPagination.page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  disabled={withdrawalRequestsPagination.page <= 1 || withdrawalRequestsLoading}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  disabled={withdrawalRequestsPagination.page >= totalPages || withdrawalRequestsLoading}
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
