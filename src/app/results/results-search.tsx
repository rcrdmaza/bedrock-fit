'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { distanceKm } from '@/lib/race';
import {
  filterResults,
  RESULT_SEARCH_FIELDS,
  type ResultRow,
  type ResultSearchField,
} from '@/lib/results-filter';
import { claimResult, type ClaimState } from '@/app/actions/claim';

export type { ResultRow };

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusLabel(status: string) {
  if (status === 'claimed') return 'Claimed';
  if (status === 'pending') return 'Pending';
  return 'Unclaimed';
}

function statusClasses(status: string) {
  if (status === 'claimed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'bg-sky-50 text-sky-700';
  return 'bg-amber-50 text-amber-700';
}

function avgSpeedKmh(
  finishTime: number | null,
  raceCategory: string | null,
  eventName: string,
): string {
  const d = distanceKm(raceCategory, eventName);
  if (finishTime == null || finishTime === 0 || d == null) return '—';
  return `${(d / (finishTime / 3600)).toFixed(1)} km/h avg`;
}

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

// Max results shown in the list at once. Beyond this we tell the user
// to narrow the query rather than painting 5k rows into the DOM.
const MAX_VISIBLE = 200;

// The initial state that useActionState starts from.
const INITIAL_CLAIM: ClaimState = { status: 'idle' };

function ClaimForm({
  resultId,
  onCancel,
}: {
  resultId: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    claimResult,
    INITIAL_CLAIM,
  );

  if (state.status === 'success') {
    return (
      <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
        Claim submitted. We&apos;ll email you once it&apos;s reviewed.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="resultId" value={resultId} />
      <div>
        <label
          htmlFor={`email-${resultId}`}
          className="block text-xs text-gray-500 mb-1"
        >
          Your email
        </label>
        <input
          id={`email-${resultId}`}
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor={`note-${resultId}`}
          className="block text-xs text-gray-500 mb-1"
        >
          Verification note{' '}
          <span className="text-gray-400">
            (bib #, strava link, anything that proves it was you)
          </span>
        </label>
        <textarea
          id={`note-${resultId}`}
          name="note"
          maxLength={500}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {state.status === 'error' && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Submit claim'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-xs text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ResultsSearch({ rows }: { rows: ResultRow[] }) {
  // Dropdown picks the primary text field; the input's placeholder and
  // input-mode change with it. Date range stays visible always.
  const [searchField, setSearchField] = useState<ResultSearchField>('name');
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterResults(rows, { searchField, query, fromDate, toDate }),
    [rows, searchField, query, fromDate, toDate],
  );

  // getResults already orders by eventDate desc, so filtered preserves
  // that ordering. We just slice to keep the DOM reasonable.
  const visible = filtered.slice(0, MAX_VISIBLE);
  const meta = SEARCH_FIELD_META[searchField];
  const hasFilters = Boolean(query.trim() || fromDate || toDate);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 mb-4">
        <div className="flex items-stretch rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
          <label htmlFor="searchField" className="sr-only">
            Search by
          </label>
          <select
            id="searchField"
            value={searchField}
            onChange={(e) =>
              setSearchField(e.target.value as ResultSearchField)
            }
            className="px-3 py-3 text-sm text-gray-700 bg-gray-50 border-r border-gray-200 focus:outline-none"
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
            className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label htmlFor="fromDate" className="text-xs text-gray-500">
            From
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            // max enforces from ≤ to when the user sets "to" first. The
            // filter logic tolerates inverted ranges (returns []), but
            // nudging the picker prevents that state in practice.
            max={toDate || undefined}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="toDate" className="text-xs text-gray-500">
            To
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFromDate('');
              setToDate('');
            }}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No results in the database yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Check back once race data has been ingested.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No results match your filters.
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length === rows.length
              ? `Showing all ${rows.length.toLocaleString()} result${rows.length !== 1 ? 's' : ''}, most recent first.`
              : `${filtered.length.toLocaleString()} of ${rows.length.toLocaleString()} match${filtered.length === 1 ? '' : 'es'}.`}
            {filtered.length > MAX_VISIBLE
              ? ` Showing the first ${MAX_VISIBLE} — narrow your search to see more.`
              : ''}
          </p>
          <div className="space-y-3">
            {visible.map((result) => {
              const claiming = claimingId === result.id;
              const canClaim = result.status === 'unclaimed';
              return (
                <div
                  key={result.id}
                  className="group border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  {/* Clickable area → athlete profile. The claim form lives
                      outside this link so its inputs don't trigger nav. */}
                  <Link
                    href={`/athletes/${result.athleteId}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {result.athleteName}
                          <span
                            aria-hidden="true"
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            →
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {avgSpeedKmh(
                            result.finishTime,
                            result.raceCategory,
                            result.eventName,
                          )}
                          {result.bib ? ` · bib ${result.bib}` : ''}
                          {result.eventCountry
                            ? ` · ${result.eventCountry}`
                            : ''}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusClasses(result.status)}`}
                      >
                        {statusLabel(result.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Finish time
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatTime(result.finishTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Overall rank
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {result.overallRank ?? '—'}
                          {result.totalFinishers
                            ? ` / ${result.totalFinishers}`
                            : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Percentile
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {result.percentile != null
                            ? `Top ${(100 - result.percentile).toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Event</div>
                        <div className="text-sm font-medium text-gray-900">
                          {result.eventName}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(result.eventDate).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Claim action — outside the Link so clicks here don't nav. */}
                  {claiming ? (
                    <ClaimForm
                      resultId={result.id}
                      onCancel={() => setClaimingId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => canClaim && setClaimingId(result.id)}
                      className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      disabled={!canClaim}
                    >
                      {canClaim ? 'Claim this result' : statusLabel(result.status)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
