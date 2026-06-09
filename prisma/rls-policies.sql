-- =====================================================================
-- rls-policies.sql — MedSafe
-- =====================================================================
-- WHEN TO RUN: Once, in Supabase SQL Editor, after the first migration
--              AND after post-migration.sql has been applied.
-- HOW TO RUN:  Supabase SQL Editor → paste entire file → Run
--
-- WHAT IS RLS:
-- Row Level Security (RLS) is a PostgreSQL feature that restricts which
-- rows a database user can see or modify. When enabled, Supabase uses
-- auth.uid() (the authenticated user's ID) to scope every query.
-- Without RLS, any authenticated user could read any other user's data.
--
-- TABLES WITH RLS (user-owned data):
--   users                 — each user sees only their own profile
--   family_members        — each user sees only their family members
--   medicines             — each user sees only their medicines
--   notification_log      — each user sees only their notifications
--   medicine_ingredients  — defense-in-depth (child of medicines)
--   medicine_scan_log     — defense-in-depth (child of medicines)
--
-- TABLES WITHOUT RLS (shared lookup data — no user data, no PII):
--   interactions_cache    — global drug interaction data, intentionally shared
--   checked_pairs         — global cache of checked RxCUI pairs, no user info
-- =====================================================================


-- =====================================================================
-- STEP 1: ENABLE RLS ON USER DATA TABLES
-- =====================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_scan_log ENABLE ROW LEVEL SECURITY;

-- interactions_cache: NO RLS — intentionally shared lookup table.
-- Contains drug interaction data with no user identifiers.
-- Any authenticated user may read all rows.

-- checked_pairs: NO RLS — same reasoning as interactions_cache.
-- Contains only RxCUI strings and boolean flags, no user identifiers.


-- =====================================================================
-- STEP 2: CREATE RLS POLICIES
-- =====================================================================

-- users: each user can only see and modify their own row.
-- auth.uid() returns the UUID of the currently authenticated user.
CREATE POLICY "users_self_only" ON users
  USING (auth.uid()::text = id::text);

-- family_members: each user sees only their own family members.
CREATE POLICY "family_members_user_only" ON family_members
  USING (user_id::text = auth.uid()::text);

-- medicines: each user sees only medicines belonging to their family members.
-- The subquery links medicines → family_members → current user.
CREATE POLICY "medicines_user_only" ON medicines
  USING (
    family_member_id IN (
      SELECT id FROM family_members
      WHERE user_id::text = auth.uid()::text
    )
  );

-- notification_log: each user sees only their own notification history.
-- user_id is stored directly (deliberate redundancy for cron performance).
CREATE POLICY "notification_log_user_only" ON notification_log
  USING (user_id::text = auth.uid()::text);

-- medicine_ingredients: defense-in-depth policy.
-- Primary data access is via Next.js API routes (session-enforced), but
-- direct Supabase client queries must also be scoped to the current user.
-- Scopes to ingredients of medicines owned by the current user.
CREATE POLICY "medicine_ingredients_user_only" ON medicine_ingredients
  USING (
    medicine_id IN (
      SELECT m.id FROM medicines m
      JOIN family_members fm ON fm.id = m.family_member_id
      WHERE fm.user_id::text = auth.uid()::text
    )
  );

-- medicine_scan_log: same defense-in-depth reasoning as medicine_ingredients.
CREATE POLICY "medicine_scan_log_user_only" ON medicine_scan_log
  USING (
    medicine_id IN (
      SELECT m.id FROM medicines m
      JOIN family_members fm ON fm.id = m.family_member_id
      WHERE fm.user_id::text = auth.uid()::text
    )
  );


-- =====================================================================
-- STEP 3: VERIFICATION QUERY
-- Run this after applying the policies to confirm RLS is enabled.
-- Expected: users, family_members, medicines, notification_log,
--           medicine_ingredients, medicine_scan_log → rowsecurity = true
--           interactions_cache, checked_pairs → rowsecurity = false
-- =====================================================================

SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================================
-- END OF FILE
-- =====================================================================
