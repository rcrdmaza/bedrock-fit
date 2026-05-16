-- Singleton table holding the operator-uploaded logo + favicon. The
-- CHECK (id = 1) constraint pins us to exactly one row so the rest of
-- the app can read "the current branding" as a primary-key lookup
-- (`select … where id = 1`) without sorting or grouping.
--
-- Both image columns hold base64 `data:image/...;base64,…` URLs
-- inline; bytes are validated + capped at upload time (500 KB logo,
-- 100 KB favicon) by lib/branding.ts. NULL means "fall back to the
-- built-in defaults" — for the logo, the Bedrock.fit wordmark; for
-- the favicon, the file-convention `src/app/favicon.ico`.
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0010_add_site_branding.sql
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + ON CONFLICT DO NOTHING for
-- the seed row.

CREATE TABLE IF NOT EXISTS "site_branding" (
  "id" integer PRIMARY KEY CHECK ("id" = 1),
  "logo_data_url" text,
  "favicon_data_url" text,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Seed the singleton row up front so upserts in the app code can be
-- pure UPDATEs against `WHERE id = 1` — no INSERT-or-UPDATE branching,
-- no race window where two concurrent uploads both try to INSERT.
INSERT INTO "site_branding" ("id") VALUES (1)
ON CONFLICT ("id") DO NOTHING;
