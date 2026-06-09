# Execution Plan: P0-T0 — Write Final Database Schema Files

> Task ID: P0-T0
> Phase: 0 — Planning & Data Validation
> Priority: HIGHEST — no blockers, first in task sequence, blocks P0-T0b
> Estimated effort: 1 session (2-3 hours)
> Status: ⬜ NOT STARTED
>
> Authority: Architecture Baseline v2 (`.claude/outputs/architecture-baseline.md`)
> DB Review: `.claude/outputs/db-architecture-review.md`

---

## OBJECTIVE

Translate the finalized schema from the Architecture Baseline (v2, post-DB-review) into three concrete database files: the Prisma schema, a post-migration SQL file for constraints Prisma cannot express, and an RLS policy SQL file. These three files together define the complete database setup required to begin Phase 1.

This task is writing and verification work, not research. Every decision is already made. The output must exactly match the Architecture Baseline — no interpretation, no additions, no shortcuts.

---

## WHY THIS TASK COMES FIRST

The schema changed substantially in Session 4 (DB architecture review):
- `salts[]` and `rxcuis[]` arrays replaced by `medicine_ingredients` junction table
- `expiry_month` and `expiry_year` dropped
- 8 new fields added across 5 tables
- 2 new tables added (`medicine_scan_log`, `medicine_ingredients`)
- CHECK constraints required on 9 fields across 5 tables
- 2 partial unique indexes required
- 3 performance indexes required

Until these are translated into actual files, the Lock Checklist items D-1 through D-10 cannot be verified, P0-T0b (.env.example) cannot be completed, and the GitHub repository has no real deliverable in it. Everything waits on this.

---

## DELIVERABLES

Three files, all new:

1. **`prisma/schema.prisma`**
   The complete Prisma schema: 8 models, all fields with correct types and annotations, all relations, all Prisma-expressible indexes.

2. **`prisma/post-migration.sql`**
   Raw PostgreSQL SQL for everything Prisma's DSL cannot express: all CHECK constraints, two partial unique indexes, three performance indexes, and the `is_self` enforcement index. This file must be run manually in the Supabase SQL editor immediately after every `prisma migrate` in Phase 1.

3. **`prisma/rls-policies.sql`**
   Row Level Security policies for all user data tables. Run once in Supabase SQL editor after the migration. Includes comments explaining why `interactions_cache` and `checked_pairs` intentionally have no RLS.

---

## FILES TO CREATE

```
prisma/
  schema.prisma          ← NEW
  post-migration.sql     ← NEW
  rls-policies.sql       ← NEW
```

## FILES TO UPDATE

```
_state.md                                        ← Mark P0-T0 ✅, update Current Task to P0-T0b
.claude/outputs/phase-0-lock-checklist.md        ← Mark D-1 through D-10, update D-3 (stale item)
```

---

## PRE-EXECUTION CHECKLIST

Before starting, confirm these are open in your editor or browser:

- [ ] Architecture Baseline v2: `.claude/outputs/architecture-baseline.md` (Part 2 specifically)
- [ ] DB Architecture Review: `.claude/outputs/db-architecture-review.md` (for constraint details)
- [ ] Prisma documentation for PostgreSQL: `https://www.prisma.io/docs/orm/overview/databases/postgresql`
- [ ] A plain text editor for the three SQL files

Do not start writing until these are accessible. The schema is precise — referencing the source of truth while writing prevents errors.

---

## STEP-BY-STEP EXECUTION PLAN

### Step 1: Create the prisma/ directory (5 minutes)

In the repo root, create the `prisma/` directory if it doesn't already exist. This is where Prisma expects to find `schema.prisma`.

Verify the directory exists before proceeding.

---

### Step 2: Write `prisma/schema.prisma` — Header and Configuration (10 minutes)

Write the file from the top:

**Generator block:**
```
generator client {
  provider = "prisma-client-js"
}
```
No changes here. Prisma Client for JavaScript/TypeScript is the only generator needed.

