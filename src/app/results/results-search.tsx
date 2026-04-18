'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { distanceKm } from '@/lib/race';
import type { ResultRow } from '@/lib/results';
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
  const [query, setQuery] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (query.length <= 1) return [];
    const q = query.toLowerCase();
    return rows.filter((r) => r.athleteName.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <>
      <div className="flex items-center gap-3 mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter athlete name..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {query.length > 1 && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No results found for &quot;{query}&quot;
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
          </p>
          {filtered.map((result) => {
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
      )}

      {query.length === 0 && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No results in the database yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Check back once race data has been ingested.
          </p>
        </div>
      )}

      {query.length === 0 && rows.length > 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">Start typing to search results</p>
          <p className="text-gray-300 text-xs mt-1">
            {rows.length.toLocaleString()} result
            {rows.length !== 1 ? 's' : ''} indexed across{' '}
            {new Set(rows.map((r) => r.athleteName)).size} athletes
          </p>
        </div>
      )}
    </>
  );
}
