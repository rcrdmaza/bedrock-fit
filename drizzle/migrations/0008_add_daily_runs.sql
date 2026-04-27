-- Add daily_runs and daily_run_participants. Daily runs are self-logged
-- training entries (short, frequent) — kept in their own table so the
-- race-results pipeline never touches them and the race-history UI
-- doesn't drown in shakeouts. Participants is the "ran with" set,
-- excluding the author (who lives on the parent row).
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0008_add_daily_runs.sql
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, safe to re-run on a partially
-- migrated DB.

CREATE TABLE IF NOT EXISTS "daily_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_by_athlete_id" uuid NOT NULL REFERENCES "athletes"("id") ON DELETE CASCADE,
  "distance_value" numeric(8,2) NOT NULL,
  "distance_unit" text NOT NULL,
  "distance_meters" integer NOT NULL,
  "duration_seconds" integer,
  "location" text,
  "strava_url" text,
  "run_date" timestamp NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Index by author so "show me my runs, newest first" is a single
-- ordered scan rather than a table sort.
CREATE INDEX IF NOT EXISTS "daily_runs_created_by_run_date_idx"
  ON "daily_runs" ("created_by_athlete_id", "run_date" DESC);

CREATE TABLE IF NOT EXISTS "daily_run_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "daily_run_id" uuid NOT NULL REFERENCES "daily_runs"("id") ON DELETE CASCADE,
  "athlete_id" uuid NOT NULL REFERENCES "athletes"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "daily_run_participants_run_athlete_key"
    UNIQUE ("daily_run_id", "athlete_id")
);

-- Index by tagged athlete so "show me runs I'm tagged in" doesn't have
-- to filter the whole table.
CREATE INDEX IF NOT EXISTS "daily_run_participants_athlete_idx"
  ON "daily_run_participants" ("athlete_id");
