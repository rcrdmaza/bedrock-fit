/**
 * Reading level, shared by the two copy gates.
 *
 * `check-article.mjs` grades article content files. `check-copy.mjs` grades the
 * rendered HTML of every other route. They have to agree, or an article would
 * pass one gate and fail the other on identical prose, so the syllable counter
 * and the grade formula live here and nowhere else.
 *
 * Extracted verbatim from check-article.mjs. Do not "improve" the syllable
 * heuristic without re-measuring every published article: the 9.0 threshold was
 * calibrated against this implementation, and a more accurate counter would
 * silently move the bar for work that already shipped.
 */

/** Syllables, approximated by vowel groups. Good enough for a grade estimate. */
export function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return (word.match(/[aeiouy]{1,2}/g) || []).length || 1;
}

/** Flesch Kincaid grade level. */
export function fleschKincaid(text) {
  const sentences = (text.match(/[.!?]+(?=\s|$)/g) || []).length || 1;
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

/** Ninth grade or below, everywhere. */
export const MAX_GRADE = 9.0;

/**
 * Em and en dashes are banned outright in rendered copy.
 *
 * Matched here as JavaScript string characters rather than by shelling out to
 * grep. `grep '[—–]'` in a POSIX locale compares *bytes*, so the bracket
 * expression matches the individual bytes of any three-byte UTF-8 character
 * beginning E2 80, which includes ’ “ ” × and →. That reports hundreds of
 * false positives on a clean site and never returns zero.
 */
export const BANNED_DASHES = /[—–]/;
