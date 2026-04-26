import { describe, expect, it } from 'vitest';
import {
  extractNameParts,
  rankSimilarResults,
  scoreNameSimilarity,
} from './name-match';

// These tests pin the priority semantics that drive claim-suggestion
// on the athlete profile page. Tier slippage here means an athlete
// could see suggestions for a totally different person — the worst
// kind of bug because it makes claiming someone else's result feel
// reasonable.

describe('extractNameParts', () => {
  it('handles a typical first + last name', () => {
    expect(extractNameParts('Carlos Mendez')).toEqual({
      first: 'carlos',
      last: 'mendez',
      firstInitial: 'c',
    });
  });

  it('lowercases everything', () => {
    expect(extractNameParts('CARLOS MENDEZ')).toEqual({
      first: 'carlos',
      last: 'mendez',
      firstInitial: 'c',
    });
  });

  it('keeps the last token as `last` for multi-token names', () => {
    // Middle names get folded — first token is first, last token is
    // last. Good enough for matching; we don't try to parse "del" /
    // "van der" / honorifics.
    expect(extractNameParts('Maria del Carmen Lopez')).toEqual({
      first: 'maria',
      last: 'lopez',
      firstInitial: 'm',
    });
  });

  it('treats a one-word name as first only, no last', () => {
    expect(extractNameParts('Pelé')).toEqual({
      first: 'pelé',
      last: '',
      firstInitial: 'p',
    });
  });

  it('returns empty parts for blank input', () => {
    expect(extractNameParts('')).toEqual({
      first: '',
      last: '',
      firstInitial: '',
    });
    expect(extractNameParts('   ')).toEqual({
      first: '',
      last: '',
      firstInitial: '',
    });
  });

  it('collapses runs of whitespace', () => {
    expect(extractNameParts('  Carlos\t \n Mendez ')).toEqual({
      first: 'carlos',
      last: 'mendez',
      firstInitial: 'c',
    });
  });
});

describe('scoreNameSimilarity', () => {
  const carlos = extractNameParts('Carlos Mendez');

  it('gives 3 when both first and last appear', () => {
    expect(scoreNameSimilarity(carlos, 'Carlos Mendez')).toBe(3);
    expect(scoreNameSimilarity(carlos, 'CARLOS A. MENDEZ')).toBe(3);
    // Reordered names still match — substring, not positional.
    expect(scoreNameSimilarity(carlos, 'Mendez, Carlos')).toBe(3);
  });

  it('gives 2 when only first or only last appears', () => {
    expect(scoreNameSimilarity(carlos, 'Carlos Vega')).toBe(2);
    expect(scoreNameSimilarity(carlos, 'Maria Mendez')).toBe(2);
    expect(scoreNameSimilarity(carlos, 'Carlos')).toBe(2);
  });

  it('gives 1 when only the first letter of first name matches', () => {
    // Tier 2 already swallows "C Mendez" (last name is in there); the
    // tier-1 fallback covers the case where the *real* first or last
    // never appears, but the candidate's first token starts with the
    // same letter.
    expect(scoreNameSimilarity(carlos, 'Carla Hernandez')).toBe(1);
    expect(scoreNameSimilarity(carlos, 'Christopher Black')).toBe(1);
    // Lowercased candidate still scores.
    expect(scoreNameSimilarity(carlos, 'CARLA HERNANDEZ')).toBe(1);
  });

  it('gives 0 when nothing matches', () => {
    expect(scoreNameSimilarity(carlos, 'James Smith')).toBe(0);
    // First name "Lucas" starts with L, not C — no tier-1 match
    // even though "carlos" and "lucas" share some letters elsewhere.
    expect(scoreNameSimilarity(carlos, 'Lucas Hernandez')).toBe(0);
  });

  it('anchors the first-letter check to the candidate first name', () => {
    // Initial appearing only at the *end* of the candidate first name
    // shouldn't trigger tier 1 — we anchor with startsWith.
    expect(scoreNameSimilarity(carlos, 'Marc Black')).toBe(0);
  });

  it('does not match a stray "C" mid-string', () => {
    // No first/last substring; first token is "Lucas" (starts with L).
    // Even if "C" appears elsewhere in the candidate, no tier-1 match.
    expect(scoreNameSimilarity(carlos, 'Lucas Carb')).toBe(0);
  });

  it('returns 0 when athlete has no usable parts', () => {
    const empty = extractNameParts('');
    expect(scoreNameSimilarity(empty, 'Carlos Mendez')).toBe(0);
  });

  it('still scores when athlete has only first (one-word athlete name)', () => {
    const pele = extractNameParts('Pelé');
    expect(scoreNameSimilarity(pele, 'Pelé Garcia')).toBe(2);
    expect(scoreNameSimilarity(pele, 'Other Person')).toBe(0);
  });
});

describe('rankSimilarResults', () => {
  type Row = { id: string; athleteName: string };
  const rows: Row[] = [
    { id: 'r1', athleteName: 'Carlos Mendez' }, // tier 3
    { id: 'r2', athleteName: 'Carlos Vega' }, // tier 2 (first only)
    { id: 'r3', athleteName: 'Maria Mendez' }, // tier 2 (last only)
    { id: 'r4', athleteName: 'Carla Hernandez' }, // tier 1 (first letter)
    { id: 'r5', athleteName: 'Lucas Hernandez' }, // tier 0 (different letter)
    { id: 'r6', athleteName: 'CARLOS MENDEZ' }, // tier 3 (case-insensitive)
  ];

  it('groups by tier with tier 3 first, then 2, then 1', () => {
    const out = rankSimilarResults('Carlos Mendez', rows);
    // Tier 3 first (r1, r6 in input order), then tier 2 (r2, r3),
    // then tier 1 (r4). Tier 0 dropped.
    expect(out.map((r) => r.id)).toEqual(['r1', 'r6', 'r2', 'r3', 'r4']);
  });

  it('preserves input order within a tier', () => {
    const reordered = [rows[5], rows[0], rows[1], rows[2], rows[3], rows[4]] as Row[];
    const out = rankSimilarResults('Carlos Mendez', reordered);
    // r6 now comes before r1 because input was reordered. Tier 3 still
    // wins overall; ordering inside each tier follows input order.
    expect(out.map((r) => r.id)).toEqual(['r6', 'r1', 'r2', 'r3', 'r4']);
  });

  it('caps at the limit', () => {
    const many: Row[] = Array.from({ length: 20 }, (_, i) => ({
      id: `r${i}`,
      athleteName: 'Carlos Mendez',
    }));
    expect(rankSimilarResults('Carlos Mendez', many, 10)).toHaveLength(10);
  });

  it('returns empty for empty athlete names', () => {
    expect(rankSimilarResults('', rows)).toEqual([]);
    expect(rankSimilarResults('   ', rows)).toEqual([]);
  });

  it('returns empty when nothing scores above zero', () => {
    expect(
      rankSimilarResults('Aragorn', [{ id: 'r1', athleteName: 'Carlos' }]),
    ).toEqual([]);
  });

  it('handles one-word athlete names (no last)', () => {
    const out = rankSimilarResults('Pelé', [
      { id: 'r1', athleteName: 'Pelé' }, // tier 2 (first matches; no last to AND with)
      { id: 'r2', athleteName: 'Edson Pelé' }, // tier 2 (substring match on first)
      { id: 'r3', athleteName: 'James Smith' },
    ]);
    expect(out.map((r) => r.id)).toEqual(['r1', 'r2']);
  });
});
