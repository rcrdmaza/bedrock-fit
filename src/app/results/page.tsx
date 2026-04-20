import Link from 'next/link';
import { getResults } from '@/lib/results';
import ResultsSearch from './results-search';

// Always fetch fresh data on each request — results will change as new rows
// get ingested and claimed.
export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  const rows = await getResults();

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
          Search by name, bib, event, or country — or narrow the full list by
          date range. Newest results first.
        </p>

        <ResultsSearch rows={rows} />
      </section>
    </main>
  );
}
