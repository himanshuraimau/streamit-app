-- Migration: Add indexes for admin panel query optimization
-- Task: 19.1 Optimize database queries
-- Requirements: 23.9, 23.10, 23.11

-- User management indexes
CREATE INDEX IF NOT EXISTS "user_last_login_at_idx" ON "user"("lastLoginAt" DESC);
CREATE INDEX IF NOT EXISTS "user_created_at_idx" ON "user"("createdAt" DESC);

-- Creator application indexes
CREATE INDEX IF NOT EXISTS "creator_application_status_submitted_idx" ON "creator_application"("status", "submittedAt" DESC);
CREATE INDEX IF NOT EXISTS "creator_application_reviewed_at_idx" ON "creator_application"("reviewedAt" DESC);

-- Stream indexes for live monitoring
CREATE INDEX IF NOT EXISTS "stream_is_live_started_at_idx" ON "stream"("isLive", "startedAt" DESC);

-- Post/Content moderation indexes
CREATE INDEX IF NOT EXISTS "post_flagged_flag_count_idx" ON "post"("isFlagged", "flagCount" DESC);
CREATE INDEX IF NOT EXISTS "post_hidden_hidden_at_idx" ON "post"("isHidden", "hiddenAt" DESC);
CREATE INDEX IF NOT EXISTS "comment_hidden_hidden_at_idx" ON "comment"("isHidden", "hiddenAt" DESC);

-- Report indexes
CREATE INDEX IF NOT EXISTS "report_status_created_at_idx" ON "report"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "report_reported_user_status_idx" ON "report"("reportedUserId", "status");

-- Coin purchase/ledger indexes
CREATE INDEX IF NOT EXISTS "coin_purchase_user_created_at_idx" ON "coin_purchase"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "coin_purchase_status_created_at_idx" ON "coin_purchase"("status", "createdAt" DESC);

-- Withdrawal request indexes
CREATE INDEX IF NOT EXISTS "creator_withdrawal_status_requested_at_idx" ON "creator_withdrawal_request"("status", "requestedAt" DESC);
CREATE INDEX IF NOT EXISTS "creator_withdrawal_user_requested_at_idx" ON "creator_withdrawal_request"("userId", "requestedAt" DESC);

-- Gift transaction indexes
CREATE INDEX IF NOT EXISTS "gift_transaction_created_at_idx" ON "gift_transaction"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "gift_transaction_receiver_created_at_idx" ON "gift_transaction"("receiverId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "gift_transaction_sender_created_at_idx" ON "gift_transaction"("senderId", "createdAt" DESC);

-- Ad creative indexes
CREATE INDEX IF NOT EXISTS "ad_creative_active_created_at_idx" ON "ad_creative"("isActive", "createdAt" DESC);

-- Audit log indexes (already exist but adding composite for better performance)
CREATE INDEX IF NOT EXISTS "admin_audit_log_admin_created_at_idx" ON "admin_audit_log"("adminId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "admin_audit_log_target_created_at_idx" ON "admin_audit_log"("targetType", "targetId", "createdAt" DESC);

-- System settings index
CREATE INDEX IF NOT EXISTS "system_setting_updated_at_idx" ON "system_setting"("updatedAt" DESC);
