'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes } from '@/db/schema';
import { requireUser } from '@/lib/auth';

// Settings form state. Mirrors the {claim,sign-in} action shape so the
// `useActionState` hook in the form component can render `pending`,
// `success`, and `error` consistently.
export type ProfileSettingsState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

// Width caps. The DB column is unbounded `text`, but a 100-char nickname
// would mangle the profile header layout and a 200-char name is
// almost certainly an attack or paste-error. We enforce here so the
// limits are visible alongside the validation message.
const MAX_NAME = 120;
const MAX_NICKNAME = 40;

// Whitelist of accepted preference values. Anything else falls back to
// 'name' — the helper in `athlete-display.ts` makes the same call on
// the read path, so the two sides stay aligned.
const ALLOWED_PREFERENCES = new Set(['name', 'nickname']);

export async function updateProfileSettings(
  _prev: ProfileSettingsState,
  formData: FormData,
): Promise<ProfileSettingsState> {
  // Auth first — the form is rendered behind requireUser, but the action
  // is a public endpoint and we re-check rather than trust the form.
  const user = await requireUser('/me/settings');
  if (!user.athleteId) {
    // Verify auto-links/creates an athletes row on sign-in, so this is
    // the "admin nuked the FK" edge case. Send a polite error rather
    // than a 500 — the user can re-sign-in to re-link.
    return {
      status: 'error',
      error:
        'Your account is not linked to an athlete profile yet. Sign out and back in to relink.',
    };
  }

  const name = String(formData.get('name') ?? '').trim();
  const nicknameRaw = String(formData.get('nickname') ?? '').trim();
  const displayPreference = String(formData.get('displayPreference') ?? 'name');
  // Standard checkbox encoding — present means checked. Any value
  // (HTML checkboxes default to "on") flips it on; absent means off.
  const isPrivate = formData.get('isPrivate') != null;

  if (name.length === 0) {
    return { status: 'error', error: 'Name cannot be empty.' };
  }
  if (name.length > MAX_NAME) {
    return {
      status: 'error',
      error: `Name is too long (max ${MAX_NAME} characters).`,
    };
  }
  if (nicknameRaw.length > MAX_NICKNAME) {
    return {
      status: 'error',
      error: `Nickname is too long (max ${MAX_NICKNAME} characters).`,
    };
  }

  // Empty nickname → store NULL so the helper falls through to `name`.
  // Avoids accumulating empty strings vs nulls in the column.
  const nickname = nicknameRaw.length > 0 ? nicknameRaw : null;

  // Treat anything off the allowlist as the safe default. Catches a
  // tampered form or a future client/server enum drift.
  const safePreference = ALLOWED_PREFERENCES.has(displayPreference)
    ? displayPreference
    : 'name';

  // If the user picked "nickname" but didn't supply one, snap back to
  // 'name' so the profile doesn't render an empty header. The form UI
  // already disables the toggle when nickname is empty, but a tampered
  // POST could bypass that.
  const resolvedPreference =
    safePreference === 'nickname' && !nickname ? 'name' : safePreference;

  await db
    .update(athletes)
    .set({
      name,
      nickname,
      displayPreference: resolvedPreference,
      isPrivate,
    })
    .where(eq(athletes.id, user.athleteId));

  // Bust the cache for every public surface that renders this athlete.
  // The profile page is dynamic, but Next.js caches `/results` and
  // leaderboard pages aggressively — without these, the new display
  // name takes a while to surface.
  revalidatePath(`/athletes/${user.athleteId}`);
  revalidatePath('/me/settings');
  revalidatePath('/results');
  revalidatePath('/');

  return { status: 'success' };
}
