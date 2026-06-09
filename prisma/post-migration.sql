-- =====================================================================
-- post-migration.sql — MedSafe
-- =====================================================================
-- WHEN TO RUN: Immediately after every `npx prisma migrate dev` run.
-- HOW TO RUN:  Supabase SQL Editor → paste entire file → Run
--
-- WHY THIS FILE EXISTS:
-- Prisma's schema DSL cannot express CHECK constraints, partial unique
-- indexes, or conditional constraints. If this file is NOT run after
-- migration, the database will silently accept invalid data (wrong
-- severity values, duplicate self-members, duplicate sent notifications).
-- These bugs only surface later when query filters miss data.
--
-- CONTENTS:
--   Section 1: CHECK constraints (vocabulary enforcement)
--   Section 2: Partial unique indexes (conditional uniqueness)
--   Section 3: Performance indexes (query optimization)
-- =====================================================================


-- =====================================================================
-- SECTION 1: CHECK CONSTRAINTS
-- These enforce that categorical text fields only contain known values.
-- Violation: INSERT/UPDATE will fail with a constraint violation error.
-- =====================================================================

-- users: notification_preference
ALTER TABLE users
  ADD CONSTRAINT chk_users_notification_preference
  CHECK (notification_preference IN ('email', 'none'));

-- family_members: relationship
ALTER TABLE family_members
  ADD CONSTRAINT chk_family_members_relationship
  CHECK (relationship IN ('self', 'parent', 'spouse', 'child', 'sibling', 'other'));

-- medicines: added_via
ALTER TABLE medicines
  ADD CONSTRAINT chk_medicines_added_via
  CHECK (added_via IN ('manual', 'scan'));

-- medicines: resolution_status
ALTER TABLE medicines
  ADD CONSTRAINT chk_medicines_resolution_status
  CHECK (resolution_status IN ('pending', 'resolved', 'partial', 'unresolvable'));

-- medicines: deactivation_reason — nullable categorical (NULL is valid when medicine is active)
ALTER TABLE medicines
  ADD CONSTRAINT chk_medicines_deactivation_reason
  CHECK (
    deactivation_reason IS NULL
    OR deactivation_reason IN ('user_deleted', 'auto_archived')
  );

-- medicine_ingredients: resolution_status
ALTER TABLE medicine_ingredients
  ADD CONSTRAINT chk_medicine_ingredients_resolution_status
  CHECK (resolution_status IN ('pending', 'resolved', 'unresolvable'));

-- interactions_cache: severity
ALTER TABLE interactions_cache
  ADD CONSTRAINT chk_interactions_cache_severity
  CHECK (severity IN ('severe', 'moderate', 'mild', 'unknown'));

-- interactions_cache: source
ALTER TABLE interactions_cache
  ADD CONSTRAINT chk_interactions_cache_source
  CHECK (source IN ('rxnav', 'gemini'));

-- interactions_cache: severity_ordinal — must match severity values
-- 1=severe, 2=moderate, 3=mild, 99=unknown
ALTER TABLE interactions_cache
  ADD CONSTRAINT chk_interactions_cache_severity_ordinal
  CHECK (severity_ordinal IN (1, 2, 3, 99));

-- notification_log: notification_type
ALTER TABLE notification_log
  ADD CONSTRAINT chk_notification_log_notification_type
  CHECK (notification_type IN ('expiry_30', 'expiry_7', 'expiry_1'));

-- notification_log: status
ALTER TABLE notification_log
  ADD CONSTRAINT chk_notification_log_status
  CHECK (status IN ('sent', 'failed', 'skipped_preference'));


-- =====================================================================
-- SECTION 2: PARTIAL UNIQUE INDEXES
-- These enforce uniqueness only when a condition is true.
-- Prisma @@unique cannot express conditional uniqueness.
-- =====================================================================

-- Enforce exactly one self member per user.
-- Allows multiple family members per user, but only one with is_self = true.
-- Violation: attempting to add a second self member will fail.
CREATE UNIQUE INDEX idx_one_self_per_user
  ON family_members (user_id)
  WHERE is_self = true;

-- Enforce at most one successfully sent notification per medicine per tier.
-- Allows retries (status = 'failed' rows are not constrained),
-- but prevents duplicate 'sent' rows for the same medicine + type.
-- Violation: inserting a second 'sent' row for the same medicine_id + notification_type fails.
CREATE UNIQUE INDEX idx_one_sent_per_medicine_type
  ON notification_log (medicine_id, notification_type)
  WHERE status = 'sent';


-- =====================================================================
-- SECTION 3: PERFORMANCE INDEXES
-- These are not correctness constraints — the app works without them.
-- They prevent full table scans on the most common queries.
-- =====================================================================

-- Main medicine list query: fetch active medicines for a family member, sorted by expiry.
-- Query pattern: WHERE family_member_id = X AND is_active = true ORDER BY expiry_date ASC
CREATE INDEX idx_medicines_member_active_expiry
  ON medicines (family_member_id, is_active, expiry_date);

-- Cron expiry check: fetch medicines expiring within a time window across all users.
-- Query pattern: WHERE expiry_date BETWEEN today AND today+30 AND is_active = true
CREATE INDEX idx_medicines_expiry_active
  ON medicines (expiry_date, is_active);


-- =====================================================================
-- END OF FILE
-- Verify constraints were applied:
--   SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;
-- Verify indexes were created:
--   SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN
--   ('family_members', 'notification_log', 'medicines');
-- =====================================================================
