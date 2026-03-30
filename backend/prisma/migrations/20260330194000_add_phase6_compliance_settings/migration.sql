-- CreateEnum
CREATE TYPE "LegalCaseType" AS ENUM ('COPYRIGHT', 'PLATFORM_POLICY', 'REGULATORY', 'PRIVACY', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "LegalCaseStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TakedownReason" AS ENUM ('COPYRIGHT', 'LEGAL_ORDER', 'PLATFORM_POLICY', 'SAFETY', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "TakedownStatus" AS ENUM ('PENDING', 'EXECUTED', 'APPEALED', 'REVERSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GeoBlockReason" AS ENUM ('LEGAL', 'LICENSING', 'REGULATORY', 'SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "GeoBlockStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterEnum
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SETTING_ROLLED_BACK';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'LEGAL_CASE_CREATED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'LEGAL_CASE_STATUS_CHANGED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'LEGAL_CASE_ASSIGNED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'TAKEDOWN_CREATED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'TAKEDOWN_EXECUTED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'TAKEDOWN_APPEALED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'TAKEDOWN_REVERSED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'GEOBLOCK_CREATED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'GEOBLOCK_UPDATED';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'GEOBLOCK_REMOVED';

-- CreateTable
CREATE TABLE "legal_case" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "caseType" "LegalCaseType" NOT NULL,
    "status" "LegalCaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takedown_request" (
    "id" TEXT NOT NULL,
    "legalCaseId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "TakedownReason" NOT NULL,
    "status" "TakedownStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "executionNote" TEXT,
    "appealNote" TEXT,
    "requestedBy" TEXT NOT NULL,
    "executedBy" TEXT,
    "reversedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "appealedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "takedown_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_block_rule" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "reason" "GeoBlockReason" NOT NULL,
    "status" "GeoBlockStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_block_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting_version" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT NOT NULL,
    "previousIsPublic" BOOLEAN,
    "newIsPublic" BOOLEAN NOT NULL,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "rollbackOfVersionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_setting_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_case_referenceCode_key" ON "legal_case"("referenceCode");

-- CreateIndex
CREATE INDEX "legal_case_status_caseType_idx" ON "legal_case"("status", "caseType");

-- CreateIndex
CREATE INDEX "legal_case_targetType_targetId_idx" ON "legal_case"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "legal_case_assignedTo_idx" ON "legal_case"("assignedTo");

-- CreateIndex
CREATE INDEX "legal_case_createdAt_idx" ON "legal_case"("createdAt");

-- CreateIndex
CREATE INDEX "takedown_request_status_reason_idx" ON "takedown_request"("status", "reason");

-- CreateIndex
CREATE INDEX "takedown_request_targetType_targetId_idx" ON "takedown_request"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "takedown_request_legalCaseId_idx" ON "takedown_request"("legalCaseId");

-- CreateIndex
CREATE INDEX "takedown_request_requestedAt_idx" ON "takedown_request"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "geo_block_rule_targetType_targetId_countryCode_key" ON "geo_block_rule"("targetType", "targetId", "countryCode");

-- CreateIndex
CREATE INDEX "geo_block_rule_status_countryCode_idx" ON "geo_block_rule"("status", "countryCode");

-- CreateIndex
CREATE INDEX "geo_block_rule_targetType_targetId_idx" ON "geo_block_rule"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "geo_block_rule_createdAt_idx" ON "geo_block_rule"("createdAt");

-- CreateIndex
CREATE INDEX "system_setting_version_settingKey_createdAt_idx" ON "system_setting_version"("settingKey", "createdAt");

-- CreateIndex
CREATE INDEX "system_setting_version_changedBy_idx" ON "system_setting_version"("changedBy");

-- CreateIndex
CREATE INDEX "system_setting_version_rollbackOfVersionId_idx" ON "system_setting_version"("rollbackOfVersionId");

-- AddForeignKey
ALTER TABLE "takedown_request" ADD CONSTRAINT "takedown_request_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
