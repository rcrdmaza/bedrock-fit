'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { results } from '@/db/schema';
import {
  clearAdminCookie,
  passwordMatches,
  requireAdmin,
  setAdminCookie,
} from '@/lib/auth';

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

// Approve / reject mutate the same row, so share a helper. Both guard on
// `status = 'pending'` at the WHERE so a stale form submission (e.g. admin
// opens two tabs) can't double-apply or revive a rejected claim.
async function updatePendingStatus(
  resultId: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const updated = await db
    .update(results)
    .set(updates)
    .where(and(eq(results.id, resultId), eq(results.status, 'pending')))
    .returning({ id: results.id });
  return updated.length > 0;
}

function bustClaimCaches() {
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/results');
  // Athlete profiles render the status badge too; revalidate the
  // dynamic segment so any open profile refetches.
  revalidatePath('/athletes/[id]', 'page');
}

export async function approveClaim(formData: FormData): Promise<void> {
  await requireAdmin();
  const resultId = String(formData.get('resultId') ?? '').trim();
  if (!resultId) return;

  await updatePendingStatus(resultId, { status: 'claimed' });
  bustClaimCaches();
}

export async function rejectClaim(formData: FormData): Promise<void> {
  await requireAdmin();
  const resultId = String(formData.get('resultId') ?? '').trim();
  if (!resultId) return;

  // Revert to unclaimed and wipe the claim metadata so the next claimer
  // starts from a clean slate — we're not keeping a rejection audit log.
  await updatePendingStatus(resultId, {
    status: 'unclaimed',
    claimEmail: null,
    claimNote: null,
    claimSubmittedAt: null,
  });
  bustClaimCaches();
}
