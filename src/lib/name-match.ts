// Priority name matching, used on the athlete profile page when the
// athlete row has no results yet. We surface candidates from the full
// results pool whose name *looks like* this athlete, so the user can
// claim them and link them to their profile.
//
// Priority (highest first) — higher tier always wins, no blending:
//   3. Both first AND last name appear in the candidate's name
//   2. Either first OR last name appears
//   1. Loose fallback: candidate's first name starts with the same
//      letter as the athlete's first name (e.g. "Carla Hernandez" for
//      athlete "Carlos Mendez"). Broad on purpose — capped at the
//      caller-provided limit so it never floods, and the UI is meant
//      to frame it as "any of these you?" rather than "definite match".
//   0. No match — dropped.
//
// Why explicit tiers instead of a fuzzy distance? The use case is
// claim-suggestion, not autocomplete: tiered substring matching makes
// the worst-case "Carlos Mendez claims Carla Hernandez's race"
// noticeable — Carla shows up as a tier-1 long-shot, not blended in
// with the real matches.

export interface NameParts {
  // All lowercased so callers can compare against `candidate.toLowerCase()`
  // without re-normalizing. Empty string means "no part" (a one-token
  // name has no last; an empty/whitespace name has neither).
  first: string;
  last: string;
  // First character of `first`. Empty when `first` is empty.
  firstInitial: string;
}

export function extractNameParts(name: string): NameParts {
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '', firstInitial: '' };
  if (parts.length === 1) {
    const only = parts[0]!;
    return { first: only, last: '', firstInitial: only.charAt(0) };
  }
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return { first, last, firstInitial: first.charAt(0) };
}

// Score a candidate name (case-insensitive substring) against the
// athlete's name parts. Pure — no allocation, suitable for a `.map`
// over thousands of rows.
export function scoreNameSimilarity(
  athlete: NameParts,
  candidate: string,
): number {
  const c = candidate.toLowerCase();
  const hasFirst = athlete.first.length > 0 && c.includes(athlete.first);
  const hasLast = athlete.last.length > 0 && c.includes(athlete.last);
  if (hasFirst && hasLast) return 3;
  if (hasFirst || hasLast) return 2;
  // Tier 1 — first-letter fallback. We only get here if neither full
  // first nor full last name was anywhere in the candidate. Match
  // when the candidate's *first* token starts with the same letter as
  // the athlete's first initial. We anchor to the first token rather
  // than "letter appears anywhere" so a candidate named "James Smith"
  // doesn't get suggested to athlete "Carlos Mendez" just because
  // "carlos" happens to share a letter with "smith".
  if (athlete.firstInitial.length > 0) {
    const candidateFirst = c.split(/\s+/, 1)[0] ?? '';
    if (candidateFirst.startsWith(athlete.firstInitial)) return 1;
  }
  return 0;
}

// Filter + rank candidates by similarity score. Stable: input order
// is preserved within a tier, so callers passing already-sorted input
// (e.g. event date desc) get sensible secondary ordering for free.
//
// `limit` is hard — never returns more than `limit` rows. Returns an
// empty array when the athlete name has no usable parts (empty /
// whitespace-only), since matching every row would be misleading.
export function rankSimilarResults<T extends { athleteName: string }>(
  athleteName: string,
  candidates: T[],
  limit = 10,
): T[] {
  const parts = extractNameParts(athleteName);
  if (!parts.first && !parts.last) return [];

  const scored: Array<{ row: T; score: number; index: number }> = [];
  for (let i = 0; i < candidates.length; i++) {
    const score = scoreNameSimilarity(parts, candidates[i]!.athleteName);
    if (score > 0) scored.push({ row: candidates[i]!, score, index: i });
  }

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, limit).map((s) => s.row);
}

