import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/app/site-header';
import {
  categorySlug,
  getLeaderboardPage,
  LEADERBOARD_CATEGORIES,
  parseCategorySlug,
  type LeaderboardCategory,
  type LeaderboardPage,
  type LeaderboardRow,
} from '@/lib/results';

// Leaderboard rankings change with every import; don't cache.
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type Params = Promise<{ category: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Pull the ?page= param and coerce it. Invalid, negative, or
// fractional values fall back to 1 — the action-side clamp in
// getLeaderboardPage is the authoritative check, this is just a
// courtesy so the URL shape stays clean.
function readPage(raw: string | string[] | undefined): number {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(first);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default async function LeaderboardCategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { category: slug } = await params;
  const category = parseCategorySlug(slug);
  // Unknown slug → 404. This also blocks the user from hitting an ugly
  // "invalid input for enum" SQL error if they hand-type a junk slug.
  if (!category) notFound();

  const sp = await searchParams;
  const page = readPage(sp.page);
  const data = await getLeaderboardPage(category, page, PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="max-w-4xl mx-auto px-8 pt-16 pb-24">
        <Link
          href={`/?category=${encodeURIComponent(category)}`}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <span aria-hidden="true">←</span> All leaderboards
        </Link>
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          {category} leaderboard
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          {data.total === 0
            ? 'No finishers on file yet.'
            : `${data.total.toLocaleString()} finisher${data.total === 1 ? '' : 's'}, sorted fastest to slowest.`}
        </p>

        <CategoryChips active={category} />

        {data.rows.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm border border-dashed border-slate-200 rounded-2xl">
            No results in this range.
          </div>
        ) : (
          <>
            <LeaderboardTable
              category={category}
              rows={data.rows}
              // Show absolute rank across the whole field — not per page —
              // so row #51 on page 2 reads as "51" instead of "1".
              startRank={(data.page - 1) * data.pageSize + 1}
            />
            <PageNav data={data} category={category} />
          </>
        )}
      </section>
    </main>
  );
}

function CategoryChips({ active }: { active: LeaderboardCategory }) {
  return (
    <nav
      aria-label="Jump to another distance"
      className="flex flex-wrap gap-2 mb-6"
    >
      {LEADERBOARD_CATEGORIES.map((c) => {
        const isActive = c === active;
        return (
          <Link
            key={c}
            href={`/leaderboards/${categorySlug(c)}`}
            className={`text-sm rounded-full px-4 py-1.5 border transition-colors ${
              isActive
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-slate-200 hover:border-slate-400'
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
  startRank,
}: {
  category: LeaderboardCategory;
  rows: LeaderboardRow[];
  startRank: number;
}) {
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-stone-500 text-left text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium w-12">#</th>
            <th className="px-5 py-3 font-medium">Athlete</th>
            <th className="px-5 py-3 font-medium">Event</th>
            <th className="px-5 py-3 font-medium text-right">Finish</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.id}
              className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
            >
              <td className="px-5 py-3 tabular-nums text-stone-400">
                {startRank + idx}
              </td>
              <td className="px-5 py-3">
                <Link
                  href={`/athletes/${r.athleteId}`}
                  className="font-medium text-stone-900 hover:text-blue-600 transition-colors"
                >
                  {r.athleteName}
                </Link>
              </td>
              <td className="px-5 py-3 text-stone-600">
                <div>{r.eventName}</div>
                <div className="text-xs text-stone-400 mt-0.5">
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
              <td className="px-5 py-3 text-right tabular-nums font-medium text-stone-900">
                {formatTime(r.finishTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageNav({
  data,
  category,
}: {
  data: LeaderboardPage;
  category: LeaderboardCategory;
}) {
  const base = `/leaderboards/${categorySlug(category)}`;
  const prevHref = data.page > 1 ? `${base}?page=${data.page - 1}` : null;
  const nextHref =
    data.page < data.totalPages ? `${base}?page=${data.page + 1}` : null;

  return (
    <nav
      aria-label="Leaderboard pagination"
      className="flex items-center justify-between mt-6"
    >
      {/* Prev — rendered as a disabled span when we're already on page 1.
          A disabled <Link> would still be keyboard-focusable; span keeps
          semantics honest. */}
      {prevHref ? (
        <Link
          href={prevHref}
          className="text-sm text-stone-700 hover:text-stone-900 transition-colors"
        >
          ← Previous
        </Link>
      ) : (
        <span className="text-sm text-stone-300" aria-disabled="true">
          ← Previous
        </span>
      )}

      <span className="text-xs text-stone-400 tabular-nums">
        Page {data.page} of {data.totalPages}
      </span>

      {nextHref ? (
        <Link
          href={nextHref}
          className="text-sm text-stone-700 hover:text-stone-900 transition-colors"
        >
          Next →
        </Link>
      ) : (
        <span className="text-sm text-stone-300" aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
