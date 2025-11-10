Based on my research, here's how **Dodo Payments** fits with your coin monetization plan:

## 🦤 Dodo Payments - Quick Overview

Dodo Payments is an India-based payment platform that functions as a Merchant of Record (MoR), handling payment processing, tax calculations, and compliance for businesses dealing with international customers. It charges 4% + 40¢ per transaction.

## ✅ Perfect Fit for Your App

**Why Dodo Works Well:**
1. **India-Friendly** - Built specifically for Indian founders, onboarding in under 5 minutes
2. **Multiple Payment Methods** - Supports UPI, cards, and 30+ payment methods from 150+ countries
3. **High Success Rates** - Claims 90%+ payment success rates vs 60% from domestic gateways
4. **Easy Integration** - Has adapters for Express, Next.js, and React with under 10 lines of code

## 🔗 Integration in Your StreamIt App

### Backend Setup (`backend/src/services/payment.service.ts`)

**What Dodo Does:**
- You create coin packages in Dodo dashboard
- When user clicks "Buy Coins", you call Dodo API
- Dodo generates payment link with all payment methods
- User completes payment (UPI/cards/etc)
- Dodo sends webhook to your server
- You credit coins to user's wallet

**Key Points:**
- Uses TypeScript SDK: `import DodoPayments from 'dodopayments'`
- Create payment with product_cart and customer details
- Store Dodo's `payment_id` in your `CoinPurchase` table
- Verify webhook signature before crediting coins

### Where It Fits in Your Schema

Your `CoinPurchase` model already has:
- `paymentGateway: String` → Store "dodo"
- `transactionId: String` → Store Dodo's payment_id
- `paymentData: Json` → Store full Dodo response

### Routes You'll Create

```
POST /api/coins/purchase
  → Call Dodo API
  → Get payment_link
  → Create CoinPurchase (status: PENDING)
  → Return link to frontend

POST /api/webhook/dodo
  → Verify webhook signature
  → Update CoinPurchase status
  → Credit coins to wallet
  → Create transaction log
```

## 💰 Pricing Impact

Dodo charges 4% + 40¢ per transaction

**Example:** User buys ₹999 coin package
- Dodo fee: ₹999 × 4% + ₹28 = ₹68
- You receive: ₹931
- Platform commission on gifts: You earn 25% when coins are spent

**Your actual revenue comes from commission, not coin sales!**

## 🚀 Implementation Steps

1. **Setup Dodo Account** - Sign up at dodopayments.com
2. **Create Products** - Create coin packages in Dodo dashboard (₹299, ₹999, etc)
3. **Get API Keys** - From Dodo settings
4. **Install SDK** - `bun add dodopayments`
5. **Build Purchase Flow** - Create payment links via API
6. **Setup Webhooks** - Configure webhook URL for payment confirmations
7. **Test** - Use test card 4242 4242 4242 4242

## ⚠️ Important Considerations

**Merchant of Record Model:**
Dodo acts as the foreign seller and remits settlement to your Indian business as export service payment - This handles RBI/FEMA compliance automatically.

**Not Suitable For:**
Not meant for freelancers or service providers - specifically for digital products like your virtual coins

**Settlement Time:** Typically 24-48 hours to your bank

## 📝 Simple Summary

**Use Dodo For:** Selling coin packages to users (₹299, ₹999 packs)

**Integration:** 
- Backend: Dodo TypeScript SDK
- Frontend: Display packages → Call your API → Redirect to Dodo payment link → Handle webhook
- Fits perfectly with your existing `CoinPurchase` and `CoinWallet` schema

**Cost:** 4% + ₹28 per transaction (built into your pricing)

Dodo is ideal for your use case - it's literally built for Indian SaaS selling virtual goods globally!

// MONETIZATION MODELS
// ============================================

// User's coin wallet
model CoinWallet {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  balance       Int      @default(0) // Current coin balance
  totalEarned   Int      @default(0) // Lifetime earnings (for creators)
  totalSpent    Int      @default(0) // Lifetime spending (for viewers)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@map("coin_wallet")
}

