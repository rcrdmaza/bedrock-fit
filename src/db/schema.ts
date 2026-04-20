import { pgTable, uuid, text, integer, timestamp, numeric } from 'drizzle-orm/pg-core';

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