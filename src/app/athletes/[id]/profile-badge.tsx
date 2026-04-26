// Avatar + tier badge cluster rendered at the top of the athlete
// profile page. We don't have profile pictures, so the avatar is an
// initial-circle generated from the athlete's name — same idea as
// Gmail's. The tier ring is drawn on the avatar itself; the textual
// badge sits centered below it.
//
// Untiered athletes (no claimed races) get the plain stone avatar
// and no badge — the page should look unchanged from before tiers
// existed for them. This makes the tier feel like an earned reward
// rather than a default decoration.
//
// Server component. Pure rendering off props. Lives next to the
// page that consumes it because it has no other caller.
//
// Why a small SVG medal disc instead of an icon font / lucide glyph?
// Inline-styled fill via tier.theme.medalHex stays Tailwind-JIT-safe
// (no dynamically-built class names) and keeps the badge readable
// on any of our four palettes.

import type { Tier } from '@/lib/tiers';
import RunningHeroAvatar from '@/app/components/running-hero-avatar';

interface Props {
  name: string;
  tier: Tier | null;
  // Optional uploaded avatar. When present, rendered as a cover-fitted
  // image inside the circle; when null/empty we fall back to the
  // running-hero placeholder so every athlete has a face from day one.
  avatarUrl?: string | null;
}

function AvatarBody({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  // The presence of a non-empty avatar URL wins. Anything blank routes
  // to the running-hero placeholder — including stale empty strings
  // from a previous "remove" that didn't normalize the column.
  if (avatarUrl && avatarUrl.length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${name} profile picture`}
        className="w-full h-full object-cover"
      />
    );
  }
  return <RunningHeroAvatar size={96} bgClassName="bg-sky-100" />;
}

export default function ProfileBadge({ name, tier, avatarUrl }: Props) {
  // Untiered branch — plain stone avatar ring, no tier label below.
  // The avatar body itself is the running hero (or uploaded image), so
  // even brand-new athletes get a visual identity rather than a blank
  // initial-circle.
  if (!tier) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          aria-hidden="true"
          className="overflow-hidden flex items-center justify-center w-24 h-24 rounded-full ring-4 ring-stone-200"
        >
          <AvatarBody name={name} avatarUrl={avatarUrl} />
        </div>
      </div>
    );
  }

  // Tiered branch — ring tinted with the tier color, pill badge with
  // a medal disc and the tier label.
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        aria-hidden="true"
        className={`overflow-hidden flex items-center justify-center w-24 h-24 rounded-full ring-4 ${tier.theme.ring}`}
      >
        <AvatarBody name={name} avatarUrl={avatarUrl} />
      </div>
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ${tier.theme.badgeBg} ${tier.theme.badgeText}`}
        aria-label={`Tier: ${tier.label}`}
      >
        {/* Tiny medal disc — a filled circle with a thin inner stroke
            for a "coin" feel. Fill color is the tier's metal hex,
            applied inline so Tailwind's JIT doesn't have to enumerate
            arbitrary bg-[#…] classes. */}
        <svg
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="6" cy="6" r="5.5" style={{ fill: tier.theme.medalHex }} />
          <circle
            cx="6"
            cy="6"
            r="3.5"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.8"
          />
        </svg>
        <span>{tier.label}</span>
      </div>
    </div>
  );
}
