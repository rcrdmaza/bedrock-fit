// Pure helpers for the chunked athlete sitemap. Lives separately from
// the sitemap route file so the chunk-count math has a tested
// surface — getting the boundary cases (zero athletes, exact
// multiples of the cap) wrong would produce broken sitemaps Google
// silently ignores.

// Google's per-sitemap URL cap. Documented at
// https://www.sitemaps.org/protocol.html#index — 50k URLs per file.
const ATHLETES_PER_SITEMAP = 50_000;

export function athletesPerSitemap(): number {
  return ATHLETES_PER_SITEMAP;
}

// How many sitemap chunks we need for `total` athletes. Always ≥ 1
// because Next still needs a chunk 0 to render even on an empty DB
// (otherwise /athletes/sitemap/0.xml 404s and crawlers report a
// missing sitemap from robots.txt).
export function athleteSitemapChunkCount(total: number): number {
  if (!Number.isFinite(total) || total < 0) return 1;
  return Math.max(1, Math.ceil(total / ATHLETES_PER_SITEMAP));
}
