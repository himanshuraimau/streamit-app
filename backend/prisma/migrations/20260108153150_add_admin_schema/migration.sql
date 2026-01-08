-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'NUDITY', 'VIOLENCE', 'COPYRIGHT', 'MISINFORMATION', 'SELF_HARM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('USER_SUSPENDED', 'USER_UNSUSPENDED', 'USER_ROLE_CHANGED', 'USER_DELETED', 'USER_UPDATED', 'POST_HIDDEN', 'POST_UNHIDDEN', 'POST_DELETED', 'COMMENT_HIDDEN', 'COMMENT_UNHIDDEN', 'COMMENT_DELETED', 'CREATOR_APPLICATION_APPROVED', 'CREATOR_APPLICATION_REJECTED', 'CREATOR_STATUS_REVOKED', 'PAYMENT_REFUNDED', 'PAYMENT_VERIFIED', 'DISCOUNT_CODE_CREATED', 'DISCOUNT_CODE_DEACTIVATED', 'REPORT_REVIEWED', 'REPORT_DISMISSED', 'SETTING_UPDATED', 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT_DELETED');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'MAINTENANCE', 'FEATURE', 'PROMOTION');

-- AlterTable
ALTER TABLE "comment" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenBy" TEXT,
ADD COLUMN     "hiddenReason" TEXT,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "post" ADD COLUMN     "flagCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenBy" TEXT,
ADD COLUMN     "hiddenReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedBy" TEXT,
ADD COLUMN     "suspendedReason" TEXT,
ADD COLUMN     "suspensionExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "streamId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedUserId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "targetRole" "UserRole",
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_reporterId_idx" ON "report"("reporterId");

-- CreateIndex
CREATE INDEX "report_reportedUserId_idx" ON "report"("reportedUserId");

-- CreateIndex
CREATE INDEX "report_status_idx" ON "report"("status");

-- CreateIndex
CREATE INDEX "report_createdAt_idx" ON "report"("createdAt");

-- CreateIndex
CREATE INDEX "report_postId_idx" ON "report"("postId");

-- CreateIndex
CREATE INDEX "report_commentId_idx" ON "report"("commentId");

-- CreateIndex
CREATE INDEX "admin_activity_log_adminId_idx" ON "admin_activity_log"("adminId");

-- CreateIndex
CREATE INDEX "admin_activity_log_affectedUserId_idx" ON "admin_activity_log"("affectedUserId");

-- CreateIndex
CREATE INDEX "admin_activity_log_action_idx" ON "admin_activity_log"("action");

-- CreateIndex
CREATE INDEX "admin_activity_log_targetType_targetId_idx" ON "admin_activity_log"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_activity_log_createdAt_idx" ON "admin_activity_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_setting_key_key" ON "system_setting"("key");

-- CreateIndex
CREATE INDEX "system_setting_key_idx" ON "system_setting"("key");

-- CreateIndex
CREATE INDEX "system_setting_isPublic_idx" ON "system_setting"("isPublic");

-- CreateIndex
CREATE INDEX "announcement_isActive_startsAt_endsAt_idx" ON "announcement"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "announcement_type_idx" ON "announcement"("type");

-- CreateIndex
CREATE INDEX "announcement_isPinned_idx" ON "announcement"("isPinned");

-- CreateIndex
CREATE INDEX "comment_isHidden_idx" ON "comment"("isHidden");

-- CreateIndex
CREATE INDEX "post_isHidden_idx" ON "post"("isHidden");

-- CreateIndex
CREATE INDEX "post_isFlagged_idx" ON "post"("isFlagged");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_isSuspended_idx" ON "user"("isSuspended");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_username_idx" ON "user"("username");

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_log" ADD CONSTRAINT "admin_activity_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_log" ADD CONSTRAINT "admin_activity_log_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
