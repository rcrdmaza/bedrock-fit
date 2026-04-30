'use client';

// Home-page race-results section. A centered search bar (name +
// country) that paints inline matches as the user types, plus a
// small "See all results →" anchor pinned to the top right that
// jumps to the full /results browser. Until the user types or picks
// a country, nothing renders below the bar — the home page is meant
// to be a starting point, not a 26k-row firehose.
//
// The dataset comes from the server pre-capped at RECENT_LIMIT rows
// (most-recent-first); filtering happens client-side for snappy
// keystrokes. If the search misses everything in that window, the
// "See all results" link funnels users to /results where the full
// dataset lives behind the same filters.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { distanceKm } from '@/lib/race';
import type { ResultRow } from '@/lib/results-filter';

// Cap on inline matches surfaced under the bar. Five is the same
// shape as the leaderboard mini-table above so the home page reads
// as two siblings. Users who want more keep narrowing or click "See
// all results".
const MAX_VISIBLE = 5;

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
  return km != null ? `${km} km` : '—';
}

export default function HomeResultsSearch({
  rows,
  countries,
}: {
  // Pre-capped slice of recent results to filter against. Bigger
  // than what we paint at any one time so a search has something to
  // narrow into; smaller than the full /results dataset so we keep
  // the home page payload sane.
  rows: ResultRow[];
  // Distinct countries in the dataset; populates the country
  // dropdown in the search bar.
  countries: string[];
}) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  const hasQuery = Boolean(name.trim() || country.trim());

  // Filter pass mirrors /results' AND semantics: each non-empty
  // input narrows independently, missing values match "any". We
  // bail with an empty array when the query is empty so the
  // placeholder branch below renders instead.
  const matches = useMemo(() => {
    if (!hasQuery) return [];
    const n = name.trim().toLowerCase();
    const c = country.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (n && !r.athleteName.toLowerCase().includes(n)) return false;
        if (c) {
          const ec = r.eventCountry?.toLowerCase() ?? '';
          if (ec !== c) return false;
        }
        return true;
      })
      .slice(0, MAX_VISIBLE);
  }, [rows, name, country, hasQuery]);

  // Build the /results href that "See all results" points to. We
  // forward whatever the user has typed so they land on a
  // pre-filtered view rather than a blank /results placeholder.
  const seeAllHref = (() => {
    const params = new URLSearchParams();
    if (name.trim()) {
      params.set('q', name.trim());
      params.set('field', 'name');
    }
    if (country.trim()) params.set('country', country.trim());
    const qs = params.toString();
    return qs ? `/results?${qs}` : '/results';
  })();

  return (
    <section aria-label="Search race results" className="mb-12">
      {/* Header bar mirrors the leaderboard's "label + small link"
          shape. The link sits on the right regardless of whether
          there are matches below — the user might want to jump to
          /results from the empty state too. */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide">
          Race results
        </h2>
        <Link
          href={seeAllHref}
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          See all results →
        </Link>
      </div>

      {/* Centered search bar. max-w + mx-auto keeps the bar a
          comfortable scanning width even when the parent section
          is full content width; the inputs share a row on sm+ and
          stack on narrow viewports. */}
      <div
        role="search"
        aria-label="Search race results"
        className="mx-auto max-w-2xl grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3"
      >
        <div>
          <label htmlFor="homeNameSearch" className="sr-only">
            Search by athlete name
          </label>
          <input
            id="homeNameSearch"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by athlete name (e.g. Carlos Mendez)"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="homeCountrySearch" className="sr-only">
            Filter by country
          </label>
          <select
            id="homeCountrySearch"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full sm:w-56 px-3 py-3 rounded-lg border border-slate-200 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline results — only when the user has typed or picked a
          country. The empty state is intentionally absent: the bar
          itself is the placeholder. */}
      {hasQuery && matches.length > 0 ? (
        <div className="mt-4 mx-auto max-w-2xl border border-slate-100 rounded-2xl overflow-hidden bg-white/70">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-stone-500 text-left text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Athlete</th>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Distance</th>
                <th className="px-5 py-3 font-medium text-right">Finish</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/athletes/${r.athleteId}`}
                      className="font-medium text-stone-900 hover:text-blue-600 transition-colors"
                    >
                      {r.athleteName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    <div>{r.eventName}</div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {new Date(r.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {r.eventCountry ? ` · ${r.eventCountry}` : ''}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-stone-700">
                    {formatDistance(r)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-stone-900">
                    {formatTime(r.finishTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : hasQuery ? (
        // Searched but nothing matched in the home-page window. The
        // "See all results →" link in the header already routes the
        // user to /results with the same query, so we keep the
        // copy here minimal.
        <div className="mt-4 mx-auto max-w-2xl text-center py-6 text-stone-400 text-sm border border-dashed border-slate-200 rounded-2xl">
          No recent matches. Try{' '}
          <Link
            href={seeAllHref}
            className="text-blue-700 hover:text-blue-900"
          >
            searching all results
          </Link>
          .
        </div>
      ) : null}
    </section>
  );
}
