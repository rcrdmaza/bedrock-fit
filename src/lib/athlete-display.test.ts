import { describe, expect, it } from 'vitest';
import { getDisplayName } from './athlete-display';

// These tests pin the visibility rules around the nickname toggle. The
// surface is small but the failure mode is bad — render an empty name
// in the profile header — so each branch is exercised explicitly.

describe('getDisplayName', () => {
  it('returns name when displayPreference is "name"', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: 'Champ',
        displayPreference: 'name',
      }),
    ).toBe('Carlos Mendez');
  });

  it('returns nickname when displayPreference is "nickname" and nickname is set', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: 'Champ',
        displayPreference: 'nickname',
      }),
    ).toBe('Champ');
  });

  it('falls back to name when displayPreference is "nickname" but nickname is empty', () => {
    // Stale preference + cleared nickname combo — the profile header
    // would otherwise render an empty string.
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: '',
        displayPreference: 'nickname',
      }),
    ).toBe('Carlos Mendez');
  });

  it('falls back to name when nickname is null', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: null,
        displayPreference: 'nickname',
      }),
    ).toBe('Carlos Mendez');
  });

  it('falls back to name when nickname is whitespace-only', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: '   ',
        displayPreference: 'nickname',
      }),
    ).toBe('Carlos Mendez');
  });

  it('trims surrounding whitespace from nickname when used', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: '  Champ  ',
        displayPreference: 'nickname',
      }),
    ).toBe('Champ');
  });

  it('treats missing displayPreference as "name"', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: 'Champ',
      }),
    ).toBe('Carlos Mendez');
  });

  it('treats null displayPreference as "name"', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: 'Champ',
        displayPreference: null,
      }),
    ).toBe('Carlos Mendez');
  });

  it('treats unknown displayPreference values as "name"', () => {
    // Hand-edited or stale enum value — fall back to the safe default
    // rather than rendering nothing.
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        nickname: 'Champ',
        displayPreference: 'something-else',
      }),
    ).toBe('Carlos Mendez');
  });

  it('handles missing nickname field entirely', () => {
    expect(
      getDisplayName({
        name: 'Carlos Mendez',
        displayPreference: 'nickname',
      }),
    ).toBe('Carlos Mendez');
  });
});
