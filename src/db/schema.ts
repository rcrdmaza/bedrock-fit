import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  boolean,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const athletes = pgTable('athletes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  dob: timestamp('dob'),
  gender: text('gender'),
  location: text('location'),
  xp: integer('xp').default(0),
  // Optional public alias. When set and `displayPreference` is
  // 'nickname', the public-facing surfaces (profile header, leaderboards,
  // results athlete column) render this instead of `name`. `name` stays
  // canonical for matching, claim suggestions, and admin views.
  nickname: text('nickname'),
  // Which of `name`/`nickname` to render publicly. 'name' is the default
  // — legacy rows and brand-new athletes show their real name. 'nickname'
  // only takes effect when nickname is non-empty (the helper guards
  // against a stale preference + cleared nickname combo).
  displayPreference: text('display_preference').default('name').notNull(),
  // Soft privacy. When true, non-owners see a redacted profile (name
  // visible but with a strikethrough + redaction bar; stats and race
  // history hidden). The owner always sees the full page. Profile URL
  // still resolves — we don't 404 — so existing shared links keep
  // working but reveal nothing new.
  isPrivate: boolean('is_private').default(false).notNull(),
  // Profile picture. Stored inline as a `data:image/...;base64,...`
  // URL so we don't need separate object storage in v1 — uploads are
  // capped at 200 KB by the server action, which keeps row size sane.
  // NULL means "no upload yet"; the UI falls back to the running-hero
  // placeholder. Future migration can swap this to an external URL +
  // backfill from the data URLs.
  avatarUrl: text('avatar_url'),
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
    // "Presented by" sponsor — one slot per event in v1. All three fields
    // are independently optional: name-only renders a text chip, logo-only
    // renders just the image, url-only is meaningless and the renderer
    // ignores it. The stripe hides entirely when name and logo are both
    // missing.
    sponsorName: text('sponsor_name'),
    sponsorUrl: text('sponsor_url'),
    sponsorLogoUrl: text('sponsor_logo_url'),
    // Multi-tenant ownership. Lazily backfilled to a default org for
    // events imported before multi-tenancy shipped. Nullable so legacy
    // rows in tests/local DBs without the migration applied still work
    // — the scoping helpers treat null as "no org owns this", which
    // means only legacy admin-password sessions can edit it.
    ownerOrgId: uuid('owner_org_id').references((): AnyPgColumn => organizations.id),
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

// Public-auth user accounts. Created on the first successful magic-link
// verification, keyed by a lowercased email. `athleteId` is the link to
// the `athletes` row that owns this person's results — nullable because
// a brand-new signup may not have any claimed results yet, and we
// auto-link lazily on first sign-in when an athletes row with a
// matching email exists.
//
// The admin login stays on its own HMAC cookie; this table only
// describes *public* users so rolling out multi-admin later is a
// superset (add a `role` column) rather than a migration.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Lowercase-normalized on write so "Alice@x.com" and "alice@x.com"
  // can't both register. `.unique()` enforces it at the DB level.
  email: text('email').notNull().unique(),
  // Display name. Optional — magic-link sign-in doesn't collect it;
  // the /me page can let users edit it later.
  name: text('name'),
  athleteId: uuid('athlete_id').references(() => athletes.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSignInAt: timestamp('last_sign_in_at'),
});

// Single-use, short-lived magic-link tokens. We store only a SHA-256
// hash of the random token so a DB leak can't replay outstanding
// links. `consumedAt` doubles as a replay guard — set on first use,
// future requests with the same hash no-op.
//
// Cleanup is lazy: expired rows stay until the next admin vacuum. The
// table is tiny (one row per sign-in attempt, expiring in 15 min) so
// this doesn't matter operationally.
export const loginTokens = pgTable('login_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  // SHA-256 hex of the raw token that went out in the email. The raw
  // token exists only inside that one email; we can't re-send the same
  // link even if we wanted to.
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Multi-tenancy ----------------------------------------------------
//
// An `organization` is the unit a paying customer (race director,
// timing company, club) corresponds to. It owns events; members of an
// org can edit those events and approve their claims. Public pages are
// unaware of orgs — the public site stays one big results pool. This
// is a pure backend scoping primitive for v1.
//
// `slug` is reserved for future use (per-org vanity URLs, /o/[slug]),
// but we generate it on creation so we don't have to backfill later.
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  // URL-safe lowercase identifier. Unique so /o/[slug] can be added
  // without a collision pass later.
  slug: text('slug').notNull().unique(),
  // Who created the org. Nullable because the seed/backfill insert
  // creates the default org before any user exists in some test
  // setups; production rows always have it.
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Membership join row: user X belongs to org Y with role Z. role is a
// flat string today ('owner' | 'admin'); promoting to a real enum is a
// later migration once we have more than two roles.
export const orgMembers = pgTable(
  'org_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'owner' can invite/remove members and delete the org; 'admin' can
    // do everything event-related but not modify membership. Defaults
    // to 'admin' on invite acceptance — the inviter explicitly chooses
    // when granting owner.
    role: text('role').notNull().default('admin'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    // One membership row per (org, user). Without this constraint a
    // double-clicked accept-invite would write two rows and the listing
    // would show the user twice.
    uniqOrgUser: unique('org_members_org_user_key').on(t.orgId, t.userId),
  }),
);

// Pending invites. Same hash-not-raw discipline as login_tokens — the
// raw token exists only inside the email. `consumedAt` doubles as a
// replay guard; an accepted invite can't be re-used.
export const orgInvites = pgTable('org_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // Lowercase-normalized on write. We do NOT require a `users` row to
  // pre-exist — invites can land at brand-new emails, and the accept
  // flow signs them in via magic-link first.
  email: text('email').notNull(),
  role: text('role').notNull().default('admin'),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  invitedByUserId: uuid('invited_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});