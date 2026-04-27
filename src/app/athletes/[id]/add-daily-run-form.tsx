'use client';

// Client form for logging a new daily run. Owner-only — the parent
// server component renders this only when `isOwner` is true and never
// passes it to public visitors. We use `useActionState` so submit
// errors surface inline (network or validation) without a page reload,
// and so success can collapse the form back to the "Add a run" button.

import { useActionState, useState } from 'react';
import {
  addDailyRun,
  type DailyRunState,
} from '@/app/actions/daily-runs';
import {
  type DistanceUnit,
  DISTANCE_UNITS,
  MAX_DISTANCE_VALUE,
} from '@/lib/daily-runs';

const INITIAL: DailyRunState = { status: 'idle' };

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
  defaultUnit = 'mi',
  onSuccess,
  onCancel,
}: {
  // Owner's preferred unit gets used as the radio default. We don't
  // actually persist a per-athlete preference yet; the form falls back
  // to miles to match the most common locale of bedrock.fit's audience.
  defaultUnit?: DistanceUnit;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(addDailyRun, INITIAL);
  const [unit, setUnit] = useState<DistanceUnit>(defaultUnit);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date — defaults to today. Native picker keeps the bundle
            light and matches platform conventions. */}
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
            defaultValue={todayLocalIso()}
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
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tagged athletes — paste-list of profile URLs or IDs. We chose
          this over a typeahead in v1 because there's no global athlete
          search yet; pasting from another tab is the realistic flow. */}
      <div>
        <label
          htmlFor="participants"
          className="block text-xs font-medium text-stone-500 mb-1"
        >
          Ran with (optional)
        </label>
        <input
          id="participants"
          name="participants"
          type="text"
          placeholder="/athletes/abc-123, /athletes/def-456"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[11px] text-stone-400 mt-1">
          Paste profile links or IDs, separated by commas. Tagged
          athletes see this run on their profile too.
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
          {pending ? 'Saving\u2026' : 'Log run'}
        </button>
      </div>
    </form>
  );
}
