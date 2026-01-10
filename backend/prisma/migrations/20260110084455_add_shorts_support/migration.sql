-- AlterTable
ALTER TABLE "post" ADD COLUMN     "isShort" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "post_isShort_createdAt_idx" ON "post"("isShort", "createdAt");

-- CreateIndex
CREATE INDEX "post_isShort_type_isPublic_idx" ON "post"("isShort", "type", "isPublic");

-- CreateIndex
CREATE INDEX "post_isShort_viewsCount_likesCount_idx" ON "post"("isShort", "viewsCount", "likesCount");
