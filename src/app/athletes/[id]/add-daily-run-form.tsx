'use client';

// Client form for logging a new daily run. Owner-only — the parent
// server component renders this only when `isOwner` is true and never
// passes it to public visitors. We use `useActionState` so submit
// errors surface inline (network or validation) without a page reload,
// and so success can collapse the form back to the "Add a run" button.
//
// The same form drives both add and edit. In edit mode the parent
// passes `mode='edit'`, the run's `runId`, and `initial` values; we
// swap the action and pre-fill the inputs. We deliberately don't try
// to share the JSX between two specialized components — the only
// difference is which action and what defaults, and a flag is cleaner
// than a `<EditFields>` / `<AddFields>` split.

import { useActionState, useState } from 'react';
import {
  addDailyRun,
  updateDailyRun,
  type DailyRunState,
} from '@/app/actions/daily-runs';
import {
  type DistanceUnit,
  DISTANCE_UNITS,
  MAX_DISTANCE_VALUE,
} from '@/lib/daily-runs';
import AthleteCombobox, {
  type SelectedAthlete,
} from './athlete-combobox';

const INITIAL: DailyRunState = { status: 'idle' };

// Pre-fill payload for edit mode. Mirrors the form fields one-for-one.
// Strings are passed through verbatim — the inputs all accept text or
// the parent has already coerced (e.g. duration is "32:15", date is
// YYYY-MM-DD), and an empty string collapses to the input's empty state.
//
// `selectedAthletes` hydrates the participant combobox with chips for
// the existing tag set. The parent resolves IDs → display names so the
// combobox doesn't need to round-trip the search endpoint just to
// re-render an existing tag.
export interface DailyRunInitial {
  runId: string;
  runDate: string; // YYYY-MM-DD
  distanceValue: string;
  distanceUnit: DistanceUnit;
  duration: string;
  location: string;
  stravaUrl: string;
  selectedAthletes: SelectedAthlete[];
  notes: string;
}

