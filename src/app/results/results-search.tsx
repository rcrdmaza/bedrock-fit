'use client';

// Sortable, filterable table view of every result on /results. Filter +
// sort controls live in column-header dropdowns rather than a separate
// toolbar — clicking a column header opens a popover with sort buttons
// and (where it makes sense) a column-specific filter widget. A small
// blue dot next to the column label signals "this column is filtering
// the row set" so users can spot active filters at a glance.
//
// Columns:
//   Name      sort + text filter
//   Distance  sort + chip multi-select
//   Pace /km  sort only
//   Total     sort only
//   Event     sort + text filter
//   Country   sort + text filter
//   Year      sort + integer year-range filter
//
// The claim flow survived the rewrite: each unclaimed row carries a
// "Claim" button that expands an inline ClaimForm in a colSpan'd row
// beneath the result. Existing deep links (?q=&field=&country=) seed
// the matching column-filter on first render so the "claim your races"
// CTA on athlete profiles still works.

import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { distanceOutline } from '@/lib/distance-color';
import { distanceKm, formatPace } from '@/lib/race';
import {
  filterResults,
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
import ColumnMenu from './column-menu';

export type { ResultRow };

// Distance filter chips. Ordered shortest → longest so the UI reads
// the way runners think about distances; values are exact-match
// raceCategory strings.
const DISTANCE_CHIPS: { id: string; label: string }[] = [
  { id: '5K', label: '5K' },
  { id: '10K', label: '10K' },
  { id: 'Half Marathon', label: 'Half' },
  { id: 'Marathon', label: 'Marathon' },
];

// Per-column metadata: which sort field, default direction (matters for
// the Asc/Desc buttons in the popover so the active state matches what
// "ascending" means for that column), and visual alignment.
interface ColumnDef {
  id: ResultSortField;
  label: string;
  align?: 'left' | 'right';
  // Header column min-width nudges the cells wider so the table looks
  // intentional rather than crammed. We pick widths column-by-column
  // because Name and Event need more room than Pace or Year.
  minWidth: string;
}

const COLUMN_DEFS: ColumnDef[] = [
  { id: 'name', label: 'Name', minWidth: '14rem' },
  { id: 'distance', label: 'Distance', minWidth: '8rem' },
  { id: 'pace', label: 'Pace /km', align: 'right', minWidth: '7rem' },
  { id: 'time', label: 'Total time', align: 'right', minWidth: '7rem' },
  { id: 'event', label: 'Event', minWidth: '14rem' },
  { id: 'country', label: 'Country', minWidth: '8rem' },
  { id: 'date', label: 'Year', align: 'right', minWidth: '5rem' },
];

const MAX_VISIBLE = 200;

// Optional URL-sourced initial filter values. The /results page reads
// `?q=`, `?field=`, and `?country=` from searchParams and forwards
// them so deep links (notably the "claim your races" CTA on athlete
// profiles with no claimed results) seed the form. We translate the
// legacy single-field shape onto the matching column filter on first
// render — the Name column dropdown shows the seeded query, the
// Country column dropdown shows the seeded country, etc.
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

// Translate the legacy initial state (single text field + country) into
// the column-filter slots that the new UI surfaces. The deep link only
// supplies one of name/bib/event/country, so at most one of the text
// filters seeds; country always seeds independently.
function seedColumnFilters(initial?: ResultsSearchInitial): {
  nameFilter: string;
  bibFilter: string;
  eventFilter: string;
  countryFilter: string;
} {
  if (!initial) {
    return { nameFilter: '', bibFilter: '', eventFilter: '', countryFilter: '' };
  }
  const q = initial.query ?? '';
  const country = initial.country ?? '';
  const field = initial.searchField ?? 'name';
  return {
    nameFilter: field === 'name' ? q : '',
    bibFilter: field === 'bib' ? q : '',
    eventFilter: field === 'event' ? q : '',
    // The legacy `country` slot AND the searchField='country' slot
    // both point at eventCountry. Prefer the dedicated `country` if
    // both are set; otherwise fall back to the primary query.
    countryFilter: country || (field === 'country' ? q : ''),
  };
}

export default function ResultsSearch({
  rows,
  initial,
}: {
  rows: ResultRow[];
  initial?: ResultsSearchInitial;
}) {
  const seeded = seedColumnFilters(initial);

  // --- per-column filter state --------------------------------------
  const [nameFilter, setNameFilter] = useState(seeded.nameFilter);
  const [bibFilter, setBibFilter] = useState(seeded.bibFilter);
  const [eventFilter, setEventFilter] = useState(seeded.eventFilter);
  const [countryFilter, setCountryFilter] = useState(seeded.countryFilter);
  const [distances, setDistances] = useState<string[]>([]);
  const [fromYear, setFromYear] = useState<string>('');
  const [toYear, setToYear] = useState<string>('');

  // --- sort state ----------------------------------------------------
  const [sort, setSort] = useState<ResultsSort>(DEFAULT_SORT);

  // --- claim state (inline expand) ----------------------------------
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Filter then sort. Two memos so a sort-only change doesn't replay
  // the filter pass over a long list.
  const filtered = useMemo(
    () =>
      filterResults(rows, {
        // Legacy fields kept neutral — the dropdowns drive the
        // per-column filters below instead.
        searchField: 'name',
        query: '',
        fromDate: '',
        toDate: '',
        country: countryFilter,
        distances,
        nameFilter,
        bibFilter,
        eventFilter,
        // Number('') is 0, which would silently filter out every row.
        // parseInt('', 10) gives NaN, which the filter treats as
        // "open-ended". That's the intent here.
        fromYear: fromYear === '' ? Number.NaN : Number(fromYear),
        toYear: toYear === '' ? Number.NaN : Number(toYear),
      }),
    [
      rows,
      nameFilter,
      bibFilter,
      eventFilter,
      countryFilter,
      distances,
      fromYear,
      toYear,
    ],
  );
  const sorted = useMemo(() => sortResults(filtered, sort), [filtered, sort]);
  const visible = sorted.slice(0, MAX_VISIBLE);

  const hasFilters = Boolean(
    nameFilter.trim() ||
      bibFilter.trim() ||
      eventFilter.trim() ||
      countryFilter.trim() ||
      distances.length > 0 ||
      fromYear ||
      toYear,
  );

  function toggleDistance(id: string) {
    setDistances((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  function setSortFor(field: ResultSortField, direction: 'asc' | 'desc') {
    setSort({ field, direction });
  }

  return (
    <>
      {/* Lightweight summary + reset row above the table. Everything
          else (sort + filter) lives in the column headers now. */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-xs text-stone-400">
          {rows.length === 0
            ? null
            : sorted.length === rows.length
              ? `Showing all ${rows.length.toLocaleString()} result${rows.length !== 1 ? 's' : ''}.`
              : `${sorted.length.toLocaleString()} of ${rows.length.toLocaleString()} match${sorted.length === 1 ? '' : 'es'}.`}
          {sorted.length > MAX_VISIBLE
            ? ` Showing the first ${MAX_VISIBLE} — narrow your filters to see more.`
            : ''}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setNameFilter('');
              setBibFilter('');
              setEventFilter('');
              setCountryFilter('');
              setDistances([]);
              setFromYear('');
              setToYear('');
            }}
            className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
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
        // overflow-visible on the wrapper so the column-header
        // popovers can escape the rounded card border on narrow
        // viewports. The inner div re-applies overflow-x-auto only
        // for horizontal scrolling, not vertical.
        <div className="border border-slate-100 rounded-2xl">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide">
                <tr>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[0].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Name"
                      field="name"
                      sort={sort}
                      hasFilter={Boolean(
                        nameFilter.trim() || bibFilter.trim(),
                      )}
                      onSortAsc={() => setSortFor('name', 'asc')}
                      onSortDesc={() => setSortFor('name', 'desc')}
                    >
                      <FilterTextInput
                        id="filter-name"
                        label="Name contains"
                        value={nameFilter}
                        onChange={setNameFilter}
                        placeholder="Carlos"
                      />
                      <FilterTextInput
                        id="filter-bib"
                        label="Bib contains"
                        value={bibFilter}
                        onChange={setBibFilter}
                        placeholder="1042"
                        inputMode="numeric"
                      />
                    </ColumnMenu>
                  </th>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[1].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Distance"
                      field="distance"
                      sort={sort}
                      hasFilter={distances.length > 0}
                      onSortAsc={() => setSortFor('distance', 'asc')}
                      onSortDesc={() => setSortFor('distance', 'desc')}
                    >
                      <fieldset className="space-y-1.5">
                        <legend className="text-[11px] text-stone-500 mb-1">
                          Show distances
                        </legend>
                        <div className="flex flex-wrap gap-1.5">
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
                      </fieldset>
                    </ColumnMenu>
                  </th>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[2].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Pace /km"
                      field="pace"
                      sort={sort}
                      align="right"
                      onSortAsc={() => setSortFor('pace', 'asc')}
                      onSortDesc={() => setSortFor('pace', 'desc')}
                    />
                  </th>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[3].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Total time"
                      field="time"
                      sort={sort}
                      align="right"
                      onSortAsc={() => setSortFor('time', 'asc')}
                      onSortDesc={() => setSortFor('time', 'desc')}
                    />
                  </th>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[4].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Event"
                      field="event"
                      sort={sort}
                      hasFilter={Boolean(eventFilter.trim())}
                      onSortAsc={() => setSortFor('event', 'asc')}
                      onSortDesc={() => setSortFor('event', 'desc')}
                    >
                      <FilterTextInput
                        id="filter-event"
                        label="Event contains"
                        value={eventFilter}
                        onChange={setEventFilter}
                        placeholder="Lima Marathon"
                      />
                    </ColumnMenu>
                  </th>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[5].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Country"
                      field="country"
                      sort={sort}
                      hasFilter={Boolean(countryFilter.trim())}
                      onSortAsc={() => setSortFor('country', 'asc')}
                      onSortDesc={() => setSortFor('country', 'desc')}
                    >
                      <FilterTextInput
                        id="filter-country"
                        label="Country contains"
                        value={countryFilter}
                        onChange={setCountryFilter}
                        placeholder="Peru"
                      />
                    </ColumnMenu>
                  </th>
                  <th
                    scope="col"
                    style={{ minWidth: COLUMN_DEFS[6].minWidth }}
                    className="font-medium px-4 py-3"
                  >
                    <ColumnMenu
                      label="Year"
                      field="date"
                      sort={sort}
                      align="right"
                      hasFilter={Boolean(fromYear || toYear)}
                      onSortAsc={() => setSortFor('date', 'asc')}
                      onSortDesc={() => setSortFor('date', 'desc')}
                    >
                      <fieldset className="space-y-2">
                        <legend className="text-[11px] text-stone-500">
                          Year range
                        </legend>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={fromYear}
                            onChange={(e) => setFromYear(e.target.value)}
                            placeholder="2020"
                            min={1900}
                            max={2100}
                            aria-label="From year"
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-stone-400">to</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={toYear}
                            onChange={(e) => setToYear(e.target.value)}
                            placeholder="2026"
                            min={1900}
                            max={2100}
                            aria-label="To year"
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </fieldset>
                    </ColumnMenu>
                  </th>
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
                  // Distance-based outline: 10K → light blue, Half →
                  // blue, Marathon → dark blue, others (5K/Trail/null)
                  // → no outline. Applied per-cell because <tr>
                  // doesn't accept a real CSS border in any browser.
                  const outline = distanceOutline(result.raceCategory);
                  return (
                    <Fragment key={result.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className={`px-4 py-3 ${outline.cellLeading || 'border-t border-slate-100'}`}>
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
                        <td className={`px-4 py-3 text-stone-700 whitespace-nowrap ${outline.cell || 'border-t border-slate-100'}`}>
                          {formatDistance(result)}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums text-stone-700 whitespace-nowrap ${outline.cell || 'border-t border-slate-100'}`}>
                          {formatPace(pace)}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums font-medium text-stone-900 whitespace-nowrap ${outline.cell || 'border-t border-slate-100'}`}>
                          {formatTime(result.finishTime)}
                        </td>
                        <td className={`px-4 py-3 text-stone-700 ${outline.cell || 'border-t border-slate-100'}`}>
                          {result.eventName}
                        </td>
                        <td className={`px-4 py-3 text-stone-700 whitespace-nowrap ${outline.cell || 'border-t border-slate-100'}`}>
                          {result.eventCountry ?? '—'}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums text-stone-700 ${outline.cell || 'border-t border-slate-100'}`}>
                          {formatYear(result.eventDate)}
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap ${outline.cellTrailing || 'border-t border-slate-100'}`}>
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
                        <tr className="bg-slate-50/80 border-t border-slate-100">
                          <td
                            colSpan={COLUMN_DEFS.length + 1}
                            className="px-4 py-4"
                          >
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
      )}
    </>
  );
}

// Tiny helper for the text-input filters that show up in the Name,
// Event, and Country dropdowns. Standardizes spacing + label so each
// column doesn't grow its own variation.
function FilterTextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: 'numeric' | 'text';
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] text-stone-500">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
