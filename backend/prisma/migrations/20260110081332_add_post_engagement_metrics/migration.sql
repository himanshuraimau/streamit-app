-- AlterTable
ALTER TABLE "post" ADD COLUMN     "sharesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "post_createdAt_likesCount_commentsCount_viewsCount_sharesCo_idx" ON "post"("createdAt", "likesCount", "commentsCount", "viewsCount", "sharesCount");
