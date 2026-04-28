'use client';

// Shared claim UI. Used by:
//   - results-search.tsx (per result row, full browse)
//   - event detail page (per participant in one event)
//
// Kept in one place so the claim flow can't drift between entry points
// — same copy, same validation, same success state.

import { useActionState } from 'react';
import { claimResult, type ClaimState } from '@/app/actions/claim';

const INITIAL_CLAIM: ClaimState = { status: 'idle' };

export function ClaimForm({
  resultId,
  onCancel,
}: {
  resultId: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    claimResult,
    INITIAL_CLAIM,
  );

  if (state.status === 'success') {
    return (
      <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
        Claim submitted. We&apos;ll email you once it&apos;s reviewed.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="resultId" value={resultId} />
      <div>
        <label
          htmlFor={`email-${resultId}`}
          className="block text-xs text-stone-500 mb-1"
        >
          Your email
        </label>
        <input
          id={`email-${resultId}`}
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor={`note-${resultId}`}
          className="block text-xs text-stone-500 mb-1"
        >
          Verification note{' '}
          <span className="text-stone-400">
            (bib #, strava link, anything that proves it was you)
          </span>
        </label>
        <textarea
          id={`note-${resultId}`}
          name="note"
          maxLength={500}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {state.status === 'error' && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Submit claim'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-xs text-stone-500 hover:text-stone-900 px-3 py-2 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Small shared bits so the results + events views render status pills
// identically. Duplicating these in two files is how copy drifts.
export function statusLabel(status: string): string {
  if (status === 'claimed') return 'Claimed';
  if (status === 'pending') return 'Pending';
  return 'Unclaimed';
}

export function statusClasses(status: string): string {
  if (status === 'claimed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'bg-sky-50 text-sky-700';
  return 'bg-amber-50 text-amber-700';
}
