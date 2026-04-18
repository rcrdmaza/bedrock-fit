// Pure client-safe helpers for race math. Keep this file free of any
// server-only imports (db, drizzle, postgres) so client components can
// use it without dragging the database stack into the browser bundle.

// Known standard race distances. Trail (and anything else unknown) falls
// back to parsing "NNK" out of the event name.
export const CATEGORY_KM: Record<string, number> = {
  '5K': 5,
  '10K': 10,
  'Half Marathon': 21.0975,
  Marathon: 42.195,
};

export function distanceKm(
  raceCategory: string | null,
  eventName: string,
): number | null {
  if (raceCategory && CATEGORY_KM[raceCategory] != null) {
    return CATEGORY_KM[raceCategory];
  }
  const match = eventName.match(/(\d+(?:\.\d+)?)\s*K\b/i);
  return match ? Number(match[1]) : null;
}

export function formatPace(secondsPerKm: number | null): string {
  if (secondsPerKm == null || !isFinite(secondsPerKm)) return '—';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}
