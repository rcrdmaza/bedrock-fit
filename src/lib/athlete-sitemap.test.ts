import { describe, expect, it } from 'vitest';
import {
  athleteSitemapChunkCount,
  athletesPerSitemap,
} from './athlete-sitemap';

describe('athleteSitemapChunkCount', () => {
  it('returns 1 for an empty DB so chunk 0 always exists', () => {
    expect(athleteSitemapChunkCount(0)).toBe(1);
  });

  it('returns 1 for any count up to and including the per-chunk cap', () => {
    expect(athleteSitemapChunkCount(1)).toBe(1);
    expect(athleteSitemapChunkCount(athletesPerSitemap())).toBe(1);
  });

  it('rolls over to 2 chunks one row past the cap', () => {
    expect(athleteSitemapChunkCount(athletesPerSitemap() + 1)).toBe(2);
  });

  it('handles exact multiples of the cap without an empty trailing chunk', () => {
    expect(athleteSitemapChunkCount(athletesPerSitemap() * 3)).toBe(3);
  });

  it('coerces non-finite / negative counts to 1', () => {
    expect(athleteSitemapChunkCount(Number.NaN)).toBe(1);
    expect(athleteSitemapChunkCount(-5)).toBe(1);
  });
});