// Coin packages available for purchase
model CoinPackage {
  id            String   @id @default(cuid())
  name          String   // e.g., "Starter Pack", "Premium Pack"
  coins         Int      // Number of coins in package
  price         Int      // Price in smallest currency unit (paise for INR)
  currency      String   @default("INR")
  
  // Bonus and promotions
  bonusCoins    Int      @default(0) // Bonus coins given with purchase
  isActive      Boolean  @default(true)
  isFeatured    Boolean  @default(false)
  
  // Metadata
  description   String?
  icon          String?  // Icon/image for the package
  sortOrder     Int      @default(0)
  
  purchases     CoinPurchase[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([isActive, sortOrder])
  @@map("coin_package")
}

// Record of coin purchases
model CoinPurchase {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  packageId         String
  package           CoinPackage     @relation(fields: [packageId], references: [id])
  
  // Purchase details
  coins             Int             // Coins purchased (base amount)
  bonusCoins        Int             @default(0)
  totalCoins        Int             // coins + bonusCoins
  amount            Int             // Amount paid in smallest currency unit
  currency          String          @default("INR")
  
  // Payment details
  paymentMethod     PaymentMethod
  paymentGateway    String?         // e.g., "razorpay", "stripe", "google_play"
  transactionId     String?         @unique // External transaction ID
  orderId           String          @unique // Internal order ID
  
  // Status tracking
  status            PurchaseStatus  @default(PENDING)
  failureReason     String?
  
  // Payment gateway response (store as JSON)
  paymentData       Json?
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([userId, status])
  @@index([status, createdAt])
  @@index([transactionId])
  @@map("coin_purchase")
}

// Virtual gifts that users can send to creators
model Gift {
  id            String      @id @default(cuid())
  name          String      // e.g., "Heart", "Diamond", "Crown"
  description   String?
  
  // Gift properties
  coinPrice     Int         // Cost in coins
  category      GiftCategory @default(EMOJI)
  
  // Visual representation
  imageUrl      String      // Static image
  animationUrl  String?     // Animation URL (Lottie JSON or GIF)
  thumbnailUrl  String?
  
  // Rarity and features
  rarity        GiftRarity  @default(COMMON)
  isActive      Boolean     @default(true)
  isFeatured    Boolean     @default(false)
  isLimited     Boolean     @default(false) // Limited edition gifts
  
  // Sorting and display
  sortOrder     Int         @default(0)
  
  // Usage tracking
  giftsSent     GiftTransaction[]
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([category, isActive])
  @@index([rarity, sortOrder])
  @@map("gift")
}

// Record of gifts sent from users to creators
model GiftTransaction {
  id            String   @id @default(cuid())
  
  // Parties involved
  senderId      String
  sender        User     @relation("GiftsSent", fields: [senderId], references: [id], onDelete: Cascade)
  
  receiverId    String
  receiver      User     @relation("GiftsReceived", fields: [receiverId], references: [id], onDelete: Cascade)
  
  giftId        String
  gift          Gift     @relation(fields: [giftId], references: [id])
  
  // Transaction details
  coinAmount    Int      // Coins deducted from sender
  quantity      Int      @default(1) // Number of gifts sent
  
  // Context
  streamId      String?  // If sent during a live stream
  stream        Stream?  @relation(fields: [streamId], references: [id], onDelete: SetNull)
  
  postId        String?  // If sent on a post
  post          Post?    @relation(fields: [postId], references: [id], onDelete: SetNull)
  
  message       String?  // Optional message with gift
  
  createdAt     DateTime @default(now())

  @@index([senderId])
  @@index([receiverId])
  @@index([streamId, createdAt])
  @@index([createdAt])
  @@map("gift_transaction")
}

// Likes converted to penny tips
model LikeTip {
  id            String   @id @default(cuid())
  
  // User who liked (sender of tip)
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Creator who received the tip
  creatorId     String
  creator       User     @relation("TipsReceived", fields: [creatorId], references: [id], onDelete: Cascade)
  
  // Tip details
  coinAmount    Int      // Small amount (e.g., 1-5 coins per like)
  
  // Context
  postId        String?
  post          Post?    @relation(fields: [postId], references: [id], onDelete: SetNull)
  
  commentId     String?
  comment       Comment? @relation(fields: [commentId], references: [id], onDelete: SetNull)
  
  streamId      String?
  stream        Stream?  @relation(fields: [streamId], references: [id], onDelete: SetNull)
  
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([creatorId])
  @@index([createdAt])
  @@map("like_tip")
}

// Premium paid streams
model PremiumStream {
  id            String          @id @default(cuid())
  streamId      String          @unique
  stream        Stream          @relation(fields: [streamId], references: [id], onDelete: Cascade)
  
  // Pricing
  entryPrice    Int             // Coins required to enter
  
  // Access control
  maxViewers    Int?            // Maximum number of viewers (null = unlimited)
  isInviteOnly  Boolean         @default(false)
  
  // Scheduling
  scheduledAt   DateTime?       // When the stream is scheduled
  startsAt      DateTime?       // Actual start time
  endsAt        DateTime?       // Actual end time
  
  // Access tracking
  accesses      PremiumStreamAccess[]
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([scheduledAt])
  @@map("premium_stream")
}

// Track who has paid to access premium streams
model PremiumStreamAccess {
  id                String        @id @default(cuid())
  
  premiumStreamId   String
  premiumStream     PremiumStream @relation(fields: [premiumStreamId], references: [id], onDelete: Cascade)
  
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Payment details
  coinsPaid         Int
  
  // Access details
  grantedAt         DateTime      @default(now())
  expiresAt         DateTime?     // Optional expiration
  
  createdAt         DateTime      @default(now())

  @@unique([premiumStreamId, userId])
  @@index([userId])
  @@index([premiumStreamId])
  @@map("premium_stream_access")
}

// Creator earnings and withdrawal management
model CreatorEarnings {
  id                String   @id @default(cuid())
  creatorId         String   @unique
  creator           User     @relation("CreatorEarnings", fields: [creatorId], references: [id], onDelete: Cascade)
  
  // Earnings breakdown
  totalEarned       Int      @default(0) // Total coins earned (before commission)
  platformCommission Int     @default(0) // Total commission taken by platform
  availableBalance  Int      @default(0) // Coins available for withdrawal
  totalWithdrawn    Int      @default(0) // Total coins withdrawn
  
  // Earnings sources
  fromGifts         Int      @default(0)
  fromTips          Int      @default(0)
  fromPremiumStreams Int     @default(0)
  
  // Withdrawal settings
  minimumWithdrawal Int      @default(1000) // Minimum coins needed to withdraw
  
  withdrawals       Withdrawal[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([creatorId])
  @@map("creator_earnings")
}

// Withdrawal requests and history
model Withdrawal {
  id                String            @id @default(cuid())
  
  creatorId         String
  creator           User              @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  earningsId        String
  earnings          CreatorEarnings   @relation(fields: [earningsId], references: [id], onDelete: Cascade)
  
  // Withdrawal details
  coinAmount        Int               // Coins being withdrawn
  inrAmount         Int               // Equivalent INR amount (in paise)
  conversionRate    Float             // Coins to INR rate at time of withdrawal
  
  // Status tracking
  status            WithdrawalStatus  @default(PENDING)
  
  // Bank transfer details
  accountHolderName String?
  accountNumber     String?           // Should be encrypted
  ifscCode          String?
  upiId             String?
  
  // Processing
  processedAt       DateTime?
  processedBy       String?           // Admin ID who processed
  transactionId     String?           // Bank transaction ID
  rejectionReason   String?
  
  // Metadata
  requestedAt       DateTime          @default(now())
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([creatorId, status])
  @@index([status, requestedAt])
  @@map("withdrawal")
}

// Transaction log for audit trail
model CoinTransaction {
  id            String              @id @default(cuid())
  
  userId        String
  user          User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Transaction details
  type          TransactionType
  amount        Int                 // Positive for credits, negative for debits
  balanceBefore Int
  balanceAfter  Int
  
  // Context and description
  description   String
  referenceType String?             // e.g., "gift", "purchase", "tip", "withdrawal"
  referenceId   String?             // ID of related record
  
  // Metadata
  metadata      Json?               // Additional transaction data
  
  createdAt     DateTime            @default(now())

  @@index([userId, createdAt])
  @@index([type, createdAt])
  @@map("coin_transaction")
}

// Platform settings and commission rates
model PlatformSettings {
  id                    String   @id @default(cuid())
  
  // Commission rates (stored as percentage * 100, e.g., 2500 = 25%)
  giftCommissionRate    Int      @default(2500) // 25%
  tipCommissionRate     Int      @default(1000) // 10%
  streamCommissionRate  Int      @default(3000) // 30%
  
  // Conversion rates
  coinsToInrRate        Float    @default(1.0) // 1 coin = 1 INR by default
  
  // Withdrawal settings
  minimumWithdrawal     Int      @default(1000) // Minimum coins
  withdrawalProcessingDays Int   @default(7)   // Days to process
  
  // Like tip settings
  likeTipAmount         Int      @default(1)   // Coins per like
  likeTipEnabled        Boolean  @default(true)
  
  updatedAt             DateTime @updatedAt
  createdAt             DateTime @default(now())

  @@map("platform_settings")
}

// ============================================
// ENUMS
// ============================================

enum PaymentMethod {
  UPI
  CREDIT_CARD
  DEBIT_CARD
  NET_BANKING
  GOOGLE_PAY
  APPLE_PAY
  RAZORPAY
  STRIPE
}

enum PurchaseStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum GiftCategory {
  EMOJI
  STICKER
  ANIMATION
  SPECIAL_EFFECT
  BADGE
}

enum GiftRarity {
  COMMON
  RARE
  EPIC
  LEGENDARY
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  PROCESSING
  COMPLETED
  REJECTED
  CANCELLED
}

enum TransactionType {
  PURCHASE           // User buys coins
  GIFT_SENT          // User sends gift
  GIFT_RECEIVED      // Creator receives gift
  TIP_SENT           // User sends tip (like)
  TIP_RECEIVED       // Creator receives tip
  STREAM_ACCESS      // User pays for premium stream
  STREAM_EARNING     // Creator earns from premium stream
  WITHDRAWAL         // Creator withdraws money
  COMMISSION         // Platform commission deduction
  REFUND             // Refund to user
  BONUS              // Bonus coins
  ADMIN_ADJUSTMENT   // Manual adjustment by admin
}

// ============================================
// UPDATE EXISTING MODELS
// ============================================

// Add to User model:
model User {
  // ... existing fields ...
  
  // Monetization relationships
  coinWallet            CoinWallet?
  coinPurchases         CoinPurchase[]
  coinTransactions      CoinTransaction[]
  
  // Gifts
  giftsSent             GiftTransaction[] @relation("GiftsSent")
  giftsReceived         GiftTransaction[] @relation("GiftsReceived")
  
  // Tips
  likeTips              LikeTip[]
  tipsReceived          LikeTip[] @relation("TipsReceived")
  
  // Premium streams
  premiumStreamAccesses PremiumStreamAccess[]
  
  // Creator earnings
  creatorEarnings       CreatorEarnings? @relation("CreatorEarnings")
  withdrawals           Withdrawal[]
  
  // ... rest of existing fields ...
}

// Add to Stream model:
model Stream {
  // ... existing fields ...
  
  // Monetization
  premiumStream     PremiumStream?
  giftTransactions  GiftTransaction[]
  likeTips          LikeTip[]
  
  // ... rest of existing fields ...
}

// Add to Post model:
model Post {
  // ... existing fields ...
  
  // Monetization
  giftTransactions  GiftTransaction[]
  likeTips          LikeTip[]
  
  // ... rest of existing fields ...
}

// Add to Comment model:
model Comment {
  // ... existing fields ...
  
  // Monetization
  likeTips          LikeTip[]
  
  // ... rest of existing fields ...
}





# 🪙 Coin System Integration Guide

## Overview
This document explains how to integrate the monetization system into your existing StreamIt app without code examples - just clear explanations of what goes where and how it connects.

---

## 1. 📊 Database Schema Integration

### How the New Models Connect to Your Existing Schema

#### **User Model Extensions**
Your existing `User` model needs these new relationships added:
- `coinWallet` - One-to-one with CoinWallet (every user gets a wallet)
- `coinPurchases` - One-to-many (user's coin purchase history)
- `giftsSent` and `giftsReceived` - Track gifts sent/received
- `likeTips` and `tipsReceived` - Track tips given/received
- `creatorEarnings` - One-to-one for approved creators only
- `withdrawals` - One-to-many for creator payout requests

**When to create wallet:** Automatically create when user signs up or on first coin-related action

#### **Stream Model Extensions**
Your existing `Stream` model connects to:
- `premiumStream` - One-to-one (optional, only if stream is paid)
- `giftTransactions` - Track gifts sent during this stream
- `likeTips` - Track tips received during stream

**Connection point:** When creator creates a stream, they can optionally make it premium by creating a linked PremiumStream record

#### **Post Model Extensions**
Your existing `Post` model connects to:
- `giftTransactions` - Users can send gifts on posts (like Super Likes)
- `likeTips` - Automatic penny tips when users like posts

**Connection point:** When user likes a post, it triggers both Like record creation AND LikeTip creation

#### **Comment Model Extensions**
Your existing `Comment` model connects to:
- `likeTips` - Tips generated when users like comments

**Connection point:** When CommentLike is created, also create LikeTip

---

## 2. 🔄 Integration Points in Your App

### A. User Registration Flow
**Where:** Your existing signup endpoint
**Add:** After creating User → Create CoinWallet with 0 balance
**Why:** Every user needs a wallet from day one

### B. Creator Application Approval
**Where:** Your admin panel that approves creator applications
**Add:** When status changes to APPROVED → Create CreatorEarnings record
**Why:** Only approved creators can earn money

### C. Live Streaming
**Where:** Your existing stream creation/management endpoints

**For Regular Streams:**
- No changes needed - works as before
- Just track GiftTransaction and LikeTip during stream

**For Premium Streams:**
- Creator sets entry price during stream creation
- Create PremiumStream record linked to Stream
- Before viewer joins → Check if they've paid (PremiumStreamAccess)
- If not paid → Deduct coins → Create access record → Allow entry

### D. Social Interactions

**Existing Like System:**
Currently: User → clicks like → creates Like record
**Add:** After creating Like → Also create LikeTip → Transfer 1 coin to creator → Update earnings

**Existing Follow System:**
No changes needed - works independently

**Gift System (New):**
- Add gift icon on streams/posts
- User clicks → selects gift → pays coins → creates GiftTransaction
- Real-time gift animation shown to all viewers
- Coins transferred to creator with commission deducted

### E. Posts and Content
**Where:** Your existing post creation/viewing flows
**Add:** 
- Display gift button on posts
- Track gifts sent on specific posts
- Show total gifts received on creator's posts

---

## 3. 🎯 Backend Structure

### New Service Files to Create

**Location:** `backend/src/services/`

1. **coinWallet.service.ts**
   - Handles all wallet operations (get balance, add coins, deduct coins)
   - Used by: All monetization features

2. **coinPurchase.service.ts**
   - Integrates with payment gateways (Razorpay/Stripe)
   - Handles purchase flow: initiate → verify → add coins
   - Used by: Purchase coin packages endpoint

3. **gift.service.ts**
   - Send gift logic
   - Validate sender has coins
   - Transfer coins to receiver
   - Create gift transaction
   - Used by: Send gift endpoint

4. **tip.service.ts**
   - Automatic tip on like
   - Transfer penny amounts
   - Used by: Like endpoints (posts, comments)

5. **premiumStream.service.ts**
   - Check access to premium streams
   - Purchase stream access
   - Used by: Stream viewing endpoints

6. **earnings.service.ts**
   - Track creator earnings
   - Calculate commissions
   - Handle withdrawal requests
   - Used by: Creator dashboard, admin panel

### New Controller Files to Create

**Location:** `backend/src/controllers/`

1. **coin.controller.ts**
   - Get user wallet balance
   - Get coin packages list
   - Initiate coin purchase
   - Verify payment and credit coins

2. **gift.controller.ts**
   - Get available gifts list
   - Send gift (deduct coins, create transaction)
   - Get gift history

3. **premium.controller.ts**
   - Create premium stream
   - Purchase stream access
   - Check user access

4. **earnings.controller.ts**
   - Get earnings dashboard
   - Request withdrawal
   - Get withdrawal history

### New Route Files to Create

**Location:** `backend/src/routes/`

1. **coin.routes.ts**
   ```
   GET /api/coins/balance - Get user's coin balance
   GET /api/coins/packages - List available packages
   POST /api/coins/purchase - Initiate purchase
   POST /api/coins/verify-payment - Verify and complete purchase
   GET /api/coins/transactions - Get transaction history
   ```

2. **gift.routes.ts**
   ```
   GET /api/gifts - List all available gifts
   POST /api/gifts/send - Send a gift
   GET /api/gifts/history - User's gift history
   GET /api/gifts/received - Gifts received by creator
   ```

3. **premium.routes.ts**
   ```
   POST /api/premium/stream - Make stream premium
   POST /api/premium/purchase-access - Buy stream access
   GET /api/premium/my-access - User's purchased streams
   ```

4. **earnings.routes.ts**
   ```
   GET /api/earnings/dashboard - Creator earnings overview
   POST /api/earnings/withdraw - Request withdrawal
   GET /api/earnings/withdrawals - Withdrawal history
   PATCH /api/earnings/withdrawals/:id - Admin: Process withdrawal
   ```

### Where to Register Routes

**Location:** `backend/src/index.ts` (or your main app file)
**Add:** Import and use these new route files alongside your existing routes

---

## 4. 🎨 Frontend Structure

### New Pages to Create

**Location:** `frontend/src/pages/`

1. **CoinShop.tsx**
   - Display coin packages
   - Purchase flow
   - Transaction history
   - Path: `/coins/shop`

2. **CreatorEarnings.tsx**
   - Dashboard for creators
   - Show earnings breakdown
   - Withdrawal interface
   - Path: `/creator/earnings`

3. **WithdrawalHistory.tsx**
   - List of withdrawal requests
   - Status tracking
   - Path: `/creator/withdrawals`

### New Components to Create

**Location:** `frontend/src/components/`

1. **Wallet/**
   - `CoinBalance.tsx` - Display user's coin count (header/navbar)
   - `CoinPackageCard.tsx` - Package selection card
   - `PurchaseModal.tsx` - Payment gateway modal
   - `TransactionItem.tsx` - Single transaction row

2. **Gifts/**
   - `GiftPicker.tsx` - Modal to select and send gift
   - `GiftAnimation.tsx` - Display gift animations on screen
   - `GiftHistory.tsx` - List of gifts sent/received
   - `GiftButton.tsx` - Gift icon button (on streams/posts)

3. **Premium/**
   - `PremiumStreamBadge.tsx` - Badge showing stream is paid
   - `PremiumAccessModal.tsx` - Purchase access modal
   - `PremiumStreamForm.tsx` - Creator form to set stream price

4. **Earnings/**
   - `EarningsCard.tsx` - Show earnings stats
   - `WithdrawalForm.tsx` - Request withdrawal form
   - `WithdrawalStatusBadge.tsx` - Status indicator
   - `EarningsChart.tsx` - Visual earnings over time

### Where to Add Components in Existing Pages

**Stream Page (when viewing live stream):**
- Add `<CoinBalance />` in header
- Add `<GiftButton />` in chat sidebar
- Add `<GiftAnimation />` overlay on video player
- Add `<PremiumAccessModal />` if stream is locked

**Post Page/Card:**
- Add `<GiftButton />` near like button
- Add gift count display next to likes/comments

**User Profile Page:**
- Add coin balance display
- If creator: Add link to earnings dashboard
- Show gifts received statistics

**Navigation/Header:**
- Add `<CoinBalance />` component
- Add "Buy Coins" link/button

**Creator Dashboard:**
- New "Earnings" tab
- Display `<EarningsCard />` components
- Add withdrawal section

---

## 5. 🔗 Integration with Existing Features

### Modify Existing Like Handler

**Where:** Your current like button click handler

**Current Flow:**
1. User clicks like button
2. Call API to create Like record
3. Update UI optimistically

**New Flow:**
1. User clicks like button
2. Call API to create Like record
3. **API also creates LikeTip (1 coin to creator)**
4. **Update sender's coin balance**
5. **Update creator's earnings**
6. Update UI optimistically
7. Show brief notification: "+1 coin to creator"

### Modify Stream Join Flow

**Where:** Your stream viewer page load logic

**Current Flow:**
1. User navigates to stream page
2. Load stream details
3. Connect to LiveKit
4. Start playing

**New Flow:**
1. User navigates to stream page
2. Load stream details
3. **Check if stream is premium**
4. **If premium:**
   - Check if user has access (PremiumStreamAccess)
   - If no access → Show PremiumAccessModal
   - User pays coins → Create access record
   - Then proceed to connect
5. Connect to LiveKit
6. Start playing
7. **Enable gift sending feature in chat**

### Modify Creator Application Approval

**Where:** Admin panel approval endpoint

**Current Flow:**
1. Admin reviews application
2. Updates status to APPROVED
3. Notifies creator

**New Flow:**
1. Admin reviews application
2. Updates status to APPROVED
3. **Create CreatorEarnings record for user**
4. **Create Stream record (or allow creator to create)**
5. Notifies creator
6. Creator can now earn from content

---

## 6. 💳 Payment Gateway Integration

### Where to Integrate Razorpay/Stripe

**Backend Location:** `backend/src/services/payment.service.ts`

**Process:**
1. User selects coin package on frontend
2. Frontend calls `/api/coins/purchase` with package ID
3. Backend creates order with payment gateway
4. Backend creates CoinPurchase record with status PENDING
5. Returns payment gateway order details to frontend
6. Frontend opens payment gateway modal
7. User completes payment
8. Payment gateway sends webhook to your server
9. Webhook handler verifies payment signature
10. Updates CoinPurchase status to COMPLETED
11. Credits coins to user's wallet
12. Creates CoinTransaction record

**Webhook Endpoint:** `POST /api/webhook/payment`
**Must verify:** Payment signature to prevent fraud

---

## 7. 🎭 UI/UX Integration Points

### Header/Navbar Changes
- Add coin balance display (always visible)
- Add "Buy Coins" quick link
- Show coin icon with balance count

### Stream Page Changes
- Gift button in chat interface
- Gift animations overlay on video
- Premium lock screen if not purchased
- Show total gifts received counter

### Profile Page Changes
- For viewers: Show coins spent stats
- For creators: Show earnings stats
- Display "Top Supporter" badges (users who sent most gifts)

### Creator Dashboard New Tab
- "Earnings" section
- Real-time earnings updates
- Withdrawal interface
- Transaction history

### Admin Panel New Sections
- Coin purchase monitoring
- Withdrawal request management
- Gift transaction logs
- Revenue analytics

---

## 8. 🔐 Security Considerations

### Wallet Operations
- Always validate coin balance before deducting
- Use database transactions to prevent race conditions
- Never allow negative balances

### Payment Processing
- Always verify payment gateway webhooks
- Store payment gateway transaction IDs
- Never trust client-side payment confirmation

### Withdrawal Processing
- Require additional authentication for withdrawals
- Implement minimum withdrawal limits
- Manual admin approval before processing
- Store encrypted bank details

### Gift Sending
- Rate limit gift sending (prevent spam)
- Validate gift exists and is active
- Check sender has sufficient balance
- Verify receiver is valid creator

---

## 9. 📱 Real-time Features

### Where to Use WebSocket/LiveKit

**Gift Animations:**
- When gift sent during live stream
- Broadcast to all viewers in room
- Display animated gift on everyone's screen
- Use LiveKit data messages or separate WebSocket

**Earnings Updates:**
- When creator receives gift/tip
- Update earnings counter in real-time
- Push notification to creator

**Coin Balance Updates:**
- When user purchases coins
- When user sends gift
- Update header balance display

---

## 10. 📊 Analytics & Tracking

### New Data to Track

**User Analytics:**
- Total coins purchased
- Total coins spent
- Favorite gift types
- Spending patterns

**Creator Analytics:**
- Earnings by source (gifts, tips, premium)
- Top supporters (who sent most gifts)
- Average earnings per stream
- Withdrawal patterns

**Platform Analytics:**
- Total revenue
- Commission earned
- Most popular gifts
- Conversion rate (users who buy coins)

### Where to Display
- Creator dashboard
- Admin panel
- User profile statistics

---

## 11. ✅ Step-by-Step Implementation Order

### Phase 1: Core Infrastructure
1. Add schema changes to Prisma
2. Run migration
3. Seed initial data (packages, gifts, settings)
4. Create wallet service
5. Auto-create wallets for existing users

### Phase 2: Coin Purchase
1. Create payment service
2. Add coin purchase routes
3. Build coin shop page
4. Integrate payment gateway
5. Test purchase flow

### Phase 3: Basic Gifting
1. Create gift service
2. Add gift routes
3. Build gift picker component
4. Add gift button to streams
5. Test gift sending

### Phase 4: Automatic Tips
1. Modify like endpoints
2. Add tip logic to likes
3. Update like button UI
4. Test tip flow

### Phase 5: Premium Streams
1. Create premium stream service
2. Add premium routes
3. Modify stream creation UI
4. Add access check to viewer
5. Build purchase modal

### Phase 6: Creator Earnings
1. Create earnings service
2. Build earnings dashboard
3. Add withdrawal system
4. Build admin withdrawal panel
5. Test payout flow

### Phase 7: Real-time & Polish
1. Add gift animations
2. Real-time balance updates
3. Notifications
4. Analytics
5. Testing & bug fixes

---

## 12. 🧪 Testing Checklist

### Must Test
- [ ] Wallet creation on signup
- [ ] Coin purchase flow (all payment methods)
- [ ] Gift sending (sufficient/insufficient balance)
- [ ] Automatic tips on likes
- [ ] Premium stream access purchase
- [ ] Creator earnings accumulation
- [ ] Commission calculations
- [ ] Withdrawal request flow
- [ ] Admin withdrawal processing
- [ ] Transaction logging accuracy
- [ ] Concurrent transactions (race conditions)
- [ ] Payment webhook verification
- [ ] Negative balance prevention

---

## 13. 🚀 Deployment Considerations

### Environment Variables to Add
```
# Payment Gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Coin Settings
DEFAULT_COMMISSION_RATE=25
MIN_WITHDRAWAL_AMOUNT=1000
COINS_TO_INR_RATE=1.0
```

### Database Backups
- Wallet balances are critical
- Backup before major updates
- Test rollback procedures

### Monitoring
- Alert on failed payments
- Monitor wallet balance inconsistencies
- Track unusual spending patterns
- Alert on large withdrawals

---

This integration guide provides the blueprint for adding monetization to your existing StreamIt app without changing your core functionality. Each feature builds on top of what you already have.