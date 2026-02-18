import DodoPayments from 'dodopayments';
import { prisma } from '../lib/db';
import type { Prisma } from '@prisma/client';
import { DiscountService } from './discount.service';

// Log environment for debugging
console.log('🔧 Dodo Payments Configuration:');
console.log('  Environment: test_mode (forced)');
console.log('  API Key present:', !!process.env.DODO_API_KEY);
console.log('  API Key prefix:', process.env.DODO_API_KEY?.substring(0, 20) + '...');

// Force test mode for now
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY || '',
  environment: 'test_mode', // Forced to test mode
});

export class PaymentService {
  /**
   * Create checkout session for coin purchase
   * Accepts optional discountCode parameter to apply bonus coins
   *
   * Requirements: 1.4
   */
  static async createCheckout(userId: string, packageId: string, discountCode?: string) {
    const pkg = await prisma.coinPackage.findUnique({
      where: { id: packageId, isActive: true },
    });

    if (!pkg) {
      throw new Error('Package not found or inactive');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Validate discount code if provided
    let discountCodeId: string | null = null;
    let discountBonusCoins = 0;

    if (discountCode) {
      const validationResult = await DiscountService.validateCode(discountCode, packageId, userId);

      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Invalid discount code');
      }

      // Get the discount code record to store its ID
      const discountCodeRecord = await DiscountService.getCodeByString(discountCode);
      if (discountCodeRecord) {
        discountCodeId = discountCodeRecord.id;
        discountBonusCoins = validationResult.data?.bonusCoins ?? 0;
      }
    }

    const orderId = `order_${Date.now()}_${userId.slice(0, 8)}`;
    // Total coins = base coins + package bonus + discount bonus
    const totalCoins = pkg.coins + pkg.bonusCoins + discountBonusCoins;

    try {
      // Create checkout session with Dodo
      // Note: product_id should be the Dodo product ID from your Dodo dashboard
      // You need to create products in Dodo first and store their IDs in your database
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: pkg.id, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.name,
        },
        metadata: {
          packageId: pkg.id,
          packageName: pkg.name,
          coins: pkg.coins.toString(),
          bonusCoins: pkg.bonusCoins.toString(),
          discountBonusCoins: discountBonusCoins.toString(),
          discountCodeId: discountCodeId || '',
          orderId,
        },
        return_url: `${process.env.FRONTEND_URL}/coins/success?orderId=${orderId}`,
      });

      // Create pending purchase record with discount info
      await prisma.coinPurchase.create({
        data: {
          userId,
          packageId,
          coins: pkg.coins,
          bonusCoins: pkg.bonusCoins,
          discountCodeId,
          discountBonusCoins,
          totalCoins,
          amount: pkg.price,
          currency: pkg.currency,
          orderId,
          transactionId: session.session_id, // Dodo session_id
          status: 'PENDING',
          paymentGateway: 'dodo',
        },
      });

      console.log(
        `✅ Checkout session created: ${session.session_id} for user ${userId}${discountCode ? ` with discount code ${discountCode}` : ''}`
      );

      return {
        checkoutUrl: session.checkout_url,
        orderId,
        sessionId: session.session_id,
        discountBonusCoins,
      };
    } catch (error: unknown) {
      console.error('❌ Error creating checkout:', error);
      const err = error as Record<string, unknown>;
      console.error('❌ Error details:', {
        message: err?.['message'],
        status: err?.['status'],
        headers: err?.['headers'],
        name: err?.['name'],
      });

      // Provide more specific error messages
      if (err?.['status'] === 401) {
        throw new Error(
          'Invalid Dodo Payments API key. Please check your DODO_API_KEY environment variable and ensure it is a TEST MODE key.',
          { cause: error }
        );
      }

      throw new Error(
        typeof err?.['message'] === 'string' ? err['message'] : 'Failed to create checkout session',
        { cause: error }
      );
    }
  }

  /**
   * Process Dodo webhook payment confirmation
   *
   * On payment success:
   * - Credits base coins + package bonus + discount bonus to user wallet
   * - Creates discount redemption record if discount code was used
   * - Generates reward code for user
   *
   * Requirements: 2.1, 6.1
   */
  static async processWebhook(payload: Record<string, unknown>): Promise<void> {
    // Helper to safely read a string field from an unknown object
    const str = (obj: unknown, key: string): string | undefined => {
      if (obj && typeof obj === 'object' && key in obj) {
        const v = (obj as Record<string, unknown>)[key];
        return typeof v === 'string' ? v : undefined;
      }
      return undefined;
    };

    const payloadData = payload['data'] as Record<string, unknown> | undefined;

    console.log(
      '📦 Processing webhook:',
      payload['event_type'],
      str(payloadData, 'payment_id') ?? str(payload, 'payment_id')
    );
    console.log('📦 Full webhook data:', JSON.stringify(payload, null, 2));

    // Extract data from payload (Dodo sends nested data object)
    const eventType = payload['event_type'] ?? payload['type'];
    const paymentData: Record<string, unknown> = payloadData ?? payload;
    const paymentId = str(paymentData, 'payment_id');
    const sessionId = str(paymentData, 'checkout_session_id') ?? str(paymentData, 'session_id');
    const status = str(paymentData, 'status') ?? str(paymentData, 'payment_status');
    const failureReason = str(paymentData, 'failure_reason');

    if (!paymentId && !sessionId) {
      console.error('⚠️ No payment_id or session_id found in webhook payload');
      return;
    }

    const purchase = await prisma.coinPurchase.findFirst({
      where: {
        OR: [{ transactionId: paymentId }, { transactionId: sessionId }],
      },
      include: { user: true, package: true },
    });

    if (!purchase) {
      console.warn('⚠️ Purchase not found for payment:', paymentId || sessionId);
      console.warn('⚠️ Searched with payment_id:', paymentId, 'and session_id:', sessionId);
      return;
    }

    if (purchase.status === 'COMPLETED') {
      console.log('ℹ️ Purchase already completed:', purchase.id);
      return;
    }

    // Handle payment success
    if (eventType === 'payment.succeeded' || status === 'succeeded' || status === 'paid') {
      console.log(`✅ Payment succeeded for purchase ${purchase.id}`);

      // Update purchase status
      await prisma.coinPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'COMPLETED',
          paymentData: payload as Parameters<
            typeof prisma.coinPurchase.update
          >[0]['data']['paymentData'],
          transactionId: paymentId ?? sessionId,
        },
      });

      // Credit coins to user's wallet (includes discount bonus coins)
      await prisma.coinWallet.upsert({
        where: { userId: purchase.userId },
        create: {
          userId: purchase.userId,
          balance: purchase.totalCoins,
          totalSpent: purchase.totalCoins,
        },
        update: {
          balance: { increment: purchase.totalCoins },
          totalSpent: { increment: purchase.totalCoins },
        },
      });

      console.log(`💰 Credited ${purchase.totalCoins} coins to user ${purchase.userId}`);

      // Apply discount code if one was used (create redemption record)
      if (purchase.discountCodeId && purchase.discountBonusCoins > 0) {
        try {
          await DiscountService.applyDiscount(
            purchase.discountCodeId,
            purchase.id,
            purchase.userId,
            purchase.discountBonusCoins
          );
          console.log(`🎟️ Discount code applied for purchase ${purchase.id}`);
        } catch (error) {
          console.error('⚠️ Error applying discount:', error);
          // Don't fail the webhook - coins are already credited
        }
      }

      // Generate reward code for user
      try {
        const rewardCode = await DiscountService.generateRewardCode(
          purchase.userId,
          purchase.amount
        );
        console.log(`🎁 Reward code generated: ${rewardCode.code} for user ${purchase.userId}`);
      } catch (error) {
        console.error('⚠️ Error generating reward code:', error);
        // Don't fail the webhook - coins are already credited
      }
    }
    // Handle payment failure
    else if (eventType === 'payment.failed' || status === 'failed') {
      console.log(`❌ Payment failed for purchase ${purchase.id}`);

      await prisma.coinPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'FAILED',
          failureReason: failureReason ?? 'Payment failed',
          paymentData: payload as Parameters<
            typeof prisma.coinPurchase.update
          >[0]['data']['paymentData'],
        },
      });
    }
  }

  /**
   * Send gift to creator (deduct coins from sender, credit creator)
   */
  static async sendGift(
    senderId: string,
    receiverId: string,
    giftId: string,
    streamId?: string,
    message?: string
  ) {
    const gift = await prisma.gift.findUnique({
      where: { id: giftId, isActive: true },
    });

    if (!gift) {
      throw new Error('Gift not found or inactive');
    }

    // Verify receiver is an approved creator
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { creatorApplication: true },
    });

    if (!receiver || receiver.creatorApplication?.status !== 'APPROVED') {
      throw new Error('Receiver is not an approved creator');
    }

    return await prisma.$transaction(async (tx) => {
      // Deduct coins from sender
      const senderWallet = await tx.coinWallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet || senderWallet.balance < gift.coinPrice) {
        throw new Error('Insufficient balance');
      }

      await tx.coinWallet.update({
        where: { userId: senderId },
        data: {
          balance: { decrement: gift.coinPrice },
          totalSpent: { increment: gift.coinPrice },
        },
      });

      // Credit creator (70% after 30% platform commission)
      const creatorAmount = Math.floor(gift.coinPrice * 0.7);

      await tx.coinWallet.upsert({
        where: { userId: receiverId },
        create: {
          userId: receiverId,
          balance: creatorAmount,
          totalEarned: creatorAmount,
        },
        update: {
          balance: { increment: creatorAmount },
          totalEarned: { increment: creatorAmount },
        },
      });

      // Record gift transaction
      const transaction = await tx.giftTransaction.create({
        data: {
          senderId,
          receiverId,
          giftId,
          coinAmount: gift.coinPrice,
          streamId,
          message,
        },
        include: {
          gift: true,
          sender: { select: { id: true, username: true, name: true, image: true } },
          receiver: { select: { id: true, username: true, name: true } },
        },
      });

      console.log(`🎁 Gift sent: ${gift.name} from ${senderId} to ${receiverId}`);

      return transaction;
    });
  }

  /**
   * Get user's coin wallet
   */
  static async getWallet(userId: string) {
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      return await prisma.coinWallet.create({
        data: { userId },
      });
    }

    return wallet;
  }

  /**
   * Get all active coin packages
   */
  static async getPackages() {
    return await prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get all active gifts
   */
  static async getGifts() {
    return await prisma.gift.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get user's purchase history
   */
  static async getPurchaseHistory(userId: string, limit = 20, offset = 0) {
    const purchases = await prisma.coinPurchase.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.coinPurchase.count({ where: { userId } });

    return { purchases, total };
  }

  /**
   * Get gifts sent by user
   */
  static async getGiftsSent(userId: string, limit = 20, offset = 0) {
    const gifts = await prisma.giftTransaction.findMany({
      where: { senderId: userId },
      include: {
        gift: true,
        receiver: { select: { id: true, username: true, name: true, image: true } },
        stream: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.giftTransaction.count({ where: { senderId: userId } });

    return { gifts, total };
  }

  /**
   * Get gifts received by creator
   */
  static async getGiftsReceived(userId: string, limit = 20, offset = 0) {
    const gifts = await prisma.giftTransaction.findMany({
      where: { receiverId: userId },
      include: {
        gift: true,
        sender: { select: { id: true, username: true, name: true, image: true } },
        stream: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.giftTransaction.count({ where: { receiverId: userId } });

    return { gifts, total };
  }

  /**
   * Send penny tip to creator (1 coin)
   * Deducts 1 coin from sender and credits 1 coin to creator
   *
   * Requirements: 3.3, 3.4, 3.6
   */
  static async sendPennyTip(senderId: string, creatorId: string, streamId: string) {
    const PENNY_TIP_AMOUNT = 1;

    // Verify the stream exists and is live
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { user: true },
    });

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (!stream.isLive) {
      throw new Error('Stream is not live');
    }

    // Verify the stream belongs to the creator
    if (stream.userId !== creatorId) {
      throw new Error('Stream does not belong to this creator');
    }

    // Verify receiver is an approved creator
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      include: { creatorApplication: true },
    });

    if (!creator || creator.creatorApplication?.status !== 'APPROVED') {
      throw new Error('Receiver is not an approved creator');
    }

    // Cannot tip yourself
    if (senderId === creatorId) {
      throw new Error('You cannot tip yourself');
    }

    return await prisma.$transaction(async (tx) => {
      // Check sender's wallet balance
      const senderWallet = await tx.coinWallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet || senderWallet.balance < PENNY_TIP_AMOUNT) {
        throw new Error('Insufficient balance');
      }

      // Deduct 1 coin from sender
      await tx.coinWallet.update({
        where: { userId: senderId },
        data: {
          balance: { decrement: PENNY_TIP_AMOUNT },
          totalSpent: { increment: PENNY_TIP_AMOUNT },
        },
      });

      // Credit 1 coin to creator (no platform commission for penny tips)
      await tx.coinWallet.upsert({
        where: { userId: creatorId },
        create: {
          userId: creatorId,
          balance: PENNY_TIP_AMOUNT,
          totalEarned: PENNY_TIP_AMOUNT,
        },
        update: {
          balance: { increment: PENNY_TIP_AMOUNT },
          totalEarned: { increment: PENNY_TIP_AMOUNT },
        },
      });

      // Create GiftTransaction record for penny tip (giftId is null for penny tips)
      const transaction = await tx.giftTransaction.create({
        data: {
          senderId,
          receiverId: creatorId,
          giftId: await PaymentService.getPennyTipGiftId(tx),
          coinAmount: PENNY_TIP_AMOUNT,
          streamId,
          message: 'Penny tip',
        },
        include: {
          sender: { select: { id: true, username: true, name: true, image: true } },
          receiver: { select: { id: true, username: true, name: true } },
        },
      });

      // Update stream stats if they exist
      await tx.streamStats.updateMany({
        where: { streamId },
        data: {
          totalLikes: { increment: 1 },
          totalCoins: { increment: PENNY_TIP_AMOUNT },
        },
      });

      // Get updated sender wallet balance
      const updatedWallet = await tx.coinWallet.findUnique({
        where: { userId: senderId },
      });

      console.log(`💰 Penny tip sent: ${senderId} -> ${creatorId} (1 coin)`);

      return {
        transactionId: transaction.id,
        remainingBalance: updatedWallet?.balance ?? 0,
        transaction,
      };
    });
  }

  /**
   * Get or create a special "Penny Tip" gift for tracking penny tips
   * This is a helper to ensure penny tips are recorded as gift transactions
   */
  private static async getPennyTipGiftId(tx: Prisma.TransactionClient): Promise<string> {
    const PENNY_TIP_GIFT_NAME = 'Penny Tip';

    // Try to find existing penny tip gift
    let pennyTipGift = await tx.gift.findFirst({
      where: { name: PENNY_TIP_GIFT_NAME },
    });

    // Create if doesn't exist
    if (!pennyTipGift) {
      pennyTipGift = await tx.gift.create({
        data: {
          name: PENNY_TIP_GIFT_NAME,
          description: 'A small tip to show appreciation',
          coinPrice: 1,
          imageUrl: '/gifts/penny-tip.png',
          isActive: true,
          sortOrder: 0,
        },
      });
    }

    return pennyTipGift.id;
  }
}
