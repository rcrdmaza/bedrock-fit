import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';

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
