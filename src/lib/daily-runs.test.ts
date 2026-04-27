import { describe, expect, it } from 'vitest';
import {
  parseDistance,
  parseDuration,
  parseStravaUrl,
  parseParticipants,
  toMeters,
  formatDistance,
  formatDuration,
  paceLabel,
  MAX_DISTANCE_VALUE,
} from './daily-runs';

describe('parseDistance', () => {
  it('rejects empty input', () => {
    const r = parseDistance('', 'mi');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/enter the distance/i);
  });

  it('rejects non-numeric input', () => {
    const r = parseDistance('five', 'mi');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/number/i);
  });

  it('rejects zero and negative', () => {
    expect(parseDistance('0', 'mi').ok).toBe(false);
    expect(parseDistance('-3', 'km').ok).toBe(false);
  });

  it('rejects values past the cap', () => {
    const r = parseDistance(`${MAX_DISTANCE_VALUE + 1}`, 'mi');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/too large/i);
  });

  it('rejects unknown units', () => {
    const r = parseDistance('5', 'lightyears');
    expect(r.ok).toBe(false);
  });

  it('accepts miles and converts to meters', () => {
    const r = parseDistance('5', 'mi');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(5);
      expect(r.unit).toBe('mi');
      // 5 mi = 8046.72 m, rounded to int.
      expect(r.meters).toBe(8047);
    }
  });

  it('accepts km and converts to meters', () => {
    const r = parseDistance('5', 'km');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.meters).toBe(5000);
  });
});

describe('toMeters', () => {
  it('rounds miles correctly', () => {
    expect(toMeters(1, 'mi')).toBe(1609);
    expect(toMeters(26.2, 'mi')).toBe(42165);
  });

  it('rounds km correctly', () => {
    expect(toMeters(1, 'km')).toBe(1000);
    expect(toMeters(42.195, 'km')).toBe(42195);
  });
});

describe('formatDistance', () => {
  it('strips trailing zeros', () => {
    expect(formatDistance(5, 'mi')).toBe('5 mi');
    expect(formatDistance('5.00', 'mi')).toBe('5 mi');
  });

  it('keeps significant decimals', () => {
    expect(formatDistance(5.25, 'mi')).toBe('5.25 mi');
    expect(formatDistance(10.1, 'km')).toBe('10.1 km');
  });

  it('returns em-dash for non-numeric', () => {
    expect(formatDistance('abc', 'mi')).toBe('—');
  });
});

describe('parseDuration', () => {
  it('treats empty as zero (optional field)', () => {
    const r = parseDuration('');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seconds).toBe(0);
  });

  it('parses MM:SS', () => {
    const r = parseDuration('32:15');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seconds).toBe(32 * 60 + 15);
  });

  it('parses H:MM:SS', () => {
    const r = parseDuration('1:05:00');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seconds).toBe(3600 + 5 * 60);
  });

  it('parses bare seconds', () => {
    const r = parseDuration('1800');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seconds).toBe(1800);
  });

  it('rejects garbage', () => {
    expect(parseDuration('eleven minutes').ok).toBe(false);
    expect(parseDuration('32:99').ok).toBe(false);
  });

  it('rejects implausibly long durations', () => {
    const r = parseDuration('25:00:00');
    expect(r.ok).toBe(false);
  });
});

describe('formatDuration', () => {
  it('returns em-dash for null and zero', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('—');
  });

  it('formats MM:SS for short runs', () => {
    expect(formatDuration(32 * 60 + 15)).toBe('32:15');
  });

  it('formats H:MM:SS for long runs', () => {
    expect(formatDuration(3600 + 5 * 60 + 7)).toBe('1:05:07');
  });
});

describe('paceLabel', () => {
  it('returns em-dash when either input is missing', () => {
    expect(paceLabel(null, 5, 'mi')).toBe('—');
    expect(paceLabel(1800, 0, 'mi')).toBe('—');
  });

  it('renders pace per the original unit', () => {
    // 5 mi in 30:00 = 6:00/mi
    expect(paceLabel(30 * 60, 5, 'mi')).toBe('6:00 /mi');
    // 10 km in 50:00 = 5:00/km
    expect(paceLabel(50 * 60, 10, 'km')).toBe('5:00 /km');
  });

  it('rolls 60 seconds into the next minute', () => {
    // Construct a value where rounding lands on :60 — 1 unit in
    // exactly 119.5 seconds rounds to 1:60 → 2:00.
    expect(paceLabel(120, 1, 'mi')).toBe('2:00 /mi');
  });
});

describe('parseStravaUrl', () => {
  it('treats empty as null (optional)', () => {
    const r = parseStravaUrl('');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBeNull();
  });

  it('accepts https URLs', () => {
    const r = parseStravaUrl('https://www.strava.com/activities/12345');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toContain('strava.com');
  });

  it('rejects non-http schemes', () => {
    const r = parseStravaUrl('javascript:alert(1)');
    expect(r.ok).toBe(false);
  });

  it('rejects malformed input', () => {
    const r = parseStravaUrl('not a url');
    expect(r.ok).toBe(false);
  });
});

describe('parseParticipants', () => {
  it('treats empty as no participants', () => {
    const r = parseParticipants('');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids).toEqual([]);
  });

  it('extracts bare UUIDs', () => {
    const r = parseParticipants(
      'a1b2c3d4-1111-2222-3333-444455556666, b1b2c3d4-1111-2222-3333-444455556666',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids).toHaveLength(2);
  });

  it('extracts UUIDs from path-only profile URLs', () => {
    const r = parseParticipants(
      '/athletes/a1b2c3d4-1111-2222-3333-444455556666',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids[0]).toBe('a1b2c3d4-1111-2222-3333-444455556666');
  });

  it('extracts UUIDs from full profile URLs', () => {
    const r = parseParticipants(
      'https://bedrock.fit/athletes/a1b2c3d4-1111-2222-3333-444455556666',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids[0]).toBe('a1b2c3d4-1111-2222-3333-444455556666');
  });

  it('deduplicates case-insensitively', () => {
    const r = parseParticipants(
      'a1b2c3d4-1111-2222-3333-444455556666 A1B2C3D4-1111-2222-3333-444455556666',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids).toHaveLength(1);
  });

  it('rejects unparseable tokens', () => {
    const r = parseParticipants('joe-the-runner');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/joe-the-runner/);
  });

  it('handles mixed separators (commas, spaces, semicolons)', () => {
    const r = parseParticipants(
      'a1b2c3d4-1111-2222-3333-444455556666; b1b2c3d4-1111-2222-3333-444455556666 c1b2c3d4-1111-2222-3333-444455556666',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids).toHaveLength(3);
  });
});
