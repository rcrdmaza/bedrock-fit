// Client-safe types and filter logic for the /results page. Separated
// from `src/lib/results.ts` so the client component can import it
// without transitively pulling in the postgres driver (which fails the
// browser bundle).
//
// Pure — no DB access, no React, no environment assumptions. The server
// re-exports these symbols from `src/lib/results.ts` so callers have
// one entry point on the server side.

export type ResultRow = {
  id: string;
  athleteId: string;
  athleteName: string;
  eventName: string;
  eventDate: string; // ISO string
  raceCategory: string | null;
  finishTime: number | null;
  overallRank: number | null;
  totalFinishers: number | null;
  percentile: number | null;
  status: string;
  // Optional per-result fields added to support bib / country search.
  // Null when the import CSV didn't include them or the row predates
  // those columns.
  bib: string | null;
  eventCountry: string | null;
};

// Search field options on /results. The UI picks one of these as the
// primary text-search target; the date range is always applied on top.
// Keeping the list as `as const` lets TS infer the literal union for
// ResultsFilter.searchField without a second type declaration.
export const RESULT_SEARCH_FIELDS = [
  'name',
  'bib',
  'event',
  'country',
] as const;
export type ResultSearchField = (typeof RESULT_SEARCH_FIELDS)[number];

export interface ResultsFilter {
  // Which column the `query` string targets. Always required — the UI
  // defaults to "name" so the search box has a meaningful placeholder.
  searchField: ResultSearchField;
  query: string;
  // ISO YYYY-MM-DD (the native shape of <input type="date">). Either
  // bound may be empty to mean "open-ended". Inclusive on both ends.
  fromDate: string;
  toDate: string;
  // Optional case-insensitive substring constraint applied to the
  // result's eventCountry, ANDed with whatever the primary search
  // field already filtered. Empty / undefined means "any country".
  // Lets the profile page deep-link "search my name in my country"
  // and the user combine "name = X + country = Peru" without
  // exhausting the single primary-field slot above.
  country?: string;
}

// Return the field we test `query` against for a given row. Isolating
// this keeps filterResults small and gives tests one obvious knob.
function searchHaystack(row: ResultRow, field: ResultSearchField): string {
  switch (field) {
    case 'name':
      return row.athleteName;
    case 'bib':
      return row.bib ?? '';
    case 'event':
      return row.eventName;
    case 'country':
      return row.eventCountry ?? '';
  }
}

// Pure client-side filter. Callers pass the full ResultRow list (already
// sorted newest-first by getResults) and the current UI state; we
// return a new array preserving order. Empty query + empty date range
// returns the list unchanged.
export function filterResults(
  rows: ResultRow[],
  filter: ResultsFilter,
): ResultRow[] {
  const q = filter.query.trim().toLowerCase();
  const country = filter.country?.trim().toLowerCase() ?? '';
  // <input type="date"> emits YYYY-MM-DD. Parsing as UTC midnight keeps
  // comparisons stable regardless of the admin's local timezone.
  const fromMs = filter.fromDate
    ? Date.parse(`${filter.fromDate}T00:00:00Z`)
    : null;
  // End bound is INCLUSIVE — add one day minus 1 ms so an event on
  // toDate matches even if its timestamp is late-day UTC.
  const toMs = filter.toDate
    ? Date.parse(`${filter.toDate}T00:00:00Z`) + 24 * 3600 * 1000 - 1
    : null;

  if (!q && !country && fromMs == null && toMs == null) return rows;

  return rows.filter((row) => {
    if (q) {
      const hay = searchHaystack(row, filter.searchField).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (country) {
      // Country sub-filter — null/empty eventCountry never matches a
      // non-empty country query (drop the row rather than swallow it).
      const ec = row.eventCountry?.toLowerCase() ?? '';
      if (!ec.includes(country)) return false;
    }
    if (fromMs != null || toMs != null) {
      const t = Date.parse(row.eventDate);
      if (!Number.isFinite(t)) return false;
      if (fromMs != null && t < fromMs) return false;
      if (toMs != null && t > toMs) return false;
    }
    return true;
  });
}
