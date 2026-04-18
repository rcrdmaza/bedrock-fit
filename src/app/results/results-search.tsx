'use client';

import { useMemo, useState } from 'react';

export type ResultRow = {
  id: string;
  athleteName: string;
  eventName: string;
  eventDate: string; // ISO string
  raceCategory: string | null;
  finishTime: number | null;
  overallRank: number | null;
  totalFinishers: number | null;
  percentile: number | null;
  status: string;
};

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

export default function ResultsSearch({ rows }: { rows: ResultRow[] }) {
  const [query, setQuery] = useState('');

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
          {filtered.map((result) => (
            <div
              key={result.id}
              className="border border-gray-100 rounded-2xl p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {result.eventName}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(result.eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {result.raceCategory ? ` · ${result.raceCategory}` : ''}
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
                    {result.totalFinishers ? ` / ${result.totalFinishers}` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Percentile</div>
                  <div className="text-sm font-medium text-gray-900">
                    {result.percentile != null
                      ? `Top ${(100 - result.percentile).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Athlete</div>
                  <div className="text-sm font-medium text-gray-900">
                    {result.athleteName}
                  </div>
                </div>
              </div>
              <button
                className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                disabled={result.status !== 'unclaimed'}
              >
                {result.status === 'unclaimed'
                  ? 'Claim this result'
                  : statusLabel(result.status)}
              </button>
            </div>
          ))}
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
