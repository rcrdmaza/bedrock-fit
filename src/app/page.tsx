import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from '@/app/site-header';
import EventPhotoCarousel from '@/app/event-photo-carousel';
import { getLatestEventPhotos } from '@/lib/events';
import { distanceKm } from '@/lib/race';
import {
  categorySlug,
  getLeaderboardPage,
  getRecentResults,
  isLeaderboardCategory,
  LEADERBOARD_CATEGORIES,
  type LeaderboardCategory,
  type LeaderboardRow,
} from '@/lib/results';
import type { ResultRow } from '@/lib/results-filter';

// Leaderboard is a live view — a new import can change the order of the
// top 25. No static caching here.
export const dynamic = 'force-dynamic';

// How many rows the home-page leaderboard shows. The full field lives
// on /leaderboards/[category] — we keep this short on the home page so
// the fold stays focused on the fastest times plus the category chips.
const PAGE_SIZE = 25;

// Default chip when the URL has no ?category= param. 10K is a broad
// enough distance that most imports will have populated rows for it,
// so the empty state is rarer than it would be with the marathon.
const DEFAULT_CATEGORY: LeaderboardCategory = '10K';

// How many events to feature in the carousel. One photo per event, so
// this is also the max number of slides. Tuned so the ↑/↓ stays useful
// but we don't drag in ancient events.
const CAROUSEL_EVENT_LIMIT = 8;

// How many recent results the home-page teaser shows. Five is the
// number the user asked for, and pretty much the right size: enough
// to suggest "there's stuff here" without crowding the leaderboard
// below. The full feed lives at /results.
const RECENT_RESULTS_LIMIT = 5;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
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
  // Page 1 on the home page — the dedicated /leaderboards/[category]
  // route handles deeper pagination. We reuse the same query so the
  // total count comes back for the "See all N finishers" link without
  // a second round-trip. The carousel photos fetch runs in parallel
  // since it hits a different table and has nothing to share.
  const [{ rows, total }, carouselPhotos, recentResults] = await Promise.all([
    getLeaderboardPage(category, 1, PAGE_SIZE),
    getLatestEventPhotos(CAROUSEL_EVENT_LIMIT),
    getRecentResults(RECENT_RESULTS_LIMIT),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 relative">
      {/* Decorative sprinter — sits behind the content at 18% opacity so
          it reads as a backdrop without fighting the leaderboard text.
          aria-hidden + pointer-events-none keep it out of AT and click
          targets. Fixed positioning keeps it in place during scroll. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center opacity-[0.18]"
      >
        <Image
          src="/runner-bg.png"
          alt=""
          width={924}
          height={576}
          priority={false}
          className="max-w-[80vw] h-auto"
        />
      </div>

      <SiteHeader />

      <section className="relative max-w-4xl mx-auto px-8 pt-16 pb-24">
        {/* Carousel hides itself when there are no photos, so first-
            run installs still drop straight into the leaderboard. */}
        <EventPhotoCarousel photos={carouselPhotos} />

        {/* Recent race-results teaser. Renders nothing on a brand-
            new install with no imported results — same hide-on-empty
            pattern the carousel uses, so the page doesn't carry an
            empty section header. */}
        {recentResults.length > 0 && (
          <RecentResultsSection rows={recentResults} />
        )}

        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Leaderboards
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          Top {PAGE_SIZE} finishers by distance. Sorted fastest to slowest.
        </p>

        <CategoryChips active={category} />

        {rows.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm border border-dashed border-slate-200 rounded-2xl">
            No {category} results on file yet.
          </div>
        ) : (
          <>
            <LeaderboardTable category={category} rows={rows} />
            {/* Only show the "See all" affordance when there are more
                rows than fit on the home page — otherwise the link
                lands on an identical view. */}
            {total > rows.length && (
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/leaderboards/${categorySlug(category)}`}
                  className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  See all {total.toLocaleString()} {category} finisher
                  {total === 1 ? '' : 's'} →
                </Link>
              </div>
            )}
          </>
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

// Compact teaser of the most recent results. Mirrors the leaderboard
// table's visual weight (same border, same hover, same font sizing)
// so the two sections feel like sibling cards rather than competing
// for attention. Click an athlete name to land on their profile;
// click "See all results" to jump to the full /results browser.
function RecentResultsSection({ rows }: { rows: ResultRow[] }) {
  return (
    <section aria-label="Recent race results" className="mb-12">
      {/* Header bar: label on the left, small "see all" anchor on
          the right. Baseline-aligned so the link reads as part of
          the same row rather than a separate caption. */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide">
          Race results
        </h2>
        <Link
          href="/results"
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          See all results →
        </Link>
      </div>
      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white/70">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-stone-500 text-left text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Athlete</th>
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Distance</th>
              <th className="px-5 py-3 font-medium text-right">Finish</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              // Reuse the same Distance fallback as /results: prefer
              // the canonical category, fall back to "NK" parsed out
              // of the event name. An em-dash beats a blank cell.
              const km = distanceKm(r.raceCategory, r.eventName);
              const distanceLabel =
                r.raceCategory ?? (km != null ? `${km} km` : '—');
              return (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                >
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
                      {r.eventCountry ? ` · ${r.eventCountry}` : ''}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-stone-700">
                    {distanceLabel}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-stone-900">
                    {formatTime(r.finishTime)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
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
          {rows.map((r, idx) => {
            const place = idx + 1;
            return (
              <tr
                key={r.id}
                className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-5 py-3 tabular-nums text-stone-400">
                  {place}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
