// Pure helpers for the daily-run flow. No DB, no server-only imports —
// the form, the action, and the display surface all share these so the
// validation messages and the rendered values stay in lockstep.
//
// Distance handling deliberately stores the user's chosen unit
// (`mi`/`km`) verbatim alongside the value. The canonical sortable
// representation in meters is computed by `toMeters` at write time so
// future stat rollups don't have to branch on unit; the display path
// uses `formatDistance` which honors the original unit.

export type DistanceUnit = 'mi' | 'km';

const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;

export const DISTANCE_UNITS: ReadonlyArray<DistanceUnit> = ['mi', 'km'];

// Reasonable guard against fat-fingered inputs. 200 mi is far past any
// known ultra and the field shouldn't accept negatives or zero. We
// surface `error` strings rather than throwing so the action layer can
// hand them straight to the form's `useActionState` shape.
export const MAX_DISTANCE_VALUE = 200;

export type ParseDistanceResult =
  | { ok: true; value: number; unit: DistanceUnit; meters: number }
  | { ok: false; error: string };

export function parseDistance(
  rawValue: string,
  rawUnit: string,
): ParseDistanceResult {
  // Coerce + trim. Empty or non-numeric falls into the same "didn't
  // enter a distance" bucket so the message is identical whether the
  // user submitted "" or "abc".
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Enter the distance you ran.' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Distance must be a number.' };
  }
  if (value <= 0) {
    return { ok: false, error: 'Distance must be greater than zero.' };
  }
  if (value > MAX_DISTANCE_VALUE) {
    return {
      ok: false,
      error: `Distance is too large (max ${MAX_DISTANCE_VALUE}).`,
    };
  }
  if (!isDistanceUnit(rawUnit)) {
    return { ok: false, error: 'Distance unit must be miles or kilometers.' };
  }
  return { ok: true, value, unit: rawUnit, meters: toMeters(value, rawUnit) };
}

export function isDistanceUnit(s: string): s is DistanceUnit {
  return s === 'mi' || s === 'km';
}

export function toMeters(value: number, unit: DistanceUnit): number {
  // Round to int — the meters column is an integer for tidy
  // aggregations; a 1m rounding error on a training run isn't worth
  // dragging numeric() through.
  return Math.round(value * (unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM));
}

// Display helpers. We honor the stored unit so the value the user typed
// is the value they see; converting silently between mi/km would feel
// like the app is rewriting their log.
export function formatDistance(value: number | string, unit: DistanceUnit): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  // Strip trailing zeros so "5.00 mi" reads as "5 mi" but "5.25 mi"
  // stays intact.
  const pretty = Number(n.toFixed(2)).toString();
  return `${pretty} ${unit}`;
}

// Duration parser. Accepts MM:SS or HH:MM:SS (and bare seconds for
// pasted timer values). Returns an integer seconds count or an error
// string. Mirrors the human-readable shape used by `formatTime` in the
// race-history surface so input == display.
export type ParseDurationResult =
  | { ok: true; seconds: number }
  | { ok: false; error: string };

const DURATION_PATTERN = /^(\d+)(?::([0-5]?\d))?(?::([0-5]?\d))?$/;

export function parseDuration(raw: string): ParseDurationResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    // Duration is optional — empty means "didn't track it". The action
    // layer accepts the null and the formatter falls back to "—".
    return { ok: true, seconds: 0 };
  }
  const m = DURATION_PATTERN.exec(trimmed);
  if (!m) {
    return {
      ok: false,
      error: 'Duration must look like 32:15 or 1:05:00.',
    };
  }
  // Up to three groups, parsed right-to-left so a single-segment
  // "1800" reads as seconds, "32:15" as MM:SS, "1:05:00" as H:MM:SS.
  const segments = [m[1], m[2], m[3]].filter(
    (s): s is string => s !== undefined,
  );
  let total = 0;
  for (const seg of segments) {
    total = total * 60 + Number(seg);
  }
  if (total > 24 * 60 * 60) {
    return { ok: false, error: 'Duration is too long (max 24:00:00).' };
  }
  return { ok: true, seconds: total };
}

// Human-readable mirror of parseDuration. Returns "—" for null/0 so
// the rendered card shows a tidy placeholder when the user skipped
// the field.
export function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds === 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Pace per the original unit — so a run logged in miles displays "9:30
// /mi" rather than the km equivalent. Returns null when either input
// is missing so the caller can render a placeholder.
export function paceLabel(
  durationSeconds: number | null,
  distanceValue: number,
  unit: DistanceUnit,
): string {
  if (!durationSeconds || durationSeconds <= 0) return '—';
  if (!Number.isFinite(distanceValue) || distanceValue <= 0) return '—';
  const secPerUnit = durationSeconds / distanceValue;
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  // Edge: rounding a hair under 60s produced 60 — bump the minute and
  // wrap the seconds to 0 so we never print "9:60".
  const adjM = s === 60 ? m + 1 : m;
  const adjS = s === 60 ? 0 : s;
  return `${adjM}:${String(adjS).padStart(2, '0')} /${unit}`;
}

// Strava URL validator. We accept any http(s) URL in v1 — the user's
// integration is just a click-through, not an API call — but reject
// obviously hostile or empty inputs early so a malformed paste doesn't
// land in the column.
export type ParseStravaResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

export function parseStravaUrl(raw: string): ParseStravaResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, url: null };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'Strava link must be a valid URL.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Strava link must use http or https.' };
  }
  return { ok: true, url: parsed.toString() };
}

// Participant parser. Accepts a comma- or newline-separated list of
// either bare athlete UUIDs or full profile URLs (`/athletes/<uuid>`,
// `https://bedrock.fit/athletes/<uuid>`). Returns the unique set of
// extracted IDs in order, with a per-entry error if any is unparseable.
// We don't verify the IDs exist here — the action layer does that
// lookup so the message can include which ID is missing.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ParseParticipantsResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: string };

export function parseParticipants(raw: string): ParseParticipantsResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, ids: [] };
  // Split on commas, semicolons, whitespace, newlines — all of these
  // are common in pasted lists and none are valid inside a UUID/URL.
  const tokens = trimmed
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokens) {
    const id = extractId(token);
    if (!id) {
      return {
        ok: false,
        error: `Couldn't read "${token}" as an athlete ID or profile URL.`,
      };
    }
    const lower = id.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(lower);
  }
  return { ok: true, ids: out };
}

function extractId(token: string): string | null {
  if (UUID_PATTERN.test(token)) return token;
  // Try parsing as a URL — accept either absolute or `/athletes/<id>`
  // path-only forms. We pad with a base so path-only tokens are
  // parseable, then look at the resulting pathname.
  let path: string;
  try {
    path = new URL(token, 'https://placeholder.invalid').pathname;
  } catch {
    return null;
  }
  const match = path.match(/\/athletes\/([0-9a-f-]{36})/i);
  return match ? match[1] : null;
}
