// Pure helpers that map domain objects to schema.org JSON-LD payloads
// for the /events and /athletes/[id] pages. Output is rendered inside
// a <script type="application/ld+json"> tag so Google can index the
// page as a SportsEvent or Person and surface rich-result snippets.
//
// No DB, no React — both halves are pure data shaping. The tests pin
// the exact field set so a Google Search Console "missing required
// field" never silently re-creeps in.

// Distinguish data: URLs from real ones. Search engines can't fetch
// inline base64, so passing a data URL as @image gives Google no value
// and may even disqualify the result for image-rich snippets. Skip
// them and let the page fall back to no @image.
function isFetchableUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// Resolve a relative path against the canonical base URL so JSON-LD
// `@id` / `url` fields are absolute (Google requires absolute).
function abs(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

// ---------- SportsEvent ----------

export interface SportsEventInput {
  eventName: string;
  // ISO 8601 timestamp. We pass through as-is; schema.org accepts both
  // date and datetime forms here.
  eventDate: string;
  raceCategory: string;
  city: string | null;
  district: string | null;
  country: string | null;
  summary: string | null;
  // First photo URL, if any — used as the event's @image. Must be
  // http(s) to be useful; data: URLs are filtered out.
  imageUrl?: string | null;
}

// Build the URL the JSON-LD points at. Mirrors how event pages are
// linked elsewhere in the app: /events?name=…&date=…&category=…
export function eventCanonicalPath(input: {
  eventName: string;
  eventDate: string;
  raceCategory: string;
}): string {
  const params = new URLSearchParams({
    name: input.eventName,
    date: input.eventDate,
    category: input.raceCategory,
  });
  return `/events?${params.toString()}`;
}

// Build the SportsEvent payload. Required fields per Google's spec:
// name, startDate, location. Everything else is optional and only
// emitted when we actually have data — empty strings would dilute
// the structured-data quality score.
export function sportsEventLd(
  input: SportsEventInput,
  baseUrl: string,
): Record<string, unknown> {
  const url = abs(baseUrl, eventCanonicalPath(input));

  // Location is required. We always have at least an event name to
  // hang it on; city/country narrow it when present.
  const addressParts: Record<string, string> = {};
  if (input.city) addressParts.addressLocality = input.city;
  if (input.district) addressParts.addressRegion = input.district;
  if (input.country) addressParts.addressCountry = input.country;
  const hasAddress = Object.keys(addressParts).length > 0;

  // Compose a human-readable name for the Place — same shape the
  // /events page uses in its location subline ("Lima · Peru").
  const placeName = [input.city, input.district, input.country]
    .filter((p): p is string => !!p && p.trim().length > 0)
    .join(' · ');

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${input.eventName} — ${input.raceCategory}`,
    startDate: input.eventDate,
    sport: 'Running',
    url,
    location: {
      '@type': 'Place',
      name: placeName || input.eventName,
      ...(hasAddress
        ? {
            address: {
              '@type': 'PostalAddress',
              ...addressParts,
            },
          }
        : {}),
    },
    // Hardcoded — running events virtually always run regardless of
    // weather and we don't have a separate "cancelled" status feed.
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      'https://schema.org/OfflineEventAttendanceMode',
  };

  if (input.summary && input.summary.trim().length > 0) {
    ld.description = input.summary.trim();
  }
  if (isFetchableUrl(input.imageUrl)) {
    ld.image = input.imageUrl;
  }
  return ld;
}

// ---------- Person ----------

export interface PersonInput {
  id: string;
  // Whatever we display publicly — already resolved by getDisplayName
  // upstream so we don't re-implement nickname / privacy logic here.
  displayName: string;
  // Optional avatar URL. data: URLs are filtered out per the
  // search-engine-fetchability rule.
  avatarUrl?: string | null;
}

// Build the Person payload. Used on /athletes/[id]. Callers should
// skip the markup entirely for private profiles — passing a redacted
// name in here would publish a meaningless "Anonymous Athlete" entity
// to Google with no SEO benefit.
export function personLd(
  input: PersonInput,
  baseUrl: string,
): Record<string, unknown> {
  const url = abs(baseUrl, `/athletes/${input.id}`);
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.displayName,
    url,
  };
  if (isFetchableUrl(input.avatarUrl)) {
    ld.image = input.avatarUrl;
  }
  return ld;
}

// ---------- serialization ----------

// Safe serializer for embedding inside a <script> tag. Browsers parse
// `</` inside a string as the start of a closing script tag, so we
// escape any forward slashes that follow `<`. This is the standard
// JSON-LD-in-HTML mitigation.
export function serializeJsonLd(
  ld: Record<string, unknown>,
): string {
  return JSON.stringify(ld).replace(/<\//g, '<\\/');
}
