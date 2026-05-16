// Read + write the site-wide branding singleton. One row (id=1)
// holds the operator-uploaded logo + favicon as base64 data URLs;
// everything else in the app reads through getBranding() so the
// cache invalidation story stays in one place.
//
// Cache strategy mirrors lib/events.ts: wrap reads with
// unstable_cache + a tag, and mutating server actions call
// updateTag('site-branding') so the next read sees the change
// without a full revalidatePath cascade. The header (SiteHeader) and
// the root layout's generateMetadata both read this on every public
// page request, so the cache is what keeps the home page from doing
// a DB round trip per render.

import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { siteBranding } from '@/db/schema';

export const SITE_BRANDING_TAG = 'site-branding';
const SINGLETON_ID = 1;

// Stale-while-revalidate window. Branding rarely changes — we
// don't need second-by-second freshness — but updateTag() bumps
// the cache the moment an admin saves, so this is really a
// belt-and-suspenders TTL for the case where the tag invalidation
// is lost (e.g. across deploy boundaries).
const CACHE_REVALIDATE_SECONDS = 60 * 60;

export interface Branding {
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  // ISO timestamp the singleton was last touched. The favicon `<link>`
  // can append this as a `?v=` query so browsers refresh their
  // long-cached icon when the operator uploads a new one.
  updatedAt: string;
}

const EMPTY_BRANDING: Branding = {
  logoDataUrl: null,
  faviconDataUrl: null,
  // Stable timestamp so a row-missing case never invalidates the
  // browser's favicon cache uselessly. Reads-from-empty don't bump
  // it; only real writes do.
  updatedAt: '1970-01-01T00:00:00.000Z',
};

async function fetchBranding(): Promise<Branding> {
  // We wrap the DB read in a try/catch because this query runs from
  // two places that can't tolerate a hard failure:
  //   1. Build-time prerender of /_not-found — happens in CI/sandbox
  //      environments that may not have DATABASE_URL set.
  //   2. Root layout's generateMetadata on every public request — a
  //      momentary DB outage would otherwise propagate as a 500 on
  //      every page rather than a degraded one with no logo/favicon.
  // Returning EMPTY_BRANDING in either case keeps the page rendering
  // with the built-in wordmark + file-convention favicon. The error
  // is intentionally swallowed: branding is a cosmetic read; we'd
  // rather serve the wordmark than a 500.
  try {
    const rows = await db
      .select({
        logoDataUrl: siteBranding.logoDataUrl,
        faviconDataUrl: siteBranding.faviconDataUrl,
        updatedAt: siteBranding.updatedAt,
      })
      .from(siteBranding)
      .where(eq(siteBranding.id, SINGLETON_ID))
      .limit(1);

    const row = rows[0];
    if (!row) return EMPTY_BRANDING;
    return {
      logoDataUrl: row.logoDataUrl,
      faviconDataUrl: row.faviconDataUrl,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch {
    return EMPTY_BRANDING;
  }
}

export const getBranding = unstable_cache(fetchBranding, ['site-branding'], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: [SITE_BRANDING_TAG],
});

// Upsert helper used by the server actions. We always operate on
// id=1 (seeded by migration 0010), so this is a pure UPDATE — no
// INSERT-or-UPDATE branching, no race window where two simultaneous
// admin saves both try to INSERT.
//
// `field` is restricted at the type level so callers can only
// touch the two columns this feature owns. `value: null` clears
// the field (the "Remove" buttons on the admin form).
export async function setBrandingField(
  field: 'logoDataUrl' | 'faviconDataUrl',
  value: string | null,
): Promise<void> {
  const column =
    field === 'logoDataUrl'
      ? { logoDataUrl: value, updatedAt: new Date() }
      : { faviconDataUrl: value, updatedAt: new Date() };

  await db
    .update(siteBranding)
    .set(column)
    .where(eq(siteBranding.id, SINGLETON_ID));
}
