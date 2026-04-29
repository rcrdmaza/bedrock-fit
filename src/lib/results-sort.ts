// Pure client-safe sort logic for the /results table. Lives next to
// results-filter.ts so the table component can apply filter → sort
// without dragging the postgres driver into the browser bundle.
//
// Sort fields mirror the visible table columns. Direction is just
// asc/desc; we don't try to encode "null first vs last" as a separate
// dimension because the only sensible UX in this app is nulls-last in
// both directions (a row missing a finish time is always less useful
// than one with a time, regardless of which way you're sorting).

import { distanceKm } from './race';
import type { ResultRow } from './results-filter';

export const RESULT_SORT_FIELDS = [
  'date',
  'name',
  'distance',
  'pace',
  'time',
  'event',
  'country',
] as const;
export type ResultSortField = (typeof RESULT_SORT_FIELDS)[number];

export type SortDirection = 'asc' | 'desc';

export interface ResultsSort {
  field: ResultSortField;
  direction: SortDirection;
}

// Default for fresh page loads: newest first. Matches what getResults()
// already returns from the DB, so an unsorted-state UI doesn't shuffle
// rows on first paint.
export const DEFAULT_SORT: ResultsSort = { field: 'date', direction: 'desc' };

// Pace as seconds-per-km. Returns null when either piece is missing,
// which the sort comparator pushes to the end of the list.
export function paceSecondsPerKm(row: ResultRow): number | null {
  if (row.finishTime == null || row.finishTime === 0) return null;
  const km = distanceKm(row.raceCategory, row.eventName);
  if (km == null || km === 0) return null;
  return row.finishTime / km;
}

// Comparator with nulls always trailing. We push nulls past every real
// value in both directions: in asc they belong at the end (nothing to
// compare against), and in desc the "biggest" value is still a real
// value, not "missing." The direction multiplier only applies to
// real-vs-real comparisons.
function cmp<T>(
  a: T | null,
  b: T | null,
  dir: 1 | -1,
  comparator: (x: T, y: T) => number,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return dir * comparator(a, b);
}

export function sortResults(
  rows: ResultRow[],
  sort: ResultsSort,
): ResultRow[] {
  const dir: 1 | -1 = sort.direction === 'asc' ? 1 : -1;
  const copy = [...rows];

  copy.sort((a, b) => {
    switch (sort.field) {
      case 'date': {
        // Date strings are ISO; parse once. Invalid dates fall back
        // to null so they trail.
        const ta = parseTime(a.eventDate);
        const tb = parseTime(b.eventDate);
        return cmp(ta, tb, dir, (x, y) => x - y);
      }
      case 'name':
        return cmp(a.athleteName, b.athleteName, dir, (x, y) =>
          x.localeCompare(y, undefined, { sensitivity: 'base' }),
        );
      case 'distance': {
        const da = distanceKm(a.raceCategory, a.eventName);
        const db = distanceKm(b.raceCategory, b.eventName);
        return cmp(da, db, dir, (x, y) => x - y);
      }
      case 'pace': {
        const pa = paceSecondsPerKm(a);
        const pb = paceSecondsPerKm(b);
        return cmp(pa, pb, dir, (x, y) => x - y);
      }
      case 'time':
        return cmp(a.finishTime, b.finishTime, dir, (x, y) => x - y);
      case 'event':
        return cmp(a.eventName, b.eventName, dir, (x, y) =>
          x.localeCompare(y, undefined, { sensitivity: 'base' }),
        );
      case 'country':
        return cmp(a.eventCountry, b.eventCountry, dir, (x, y) =>
          x.localeCompare(y, undefined, { sensitivity: 'base' }),
        );
    }
  });

  return copy;
}

function parseTime(iso: string): number | null {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}
