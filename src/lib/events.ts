// Server-only event queries. The /results page lists events via
// getEventSummaries (one row per event), and /events?name=…&date=…&
// category=… drills into a single event's ranked participants via
// getEventDetail.
//
// An event is identified by the triple (eventName, eventDate,
// raceCategory) — two categories on the same race day are two events
// because they're ranked independently. See events-filter.ts for the
// client-safe EventSummary type we re-export here.

import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  athletes,
  eventMetadata,
  eventPhotos,
  results,
} from '@/db/schema';

export { eventKey, filterEvents, type EventSummary, type EventsFilter } from '@/lib/events-filter';
import { eventKey, type EventSummary } from '@/lib/events-filter';

// One aggregated row per (name, date, category). Only counts rows
// with a finish time — DNF/DSQ shouldn't inflate the participant
// count on the events list.
//
// eventCountry uses MAX so a single value wins even when a messy
// import left some rows null: `max('Peru', null) = 'Peru'`. If rows
// legitimately disagree (shouldn't, but), we still get a deterministic
// answer instead of duplicate groups in the UI.
export async function getEventSummaries(): Promise<EventSummary[]> {
  const rows = await db
    .select({
      eventName: results.eventName,
      eventDate: results.eventDate,
      raceCategory: results.raceCategory,
      eventCountry: sql<string | null>`max(${results.eventCountry})`,
      participantCount: sql<number>`count(*)::int`,
    })
    .from(results)
    .where(
      and(isNotNull(results.finishTime), isNotNull(results.raceCategory)),
    )
    .groupBy(results.eventName, results.eventDate, results.raceCategory)
    // Newest first, then name for deterministic secondary ordering so
    // two events on the same day land in the same slot every render.
    .orderBy(desc(results.eventDate), asc(results.eventName));

  return rows.map((r) => {
    // eventDate is non-null by virtue of the GROUP BY having a date
    // column, but TS still sees it as Date | null — narrow with a
    // runtime fallback that should never fire.
    const iso = (r.eventDate ?? new Date()).toISOString();
    // raceCategory: same story — the WHERE guarantees non-null.
    const category = r.raceCategory ?? 'Unknown';
    return {
      key: eventKey(r.eventName, iso, category),
      eventName: r.eventName,
      eventDate: iso,
      raceCategory: category,
      eventCountry: r.eventCountry,
      participantCount: r.participantCount,
    };
  });
}

// One participant card on the event detail page. Trimmed vs. ResultRow —
// no claim status column, no percentile math, because those live in the
// UI layer.
export type EventParticipant = {
  id: string;
  athleteId: string;
  athleteName: string;
  finishTime: number;
  overallRank: number | null;
  totalFinishers: number | null;
  percentile: number | null;
  status: string;
  bib: string | null;
};

// Admin-curated fields about the event. All optional — an event with
// no metadata row returns `metadata: null` on the detail and the UI
// hides every empty section.
export type EventMetadata = {
  // Metadata row id — used by the admin photo actions so the UI can
  // reference a specific gallery entry without re-resolving the
  // triple on every mutation.
  id: string;
  city: string | null;
  district: string | null;
  country: string | null;
  summary: string | null;
  routeUrl: string | null;
  routeImageUrl: string | null;
};

export type EventPhoto = {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
};

export interface EventDetail {
  eventName: string;
  eventDate: string;
  raceCategory: string;
  // Preferred: metadata.country when set, otherwise the MAX(event_country)
  // from the results rows. Null means we genuinely have no country info.
  eventCountry: string | null;
  participants: EventParticipant[];
  total: number;
  metadata: EventMetadata | null;
  photos: EventPhoto[];
}

// Hard cap so a poorly-grouped event (or a future ultra-marathon with
// 10k finishers) doesn't paint the entire DOM.
const MAX_PARTICIPANTS = 500;

