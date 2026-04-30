import { describe, expect, it } from 'vitest';
import { distanceOutline } from './distance-color';

describe('distanceOutline', () => {
  it('returns the sky/light-blue palette for 10K', () => {
    const o = distanceOutline('10K');
    expect(o.cell).toContain('border-sky-300');
    expect(o.cellLeading).toContain('border-l-2');
    expect(o.cellTrailing).toContain('border-r-2');
  });

  it('returns the blue palette for Half Marathon (canonical)', () => {
    const o = distanceOutline('Half Marathon');
    expect(o.cell).toContain('border-blue-500');
  });

  it('returns the blue palette for the 21K shorthand', () => {
    expect(distanceOutline('21K').cell).toContain('border-blue-500');
    // case-insensitive
    expect(distanceOutline('21k').cell).toContain('border-blue-500');
  });

  it('returns the dark-blue palette for Marathon (canonical)', () => {
    const o = distanceOutline('Marathon');
    expect(o.cell).toContain('border-blue-900');
  });

  it('returns the dark-blue palette for the 42K shorthand', () => {
    expect(distanceOutline('42K').cell).toContain('border-blue-900');
  });

  it('returns no outline for 5K (per spec — only 10K/Half/Marathon)', () => {
    expect(distanceOutline('5K').cell).toBe('');
    expect(distanceOutline('5K').cellLeading).toBe('');
    expect(distanceOutline('5K').cellTrailing).toBe('');
  });

  it('returns no outline for null / unknown / trail categories', () => {
    expect(distanceOutline(null).cell).toBe('');
    expect(distanceOutline('Trail').cell).toBe('');
    expect(distanceOutline('').cell).toBe('');
  });

  it('tolerates surrounding whitespace', () => {
    expect(distanceOutline('  10K  ').cell).toContain('border-sky-300');
  });
});
