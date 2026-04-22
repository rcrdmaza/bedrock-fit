import Link from 'next/link';

// Top-level site chrome rendered by every page, public and admin alike.
//
// Order is fixed per product spec: Home, Race Results, Blog, Sign In.
// Blog and Sign In are placeholders (href="#") — the routes don't exist
// yet. When they do, just swap the hrefs here and every page picks up
// the change without touching the pages themselves.
//
// Server component: pure <Link>s, no state. Admin pages that need extra
// navigation (Claims / Import / Sign out) render their own secondary
// row below this header — SiteHeader stays identical everywhere so it's
// the one piece of chrome users learn once.

export default function SiteHeader() {
  return (
    <nav
      aria-label="Primary"
      className="flex items-center justify-between px-8 py-5 border-b border-gray-100"
    >
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight text-gray-900"
      >
        Bedrock.fit
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/results"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Race Results
        </Link>
        {/* Blog isn't built yet. Keep the button so the header locks in
            its final shape; wire the href when the route exists. */}
        <Link
          href="#"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Blog
        </Link>
        {/* Sign In is the primary CTA in the header — dark pill matches
            the old home-page styling. Placeholder href for now; the
            product has no public auth model yet. */}
        <Link
          href="#"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}
