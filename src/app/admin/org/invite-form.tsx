'use client';

import { useActionState, useState } from 'react';
import { inviteMember, type InviteState } from '@/app/actions/org';

const INITIAL_STATE: InviteState = { status: 'idle' };

export default function InviteForm() {
  const [state, formAction, pending] = useActionState(
    inviteMember,
    INITIAL_STATE,
  );

  // Track previous status during render — when the action transitions
  // to 'sent' we clear the input so the next invite starts blank,
  // without an effect (matches the rest of the codebase's React 19
  // "track prev value" pattern).
  const [prevStatus, setPrevStatus] = useState(state.status);
  const [email, setEmail] = useState('');
  if (state.status !== prevStatus) {
    setPrevStatus(state.status);
    if (state.status === 'sent') setEmail('');
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="teammate@example.com"
          autoComplete="email"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Send invite'}
        </button>
      </div>
      {state.status === 'error' && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state.status === 'sent' && (
        <p className="text-xs text-emerald-700">
          Invite sent to {state.email}. They have 7 days to accept.
        </p>
      )}
    </form>
  );
}
