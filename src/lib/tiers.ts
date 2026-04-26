// Athlete progression tiers. Computed off the count of *claimed* races
// (status === 'claimed' on the result row) — unclaimed and pending
// rows don't count, because the tier exists to reward an athlete for
// committing to their results, not just appearing in an import.
//
// Tier thresholds:
//   1  claimed → NEWBIE      (bronze)
//   5  claimed → KICKSTARTER (silver)
//   15 claimed → RUNVET      (gold)
//   30 claimed → RUNPRO      (platinum)
//
// Below 1 claimed: no tier — the profile renders untinted, no badge.
//
// The colors below are pulled from the existing Tailwind 4 palette
// (the project uses stone for chrome) and chosen to feel like the
// physical metals while staying inside the sandy/warm aesthetic of
// the rest of the app: amber-ish bronze, neutral silver, warm gold,
// cool platinum. They're applied as full Tailwind class strings —
// component code can drop them into className without string
// concatenation that Tailwind's JIT can't see.

export type TierId = 'newbie' | 'kickstarter' | 'runvet' | 'runpro';
export type Metal = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierTheme {
  // Wide top banner background + text used across the profile header.
  bannerBg: string;
  bannerText: string;
  // Avatar ring color (Tailwind ring-* utilities).
  ring: string;
  // Pill / chip background and text used for the badge directly.
  badgeBg: string;
  badgeText: string;
  // Subtle border under the stats row, tying the page together.
  divider: string;
  // Hex used by SVG fills (the medal disc inside the badge). Tailwind
  // can't tokenize a dynamically-built bg-[#...] class; we use this
  // hex directly via inline style.
  medalHex: string;
}

export interface Tier {
  id: TierId;
  label: string;
  // Inclusive lower bound on claimed-race count.
  minClaimed: number;
  metal: Metal;
  theme: TierTheme;
}

// Ordered by ascending threshold so resolveTier() can scan from the
// top tier down and pick the first that fits.
export const TIERS: readonly Tier[] = [
  {
    id: 'newbie',
    label: 'NEWBIE',
    minClaimed: 1,
    metal: 'bronze',
    theme: {
      bannerBg: 'bg-amber-50',
      bannerText: 'text-amber-900',
      ring: 'ring-amber-600',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      divider: 'border-amber-200',
      medalHex: '#a16207', // amber-700
    },
  },
  {
    id: 'kickstarter',
    label: 'KICKSTARTER',
    minClaimed: 5,
    metal: 'silver',
    theme: {
      bannerBg: 'bg-slate-50',
      bannerText: 'text-slate-800',
      ring: 'ring-slate-400',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800',
      divider: 'border-slate-200',
      medalHex: '#94a3b8', // slate-400
    },
  },
  {
    id: 'runvet',
    label: 'RUNVET',
    minClaimed: 15,
    metal: 'gold',
    theme: {
      bannerBg: 'bg-yellow-50',
      bannerText: 'text-yellow-900',
      ring: 'ring-yellow-500',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-900',
      divider: 'border-yellow-300',
      medalHex: '#ca8a04', // yellow-600
    },
  },
  {
    id: 'runpro',
    label: 'RUNPRO',
    minClaimed: 30,
    metal: 'platinum',
    theme: {
      bannerBg: 'bg-violet-50',
      bannerText: 'text-violet-900',
      ring: 'ring-violet-400',
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-900',
      divider: 'border-violet-200',
      medalHex: '#a78bfa', // violet-400
    },
  },
] as const;

// Resolve which tier (if any) an athlete belongs to. Negative or
// non-integer counts are coerced to 0 — getting "you've claimed -1
// races" wrong should never bump anyone into a tier.
export function resolveTier(claimedCount: number): Tier | null {
  if (!Number.isFinite(claimedCount) || claimedCount < 1) return null;
  const n = Math.max(0, Math.floor(claimedCount));

  // Walk highest-to-lowest so the first match wins.
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const tier = TIERS[i];
    if (n >= tier.minClaimed) return tier;
  }
  return null;
}

// Distance in claimed-races to the next tier. Returns null at the top
// (RUNPRO has nothing above it) and works for the unranked too — an
// athlete with 0 claimed needs 1 to reach NEWBIE. Useful for a "X more
// races until KICKSTARTER" hint on the profile page.
export interface TierProgress {
  current: Tier | null;
  next: Tier | null;
  remaining: number;
}

export function tierProgress(claimedCount: number): TierProgress {
  const safe =
    Number.isFinite(claimedCount) && claimedCount > 0
      ? Math.floor(claimedCount)
      : 0;
  const current = resolveTier(safe);
  const next =
    TIERS.find((t) => t.minClaimed > safe) ?? null;
  const remaining = next ? next.minClaimed - safe : 0;
  return { current, next, remaining };
}
