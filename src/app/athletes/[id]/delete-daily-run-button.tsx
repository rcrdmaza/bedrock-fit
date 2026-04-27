'use client';

// Tiny client wrapper around the delete server action. Shows a
// confirmation dialog before submitting so an accidental click on the
// "× Delete" affordance can't wipe a run silently.
//
// We deliberately keep this as a real <form> (rather than a fetch + DOM
// rerender) so the action runs through Next's revalidate pipeline and
// the profile page re-fetches. The owner sees the row disappear after
// the action completes.

import { useActionState, useTransition } from 'react';
import {
  deleteDailyRun,
  type DeleteDailyRunState,
} from '@/app/actions/daily-runs';

const INITIAL: DeleteDailyRunState = { status: 'idle' };

export default function DeleteDailyRunButton({ runId }: { runId: string }) {
  const [state, formAction] = useActionState(deleteDailyRun, INITIAL);
  const [, startTransition] = useTransition();

  // Confirm before submitting. We build the FormData by hand so we can
  // run the confirm() before the action fires — letting the form's
  // native onSubmit fire first would race the dispatch.
  function onClick() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Delete this run? This can\u2019t be undone.')
    ) {
      return;
    }
    const fd = new FormData();
    fd.set('runId', runId);
    startTransition(() => formAction(fd));
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Delete this run"
        className="text-xs text-stone-400 hover:text-red-600 transition-colors"
      >
        Delete
      </button>
      {state.status === 'error' ? (
        <span className="text-xs text-red-600 ml-2">{state.error}</span>
      ) : null}
    </>
  );
}
