import Link from 'next/link';

// Site-wide footer rendered by the root layout. Five link groups laid
// out as columns on desktop (md+) and stacked on mobile. The hrefs are
// placeholders for routes that don't exist yet — kept as `#` so they
// won't 404 when clicked. Wire them up as the real pages ship.
//
// Server component on purpose: no interactivity, no client JS. The
// only state-aware element on chrome is the header's sign-in slot.

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
      { label: 'Privacy', href: '#' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Site"
      className="mt-auto border-t border-stone-200 bg-stone-50"
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
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="font-semibold text-stone-700">Bedrock.fit</span>
          <span>© {year} Bedrock.fit</span>
        </div>
      </div>
    </footer>
  );
}
