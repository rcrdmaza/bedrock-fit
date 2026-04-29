'use client';

// Sortable, filterable table view of every result on /results. Replaces
// the previous card grid because the user-facing spec for this page now
// asks for seven scannable columns (name, distance, pace, total time,
// event, country, year) plus explicit sort controls — a table is the
// shape that fits.
//
// The claim flow survived the rewrite: the row's last column carries
// either a status pill (claimed / pending) or a "Claim" button that
// expands an inline ClaimForm in a colspan'd row beneath. Clicking the
// athlete name takes you to their profile. Clicking the column header
// toggles sort direction; clicking a different header switches sort
// field and picks that field's natural default direction.

import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { distanceKm, formatPace } from '@/lib/race';
import {
  filterResults,
  RESULT_SEARCH_FIELDS,
  type ResultRow,
  type ResultSearchField,
} from '@/lib/results-filter';
import {
  DEFAULT_SORT,
  paceSecondsPerKm,
  sortResults,
  type ResultSortField,
  type ResultsSort,
} from '@/lib/results-sort';
import { ClaimForm, statusClasses, statusLabel } from './claim-form';

export type { ResultRow };

// Display metadata for each search field. Keeping label + placeholder
// adjacent to the field key makes the <select> / <input> wiring obvious
// and gives tests one obvious place to update if the UI copy changes.
const SEARCH_FIELD_META: Record<
  ResultSearchField,
  { label: string; placeholder: string; inputMode?: 'numeric' | 'text' }
> = {
  name: { label: 'Name', placeholder: 'e.g. Carlos Mendez' },
  bib: { label: 'BIB', placeholder: 'e.g. 1042', inputMode: 'numeric' },
  event: { label: 'Event', placeholder: 'e.g. Lima Marathon' },
  country: { label: 'Country', placeholder: 'e.g. Peru' },
};

// Distance filter chips. Ordered shortest → longest so the UI reads
// the way runners think about distances; wired straight to the
// filter's `distances` field as exact-match raceCategory strings.
const DISTANCE_CHIPS: { id: string; label: string }[] = [
  { id: '5K', label: '5K' },
  { id: '10K', label: '10K' },
  { id: 'Half Marathon', label: 'Half' },
  { id: 'Marathon', label: 'Marathon' },
];

// Per-column sort metadata. `defaultDirection` decides which way a
// fresh click on the column header sorts: dates default newest-first,
// times/pace default fastest-first, names/events alphabetical. A
// second click on the same header flips direction.
const COLUMN_DEFS: {
  id: ResultSortField;
  label: string;
  defaultDirection: 'asc' | 'desc';
  align?: 'left' | 'right';
}[] = [
  { id: 'name', label: 'Name', defaultDirection: 'asc' },
  { id: 'distance', label: 'Distance', defaultDirection: 'asc' },
  { id: 'pace', label: 'Pace /km', defaultDirection: 'asc', align: 'right' },
  { id: 'time', label: 'Total time', defaultDirection: 'asc', align: 'right' },
  { id: 'event', label: 'Event', defaultDirection: 'asc' },
  { id: 'country', label: 'Country', defaultDirection: 'asc' },
  { id: 'date', label: 'Year', defaultDirection: 'desc', align: 'right' },
];

// Max results painted into the DOM at once. Beyond this we tell the
// user to narrow the query rather than rendering 5k rows.
const MAX_VISIBLE = 200;

// Optional URL-sourced initial filter values. The /results page reads
// `?q=`, `?field=`, and `?country=` from searchParams and forwards
// them so deep links (notably the "claim your races" CTA on athlete
// profiles with no claimed results) seed the form.
export interface ResultsSearchInitial {
  searchField?: ResultSearchField;
  query?: string;
  country?: string;
}

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDistance(row: ResultRow): string {
  // Prefer the canonical category as it's stored — admins import with
  // a known label. Fall back to a "NK" parsed out of the name for
  // trail/non-canonical events. If neither resolves, render an em-dash
  // so the column never goes blank.
  if (row.raceCategory) return row.raceCategory;
  const km = distanceKm(row.raceCategory, row.eventName);
  if (km != null) return `${km} km`;
  return '—';
}

function formatYear(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return String(new Date(t).getUTCFullYear());
}

