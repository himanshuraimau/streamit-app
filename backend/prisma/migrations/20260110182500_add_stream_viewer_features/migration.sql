-- CreateEnum
CREATE TYPE "StreamReportReason" AS ENUM ('INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'VIOLENCE', 'COPYRIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "StreamReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "stream" ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "stream_report" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "StreamReportReason" NOT NULL,
    "description" TEXT,
    "status" "StreamReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stream_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stream_stats" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalViewers" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalGifts" INTEGER NOT NULL DEFAULT 0,
    "totalCoins" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stream_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stream_report_streamId_idx" ON "stream_report"("streamId");

-- CreateIndex
CREATE INDEX "stream_report_reporterId_idx" ON "stream_report"("reporterId");

-- CreateIndex
CREATE INDEX "stream_report_status_idx" ON "stream_report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "stream_stats_streamId_key" ON "stream_stats"("streamId");

-- AddForeignKey
ALTER TABLE "stream_report" ADD CONSTRAINT "stream_report_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_report" ADD CONSTRAINT "stream_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_stats" ADD CONSTRAINT "stream_stats_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
