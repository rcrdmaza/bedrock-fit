// Maps a row's raceCategory to the Tailwind classes that paint a
// colored outline on its row in the /results table. The intent is a
// quick visual cue that a row is a "long" race vs. a "short" one
// without needing the user to read the Distance column:
//
//   10K          → light blue (sky-300)
//   Half / 21K   → blue       (blue-500)
//   Marathon     → dark blue  (blue-900)
//   5K + others  → no outline
//
// Implementation note: HTML tables don't let you put a single border on
// a <tr> reliably (rows are not box-rendering elements in CSS). To get
// a "row outline" we put `border-y` on every cell of the row, plus
// `border-l` on the first cell and `border-r` on the last. Each row
// emits cells with a leading/trailing/middle role so this module just
// returns the right class for that role.
//
// Pure / client-safe — no React, no DB. Tested directly.

export interface DistanceOutline {
  // Border + faint background tint applied to every cell in the row.
  // Empty string when the distance has no themed outline (5K, Trail,
  // imported categories we don't recognize).
  cell: string;
  // Same as `cell` but with `border-l-2` for the first cell of the
  // row, so the leftmost edge of the outline is visible.
  cellLeading: string;
  // Same as `cell` but with `border-r-2` for the last cell of the row.
  cellTrailing: string;
}

const NONE: DistanceOutline = { cell: '', cellLeading: '', cellTrailing: '' };

// Each category's class set is built from one base colour token. We
// inline the literal class strings rather than synthesizing them at
// runtime because Tailwind's compiler scans source for class literals
// at build time — string concatenation would produce classes the
// compiler never sees, and the styles would silently no-op in
// production.
const TEN_K: DistanceOutline = {
  cell: 'border-y-2 border-sky-300 bg-sky-50/40',
  cellLeading: 'border-y-2 border-l-2 border-sky-300 bg-sky-50/40',
  cellTrailing: 'border-y-2 border-r-2 border-sky-300 bg-sky-50/40',
};

const HALF: DistanceOutline = {
  cell: 'border-y-2 border-blue-500 bg-blue-50/40',
  cellLeading: 'border-y-2 border-l-2 border-blue-500 bg-blue-50/40',
  cellTrailing: 'border-y-2 border-r-2 border-blue-500 bg-blue-50/40',
};

const MARATHON: DistanceOutline = {
  cell: 'border-y-2 border-blue-900 bg-blue-100/40',
  cellLeading: 'border-y-2 border-l-2 border-blue-900 bg-blue-100/40',
  cellTrailing: 'border-y-2 border-r-2 border-blue-900 bg-blue-100/40',
};

// Returns the class set for a given raceCategory string. We accept
// both the canonical labels we import with ('10K', 'Half Marathon',
// 'Marathon') and the metric shorthand admins sometimes type into
// metadata or test fixtures ('21K', '42K'). Unknown / null categories
// (5K, trail runs, anything from a non-canonical import) return the
// empty NONE record so the row renders without an outline.
export function distanceOutline(
  raceCategory: string | null,
): DistanceOutline {
  if (!raceCategory) return NONE;
  const norm = raceCategory.trim().toLowerCase();
  if (norm === '10k') return TEN_K;
  if (norm === 'half marathon' || norm === '21k' || norm === 'half')
    return HALF;
  if (norm === 'marathon' || norm === '42k' || norm === 'full marathon')
    return MARATHON;
  return NONE;
}
