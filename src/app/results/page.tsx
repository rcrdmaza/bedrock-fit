import Link from 'next/link';
import { getResults } from '@/lib/results';
import { getEventSummaries } from '@/lib/events';
import ResultsBrowser from './results-browser';

// Always fetch fresh data on each request — results will change as new rows
// get ingested and claimed.
export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  // Both fetches in parallel — they hit the same table but don't
  // share a query plan, so a single round-trip is no cheaper.
  const [rows, events] = await Promise.all([
    getResults(),
    getEventSummaries(),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Find your results
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Switch between individual results and the events they belong to.
          Filter by name, bib, event, country, or date range — newest first.
        </p>

        <ResultsBrowser rows={rows} events={events} />
      </section>
    </main>
  );
}
