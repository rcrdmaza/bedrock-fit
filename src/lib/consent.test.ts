import { describe, expect, it } from 'vitest';
import {
  acceptAll,
  parseConsent,
  rejectAll,
  serializeConsent,
} from './consent';

describe('consent', () => {
  it('round-trips an accepted state', () => {
    const state = acceptAll(new Date('2026-04-28T12:00:00Z'));
    const parsed = parseConsent(serializeConsent(state));
    expect(parsed).toEqual(state);
  });

  it('round-trips a rejected state', () => {
    const state = rejectAll(new Date('2026-04-28T12:00:00Z'));
    const parsed = parseConsent(serializeConsent(state));
    expect(parsed).toEqual(state);
  });

  it('treats undefined as null', () => {
    expect(parseConsent(undefined)).toBeNull();
  });

  it('treats malformed JSON as null', () => {
    expect(parseConsent('not%20json')).toBeNull();
  });

  it('rejects a wrong-version cookie', () => {
    const stale = encodeURIComponent(
      JSON.stringify({ v: 999, analytics: true, ads: true, ts: 'x' }),
    );
    expect(parseConsent(stale)).toBeNull();
  });

  it('rejects a cookie missing required fields', () => {
    const bad = encodeURIComponent(
      JSON.stringify({ v: 1, analytics: true, ts: 'x' }),
    );
    expect(parseConsent(bad)).toBeNull();
  });

  it('preserves an explicit reject of one bucket', () => {
    // Forge a cookie that accepts analytics but rejects ads — proves we
    // don't accidentally collapse to all-or-nothing on parse.
    const partial = encodeURIComponent(
      JSON.stringify({
        v: 1,
        analytics: true,
        ads: false,
        ts: '2026-04-28T00:00:00Z',
      }),
    );
    const parsed = parseConsent(partial);
    expect(parsed?.analytics).toBe(true);
    expect(parsed?.ads).toBe(false);
  });
});
