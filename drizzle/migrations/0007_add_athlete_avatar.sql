-- Add avatar_url to athletes. Holds a data: URL ("data:image/png;base64,..."
-- in v1) so we don't need an object-storage dependency before the app is
-- ready for one. Server-side validation caps uploads at 200 KB to keep
-- average row size reasonable.
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0007_add_athlete_avatar.sql
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, safe to re-run. Default NULL
-- so legacy rows get the running-hero placeholder until they upload.

ALTER TABLE "athletes"
  ADD COLUMN IF NOT EXISTS "avatar_url" text;
