-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ON_HOLD', 'APPROVED', 'REJECTED', 'PAID');

-- AlterEnum
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_APPROVED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REJECTED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_HOLD';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_RELEASED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_MARKED_PAID';

-- CreateTable
CREATE TABLE "creator_withdrawal_request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCoins" INTEGER NOT NULL,
    "coinToPaiseRate" INTEGER NOT NULL DEFAULT 100,
    "grossAmountPaise" INTEGER NOT NULL,
    "platformFeePaise" INTEGER NOT NULL DEFAULT 0,
    "netAmountPaise" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_withdrawal_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_withdrawal_request_userId_status_idx" ON "creator_withdrawal_request"("userId", "status");

-- CreateIndex
CREATE INDEX "creator_withdrawal_request_status_requestedAt_idx" ON "creator_withdrawal_request"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "creator_withdrawal_request_reviewedBy_idx" ON "creator_withdrawal_request"("reviewedBy");

-- CreateIndex
CREATE INDEX "creator_withdrawal_request_requestedAt_idx" ON "creator_withdrawal_request"("requestedAt");

-- AddForeignKey
ALTER TABLE "creator_withdrawal_request" ADD CONSTRAINT "creator_withdrawal_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_withdrawal_request" ADD CONSTRAINT "creator_withdrawal_request_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