**Datasource block:**
```
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
Both `url` and `directUrl` are required. `url` uses the pooled connection (with pgbouncer params — but the params go in the env var value, not in the schema). `directUrl` bypasses pooling for migrations.

---

### Step 3: Write each model — in dependency order (60 minutes)

Write models in the order that respects their foreign key dependencies. If you write a model that references another model that hasn't been defined yet, Prisma will warn. Write in this sequence:

**Model 1: `users`**

Fields to verify line by line:
- `id String @id @db.Uuid` — UUID type, manually set to match Supabase auth.uid()
- `email String @unique` — unique, not nullable
- `name String` — plain string, not nullable
- `notification_preference String @default("email")` — default value is the string "email"
- `consent_given Boolean @default(false)` — DPDPA compliance
- `consent_given_at DateTime? @db.Timestamptz` — nullable, timezone-aware
- `consent_text_version String @default("v1.0")` — version tracking for consent changes
- `created_at DateTime @default(now()) @db.Timestamptz` — auto-set at creation
- `updated_at DateTime @updatedAt @db.Timestamptz` — auto-updated by Prisma
- Relations: `family_members family_members[]` and `notification_log notification_log[]`

**Verification question after writing:** Does this model have any fields from the old baseline (the one before the DB review) that no longer exist? Answer: No — users only gained `consent_text_version`. Nothing was removed from users.

---

**Model 2: `family_members`**

Fields:
- `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
  Note: `dbgenerated("gen_random_uuid()")` tells Prisma the default is a database function, not a Prisma-side default. This is correct for UUID generation at the DB layer.
- `user_id String @db.Uuid` — FK, not nullable
- `name String`
- `relationship String @default("self")` — CHECK constraint goes in post-migration.sql, not here
- `is_self Boolean @default(false)` — partial unique index goes in post-migration.sql
- `created_at DateTime @default(now()) @db.Timestamptz`
- Relation: `user users @relation(fields: [user_id], references: [id], onDelete: Cascade)`
- Relation: `medicines medicines[]`

**Verification question:** Is there a `@@unique` on this model? No. The unique constraint for `is_self` is a PARTIAL unique index — it only enforces uniqueness when `is_self = true`. Prisma's `@@unique` cannot express this condition. It goes in post-migration.sql.

---

**Model 3: `medicines`**

This is the most complex model. Fields:
- `id` — UUID, same pattern as family_members
- `family_member_id String @db.Uuid` — FK
- `brand_name String` — not nullable, no default
- `generic_name String?` — nullable
- `expiry_date DateTime @db.Date` — date only, no time component. Use `@db.Date`, NOT `@db.Timestamptz`
- `quantity Int?` — nullable integer
- `dosage_schedule String?` — nullable
- `is_active Boolean @default(true)`
- `deactivated_at DateTime? @db.Timestamptz` — nullable
- `deactivation_reason String?` — nullable; CHECK goes in post-migration.sql
- `added_via String @default("manual")` — CHECK goes in post-migration.sql
- `resolution_status String @default("pending")` — CHECK goes in post-migration.sql
- `resolution_error String?` — nullable, no CHECK (free-form error code)
- `resolution_attempt_count Int @default(0)` — non-nullable integer
- `resolution_attempted_at DateTime? @db.Timestamptz` — nullable
- `created_at DateTime @default(now()) @db.Timestamptz`
- `updated_at DateTime @updatedAt @db.Timestamptz`
- Relations:
  - `family_member family_members @relation(fields: [family_member_id], references: [id], onDelete: Cascade)`
  - `ingredients medicine_ingredients[]`
  - `notification_log notification_log[]`
  - `scan_log medicine_scan_log?` — one-to-one, optional (nullable on the medicines side)

