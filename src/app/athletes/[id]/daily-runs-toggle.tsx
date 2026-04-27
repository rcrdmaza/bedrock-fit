'use client';

// Owner-only "+ Log a run" button + slot for the form. Stays a thin
// client component so the heavier server section doesn't need to flip
// to client-side just for an open/closed state. The form below it
// (AddDailyRunForm) is its own client component and only mounts when
// the toggle is open.

import { useState } from 'react';
import AddDailyRunForm from './add-daily-run-form';
import type { DistanceUnit } from '@/lib/daily-runs';

export default function DailyRunsToggle({
  defaultUnit,
}: {
  // Owner's preferred unit, threaded down from the profile page so the
  // form's mi/km radio defaults match their setting.
  defaultUnit: DistanceUnit;
}) {
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
      defaultUnit={defaultUnit}
      onSuccess={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}
