import { describe, expect, it } from 'vitest';
import {
  acceptAll,
  consentModeSignal,
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

describe('consentModeSignal', () => {
  it('denies every signal for a null state (no decision yet)', () => {
    expect(consentModeSignal(null)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });

  it('grants every signal for accept-all', () => {
    expect(consentModeSignal(acceptAll())).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  });

  it('denies every signal for reject-all', () => {
    expect(consentModeSignal(rejectAll())).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });

  it('maps the ads bucket onto all three ad signals together', () => {
    // analytics granted, ads denied — the three ad_* signals follow
    // `ads`, analytics_storage follows `analytics`.
    const state = {
      essential: true as const,
      analytics: true,
      ads: false,
      ts: '2026-04-28T00:00:00Z',
      v: 1,
    };
    expect(consentModeSignal(state)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
  });

  it('maps the analytics bucket independently of ads', () => {
    // ads granted, analytics denied — the inverse split.
    const state = {
      essential: true as const,
      analytics: false,
      ads: true,
      ts: '2026-04-28T00:00:00Z',
      v: 1,
    };
    expect(consentModeSignal(state)).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'denied',
    });
  });
});
