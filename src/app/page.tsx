import Link from 'next/link';
import {
  getLeaderboard,
  isLeaderboardCategory,
  LEADERBOARD_CATEGORIES,
  type LeaderboardCategory,
  type LeaderboardRow,
} from '@/lib/results';

// Leaderboard is a live view — a new import can change the order of the
// top 25. No static caching here.
export const dynamic = 'force-dynamic';

// How many rows each leaderboard shows. Matches what the scoping
// conversation settled on; anything larger should move to a paginated
// /leaderboards/[category] page.
const PAGE_SIZE = 25;

// Default chip when the URL has no ?category= param. 10K is a broad
// enough distance that most imports will have populated rows for it,
// so the empty state is rarer than it would be with the marathon.
const DEFAULT_CATEGORY: LeaderboardCategory = '10K';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Pulls the (possibly missing, possibly array) ?category= value out of
// Next's searchParams object and narrows it to a canonical category or
// falls back to the default. Array-valued params can happen if someone
// crafts a URL like ?category=5K&category=10K — take the first.
function readCategoryParam(
  raw: string | string[] | undefined,
): LeaderboardCategory {
  const first = Array.isArray(raw) ? raw[0] : raw;
  return isLeaderboardCategory(first) ? first : DEFAULT_CATEGORY;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const category = readCategoryParam(params.category);
  const rows = await getLeaderboard(category, PAGE_SIZE);

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/results"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Search results
          </Link>
          <Link
            href="/signin"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-8 pt-16 pb-24">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Leaderboards
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Top {PAGE_SIZE} finishers by distance. Sorted fastest to slowest.
        </p>

        <CategoryChips active={category} />

        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
            No {category} results on file yet.
          </div>
        ) : (
          <LeaderboardTable category={category} rows={rows} />
        )}
      </section>
    </main>
  );
}

function CategoryChips({ active }: { active: LeaderboardCategory }) {
  return (
    <nav
      aria-label="Filter leaderboard by distance"
      className="flex flex-wrap gap-2 mb-6"
    >
      {LEADERBOARD_CATEGORIES.map((c) => {
        const isActive = c === active;
        return (
          <Link
            key={c}
            href={`/?category=${encodeURIComponent(c)}`}
            // `scroll: false` would be nice but we're a plain anchor — a
            // refetch on category change is cheap and predictable. The
            // page is server-rendered so there's no client store to reset.
            className={`text-sm rounded-full px-4 py-1.5 border transition-colors ${
              isActive
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {c}
          </Link>
        );
      })}
    </nav>
  );
}

function LeaderboardTable({
  category,
  rows,
}: {
  category: LeaderboardCategory;
  rows: LeaderboardRow[];
}) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-gray-500 text-left text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium w-12">#</th>
            <th className="px-5 py-3 font-medium">Athlete</th>
            <th className="px-5 py-3 font-medium">Event</th>
            <th className="px-5 py-3 font-medium text-right">Finish</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const place = idx + 1;
            return (
              <tr
                key={r.id}
                className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors"
              >
                <td className="px-5 py-3 tabular-nums text-gray-400">
                  {place}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/athletes/${r.athleteId}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {r.athleteName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-600">
                  <div>{r.eventName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {r.raceCategory && r.raceCategory !== category
                      ? ` · ${r.raceCategory}`
                      : ''}
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-900">
                  {formatTime(r.finishTime)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
