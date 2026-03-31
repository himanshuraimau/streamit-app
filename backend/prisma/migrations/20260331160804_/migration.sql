-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';
ALTER TYPE "UserRole" ADD VALUE 'FINANCE_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'COMPLIANCE_OFFICER';

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creative" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "targetRegion" TEXT[],
    "targetGender" TEXT,
    "category" TEXT,
    "cpm" DOUBLE PRECISION NOT NULL,
    "frequencyCap" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_block" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "contentId" TEXT,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_adminId_idx" ON "admin_audit_log"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log"("action");

-- CreateIndex
CREATE INDEX "admin_audit_log_targetType_idx" ON "admin_audit_log"("targetType");

-- CreateIndex
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "ad_creative_isActive_idx" ON "ad_creative"("isActive");

-- CreateIndex
CREATE INDEX "ad_creative_createdAt_idx" ON "ad_creative"("createdAt");

-- CreateIndex
CREATE INDEX "geo_block_region_idx" ON "geo_block"("region");

-- CreateIndex
CREATE INDEX "geo_block_contentId_idx" ON "geo_block"("contentId");

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_block" ADD CONSTRAINT "geo_block_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
