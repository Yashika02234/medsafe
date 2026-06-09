# Database Setup — MedSafe

This directory contains three files that together define the complete database setup.

## Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `schema.prisma` | Prisma schema — 8 models | Run `prisma migrate dev` from `frontend/` |
| `post-migration.sql` | CHECK constraints, partial indexes, performance indexes | Run in Supabase SQL editor after every migration |
| `rls-policies.sql` | Row Level Security policies | Run once in Supabase SQL editor after first migration |

## Setup Sequence

1. `npx prisma migrate dev --name init` (from `frontend/` directory)
2. Open Supabase SQL editor
3. Paste and run `post-migration.sql`
4. Paste and run `rls-policies.sql`

## Important

`post-migration.sql` contains constraints that Prisma cannot express in its
schema DSL. If this file is not run, the database will accept invalid data
silently. Always run it after any migration.

## Schema Overview

8 tables: users, family_members, medicines, medicine_ingredients,
interactions_cache, checked_pairs, notification_log, medicine_scan_log

See `.claude/outputs/architecture-baseline.md` (Part 2) for full schema documentation.
