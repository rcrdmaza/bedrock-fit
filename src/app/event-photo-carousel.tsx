'use client';

// Home-page vertical carousel — one cover photo per recent event,
// advanced with ↑/↓ buttons. Renders nothing when there are no photos
// so the leaderboard slides up into the fold on brand-new installs.
//
// URLs are admin-pasted, so we use a plain <img> for the same reason
// as the event photos grid (no whitelist in next.config). See
// /events/event-photos.tsx for the same pattern.

import { useState } from 'react';
import Link from 'next/link';
import type { LatestEventPhoto } from '@/lib/events';

function eventHref(p: LatestEventPhoto): string {
  const qs = new URLSearchParams({
    name: p.eventName,
    date: p.eventDate,
    category: p.raceCategory,
  });
  return `/events?${qs.toString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function EventPhotoCarousel({
  photos,
}: {
  photos: LatestEventPhoto[];
}) {
  // Hook order must be stable — declare before any early return.
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;

  // Wrap both directions so the nav never lands on a disabled state.
  // At length 1 both arrows are effectively no-ops; we disable them
  // visually rather than hide, so the chrome doesn't shift.
  const total = photos.length;
  const step = (delta: number) => setIdx((i) => (i + delta + total) % total);
  const current = photos[idx];
  const disabled = total <= 1;

  return (
    <section aria-label="Recent event photos" className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide">
          Recent events
        </h2>
        <span className="text-xs text-stone-400 tabular-nums">
          {idx + 1} / {total}
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-stone-100 bg-stone-50">
        <Link href={eventHref(current)} className="block group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.photoUrl}
            src={current.photoUrl}
            alt={current.caption ?? `${current.eventName} photo`}
            loading="lazy"
            className="w-full h-96 object-cover group-hover:opacity-95 transition-opacity"
          />

          {/* Gradient + caption overlay at the bottom of the photo so
              the event name stays readable over bright images. */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 pt-16 pb-5 text-white">
            <div className="text-lg font-semibold">{current.eventName}</div>
            <div className="text-xs text-white/80 mt-0.5">
              {formatDate(current.eventDate)} · {current.raceCategory}
            </div>
            {current.caption ? (
              <div className="text-xs text-white/70 mt-1.5 line-clamp-2">
                {current.caption}
              </div>
            ) : null}
          </div>
        </Link>

        {/* Up/down arrows stacked on the right side of the photo so
            they don't cover the caption. Disabled styling when there's
            only one photo keeps the chrome consistent. */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            type="button"
            aria-label="Previous event"
            onClick={() => step(-1)}
            disabled={disabled}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-sm flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true" className="text-base leading-none">↑</span>
          </button>
          <button
            type="button"
            aria-label="Next event"
            onClick={() => step(1)}
            disabled={disabled}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-sm flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true" className="text-base leading-none">↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}
