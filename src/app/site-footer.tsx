import Link from 'next/link';
import CookiePrefsLink from './cookie-prefs-link';

// Site-wide footer rendered by the root layout. Five link groups laid
// out as columns on desktop (md+) and stacked on mobile. The hrefs are
// placeholders for routes that don't exist yet — kept as `#` so they
// won't 404 when clicked. Wire them up as the real pages ship.
//
// Server component on purpose: the only client-island here is the
// "Cookie preferences" link, which dispatches a custom event to
// re-open the consent banner.

interface FooterLink {
  label: string;
  href: string;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

const groups: FooterGroup[] = [
  {
    title: 'About us',
    links: [
      { label: 'Our story', href: '#' },
      { label: 'Team', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'Email us', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'Twitter', href: '#' },
      { label: 'Instagram', href: '#' },
    ],
  },
  {
    title: 'Blog',
    links: [
      { label: 'Latest posts', href: '#' },
      { label: 'Training', href: '#' },
      { label: 'Race recaps', href: '#' },
      { label: 'Stories', href: '#' },
    ],
  },
  {
    title: 'Race results',
    links: [
      { label: 'All results', href: '/results' },
      { label: 'Recent events', href: '/results?view=events' },
      { label: 'Leaderboards', href: '/leaderboards' },
      { label: 'Submit a race', href: '#' },
    ],
  },
  {
    title: 'Sign in',
    links: [
      { label: 'Sign in', href: '/auth/sign-in' },
      { label: 'Create account', href: '/auth/sign-in' },
      { label: 'Your profile', href: '/me' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Site"
      className="mt-auto border-t border-slate-200 bg-slate-50"
    >
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-stone-900 mb-3">
                {group.title}
              </h2>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {/* The "Cookie preferences" link is a tiny client island
                    that re-opens the consent banner. We anchor it under
                    "Sign in" since that's where Privacy lives — keeps
                    all the policy/preferences affordances in one column. */}
                {group.title === 'Sign in' ? (
                  <li>
                    <CookiePrefsLink className="text-sm text-stone-500 hover:text-stone-900 transition-colors cursor-pointer" />
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-stone-500">
          <span className="font-semibold text-stone-700">Bedrock.fit</span>
          <span>© {year} Bedrock.fit</span>
        </div>
      </div>
    </footer>
  );
}
