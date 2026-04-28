// Cookie-consent state lives in a single first-party cookie. Any code
// that wants to know whether it can fire analytics or ad-loading scripts
// reads through here rather than parsing `document.cookie` directly,
// which keeps the cookie name and shape coupled in one place.
//
// We deliberately don't store consent server-side. Putting it in a
// cookie keeps the read-side cheap (no DB hop), keeps the user in
// control even when they're signed-out, and means the cookie itself is
// the canonical record — handy when a regulator asks for proof of
// consent timestamping.

export const CONSENT_COOKIE_NAME = 'bedrock_consent';

// One year is the standard for consent cookies and matches what most
// CMPs use. The user can revisit /privacy or "Cookie preferences" to
// change their answer at any time, which re-stamps the cookie.
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Schema version. If we ever add a third bucket (say, "personalization"
// vs. "ads"), bump this and old cookies become null on parse, which
// re-prompts the banner. Avoids a quiet schema drift that would let
// legacy cookies grant consent for buckets the user never saw.
const SCHEMA_VERSION = 1;

export interface ConsentState {
  // Always true at runtime; recorded for completeness so the cookie
  // stands on its own as a record. Essential cookies don't need consent
  // to be set, but they need to be enumerated here so the privacy
  // policy and the banner agree on what "essential" means.
  essential: true;
  // Site analytics (page views, performance). When `false`, no
  // analytics scripts are loaded.
  analytics: boolean;
  // Advertising / personalization scripts. When `false`, AdSense (or
  // any future ad partner) is not loaded.
  ads: boolean;
  // ISO-8601 timestamp at which the user made the choice. Useful for
  // proof-of-consent if a regulator asks; also lets us re-prompt
  // automatically if our policy changes by comparing against an
  // "effective date" baked into the privacy page.
  ts: string;
  // Schema version (see comment above).
  v: number;
}

// Default state we write when the user clicks "Reject non-essential".
// Also the implicit pre-consent state — code that needs to gate on
// analytics/ads should treat "no cookie" identically to "this state".
export function rejectAll(now: Date = new Date()): ConsentState {
  return {
    essential: true,
    analytics: false,
    ads: false,
    ts: now.toISOString(),
    v: SCHEMA_VERSION,
  };
}

export function acceptAll(now: Date = new Date()): ConsentState {
  return {
    essential: true,
    analytics: true,
    ads: true,
    ts: now.toISOString(),
    v: SCHEMA_VERSION,
  };
}

// Parse the cookie value into a typed state. Returns `null` for any
// flavor of "this is unusable" — missing, malformed JSON, missing
// fields, wrong schema version. The banner treats `null` as "ask the
// user" which is the safe default.
export function parseConsent(value: string | undefined): ConsentState | null {
  if (!value) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== SCHEMA_VERSION) return null;
  if (typeof o.analytics !== 'boolean') return null;
  if (typeof o.ads !== 'boolean') return null;
  if (typeof o.ts !== 'string') return null;
  return {
    essential: true,
    analytics: o.analytics,
    ads: o.ads,
    ts: o.ts,
    v: SCHEMA_VERSION,
  };
}

// Serialize for storing in `document.cookie`. We URL-encode the JSON
// because cookie values cannot contain commas or semicolons unquoted,
// and JSON.stringify happily produces both.
export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

// Custom DOM event the footer's "Cookie preferences" button dispatches
// to re-open the banner. Centralizing the name avoids two places typing
// it differently and silently breaking the link.
export const OPEN_COOKIE_PREFS_EVENT = 'bedrock:open-cookie-prefs';
