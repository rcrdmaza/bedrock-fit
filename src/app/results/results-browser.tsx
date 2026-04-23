'use client';

// Top-level client wrapper for /results. Holds the Results | Events
// toggle and swaps between ResultsSearch (per-row) and EventsSearch
// (per-event grouping). Each child owns its own filter state — the
// two views have different filter fields, so sharing state would be
// more confusing than useful.

import { useState } from 'react';
import ResultsSearch from './results-search';
import EventsSearch from './events-search';
import type { ResultRow } from '@/lib/results-filter';
import type { EventSummary } from '@/lib/events-filter';

type View = 'results' | 'events';

export default function ResultsBrowser({
  rows,
  events,
  defaultView = 'results',
}: {
  rows: ResultRow[];
  events: EventSummary[];
  // The admin import flow lands here with `?view=events` so the
  // just-imported event is the first thing visible. Everything else
  // (home nav, direct link) still defaults to the Results tab.
  defaultView?: View;
}) {
  const [view, setView] = useState<View>(defaultView);

  return (
    <>
      {/* Segmented control. Buttons over links so the toggle is
          instant (no navigation, no refetch). The child components
          keep their own filter state while hidden, so flipping back
          and forth doesn't lose what the user typed. */}
      <div className="inline-flex items-center rounded-lg bg-stone-100 p-1 mb-6 text-xs font-medium">
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

      {/* Render-one-at-a-time: mounting both would double the DOM
          for no benefit — each child re-mounts with fresh state on
          first switch, which is fine. */}
      {view === 'results' ? (
        <ResultsSearch rows={rows} />
      ) : (
        <EventsSearch events={events} />
      )}
    </>
  );
}