export default function ResultsSearch({
  rows,
  initial,
}: {
  rows: ResultRow[];
  initial?: ResultsSearchInitial;
}) {
  // --- filter state ---------------------------------------------------
  const [searchField, setSearchField] = useState<ResultSearchField>(
    initial?.searchField ?? 'name',
  );
  const [query, setQuery] = useState(initial?.query ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [distances, setDistances] = useState<string[]>([]);

  // --- sort state -----------------------------------------------------
  const [sort, setSort] = useState<ResultsSort>(DEFAULT_SORT);

  // --- claim state (inline expand) ------------------------------------
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Filter then sort. Two memos so a sort-only change doesn't replay
  // the filter pass over a long list.
  const filtered = useMemo(
    () =>
      filterResults(rows, {
        searchField,
        query,
        fromDate,
        toDate,
        country,
        distances,
      }),
    [rows, searchField, query, fromDate, toDate, country, distances],
  );
  const sorted = useMemo(() => sortResults(filtered, sort), [filtered, sort]);
  const visible = sorted.slice(0, MAX_VISIBLE);

  const meta = SEARCH_FIELD_META[searchField];
  const hasFilters = Boolean(
    query.trim() ||
      country.trim() ||
      fromDate ||
      toDate ||
      distances.length > 0,
  );

  function toggleDistance(id: string) {
    setDistances((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  function onHeaderClick(field: ResultSortField) {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      const def = COLUMN_DEFS.find((c) => c.id === field)!;
      return { field, direction: def.defaultDirection };
    });
  }

  return (
    <>
      {/* Primary search row — matches the field-selector + free text
          shape from the previous design so users coming back find what
          they expect. */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 mb-4">
        <div className="flex items-stretch rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
          <label htmlFor="searchField" className="sr-only">
            Search by
          </label>
          <select
            id="searchField"
            value={searchField}
            onChange={(e) =>
              setSearchField(e.target.value as ResultSearchField)
            }
            className="px-3 py-3 text-sm text-stone-700 bg-slate-50 border-r border-slate-200 focus:outline-none"
          >
            {RESULT_SEARCH_FIELDS.map((f) => (
              <option key={f} value={f}>
                {SEARCH_FIELD_META[f].label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode={meta.inputMode}
            placeholder={meta.placeholder}
            aria-label={`Search by ${meta.label}`}
            className="flex-1 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Distance chips — toggle-style filter, ANDs with the rest. We
          keep it on its own row above country/date because distance
          is now a top-level column the user might want to slice on
          first. */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-stone-500 mr-1">Distance</span>
        {DISTANCE_CHIPS.map((c) => {
          const active = distances.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleDistance(c.id)}
              aria-pressed={active}
              className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                active
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label htmlFor="filterCountry" className="text-xs text-stone-500">
            Country
          </label>
          <input
            id="filterCountry"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Peru"
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="fromDate" className="text-xs text-stone-500">
            From
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || undefined}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="toDate" className="text-xs text-stone-500">
            To
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCountry('');
              setFromDate('');
              setToDate('');
              setDistances([]);
            }}
            className="text-xs text-stone-500 hover:text-stone-900 transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">
            No results in the database yet
          </p>
          <p className="text-stone-300 text-xs mt-1">
            Check back once race data has been ingested.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No results match your filters.
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-400 mb-3">
            {sorted.length === rows.length
              ? `Showing all ${rows.length.toLocaleString()} result${rows.length !== 1 ? 's' : ''}.`
              : `${sorted.length.toLocaleString()} of ${rows.length.toLocaleString()} match${sorted.length === 1 ? '' : 'es'}.`}
            {sorted.length > MAX_VISIBLE
              ? ` Showing the first ${MAX_VISIBLE} — narrow your search to see more.`
              : ''}
          </p>

          {/* overflow-x-auto so the 8-column grid stays usable on
              narrow viewports without us re-implementing a card stack
              for mobile. */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    {COLUMN_DEFS.map((col) => (
                      <SortableHeader
                        key={col.id}
                        col={col}
                        sort={sort}
                        onClick={() => onHeaderClick(col.id)}
                      />
                    ))}
                    {/* Action column — not sortable, no label. */}
                    <th
                      scope="col"
                      className="text-right font-medium px-4 py-3 whitespace-nowrap"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((result) => {
                    const claiming = claimingId === result.id;
                    const canClaim = result.status === 'unclaimed';
                    const pace = paceSecondsPerKm(result);
                    return (
                      <Fragment key={result.id}>
                        <tr className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <Link
                              href={`/athletes/${result.athleteId}`}
                              className="font-medium text-stone-900 hover:text-blue-600 transition-colors"
                            >
                              {result.athleteName}
                            </Link>
                            {result.bib ? (
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                bib {result.bib}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                            {formatDistance(result)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
                            {formatPace(pace)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-stone-900 whitespace-nowrap">
                            {formatTime(result.finishTime)}
                          </td>
                          <td className="px-4 py-3 text-stone-700">
                            {result.eventName}
                          </td>
                          <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                            {result.eventCountry ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                            {formatYear(result.eventDate)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {canClaim ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setClaimingId(claiming ? null : result.id)
                                }
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                {claiming ? 'Cancel' : 'Claim'}
                              </button>
                            ) : (
                              <span
                                className={`inline-block text-[11px] px-2 py-1 rounded-full font-medium ${statusClasses(result.status)}`}
                              >
                                {statusLabel(result.status)}
                              </span>
                            )}
                          </td>
                        </tr>
                        {claiming && (
                          // Inline claim form. The colSpan covers every
                          // column so the form occupies the row's full
                          // width; the muted background separates it
                          // visually from sibling result rows.
                          <tr className="bg-slate-50/80 border-t border-slate-100">
                            <td colSpan={COLUMN_DEFS.length + 1} className="px-4 py-4">
                              <ClaimForm
                                resultId={result.id}
                                onCancel={() => setClaimingId(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Column header that doubles as a sort toggle. Visual indicator is a
// small arrow that points up when the column is the active asc sort,
// down when desc; absent on inactive columns. We keep the cell padding
// identical to inactive headers so the arrow doesn't shift the row.
function SortableHeader({
  col,
  sort,
  onClick,
}: {
  col: { id: ResultSortField; label: string; align?: 'left' | 'right' };
  sort: ResultsSort;
  onClick: () => void;
}) {
  const active = sort.field === col.id;
  const arrow = !active ? '' : sort.direction === 'asc' ? ' ↑' : ' ↓';
  const align = col.align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      scope="col"
      aria-sort={
        active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      className={`${align} font-medium px-4 py-3 whitespace-nowrap`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-0.5 transition-colors ${
          active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        {col.label}
        <span aria-hidden="true" className="tabular-nums w-3 inline-block">
          {arrow.trim()}
        </span>
      </button>
    </th>
  );
}

