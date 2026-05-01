import Link from 'next/link';

// Left-rail nav for the back office. Surfaces the operator's
// "everyday tools" without making them hunt through bookmarks: the
// public surfaces of the site (so an admin can spot-check what
// visitors see), plus the external services we depend on (hosting,
// source, monitoring, email).
//
// Edit OPS_LINKS to point at your actual project URLs. We intentionally
// don't read these from env vars — they're rarely-changing operator
// links, and a hardcoded list keeps the rail predictable across deploys
// and visible at code-review time when someone changes them.
//
// Server component on purpose: pure data + JSX, no interactivity.
// Hidden below md so an operator on a phone doesn't lose half the
// content area to chrome — admin pages are usable on small screens
// because the rail just falls off.

interface OpsLink {
  label: string;
  href: string;
  // One-line context that shows under the label so an unfamiliar
  // operator can guess what the link goes to without clicking.
  description?: string;
}

interface OpsGroup {
  title: string;
  links: OpsLink[];
}

const GROUPS: OpsGroup[] = [
  {
    title: 'Site',
    links: [
      { label: 'Public home', href: '/', description: 'What visitors see' },
      {
        label: 'Race results',
        href: '/results',
        description: 'Public results browser',
      },
      {
        label: 'Events',
        href: '/events',
        description: 'Per-event detail view',
      },
      {
        label: 'Privacy policy',
        href: '/privacy',
        description: 'Cookie + data policy',
      },
    ],
  },
  {
    title: 'Operations',
    links: [
      {
        label: 'Railway',
        href: 'https://railway.app/dashboard',
        description: 'Hosting + Postgres',
      },
      {
        label: 'GitHub',
        href: 'https://github.com',
        description: 'Source code',
      },
      {
        label: 'Sentry',
        href: 'https://sentry.io',
        description: 'Error monitoring',
      },
      {
        label: 'Resend',
        href: 'https://resend.com/emails',
        description: 'Magic-link email delivery',
      },
    ],
  },
];

// `external` true means the link goes off-domain — we open it in a new
// tab and decorate with a small ↗ glyph. Picking by URL prefix is
// sufficient here; we don't have other "/protocol" schemes in this
// app's link surface.
function isExternal(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

export default function AdminSidebar() {
  return (
    <aside
      aria-label="Operator tools"
      // hidden md:block keeps the rail off small viewports where it
      // would crowd the content; w-56 + shrink-0 give the sidebar a
      // stable width inside the parent flex container so the section
      // beside it can use flex-1 without recomputing.
      className="hidden md:block w-56 shrink-0 px-6 pt-16 pb-24 border-r border-slate-200"
    >
      {/* sticky on the inner wrapper (rather than the aside itself)
          so it stays in view as the operator scrolls long claim
          lists, without dragging the aside's border with it. */}
      <div className="sticky top-8 space-y-8">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
              {group.title}
            </h2>
            <ul className="space-y-3">
              {group.links.map((link) => {
                const external = isExternal(link.href);
                const cls =
                  'block text-sm font-medium text-stone-800 hover:text-stone-900 transition-colors';
                return (
                  <li key={link.href}>
                    {external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cls}
                      >
                        {link.label}
                        <span
                          aria-hidden="true"
                          className="ml-1 text-stone-400"
                        >
                          ↗
                        </span>
                      </a>
                    ) : (
                      // Internal links use next/link so client-side
                      // nav stays fast on the public site.
                      <Link href={link.href} className={cls}>
                        {link.label}
                      </Link>
                    )}
                    {link.description ? (
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {link.description}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
