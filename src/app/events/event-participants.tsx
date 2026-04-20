'use client';

// Ranked participant list for one event. Pure UI — no filtering, no
// re-sorting — because the server already returned rows ordered by
// finish time. We just paint rows and manage which row (if any) has
// the claim form open.

import Link from 'next/link';
import { useState } from 'react';
import type { EventParticipant } from '@/lib/events';
import { ClaimForm, statusClasses, statusLabel } from '@/app/results/claim-form';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Absolute rank = server order (ASC by finishTime) + 1. We don't trust
// r.overallRank here because that's the chip-timing rank from the
// source event, which can disagree with our slice if a row was
// excluded (DNF filter, hidden, etc.).
export default function EventParticipants({
  participants,
}: {
  participants: EventParticipant[];
}) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (participants.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
        No finishers on file for this event.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((p, idx) => {
        const claiming = claimingId === p.id;
        const canClaim = p.status === 'unclaimed';
        return (
          <div
            key={p.id}
            className="group border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="tabular-nums text-gray-400 w-8 shrink-0 text-sm pt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/athletes/${p.athleteId}`}
                  className="block"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                        {p.athleteName}
                        <span
                          aria-hidden="true"
                          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          →
                        </span>
                      </div>
                      {p.bib ? (
                        <div className="text-xs text-gray-400 mt-0.5">
                          bib {p.bib}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusClasses(p.status)}`}
                    >
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">
                        Finish time
                      </div>
                      <div className="text-sm font-medium text-gray-900 tabular-nums">
                        {formatTime(p.finishTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">
                        Overall rank
                      </div>
                      <div className="text-sm font-medium text-gray-900 tabular-nums">
                        {p.overallRank ?? '—'}
                        {p.totalFinishers ? ` / ${p.totalFinishers}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">
                        Percentile
                      </div>
                      <div className="text-sm font-medium text-gray-900 tabular-nums">
                        {p.percentile != null
                          ? `Top ${(100 - p.percentile).toFixed(1)}%`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Claim CTA stays outside the Link so clicking the
                    button doesn't trigger athlete navigation. */}
                <div className="mt-4">
                  {claiming ? (
                    <ClaimForm
                      resultId={p.id}
                      onCancel={() => setClaimingId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => canClaim && setClaimingId(p.id)}
                      className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      disabled={!canClaim}
                    >
                      {canClaim
                        ? 'Claim this result'
                        : statusLabel(p.status)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
