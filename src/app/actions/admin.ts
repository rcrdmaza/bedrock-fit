'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { results } from '@/db/schema';
import {
  clearAdminCookie,
  passwordMatches,
  requireAdmin,
  setAdminCookie,
} from '@/lib/auth';

// Hard upper bound for a single approve/reject batch. Mirrors the cap
// on the athlete-side bulk-claim flow — an admin should only ever be
// resolving rows from one submission at a time.
const MAX_BATCH = 50;

export type LoginState =
  | { status: 'idle' }
  | { status: 'error'; error: string };

export async function adminLogin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  if (!password) {
    return { status: 'error', error: 'Enter the admin password.' };
  }
  if (!passwordMatches(password)) {
    // Intentionally vague — don't leak whether the env var is set.
    return { status: 'error', error: 'Incorrect password.' };
  }

  await setAdminCookie();
  // redirect() throws, so no `return` needed after this point.
  redirect('/admin');
}

export async function adminLogout(): Promise<void> {
  await clearAdminCookie();
  redirect('/admin/login');
}

// Approve / reject mutate the same rows, so share a helper. Both guard
// on `status = 'pending'` at the WHERE so a stale form submission
// (e.g. admin opens two tabs, or the claim was already withdrawn)
// can't double-apply or revive a rejected claim.
async function updatePendingBatch(
  resultIds: string[],
  updates: Record<string, unknown>,
): Promise<number> {
  if (resultIds.length === 0) return 0;

  const updated = await db
    .update(results)
    .set(updates)
    .where(
      and(inArray(results.id, resultIds), eq(results.status, 'pending')),
    )
    .returning({ id: results.id });
  return updated.length;
}

function bustClaimCaches() {
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/results');
  // Athlete profiles render the status badge too; revalidate the
  // dynamic segment so any open profile refetches.
  revalidatePath('/athletes/[id]', 'page');
}

// Pull result ids out of a form, de-dup, drop blanks, enforce the cap.
// A single-row approve just posts one `resultIds` input — no divergent
// code paths between "one claim" and "a batch of eight."
function readResultIds(formData: FormData): string[] {
  const raw = formData.getAll('resultIds').map((v) => String(v).trim());
  const ids = [...new Set(raw.filter(Boolean))];
  return ids.slice(0, MAX_BATCH);
}

export async function approveClaims(formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = readResultIds(formData);
  if (ids.length === 0) return;

  await updatePendingBatch(ids, { status: 'claimed' });
  bustClaimCaches();
}

export async function rejectClaims(formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = readResultIds(formData);
  if (ids.length === 0) return;

  // Revert to unclaimed and wipe the claim metadata so the next claimer
  // starts from a clean slate — we're not keeping a rejection audit log.
  await updatePendingBatch(ids, {
    status: 'unclaimed',
    claimEmail: null,
    claimNote: null,
    claimSubmittedAt: null,
  });
  bustClaimCaches();
}
