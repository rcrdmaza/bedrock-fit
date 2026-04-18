'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { results } from '@/db/schema';

export type ClaimState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

// Forgiving regex — real validation happens when we email them.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function claimResult(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const resultId = String(formData.get('resultId') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();

  if (!resultId) {
    return { status: 'error', error: 'Missing result id.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: 'error', error: 'Please enter a valid email address.' };
  }
  if (note.length > 500) {
    return { status: 'error', error: 'Keep the note under 500 characters.' };
  }

  // Only flip unclaimed → pending. The WHERE guard prevents double-claims
  // or claiming a row that an admin has already resolved.
  const updated = await db
    .update(results)
    .set({
      status: 'pending',
      claimEmail: email,
      claimNote: note || null,
      claimSubmittedAt: new Date(),
    })
    .where(and(eq(results.id, resultId), eq(results.status, 'unclaimed')))
    .returning({ id: results.id });

  if (updated.length === 0) {
    return {
      status: 'error',
      error: 'This result is no longer available to claim.',
    };
  }

  // Bust the cache on every page that renders result cards.
  revalidatePath('/');
  revalidatePath('/results');
  return { status: 'success' };
}
