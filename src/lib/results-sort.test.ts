import { describe, expect, it } from 'vitest';
import type { ResultRow } from './results-filter';
import { paceSecondsPerKm, sortResults } from './results-sort';

// Compact factory — fill in only the fields a given test cares about,
// leave the rest at sensible defaults.
function row(overrides: Partial<ResultRow>): ResultRow {
  return {
    id: 'id',
    athleteId: 'a',
    athleteName: 'Athlete',
    eventName: 'Some Race',
    eventDate: '2024-01-01T00:00:00Z',
    raceCategory: '10K',
    finishTime: 3000,
    overallRank: null,
    totalFinishers: null,
    percentile: null,
    status: 'unclaimed',
    bib: null,
    eventCountry: 'Peru',
    ...overrides,
  };
}

describe('paceSecondsPerKm', () => {
  it('computes seconds per km off a canonical category', () => {
    // 50:00 over a 10K = 300 s/km = 5:00/km
    const r = row({ finishTime: 3000, raceCategory: '10K' });
    expect(paceSecondsPerKm(r)).toBe(300);
  });

  it('falls back to "NK" parsing in the event name', () => {
    // "5K Fun Run" lacks a canonical category; distanceKm pulls 5 km
    // from the name.
    const r = row({
      finishTime: 1500,
      raceCategory: null,
      eventName: '5K Fun Run',
    });
    expect(paceSecondsPerKm(r)).toBe(300);
  });

  it('returns null when finishTime is missing', () => {
    expect(paceSecondsPerKm(row({ finishTime: null }))).toBeNull();
  });

  it('returns null when distance is unknowable', () => {
    expect(
      paceSecondsPerKm(
        row({ raceCategory: 'Trail', eventName: 'Mystery Trail Run' }),
      ),
    ).toBeNull();
  });
});

describe('sortResults', () => {
  it('sorts by date desc by default', () => {
    const rows = [
      row({ id: 'old', eventDate: '2020-05-01T00:00:00Z' }),
      row({ id: 'new', eventDate: '2024-05-01T00:00:00Z' }),
      row({ id: 'mid', eventDate: '2022-05-01T00:00:00Z' }),
    ];
    const out = sortResults(rows, { field: 'date', direction: 'desc' });
    expect(out.map((r) => r.id)).toEqual(['new', 'mid', 'old']);
  });

  it('sorts by date asc', () => {
    const rows = [
      row({ id: 'new', eventDate: '2024-05-01T00:00:00Z' }),
      row({ id: 'old', eventDate: '2020-05-01T00:00:00Z' }),
    ];
    const out = sortResults(rows, { field: 'date', direction: 'asc' });
    expect(out.map((r) => r.id)).toEqual(['old', 'new']);
  });

  it('sorts by athlete name case-insensitively', () => {
    const rows = [
      row({ id: 'b', athleteName: 'beatriz' }),
      row({ id: 'A', athleteName: 'Alejandro' }),
      row({ id: 'c', athleteName: 'Carlos' }),
    ];
    const out = sortResults(rows, { field: 'name', direction: 'asc' });
    expect(out.map((r) => r.id)).toEqual(['A', 'b', 'c']);
  });

  it('sorts by distance shortest first when ascending', () => {
    const rows = [
      row({ id: 'm', raceCategory: 'Marathon' }),
      row({ id: '5', raceCategory: '5K' }),
      row({ id: 'h', raceCategory: 'Half Marathon' }),
    ];
    const out = sortResults(rows, { field: 'distance', direction: 'asc' });
    expect(out.map((r) => r.id)).toEqual(['5', 'h', 'm']);
  });

  it('sorts by pace fastest first when ascending', () => {
    // 10K @ 50:00 → 5:00/km; 10K @ 40:00 → 4:00/km; 5K @ 25:00 → 5:00/km
    const rows = [
      row({ id: 'slow', raceCategory: '10K', finishTime: 3000 }),
      row({ id: 'fast', raceCategory: '10K', finishTime: 2400 }),
      row({ id: 'mid', raceCategory: '5K', finishTime: 1500 }),
    ];
    const out = sortResults(rows, { field: 'pace', direction: 'asc' });
    // fast (240) < slow (300) === mid (300); the comparator is stable so
    // slow comes before mid (insertion order).
    expect(out[0].id).toBe('fast');
    expect(out.slice(1).map((r) => r.id).sort()).toEqual(['mid', 'slow']);
  });

  it('sorts by total time fastest first when ascending', () => {
    const rows = [
      row({ id: 'long', finishTime: 5000 }),
      row({ id: 'short', finishTime: 1500 }),
      row({ id: 'mid', finishTime: 3000 }),
    ];
    const out = sortResults(rows, { field: 'time', direction: 'asc' });
    expect(out.map((r) => r.id)).toEqual(['short', 'mid', 'long']);
  });

  it('pushes null finishTime rows to the end in both directions', () => {
    const rows = [
      row({ id: 'null', finishTime: null }),
      row({ id: 'fast', finishTime: 1500 }),
      row({ id: 'slow', finishTime: 5000 }),
    ];
    const asc = sortResults(rows, { field: 'time', direction: 'asc' });
    const desc = sortResults(rows, { field: 'time', direction: 'desc' });
    expect(asc.at(-1)?.id).toBe('null');
    expect(desc.at(-1)?.id).toBe('null');
  });

  it('sorts by event name and country case-insensitively', () => {
    const rows = [
      row({ id: 'z', eventName: 'Zion Trail', eventCountry: 'USA' }),
      row({ id: 'b', eventName: 'Berlin Marathon', eventCountry: 'Germany' }),
      row({ id: 'a', eventName: 'Andes 50K', eventCountry: 'Argentina' }),
    ];
    const byEvent = sortResults(rows, { field: 'event', direction: 'asc' });
    expect(byEvent.map((r) => r.id)).toEqual(['a', 'b', 'z']);

    const byCountry = sortResults(rows, { field: 'country', direction: 'asc' });
    expect(byCountry.map((r) => r.id)).toEqual(['a', 'b', 'z']);
  });

  it('does not mutate the input array', () => {
    const rows = [row({ id: '1' }), row({ id: '2' })];
    const before = rows.map((r) => r.id);
    sortResults(rows, { field: 'name', direction: 'asc' });
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});
