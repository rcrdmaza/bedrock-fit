import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';
import { distanceKm, formatPace } from '@/lib/race';
import SiteHeader from '@/app/site-header';
import RaceHistory, {
  type RaceHistoryRow,
} from './race-history';

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
  const bestPercentile = athleteResults.reduce<number | null>((best, r) => {
    const p = r.percentile != null ? Number(r.percentile) : null;
    if (p == null) return best;
    return best == null || p > best ? p : best;
  }, null);

  // Pace + PR buckets. For each result we resolve a distance in km (from
  // category, or parsed from the event name). Average pace is weighted by
  // distance so a marathon doesn't count the same as a 5K.
  const timedRaces = athleteResults
    .map((r) => ({
      finishTime: r.finishTime,
      km: distanceKm(r.raceCategory, r.eventName),
    }))
    .filter(
      (x): x is { finishTime: number; km: number } =>
        x.finishTime != null && x.km != null,
    );

  const totalSeconds = timedRaces.reduce((sum, x) => sum + x.finishTime, 0);
  const totalKm = timedRaces.reduce((sum, x) => sum + x.km, 0);
  const avgPaceSecPerKm = totalKm > 0 ? totalSeconds / totalKm : null;

  function fastestAt(targetKm: number): number | null {
    const times = timedRaces
      .filter((x) => Math.round(x.km) === targetKm)
      .map((x) => x.finishTime);
    return times.length > 0 ? Math.min(...times) : null;
  }
  const fastest10k = fastestAt(10);
  const fastest21k = fastestAt(21);
  const fastest42k = fastestAt(42);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

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

        {/* Stats row — 6 cells, wraps to two rows on narrow viewports. */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 mb-10 pb-10 border-b border-gray-100">
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
            <div className="text-xs text-gray-400 mb-1">Avg km time</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatPace(avgPaceSecPerKm)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Fastest 10 km</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatTime(fastest10k)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Fastest 21 km</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatTime(fastest21k)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Fastest 42 km</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatTime(fastest42k)}
            </div>
          </div>
        </div>

        {/* Race history + bulk-claim UI is a client component because the
            checkbox state + submit banner need local reactivity. The server
            still does all the data work; we just pass rows through. */}
        <RaceHistory
          rows={athleteResults.map(
            (r): RaceHistoryRow => ({
              id: r.id,
              eventName: r.eventName,
              eventDate: r.eventDate,
              raceCategory: r.raceCategory,
              finishTime: r.finishTime,
              overallRank: r.overallRank,
              totalFinishers: r.totalFinishers,
              percentile: r.percentile,
              status: r.status,
            }),
          )}
        />
      </section>
    </main>
  );
}
