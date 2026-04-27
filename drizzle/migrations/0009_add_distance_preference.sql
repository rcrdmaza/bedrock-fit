-- Add a per-athlete preferred distance unit ('mi' | 'km'). Drives the
-- default on the "Log a run" form and the unit used by monthly-mileage
-- / longest-run stats on the profile. Historical daily_runs rows keep
-- their own `distance_unit` so they always render in whatever the user
-- typed at the time — flipping this preference does not retcon them.
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0009_add_distance_preference.sql
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, safe to re-run. Default 'mi'
-- matches the pre-preference form default so existing rows behave
-- exactly as before.

ALTER TABLE "athletes"
  ADD COLUMN IF NOT EXISTS "distance_preference" text NOT NULL DEFAULT 'mi';
