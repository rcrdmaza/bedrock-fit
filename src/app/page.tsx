import Link from 'next/link';
import { getResults } from '@/lib/results';
import ResultsSearch from './results/results-search';

// Home page doubles as the search landing surface. Same data shape as
// /results so we reuse the server query + client search component.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const rows = await getResults();

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/results"
            className="text-sm text-gray-900 font-medium"
          >
            Results
          </Link>
          <Link
            href="/leagues"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Leagues
          </Link>
          <Link
            href="/signin"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Find your results
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Search by name to find and claim your race history.
        </p>

        <ResultsSearch rows={rows} />
      </section>
    </main>
  );
}
