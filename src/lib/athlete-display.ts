// Public-facing display name resolver. The athlete row carries both a
// legal `name` (used for matching, admin views, and claim suggestions)
// and an optional `nickname`. `displayPreference` decides which one
// other users see on leaderboards, results lists, and the profile
// header.
//
// Why a helper rather than just reading `athlete.name ?? athlete.nickname`
// at every call site? Three reasons:
//   1. Stale preference + cleared nickname — a user can flip the toggle
//      to 'nickname', save, then later wipe the nickname field. Without
//      the fallback, the profile header would render an empty string.
//   2. Whitespace-only nicknames behave the same as empty.
//   3. One canonical surface to update if the rules ever extend (e.g.
//      adding a 'first-name only' option later).

export interface DisplayableAthlete {
  // Required — the legal/canonical name. Also the fallback when
  // nickname is empty or display preference is 'name'.
  name: string;
  // Optional public alias. Empty string and null both mean "no
  // nickname set"; whitespace is trimmed before checking.
  nickname?: string | null;
  // 'name' (default) or 'nickname'. Anything else is treated as 'name'
  // — guards against a stale or hand-edited DB value.
  displayPreference?: string | null;
}

export function getDisplayName(athlete: DisplayableAthlete): string {
  const nickname = athlete.nickname?.trim() ?? '';
  const preference = athlete.displayPreference ?? 'name';
  if (preference === 'nickname' && nickname.length > 0) return nickname;
  return athlete.name;
}
