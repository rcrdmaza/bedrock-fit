import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getEventDetail } from '@/lib/events';
import SiteHeader from '@/app/site-header';
import EventParticipants from './event-participants';
import EventTabs, { type EventTab } from './event-tabs';
import EventRoute from './event-route';
import EventPhotos from './event-photos';
import SponsorStripe from './sponsor-stripe';

// Event participant lists change when new rows are imported or claims
// resolve — no caching here.
export const dynamic = 'force-dynamic';

// Next 16: searchParams arrives as a Promise on every page.
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Pick the first scalar value — Next hands us string | string[] depending
// on whether the param appears once or multiple times in the URL.
function first(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

// Glue the location pieces together with middle dots, dropping any that
// are null/blank. Returns null when nothing is set so the caller can
// decide whether to render the subline at all.
function formatLocation(
  city: string | null,
  district: string | null,
  country: string | null,
): string | null {
  const parts = [city, district, country]
    .map((p) => p?.trim())
    .filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default async function EventDetailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const name = first(sp.name);
  const date = first(sp.date);
  const category = first(sp.category);

  // Bare /events (no params) — the events listing lives on /results
  // behind the toggle, so send the user there rather than 404ing. This
  // also makes /events safe to bookmark as "the events page".
  if (!name && !date && !category) redirect('/results');

  // Partial params means a hand-edited URL — those we 404 on, because
  // there's no sensible listing to fall back to for a half-specified event.
  if (!name || !date || !category) notFound();

  const detail = await getEventDetail(name, date, category);
  if (!detail) notFound();

  const eventDateFormatted = new Date(detail.eventDate).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  // Build the location subline from curated metadata first. Fall back
  // to the country that came through the results table — that's always
  // present if we've got a country at all, per getEventDetail's
  // coalescing logic.
  const locationLine =
    formatLocation(
      detail.metadata?.city ?? null,
      detail.metadata?.district ?? null,
      detail.metadata?.country ?? detail.eventCountry,
    );

  // Tab visibility per the "hide empty sections" rule — build the list
  // only from tabs with content. Results is always present (a detail
  // page with no participants 404'd earlier), so it's the anchor.
  const tabs: EventTab[] = [
    {
      id: 'results',
      label: 'Results',
      content: <EventParticipants participants={detail.participants} />,
    },
  ];
  const hasRoute =
    !!detail.metadata?.routeUrl?.trim() ||
    !!detail.metadata?.routeImageUrl?.trim();
  if (hasRoute && detail.metadata) {
    tabs.push({
      id: 'route',
      label: 'Route',
      content: <EventRoute metadata={detail.metadata} />,
    });
  }
  if (detail.photos.length > 0) {
    tabs.push({
      id: 'photos',
      label: 'Photos',
      content: <EventPhotos photos={detail.photos} />,
    });
  }

  const summary = detail.metadata?.summary?.trim() ?? '';

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <Link
          href="/results"
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <span aria-hidden="true">←</span> Back to events
        </Link>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-semibold text-stone-900">
            {detail.eventName}
          </h1>
          <span className="inline-block text-xs font-medium text-stone-700 bg-slate-100 rounded-full px-3 py-1.5 mt-2 shrink-0">
            {detail.raceCategory}
          </span>
        </div>
        {locationLine ? (
          <p className="text-sm text-stone-600 mb-1">{locationLine}</p>
        ) : null}
        <p className="text-stone-500 text-sm mb-8">
          {eventDateFormatted} · {detail.total.toLocaleString()} finisher
          {detail.total === 1 ? '' : 's'}, fastest first.
          {detail.participants.length < detail.total
            ? ` Showing the top ${detail.participants.length.toLocaleString()}.`
            : ''}
        </p>

        <SponsorStripe
          sponsorName={detail.metadata?.sponsorName ?? null}
          sponsorUrl={detail.metadata?.sponsorUrl ?? null}
          sponsorLogoUrl={detail.metadata?.sponsorLogoUrl ?? null}
        />

        {summary ? (
          <section aria-label="Event summary" className="mb-10">
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </section>
        ) : null}

        <EventTabs tabs={tabs} />
      </section>
    </main>
  );
}
