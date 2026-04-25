'use client';

import { useActionState } from 'react';
import { createOrg, type CreateOrgState } from '@/app/actions/org';

const INITIAL_STATE: CreateOrgState = { status: 'idle' };

// Standalone form component — currently unused on the page but
// exported so a future "you have no org yet" branch on /admin/org can
// drop it in without re-deriving the action wiring. Keeping it
// alongside the page makes co-location obvious.
export default function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(
    createOrg,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label
          htmlFor="org-name"
          className="block text-xs text-stone-500 mb-1"
        >
          Organization name
        </label>
        <input
          id="org-name"
          name="name"
          required
          maxLength={100}
          placeholder="Lima Runners Club"
          autoComplete="organization"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {state.status === 'error' && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state.status === 'created' && (
        <p className="text-xs text-emerald-700">
          Created — reload to see your new org.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create organization'}
      </button>
    </form>
  );
}
