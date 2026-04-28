'use client';

// Combobox replacing the old paste-IDs participants input on the
// daily-runs form. Search by name → click to add → chips appear
// inline. The selected set serializes into a hidden `participants`
// field as `/athletes/<uuid>` tokens, which the existing parser
// (parseParticipants) already accepts — so the server side didn't
// change to support this UX.
//
// We deliberately keep this small: no fancy <Combobox> primitives,
// just a controlled input + a debounced fetch + a list. Dropdown
// closes on blur via setTimeout so a click on a row doesn't get
// preempted by the blur firing first.

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { getDisplayName } from '@/lib/athlete-display';

interface AthleteHit {
  id: string;
  name: string;
  nickname: string | null;
  displayPreference: string;
  location: string | null;
}

export interface SelectedAthlete {
  id: string;
  display: string;
}

interface Props {
  // Optional pre-filled selection — used by the edit-a-run form to
  // hydrate chips from the existing tag set. We resolve display names
  // server-side and pass them through so the combobox doesn't need to
  // round-trip the search endpoint just to render an existing tag.
  initialSelected?: SelectedAthlete[];
}

const DEBOUNCE_MS = 180;
// Hard cap so a fat-finger paste doesn't blow past the server-side
// MAX_PARTICIPANTS check after the round-trip.
const MAX_SELECTED = 20;

export default function AthleteCombobox({ initialSelected = [] }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AthleteHit[]>([]);
  const [selected, setSelected] = useState<SelectedAthlete[]>(initialSelected);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Debounced search effect. The clear-on-empty branch lives in the
  // input's onChange handler (so the effect body doesn't synchronously
  // call setState — the react-hooks/set-state-in-effect rule flags
  // that pattern). Here we only kick off the fetch when there's a
  // non-empty query; setLoading and setResults both fire from inside
  // the timer callback, which counts as a "callback function called
  // when an external system changes" — the pattern the rule allows.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const url = `/api/athletes/search?q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { method: 'GET' });
        if (cancelled) return;
        if (!res.ok) {
          setResults([]);
          setLoading(false);
          return;
        }
        const data: { athletes?: AthleteHit[] } = await res.json();
        if (cancelled) return;
        // Hide rows that are already selected — picking the same
        // athlete twice would just trip the unique constraint.
        const selectedIds = new Set(selected.map((s) => s.id));
        setResults(
          (data.athletes ?? []).filter((a) => !selectedIds.has(a.id)),
        );
        setLoading(false);
      } catch {
        if (cancelled) return;
        setResults([]);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  function add(hit: AthleteHit) {
    if (selected.length >= MAX_SELECTED) return;
    if (selected.some((s) => s.id === hit.id)) return;
    setSelected([
      ...selected,
      {
        id: hit.id,
        display: getDisplayName(hit),
      },
    ]);
    setQuery('');
    setResults([]);
    setOpen(false);
    // Refocus so the user can keep typing the next name without
    // reaching for the mouse.
    inputRef.current?.focus();
  }

  function remove(id: string) {
    setSelected(selected.filter((s) => s.id !== id));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      add(results[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && query.length === 0 && selected.length > 0) {
      // Backspace on an empty input pops the last chip — standard chip
      // input affordance.
      remove(selected[selected.length - 1].id);
    }
  }

  // Serialized form payload. The action's parseParticipants helper
  // accepts `/athletes/<uuid>` strings comma-separated, so we hand it
  // exactly that — no schema change on the server side.
  const serialized = selected.map((s) => `/athletes/${s.id}`).join(', ');
  const limitReached = selected.length >= MAX_SELECTED;

  return (
    <div className="relative">
      {/* Hidden input that the form submits. We keep the visible
          combobox detached from form state so its UX (focus, enter to
          select, etc.) doesn't leak into the FormData payload. */}
      <input type="hidden" name="participants" value={serialized} />

      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selected.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded-full bg-stone-900 text-white text-xs px-2.5 py-1"
          >
            {s.display}
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label={`Remove ${s.display}`}
              className="text-stone-300 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listboxId}
        autoComplete="off"
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          // Clear-on-empty lives here, not in the effect, to keep the
          // effect body free of synchronous setState (eslint rule
          // react-hooks/set-state-in-effect).
          if (next.trim().length === 0) {
            setResults([]);
            setLoading(false);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a result row registers before the
        // dropdown unmounts.
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        disabled={limitReached}
        placeholder={
          limitReached
            ? `Up to ${MAX_SELECTED} tagged.`
            : 'Search athletes by name'
        }
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-stone-400"
      />

      {open && query.trim().length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-sm max-h-60 overflow-auto"
        >
          {loading ? (
            <li className="px-3 py-2 text-xs text-stone-500">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-stone-500">No matches.</li>
          ) : (
            results.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  // onMouseDown rather than onClick so it fires before
                  // the input's blur handler closes the dropdown.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(hit);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-stone-900 hover:bg-slate-50 flex items-baseline justify-between gap-2"
                >
                  <span>{getDisplayName(hit)}</span>
                  {hit.location ? (
                    <span className="text-xs text-stone-400 truncate">
                      {hit.location}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
