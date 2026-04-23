// Photos tab — simple responsive gallery. URLs only (admin-pasted, not
// uploaded), so we can't rely on Next.js Image optimization; plain
// <img> keeps it simple and avoids allowing arbitrary remote hosts in
// next.config.

import type { EventPhoto } from '@/lib/events';

export default function EventPhotos({ photos }: { photos: EventPhoto[] }) {
  // Defensive — parent should only render this tab when photos.length > 0,
  // but a concurrent delete could strand us here with an empty array.
  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400 text-sm">
        No photos yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 group"
        >
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? 'Event photo'}
              loading="lazy"
              className="w-full h-56 object-cover group-hover:opacity-95 transition-opacity"
            />
          </a>
          {photo.caption ? (
            <figcaption className="px-4 py-3 text-xs text-stone-500">
              {photo.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