// Resolve the URL triple → full participant list. We validate the
// event exists (at least one row with a finish time) before returning,
// so the page handler can 404 on bad params.
export async function getEventDetail(
  eventName: string,
  eventDateIso: string,
  raceCategory: string,
): Promise<EventDetail | null> {
  const eventDate = new Date(eventDateIso);
  if (Number.isNaN(eventDate.getTime())) return null;

  const whereClause = and(
    eq(results.eventName, eventName),
    eq(results.eventDate, eventDate),
    eq(results.raceCategory, raceCategory),
    isNotNull(results.finishTime),
  );

  // Four parallel queries — they hit different tables (or different
  // shapes of the same table), so one round-trip each is faster than
  // chaining them. The admin metadata + photos lookup is routed off
  // the event identity triple, matching how the upsert keys rows.
  const [meta, rows, metaRows, photoRows] = await Promise.all([
    db
      .select({
        eventCountry: sql<string | null>`max(${results.eventCountry})`,
        total: sql<number>`count(*)::int`,
      })
      .from(results)
      .where(whereClause),
    db
      .select({
        id: results.id,
        athleteId: athletes.id,
        athleteName: athletes.name,
        finishTime: results.finishTime,
        overallRank: results.overallRank,
        totalFinishers: results.totalFinishers,
        percentile: results.percentile,
        status: results.status,
        bib: results.bib,
      })
      .from(results)
      .innerJoin(athletes, eq(results.athleteId, athletes.id))
      .where(whereClause)
      .orderBy(asc(results.finishTime))
      .limit(MAX_PARTICIPANTS),
    db
      .select({
        id: eventMetadata.id,
        city: eventMetadata.city,
        district: eventMetadata.district,
        country: eventMetadata.country,
        summary: eventMetadata.summary,
        routeUrl: eventMetadata.routeUrl,
        routeImageUrl: eventMetadata.routeImageUrl,
      })
      .from(eventMetadata)
      .where(
        and(
          eq(eventMetadata.eventName, eventName),
          eq(eventMetadata.eventDate, eventDate),
          eq(eventMetadata.raceCategory, raceCategory),
        ),
      )
      .limit(1),
    // Photos LEFT JOIN via an inner query on metadata id — avoids a
    // separate fetch of "metadata id" first. We filter to the same
    // triple so a bad (name, date, category) returns no photos.
    db
      .select({
        id: eventPhotos.id,
        url: eventPhotos.url,
        caption: eventPhotos.caption,
        sortOrder: eventPhotos.sortOrder,
      })
      .from(eventPhotos)
      .innerJoin(
        eventMetadata,
        eq(eventPhotos.eventMetadataId, eventMetadata.id),
      )
      .where(
        and(
          eq(eventMetadata.eventName, eventName),
          eq(eventMetadata.eventDate, eventDate),
          eq(eventMetadata.raceCategory, raceCategory),
        ),
      )
      .orderBy(asc(eventPhotos.sortOrder), asc(eventPhotos.createdAt)),
  ]);

  const total = meta[0]?.total ?? 0;
  if (total === 0) return null;

  const metadata = metaRows[0] ?? null;
  // Prefer admin-curated country when present; fall back to whatever the
  // results table carries. MetaDB null or empty string → fall through.
  const eventCountry =
    (metadata?.country && metadata.country.trim()) ||
    meta[0]?.eventCountry ||
    null;

  return {
    eventName,
    eventDate: eventDate.toISOString(),
    raceCategory,
    eventCountry,
    total,
    participants: rows.map((r) => ({
      id: r.id,
      athleteId: r.athleteId,
      athleteName: r.athleteName,
      // WHERE finishTime IS NOT NULL makes this a narrow; fall back to 0
      // defensively so downstream code never sees NaN.
      finishTime: r.finishTime ?? 0,
      overallRank: r.overallRank,
      totalFinishers: r.totalFinishers,
      percentile: r.percentile != null ? Number(r.percentile) : null,
      status: r.status ?? 'unclaimed',
      bib: r.bib,
    })),
    metadata,
    photos: photoRows,
  };
}

// Fetch just the metadata + photos for a single event, keyed by the
// identity triple. Returns null if no metadata row exists yet — the
// admin edit page uses this to prefill the form, rendering a blank
// form when null.
export async function getEventMetadata(
  eventName: string,
  eventDateIso: string,
  raceCategory: string,
): Promise<{ metadata: EventMetadata; photos: EventPhoto[] } | null> {
  const eventDate = new Date(eventDateIso);
  if (Number.isNaN(eventDate.getTime())) return null;

  const where = and(
    eq(eventMetadata.eventName, eventName),
    eq(eventMetadata.eventDate, eventDate),
    eq(eventMetadata.raceCategory, raceCategory),
  );

  const metaRows = await db
    .select({
      id: eventMetadata.id,
      city: eventMetadata.city,
      district: eventMetadata.district,
      country: eventMetadata.country,
      summary: eventMetadata.summary,
      routeUrl: eventMetadata.routeUrl,
      routeImageUrl: eventMetadata.routeImageUrl,
    })
    .from(eventMetadata)
    .where(where)
    .limit(1);

  const metadata = metaRows[0] ?? null;
  if (!metadata) return null;

  const photos = await db
    .select({
      id: eventPhotos.id,
      url: eventPhotos.url,
      caption: eventPhotos.caption,
      sortOrder: eventPhotos.sortOrder,
    })
    .from(eventPhotos)
    .where(eq(eventPhotos.eventMetadataId, metadata.id))
    .orderBy(asc(eventPhotos.sortOrder), asc(eventPhotos.createdAt));

  return { metadata, photos };
}
