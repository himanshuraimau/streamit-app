# Payment Implementation Guide (Dodo Payments)

## Architecture Overview

StreamIt uses a coin-based monetization system integrated with Dodo Payments for INR transactions.

### Current Backend Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers (auth, creator, social, content, stream)
│   ├── services/        # Business logic (application, content, livekit, media, stream)
│   ├── routes/          # API routes
│   ├── middleware/      # auth, upload, validation
│   └── lib/            # auth, db, s3, validations
```

## Payment Schema Integration

### Add to `prisma/schema.prisma`:

```prisma
// Coin Wallet - Every user has one
model CoinWallet {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance      Int      @default(0)
  totalEarned  Int      @default(0)  // For creators
  totalSpent   Int      @default(0)  // For viewers
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("coin_wallet")
}

// Coin Packages
model CoinPackage {
  id          String   @id @default(cuid())
  name        String
  coins       Int
  price       Int      // In paise (₹999 = 99900 paise)
  bonusCoins  Int      @default(0)
  isActive    Boolean  @default(true)
  @@map("coin_package")
}

// Purchase Records
model CoinPurchase {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  packageId       String
  package         CoinPackage @relation(fields: [packageId], references: [id])
  coins           Int
  amount          Int      // Amount paid in paise
  transactionId   String?  @unique  // Dodo payment_id
  orderId         String   @unique
  status          PurchaseStatus @default(PENDING)
  paymentData     Json?    // Store Dodo response
  createdAt       DateTime @default(now())
  @@map("coin_purchase")
}

// Gift System
model Gift {
  id        String   @id @default(cuid())
  name      String
  coinPrice Int
  imageUrl  String
  isActive  Boolean  @default(true)
  @@map("gift")
}

// Gift Transactions
model GiftTransaction {
  id         String   @id @default(cuid())
  senderId   String
  sender     User     @relation("GiftsSent", fields: [senderId], references: [id])
  receiverId String
  receiver   User     @relation("GiftsReceived", fields: [receiverId], references: [id])
  giftId     String
  gift       Gift     @relation(fields: [giftId], references: [id])
  coinAmount Int
  streamId   String?
  stream     Stream?  @relation(fields: [streamId], references: [id])
  createdAt  DateTime @default(now())
  @@map("gift_transaction")
}

enum PurchaseStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

### Update User model:
```prisma
model User {
  // ... existing fields
  coinWallet       CoinWallet?
  coinPurchases    CoinPurchase[]
  giftsSent        GiftTransaction[] @relation("GiftsSent")
  giftsReceived    GiftTransaction[] @relation("GiftsReceived")
}
```

## Implementation Steps

### 1. Environment Variables
```env
# Dodo Payments
DODO_API_KEY=your_test_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_API_URL=https://test.dodopayments.com
```

### 2. Install Dependencies
```bash
bun add dodopayments standardwebhooks
```

### 3. Create Payment Service

**File**: `src/services/payment.service.ts`

```typescript
import DodoPayments from 'dodopayments';
import { prisma } from '../lib/db';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: 'test_mode',
});

export class PaymentService {
  // Create checkout session
  static async createCheckout(userId: string, packageId: string) {
    const pkg = await prisma.coinPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new Error('Package not found');

    const orderId = `order_${Date.now()}_${userId.slice(0, 8)}`;
    
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: pkg.id, quantity: 1 }],
      customer: { /* user details */ },
      return_url: `${process.env.FRONTEND_URL}/coins/success`,
    });

    // Create pending purchase record
    await prisma.coinPurchase.create({
      data: {
        userId,
        packageId,
        coins: pkg.coins,
        amount: pkg.price,
        orderId,
        transactionId: session.payment_id,
        status: 'PENDING',
      },
    });

    return { checkoutUrl: session.checkout_url, orderId };
  }

  // Process webhook
  static async processWebhook(payload: any) {
    const purchase = await prisma.coinPurchase.findUnique({
      where: { transactionId: payload.payment_id },
    });

    if (payload.status === 'succeeded') {
      // Update purchase
      await prisma.coinPurchase.update({
        where: { id: purchase.id },
        data: { status: 'COMPLETED', paymentData: payload },
      });

      // Credit coins
      await prisma.coinWallet.upsert({
        where: { userId: purchase.userId },
        create: { userId: purchase.userId, balance: purchase.coins },
        update: { balance: { increment: purchase.coins } },
      });
    }
  }

  // Send gift (deduct coins, credit creator)
  static async sendGift(senderId: string, receiverId: string, giftId: string, streamId?: string) {
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    
    return await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const wallet = await tx.coinWallet.update({
        where: { userId: senderId },
        data: { balance: { decrement: gift.coinPrice } },
      });
      
      if (wallet.balance < 0) throw new Error('Insufficient balance');

      // Credit receiver (70% after 30% commission)
      const creatorAmount = Math.floor(gift.coinPrice * 0.7);
      await tx.coinWallet.update({
        where: { userId: receiverId },
        data: { balance: { increment: creatorAmount } },
      });

      // Record transaction
      return tx.giftTransaction.create({
        data: { senderId, receiverId, giftId, coinAmount: gift.coinPrice, streamId },
      });
    });
  }
}
```

