// Programmatic sitemap. Next 16 picks this up at /sitemap.xml via the
// `app/sitemap.ts` file convention. We list:
//   - Static public routes (/, /events, /results, /leaderboards)
//   - One entry per leaderboard category (/leaderboards/<slug>)
// We deliberately *don't* list /athletes/[id] entries here. The athlete
// table is potentially huge, some athletes are private, and Google
// discovers them through internal links (leaderboards, results) anyway.
// If we ever want them in a sitemap we'll add a nested
// app/athletes/sitemap.ts that pulls from the DB and uses
// generateSitemaps to chunk over Google's 50k-URL limit.
//
// Auth, admin, /me, and /api routes are excluded because they're either
// gated, machine-only, or both — robots.ts re-states that.
import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/env';
import {
  categorySlug,
  LEADERBOARD_CATEGORIES,
} from '@/lib/results';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const now = new Date();

  // Static pages get a fixed `lastModified` of "now". This is not
  // perfect — a deploy without content changes will still bump the
  // timestamp — but it's a reasonable approximation that keeps the
  // sitemap honest enough for Google. The cost of being wrong is at
  // worst a slightly more eager re-crawl.
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/events`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/results`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/leaderboards`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // One entry per canonical category. These are the pages with the
  // highest organic-search potential — "fastest 10K times <city>" type
  // queries land here once we've populated enough results.
  const categoryEntries: MetadataRoute.Sitemap = LEADERBOARD_CATEGORIES.map(
    (c) => ({
      url: `${base}/leaderboards/${categorySlug(c)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    }),
  );

  return [...staticEntries, ...categoryEntries];
}
