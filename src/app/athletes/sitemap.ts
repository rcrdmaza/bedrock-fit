// Single-chunk sitemap for /athletes/[id] pages. Sits alongside the
// root /sitemap.xml and powers Google indexing for individual athlete
// profiles — without this, profiles would only get crawled when
// Googlebot followed an internal link from a leaderboard or claim
// table, which underutilizes a long-tail-search-rich content surface.
//
// We deliberately render as a single file (capped at the per-sitemap
// URL limit lib/athlete-sitemap.ts exports) rather than reaching for
// generateSitemaps. Reasons:
//
//   1. The non-private athlete count is well under Google's 50k cap.
//      The chunked path adds a build-time DB roundtrip just to
//      enumerate chunk ids, which makes Railway / preview deploys
//      brittle when the DB hiccups.
//   2. force-dynamic keeps the file route-handler-shaped, so Next
//      doesn't try to call the function at build collection time.
//      The first crawler request renders fresh; subsequent requests
//      hit Next's per-route cache for `revalidate` seconds.
//
// When we ever cross the cap, swap this back to a chunked sitemap
// using the helpers in @/lib/athlete-sitemap (tests already pin the
// boundary math).
//
// Private profiles are filtered out — they render redacted to
// non-owners (see /athletes/[id]/page.tsx), which has no SEO value
// and would publish the redacted shape to search results.

import type { MetadataRoute } from 'next';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes } from '@/db/schema';
import { getAppUrl } from '@/lib/env';
import { athletesPerSitemap } from '@/lib/athlete-sitemap';

// Render at request time so the build doesn't need DB access just to
// emit a sitemap. `force-dynamic` skips Next's "collect page data"
// step that would otherwise run this function during `next build` and
// fail when the build environment can't reach Postgres (e.g. preview
// builds, CI without bound DB).
//
// Crawlers refetch this every 24h or so; we don't ISR-cache the route
// because the per-request cost is tiny (one indexed SELECT) and a
// stale sitemap is a worse failure than the cost.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const rows = await db
    .select({
      id: athletes.id,
      createdAt: athletes.createdAt,
    })
    .from(athletes)
    .where(eq(athletes.isPrivate, false))
    // Stable order so the sitemap is deterministic across renders.
    .orderBy(asc(athletes.id))
    // Hard cap at the per-sitemap URL limit. Once we cross this we'll
    // switch to a chunked sitemap; for now, hitting the cap means we
    // stop emitting URLs rather than overrunning Google's parser.
    .limit(athletesPerSitemap());

  return rows.map((r) => ({
    url: `${base}/athletes/${r.id}`,
    // createdAt rarely changes (athletes are append-only in v1);
    // this is mostly a "first seen" stamp, fine as a default
    // lastModified value for SEO.
    lastModified: r.createdAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));
}
