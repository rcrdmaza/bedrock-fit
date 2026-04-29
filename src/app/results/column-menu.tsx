'use client';

// Header-cell button + popover used by every sortable column on the
// /results table. The button shows the column label, a sort-direction
// arrow when this column is the active sort, and a small dot when the
// column has any filter applied. Clicking opens a panel with sort
// buttons and (optionally) a filter widget the parent passes in.
//
// We roll this rather than reach for a dropdown library because:
//   - The widget is small and self-contained — three handlers + an
//     open/close flag is the whole state machine.
//   - shadcn/popover would pull tailwind-merge + a portal/focus-trap
//     stack we don't need; this is one button, one panel, click-out
//     to dismiss.
//
// Accessibility: the button toggles aria-expanded; ESC and any click
// outside the panel dismiss; the panel is role="dialog" with the
// column label as its accessible name.

import { useEffect, useRef, useState } from 'react';
import type { ResultSortField } from '@/lib/results-sort';

export interface ColumnMenuProps {
  // Visible label, also the dialog's accessible name.
  label: string;
  // Sort field this column controls. Used by the parent to compare
  // against the current sort and decide whether to show the arrow.
  field: ResultSortField;
  // Current global sort state — used for the arrow indicator and to
  // pick the "active" highlight on the asc/desc buttons.
  sort: { field: ResultSortField; direction: 'asc' | 'desc' };
  // True when this column has at least one filter active. Drives the
  // small dot next to the label so the user can see at a glance that
  // a hidden filter is narrowing the row set.
  hasFilter?: boolean;
  // Right-align the button content (and the popover anchor). We use
  // this on numeric columns (Pace, Total time, Year) so headers line
  // up with their right-aligned cell contents.
  align?: 'left' | 'right';
  onSortAsc: () => void;
  onSortDesc: () => void;
  // Optional column-specific filter UI (text input, chip set, year
  // range, etc.). Rendered inside the popover under a divider.
  // Omitted on columns that only support sorting (Pace, Total time).
  children?: React.ReactNode;
}

export default function ColumnMenu({
  label,
  field,
  sort,
  hasFilter,
  align = 'left',
  onSortAsc,
  onSortDesc,
  children,
}: ColumnMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Click-outside + ESC dismiss. Both listeners attach only while the
  // panel is open so we don't leak handlers on hundreds of rows worth
  // of headers (eight here, but the pattern matters).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = sort.field === field;
  const arrow = !active ? '' : sort.direction === 'asc' ? '↑' : '↓';

  // Right-aligned headers: the label hugs the right edge, the popover
  // anchors right too so it doesn't overflow off-screen on the last
  // columns of the table.
  const buttonAlign =
    align === 'right' ? 'justify-end text-right' : 'justify-start text-left';
  const panelAlign = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label} — sort and filter`}
        className={`group inline-flex items-center gap-1 w-full ${buttonAlign} transition-colors ${
          active || hasFilter
            ? 'text-stone-900'
            : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        <span>{label}</span>
        {/* Reserve a fixed-width slot for the arrow so the label
            doesn't shift left/right when the column becomes / stops
            being the active sort. */}
        <span aria-hidden="true" className="tabular-nums w-3 inline-block">
          {arrow}
        </span>
        {hasFilter ? (
          <span
            aria-hidden="true"
            // Tiny dot signaling "this column has a filter applied" so
            // the user can spot active filters without opening every
            // panel one by one.
            className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600"
          />
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute z-30 mt-2 ${panelAlign} min-w-[14rem] rounded-xl border border-slate-200 bg-white shadow-lg p-3 normal-case tracking-normal text-sm text-stone-700`}
        >
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                onSortAsc();
                setOpen(false);
              }}
              aria-pressed={active && sort.direction === 'asc'}
              className={`flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                active && sort.direction === 'asc'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              Sort ↑
            </button>
            <button
              type="button"
              onClick={() => {
                onSortDesc();
                setOpen(false);
              }}
              aria-pressed={active && sort.direction === 'desc'}
              className={`flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                active && sort.direction === 'desc'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              Sort ↓
            </button>
          </div>
          {children ? (
            <div className="border-t border-slate-100 pt-3 mt-1">{children}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
