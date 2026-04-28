'use client';

// The /results "Events" view. Lists one card per event (unique name +
// date + category). Each card links to /events?name=…&date=…&category=…
// which renders the per-event ranked participant list.
//
// Mirrors the ResultsSearch patterns: client-side filter over all
// rows, same date input conventions, same empty/overflow messaging.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  filterEvents,
  type EventSummary,
} from '@/lib/events-filter';

// Hard cap on rendered cards. Events are far fewer than individual
// results, but we still want a ceiling so a wildly populated DB
// doesn't hang the browser.
const MAX_VISIBLE = 300;

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// The per-event detail route takes the trio as query params. We
// encode them so race names with spaces / punctuation round-trip
// cleanly. The detail page reads `searchParams` and queries by exact
// equality on each of the three.
function eventHref(ev: EventSummary): string {
  const params = new URLSearchParams({
    name: ev.eventName,
    date: ev.eventDate,
    category: ev.raceCategory,
  });
  return `/events?${params.toString()}`;
}

export default function EventsSearch({
  events,
}: {
  events: EventSummary[];
}) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(
    () => filterEvents(events, { query, country, fromDate, toDate }),
    [events, query, country, fromDate, toDate],
  );

  const visible = filtered.slice(0, MAX_VISIBLE);
  const hasFilters = Boolean(
    query.trim() || country.trim() || fromDate || toDate,
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="eventQuery" className="sr-only">
            Search events
          </label>
          <input
            id="eventQuery"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event name (e.g. Lima Marathon)"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="eventCountry" className="sr-only">
            Country
          </label>
          <input
            id="eventCountry"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country (e.g. Peru)"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label htmlFor="evFromDate" className="text-xs text-stone-500">
            From
          </label>
          <input
            id="evFromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || undefined}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="evToDate" className="text-xs text-stone-500">
            To
          </label>
          <input
            id="evToDate"
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
            }}
            className="text-xs text-stone-500 hover:text-stone-900 transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">No events in the database yet</p>
          <p className="text-stone-300 text-xs mt-1">
            Check back once race data has been ingested.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No events match your filters.
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-400 mb-4">
            {filtered.length === events.length
              ? `Showing all ${events.length.toLocaleString()} event${events.length !== 1 ? 's' : ''}, most recent first.`
              : `${filtered.length.toLocaleString()} of ${events.length.toLocaleString()} match${filtered.length === 1 ? '' : 'es'}.`}
            {filtered.length > MAX_VISIBLE
              ? ` Showing the first ${MAX_VISIBLE} — narrow your search to see more.`
              : ''}
          </p>
          <div className="space-y-3">
            {visible.map((ev) => (
              <Link
                key={ev.key}
                href={eventHref(ev)}
                className="group block border border-slate-100 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                      {ev.eventName}
                      <span
                        aria-hidden="true"
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        →
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {formatEventDate(ev.eventDate)}
                      {ev.eventCountry ? ` · ${ev.eventCountry}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-medium text-stone-700 bg-slate-100 rounded-full px-2.5 py-1">
                      {ev.raceCategory}
                    </span>
                    <div className="text-xs text-stone-400 mt-1">
                      {ev.participantCount.toLocaleString()} finisher
                      {ev.participantCount === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
