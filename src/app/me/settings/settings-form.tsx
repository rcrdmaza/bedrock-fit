'use client';

import { useActionState, useRef, useState } from 'react';
import {
  updateProfileSettings,
  type ProfileSettingsState,
} from '@/app/actions/profile-settings';
import RunningHeroAvatar from '@/app/components/running-hero-avatar';
import { type DistanceUnit, DISTANCE_UNITS } from '@/lib/daily-runs';

// Initial values come from the server. We hydrate them into local state
// so the radio "Use my nickname" can be disabled live as the user
// types/clears the nickname field — without a state mirror that signal
// only updates after a server round-trip.
export interface SettingsFormInitial {
  name: string;
  nickname: string;
  displayPreference: 'name' | 'nickname';
  isPrivate: boolean;
  avatarUrl: string | null;
  // Preferred distance unit. Drives the default on the "Log a run"
  // form and the unit used by mileage stats on the profile.
  distancePreference: DistanceUnit;
}

const INITIAL_ACTION: ProfileSettingsState = { status: 'idle' };

// Mirror of the server-side cap so the helper text stays in sync. Soft
// constraint — the server re-checks; this is just to set expectations
// before the user picks a 5MB image.
const MAX_AVATAR_KB = 200;

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
  const [distancePreference, setDistancePreference] = useState<DistanceUnit>(
    initial.distancePreference,
  );

  // Avatar preview state. `previewUrl` is what the <img> shows: a
  // freshly-picked file's data URL when the user has chosen one,
  // otherwise the saved avatar from the DB. `removeAvatar` is a flag
  // we POST so the server can clear the column without us pretending
  // to upload a 0-byte file.
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial.avatarUrl,
  );
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nicknameTrimmed = nickname.trim();
  const canUseNickname = nicknameTrimmed.length > 0;

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(initial.avatarUrl);
      return;
    }
    // Sanity-check size client-side before encoding — the same cap as
    // the server. Failed picks reset to the saved avatar so the UI
    // doesn't pretend the upload happened.
    if (file.size > MAX_AVATAR_KB * 1024) {
      e.target.value = '';
      setPreviewUrl(initial.avatarUrl);
      window.alert(`Image is too large (max ${MAX_AVATAR_KB} KB).`);
      return;
    }
    // Picking a new file implicitly cancels a pending "remove" — the
    // user clearly wants this image, not the placeholder.
    setRemoveAvatar(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function onRequestRemove() {
    setRemoveAvatar(true);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <form
      action={formAction}
      className="space-y-8"
      // Required for file uploads — without it the browser sends the
      // file as a string rather than a multipart blob.
      encType="multipart/form-data"
    >
      {/* Profile picture. The preview is a 96-px circle that mirrors
          the size on the actual profile page — what you see here is
          how it'll render. When no avatar exists (initial empty + no
          file picked) we drop in the running-hero placeholder so the
          slot never looks empty. */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-900 mb-1">
          Profile picture
        </legend>
        <div className="flex items-center gap-5">
          <div
            className="overflow-hidden rounded-full w-24 h-24 ring-4 ring-stone-200 flex items-center justify-center"
            aria-hidden="true"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <RunningHeroAvatar size={96} bgClassName="bg-sky-100" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="inline-flex items-center text-xs font-medium bg-stone-900 text-white px-3 py-2 rounded-lg hover:bg-stone-700 transition-colors cursor-pointer">
              {previewUrl && previewUrl !== initial.avatarUrl
                ? 'Pick a different image'
                : initial.avatarUrl
                  ? 'Replace image'
                  : 'Upload image'}
              <input
                ref={fileInputRef}
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onPickAvatar}
                className="sr-only"
              />
            </label>
            {(previewUrl || initial.avatarUrl) && !removeAvatar ? (
              <button
                type="button"
                onClick={onRequestRemove}
                className="block text-xs text-stone-500 hover:text-stone-900 transition-colors"
              >
                Remove image
              </button>
            ) : null}
            {removeAvatar ? (
              <p className="text-xs text-amber-700">
                Image will be cleared on save. The running-hero
                placeholder will return.
              </p>
            ) : null}
            <p className="text-xs text-stone-500">
              PNG, JPEG, WebP, or GIF. Max {MAX_AVATAR_KB} KB. The
              running-hero placeholder shows whenever you don&apos;t
              have an image.
            </p>
          </div>
          {/* Hidden flag — the server treats this as "clear the
              avatar_url column." The checkbox is invisible; we toggle
              it via the Remove button so the data side is just one
              FormData boolean. */}
          {removeAvatar ? (
            <input type="hidden" name="removeAvatar" value="1" />
          ) : null}
        </div>
      </fieldset>

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

      {/* Preferred distance unit. The toggle is small because miles vs
          kilometers is a one-line preference, but it gets its own
          fieldset so the helper line can spell out where the choice
          actually shows up — defaulting the "Log a run" form and the
          monthly-mileage cell, not retroactively rewriting old logs. */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-stone-900 mb-2">
          Preferred distance unit
        </legend>
        <div
          role="radiogroup"
          aria-label="Distance unit"
          className="inline-flex rounded-lg border border-stone-200 bg-white overflow-hidden"
        >
          {DISTANCE_UNITS.map((u) => (
            <label
              key={u}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                distancePreference === u
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <input
                type="radio"
                name="distancePreference"
                value={u}
                checked={distancePreference === u}
                onChange={() => setDistancePreference(u)}
                className="sr-only"
              />
              {u === 'mi' ? 'Miles' : 'Kilometers'}
            </label>
          ))}
        </div>
        <p className="text-xs text-stone-500">
          Sets the default unit when you log a new run and the unit your
          monthly mileage shows in. Existing logged runs keep the unit
          you originally entered.
        </p>
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
