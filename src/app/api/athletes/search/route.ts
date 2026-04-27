// Athlete typeahead endpoint. Backs the participant combobox on the
// daily-runs form, where the user types a name and picks who they ran
// with. Scoped to signed-in users only — exposing a name search to
// anonymous scrapers would invite low-effort dataset harvesting.
//
// Returns up to 10 hits, ranked by:
//   1. Name/nickname starts-with the query (case-insensitive)
//   2. Name/nickname contains the query
// Private athletes (`is_private=true`) are filtered out so the
// typeahead doesn't reveal an opt-out user's identity. The signed-in
// user themselves is filtered out — they can't tag themselves on
// their own run anyway.

import { and, eq, ilike, ne, or } from 'drizzle-orm';
import { db } from '@/db';
import { athletes } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Names are short — beyond ~60 chars something is wrong with the input.
const MAX_QUERY = 60;
// Hard cap on returned rows. The dropdown shows a few; an attacker
// hammering the endpoint to enumerate athletes would still need to
// page through the entire pool with different prefixes, but this bounds
// each individual request.
const MAX_RESULTS = 10;

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    // 401 rather than 403 so the client can offer a sign-in nudge.
    return Response.json({ error: 'Sign in to search athletes.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawQ = (url.searchParams.get('q') ?? '').trim();
  if (rawQ.length === 0) {
    // Empty query returns empty list — caller can use that to clear
    // the dropdown without a special-case 400.
    return Response.json({ athletes: [] });
  }
  if (rawQ.length > MAX_QUERY) {
    return Response.json({ error: 'Query is too long.' }, { status: 400 });
  }

  // ilike does the case-insensitive containment match. We don't try to
  // separate "starts with" from "contains" in SQL — the result set is
  // small (cap of 10) so we can sort the prefix-matches first in JS
  // and still feel snappy.
  const pattern = `%${escapeLike(rawQ)}%`;

  const rows = await db
    .select({
      id: athletes.id,
      name: athletes.name,
      nickname: athletes.nickname,
      displayPreference: athletes.displayPreference,
      location: athletes.location,
    })
    .from(athletes)
    .where(
      and(
        // Don't return the searching user themselves.
        user.athleteId ? ne(athletes.id, user.athleteId) : undefined,
        // Hide private profiles from the typeahead — the participant
        // can still be tagged by pasting their UUID, but the discovery
        // surface respects the opt-out.
        eq(athletes.isPrivate, false),
        or(ilike(athletes.name, pattern), ilike(athletes.nickname, pattern)),
      ),
    )
    .limit(MAX_RESULTS * 2);

  const lower = rawQ.toLowerCase();
  // Stable rank: prefix matches first, then containment, then by name
  // so the browser's "type two letters and the same person comes up
  // first every time" expectation holds.
  const ranked = rows
    .map((r) => {
      const name = (r.name ?? '').toLowerCase();
      const nick = (r.nickname ?? '').toLowerCase();
      const isPrefix = name.startsWith(lower) || nick.startsWith(lower);
      return { row: r, rank: isPrefix ? 0 : 1 };
    })
    .sort(
      (a, b) =>
        a.rank - b.rank || a.row.name.localeCompare(b.row.name),
    )
    .slice(0, MAX_RESULTS)
    .map((x) => x.row);

  return Response.json({ athletes: ranked });
}

// Escape Postgres LIKE wildcards. A user typing "50%" or "_test" should
// match those literal characters, not invoke the wildcard semantics.
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
