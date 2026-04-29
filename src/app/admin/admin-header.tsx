import Link from 'next/link';
import { adminLogout } from '@/app/actions/admin';

// Top-level chrome for every page under /admin. Replaces SiteHeader +
// the inline `<nav aria-label="Admin">` sub-nav that used to live on
// each admin page individually. Three reasons to split this out:
//
//   1. The admin experience is now visually distinct (navy chrome) so
//      operators can tell at a glance whether they're on a public page
//      or in the back office.
//   2. The four admin links ride in the *primary* nav slot rather than
//      a secondary toolbar — simpler hierarchy, one less row of UI to
//      ignore once you've internalized it.
//   3. Profile access is deliberately not exposed here. An admin who
//      wants to view their own public profile clicks the logo (which
//      goes back to the public site) — but the navy chrome makes
//      crossing that boundary a deliberate act, not an accidental
//      click on a profile chip while reviewing claims.
//
// Server component because the only dynamic bit is the active-link
// styling, which is driven by an `active` prop the page passes in.
// (We can't usePathname here without going client.) The sign-out form
// posts straight to the existing `adminLogout` server action.

const NAV_ITEMS = [
  { id: 'claims', label: 'Claims', href: '/admin' },
  { id: 'events', label: 'Events', href: '/admin/events' },
  { id: 'import', label: 'Import results', href: '/admin/import' },
] as const;

export type AdminNavId = (typeof NAV_ITEMS)[number]['id'];

interface Props {
  // Which nav item to render as the "you are here" non-link. Optional
  // so the login (pre-auth) variant can omit it entirely.
  active?: AdminNavId;
  // 'authed' shows the full nav + sign-out. 'pre-auth' is for the
  // login page — only the navy chrome and the logo, no nav (the
  // visitor isn't an admin yet) and no sign-out (no session to drop).
  variant?: 'authed' | 'pre-auth';
}

export default function AdminHeader({
  active,
  variant = 'authed',
}: Props) {
  return (
    <nav
      aria-label="Admin"
      className="grid grid-cols-3 items-center px-8 py-5 bg-blue-900 text-white border-b border-blue-950"
    >
      {/* Logo doubles as the "back to public site" affordance. We
          point at "/" rather than "/admin" so admins can return to
          the user-facing site with one click; the navy → slate
          color jolt makes the transition obvious so they know
          they've left the back office. */}
      <Link
        href="/"
        className="justify-self-start text-xl font-semibold tracking-tight text-white hover:text-blue-100 transition-colors"
      >
        Bedrock.fit
      </Link>

      {/* Center column carries the four admin destinations when the
          operator is signed in. Pre-auth renders an empty span so the
          3-column grid still balances and the logo stays left-aligned. */}
      {variant === 'authed' ? (
        <div className="justify-self-center flex items-center gap-8">
          {NAV_ITEMS.map((item) =>
            active === item.id ? (
              // "You are here" gets brighter text + a thin underline
              // so the operator can read the current page from
              // anywhere on the row. Plain span — not a link to
              // itself.
              <span
                key={item.id}
                aria-current="page"
                className="text-sm font-semibold text-white border-b-2 border-white pb-0.5"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.id}
                href={item.href}
                className="text-sm text-blue-200 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      {/* Right slot. Authed: sign-out replaces the public site's
          profile chip — explicit per-product spec, "no user-profile
          surfaces on /admin". Pre-auth: empty span keeps the grid
          aligned (no "Sign out" button when there's no session). */}
      {variant === 'authed' ? (
        <form action={adminLogout} className="justify-self-end">
          <button
            type="submit"
            className="text-sm bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign out
          </button>
        </form>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
