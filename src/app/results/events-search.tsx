'use client';

// /results "Events" tab. One table row per event (eventName + eventDate),
// with all of that event's distances rendered as clickable chips so a
// race that hosted 5K, 10K, Half, and Marathon shows up as a single
// row instead of four.
//
// The underlying lib still returns one EventSummary per (name, date,
// category) triple — we group those at render time. Click semantics
// are per-distance: each chip links to /events?name=&date=&category=
// for the participant ranking of that specific distance.
//
// Filters mirror what the page used to have (event name search,
// country sub-filter, date range) and apply BEFORE grouping so a
// match on any single category surfaces the parent event.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  filterEvents,
  type EventSummary,
} from '@/lib/events-filter';

const MAX_VISIBLE = 300;

// One grouped row in the rendered table. Carries every distance the
// event hosted plus the location fields (which are picked from the
// first non-null seen across the group's child rows).
interface EventGroup {
  // Stable key for React = eventName|eventDate. Independent from the
  // per-category EventSummary key.
  key: string;
  eventName: string;
  eventDate: string;
  city: string | null;
  country: string | null;
  participantTotal: number;
  // Each entry is one EventSummary that contributed to the group.
  // Sorted by raceCategory ASC for deterministic chip order.
  categories: EventSummary[];
}

function formatEventDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// "Lima - Peru" | "Peru" | "—" depending on what's available. Em-dash
// used instead of "Unknown" because the cell is supposed to be quiet
// when data is missing.
function formatCityCountry(
  city: string | null,
  country: string | null,
): string {
  if (city && country) return `${city} - ${country}`;
  if (city) return city;
  if (country) return country;
  return '—';
}

// Group post-filter EventSummary[] by (name, date). We pull the first
// non-null city / country we see — in practice every category for the
// same race shares those values, but using "first non-null" is robust
// to one-off curation gaps.
function groupByEvent(rows: EventSummary[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const ev of rows) {
    const key = `${ev.eventName}|${ev.eventDate}`;
    const existing = map.get(key);
    if (existing) {
      existing.categories.push(ev);
      existing.participantTotal += ev.participantCount;
      if (!existing.city && ev.eventCity) existing.city = ev.eventCity;
      if (!existing.country && ev.eventCountry)
        existing.country = ev.eventCountry;
      continue;
    }
    map.set(key, {
      key,
      eventName: ev.eventName,
      eventDate: ev.eventDate,
      city: ev.eventCity,
      country: ev.eventCountry,
      participantTotal: ev.participantCount,
      categories: [ev],
    });
  }
  // Sort each group's categories so chip order stays stable and
  // sensible (5K → 10K → Half → Marathon comes naturally from the
  // canonical category strings; non-canonical land at the end).
  const order = ['5K', '10K', 'Half Marathon', 'Marathon'];
  for (const g of map.values()) {
    g.categories.sort((a, b) => {
      const ai = order.indexOf(a.raceCategory);
      const bi = order.indexOf(b.raceCategory);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.raceCategory.localeCompare(b.raceCategory);
    });
  }
  // Map iteration preserves insertion order; the input list is already
  // sorted newest-date-first by the DB query, so groups inherit that.
  return [...map.values()];
}

export default function EventsSearch({
  events,
  nameQuery,
  setNameQuery,
  countryQuery,
  setCountryQuery,
}: {
  events: EventSummary[];
  // Shared with the parent's global search bar (and with the Results
  // tab when the user toggles back). On this tab the name slot
  // searches event names; the country slot is the same notion as
  // /results — substring against eventCountry.
  nameQuery: string;
  setNameQuery: (v: string) => void;
  countryQuery: string;
  setCountryQuery: (v: string) => void;
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(
    () =>
      filterEvents(events, {
        query: nameQuery,
        country: countryQuery,
        fromDate,
        toDate,
      }),
    [events, nameQuery, countryQuery, fromDate, toDate],
  );

  const grouped = useMemo(() => groupByEvent(filtered), [filtered]);
  const visible = grouped.slice(0, MAX_VISIBLE);
  const hasFilters = Boolean(
    nameQuery.trim() || countryQuery.trim() || fromDate || toDate,
  );

  return (
    <>
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
              setNameQuery('');
              setCountryQuery('');
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
          <p className="text-stone-400 text-sm">
            No events in the database yet
          </p>
          <p className="text-stone-300 text-xs mt-1">
            Check back once race data has been ingested.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No events match your filters.
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-400 mb-3">
            {grouped.length === events.length || filtered.length === events.length
              ? `Showing ${grouped.length.toLocaleString()} event${grouped.length !== 1 ? 's' : ''}, most recent first.`
              : `${grouped.length.toLocaleString()} event${grouped.length === 1 ? '' : 's'} match.`}
            {grouped.length > MAX_VISIBLE
              ? ` Showing the first ${MAX_VISIBLE} — narrow your search to see more.`
              : ''}
          </p>

          <div className="border border-slate-100 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th
                      scope="col"
                      style={{ minWidth: '7rem' }}
                      className="text-left font-medium px-4 py-3"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      style={{ minWidth: '16rem' }}
                      className="text-left font-medium px-4 py-3"
                    >
                      Event name
                    </th>
                    <th
                      scope="col"
                      style={{ minWidth: '12rem' }}
                      className="text-left font-medium px-4 py-3"
                    >
                      City - Country
                    </th>
                    <th
                      scope="col"
                      style={{ minWidth: '14rem' }}
                      className="text-left font-medium px-4 py-3"
                    >
                      Distances
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((group) => (
                    <tr
                      key={group.key}
                      className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-stone-700 whitespace-nowrap tabular-nums">
                        {formatEventDate(group.eventDate)}
                      </td>
                      <td className="px-4 py-3 text-stone-900 font-medium">
                        {group.eventName}
                        <div className="text-[11px] text-stone-400 font-normal mt-0.5">
                          {group.participantTotal.toLocaleString()} finisher
                          {group.participantTotal === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {formatCityCountry(group.city, group.country)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {group.categories.map((ev) => (
                            <DistanceChip key={ev.key} ev={ev} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// One clickable distance chip in the Distances column. Tinted with the
// same blue-family palette as the /results outline so the visual
// language is consistent across both tabs:
//   10K → light, Half → medium, Marathon → dark, others (5K, trail)
//   → neutral slate.
function DistanceChip({ ev }: { ev: EventSummary }) {
  const tone = chipToneFor(ev.raceCategory);
  return (
    <Link
      href={`/events?${new URLSearchParams({
        name: ev.eventName,
        date: ev.eventDate,
        category: ev.raceCategory,
      }).toString()}`}
      className={`inline-flex items-center text-xs font-medium rounded-full border px-3 py-1 transition-colors ${tone}`}
    >
      {ev.raceCategory}
    </Link>
  );
}

// Chip tones share the same colour story as the /results outline
// (defined in lib/distance-color.ts) but with explicit Tailwind
// classes — chips need fill + text, not borders, so they don't
// collapse to the same class set.
function chipToneFor(raceCategory: string): string {
  const norm = raceCategory.trim().toLowerCase();
  if (norm === '10k')
    return 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100';
  if (norm === 'half marathon' || norm === '21k' || norm === 'half')
    return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
  if (norm === 'marathon' || norm === '42k' || norm === 'full marathon')
    return 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200';
  return 'bg-slate-50 text-stone-700 border-slate-200 hover:bg-slate-100';
}
