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
  // Legacy single-field path — kept so deep links from athlete profiles
  // ("?q=Carlos&field=name&country=Peru") and the existing test surface
  // stay working. The new column-header dropdowns populate the
  // per-column fields below instead, but everything ANDs together so
  // mixing legacy + new is harmless.
  searchField: ResultSearchField;
  query: string;
  // ISO YYYY-MM-DD (the native shape of <input type="date">). Either
  // bound may be empty to mean "open-ended". Inclusive on both ends.
  // Held for back-compat alongside the new fromYear/toYear fields,
  // which are what the Year column header dropdown writes to.
  fromDate: string;
  toDate: string;
  // Optional case-insensitive substring constraint applied to the
  // result's eventCountry. Doubles as the Country column header's
  // text filter — the field name predates the per-column UI but the
  // semantics are identical.
  country?: string;
  // Optional set of canonical race categories to keep. Empty / missing
  // means "any distance". Set membership is exact-match against
  // raceCategory; rows whose category isn't in the list (including
  // those with a null category) are dropped.
  distances?: string[];
  // --- per-column text filters (new, written by the column-header
  // dropdowns). Each is a case-insensitive substring match on the
  // column it names. All AND together with the legacy single-field
  // path, so a deep link can seed `searchField='name' + query='Carlos'`
  // and the user can layer an extra Event filter on top without the
  // two paths cancelling each other. ---
  nameFilter?: string;
  bibFilter?: string;
  eventFilter?: string;
  // --- year range, written by the Year column dropdown. Inclusive on
  // both ends. Either bound may be omitted to mean "open-ended". ---
  fromYear?: number;
  toYear?: number;
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
  // Materialize the distance allow-list as a Set for O(1) membership.
  // Null / empty means no distance filter — skip the check entirely.
  const distanceSet =
    filter.distances && filter.distances.length > 0
      ? new Set(filter.distances)
      : null;
  // Per-column text filters from the column-header dropdowns. Lowercase
  // once so the row loop only does string includes. Empty / missing
  // strings short-circuit so an unset filter is free.
  const nameQ = filter.nameFilter?.trim().toLowerCase() ?? '';
  const bibQ = filter.bibFilter?.trim().toLowerCase() ?? '';
  const eventQ = filter.eventFilter?.trim().toLowerCase() ?? '';
  // Year range. We accept undefined / non-finite as "open" — the UI
  // sends NaN when an input is empty, and Number(undefined) is NaN.
  const fromYear =
    typeof filter.fromYear === 'number' && Number.isFinite(filter.fromYear)
      ? filter.fromYear
      : null;
  const toYear =
    typeof filter.toYear === 'number' && Number.isFinite(filter.toYear)
      ? filter.toYear
      : null;

  if (
    !q &&
    !country &&
    fromMs == null &&
    toMs == null &&
    distanceSet == null &&
    !nameQ &&
    !bibQ &&
    !eventQ &&
    fromYear == null &&
    toYear == null
  )
    return rows;

  return rows.filter((row) => {
    if (q) {
      const hay = searchHaystack(row, filter.searchField).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (nameQ && !row.athleteName.toLowerCase().includes(nameQ)) return false;
    if (bibQ && !(row.bib ?? '').toLowerCase().includes(bibQ)) return false;
    if (eventQ && !row.eventName.toLowerCase().includes(eventQ)) return false;
    if (country) {
      // Country sub-filter — null/empty eventCountry never matches a
      // non-empty country query (drop the row rather than swallow it).
      const ec = row.eventCountry?.toLowerCase() ?? '';
      if (!ec.includes(country)) return false;
    }
    if (distanceSet) {
      // raceCategory is the row's stored canonical category. Rows with
      // null/unknown categories are dropped when a distance filter is
      // active — the user explicitly asked for "these distances" and
      // "missing" isn't one of them.
      if (row.raceCategory == null) return false;
      if (!distanceSet.has(row.raceCategory)) return false;
    }
    if (fromMs != null || toMs != null) {
      const t = Date.parse(row.eventDate);
      if (!Number.isFinite(t)) return false;
      if (fromMs != null && t < fromMs) return false;
      if (toMs != null && t > toMs) return false;
    }
    if (fromYear != null || toYear != null) {
      // Year range uses the row's eventDate parsed as UTC year, so it
      // matches what the table renders in the Year column.
      const t = Date.parse(row.eventDate);
      if (!Number.isFinite(t)) return false;
      const y = new Date(t).getUTCFullYear();
      if (fromYear != null && y < fromYear) return false;
      if (toYear != null && y > toYear) return false;
    }
    return true;
  });
}
