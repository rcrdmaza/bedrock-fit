import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AdminHeader from '@/app/admin/admin-header';
import { getEventDetail, getEventMetadata } from '@/lib/events';
import {
  addEventPhoto,
  deleteEventPhoto,
  reorderEventPhoto,
  upsertEventMetadata,
} from '@/app/actions/events';
import {
  canEditEventMetadata,
  findEventMetadataByTriple,
  requireOrgOrAdmin,
} from '@/lib/org';
import EventEditForm from './event-edit-form';
import PhotosManager from './photos-manager';

// Always render fresh — mutations (upsert, photo add/remove) redirect
// here so the new state has to be on the page when we arrive.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

export default async function EditEventMetadataPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await requireOrgOrAdmin();
  const sp = await searchParams;
  const name = first(sp.name);
  const date = first(sp.date);
  const category = first(sp.category);

  // Partial or missing identity → no valid event to edit. Sending the
  // admin back to the listing is friendlier than 404, but we don't
  // silently invent an event either.
  if (!name || !date || !category) notFound();

  // Detail fetch confirms the event is real (has finishers). We don't
  // want the admin to be able to hand-craft a URL for an event that
  // never existed and create orphan metadata rows.
  const detail = await getEventDetail(name, date, category);
  if (!detail) notFound();

  // Org-scoping guard. If a metadata row exists, the caller must be
  // allowed to act on it (admin god-mode, or member of the owning org).
  // If no row exists yet, only admin (god-mode) and org members get
  // here — both can author the first metadata row, with the org
  // member's row stamped to their org by the upsert action.
  const triple = await findEventMetadataByTriple({
    eventName: name,
    eventDate: new Date(date),
    raceCategory: category,
  });
  if (triple && !canEditEventMetadata(ctx, triple.ownerOrgId)) {
    redirect('/admin/events?error=forbidden');
  }

  // Metadata may not exist yet — the form renders blanks in that case.
  const md = await getEventMetadata(name, date, category);
  const metadata = md?.metadata ?? null;
  const photos = md?.photos ?? [];

  const flash = readFlash(sp);

  const eventDateFormatted = new Date(detail.eventDate).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  const publicHref = `/events?${new URLSearchParams({
    name,
    date,
    category,
  }).toString()}`;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Edit lives under /admin/events/* — keep that nav slot lit. */}
      <AdminHeader active="events" />

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <span aria-hidden="true">←</span> All events
        </Link>

        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-3xl font-semibold text-stone-900">
            {detail.eventName}
          </h1>
          <span className="inline-block text-xs font-medium text-stone-700 bg-slate-100 rounded-full px-3 py-1.5 mt-2 shrink-0">
            {detail.raceCategory}
          </span>
        </div>
        <p className="text-sm text-stone-500 mb-2">
          {eventDateFormatted} · {detail.total.toLocaleString()} finisher
          {detail.total === 1 ? '' : 's'}
        </p>
        <Link
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors mb-8"
        >
          View public event page ↗
        </Link>

        {flash ? (
          <div
            className={`mb-6 rounded-2xl border px-5 py-3 text-sm ${
              flash.tone === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {flash.message}
          </div>
        ) : null}

        <EventEditForm
          eventName={name}
          eventDate={date}
          raceCategory={category}
          metadata={metadata}
          upsertAction={upsertEventMetadata}
        />

        <div className="mt-12 border-t border-slate-100 pt-10">
          <h2 className="text-xl font-semibold text-stone-900 mb-1">
            Photos
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            URLs only — paste links to images hosted elsewhere. New photos
            land at the end; use ↑ and ↓ to reorder.
          </p>
          <PhotosManager
            eventName={name}
            eventDate={date}
            raceCategory={category}
            photos={photos}
            addAction={addEventPhoto}
            deleteAction={deleteEventPhoto}
            reorderAction={reorderEventPhoto}
          />
        </div>
      </section>
    </main>
  );
}

// One-shot banner parsing. Query params are rewritten on redirect by the
// server actions; we read whichever one is set to pick the message.
function readFlash(
  params: Awaited<SearchParams>,
): { tone: 'ok' | 'warn'; message: string } | null {
  if (params.saved === '1')
    return { tone: 'ok', message: 'Metadata saved.' };
  if (params.photoAdded === '1')
    return { tone: 'ok', message: 'Photo added.' };
  if (params.photoRemoved === '1')
    return { tone: 'ok', message: 'Photo removed.' };
  if (params.photoMoved === '1')
    return { tone: 'ok', message: 'Photo moved.' };
  if (params.photoError === 'missingUrl')
    // Legacy code path — kept so a stale form post that still uses
    // the old query name renders a coherent message rather than
    // falling through to a silent no-op.
    return { tone: 'warn', message: 'Photo URL is required.' };
  if (params.photoError === 'missingPhoto')
    return {
      tone: 'warn',
      message: 'Choose a file to upload or paste a photo URL.',
    };
  if (params.photoError === 'fileTooLarge')
    return {
      tone: 'warn',
      message: 'That image is too large. Use one under 2 MB.',
    };
  if (params.photoError === 'fileWrongType')
    return {
      tone: 'warn',
      message: 'Image must be a PNG, JPEG, WebP, or GIF.',
    };
  if (params.photoError === 'fileEmpty')
    return { tone: 'warn', message: 'The selected file was empty.' };
  return null;
}
