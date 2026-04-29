'use server';

// Server actions backing /admin/events/edit — upsert curated metadata
// for one event, plus add / remove / reorder photo URLs in the gallery.
// Every action guards with requireAdmin() and bumps the public caches
// for the event detail page so a fresh read shows the change on next
// navigation.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { eventMetadata, eventPhotos } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { validateEventPhotoFile } from '@/lib/event-photo';

// Reasonable upper bounds so a stray paste or an attacker poking the
// form can't dump unbounded text into the DB. Summary is generous
// because admins might paste a full race recap; URLs stay short.
const LIMITS = {
  city: 120,
  district: 120,
  country: 120,
  summary: 8000,
  url: 2000,
  caption: 400,
  sponsorName: 200,
} as const;

// Trim + clamp, treating "" and whitespace as null so "clear this field"
// actually clears it instead of writing an empty string.
function str(
  formData: FormData,
  key: string,
  max: number,
): string | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, max);
}

// The identity triple for an event. All three are required; a missing
// one means a malformed URL / hidden input and we silently bail — the
// admin shouldn't land here from a normal flow.
interface EventKey {
  eventName: string;
  eventDate: Date;
  raceCategory: string;
}

function readEventKey(formData: FormData): EventKey | null {
  const name = str(formData, 'eventName', 500);
  const dateIso = str(formData, 'eventDate', 100);
  const category = str(formData, 'raceCategory', 200);
  if (!name || !dateIso || !category) return null;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  return { eventName: name, eventDate: date, raceCategory: category };
}

// Build the /events?name=...&date=...&category=... URL for the public
// detail page. Used when the admin form finishes and we want to bounce
// them back to the live page to see their edits.
function eventHref(key: EventKey): string {
  const params = new URLSearchParams({
    name: key.eventName,
    date: key.eventDate.toISOString(),
    category: key.raceCategory,
  });
  return `/events?${params.toString()}`;
}

// Same, but for the admin edit route so we can redirect back to the
// form after a photo mutation (the edit page re-renders with the fresh
// list).
function editHref(key: EventKey): string {
  const params = new URLSearchParams({
    name: key.eventName,
    date: key.eventDate.toISOString(),
    category: key.raceCategory,
  });
  return `/admin/events/edit?${params.toString()}`;
}

// Revalidate the paths that render event metadata. /results lists the
// event (but metadata doesn't leak into that card), /events is the
// detail page (this is the important one), and /admin/events is the
// admin list. Keep this tight — over-invalidation here is cheap but
// worth paying attention to.
function bustEventCaches() {
  revalidatePath('/events');
  revalidatePath('/admin/events');
  revalidatePath('/admin/events/edit');
}

