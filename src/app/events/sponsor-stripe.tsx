// "Presented by" stripe rendered between the event header block and
// the event summary on /events. Hidden entirely when both the sponsor
// name and logo are missing — a URL alone is meaningless on its own.
//
// Visual goal: low-key. We want this to read as an event credit, not
// an ad. One thin row, neutral background, small logo, small text.
// The whole stripe links out when a sponsorUrl is set; otherwise it's
// a static element so we never produce a no-op clickable surface.
//
// Plain <img> matches the rest of the app's "admin-pasted external
// URL" pattern (see event-photos / event-photo-carousel) — we don't
// pre-allow arbitrary hosts in next.config remotePatterns.

interface Props {
  sponsorName: string | null;
  sponsorUrl: string | null;
  sponsorLogoUrl: string | null;
}

function trimOrNull(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export default function SponsorStripe({
  sponsorName,
  sponsorUrl,
  sponsorLogoUrl,
}: Props) {
  const name = trimOrNull(sponsorName);
  const url = trimOrNull(sponsorUrl);
  const logoUrl = trimOrNull(sponsorLogoUrl);

  // Anything to show? A standalone URL renders nothing — we don't want
  // a bare "Visit sponsor" link with no name or logo attached.
  if (!name && !logoUrl) return null;

  const inner = (
    <div className="flex items-center gap-3">
      <span className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">
        Presented by
      </span>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name ?? 'Sponsor'}
          className="h-6 w-auto object-contain"
        />
      ) : null}
      {name ? (
        <span className="text-sm font-medium text-stone-700">{name}</span>
      ) : null}
    </div>
  );

  // Linkable variant when a URL is present and at least one of name /
  // logo gave us something to wrap. `noopener noreferrer` because we
  // don't trust arbitrary external destinations.
  if (url) {
    return (
      <aside
        aria-label="Event sponsor"
        className="mb-6 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:opacity-80 transition-opacity"
        >
          {inner}
        </a>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Event sponsor"
      className="mb-6 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
    >
      {inner}
    </aside>
  );
}
