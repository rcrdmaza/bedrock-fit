// Two-cell stats block summarizing the athlete's training log: total
// distance for the calendar month so far, plus their longest single
// run on file. Counts only runs the athlete *authored* — tagged-only
// rows would inflate "my" mileage with someone else's effort.
//
// Renders in the athlete's preferred unit (mi by default, km when
// they've toggled the setting). All math goes through `distanceMeters`
// so we can sum across rows that mixed units; conversion to the
// preferred unit happens once at render.
//
// Returns null when there's no useful data to show — no authored runs
// at all means no row to render. The race-stats grid above stays the
// only stats row in that case, which keeps the empty-profile layout
// from sprouting placeholder cells.
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import { dailyRuns } from '@/db/schema';
import type { DistanceUnit } from '@/lib/daily-runs';

interface Props {
  athleteId: string;
  // Preferred unit drives the display. Historical rows are stored in
  // meters too, so we don't need to look at distanceUnit per row.
  preferredUnit: DistanceUnit;
}

const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;

function metersToPreferred(meters: number, unit: DistanceUnit): number {
  return meters / (unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM);
}

// Strip trailing zeros so "12.00 mi" reads as "12 mi" but a fractional
// total stays at one decimal — enough resolution for a stats cell, not
// so much that it looks like a stopwatch.
function formatTotal(value: number, unit: DistanceUnit): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  const pretty = Number(value.toFixed(1)).toString();
  return `${pretty} ${unit}`;
}

// First-of-the-month at UTC midnight, matching how runDate is stored
// (UTC midnight of the calendar day). Comparing UTC-to-UTC keeps the
// rollup independent of where the viewer happens to be.
function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function monthLabel(now: Date): string {
  return now.toLocaleDateString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  });
}

export default async function DailyRunStats({ athleteId, preferredUnit }: Props) {
  const now = new Date();
  const monthStart = startOfMonthUtc(now);

  // Two parallel queries:
  //   • This calendar month's authored runs — small set, gives us the
  //     monthly distance roll-up.
  //   • Lifetime longest authored run — one row, a max() over
  //     distanceMeters. We just sort+limit because the table has the
  //     supporting index on (created_by, runDate).
  const [thisMonthRows, longestRows] = await Promise.all([
    db
      .select({ distanceMeters: dailyRuns.distanceMeters })
      .from(dailyRuns)
      .where(
        and(
          eq(dailyRuns.createdByAthleteId, athleteId),
          gte(dailyRuns.runDate, monthStart),
        ),
      ),
    db
      .select({
        distanceMeters: dailyRuns.distanceMeters,
        distanceValue: dailyRuns.distanceValue,
        distanceUnit: dailyRuns.distanceUnit,
      })
      .from(dailyRuns)
      .where(eq(dailyRuns.createdByAthleteId, athleteId))
      // DESC + limit 1 — the lifetime longest run, full row so we can
      // render it in the unit the athlete originally entered.
      .orderBy(desc(dailyRuns.distanceMeters))
      .limit(1),
  ]);

  if (thisMonthRows.length === 0 && longestRows.length === 0) {
    // Nothing to show. The parent decides whether to render anything
    // around this — returning null keeps the stats grid from carrying
    // an empty pair of cells.
    return null;
  }

  const monthMeters = thisMonthRows.reduce(
    (sum, r) => sum + r.distanceMeters,
    0,
  );
  // The query is `ORDER BY distance_meters DESC LIMIT 1`, so the
  // result is at most one row — the lifetime longest authored run.
  const longest = longestRows[0] ?? null;

  const monthDisplay = formatTotal(
    metersToPreferred(monthMeters, preferredUnit),
    preferredUnit,
  );

  // Longest run renders in the unit the user originally entered for
  // that row — switching the preference shouldn't quietly retcon a
  // logged value. Falls back to the preferred unit if the row has a
  // hand-edited bad value.
  const longestUnit: DistanceUnit =
    longest && (longest.distanceUnit === 'mi' || longest.distanceUnit === 'km')
      ? longest.distanceUnit
      : preferredUnit;
  const longestNumber = longest ? Number(longest.distanceValue) : 0;
  const longestDisplay = longest
    ? formatTotal(longestNumber, longestUnit)
    : '—';

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-10 pb-10 border-b border-slate-100">
      <div>
        <div className="text-xs text-stone-400 mb-1">{monthLabel(now)} mileage</div>
        <div className="text-2xl font-semibold text-stone-900">
          {monthDisplay}
        </div>
      </div>
      <div>
        <div className="text-xs text-stone-400 mb-1">Longest run</div>
        <div className="text-2xl font-semibold text-stone-900">
          {longestDisplay}
        </div>
      </div>
    </div>
  );
}
