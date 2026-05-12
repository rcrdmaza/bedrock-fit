// Programmatic robots.txt. Allows all public pages and explicitly bars
// the auth/admin/api/me surfaces — both because they're not useful to
// crawlers and because they sometimes carry per-user state we don't
// want indexed (signed-in pages on /me, admin tables on /admin, JSON
// endpoints under /api).
//
// We list both sitemap files so crawlers find the athlete index
// without operator intervention in Search Console: /sitemap.xml
// covers the static routes + leaderboard categories;
// /athletes/sitemap.xml covers the public athlete profiles.
//
// athletes/sitemap is a single-file sitemap today — the per-file
// 50k URL cap is documented in @/lib/athlete-sitemap, and we're
// well under it. If/when we cross it, switch the athlete route to
// generateSitemaps + add the chunked URLs (athletes/sitemap/0.xml,
// /1.xml, ...) here.
import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /auth/verify carries one-time magic-link tokens in the URL
        // — never let a crawler fetch one. /me is the signed-in
        // profile surface; /admin is operator-only. /api is JSON, no
        // value to index.
        disallow: ['/admin/', '/api/', '/auth/', '/me'],
      },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/athletes/sitemap.xml`,
    ],
  };
}
