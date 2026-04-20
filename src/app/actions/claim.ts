'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { results } from '@/db/schema';

export type ClaimState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

// Bulk-claim state includes how many rows actually flipped so the UI can
// tell the user "Claimed 3 results" vs. "Claimed 2 — one was already
// pending." Separate from ClaimState to keep the single-claim flow lean.
export type BulkClaimState =
  | { status: 'idle' }
  | { status: 'success'; claimed: number; skipped: number }
  | { status: 'error'; error: string };

// Cap per submission. A single athlete at one multi-distance event has
// at most a handful of rows; anything beyond this is almost certainly a
// mistake or abuse. Matches what fits on a profile page without paging.
const MAX_BULK_CLAIM = 20;

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

// Batch variant used by the athlete profile page. One email/note covers
// every selected unclaimed row — an athlete submits proof once for the
// Marathon + Half + 10K they ran at the same event instead of filing a
// claim per row. The update WHERE guard keeps this idempotent: rows
// that were already pending/claimed are silently skipped rather than
// re-flipped.
export async function claimResults(
  _prev: BulkClaimState,
  formData: FormData,
): Promise<BulkClaimState> {
  const email = String(formData.get('email') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  // Multi-value form field — every checked row writes a "resultIds" entry.
  const rawIds = formData.getAll('resultIds').map((v) => String(v).trim());

  if (rawIds.length === 0) {
    return { status: 'error', error: 'Select at least one result to claim.' };
  }
  if (rawIds.length > MAX_BULK_CLAIM) {
    return {
      status: 'error',
      error: `Too many results selected (max ${MAX_BULK_CLAIM}).`,
    };
  }
  // De-dup and drop blanks without trusting the client to have done so.
  const ids = [...new Set(rawIds.filter(Boolean))];
  if (ids.length === 0) {
    return { status: 'error', error: 'Select at least one result to claim.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: 'error', error: 'Please enter a valid email address.' };
  }
  if (note.length > 500) {
    return { status: 'error', error: 'Keep the note under 500 characters.' };
  }

  const submittedAt = new Date();

  // inArray + status=unclaimed guard means already-pending / already-
  // claimed rows drop out — we return `skipped` so the UI can explain
  // partial success without a second query.
  const updated = await db
    .update(results)
    .set({
      status: 'pending',
      claimEmail: email,
      claimNote: note || null,
      claimSubmittedAt: submittedAt,
    })
    .where(and(inArray(results.id, ids), eq(results.status, 'unclaimed')))
    .returning({ id: results.id });

  if (updated.length === 0) {
    return {
      status: 'error',
      error: 'None of the selected results are still available to claim.',
    };
  }

  // Same cache busts as the single-claim path, plus the athlete page
  // where the bulk flow lives.
  revalidatePath('/');
  revalidatePath('/results');
  revalidatePath('/athletes/[id]', 'page');

  return {
    status: 'success',
    claimed: updated.length,
    skipped: ids.length - updated.length,
  };
}
