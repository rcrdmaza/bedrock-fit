-- Add profile settings to athletes: an optional public nickname, a
-- display preference (name vs nickname), and an isPrivate toggle that
-- redacts the profile for non-owners.
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0006_add_athlete_profile_settings.sql
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, safe to re-run. Defaults are
-- chosen so existing rows behave exactly as before — display_preference
-- defaults to 'name' and is_private defaults to false.

ALTER TABLE "athletes"
  ADD COLUMN IF NOT EXISTS "nickname" text;

ALTER TABLE "athletes"
  ADD COLUMN IF NOT EXISTS "display_preference" text NOT NULL DEFAULT 'name';

ALTER TABLE "athletes"
  ADD COLUMN IF NOT EXISTS "is_private" boolean NOT NULL DEFAULT false;