**Common errors to avoid:**
- Do NOT include `expiry_month` or `expiry_year` — these were removed.
- Do NOT include `salts String[]` or `rxcuis String[]` — these were removed.
- The `scan_log medicine_scan_log?` relation uses `?` because not all medicines have a scan log (only OCR-added ones).
- `updated_at @updatedAt` cannot be `DateTime?` — `@updatedAt` requires a non-nullable DateTime field.

---

**Model 4: `medicine_ingredients`**

This is a new model from the DB review. Fields:
- `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- `medicine_id String @db.Uuid` — FK to medicines
- `ordinal Int @default(0)` — display order, not @db.SmallInt (Prisma uses Int for all integer sizes unless overridden)
- `salt_name String @db.VarChar(255)` — varchar with length limit
- `rxcui String?` — nullable; null means unresolved. NOT empty string.
- `resolution_status String @default("pending")` — CHECK goes in post-migration.sql
- `created_at DateTime @default(now()) @db.Timestamptz`
- Relation: `medicine medicines @relation(fields: [medicine_id], references: [id], onDelete: Cascade)`
- Indexes:
  - `@@index([medicine_id])` — fast ingredient lookup per medicine
  - `@@index([rxcui])` — fast lookup of medicines containing a specific rxcui

**Verification question:** Does `rxcui` have a NOT NULL constraint? No — it's `String?` (nullable). Null means "not yet resolved." Do not use `String @default("")` — empty string is not the same as null and would break the interaction engine's `WHERE rxcui IS NOT NULL` filter.

---

**Model 5: `interactions_cache`**

Fields:
- `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- `rxcui_a String` — normalized (lexicographically smaller); NOT nullable
- `rxcui_b String` — normalized (lexicographically larger); NOT nullable
- `severity String` — CHECK goes in post-migration.sql
- `severity_ordinal Int` — 1=severe, 2=moderate, 3=mild, 99=unknown. No default — must be set at insert time based on severity.
- `description String` — NOT nullable
- `source String @default("rxnav")` — CHECK goes in post-migration.sql
- `cached_at DateTime @default(now()) @db.Timestamptz`
- Index: `@@index([rxcui_a, rxcui_b])` — composite index for pair lookups

**No `@@unique` on pair.** This is intentional (see DB review finding N-1 and baseline ND-11). A pair can have multiple rows.

---

**Model 6: `checked_pairs`**

Fields:
- `rxcui_a String` — part of composite PK
- `rxcui_b String` — part of composite PK
- `has_interactions Boolean` — NOT nullable
- `checked_at DateTime @default(now()) @db.Timestamptz`
- `needs_recheck Boolean @default(false)` — added by DB review
- Composite PK: `@@id([rxcui_a, rxcui_b])`

No separate `id` field — the composite primary key IS the identifier.

---

**Model 7: `notification_log`**

Fields:
- `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- `user_id String @db.Uuid` — deliberate redundancy for cron performance
- `medicine_id String @db.Uuid`
- `notification_type String` — CHECK goes in post-migration.sql
- `status String @default("sent")` — CHECK goes in post-migration.sql
- `error_message String?` — nullable; contains Resend error on failure
- `sent_at DateTime @default(now()) @db.Timestamptz`
- Relations:
  - `user users @relation(fields: [user_id], references: [id], onDelete: Cascade)`
  - `medicine medicines @relation(fields: [medicine_id], references: [id], onDelete: Cascade)`

**No `@@unique` on this model.** The deduplication is a PARTIAL unique index (`WHERE status = 'sent'`). Prisma cannot express this. It goes in post-migration.sql. Do NOT add `@@unique([medicine_id, notification_type])` — that was in the old baseline and has been removed.

---

**Model 8: `medicine_scan_log`**

This table is created in Phase 1 migration but all fields are nullable or have defaults — it stays empty until Phase 5 (OCR). Fields:
- `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- `medicine_id String @unique @db.Uuid` — one scan log per medicine; `@unique` enforces one-to-one
- `raw_ocr_text String?` — nullable
- `confidence_score Float?` — nullable; 0.0–100.0
- `parsed_brand_name String?` — nullable
- `parsed_expiry String?` — nullable
- `user_edited_name Boolean @default(false)` — NOT nullable, default false
- `user_edited_expiry Boolean @default(false)` — NOT nullable, default false
- `saved_brand_name String?` — nullable
- `saved_expiry_date DateTime? @db.Date` — nullable, date only
- `tesseract_version String?` — nullable
- `scanned_at DateTime @default(now()) @db.Timestamptz`
- Relation: `medicine medicines @relation(fields: [medicine_id], references: [id], onDelete: Cascade)`

