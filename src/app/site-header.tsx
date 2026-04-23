import Link from 'next/link';

// Top-level site chrome rendered by every page, public and admin alike.
//
// Layout is a 3-column grid: Bedrock.fit mark on the left, the nav
// links (Home / Race Results / Blog) centered in the middle, and the
// Sign In pill pinned to the right. Grid (not flex-between) keeps the
// nav column visually centered on the viewport even when the mark and
// the Sign In pill have different widths.
//
// Blog and Sign In are placeholders (href="#") — the routes don't
// exist yet. Swap the hrefs here when they do and every page picks up
// the change without touching the pages themselves.
//
// Server component: pure <Link>s, no state. Admin pages that need
// extra navigation (Claims / Import / Sign out) render their own
// secondary row below this header — SiteHeader stays identical
// everywhere so it's the one piece of chrome users learn once.

export default function SiteHeader() {
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

      {/* Sign In is the primary CTA — dark stone pill anchored right.
          Placeholder href for now; the product has no public auth
          model yet. */}
      <Link
        href="#"
        className="justify-self-end text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
      >
        Sign In
      </Link>
    </nav>
  );
}
