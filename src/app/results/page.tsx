import { getResults } from '@/lib/results';
import { getEventSummaries } from '@/lib/events';
import SiteHeader from '@/app/site-header';
import ResultsBrowser from './results-browser';
import {
  RESULT_SEARCH_FIELDS,
  type ResultSearchField,
} from '@/lib/results-filter';
import type { ResultsSearchInitial } from './results-search';

// Always fetch fresh data on each request — results will change as new rows
// get ingested and claimed.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Flash banner for a successful import. The commit action redirects here
// with `?imported=&created=&event=` so the admin sees a one-off
// confirmation above the results browser without needing a separate
// notifications system. Query params are stripped on the next navigation,
// which is good enough for a single-admin app. Mirrors what /admin used
// to render before the import flow was moved here.
function readImportFlash(
  params: Awaited<SearchParams>,
): { imported: number; created: number; event: string } | null {
  const importedRaw =
    typeof params.imported === 'string' ? params.imported : null;
  if (!importedRaw) return null;
  const imported = Number(importedRaw);
  const created = Number(
    typeof params.created === 'string' ? params.created : '0',
  );
  const event = typeof params.event === 'string' ? params.event : '';
  if (!Number.isFinite(imported) || imported <= 0) return null;
  return { imported, created, event };
}

// Pull the search-form initial state out of `?q=`, `?field=`, and
// `?country=`. Returns undefined when nothing is set so we don't burn
// memo cycles on an empty object. The athlete profile page links here
// with `?q=<name>&country=<country>` when an athlete has no claimed
// results, to seed the form for them.
function readResultsInitialFilter(
  params: Awaited<SearchParams>,
): ResultsSearchInitial | undefined {
  const q = typeof params.q === 'string' ? params.q : '';
  const country = typeof params.country === 'string' ? params.country : '';
  // Only accept fields we know about; anything else (typo, stale URL)
  // falls through to the component's default of "name".
  const fieldRaw = typeof params.field === 'string' ? params.field : '';
  const searchField = (RESULT_SEARCH_FIELDS as readonly string[]).includes(
    fieldRaw,
  )
    ? (fieldRaw as ResultSearchField)
    : undefined;

  if (!q && !country && !searchField) return undefined;
  return {
    query: q || undefined,
    country: country || undefined,
    searchField,
  };
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Both fetches in parallel — they hit the same table but don't
  // share a query plan, so a single round-trip is no cheaper.
  const [rows, events, params] = await Promise.all([
    getResults(),
    getEventSummaries(),
    searchParams,
  ]);

  const flash = readImportFlash(params);
  // Only the import flow sets `?view=events`; any other value (or no
  // param) falls through to the default Results tab so direct links
  // keep their old behavior.
  const defaultView = params.view === 'events' ? 'events' : 'results';
  const initialResultsFilter = readResultsInitialFilter(params);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-8 pt-16 pb-24">
        {flash && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            Imported {flash.imported} result
            {flash.imported === 1 ? '' : 's'}
            {flash.event ? ` for ${flash.event}` : ''}
            {flash.created > 0
              ? ` — created ${flash.created} new athlete${flash.created === 1 ? '' : 's'}.`
              : '.'}
          </div>
        )}

        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Find your results
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          Switch between individual results and the events they belong to.
          Filter by name, bib, event, country, distance, or date range —
          and click any column header to sort.
        </p>

        <ResultsBrowser
          rows={rows}
          events={events}
          defaultView={defaultView}
          initialResultsFilter={initialResultsFilter}
        />
      </section>
    </main>
  );
}
