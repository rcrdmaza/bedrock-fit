'use client';

import { useActionState, useState } from 'react';
import {
  updateProfileSettings,
  type ProfileSettingsState,
} from '@/app/actions/profile-settings';

// Initial values come from the server. We hydrate them into local state
// so the radio "Use my nickname" can be disabled live as the user
// types/clears the nickname field — without a state mirror that signal
// only updates after a server round-trip.
export interface SettingsFormInitial {
  name: string;
  nickname: string;
  displayPreference: 'name' | 'nickname';
  isPrivate: boolean;
}

const INITIAL_ACTION: ProfileSettingsState = { status: 'idle' };

export default function SettingsForm({
  initial,
}: {
  initial: SettingsFormInitial;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileSettings,
    INITIAL_ACTION,
  );

  // Mirrored locally for live UI rules (disable "use nickname" when
  // empty). The server is still the source of truth on save; this only
  // drives the form's own affordances.
  const [nickname, setNickname] = useState(initial.nickname);
  const [preference, setPreference] = useState<'name' | 'nickname'>(
    initial.displayPreference,
  );
  const [isPrivate, setIsPrivate] = useState(initial.isPrivate);

  const nicknameTrimmed = nickname.trim();
  const canUseNickname = nicknameTrimmed.length > 0;

  return (
    <form action={formAction} className="space-y-8">
      {/* Name + nickname pair. Two stacked text fields with light
          helper text; no fancy label component because the rest of the
          app uses bare <label> + <input>. */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-stone-900 mb-1">
          Display
        </legend>

        <div>
          <label
            htmlFor="name"
            className="block text-xs text-stone-500 mb-1"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={initial.name}
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-stone-500 mt-1">
            Used for matching imported results to your profile. Always
            visible to admins; visible to other users when you choose
            &ldquo;Use my full name&rdquo; below.
          </p>
        </div>

        <div>
          <label
            htmlFor="nickname"
            className="block text-xs text-stone-500 mb-1"
          >
            Nickname (optional)
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
            placeholder="e.g. Champ"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-stone-500 mt-1">
            Shown to other users when you pick &ldquo;Use my
            nickname&rdquo; below.
          </p>
        </div>
      </fieldset>

      {/* Which to use as username — radio pair. The "Use my nickname"
          option disables when nickname is empty so the user can't pick
          it and end up rendering blank chrome. */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-stone-900 mb-2">
          Which name should other users see?
        </legend>

        <label className="flex items-start gap-3 cursor-pointer rounded-lg p-3 border border-stone-200 hover:border-stone-300 transition-colors">
          <input
            type="radio"
            name="displayPreference"
            value="name"
            checked={preference === 'name'}
            onChange={() => setPreference('name')}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="text-sm text-stone-900">Use my full name</div>
            <div className="text-xs text-stone-500 mt-0.5">
              Other users see your full name on leaderboards, results, and
              your profile.
            </div>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 rounded-lg p-3 border transition-colors ${
            canUseNickname
              ? 'cursor-pointer border-stone-200 hover:border-stone-300'
              : 'cursor-not-allowed border-stone-100 bg-stone-50/60'
          }`}
        >
          <input
            type="radio"
            name="displayPreference"
            value="nickname"
            checked={preference === 'nickname'}
            disabled={!canUseNickname}
            onChange={() => setPreference('nickname')}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div
              className={`text-sm ${canUseNickname ? 'text-stone-900' : 'text-stone-400'}`}
            >
              Use my nickname
              {canUseNickname ? (
                <span className="ml-1.5 text-stone-500">
                  ({nicknameTrimmed})
                </span>
              ) : null}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {canUseNickname
                ? 'Other users see your nickname instead of your full name. Admins still see your full name.'
                : 'Add a nickname above to enable this option.'}
            </div>
          </div>
        </label>
      </fieldset>

      {/* Privacy toggle. Single checkbox with a longer helper line so
          the consequences are obvious before saving. */}
      <fieldset>
        <legend className="text-sm font-semibold text-stone-900 mb-2">
          Privacy
        </legend>
        <label className="flex items-start gap-3 cursor-pointer rounded-lg p-3 border border-stone-200 hover:border-stone-300 transition-colors">
          <input
            type="checkbox"
            name="isPrivate"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="text-sm text-stone-900">
              Make my profile private
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              Other users opening your profile see your name with a
              redaction line and the rest hidden — your stats and race
              history stay visible only to you. By default, all profiles
              are public.
            </div>
          </div>
        </label>
      </fieldset>

      {state.status === 'error' ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}
      {state.status === 'success' ? (
        <p className="text-xs text-emerald-700">Saved.</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
