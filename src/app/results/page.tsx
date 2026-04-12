'use client';

import { useState } from 'react';
import Link from 'next/link';

const dummyResults = [
  { id: '1', athleteName: 'Carlos Mendez', eventName: 'Lima Marathon 2025', eventDate: '2025-08-15', raceCategory: 'Marathon', finishTime: 13680, overallRank: 142, totalFinishers: 1840, percentile: 92.3 },
  { id: '2', athleteName: 'Carlos Mendez', eventName: 'Miraflores 10K 2025', eventDate: '2025-05-20', raceCategory: '10K', finishTime: 2760, overallRank: 38, totalFinishers: 620, percentile: 93.8 },
  { id: '3', athleteName: 'Maria Torres', eventName: 'Lima Marathon 2025', eventDate: '2025-08-15', raceCategory: 'Marathon', finishTime: 15480, overallRank: 284, totalFinishers: 1840, percentile: 84.6 },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ResultsPage() {
  const [query, setQuery] = useState('');

  const filtered = query.length > 1
    ? dummyResults.filter(r => r.athleteName.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900">
          Bedrock.fit
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Find your results</h1>
        <p className="text-gray-500 text-sm mb-8">Search by name to find and claim your race history.</p>

        <div className="flex items-center gap-3 mb-10">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
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
            <p className="text-xs text-gray-400 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</p>
            {filtered.map(result => (
              <div key={result.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{result.eventName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(result.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {result.raceCategory}
                    </div>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                    Unclaimed
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Finish time</div>
                    <div className="text-sm font-medium text-gray-900">{formatTime(result.finishTime)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Overall rank</div>
                    <div className="text-sm font-medium text-gray-900">{result.overallRank} / {result.totalFinishers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Percentile</div>
                    <div className="text-sm font-medium text-gray-900">Top {(100 - result.percentile).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Athlete</div>
                    <div className="text-sm font-medium text-gray-900">{result.athleteName}</div>
                  </div>
                </div>
                <button className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Claim this result
                </button>
              </div>
            ))}
          </div>
        )}

        {query.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Start typing to search results</p>
            <p className="text-gray-300 text-xs mt-1">Try &quot;Carlos&quot; or &quot;Maria&quot; to see demo results</p>
          </div>
        )}
      </section>
    </main>
  );
}
