// Route tab — external link to the course (Strava, Komoot, race site…)
// and an optional preview image. Either piece may be absent; the parent
// decides whether to render this tab at all based on "at least one of
// the two is set".

import type { EventMetadata } from '@/lib/events';

// Trim the protocol + www so the link label stays short ("strava.com/…"
// beats "https://www.strava.com/routes/…"). Pure cosmetic — the href
// still carries the full URL.
function prettyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
}

export default function EventRoute({ metadata }: { metadata: EventMetadata }) {
  const hasLink = !!metadata.routeUrl?.trim();
  const hasImage = !!metadata.routeImageUrl?.trim();

  return (
    <div className="space-y-6">
      {hasImage ? (
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.routeImageUrl!}
            alt={`Course map for this event`}
            className="w-full h-auto block"
          />
        </div>
      ) : null}
      {hasLink ? (
        <a
          href={metadata.routeUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View full route
          <span className="text-xs text-gray-400">
            {prettyHost(metadata.routeUrl!)}
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </div>
  );
}
