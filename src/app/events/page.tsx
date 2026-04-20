import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getEventDetail } from '@/lib/events';
import EventParticipants from './event-participants';

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

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900"
        >
          Bedrock.fit
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/results"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Search results
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        <Link
          href="/results"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <span aria-hidden="true">←</span> Back to events
        </Link>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-semibold text-gray-900">
            {detail.eventName}
          </h1>
          <span className="inline-block text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1.5 mt-2 shrink-0">
            {detail.raceCategory}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          {eventDateFormatted}
          {detail.eventCountry ? ` · ${detail.eventCountry}` : ''} ·{' '}
          {detail.total.toLocaleString()} finisher
          {detail.total === 1 ? '' : 's'}, fastest first.
          {detail.participants.length < detail.total
            ? ` Showing the top ${detail.participants.length.toLocaleString()}.`
            : ''}
        </p>

        <EventParticipants participants={detail.participants} />
      </section>
    </main>
  );
}
