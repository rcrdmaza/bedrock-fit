'use client';

// Claim-suggestion panel rendered on athlete profiles that have zero
// results on file. We rank the global results pool by name similarity
// (see src/lib/name-match.ts) and show up to 10 unclaimed candidates
// here so the user can claim them inline without leaving the page.
//
// Why a client component? Each row needs its own "claim this" toggle
// and the inline ClaimForm is already client-only. Server-rendering
// the list and dropping in the same form per row would mean every row
// shares one client island; we want independent state per row.
//
// The frame is intentionally loud (navy border + "Are any of these
// you?" header) — it lives in the slot where the empty "no results
// yet" message used to be, and it's the user's main path to building
// out their profile. Navy ties to the brand's primary blue without
// competing with the amber tier accents on tiered profiles or the
// emerald success states elsewhere.

import Link from 'next/link';
import { useState } from 'react';
import type { ResultRow } from '@/lib/results-filter';
import { ClaimForm } from '@/app/results/claim-form';

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface Props {
  athleteName: string;
  // Pre-ranked candidates from the server, capped at 10.
  candidates: ResultRow[];
  // The deeper "search the whole pool" link — same href the no-claims
  // CTA uses, surfaced again at the bottom of the panel so the user
  // can keep going past the 10 we showed.
  searchHref: string;
}

export default function SuggestedClaims({
  athleteName,
  candidates,
  searchHref,
}: Props) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  return (
    <section
      aria-label="Suggested results to claim"
      className="rounded-2xl border-2 border-blue-900 bg-blue-50/60 p-5"
    >
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <h2 className="text-base font-semibold text-stone-900">
          Are any of these you?
        </h2>
        <span className="text-xs text-stone-500 shrink-0">
          {candidates.length} match{candidates.length === 1 ? '' : 'es'}
        </span>
      </div>
      <p className="text-xs text-stone-600 mb-4 leading-relaxed">
        We don&apos;t see any races on{' '}
        <span className="font-medium text-stone-800">{athleteName}</span>
        &apos;s profile yet. Below are unclaimed results with similar names —
        claim the ones that are yours and they&apos;ll be added to your
        profile.
      </p>

      <ul className="space-y-2.5">
        {candidates.map((r) => {
          const claiming = claimingId === r.id;
          return (
            <li
              key={r.id}
              className="rounded-xl bg-white border border-blue-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-900 truncate">
                    {r.athleteName}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5 truncate">
                    {r.eventName} · {formatDate(r.eventDate)}
                    {r.eventCountry ? ` · ${r.eventCountry}` : ''}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {formatTime(r.finishTime)}
                    {r.raceCategory ? ` · ${r.raceCategory}` : ''}
                    {r.bib ? ` · bib ${r.bib}` : ''}
                  </div>
                </div>
                {!claiming && (
                  <button
                    type="button"
                    onClick={() => setClaimingId(r.id)}
                    className="shrink-0 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Claim
                  </button>
                )}
              </div>

              {claiming && (
                <ClaimForm
                  resultId={r.id}
                  onCancel={() => setClaimingId(null)}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Escalation link — once they've scanned the 10 we showed, they
          can fall through to the full search with name + country
          pre-filled. */}
      <div className="mt-4 text-xs text-stone-600">
        Don&apos;t see your race?{' '}
        <Link
          href={searchHref}
          className="font-medium text-blue-700 hover:text-blue-900 transition-colors"
        >
          Search the full results →
        </Link>
      </div>
    </section>
  );
}