### 4. Create Controllers

**File**: `src/controllers/payment.controller.ts`

```typescript
export class PaymentController {
  // GET /api/payment/wallet
  static async getWallet(req: Request, res: Response) {
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId: req.user!.id },
    });
    res.json({ success: true, data: wallet });
  }

  // GET /api/payment/packages
  static async getPackages(req: Request, res: Response) {
    const packages = await prisma.coinPackage.findMany({ where: { isActive: true } });
    res.json({ success: true, data: packages });
  }

  // POST /api/payment/purchase
  static async createPurchase(req: Request, res: Response) {
    const { packageId } = req.body;
    const result = await PaymentService.createCheckout(req.user!.id, packageId);
    res.json({ success: true, data: result });
  }

  // POST /api/payment/gift
  static async sendGift(req: Request, res: Response) {
    const { receiverId, giftId, streamId } = req.body;
    await PaymentService.sendGift(req.user!.id, receiverId, giftId, streamId);
    res.json({ success: true, message: 'Gift sent' });
  }
}
```

### 5. Webhook Handler

**File**: `src/controllers/webhook.controller.ts` (add to existing)

```typescript
import { Webhook } from 'standardwebhooks';

export class WebhookController {
  // POST /api/webhook/dodo
  static async handleDodoWebhook(req: Request, res: Response) {
    const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
    
    try {
      const rawBody = req.body.toString();
      await webhook.verify(rawBody, {
        "webhook-id": req.headers['webhook-id'],
        "webhook-signature": req.headers['webhook-signature'],
        "webhook-timestamp": req.headers['webhook-timestamp'],
      });
      
      const payload = JSON.parse(rawBody);
      await PaymentService.processWebhook(payload);
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid webhook' });
    }
  }
}
```

### 6. Routes

**File**: `src/routes/payment.route.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

router.get('/wallet', requireAuth, PaymentController.getWallet);
router.get('/packages', PaymentController.getPackages);
router.post('/purchase', requireAuth, PaymentController.createPurchase);
router.post('/gift', requireAuth, PaymentController.sendGift);

export default router;
```

### 7. Register Routes

**File**: `src/index.ts`

```typescript
import paymentRoutes from './routes/payment.route';

// Add webhook route (with raw body)
app.post('/api/webhook/dodo', express.raw({ type: 'application/json' }), 
  WebhookController.handleDodoWebhook);

// Add payment routes
app.use('/api/payment', paymentRoutes);
```

## Integration Points

### Auto-create wallet on signup
In `auth.controller.ts`:
```typescript
// After user creation
await prisma.coinWallet.create({
  data: { userId: newUser.id },
});
```

### Add gifts to streams
In stream viewer page, call:
```
POST /api/payment/gift
{ receiverId, giftId, streamId }
```

## Testing

1. Seed coin packages:
```typescript
await prisma.coinPackage.createMany({
  data: [
    { name: 'Starter', coins: 100, price: 9900 }, // ₹99
    { name: 'Popular', coins: 500, price: 49900, bonusCoins: 50 },
    { name: 'Premium', coins: 1000, price: 99900, bonusCoins: 150 },
  ],
});
```

2. Test with Dodo test card: `4242 4242 4242 4242`

## API Endpoints Summary

```
GET    /api/payment/wallet           - Get user's coin wallet
GET    /api/payment/packages         - Get available coin packages
POST   /api/payment/purchase         - Create checkout session
POST   /api/payment/gift             - Send gift to creator
POST   /api/webhook/dodo             - Dodo payment webhook
GET    /api/payment/gifts            - Get available gifts (add later)
GET    /api/payment/transactions     - Get purchase history (add later)
```

## Notes

- All prices in paise (₹999 = 99900)
- Commission: Platform takes 30%, creator gets 70%
- Auto-create wallet on user signup
- Use Prisma transactions for coin operations
- Verify webhook signatures always
- Store full Dodo response in `paymentData` JSON field
