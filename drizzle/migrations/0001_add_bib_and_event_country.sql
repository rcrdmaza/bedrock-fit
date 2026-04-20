-- Add optional bib and event_country columns to the results table.
-- Both nullable so existing rows stay intact; future CSV imports can
-- populate them. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0001_add_bib_and_event_country.sql
-- IF NOT EXISTS keeps the migration idempotent — safe to re-run against
-- a database that's already been updated via drizzle-kit push.

ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "bib" text;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "event_country" text;