// "Today" in YYYY-MM-DD form, computed against the user's local
// timezone so the date input defaults to a date that matches what they
// just ran. The action resolves the same string to UTC midnight on
// write, which is fine — the row is a calendar date, not a precise
// instant.
function todayLocalIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AddDailyRunForm({
  mode = 'add',
  initial,
  defaultUnit = 'mi',
  onSuccess,
  onCancel,
}: {
  // 'add' (default) renders the empty form against addDailyRun; 'edit'
  // pre-fills from `initial` and submits to updateDailyRun.
  mode?: 'add' | 'edit';
  // Required when `mode === 'edit'`; ignored otherwise. We model it as
  // optional rather than a discriminated union because parents (the
  // toggle vs. the per-card edit wrapper) want to pass the same prop
  // shape and type-narrowing buys little here.
  initial?: DailyRunInitial;
  // Owner's preferred unit gets used as the radio default in add mode.
  // In edit mode we ignore it and honor the run's stored unit so a unit
  // change in settings doesn't quietly retcon the row when the user
  // tweaks the distance.
  defaultUnit?: DistanceUnit;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const action = mode === 'edit' ? updateDailyRun : addDailyRun;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  // In edit mode the row's stored unit wins over the user-level
  // preference — see prop comment above.
  const startingUnit: DistanceUnit =
    mode === 'edit' && initial ? initial.distanceUnit : defaultUnit;
  const [unit, setUnit] = useState<DistanceUnit>(startingUnit);

  // React 19 pattern: detect a status transition during render and
  // dispatch the side effect in the same pass. We avoid useEffect +
  // setState here because the lint rule
  // (react-hooks/set-state-in-effect) explicitly flags it. The parent
  // unmounts us on success (the toggle closes), so we don't need to
  // reset our own input state — the next mount starts fresh.
  const [prevStatus, setPrevStatus] = useState(state.status);
  if (state.status !== prevStatus) {
    setPrevStatus(state.status);
    if (state.status === 'success' && onSuccess) onSuccess();
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5 space-y-4"
    >
      {/* In edit mode the action needs the run id; we send it as a
          hidden field rather than baking it into a closure so the
          form's `action={...}` prop stays a plain server-action ref. */}
      {mode === 'edit' && initial ? (
        <input type="hidden" name="runId" value={initial.runId} />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date — defaults to today in add mode, or the existing run's
            date in edit mode. Native picker keeps the bundle light and
            matches platform conventions. */}
        <div>
          <label
            htmlFor="runDate"
            className="block text-xs font-medium text-stone-500 mb-1"
          >
            Date
          </label>
          <input
            id="runDate"
            name="runDate"
            type="date"
            defaultValue={
              mode === 'edit' && initial ? initial.runDate : todayLocalIso()
            }
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Distance — number input + unit toggle as a side-by-side
            cluster. The unit is sent as part of the form payload via a
            hidden input mirroring the radio state; we render the radios
            for the visual UX but only rely on the hidden value
            server-side, which avoids fragile FormData lookups when the
            user has both radios in unusual states. */}
        <div>
          <label
            htmlFor="distanceValue"
            className="block text-xs font-medium text-stone-500 mb-1"
          >
            Distance
          </label>
          <div className="flex gap-2">
            <input
              id="distanceValue"
              name="distanceValue"
              type="number"
              min="0.01"
              step="0.01"
              max={MAX_DISTANCE_VALUE}
              required
              placeholder="5"
              defaultValue={
                mode === 'edit' && initial ? initial.distanceValue : undefined
              }
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div
              role="radiogroup"
              aria-label="Distance unit"
              className="inline-flex rounded-lg border border-stone-200 bg-white overflow-hidden shrink-0"
            >
              {DISTANCE_UNITS.map((u) => (
                <label
                  key={u}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    unit === u
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="distanceUnit"
                    value={u}
                    checked={unit === u}
                    onChange={() => setUnit(u)}
                    className="sr-only"
                  />
                  {u}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Duration — text input rather than time picker so users can
            paste "32:15" or "1:05:00" freely. Helper text spells out
            the formats the parser accepts. */}
        <div>
          <label
            htmlFor="duration"
            className="block text-xs font-medium text-stone-500 mb-1"
          >
            Time (optional)
          </label>
          <input
            id="duration"
            name="duration"
            type="text"
            inputMode="numeric"
            placeholder="32:15"
            defaultValue={mode === 'edit' && initial ? initial.duration : undefined}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Like 32:15 or 1:05:00
          </p>
        </div>

        {/* Location — free-form text. We don't try to geocode in v1 so
            anything from "Lima" to "Central Park loop" is fair game. */}
        <div>
          <label
            htmlFor="location"
            className="block text-xs font-medium text-stone-500 mb-1"
          >
            Location (optional)
          </label>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={120}
            placeholder="Lima, Peru"
            defaultValue={mode === 'edit' && initial ? initial.location : undefined}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Strava activity URL — optional. Full-width because the URL is
          long and a half-width field truncates it visually. */}
      <div>
        <label
          htmlFor="stravaUrl"
          className="block text-xs font-medium text-stone-500 mb-1"
        >
          Strava activity link (optional)
        </label>
        <input
          id="stravaUrl"
          name="stravaUrl"
          type="url"
          placeholder="https://www.strava.com/activities/12345"
          defaultValue={mode === 'edit' && initial ? initial.stravaUrl : undefined}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tagged athletes — typeahead-driven multi-select. The chips
          serialize to a hidden `participants` input as
          `/athletes/<uuid>` tokens, which the existing parser already
          accepts; private profiles never surface in the dropdown but
          can still be tagged via paste fallback if absolutely needed
          (we don't render a paste fallback here in v1). */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Ran with (optional)
        </label>
        <AthleteCombobox
          initialSelected={
            mode === 'edit' && initial ? initial.selectedAthletes : []
          }
        />
        <p className="text-[11px] text-stone-400 mt-1">
          Search by name, click to add. Tagged athletes see this run on
          their profile too.
        </p>
      </div>

      {/* Notes — small textarea for vibes. Capped at 500 chars on the
          server; we don't show a counter because the cap is generous. */}
      <div>
        <label
          htmlFor="notes"
          className="block text-xs font-medium text-stone-500 mb-1"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Easy zone-2 with the crew"
          defaultValue={mode === 'edit' && initial ? initial.notes : undefined}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {state.status === 'error' ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="text-sm text-stone-600 hover:text-stone-900 px-4 py-2 transition-colors"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {pending
            ? 'Saving\u2026'
            : mode === 'edit'
              ? 'Save changes'
              : 'Log run'}
        </button>
      </div>
    </form>
  );
}
