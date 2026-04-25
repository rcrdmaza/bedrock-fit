-- Add sponsor fields to event_metadata. One sponsor per event for v1 —
-- "presented by" model, sold manually until billing exists. The render
-- treats all-null as "no sponsor" and hides the stripe; partial fills
-- (name only, or logo only) are valid and degrade gracefully on the
-- public event page.
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0005_add_event_sponsor.sql
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, safe to re-run.

ALTER TABLE "event_metadata"
  ADD COLUMN IF NOT EXISTS "sponsor_name" text;

ALTER TABLE "event_metadata"
  ADD COLUMN IF NOT EXISTS "sponsor_url" text;

ALTER TABLE "event_metadata"
  ADD COLUMN IF NOT EXISTS "sponsor_logo_url" text;
