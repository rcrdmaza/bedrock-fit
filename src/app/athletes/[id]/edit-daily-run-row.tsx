'use client';

// Per-card wrapper that toggles between a static card body (whatever
// the parent passed as children) and the edit form. The owner-author
// gets an "Edit" button next to the Delete button on rows they wrote;
// clicking it swaps the card contents for AddDailyRunForm in edit
// mode. Cancel and successful save both collapse back to the children.
//
// Server-component-friendly: the static card body stays a server-rendered
// child, we just wrap it in a client island so the toggle state lives
// here without forcing the rest of the row to flip to client-side.

import { useState, type ReactNode } from 'react';
import AddDailyRunForm, {
  type DailyRunInitial,
} from './add-daily-run-form';

export default function EditDailyRunRow({
  initial,
  children,
}: {
  // Pre-formatted edit payload — the parent server component shapes
  // it from the row so this client island stays free of the date /
  // duration formatters (those live alongside the action layer).
  initial: DailyRunInitial;
  // The read-only card content. Rendered when not editing; swapped
  // wholesale for the form when editing.
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <AddDailyRunForm
        mode="edit"
        initial={initial}
        onSuccess={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-2">
      {children}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
