'use client';

// Country switcher for the home-page leaderboard. Renders a <select>
// that, on change, navigates to `/` with the new `?country=` set
// alongside the existing `?category=`. We use router.push rather than
// a plain <form action="/"> so the active <option> doesn't have to
// rely on form-default-value re-rendering — the value prop comes
// straight from the page's resolved state.
//
// Lives in its own client island because the rest of the home page is
// a server component; this is the smallest surface we can carve out.

import { useRouter } from 'next/navigation';

export default function LeaderboardCountrySelect({
  countries,
  active,
  category,
}: {
  countries: string[];
  // Empty string when "All countries" is selected. The home page
  // resolves the URL ?country= once on render and passes it down.
  active: string;
  // Current category — preserved across country changes so the user's
  // distance choice survives the click.
  category: string;
}) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-xs text-stone-500">
      <span>Country</span>
      <select
        value={active}
        onChange={(e) => {
          const next = new URLSearchParams();
          next.set('category', category);
          if (e.target.value) next.set('country', e.target.value);
          router.push(`/?${next.toString()}`);
        }}
        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