**The `@unique` on `medicine_id` is what makes this one-to-one with medicines** — Prisma infers a one-to-one relation when the FK field has `@unique`. This is correct.

---

### Step 4: Review the complete `prisma/schema.prisma` file (15 minutes)

After writing all 8 models, do a systematic review:

**Cross-check 1: All 8 models present**
- [ ] users
- [ ] family_members
- [ ] medicines
- [ ] medicine_ingredients
- [ ] interactions_cache
- [ ] checked_pairs
- [ ] notification_log
- [ ] medicine_scan_log

**Cross-check 2: No fields from the old baseline that should be gone**
- [ ] medicines does NOT have `salts String[]`
- [ ] medicines does NOT have `rxcuis String[]`
- [ ] medicines does NOT have `expiry_month Int`
- [ ] medicines does NOT have `expiry_year Int`

**Cross-check 3: All new fields from the DB review are present**
- [ ] users has `consent_text_version`
- [ ] medicines has `deactivated_at`, `deactivation_reason`
- [ ] medicines has `resolution_error`, `resolution_attempt_count`
- [ ] interactions_cache has `severity_ordinal`
- [ ] checked_pairs has `needs_recheck`
- [ ] notification_log has `status`, `error_message`

**Cross-check 4: @db type annotations**
- [ ] All UUID fields have `@db.Uuid`
- [ ] All timezone-aware timestamp fields have `@db.Timestamptz`
- [ ] `expiry_date` and `saved_expiry_date` have `@db.Date` (not @db.Timestamptz)
- [ ] `salt_name` has `@db.VarChar(255)`
- [ ] All `Float` fields (confidence_score) use Prisma's `Float` type, no @db annotation needed

**Cross-check 5: Cascade deletes**
- [ ] family_members → users: `onDelete: Cascade` ✓
- [ ] medicines → family_members: `onDelete: Cascade` ✓
- [ ] medicine_ingredients → medicines: `onDelete: Cascade` ✓
- [ ] notification_log → users: `onDelete: Cascade` ✓
- [ ] notification_log → medicines: `onDelete: Cascade` ✓
- [ ] medicine_scan_log → medicines: `onDelete: Cascade` ✓

**Cross-check 6: What is NOT in this file (intentionally)**
All of these are in post-migration.sql, NOT in schema.prisma:
- Any CHECK constraints
- Partial unique index on `family_members(user_id) WHERE is_self = true`
- Partial unique index on `notification_log(medicine_id, notification_type) WHERE status = 'sent'`
- Performance indexes on `medicines(family_member_id, is_active, expiry_date)`
- Performance index on `medicines(expiry_date, is_active)`

---

### Step 5: Write `prisma/post-migration.sql` (40 minutes)

This file contains all PostgreSQL-specific SQL that Prisma cannot generate. It must be run manually in the Supabase SQL editor immediately after every `prisma migrate dev` run.

**Structure of the file:**
- Opening comment explaining what this is and when to run it
- Section 1: CHECK constraints (in table order)
- Section 2: Partial unique indexes
- Section 3: Performance indexes
- Section 4: Reminder comments about what each constraint prevents

**CHECK constraints to include — for each table:**

*users table:*
- `notification_preference IN ('email', 'none')`

*family_members table:*
- `relationship IN ('self', 'parent', 'spouse', 'child', 'sibling', 'other')`

