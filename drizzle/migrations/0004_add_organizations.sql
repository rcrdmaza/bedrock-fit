-- Multi-tenancy primitives.
--
-- Adds organizations (the unit a paying customer maps to), org_members
-- (which users belong to which orgs and at what role), and org_invites
-- (pending email invites + their hashed tokens). Also adds owner_org_id
-- on event_metadata so admin views can scope to events one org owns.
--
-- Idempotent: every CREATE / ALTER uses IF NOT EXISTS / IF EXISTS so a
-- redeploy after partial application never errors.
--
-- Backfill at the bottom: ensure the seed admin user has a `users` row,
-- create a default "Bedrock.fit" organization owned by them, and stamp
-- every existing event_metadata row with that org's id so all the
-- already-curated events stay editable post-migration.

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_by_user_id uuid REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT org_members_org_user_key UNIQUE (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  consumed_at timestamp,
  invited_by_user_id uuid REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Helpful for "show me pending invites for this org" lookups.
CREATE INDEX IF NOT EXISTS org_invites_org_email_idx
  ON org_invites (org_id, email);

ALTER TABLE event_metadata
  ADD COLUMN IF NOT EXISTS owner_org_id uuid REFERENCES organizations(id);

-- ---- Backfill --------------------------------------------------------
--
-- Plain SQL DO block so we can branch on "does the seed user exist"
-- without needing app-level code. All operations are idempotent: each
-- INSERT uses ON CONFLICT DO NOTHING, and the UPDATE only touches rows
-- where owner_org_id IS NULL.
DO $$
DECLARE
  seed_user_id uuid;
  default_org_id uuid;
BEGIN
  -- Ensure a users row for the founding admin exists. Magic-link sign-in
  -- creates this lazily, but if the founder hasn't signed in yet on the
  -- new auth path we still want the default org to have an owner.
  INSERT INTO users (email)
    VALUES ('rhmaza@gmail.com')
    ON CONFLICT (email) DO NOTHING;

  SELECT id INTO seed_user_id FROM users WHERE email = 'rhmaza@gmail.com';

  -- Create the default organization. Slug is fixed so this is safely
  -- re-runnable.
  INSERT INTO organizations (name, slug, created_by_user_id)
    VALUES ('Bedrock.fit', 'bedrock-fit', seed_user_id)
    ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO default_org_id FROM organizations WHERE slug = 'bedrock-fit';

  -- Make the seed user an owner of the default org.
  INSERT INTO org_members (org_id, user_id, role)
    VALUES (default_org_id, seed_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;

  -- Stamp every existing event_metadata row that doesn't already have
  -- an owner. Events without metadata rows (a bare result import that
  -- never hit /admin/events/edit) are unaffected — they get an org on
  -- the first edit/import after this migration via the application
  -- code path.
  UPDATE event_metadata
    SET owner_org_id = default_org_id
    WHERE owner_org_id IS NULL;
END $$;
