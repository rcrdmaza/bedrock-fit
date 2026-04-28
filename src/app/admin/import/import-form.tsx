'use client';

import { useActionState } from 'react';
import {
  commitImport,
  previewImport,
  type CommitState,
  type PreviewState,
} from '@/app/actions/import';

const PREVIEW_INITIAL: PreviewState = { status: 'idle' };
const COMMIT_INITIAL: CommitState = { status: 'idle' };

// How many rows of each list to show before collapsing. The preview is a
// sanity check, not a spreadsheet viewer — beyond ~20 rows the admin
// should trust the totals and scan spot checks.
const ROW_SAMPLE = 10;
const MATCH_SAMPLE = 20;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ImportForm() {
  const [previewState, previewAction, previewPending] = useActionState(
    previewImport,
    PREVIEW_INITIAL,
  );

  if (previewState.status === 'preview') {
    return <PreviewStep preview={previewState} />;
  }

  return (
    <form action={previewAction} className="space-y-6">
      <div>
        <label
          htmlFor="eventName"
          className="block text-xs text-stone-500 mb-1"
        >
          Event name
        </label>
        <input
          id="eventName"
          name="eventName"
          type="text"
          required
          maxLength={200}
          placeholder="Lima Marathon 2026"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="eventDate"
          className="block text-xs text-stone-500 mb-1"
        >
          Event date
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="csvFile" className="block text-xs text-stone-500 mb-1">
          Finisher CSV
        </label>
        <input
          id="csvFile"
          name="csvFile"
          type="file"
          accept=".csv,text/csv"
          required
          className="w-full text-sm text-stone-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-stone-700 hover:file:bg-slate-200"
        />
        <p className="mt-2 text-xs text-stone-400">
          Columns, in order:{' '}
          <code className="px-1 py-0.5 rounded bg-slate-100 text-stone-700">
            name, finish_time, overall_rank, gender, location, race_category
          </code>
          {', optionally followed by '}
          <code className="px-1 py-0.5 rounded bg-slate-100 text-stone-700">
            bib
          </code>{' '}
          and{' '}
          <code className="px-1 py-0.5 rounded bg-slate-100 text-stone-700">
            event_country
          </code>
          . Finish time as <code>H:MM:SS</code> or <code>MM:SS</code>.
          <code>race_category</code> may be blank or one of{' '}
          <code>5K</code>, <code>10K</code>, <code>Half Marathon</code>,{' '}
          <code>Marathon</code> — mix distances in the same file to import
          every field of a multi-distance event at once.
        </p>
      </div>

      {previewState.status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 space-y-2">
          <p className="font-medium">{previewState.error}</p>
          {previewState.rowErrors && previewState.rowErrors.length > 0 && (
            <ul className="list-disc pl-4 space-y-0.5">
              {previewState.rowErrors.slice(0, 10).map((err, idx) => (
                <li key={idx}>
                  Line {err.lineNumber}: {err.message}
                  {err.offendingValue
                    ? ` (saw: "${err.offendingValue}")`
                    : ''}
                </li>
              ))}
              {previewState.rowErrors.length > 10 && (
                <li className="italic">
                  … and {previewState.rowErrors.length - 10} more.
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={previewPending}
          className="text-sm bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {previewPending ? 'Parsing…' : 'Preview import'}
        </button>
      </div>
    </form>
  );
}

// Separate form for the commit step. useActionState is per-form, so having
// a fresh instance keeps its state independent of the preview action.
function PreviewStep({
  preview,
}: {
  preview: Extract<PreviewState, { status: 'preview' }>;
}) {
  const [commitState, commitAction, commitPending] = useActionState(
    commitImport,
    COMMIT_INITIAL,
  );

  const sampleRows = preview.rows.slice(0, ROW_SAMPLE);
  const sampleMatches = preview.matches.slice(0, MATCH_SAMPLE);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 p-6 space-y-4">
        <div>
          <div className="text-xs text-stone-400 mb-0.5">Event</div>
          <div className="text-base font-medium text-stone-900">
            {preview.eventName}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {preview.eventDateISO
              ? new Date(preview.eventDateISO).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'No date'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <Stat label="Total finishers" value={preview.totalFinishers} />
          <Stat label="New athletes" value={preview.newAthletes.length} />
          <Stat label="Matched existing" value={preview.matches.length} />
        </div>

        {preview.categories.length > 0 && (
          <div className="pt-2">
            <div className="text-xs text-stone-400 mb-2">
              Finishers by category
            </div>
            <div className="flex flex-wrap gap-2">
              {preview.categories.map((cat) => (
                <span
                  key={cat.label}
                  className="text-xs rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-stone-700"
                >
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-stone-400"> · </span>
                  <span className="tabular-nums">{cat.count}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Ranks and percentiles are computed inside each category, so the
              10K and Marathon fields don&apos;t mix.
            </p>
          </div>
        )}
      </div>

      {preview.matches.length > 0 && (
        <div className="rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-1">
            Will attach to existing athletes
          </h2>
          <p className="text-xs text-stone-500 mb-3">
            Auto-matched on normalized name. Cancel and edit the CSV if any of
            these look wrong.
          </p>
          <ul className="text-xs text-stone-700 space-y-1">
            {sampleMatches.map((m) => (
              <li key={m.existingAthleteId}>
                <span className="font-medium">{m.csvName}</span>
                <span className="text-stone-400"> → </span>
                <span>{m.existingAthleteName}</span>
              </li>
            ))}
            {preview.matches.length > sampleMatches.length && (
              <li className="italic text-stone-400">
                … and {preview.matches.length - sampleMatches.length} more.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 p-6">
        <h2 className="text-sm font-semibold text-stone-900 mb-1">
          Sample rows
        </h2>
        <p className="text-xs text-stone-500 mb-3">
          First {sampleRows.length} of {preview.rows.length} parsed rows.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 text-left">
                <th className="py-1 pr-4 font-medium">Name</th>
                <th className="py-1 pr-4 font-medium">Finish</th>
                <th className="py-1 pr-4 font-medium">Rank</th>
                <th className="py-1 pr-4 font-medium">Gender</th>
                <th className="py-1 pr-4 font-medium">Location</th>
                <th className="py-1 pr-4 font-medium">Category</th>
                <th className="py-1 pr-4 font-medium">Bib</th>
                <th className="py-1 pr-4 font-medium">Country</th>
              </tr>
            </thead>
            <tbody className="text-stone-700">
              {sampleRows.map((row) => (
                <tr key={row.lineNumber} className="border-t border-slate-50">
                  <td className="py-1 pr-4">{row.name}</td>
                  <td className="py-1 pr-4 tabular-nums">
                    {formatTime(row.finishTimeSeconds)}
                  </td>
                  <td className="py-1 pr-4 tabular-nums">
                    {row.overallRank ?? '—'}
                  </td>
                  <td className="py-1 pr-4">{row.gender ?? '—'}</td>
                  <td className="py-1 pr-4">{row.location ?? '—'}</td>
                  <td className="py-1 pr-4">{row.raceCategory ?? '—'}</td>
                  <td className="py-1 pr-4 tabular-nums">{row.bib ?? '—'}</td>
                  <td className="py-1 pr-4">{row.eventCountry ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form action={commitAction} className="space-y-3">
        <input type="hidden" name="eventName" value={preview.eventName} />
        <input type="hidden" name="eventDate" value={toDateInput(preview.eventDateISO)} />
        {/* CSV text round-trips through the form so commit re-parses the
            same bytes. It's large — textarea handles multi-KB payloads
            without the browser dropping characters. */}
        <textarea
          name="csvText"
          defaultValue={preview.csvText}
          className="hidden"
          readOnly
        />

        {commitState.status === 'error' && (
          <p className="text-xs text-red-600">{commitState.error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={commitPending}
            className="text-sm bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
          >
            {commitPending
              ? 'Importing…'
              : `Confirm import (${preview.totalFinishers} rows)`}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-stone-500 hover:text-stone-900 px-3 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-stone-400 mb-0.5">{label}</div>
      <div className="text-2xl font-semibold text-stone-900 tabular-nums">
        {value}
      </div>
    </div>
  );
}

// The preview carries the event date as an ISO string; the commit action
// expects the <input type="date"> YYYY-MM-DD format, so strip the time.
function toDateInput(iso: string): string {
  if (!iso) return '';
  const idx = iso.indexOf('T');
  return idx > 0 ? iso.slice(0, idx) : iso;
}