// Look up the existing metadata row's id (if any). Pre-org-removal we
// also pulled owner_org_id here for scope checks; with the org system
// archived, the legacy admin password is the only gate, so we just
// need the row id to know whether we're inserting or updating.
async function findMetadataId(
  key: EventKey,
): Promise<string | null> {
  const rows = await db
    .select({ id: eventMetadata.id })
    .from(eventMetadata)
    .where(
      and(
        eq(eventMetadata.eventName, key.eventName),
        eq(eventMetadata.eventDate, key.eventDate),
        eq(eventMetadata.raceCategory, key.raceCategory),
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

// Upsert one metadata row keyed by the identity triple. Relies on the
// unique constraint `event_metadata_triple_key` defined on the schema
// so ON CONFLICT DO UPDATE lands on the same row every time.
//
// We never delete a metadata row from the UI — clearing every field
// leaves the row with nulls, which renders as "no metadata" in the UI
// the same as a missing row. The row itself anchors photo rows via the
// FK, so deleting it would cascade the gallery away.
//
// owner_org_id is left NULL on insert and untouched on conflict — the
// column hangs around for a future revival of multi-tenancy
// (see archiv3ed/README.md) but plays no role today.
export async function upsertEventMetadata(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = readEventKey(formData);
  if (!key) return;

  const payload = {
    eventName: key.eventName,
    eventDate: key.eventDate,
    raceCategory: key.raceCategory,
    city: str(formData, 'city', LIMITS.city),
    district: str(formData, 'district', LIMITS.district),
    country: str(formData, 'country', LIMITS.country),
    summary: str(formData, 'summary', LIMITS.summary),
    routeUrl: str(formData, 'routeUrl', LIMITS.url),
    routeImageUrl: str(formData, 'routeImageUrl', LIMITS.url),
    sponsorName: str(formData, 'sponsorName', LIMITS.sponsorName),
    sponsorUrl: str(formData, 'sponsorUrl', LIMITS.url),
    sponsorLogoUrl: str(formData, 'sponsorLogoUrl', LIMITS.url),
    updatedAt: new Date(),
  };

  await db
    .insert(eventMetadata)
    .values(payload)
    .onConflictDoUpdate({
      target: [
        eventMetadata.eventName,
        eventMetadata.eventDate,
        eventMetadata.raceCategory,
      ],
      set: {
        city: payload.city,
        district: payload.district,
        country: payload.country,
        summary: payload.summary,
        routeUrl: payload.routeUrl,
        routeImageUrl: payload.routeImageUrl,
        sponsorName: payload.sponsorName,
        sponsorUrl: payload.sponsorUrl,
        sponsorLogoUrl: payload.sponsorLogoUrl,
        updatedAt: payload.updatedAt,
      },
    });

  bustEventCaches();
  // Kick the admin back to the edit page so they can keep iterating or
  // jump to the public page from there. A toast-ish "saved" flag rides
  // on the query so the form can acknowledge.
  redirect(`${editHref(key)}&saved=1`);
}

// Look up (or create) the metadata row for this event, returning its id.
// Photos hang off a metadata row, so adding a photo to an event that
// has no metadata yet needs a placeholder row. We bootstrap one with
// nothing but the identity triple set; the admin can fill the rest
// later.
async function ensureMetadataId(key: EventKey): Promise<string> {
  const existingId = await findMetadataId(key);
  if (existingId) return existingId;

  const inserted = await db
    .insert(eventMetadata)
    .values({
      eventName: key.eventName,
      eventDate: key.eventDate,
      raceCategory: key.raceCategory,
    })
    .returning({ id: eventMetadata.id });
  return inserted[0]!.id;
}

// Next sort slot = (MAX(sort_order) + 1). Keeps the ordering dense-ish
// without a full renumbering pass, and ensures new photos land at the
// end of the gallery.
async function nextSortOrder(metadataId: string): Promise<number> {
  const row = await db
    .select({
      max: sql<number | null>`max(${eventPhotos.sortOrder})`,
    })
    .from(eventPhotos)
    .where(eq(eventPhotos.eventMetadataId, metadataId));
  const current = row[0]?.max;
  return (current ?? -1) + 1;
}

export async function addEventPhoto(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = readEventKey(formData);
  if (!key) return;

  // Two routes into the `url` we'll persist:
  //   1. A real File upload — we validate + base64-encode it into a
  //      data URL. This is the new path that powers "drag a photo in".
  //   2. A pasted URL — same as before, the legacy path. Kept so the
  //      admin can still link to a Cloudinary/CDN image without
  //      pulling the bytes through our server.
  // If both are supplied, the file wins because the user explicitly
  // chose to upload — pasting plus dragging usually means they
  // changed their mind mid-form and the file is the latest intent.
  const photoRaw = formData.get('photo');
  const photoFile =
    photoRaw instanceof File && photoRaw.size > 0 ? photoRaw : null;

  let url: string | null = null;
  if (photoFile) {
    const result = await validateEventPhotoFile(photoFile);
    if (!result.ok) {
      // The validator returns a stable error code; we round-trip it
      // through the URL so /admin/events/edit can render a useful
      // banner instead of a generic failure.
      redirect(`${editHref(key)}&photoError=${result.error}`);
    }
    url = result.dataUrl;
  } else {
    url = str(formData, 'url', LIMITS.url);
  }

  if (!url) {
    // Neither a file nor a URL — nothing to add.
    redirect(`${editHref(key)}&photoError=missingPhoto`);
  }
  const caption = str(formData, 'caption', LIMITS.caption);

  const metadataId = await ensureMetadataId(key);
  const sortOrder = await nextSortOrder(metadataId);

  await db.insert(eventPhotos).values({
    eventMetadataId: metadataId,
    url,
    caption,
    sortOrder,
  });

  bustEventCaches();
  redirect(`${editHref(key)}&photoAdded=1`);
}

export async function deleteEventPhoto(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = readEventKey(formData);
  if (!key) return;
  const photoId = str(formData, 'photoId', 100);
  if (!photoId) return;

  // The (photoId, metadataId) pair on the WHERE clause keeps us from
  // deleting a photo that belongs to a different event by guessing
  // its id.
  const metadataId = await findMetadataId(key);
  if (!metadataId) return;

  await db
    .delete(eventPhotos)
    .where(
      and(
        eq(eventPhotos.id, photoId),
        eq(eventPhotos.eventMetadataId, metadataId),
      ),
    );

  bustEventCaches();
  redirect(`${editHref(key)}&photoRemoved=1`);
}

// Swap sortOrder with the neighbor in the chosen direction. Simpler
// than dense renumbering and preserves the admin's existing ordering.
// If the photo is already at the edge, this is a no-op.
export async function reorderEventPhoto(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = readEventKey(formData);
  if (!key) return;
  const photoId = str(formData, 'photoId', 100);
  const direction = str(formData, 'direction', 10);
  if (!photoId || (direction !== 'up' && direction !== 'down')) return;

  const metadataId = await findMetadataId(key);
  if (!metadataId) return;

  const gallery = await db
    .select({
      id: eventPhotos.id,
      sortOrder: eventPhotos.sortOrder,
    })
    .from(eventPhotos)
    .where(eq(eventPhotos.eventMetadataId, metadataId))
    .orderBy(asc(eventPhotos.sortOrder), asc(eventPhotos.createdAt));

  const idx = gallery.findIndex((p) => p.id === photoId);
  if (idx === -1) return;
  const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (neighborIdx < 0 || neighborIdx >= gallery.length) {
    // Already at the edge — render the page again so the "moved" flag
    // can be absent.
    redirect(editHref(key));
  }

  const self = gallery[idx];
  const other = gallery[neighborIdx];

  // Two-step swap with a sentinel because the unique-ish ordering
  // isn't enforced by a constraint, but we still want the intermediate
  // state to be unambiguous if another request races us.
  await db.transaction(async (tx) => {
    await tx
      .update(eventPhotos)
      .set({ sortOrder: -1 })
      .where(eq(eventPhotos.id, self.id));
    await tx
      .update(eventPhotos)
      .set({ sortOrder: self.sortOrder })
      .where(eq(eventPhotos.id, other.id));
    await tx
      .update(eventPhotos)
      .set({ sortOrder: other.sortOrder })
      .where(eq(eventPhotos.id, self.id));
  });

  bustEventCaches();
  redirect(`${editHref(key)}&photoMoved=1`);
}

export async function redirectToEventPage(formData: FormData): Promise<void> {
  // Read-only: gate on admin so this isn't an open redirect.
  await requireAdmin();
  const key = readEventKey(formData);
  if (!key) return;
  redirect(eventHref(key));
}