*medicines table:*
- `added_via IN ('manual', 'scan')`
- `resolution_status IN ('pending', 'resolved', 'partial', 'unresolvable')`
- Conditional: `deactivation_reason IN ('user_deleted', 'auto_archived') OR deactivation_reason IS NULL`

*medicine_ingredients table:*
- `resolution_status IN ('pending', 'resolved', 'unresolvable')`

*interactions_cache table:*
- `severity IN ('severe', 'moderate', 'mild', 'unknown')`
- `source IN ('rxnav', 'gemini')`
- `severity_ordinal IN (1, 2, 3, 99)` — locks ordinal to valid values

*notification_log table:*
- `notification_type IN ('expiry_30', 'expiry_7', 'expiry_1')`
- `status IN ('sent', 'failed', 'skipped_preference')`

**Partial unique indexes:**

1. Enforce exactly one self member per user:
```sql
CREATE UNIQUE INDEX idx_one_self_per_user
  ON family_members (user_id)
  WHERE is_self = true;
```

2. Enforce at most one successful alert per medicine per tier:
```sql
CREATE UNIQUE INDEX idx_one_sent_per_medicine_type
  ON notification_log (medicine_id, notification_type)
  WHERE status = 'sent';
```

**Performance indexes:**

3. Main medicine list query (fetch active medicines for a family member, sorted by expiry):
```sql
CREATE INDEX idx_medicines_member_active_expiry
  ON medicines (family_member_id, is_active, expiry_date);
```

4. Cron expiry check (fetch all medicines expiring within a time window across all users):
```sql
CREATE INDEX idx_medicines_expiry_active
  ON medicines (expiry_date, is_active);
```

**Important note in the file:** After writing all SQL, add a prominent comment:

```sql
-- =====================================================================
-- REMINDER: This file must be run AFTER every `prisma migrate dev`
-- Run in Supabase SQL Editor → SQL Editor → paste entire file → Run
-- These constraints are NOT generated by Prisma and will NOT be
-- present if this file is not run. Missing constraints = silent bugs.
-- =====================================================================
```

This reminder prevents the most common failure mode: developer runs the migration, moves on to Phase 1 code, and forgets to apply post-migration.sql. The constraint violations only surface later when bad data accumulates.

---

### Step 6: Write `prisma/rls-policies.sql` (15 minutes)

This file contains the Row Level Security setup for Supabase. It is run once in the Supabase SQL editor after the migration and post-migration.sql.

**Structure:**
- Opening comment explaining what RLS is, when to run this
- Enable RLS statements for the 4 user-data tables
- Policy creation statements
- Explanatory comments for tables with no RLS (interactions_cache, checked_pairs)

**Enable RLS on these tables:**
- users
- family_members
- medicines
- notification_log

**Do NOT enable RLS on:**
- interactions_cache — intentionally shared lookup table, no user data
- checked_pairs — same reasoning
- medicine_ingredients — derives security from medicines RLS
- medicine_scan_log — derives security from medicines RLS

**Wait — medicine_ingredients and medicine_scan_log:**

These tables don't appear in the baseline's RLS section. They're child tables of `medicines`. When a user queries `medicines` through Prisma (with RLS enforced), the relation queries for `medicine_ingredients` and `medicine_scan_log` are scoped by the already-filtered medicine IDs. However, if someone queries `medicine_ingredients` or `medicine_scan_log` directly via the Supabase client, RLS would not protect them.

Decision for the RLS file: add policies for `medicine_ingredients` and `medicine_scan_log` that scope to the authenticated user's medicines. This should be documented in the file with an explanation.

*medicine_ingredients policy:*
```sql
CREATE POLICY "medicine_ingredients_user_only" ON medicine_ingredients
  USING (
    medicine_id IN (
      SELECT m.id FROM medicines m
      JOIN family_members fm ON fm.id = m.family_member_id
      WHERE fm.user_id::text = auth.uid()::text
    )
  );
```

