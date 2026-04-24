'use client';

import { useActionState } from 'react';
import { requestSignInLink, type SignInState } from '@/app/actions/sign-in';

const INITIAL: SignInState = { status: 'idle' };

export default function SignInForm() {
  const [state, formAction, pending] = useActionState(
    requestSignInLink,
    INITIAL,
  );

  // After success we swap the entire form for a confirmation block.
  // Leaving the email field visible invites a second submit, which
  // would either be a no-op (rate-limited) or burn a second token —
  // both worse UX than "go check your inbox."
  if (state.status === 'sent') {
    return (
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-medium mb-1">Check your inbox.</p>
        <p>
          We sent a sign-in link to{' '}
          <span className="font-medium">{state.email}</span>. The link expires
          in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs text-stone-500 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {state.status === 'error' && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full text-sm bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
