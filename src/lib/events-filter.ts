// Client-safe types and filter logic for the events view. Mirrors the
// split we use for /results: pure — no DB, no React, no env — so the
// client component can import it without dragging the postgres driver
// into the browser bundle.
//
// An "event" here is one (eventName, eventDate, raceCategory) tuple.
// Two categories on the same race day are two events: Lima Marathon's
// 10K and Marathon are listed separately because they're ranked
// independently and a participant usually runs one or the other.

export type EventSummary = {
  // Stable composite key for React + routing. Format kept opaque on
  // purpose — callers should treat it as a string, not parse it.
  key: string;
  eventName: string;
  eventDate: string; // ISO
  raceCategory: string;
  // Picked via MAX() at query time, so if rows disagree we still get
  // one deterministic value rather than duplicate groups.
  eventCountry: string | null;
  // Only rows with a finish time count — DNF/DSQ aren't "participants"
  // for ranking purposes.
  participantCount: number;
};

export interface EventsFilter {
  // Free-text substring over the event name. The country gets its own
  // field because users think of "all events in Peru" and "events
  // called Lima" as separate axes.
  query: string;
  country: string;
  // Same YYYY-MM-DD shape as /results. Inclusive on both ends.
  fromDate: string;
  toDate: string;
}

// Build the composite key server-side so client and server agree on
// the identity of a given event. Exposed so the /events detail page
// can derive the same key from (name, date, category) in URL params.
export function eventKey(
  eventName: string,
  eventDate: string,
  raceCategory: string,
): string {
  // `|` is picked over `-` because race names can contain dashes; the
  // pipe is extremely unlikely to appear in any real event name.
  return `${eventName}|${eventDate}|${raceCategory}`;
}

export function filterEvents(
  events: EventSummary[],
  filter: EventsFilter,
): EventSummary[] {
  const q = filter.query.trim().toLowerCase();
  const c = filter.country.trim().toLowerCase();
  const fromMs = filter.fromDate
    ? Date.parse(`${filter.fromDate}T00:00:00Z`)
    : null;
  // End-of-day inclusive — same convention as the /results filter so
  // an event on toDate still matches.
  const toMs = filter.toDate
    ? Date.parse(`${filter.toDate}T00:00:00Z`) + 24 * 3600 * 1000 - 1
    : null;

  if (!q && !c && fromMs == null && toMs == null) return events;

  return events.filter((ev) => {
    if (q && !ev.eventName.toLowerCase().includes(q)) return false;
    if (c) {
      // Missing country never matches a country query — otherwise
      // filtering for "peru" would spuriously include every null-country
      // event.
      if (!ev.eventCountry) return false;
      if (!ev.eventCountry.toLowerCase().includes(c)) return false;
    }
    if (fromMs != null || toMs != null) {
      const t = Date.parse(ev.eventDate);
      if (!Number.isFinite(t)) return false;
      if (fromMs != null && t < fromMs) return false;
      if (toMs != null && t > toMs) return false;
    }
    return true;
  });
}
