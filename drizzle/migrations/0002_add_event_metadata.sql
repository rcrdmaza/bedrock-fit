-- Admin-curated metadata for an event (city, district, country, summary,
-- route) plus a child table of photo URLs. Keyed by the same identity
-- triple we use elsewhere: (event_name, event_date, race_category).
--
-- Apply with:
--   npm run db:migrate
-- or:
--   psql "$DATABASE_URL" -f drizzle/migrations/0002_add_event_metadata.sql
--
-- Idempotent: everything uses IF NOT EXISTS so re-running is safe.

CREATE TABLE IF NOT EXISTS "event_metadata" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_name" text NOT NULL,
  "event_date" timestamp NOT NULL,
  "race_category" text NOT NULL,
  "city" text,
  "district" text,
  "country" text,
  "summary" text,
  "route_url" text,
  "route_image_url" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- One metadata row per event. Named explicitly so Drizzle's
-- `unique('event_metadata_triple_key')` matches the DB constraint —
-- otherwise an ON CONFLICT on (event_name, event_date, race_category)
-- needs the index name to be identifiable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_metadata_triple_key'
  ) THEN
    ALTER TABLE "event_metadata"
      ADD CONSTRAINT "event_metadata_triple_key"
      UNIQUE ("event_name", "event_date", "race_category");
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "event_photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_metadata_id" uuid NOT NULL REFERENCES "event_metadata"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "caption" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

-- Index on the FK so "all photos for this event" is fast; we read it on
-- every /events?... page render.
CREATE INDEX IF NOT EXISTS "event_photos_metadata_idx"
  ON "event_photos" ("event_metadata_id", "sort_order", "created_at");
