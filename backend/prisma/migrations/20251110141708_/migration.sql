-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "coin_wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "totalCoins" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentGateway" TEXT DEFAULT 'dodo',
    "transactionId" TEXT,
    "orderId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "paymentData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coinPrice" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "animationUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_transaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "coinAmount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "streamId" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coin_wallet_userId_key" ON "coin_wallet"("userId");

-- CreateIndex
CREATE INDEX "coin_wallet_userId_idx" ON "coin_wallet"("userId");

-- CreateIndex
CREATE INDEX "coin_package_isActive_sortOrder_idx" ON "coin_package"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "coin_purchase_transactionId_key" ON "coin_purchase"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "coin_purchase_orderId_key" ON "coin_purchase"("orderId");

-- CreateIndex
CREATE INDEX "coin_purchase_userId_status_idx" ON "coin_purchase"("userId", "status");

-- CreateIndex
CREATE INDEX "coin_purchase_status_createdAt_idx" ON "coin_purchase"("status", "createdAt");

-- CreateIndex
CREATE INDEX "coin_purchase_transactionId_idx" ON "coin_purchase"("transactionId");

-- CreateIndex
CREATE INDEX "gift_isActive_sortOrder_idx" ON "gift"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "gift_transaction_senderId_idx" ON "gift_transaction"("senderId");

-- CreateIndex
CREATE INDEX "gift_transaction_receiverId_idx" ON "gift_transaction"("receiverId");

-- CreateIndex
CREATE INDEX "gift_transaction_streamId_createdAt_idx" ON "gift_transaction"("streamId", "createdAt");

-- CreateIndex
CREATE INDEX "gift_transaction_createdAt_idx" ON "gift_transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "coin_wallet" ADD CONSTRAINT "coin_wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_purchase" ADD CONSTRAINT "coin_purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_purchase" ADD CONSTRAINT "coin_purchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "coin_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_transaction" ADD CONSTRAINT "gift_transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_transaction" ADD CONSTRAINT "gift_transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_transaction" ADD CONSTRAINT "gift_transaction_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_transaction" ADD CONSTRAINT "gift_transaction_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;
