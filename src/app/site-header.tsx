import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

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

  return (
    <nav
      aria-label="Primary"
      className="grid grid-cols-3 items-center px-8 py-5 border-b border-stone-200 bg-stone-50"
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

      {/* Right slot: sign-in CTA when logged out, profile + sign-out
          when logged in. Both variants keep the same visual weight so
          the header shape stays stable between states. */}
      {user ? (
        <div className="justify-self-end flex items-center gap-3">
          <Link
            href="/me"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            title={user.email}
          >
            {user.name ?? user.email.split('@')[0]}
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
