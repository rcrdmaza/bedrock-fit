'use client';

// Top-level client wrapper for /results. Holds:
//   - the Results | Events toggle
//   - a shared "search by name + country" bar that drives both tabs
//
// State for the two shared filters (name + country) lives here so
// that switching tabs preserves the user's search, and so the global
// bar and the per-column dropdowns inside ResultsSearch stay in sync
// — both surfaces edit the same state. Tab-specific filters (date
// range, distance chips, year range, bib) stay inside the relevant
// child component.

import { useMemo, useState } from 'react';
import ResultsSearch, { type ResultsSearchInitial } from './results-search';
import EventsSearch from './events-search';
import type { ResultRow } from '@/lib/results-filter';
import type { EventSummary } from '@/lib/events-filter';

type View = 'results' | 'events';

export default function ResultsBrowser({
  rows,
  events,
  defaultView = 'results',
  initialResultsFilter,
}: {
  rows: ResultRow[];
  events: EventSummary[];
  // The admin import flow lands here with `?view=events` so the
  // just-imported event is the first thing visible. Everything else
  // (home nav, direct link) still defaults to the Results tab.
  defaultView?: View;
  // URL-sourced initial state forwarded by /results/page.tsx. We seed
  // the shared name + country bar from the legacy `?q=` and
  // `?country=` params; `?field=` is ignored in the new model — the
  // shared bar always means "athlete name on Results, event name on
  // Events" and the per-column dropdowns inside ResultsSearch handle
  // narrower targets like Bib.
  initialResultsFilter?: ResultsSearchInitial;
}) {
  const [view, setView] = useState<View>(defaultView);

  // Shared filter state. Seeded from URL once on mount, then user-
  // driven. Both children read it and write to it.
  const [nameQuery, setNameQuery] = useState<string>(() => {
    const f = initialResultsFilter;
    if (!f) return '';
    // Map legacy field='name' into the shared name slot. field='event'
    // doesn't fit a global name search — drop it (events tab is rare
    // for deep links anyway).
    return f.searchField === 'name' ? (f.query ?? '') : '';
  });
  const [countryQuery, setCountryQuery] = useState<string>(
    initialResultsFilter?.country ?? '',
  );

  // Build the country dropdown options from whatever countries appear
  // in the loaded data (results + events both contribute). We dedupe
  // case-insensitively but render the first-seen casing — names like
  // "Peru" should show capitalized rather than lowercased.
  const countryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      if (r.eventCountry) {
        const key = r.eventCountry.toLowerCase();
        if (!seen.has(key)) seen.set(key, r.eventCountry);
      }
    }
    for (const e of events) {
      if (e.eventCountry) {
        const key = e.eventCountry.toLowerCase();
        if (!seen.has(key)) seen.set(key, e.eventCountry);
      }
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [rows, events]);

  return (
    <>
      {/* Segmented control. Buttons over links so the toggle is
          instant (no navigation, no refetch). */}
      <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setView('results')}
          aria-pressed={view === 'results'}
          className={`px-4 py-1.5 rounded-md transition-colors ${
            view === 'results'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Results
        </button>
        <button
          type="button"
          onClick={() => setView('events')}
          aria-pressed={view === 'events'}
          className={`px-4 py-1.5 rounded-md transition-colors ${
            view === 'events'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Events
        </button>
      </div>

      {/* Shared search bar: name + country. Sits under the toggle as
          the primary entry point for narrowing. The Name input
          searches athlete name on Results and event name on Events;
          the placeholder updates so the user knows which they're
          searching. */}
      <div
        role="search"
        aria-label="Search results and events"
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-6"
      >
        <div>
          <label htmlFor="globalNameSearch" className="sr-only">
            Search by name
          </label>
          <input
            id="globalNameSearch"
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder={
              view === 'results'
                ? 'Search by athlete name (e.g. Carlos Mendez)'
                : 'Search by event name (e.g. Lima Marathon)'
            }
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="globalCountrySearch" className="sr-only">
            Filter by country
          </label>
          <select
            id="globalCountrySearch"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            // Match the input's height + corner radius so the two
            // controls visually anchor as one bar. min-w keeps the
            // empty placeholder readable.
            className="w-full sm:w-56 px-3 py-3 rounded-lg border border-slate-200 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All countries</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === 'results' ? (
        <ResultsSearch
          rows={rows}
          nameQuery={nameQuery}
          setNameQuery={setNameQuery}
          countryQuery={countryQuery}
          setCountryQuery={setCountryQuery}
        />
      ) : (
        <EventsSearch
          events={events}
          nameQuery={nameQuery}
          setNameQuery={setNameQuery}
          countryQuery={countryQuery}
          setCountryQuery={setCountryQuery}
        />
      )}
    </>
  );
}
