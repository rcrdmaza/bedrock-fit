'use client';

// Owner-only "+ Log a run" button + slot for the form. Stays a thin
// client component so the heavier server section doesn't need to flip
// to client-side just for an open/closed state. The form below it
// (AddDailyRunForm) is its own client component and only mounts when
// the toggle is open.

import { useState } from 'react';
import AddDailyRunForm from './add-daily-run-form';

export default function DailyRunsToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Log a run
      </button>
    );
  }

  return (
    <AddDailyRunForm
      onSuccess={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}
