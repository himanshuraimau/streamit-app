-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('PROMOTIONAL', 'REWARD');

-- AlterTable
ALTER TABLE "coin_purchase" ADD COLUMN     "discountBonusCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountCodeId" TEXT;

-- CreateTable
CREATE TABLE "discount_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "codeType" "CodeType" NOT NULL,
    "createdBy" TEXT,
    "ownerId" TEXT,
    "maxRedemptions" INTEGER,
    "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
    "isOneTimeUse" BOOLEAN NOT NULL DEFAULT true,
    "minPurchaseAmount" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_redemption" (
    "id" TEXT NOT NULL,
    "discountCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "bonusCoinsAwarded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_code_code_key" ON "discount_code"("code");

-- CreateIndex
CREATE INDEX "discount_code_code_idx" ON "discount_code"("code");

-- CreateIndex
CREATE INDEX "discount_code_ownerId_idx" ON "discount_code"("ownerId");

-- CreateIndex
CREATE INDEX "discount_code_codeType_isActive_idx" ON "discount_code"("codeType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "discount_redemption_purchaseId_key" ON "discount_redemption"("purchaseId");

-- CreateIndex
CREATE INDEX "discount_redemption_discountCodeId_idx" ON "discount_redemption"("discountCodeId");

-- CreateIndex
CREATE INDEX "discount_redemption_userId_idx" ON "discount_redemption"("userId");

-- AddForeignKey
ALTER TABLE "discount_code" ADD CONSTRAINT "discount_code_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "coin_purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
