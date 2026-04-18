import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';

// Athletes and their results change over time; rendered per request.
export const dynamic = 'force-dynamic';

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}

async function getAthleteWithResults(id: string) {
  // Guard before hitting Postgres so a malformed id doesn't throw an
  // "invalid input syntax for type uuid" error — just treat as 404.
  if (!isUuid(id)) return null;

  const [athlete, athleteResults] = await Promise.all([
    db.select().from(athletes).where(eq(athletes.id, id)).limit(1),
    db
      .select()
      .from(results)
      .where(eq(results.athleteId, id))
      .orderBy(desc(results.eventDate)),
  ]);

  if (athlete.length === 0) return null;
  return { athlete: athlete[0], results: athleteResults };
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAthleteWithResults(id);
  if (!data) notFound();

  const { athlete, results: athleteResults } = data;

  // Simple summary stats computed in-memory — cheap enough to avoid a
  // second query.
  const totalRaces = athleteResults.length;
  const claimedCount = athleteResults.filter(
    (r) => r.status === 'claimed',
  ).length;
  const bestPercentile = athleteResults.reduce<number | null>((best, r) => {
    const p = r.percentile != null ? Number(r.percentile) : null;
    if (p == null) return best;
    return best == null || p > best ? p : best;
  }, null);

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
        <Link
          href="/results"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          All results
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        {/* Profile header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            {athlete.name}
          </h1>
          <p className="text-sm text-gray-500">
            {athlete.location ?? 'Location unknown'}
            {athlete.gender ? ` · ${athlete.gender}` : ''}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10 pb-10 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-1">Races</div>
            <div className="text-2xl font-semibold text-gray-900">
              {totalRaces}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Best percentile</div>
            <div className="text-2xl font-semibold text-gray-900">
              {bestPercentile != null
                ? `Top ${(100 - bestPercentile).toFixed(1)}%`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">XP</div>
            <div className="text-2xl font-semibold text-gray-900">
              {athlete.xp ?? 0}
            </div>
          </div>
        </div>

        {/* Results list */}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-gray-900">Race history</h2>
          <span className="text-xs text-gray-400">
            {claimedCount} of {totalRaces} claimed
          </span>
        </div>

        {athleteResults.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
            No results on file for this athlete yet.
          </div>
        ) : (
          <div className="space-y-3">
            {athleteResults.map((r) => (
              <div
                key={r.id}
                className="border border-gray-100 rounded-2xl p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {r.eventName}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {r.eventDate
                        ? new Date(r.eventDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Date unknown'}
                      {r.raceCategory ? ` · ${r.raceCategory}` : ''}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      r.status === 'claimed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : r.status === 'pending'
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {r.status === 'claimed'
                      ? 'Claimed'
                      : r.status === 'pending'
                        ? 'Pending'
                        : 'Unclaimed'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      Finish time
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(r.finishTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      Overall rank
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {r.overallRank ?? '—'}
                      {r.totalFinishers ? ` / ${r.totalFinishers}` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      Percentile
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {r.percentile != null
                        ? `Top ${(100 - Number(r.percentile)).toFixed(1)}%`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
