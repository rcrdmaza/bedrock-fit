import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getDisplayName } from '@/lib/athlete-display';
import RunningHeroAvatar from '@/app/components/running-hero-avatar';

// Top-level site chrome rendered by every page, public and admin alike.
//
// Layout is a 3-column grid: Bedrock.fit mark on the left, the nav
// links (Home / Race Results / Blog) centered in the middle, and the
// sign-in affordance pinned to the right. Grid (not flex-between)
// keeps the nav column visually centered on the viewport even when
// the mark and the right-hand control have different widths.
//
// Async server component — reads the user session cookie per request
// so the right-hand control reflects the real state. No prop plumbing,
// no client-side fetch: every page just drops <SiteHeader /> in and
// gets the right thing.

export default async function SiteHeader() {
  const user = await getCurrentUser();
  // Pull the athlete row alongside the user so the profile button can
  // show their picked display name + avatar. One extra select-by-PK
  // per request — cheap, and only when signed in. Falls through to
  // null if the link is missing (admin nuked, brand-new user before
  // claim).
  const athlete =
    user?.athleteId != null
      ? (
          await db
            .select({
              id: athletes.id,
              name: athletes.name,
              nickname: athletes.nickname,
              displayPreference: athletes.displayPreference,
              avatarUrl: athletes.avatarUrl,
            })
            .from(athletes)
            .where(eq(athletes.id, user.athleteId))
            .limit(1)
        )[0] ?? null
      : null;

  return (
    <nav
      aria-label="Primary"
      className="grid grid-cols-3 items-center px-8 py-5 border-b border-slate-200 bg-slate-50"
    >
      <Link
        href="/"
        className="justify-self-start text-xl font-semibold tracking-tight text-stone-900"
      >
        Bedrock.fit
      </Link>

      {/* Centered nav group. Flex inside the middle grid column so the
          links cluster in the center rather than stretching across the
          whole column. */}
      <div className="justify-self-center flex items-center gap-8">
        <Link
          href="/"
          className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/results"
          className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
        >
          Race Results
        </Link>
        {/* Blog isn't built yet. Keep the button so the header locks
            in its final shape; wire the href when the route exists. */}
        <Link
          href="#"
          className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
        >
          Blog
        </Link>
      </div>

      {/* Right slot: sign-in CTA when logged out, profile button +
          sign-out when logged in. The profile button is now a chip
          containing the avatar (uploaded picture or running-hero
          placeholder) plus the display name — replaces the bare-text
          username link so it's visually obvious that clicking goes to
          the user's profile. Both signed-in/out variants keep the same
          visual weight so the header shape stays stable between
          states. */}
      {user ? (
        <div className="justify-self-end flex items-center gap-3">
          <Link
            href="/me"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 text-sm text-stone-700 hover:border-slate-300 hover:text-stone-900 transition-colors"
            title={user.email}
            aria-label="Open my profile"
          >
            <span className="overflow-hidden rounded-full w-7 h-7 flex items-center justify-center ring-1 ring-slate-200 group-hover:ring-slate-300 transition-colors">
              {athlete?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <RunningHeroAvatar size={28} bgClassName="bg-sky-100" />
              )}
            </span>
            <span className="font-medium">
              {athlete
                ? getDisplayName(athlete)
                : (user.name ?? user.email.split('@')[0])}
            </span>
          </Link>
          {/* Plain form POST — no client JS needed for sign-out. */}
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <Link
          href="/auth/sign-in"
          className="justify-self-end text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
