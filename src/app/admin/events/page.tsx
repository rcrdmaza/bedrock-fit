import Link from 'next/link';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { eventMetadata, eventPhotos } from '@/db/schema';
import SiteHeader from '@/app/site-header';
import { adminLogout } from '@/app/actions/admin';
import { getEventSummaries } from '@/lib/events';
import { requireOrgOrAdmin, type AdminOrOrg } from '@/lib/org';

// Admin list of every event with "is metadata filled?" and "how many
// photos?" badges. Behind requireAdmin() — no soft-open for unauth.
export const dynamic = 'force-dynamic';

// Pull a lightweight status map — one row per event that has a
// metadata record, carrying which sections are filled + photo count.
// The event list comes from getEventSummaries() (the public query);
// this supplements it with admin-only signals.
interface MetadataStatus {
  eventName: string;
  // ISO date string — matched against summary.eventDate (also ISO).
  eventDate: string;
  raceCategory: string;
  hasLocation: boolean;
  hasSummary: boolean;
  hasRoute: boolean;
  photoCount: number;
}

async function getMetadataStatus(
  ctx: AdminOrOrg,
): Promise<MetadataStatus[]> {
  // LEFT JOIN + count(photos) in a single roundtrip keeps us from doing
  // N+1 lookups per event. NULL-safe comparisons on text fields use
  // `is not null AND length(trim(...)) > 0` so whitespace-only values
  // don't count as "filled".
  //
  // Org-scoping: when the caller is a non-admin org member, narrow to
  // metadata rows owned by their org. Legacy admin (god-mode) sees all.
  const baseQuery = db
    .select({
      eventName: eventMetadata.eventName,
      eventDate: eventMetadata.eventDate,
      raceCategory: eventMetadata.raceCategory,
      hasLocation: sql<boolean>`(
        coalesce(length(trim(${eventMetadata.city})), 0) > 0
        OR coalesce(length(trim(${eventMetadata.district})), 0) > 0
        OR coalesce(length(trim(${eventMetadata.country})), 0) > 0
      )`,
      hasSummary: sql<boolean>`coalesce(length(trim(${eventMetadata.summary})), 0) > 0`,
      hasRoute: sql<boolean>`(
        coalesce(length(trim(${eventMetadata.routeUrl})), 0) > 0
        OR coalesce(length(trim(${eventMetadata.routeImageUrl})), 0) > 0
      )`,
      photoCount: sql<number>`count(${eventPhotos.id})::int`,
    })
    .from(eventMetadata)
    .leftJoin(
      eventPhotos,
      sql`${eventPhotos.eventMetadataId} = ${eventMetadata.id}`,
    );

  const filtered =
    ctx.kind === 'org'
      ? baseQuery.where(eq(eventMetadata.ownerOrgId, ctx.membership.org.id))
      : baseQuery;

  const rows = await filtered.groupBy(
    eventMetadata.id,
    eventMetadata.eventName,
    eventMetadata.eventDate,
    eventMetadata.raceCategory,
  );

  return rows.map((r) => ({
    eventName: r.eventName,
    eventDate: (r.eventDate ?? new Date()).toISOString(),
    raceCategory: r.raceCategory,
    hasLocation: r.hasLocation,
    hasSummary: r.hasSummary,
    hasRoute: r.hasRoute,
    photoCount: r.photoCount,
  }));
}

function statusKey(
  eventName: string,
  eventDate: string,
  raceCategory: string,
): string {
  return `${eventName}|${eventDate}|${raceCategory}`;
}

export default async function AdminEventsPage() {
  const ctx = await requireOrgOrAdmin();

  const [allEvents, status] = await Promise.all([
    getEventSummaries(),
    getMetadataStatus(ctx),
  ]);

  const statusMap = new Map<string, MetadataStatus>();
  for (const s of status) {
    statusMap.set(statusKey(s.eventName, s.eventDate, s.raceCategory), s);
  }

  // Legacy admin sees every event from getEventSummaries(). Org members
  // only see events whose metadata-keyed status row exists in scope —
  // i.e. events their org has curated or imported. Filter here so the
  // table doesn't show events the caller can't act on anyway.
  const events =
    ctx.kind === 'admin'
      ? allEvents
      : allEvents.filter((ev) =>
          statusMap.has(statusKey(ev.eventName, ev.eventDate, ev.raceCategory)),
        );

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <nav
        aria-label="Admin"
        className="flex items-center justify-end gap-5 px-8 py-3 border-b border-slate-100 bg-slate-50"
      >
        <Link
          href="/admin"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Claims
        </Link>
        <span className="text-sm text-stone-900 font-medium">Events</span>
        <Link
          href="/admin/import"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Import results
        </Link>
        <Link
          href="/admin/org"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Org
        </Link>
        <form action={adminLogout}>
          <button
            type="submit"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>

      <section className="max-w-4xl mx-auto px-8 pt-16 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-stone-900 mb-1">
            Event metadata
          </h1>
          <p className="text-sm text-stone-500">
            {events.length === 0
              ? 'No events on file yet — import results first.'
              : `${events.length} event${events.length === 1 ? '' : 's'}. Click one to edit its summary, location, route, and photos.`}
          </p>
        </div>

        {events.length === 0 ? null : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Event</th>
                  <th className="text-left font-medium px-5 py-3">Category</th>
                  <th className="text-left font-medium px-5 py-3">Date</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const st = statusMap.get(
                    statusKey(ev.eventName, ev.eventDate, ev.raceCategory),
                  );
                  const editHref = `/admin/events/edit?${new URLSearchParams(
                    {
                      name: ev.eventName,
                      date: ev.eventDate,
                      category: ev.raceCategory,
                    },
                  ).toString()}`;
                  return (
                    <tr
                      key={ev.key}
                      className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3 text-stone-900">
                        {ev.eventName}
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {ev.raceCategory}
                      </td>
                      <td className="px-5 py-3 text-stone-600 tabular-nums">
                        {new Date(ev.eventDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadges status={st ?? null} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={editHref}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

// Tiny chips summarizing which sections have content. Null status =
// no metadata row at all yet — render a single "empty" chip.
function StatusBadges({ status }: { status: MetadataStatus | null }) {
  if (!status) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-stone-500 font-medium">
        Empty
      </span>
    );
  }

  const chips: { label: string; on: boolean }[] = [
    { label: 'Location', on: status.hasLocation },
    { label: 'Summary', on: status.hasSummary },
    { label: 'Route', on: status.hasRoute },
    { label: `Photos · ${status.photoCount}`, on: status.photoCount > 0 },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`text-[11px] px-2 py-1 rounded-full font-medium ${
            c.on
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-stone-500'
          }`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
