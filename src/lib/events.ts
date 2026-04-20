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
import { athletes, results } from '@/db/schema';

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

export interface EventDetail {
  eventName: string;
  eventDate: string;
  raceCategory: string;
  eventCountry: string | null;
  participants: EventParticipant[];
  total: number;
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

  // Country lookup + ranked rows in parallel. The country query is
  // cheap (single aggregate row) and lets us render the page header
  // without waiting for the full list.
  const [meta, rows] = await Promise.all([
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
  ]);

  const total = meta[0]?.total ?? 0;
  if (total === 0) return null;

  return {
    eventName,
    eventDate: eventDate.toISOString(),
    raceCategory,
    eventCountry: meta[0]?.eventCountry ?? null,
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
  };
}
