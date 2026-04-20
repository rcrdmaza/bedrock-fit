import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
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

// URL-safe slugs for the /leaderboards/[category] routes. We keep them
// lowercase, kebab-case, and stable: changing a slug would break any
// bookmarks or shared links. "Half Marathon" → "half-marathon",
// "10K" → "10k", etc. The mapping is explicit (not a spaces→dashes
// regex) so accidental renames of CANONICAL_CATEGORIES don't silently
// shift slugs.
const CATEGORY_SLUG_MAP: Record<LeaderboardCategory, string> = {
  '5K': '5k',
  '10K': '10k',
  'Half Marathon': 'half-marathon',
  Marathon: 'marathon',
};

// Reverse lookup built once so the page handler can cheaply narrow a
// route param to the canonical LeaderboardCategory — or return null
// for an unknown slug so the page can 404.
const CATEGORY_FROM_SLUG: Record<string, LeaderboardCategory> =
  Object.fromEntries(
    (Object.entries(CATEGORY_SLUG_MAP) as Array<
      [LeaderboardCategory, string]
    >).map(([category, slug]) => [slug, category]),
  );

export function categorySlug(category: LeaderboardCategory): string {
  return CATEGORY_SLUG_MAP[category];
}

export function parseCategorySlug(
  slug: string | null | undefined,
): LeaderboardCategory | null {
  if (!slug) return null;
  return CATEGORY_FROM_SLUG[slug.toLowerCase()] ?? null;
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

// Rows without a finish time are filtered out — they can't be ranked.
// Hard cap on page size so a crafted URL can't ask for a million rows.
const MAX_PAGE_SIZE = 200;

// Row shape straight out of the shared SELECT. Keeping the select list
// DRY means any future column addition lands in one place.
type LeaderboardDbRow = {
  id: string;
  athleteId: string;
  athleteName: string;
  eventName: string;
  eventDate: Date | null;
  raceCategory: string | null;
  finishTime: number | null;
  percentile: string | null;
};

function mapLeaderboardRow(
  r: LeaderboardDbRow,
  fallbackCategory: LeaderboardCategory,
): LeaderboardRow {
  return {
    id: r.id,
    athleteId: r.athleteId,
    athleteName: r.athleteName,
    eventName: r.eventName,
    eventDate: (r.eventDate ?? new Date()).toISOString(),
    // Both the WHERE and the type imply these are non-null; narrow for callers.
    raceCategory: r.raceCategory ?? fallbackCategory,
    finishTime: r.finishTime ?? 0,
    percentile: r.percentile != null ? Number(r.percentile) : null,
  };
}

// Paginated leaderboard query — the single surface callers use. The
// home page asks for page 1 with size 25; /leaderboards/[category]
// asks for size 50. Returns the total count so we can render "Page N
// of M" and "See all X finishers" labels without a second round-trip.
export interface LeaderboardPage {
  rows: LeaderboardRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getLeaderboardPage(
  category: LeaderboardCategory,
  page = 1,
  pageSize = 50,
): Promise<LeaderboardPage> {
  const safePageSize = Math.min(
    Math.max(1, Math.floor(pageSize)),
    MAX_PAGE_SIZE,
  );
  // Page 0 or negative → clamp to 1. We'll re-clamp against totalPages
  // after the count query lands so /page=99 on an empty category
  // renders as page 1 rather than a confusing "Page 99 of 0".
  const requestedPage = Math.max(1, Math.floor(page));

  // Run count and page fetch in parallel — they're two independent
  // queries against the same table and one round-trip beats two.
  const whereClause = and(
    eq(results.raceCategory, category),
    isNotNull(results.finishTime),
  );

  const [countRows, dataRows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(results)
      .where(whereClause),
    db
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
      .where(whereClause)
      .orderBy(asc(results.finishTime), desc(results.eventDate))
      .limit(safePageSize)
      .offset((requestedPage - 1) * safePageSize),
  ]);

  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  // If the URL asked for page 50 and there are only 3 pages, we still
  // return the data for the requested offset (which will be empty).
  // The view layer can use totalPages to render the right prev/next
  // state and avoid dead-end links.
  const resolvedPage = Math.min(requestedPage, totalPages);

  return {
    rows: dataRows.map((r) => mapLeaderboardRow(r, category)),
    total,
    page: resolvedPage,
    pageSize: safePageSize,
    totalPages,
  };
}
