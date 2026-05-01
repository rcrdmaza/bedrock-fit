'use client';

// Sliding-pill nav rendered in the centered slot of SiteHeader.
// Replaces the previous three text links (Home / Race Results / Blog)
// with icon + label items and an animated pill that slides between
// them on hover/focus. Active item is driven by pathname so the pill
// rests on whatever route the user is currently viewing; hovering
// peeks the pill at the hovered item, releasing snaps back to the
// active one.
//
// Implementation notes:
//
//   • The pill is a single absolutely-positioned <span> behind the
//     items. We measure each item's offsetLeft + offsetWidth on
//     mount and on resize, store positions in state, and animate
//     left/width via CSS transitions. Cheaper than per-item ref
//     transforms and keeps the markup minimal.
//
//   • The pill renders at opacity-0 until measurement lands, so the
//     first paint doesn't pop a misaligned pill at (0, 0). Same trick
//     for routes that don't match any nav item — pill hides instead
//     of parking somewhere arbitrary.
//
//   • Icons are inline SVG so we pay zero bundle cost beyond the few
//     hundred bytes of path data each. Stroke-based at 1.75 weight
//     to read as "modern" without adding a dependency.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type SVGProps } from 'react';

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

interface NavItem {
  id: string;
  label: string;
  href: string;
  // Tells us whether the current pathname belongs to this section so
  // the pill can light up "Race Results" on /events or
  // /leaderboards/* even though the href is /results.
  match: (pathname: string) => boolean;
  Icon: IconComponent;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    match: (p) => p === '/',
    Icon: HomeIcon,
  },
  {
    id: 'results',
    label: 'Race Results',
    href: '/results',
    // Race Results is the umbrella for results, the public events
    // detail surface, and the per-distance leaderboards. Anything
    // under those URLs lights this slot up.
    match: (p) =>
      p === '/results' ||
      p === '/events' ||
      p.startsWith('/leaderboards'),
    Icon: StopwatchIcon,
  },
  {
    id: 'blog',
    label: 'Blog',
    href: '#',
    match: (p) => p.startsWith('/blog'),
    Icon: NotebookIcon,
  },
];

export default function HeaderNav() {
  const pathname = usePathname() ?? '';
  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(pathname));
  // hoverIndex covers both pointer hover and keyboard focus so the
  // pill follows tab navigation too — accessibility nicety with no
  // extra cost.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [positions, setPositions] = useState<
    { left: number; width: number }[]
  >([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Measure items on mount and on resize. We could use ResizeObserver
  // per-item for exhaustive coverage, but window resize is the only
  // realistic trigger here (no per-item layout-affecting state) and a
  // single listener is easier to reason about.
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const next = itemRefs.current.map((el) => {
        if (!el) return { left: 0, width: 0 };
        const r = el.getBoundingClientRect();
        return { left: r.left - containerRect.left, width: r.width };
      });
      setPositions(next);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Pill destination: hovered item wins, otherwise active route, else
  // hidden (no route match means the user is on a page like /me or
  // /privacy that doesn't belong to the primary nav).
  const targetIndex = hoverIndex ?? (activeIndex >= 0 ? activeIndex : null);
  const target =
    targetIndex != null && positions[targetIndex]?.width > 0
      ? positions[targetIndex]
      : null;

  return (
    <div
      ref={containerRef}
      className="justify-self-center relative flex items-center"
      onMouseLeave={() => setHoverIndex(null)}
    >
      {/* Sliding pill. Inset-y-1 keeps a small breathing margin top/
          bottom so the pill doesn't touch the nav row's borders. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 rounded-full bg-white shadow-sm border border-slate-200/80 transition-all duration-300 ease-out ${
          target ? 'opacity-100' : 'opacity-0'
        }`}
        style={
          target
            ? { left: `${target.left}px`, width: `${target.width}px` }
            : undefined
        }
      />

      {NAV_ITEMS.map((item, idx) => {
        const isActive = idx === activeIndex;
        const Icon = item.Icon;
        return (
          <div
            key={item.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            onMouseEnter={() => setHoverIndex(idx)}
            // The wrapping div carries the ref + hover handler so we
            // don't depend on next/link's ref forwarding behaviour.
            // The Link itself stays a standard anchor.
            className="relative z-10"
          >
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onFocus={() => setHoverIndex(idx)}
              onBlur={() => setHoverIndex(null)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                isActive
                  ? 'text-stone-900'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {/* Labels collapse on narrow viewports so the bar stays
                  compact; the icons + sliding pill carry enough
                  meaning on their own. sm and up restores them. */}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// --- icons -----------------------------------------------------------

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* House outline + door */}
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function StopwatchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Clock body, top button + side dial, hand */}
      <circle cx={12} cy={14} r={7} />
      <path d="M9 2h6" />
      <path d="M12 5V2" />
      <path d="M19 7l1.5-1.5" />
      <path d="M12 14V10" />
    </svg>
  );
}

function NotebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Document outline + folded corner + two copy lines */}
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </svg>
  );
}