*medicine_scan_log policy:* Same pattern as above.

Add a comment explaining these policies exist as defense in depth — the primary data access is through Next.js API routes which enforce session-level auth, but the Supabase anon client would be unprotected without these.

**The file should end with a verification query:**
```sql
-- Verification: check all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: users, family_members, medicines, medicine_ingredients,
--           notification_log, medicine_scan_log should show rowsecurity = true
```

---

### Step 7: Update the Phase 0 Lock Checklist (15 minutes)

Open `.claude/outputs/phase-0-lock-checklist.md` and update the database schema items.

**Items to mark as addressed (add evidence — "File: prisma/schema.prisma"):**
- D-1: `prisma/schema.prisma` written ✅
- D-2: `medicines.user_id` is ABSENT — verify in schema ✅
- D-4: `interactions_cache` has no UNIQUE constraint on pair — verify @@index only ✅
- D-5: `checked_pairs` has composite PK `@@id([rxcui_a, rxcui_b])` ✅
- D-6: Pair normalization rule is documented in schema comments ✅
- D-9: Signup transaction pattern documented in schema (users + family_members in Cascade) — note this is code behavior, not schema ✅
- D-10: Cascade delete direction verified (trace each onDelete: Cascade) ✅

**D-3 REQUIRES CORRECTION (not just marking):**
The current D-3 text says: "medicines.rxcuis is TEXT[] (array, not single string)." This is now WRONG. After the DB review, `rxcuis TEXT[]` was replaced by the `medicine_ingredients` junction table. D-3 must be rewritten to read:
"medicine_ingredients junction table exists with rxcui field (nullable TEXT) per ingredient, replacing the old parallel array approach."

Update D-3 text and mark it addressed.

**D-7 and D-8 remain open:**
- D-7: `normalizeExpiryDate()` utility — this is a code task for Phase 1 implementation (P2-T3 preparation)
- D-8: Prisma connection pooling — this is an environment variable configuration task (P0-T0b)

These stay ⬜ open. Note in the checklist why they're not addressed by this task.

---

### Step 8: Update `_state.md` (5 minutes)

- Mark P0-T0 as ✅ in the task table
- Update "Current Task" to reflect P0-T0b as the next task
- Add session note to Session Log

---

## RISKS

**Risk 1: Prisma DSL syntax error makes schema unparseable**
Probability: Medium. Prisma's schema syntax is non-obvious in places (especially relation definitions, @db annotations, and dbgenerated defaults).
Mitigation: Validate the schema syntax by running `npx prisma format` or `npx prisma validate` if the Prisma CLI is available. If not, compare carefully against the Prisma documentation for each field type used.
If discovered in Phase 1: `prisma migrate dev` will reject a malformed schema. Not data-corrupting, but time-consuming to debug.

**Risk 2: post-migration.sql is skipped during Phase 1 setup**
Probability: Medium-High. It's easy to run `prisma migrate dev` and consider the database setup "done" without noticing the second file.
Mitigation: Add a prominent note to the Phase 1 task P1-T2 checklist: "Run post-migration.sql after migration." Also add a comment at the top of the file itself. Add to defects.md as a known risk.
If discovered in Phase 3: Categorical constraint violations accumulate silently. A severity value stored as "Severe" instead of "severe" causes silent query failures.

**Risk 3: medicine_scan_log causes Prisma relation errors**
Probability: Low-Medium. The one-to-one optional relation (medicines `scan_log medicine_scan_log?`) requires the FK to have `@unique` on the medicine_scan_log side. This is correct in the baseline schema. If written without `@unique` on `medicine_id`, Prisma will interpret it as one-to-many instead of one-to-one.
Mitigation: Verify `medicine_id String @unique @db.Uuid` on medicine_scan_log.

**Risk 4: RLS policies for medicine_ingredients and medicine_scan_log are missed**
Probability: Low. The baseline's RLS section only mentions 4 tables. These child tables require policies that reference the medicines table.
Mitigation: The execution plan explicitly addresses this in Step 6. Verify the policies are present before marking D-1 complete.

