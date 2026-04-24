-- Public-auth tables: `users` (one row per signed-in person) and
-- `login_tokens` (one row per outstanding magic-link, short-lived).
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0003_add_users_and_login_tokens.sql
--
-- Idempotent: everything uses IF NOT EXISTS so re-running is safe.

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Lowercased at write time — the app normalizes before INSERT. The
  -- uniqueness constraint means a second attempt to register the
  -- same address surfaces as a pg error we translate into a friendlier
  -- message.
  "email" text NOT NULL UNIQUE,
  "name" text,
  -- Nullable: brand-new signups may not have claimed results yet.
  -- Auto-populated on first sign-in when an athletes row with a
  -- matching email already exists.
  "athlete_id" uuid REFERENCES "athletes"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_sign_in_at" timestamp
);

-- One row per outstanding magic-link. Short-lived (15 min) and
-- single-use (consumed_at). We store only a SHA-256 hash of the raw
-- token; the raw value exists only inside the email itself.
CREATE TABLE IF NOT EXISTS "login_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Lookups happen by hash, but rate-limiting by email also hits the
-- table. Small composite index covers both paths.
CREATE INDEX IF NOT EXISTS "login_tokens_email_created_idx"
  ON "login_tokens" ("email", "created_at" DESC);
