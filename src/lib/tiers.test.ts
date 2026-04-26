import { describe, expect, it } from 'vitest';
import { resolveTier, tierProgress, TIERS } from './tiers';

// Tier boundaries are user-visible (they show up as a badge under the
// avatar and tint the whole profile page), so off-by-one bugs here
// would be loud. These tests pin every threshold and the unranked /
// out-of-range branches.

describe('resolveTier', () => {
  it('returns null for zero claimed', () => {
    expect(resolveTier(0)).toBeNull();
  });

  it('returns null for negative counts', () => {
    expect(resolveTier(-1)).toBeNull();
    expect(resolveTier(-100)).toBeNull();
  });

  it('returns null for non-finite values', () => {
    // NaN and Infinity both indicate something went wrong upstream
    // (a missing count, a divide-by-zero) — refusing to assign a tier
    // is safer than handing out RUNPRO to bad data.
    expect(resolveTier(Number.NaN)).toBeNull();
    expect(resolveTier(Number.POSITIVE_INFINITY)).toBeNull();
    expect(resolveTier(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  it('returns NEWBIE at exactly 1 claimed', () => {
    expect(resolveTier(1)?.id).toBe('newbie');
  });

  it('stays NEWBIE through 4 claimed', () => {
    expect(resolveTier(2)?.id).toBe('newbie');
    expect(resolveTier(4)?.id).toBe('newbie');
  });

  it('promotes to KICKSTARTER at 5 claimed', () => {
    expect(resolveTier(5)?.id).toBe('kickstarter');
  });

  it('stays KICKSTARTER through 14 claimed', () => {
    expect(resolveTier(14)?.id).toBe('kickstarter');
  });

  it('promotes to RUNVET at 15 claimed', () => {
    expect(resolveTier(15)?.id).toBe('runvet');
  });

  it('stays RUNVET through 29 claimed', () => {
    expect(resolveTier(29)?.id).toBe('runvet');
  });

  it('promotes to RUNPRO at 30 claimed', () => {
    expect(resolveTier(30)?.id).toBe('runpro');
  });

  it('stays RUNPRO for any value above 30', () => {
    expect(resolveTier(100)?.id).toBe('runpro');
    expect(resolveTier(10_000)?.id).toBe('runpro');
  });

  it('floors fractional inputs before classifying', () => {
    // 0.99 should NOT be NEWBIE — they haven't claimed a full race.
    expect(resolveTier(0.99)).toBeNull();
    // 4.9 floors to 4 → still NEWBIE.
    expect(resolveTier(4.9)?.id).toBe('newbie');
  });
});

describe('TIERS palette', () => {
  it('defines exactly four tiers in ascending order', () => {
    expect(TIERS.map((t) => t.id)).toEqual([
      'newbie',
      'kickstarter',
      'runvet',
      'runpro',
    ]);
    // Ascending threshold invariant — resolveTier scans top-down, so
    // out-of-order entries would silently mis-classify.
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].minClaimed).toBeGreaterThan(TIERS[i - 1].minClaimed);
    }
  });

  it('maps each tier to its expected metal', () => {
    expect(TIERS[0].metal).toBe('bronze');
    expect(TIERS[1].metal).toBe('silver');
    expect(TIERS[2].metal).toBe('gold');
    expect(TIERS[3].metal).toBe('platinum');
  });
});

describe('tierProgress', () => {
  it('puts an unranked athlete on the path to NEWBIE', () => {
    const p = tierProgress(0);
    expect(p.current).toBeNull();
    expect(p.next?.id).toBe('newbie');
    expect(p.remaining).toBe(1);
  });

  it('counts down to KICKSTARTER from NEWBIE', () => {
    const p = tierProgress(3);
    expect(p.current?.id).toBe('newbie');
    expect(p.next?.id).toBe('kickstarter');
    expect(p.remaining).toBe(2);
  });

  it('counts down to RUNVET from KICKSTARTER', () => {
    const p = tierProgress(10);
    expect(p.current?.id).toBe('kickstarter');
    expect(p.next?.id).toBe('runvet');
    expect(p.remaining).toBe(5);
  });

  it('counts down to RUNPRO from RUNVET', () => {
    const p = tierProgress(20);
    expect(p.current?.id).toBe('runvet');
    expect(p.next?.id).toBe('runpro');
    expect(p.remaining).toBe(10);
  });

  it('caps at RUNPRO with no next tier', () => {
    const p = tierProgress(50);
    expect(p.current?.id).toBe('runpro');
    expect(p.next).toBeNull();
    expect(p.remaining).toBe(0);
  });
});