**Risk 5: CHECK constraint syntax varies slightly from expected**
Probability: Low. PostgreSQL CHECK constraint syntax is standard, but the `deactivation_reason` conditional check (allows NULL or specific values) is more complex than a simple IN clause.
Mitigation: The correct PostgreSQL syntax for a nullable categorical with CHECK: `CHECK (deactivation_reason IS NULL OR deactivation_reason IN ('user_deleted', 'auto_archived'))`. This pattern is well-documented.

**Risk 6: Incomplete session — files partially written**
If this session ends before all 3 files are complete, the task should NOT be marked ✅. Partial schema files are worse than no schema files — they give a false sense of completeness.
Mitigation: Complete all 3 files in one session. If interrupted, note exactly which models/sections are incomplete in the session log.

---

## DEFINITION OF DONE

P0-T0 is complete when ALL of the following are true:

**File completeness:**
- [ ] `prisma/schema.prisma` exists and contains all 8 models
- [ ] `prisma/post-migration.sql` exists and contains all CHECK constraints, both partial unique indexes, and both performance indexes
- [ ] `prisma/rls-policies.sql` exists and contains policies for all 6 tables that need them

**Content verification (each must be checked manually):**
- [ ] No `salts String[]` or `rxcuis String[]` in medicines model
- [ ] No `expiry_month` or `expiry_year` in medicines model
- [ ] `medicine_ingredients` model has nullable `rxcui String?` (NOT `String`)
- [ ] `interactions_cache` has `severity_ordinal Int` with no default (must be set at insert)
- [ ] `interactions_cache` has `@@index([rxcui_a, rxcui_b])` but NO `@@unique`
- [ ] `checked_pairs` has `needs_recheck Boolean @default(false)`
- [ ] `notification_log` has `status` and `error_message` fields, NO `@@unique`
- [ ] `medicine_scan_log` has `medicine_id String @unique` (enabling one-to-one relation)
- [ ] All cascade deletes trace correctly: users → family_members → medicines → medicine_ingredients

**Post-migration.sql verification:**
- [ ] Every categorical field in every table has a corresponding CHECK constraint
- [ ] `idx_one_self_per_user` partial index present
- [ ] `idx_one_sent_per_medicine_type` partial index present
- [ ] `idx_medicines_member_active_expiry` composite performance index present
- [ ] `idx_medicines_expiry_active` performance index present
- [ ] Prominent reminder comment at top of file

**RLS verification:**
- [ ] RLS enabled on: users, family_members, medicines, notification_log, medicine_ingredients, medicine_scan_log
- [ ] Policies present for all 6 tables
- [ ] Explanation comment present for tables without RLS (interactions_cache, checked_pairs)

**State updates:**
- [ ] `_state.md` shows P0-T0 as ✅
- [ ] `_state.md` "Current Task" updated to P0-T0b
- [ ] Lock checklist D-3 updated (text corrected, not just marked)
- [ ] Lock checklist D-1, D-2, D-4, D-5, D-6, D-9, D-10 marked addressed

**Self-test question:** Could a new developer, reading only the three prisma/ files, correctly create the entire database with all constraints enforced? If yes, this task is done.

---

## WHAT THIS TASK DOES NOT INCLUDE

- Running `prisma migrate dev` (Phase 1 task P1-T2)
- Creating the Supabase project (Phase 0 task C-2, irreversible action held until go/no-go)
- Writing the `.env.example` (Phase 0 task P0-T0b, next task)
- Writing `src/lib/utils/expiry.ts` `normalizeExpiryDate()` (Phase 1/2 code)
- Creating the GitHub repository (Phase 0 task P0-T0c, no blockers, run in parallel)

---

*Execution plan authored for: Yashika*
*Created: 2026-06-09*
*Reference authority: architecture-baseline.md v2*
