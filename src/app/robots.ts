// Programmatic robots.txt. Allows all public pages and explicitly bars
// the auth/admin/api/me surfaces — both because they're not useful to
// crawlers and because they sometimes carry per-user state we don't
// want indexed (signed-in pages on /me, admin tables on /admin, JSON
// endpoints under /api). Sitemap line points back at the generated
// sitemap.ts above.
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
    sitemap: `${base}/sitemap.xml`,
  };
}
