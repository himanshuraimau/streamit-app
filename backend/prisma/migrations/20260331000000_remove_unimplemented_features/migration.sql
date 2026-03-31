-- Remove unimplemented admin/compliance/ad features

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS "ad_campaign_metric_daily" CASCADE;
DROP TABLE IF EXISTS "ad_campaign" CASCADE;
DROP TABLE IF EXISTS "takedown_request" CASCADE;
DROP TABLE IF EXISTS "legal_case" CASCADE;
DROP TABLE IF EXISTS "geo_block_rule" CASCADE;
DROP TABLE IF EXISTS "announcement" CASCADE;
DROP TABLE IF EXISTS "system_setting_version" CASCADE;
DROP TABLE IF EXISTS "admin_activity_log" CASCADE;

-- Drop unused enums only (keep enums that are still used by other models)
-- These enums are NOT used by any remaining models:
DROP TYPE IF EXISTS "AdCampaignStatus";
DROP TYPE IF EXISTS "GeoBlockStatus";
DROP TYPE IF EXISTS "GeoBlockReason";
DROP TYPE IF EXISTS "TakedownStatus";
DROP TYPE IF EXISTS "TakedownReason";
DROP TYPE IF EXISTS "LegalCaseStatus";
DROP TYPE IF EXISTS "LegalCaseType";
DROP TYPE IF EXISTS "AnnouncementType";
DROP TYPE IF EXISTS "AdminAction";
