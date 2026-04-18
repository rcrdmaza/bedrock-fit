'use client';

import { useActionState } from 'react';
import { adminLogin, type LoginState } from '@/app/actions/admin';

const INITIAL_STATE: LoginState = { status: 'idle' };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="admin-password"
          className="block text-xs text-gray-500 mb-1"
        >
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
