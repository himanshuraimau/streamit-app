import { paymentApi } from '@/lib/api/payment';
import type { GiftTransaction } from '@/types/payment.types';

export const PENNY_TIP_GIFT_NAME = 'Penny Tip';

export function filterGiftTransactionsForStream(
  gifts: GiftTransaction[],
  streamId: string
): GiftTransaction[] {
  return gifts.filter((gift) => gift.streamId === streamId || gift.stream?.id === streamId);
}

export function sortGiftTransactionsByNewest(gifts: GiftTransaction[]): GiftTransaction[] {
  return [...gifts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function calculateStreamEarnings(gifts: GiftTransaction[]): number {
  return gifts.reduce((total, gift) => {
    const quantity = gift.quantity && gift.quantity > 0 ? gift.quantity : 1;
    const grossCoins = gift.coinAmount * quantity;
    const giftName = gift.gift?.name?.trim().toLowerCase();
    const isPennyTip = giftName === PENNY_TIP_GIFT_NAME.toLowerCase();

    return total + (isPennyTip ? grossCoins : Math.floor(grossCoins * 0.7));
  }, 0);
}

export async function fetchAllReceivedGiftsForStream(
  streamId: string
): Promise<GiftTransaction[]> {
  const aggregated: GiftTransaction[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await paymentApi.getGiftsReceived({ page, limit: 100 });

    if (!response.success) {
      throw new Error('Failed to load gift transactions');
    }

    aggregated.push(...filterGiftTransactionsForStream(response.data, streamId));
    totalPages = response.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return sortGiftTransactionsByNewest(aggregated);
}
