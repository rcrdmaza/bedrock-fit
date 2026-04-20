'use client';

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
import { claimResults, type BulkClaimState } from '@/app/actions/claim';

// Shape of the result cards rendered here. Mirrors what the server page
// already has in memory so it can pass rows through without a re-query.
// Dates come over the wire as either a string (JSON-serialized) or a
// native Date depending on how Drizzle hands them off — accept both.
export interface RaceHistoryRow {
  id: string;
  eventName: string;
  eventDate: string | Date | null;
  raceCategory: string | null;
  finishTime: number | null;
  overallRank: number | null;
  totalFinishers: number | null;
  percentile: string | null;
  status: string | null;
}

const INITIAL: BulkClaimState = { status: 'idle' };

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusLabel(status: string | null): string {
  if (status === 'claimed') return 'Claimed';
  if (status === 'pending') return 'Pending';
  return 'Unclaimed';
}

function statusClasses(status: string | null): string {
  if (status === 'claimed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'bg-sky-50 text-sky-700';
  return 'bg-amber-50 text-amber-700';
}

export default function RaceHistory({ rows }: { rows: RaceHistoryRow[] }) {
  // Checked set lives in client state. Initial state is empty — we don't
  // preselect anything so a casual visitor doesn't accidentally claim.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(claimResults, INITIAL);

  // Only unclaimed rows are checkable. Everything else shows status as
  // read-only. Split up-front so we can render "Select all" sensibly.
  const unclaimed = useMemo(
    () => rows.filter((r) => r.status === 'unclaimed'),
    [rows],
  );
  const anyUnclaimed = unclaimed.length > 0;
  const allSelected =
    anyUnclaimed && unclaimed.every((r) => selected.has(r.id));
  const selectedCount = selected.size;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) return new Set();
      const next = new Set(prev);
      for (const r of unclaimed) next.add(r.id);
      return next;
    });
  }

  // After a successful submit, clear selection so the banner reflects a
  // done state and the user can't double-submit the same rows. The
  // server revalidates the page, so the new (pending) statuses arrive
  // on the next render anyway — this just ensures our local checkbox
  // state doesn't lag behind.
  useEffect(() => {
    if (state.status === 'success') setSelected(new Set());
  }, [state.status]);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-gray-900">Race history</h2>
        <div className="flex items-center gap-3">
          {anyUnclaimed && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              {allSelected ? 'Clear selection' : 'Select all unclaimed'}
            </button>
          )}
          <span className="text-xs text-gray-400">
            {rows.filter((r) => r.status === 'claimed').length} of {rows.length}{' '}
            claimed
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
          No results on file for this athlete yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const canClaim = r.status === 'unclaimed';
            const checked = selected.has(r.id);
            return (
              <label
                key={r.id}
                // `label` so the whole card toggles the checkbox, but only
                // when the row is unclaimed — otherwise cursor-default.
                className={`block border rounded-2xl p-5 transition-colors ${
                  canClaim
                    ? checked
                      ? 'border-blue-400 bg-blue-50/40 cursor-pointer'
                      : 'border-gray-100 hover:border-gray-300 cursor-pointer'
                    : 'border-gray-100 cursor-default'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Fixed-width slot so claimed/pending rows line up with
                      unclaimed rows even though they don't show a box. */}
                  <div className="w-5 flex-shrink-0 pt-0.5">
                    {canClaim && (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(r.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${r.eventName} for claim`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {r.eventName}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {r.eventDate
                            ? new Date(r.eventDate).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                },
                              )
                            : 'Date unknown'}
                          {r.raceCategory ? ` · ${r.raceCategory}` : ''}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusClasses(r.status)}`}
                      >
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Finish time
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatTime(r.finishTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Overall rank
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {r.overallRank ?? '—'}
                          {r.totalFinishers ? ` / ${r.totalFinishers}` : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Percentile
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {r.percentile != null
                            ? `Top ${(100 - Number(r.percentile)).toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Claim panel — sticky-feeling bar that only appears once the user
          has checked at least one row. Keeps the profile page calm when
          there's nothing to do. */}
      {anyUnclaimed && (
        <form
          action={formAction}
          className="mt-8 rounded-2xl border border-gray-100 p-6 bg-white"
        >
          {/* Hidden inputs — one per selected id so FormData carries an
              array-shaped "resultIds" field the server action can read. */}
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="resultIds" value={id} />
          ))}

          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Claim your results
            </h3>
            <span className="text-xs text-gray-400">
              {selectedCount === 0
                ? 'Select the rows that belong to you'
                : `${selectedCount} selected`}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="claim-email"
                className="block text-xs text-gray-500 mb-1"
              >
                Your email
              </label>
              <input
                id="claim-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="claim-note"
                className="block text-xs text-gray-500 mb-1"
              >
                Verification note{' '}
                <span className="text-gray-400">
                  (bib #, strava link, anything that proves it was you —
                  covers every row you&apos;ve selected)
                </span>
              </label>
              <textarea
                id="claim-note"
                name="note"
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {state.status === 'error' && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
            {state.status === 'success' && (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                Submitted {state.claimed} claim
                {state.claimed === 1 ? '' : 's'}. We&apos;ll email you once
                they&apos;re reviewed.
                {state.skipped > 0
                  ? ` (${state.skipped} were no longer available.)`
                  : ''}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={pending || selectedCount === 0}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending
                  ? 'Submitting…'
                  : selectedCount === 0
                    ? 'Submit claim'
                    : `Claim ${selectedCount} result${selectedCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
