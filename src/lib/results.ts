import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';
import { CANONICAL_CATEGORIES } from '@/lib/import';

export type ResultRow = {
  id: string;
  athleteId: string;
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

// Shared between /results and the home page. Postgres `numeric` columns
// come back as strings, so we coerce; dates are serialized to ISO so the
// client can hand them to the Date constructor without re-hydrating.
export async function getResults(): Promise<ResultRow[]> {
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
    percentile: r.percentile != null ? Number(r.percentile) : null,
    status: r.status ?? 'unclaimed',
  }));
}

// Ordered list of the categories we render filter chips for. Kept in a
// deliberate order (shortest → longest) rather than alphabetical, so the
// chips scan naturally. Mirrors CANONICAL_CATEGORIES for type purposes.
export const LEADERBOARD_CATEGORIES = CANONICAL_CATEGORIES;
export type LeaderboardCategory = (typeof LEADERBOARD_CATEGORIES)[number];

// Runtime guard — the home page reads ?category= from searchParams and
// we need a narrow way to say "this is one of ours" without typing gymnastics.
export function isLeaderboardCategory(
  value: string | null | undefined,
): value is LeaderboardCategory {
  if (!value) return false;
  return (LEADERBOARD_CATEGORIES as readonly string[]).includes(value);
}

// One row of a leaderboard. Trimmed down vs. ResultRow — no claim status,
// no per-row percentile UI — because the leaderboard is purely ranking
// display. We keep percentile for the "Top X%" hint but drop note/email
// fields that aren't rendered.
export type LeaderboardRow = {
  id: string;
  athleteId: string;
  athleteName: string;
  eventName: string;
  eventDate: string;
  raceCategory: string;
  finishTime: number;
  percentile: number | null;
};

// Fetch the top N finishers for a given category, ordered by finish time
// ascending (fastest first). Rows without a finish time are filtered out
// — they can't be ranked. The limit is bounded so a bad query-string
// can't ask for 10k rows; callers that want everyone should paginate.
const MAX_LEADERBOARD_LIMIT = 100;

export async function getLeaderboard(
  category: LeaderboardCategory,
  limit = 25,
): Promise<LeaderboardRow[]> {
  const capped = Math.min(Math.max(1, Math.floor(limit)), MAX_LEADERBOARD_LIMIT);

  const rows = await db
    .select({
      id: results.id,
      athleteId: athletes.id,
      athleteName: athletes.name,
      eventName: results.eventName,
      eventDate: results.eventDate,
      raceCategory: results.raceCategory,
      finishTime: results.finishTime,
      percentile: results.percentile,
    })
    .from(results)
    .innerJoin(athletes, eq(results.athleteId, athletes.id))
    .where(
      and(
        eq(results.raceCategory, category),
        // isNotNull(finishTime) keeps rows that were imported without a
        // time out of the ranked set — they'd sort to the top otherwise,
        // since ORDER BY ASC puts NULL first in Postgres by default.
        isNotNull(results.finishTime),
      ),
    )
    // Tie-break by event date desc so recent identical times come first;
    // purely cosmetic, avoids flicker when two athletes share 3:29:05.
    .orderBy(asc(results.finishTime), desc(results.eventDate))
    .limit(capped);

  return rows.map((r) => ({
    id: r.id,
    athleteId: r.athleteId,
    athleteName: r.athleteName,
    eventName: r.eventName,
    eventDate: (r.eventDate ?? new Date()).toISOString(),
    // Both the WHERE and the type imply these are non-null; narrow for callers.
    raceCategory: r.raceCategory ?? category,
    finishTime: r.finishTime ?? 0,
    percentile: r.percentile != null ? Number(r.percentile) : null,
  }));
}
