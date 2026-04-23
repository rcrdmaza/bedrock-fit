'use client';

// Photo gallery management. One "add" form at the top, one row per
// photo with preview + reorder + delete buttons. Each button is its
// own <form> so the server action gets clean FormData with only the
// inputs it needs.

import type { EventPhoto } from '@/lib/events';

interface Props {
  eventName: string;
  eventDate: string;
  raceCategory: string;
  photos: EventPhoto[];
  addAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  reorderAction: (formData: FormData) => void | Promise<void>;
}

export default function PhotosManager({
  eventName,
  eventDate,
  raceCategory,
  photos,
  addAction,
  deleteAction,
  reorderAction,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Add form — URL required, caption optional. Submit clears the
          form because the page re-renders after the server action's
          redirect and the inputs' defaults are empty. */}
      <form
        action={addAction}
        className="border border-stone-100 rounded-2xl p-5 space-y-3"
      >
        <input type="hidden" name="eventName" value={eventName} />
        <input type="hidden" name="eventDate" value={eventDate} />
        <input type="hidden" name="raceCategory" value={raceCategory} />
        <div>
          <label
            htmlFor="url"
            className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5"
          >
            Photo URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            placeholder="https://…/photo.jpg"
            className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
            maxLength={2000}
          />
        </div>
        <div>
          <label
            htmlFor="caption"
            className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5"
          >
            Caption (optional)
          </label>
          <input
            id="caption"
            name="caption"
            type="text"
            placeholder="Start line at 6 AM"
            maxLength={400}
            className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors font-medium"
        >
          Add photo
        </button>
      </form>

      {photos.length === 0 ? (
        <div className="text-center py-10 text-stone-400 text-sm border border-dashed border-stone-200 rounded-2xl">
          No photos yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {photos.map((p, idx) => (
            <li
              key={p.id}
              className="flex items-start gap-4 border border-stone-100 rounded-2xl p-4"
            >
              {/* Thumbnail. Plain img on purpose — URLs are arbitrary
                  external hosts, so we're not funnelling them through
                  Next.js Image. */}
              <div className="w-24 h-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption ?? `Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-900 truncate">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {p.url}
                  </a>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {p.caption ?? (
                    <span className="italic text-stone-400">(no caption)</span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Position {idx + 1} · sort {p.sortOrder}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ReorderButton
                  eventName={eventName}
                  eventDate={eventDate}
                  raceCategory={raceCategory}
                  photoId={p.id}
                  direction="up"
                  disabled={idx === 0}
                  action={reorderAction}
                />
                <ReorderButton
                  eventName={eventName}
                  eventDate={eventDate}
                  raceCategory={raceCategory}
                  photoId={p.id}
                  direction="down"
                  disabled={idx === photos.length - 1}
                  action={reorderAction}
                />
                <form action={deleteAction}>
                  <input type="hidden" name="eventName" value={eventName} />
                  <input type="hidden" name="eventDate" value={eventDate} />
                  <input
                    type="hidden"
                    name="raceCategory"
                    value={raceCategory}
                  />
                  <input type="hidden" name="photoId" value={p.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 transition-colors"
                    title="Delete photo"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReorderButton({
  eventName,
  eventDate,
  raceCategory,
  photoId,
  direction,
  disabled,
  action,
}: {
  eventName: string;
  eventDate: string;
  raceCategory: string;
  photoId: string;
  direction: 'up' | 'down';
  disabled: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="eventName" value={eventName} />
      <input type="hidden" name="eventDate" value={eventDate} />
      <input type="hidden" name="raceCategory" value={raceCategory} />
      <input type="hidden" name="photoId" value={photoId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        title={direction === 'up' ? 'Move up' : 'Move down'}
        className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded transition-colors disabled:text-stone-300 disabled:cursor-not-allowed"
      >
        {direction === 'up' ? '↑' : '↓'}
      </button>
    </form>
  );
}
