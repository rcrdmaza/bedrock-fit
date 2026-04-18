import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';
import ResultsSearch, { type ResultRow } from './results-search';

// Always fetch fresh data on each request — results will change as new rows
// get ingested and claimed.
export const dynamic = 'force-dynamic';

async function getResults(): Promise<ResultRow[]> {
  const rows = await db
    .select({
      id: results.id,
      athleteId: athletes.id,
      athleteName: athletes.name,
      eventName: results.eventName,
      eventDate: results.eventDate,
      raceCategory: results.raceCategory,
      finishTime: results.finishTime,
      overallRank: results.overallRank,
      totalFinishers: results.totalFinishers,
      percentile: results.percentile,
      status: results.status,
    })
    .from(results)
    .innerJoin(athletes, eq(results.athleteId, athletes.id))
    .orderBy(desc(results.eventDate));

  return rows.map((r) => ({
    id: r.id,
    athleteId: r.athleteId,
    athleteName: r.athleteName,
    eventName: r.eventName,
    eventDate: (r.eventDate ?? new Date()).toISOString(),
    raceCategory: r.raceCategory,
    finishTime: r.finishTime,
    overallRank: r.overallRank,
    totalFinishers: r.totalFinishers,
    // postgres `numeric` columns come back as strings — coerce for the client.
    percentile: r.percentile != null ? Number(r.percentile) : null,
    status: r.status ?? 'unclaimed',
  }));
}

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
          Search by name to find and claim your race history.
        </p>

        <ResultsSearch rows={rows} />
      </section>
    </main>
  );
}
