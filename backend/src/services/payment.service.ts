import DodoPayments from 'dodopayments';
import { prisma } from '../lib/db';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY || '',
  environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
});

export class PaymentService {
  /**
   * Create checkout session for coin purchase
   */
  static async createCheckout(userId: string, packageId: string) {
    const pkg = await prisma.coinPackage.findUnique({ 
      where: { id: packageId, isActive: true } 
    });
    
    if (!pkg) {
      throw new Error('Package not found or inactive');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const orderId = `order_${Date.now()}_${userId.slice(0, 8)}`;
    const totalCoins = pkg.coins + pkg.bonusCoins;
    
    try {
      // Create checkout session with Dodo
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: pkg.id, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.name,
        },
        return_url: `${process.env.FRONTEND_URL}/coins/success?orderId=${orderId}`,
      });

      // Create pending purchase record
      await prisma.coinPurchase.create({
        data: {
          userId,
          packageId,
          coins: pkg.coins,
          bonusCoins: pkg.bonusCoins,
          totalCoins,
          amount: pkg.price,
          currency: pkg.currency,
          orderId,
          transactionId: session.session_id, // Dodo session_id
          status: 'PENDING',
          paymentGateway: 'dodo',
        },
      });

      console.log(`✅ Checkout session created: ${session.session_id} for user ${userId}`);

      return { 
        checkoutUrl: session.checkout_url, 
        orderId,
        sessionId: session.session_id 
      };
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Process Dodo webhook payment confirmation
   */
  static async processWebhook(payload: any) {
    console.log('📦 Processing webhook:', payload.event_type, payload.data?.payment_id || payload.payment_id);
    console.log('📦 Full webhook data:', JSON.stringify(payload, null, 2));

    // Extract data from payload (Dodo sends nested data object)
    const eventType = payload.event_type || payload.type;
    const paymentData = payload.data || payload;
    const paymentId = paymentData.payment_id;
    const sessionId = paymentData.checkout_session_id || paymentData.session_id;
    const status = paymentData.status || paymentData.payment_status;

    if (!paymentId && !sessionId) {
      console.error('⚠️ No payment_id or session_id found in webhook payload');
      return;
    }

    const purchase = await prisma.coinPurchase.findFirst({
      where: { 
        OR: [
          { transactionId: paymentId },
          { transactionId: sessionId }
        ]
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
          paymentData: payload,
          transactionId: paymentId || sessionId,
        },
      });

      // Credit coins to user's wallet
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
    } 
    // Handle payment failure
    else if (eventType === 'payment.failed' || status === 'failed') {
      console.log(`❌ Payment failed for purchase ${purchase.id}`);
      
      await prisma.coinPurchase.update({
        where: { id: purchase.id },
        data: { 
          status: 'FAILED', 
          failureReason: paymentData.failure_reason || 'Payment failed',
          paymentData: payload,
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
      where: { id: giftId, isActive: true } 
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
}
