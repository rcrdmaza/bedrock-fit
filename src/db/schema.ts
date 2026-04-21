import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  unique,
} from 'drizzle-orm/pg-core';

export const athletes = pgTable('athletes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  dob: timestamp('dob'),
  gender: text('gender'),
  location: text('location'),
  xp: integer('xp').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const results = pgTable('results', {
  id: uuid('id').defaultRandom().primaryKey(),
  athleteId: uuid('athlete_id').references(() => athletes.id),
  eventName: text('event_name').notNull(),
  eventDate: timestamp('event_date'),
  raceCategory: text('race_category'),
  finishTime: integer('finish_time_seconds'),
  overallRank: integer('overall_rank'),
  totalFinishers: integer('total_finishers'),
  percentile: numeric('percentile', { precision: 5, scale: 2 }),
  status: text('status').default('unclaimed'),
  // Bib number from the chip timing export. Nullable — older imports
  // and hand-entered rows don't have it. Free-form text because bibs
  // can include letters or leading zeros ("E021", "042").
  bib: text('bib'),
  // Country where the event took place. Free-form string (e.g. "Peru",
  // "PE", "United States"). Stored per-result because we don't model
  // events as their own rows — every row in the same import shares the
  // same country, which the importer populates uniformly.
  eventCountry: text('event_country'),
  // Populated when a user submits a claim. Admin reviews out of band
  // and promotes pending → claimed (or back to unclaimed if rejected).
  claimEmail: text('claim_email'),
  claimNote: text('claim_note'),
  claimSubmittedAt: timestamp('claim_submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Admin-curated metadata for an event. Keyed by the same identity
// triple we use in URLs — (eventName, eventDate, raceCategory) — so
// metadata attaches to the exact category grouping and never bleeds
// across sibling distances (a marathon's course isn't the 10K's).
//
// Everything here is nullable and lazily populated: a bare result
// import creates no metadata row, and the /events detail page hides
// empty sections. Admins fill these in via /admin/events/edit.
export const eventMetadata = pgTable(
  'event_metadata',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventName: text('event_name').notNull(),
    eventDate: timestamp('event_date').notNull(),
    raceCategory: text('race_category').notNull(),
    // Location granularity: city (Lima), district/state (Lima Province,
    // CA, NSW), country (Peru). All optional.
    city: text('city'),
    district: text('district'),
    country: text('country'),
    // Longform description — anything from a paragraph to a few.
    summary: text('summary'),
    // Route tab: one external link (Strava, Komoot, the race website…)
    // plus one optional image URL for the course map preview.
    routeUrl: text('route_url'),
    routeImageUrl: text('route_image_url'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    // One metadata row per event. The admin upsert relies on this —
    // without the unique constraint a double-submit would produce two
    // rows and the next read would pick one arbitrarily.
    uniqTriple: unique('event_metadata_triple_key').on(
      t.eventName,
      t.eventDate,
      t.raceCategory,
    ),
  }),
);

// Photos attached to an event, rendered as a gallery on the event's
// Photos tab. URLs only — no uploads. Admin pastes links to images
// hosted elsewhere (Cloudinary, S3, the race's site…).
export const eventPhotos = pgTable('event_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Cascade delete — orphan photo rows are never what we want.
  eventMetadataId: uuid('event_metadata_id')
    .notNull()
    .references(() => eventMetadata.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  // Admin-ordered slot. Ties broken by createdAt so new additions
  // land at the end by default.
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});