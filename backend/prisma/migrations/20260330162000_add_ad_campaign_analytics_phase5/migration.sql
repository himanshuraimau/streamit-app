-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AD_CAMPAIGN_CREATED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AD_CAMPAIGN_STATUS_CHANGED';

-- CreateTable
CREATE TABLE "ad_campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "dailyBudgetPaise" INTEGER,
    "totalBudgetPaise" INTEGER,
    "spendPaise" INTEGER NOT NULL DEFAULT 0,
    "targeting" JSONB,
    "deliveryConfig" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaign_metric_daily" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "bucketDate" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spendPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaign_metric_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_campaign_status_startAt_endAt_idx" ON "ad_campaign"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "ad_campaign_createdAt_idx" ON "ad_campaign"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaign_metric_daily_campaignId_bucketDate_key" ON "ad_campaign_metric_daily"("campaignId", "bucketDate");

-- CreateIndex
CREATE INDEX "ad_campaign_metric_daily_bucketDate_idx" ON "ad_campaign_metric_daily"("bucketDate");

-- CreateIndex
CREATE INDEX "ad_campaign_metric_daily_campaignId_bucketDate_idx" ON "ad_campaign_metric_daily"("campaignId", "bucketDate");

-- AddForeignKey
ALTER TABLE "ad_campaign_metric_daily" ADD CONSTRAINT "ad_campaign_metric_daily_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
