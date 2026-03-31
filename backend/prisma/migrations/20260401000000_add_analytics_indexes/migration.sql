-- Add indexes for analytics queries optimization

-- User table indexes for DAU/MAU calculations
CREATE INDEX IF NOT EXISTS "user_lastLoginAt_idx" ON "user"("lastLoginAt");
CREATE INDEX IF NOT EXISTS "user_role_lastLoginAt_idx" ON "user"("role", "lastLoginAt");

-- GiftTransaction indexes for revenue calculations
CREATE INDEX IF NOT EXISTS "gift_transaction_createdAt_idx" ON "gift_transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "gift_transaction_receiverId_createdAt_idx" ON "gift_transaction"("receiverId", "createdAt");
CREATE INDEX IF NOT EXISTS "gift_transaction_senderId_createdAt_idx" ON "gift_transaction"("senderId", "createdAt");

-- StreamStats indexes for stream analytics
CREATE INDEX IF NOT EXISTS "stream_stats_startedAt_idx" ON "stream_stats"("startedAt");
CREATE INDEX IF NOT EXISTS "stream_stats_peakViewers_idx" ON "stream_stats"("peakViewers");

-- Post indexes for content analytics (already exist in schema but ensuring they're created)
-- These are already defined in schema.prisma but adding here for completeness
-- CREATE INDEX IF NOT EXISTS "post_isShort_createdAt_idx" ON "post"("isShort", "createdAt");
-- CREATE INDEX IF NOT EXISTS "post_isShort_type_isPublic_idx" ON "post"("isShort", "type", "isPublic");
-- CREATE INDEX IF NOT EXISTS "post_isShort_viewsCount_likesCount_idx" ON "post"("isShort", "viewsCount", "likesCount");

-- Composite index for trending content algorithm
CREATE INDEX IF NOT EXISTS "post_trending_idx" ON "post"("createdAt", "likesCount", "commentsCount", "viewsCount", "sharesCount");

-- CoinPurchase indexes for revenue tracking
CREATE INDEX IF NOT EXISTS "coin_purchase_status_createdAt_idx" ON "coin_purchase"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "coin_purchase_userId_createdAt_idx" ON "coin_purchase"("userId", "createdAt");
