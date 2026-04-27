'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  athletes,
  dailyRunParticipants,
  dailyRuns,
} from '@/db/schema';
import { requireUser } from '@/lib/auth';
import {
  parseDistance,
  parseDuration,
  parseParticipants,
  parseStravaUrl,
} from '@/lib/daily-runs';

// Form-state shape mirrors the other server actions so the client can
// drive `useActionState` consistently.
export type DailyRunState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

// Width caps. Location and notes are free-form text; we cap them so a
// pasted essay doesn't bloat row size or wreck the layout.
const MAX_LOCATION = 120;
const MAX_NOTES = 500;

// Cap on how many other athletes can be tagged on a single run. The UI
// is a paste-list, not a typeahead, so a too-long list is almost
// certainly a fat-finger paste rather than a real group run.
const MAX_PARTICIPANTS = 20;

export async function addDailyRun(
  _prev: DailyRunState,
  formData: FormData,
): Promise<DailyRunState> {
  // Auth first. The form is rendered owner-only on the profile page,
  // but server actions are public endpoints — never trust the form.
  const user = await requireUser('/me');
  if (!user.athleteId) {
    return {
      status: 'error',
      error: 'Your account is not linked to an athlete profile yet.',
    };
  }

  // Distance — required.
  const distance = parseDistance(
    String(formData.get('distanceValue') ?? ''),
    String(formData.get('distanceUnit') ?? ''),
  );
  if (!distance.ok) return { status: 'error', error: distance.error };

  // Duration — optional. The helper returns 0 for empty input; we map
  // that to NULL on the column.
  const duration = parseDuration(String(formData.get('duration') ?? ''));
  if (!duration.ok) return { status: 'error', error: duration.error };

  // Strava URL — optional, validated for scheme + parseability.
  const strava = parseStravaUrl(String(formData.get('stravaUrl') ?? ''));
  if (!strava.ok) return { status: 'error', error: strava.error };

  // Location + notes — optional, bounded.
  const location = String(formData.get('location') ?? '').trim();
  if (location.length > MAX_LOCATION) {
    return {
      status: 'error',
      error: `Location is too long (max ${MAX_LOCATION} characters).`,
    };
  }
  const notes = String(formData.get('notes') ?? '').trim();
  if (notes.length > MAX_NOTES) {
    return {
      status: 'error',
      error: `Notes are too long (max ${MAX_NOTES} characters).`,
    };
  }

  // Run date — required, defaults to today on the form. We accept a
  // <input type="date"> value (YYYY-MM-DD) and resolve to midnight UTC
  // so the date itself is what's stored, independent of the viewer's
  // timezone.
  const runDateRaw = String(formData.get('runDate') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDateRaw)) {
    return { status: 'error', error: 'Pick a valid date for the run.' };
  }
  const runDate = new Date(`${runDateRaw}T00:00:00Z`);
  if (Number.isNaN(runDate.getTime())) {
    return { status: 'error', error: 'Pick a valid date for the run.' };
  }
  // Reject futures past tomorrow — small grace for crossing the
  // dateline; anything further is almost certainly a typo.
  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (runDate.getTime() > tomorrow.getTime()) {
    return { status: 'error', error: 'Run date can\u2019t be in the future.' };
  }

  // Participants — optional, parsed into a list of athlete UUIDs. We
  // verify each ID exists *and* isn't the author themselves.
  const participants = parseParticipants(
    String(formData.get('participants') ?? ''),
  );
  if (!participants.ok) {
    return { status: 'error', error: participants.error };
  }
  const tagIds = participants.ids.filter((id) => id !== user.athleteId);
  if (tagIds.length > MAX_PARTICIPANTS) {
    return {
      status: 'error',
      error: `Too many tagged athletes (max ${MAX_PARTICIPANTS}).`,
    };
  }
  if (tagIds.length > 0) {
    const found = await db
      .select({ id: athletes.id })
      .from(athletes)
      .where(inArray(athletes.id, tagIds));
    const foundIds = new Set(found.map((r) => r.id));
    const missing = tagIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      // Surface the first missing one — full list would just be
      // noise on a paste-typo.
      return {
        status: 'error',
        error: `Couldn\u2019t find an athlete with ID ${missing[0]}.`,
      };
    }
  }

  // Insert the run + the participant rows in a transaction so a
  // partial failure doesn't leave a run with stale tags.
  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(dailyRuns)
      .values({
        createdByAthleteId: user.athleteId!,
        // numeric() in Drizzle takes a string for the precision/scale
        // path — pass the raw value as a string to avoid float quirks.
        distanceValue: distance.value.toString(),
        distanceUnit: distance.unit,
        distanceMeters: distance.meters,
        durationSeconds: duration.seconds > 0 ? duration.seconds : null,
        location: location.length > 0 ? location : null,
        stravaUrl: strava.url,
        runDate,
        notes: notes.length > 0 ? notes : null,
      })
      .returning({ id: dailyRuns.id });

    if (tagIds.length > 0) {
      await tx.insert(dailyRunParticipants).values(
        tagIds.map((athleteId) => ({
          dailyRunId: inserted.id,
          athleteId,
        })),
      );
    }
  });

  // Bust the cache for every profile that now shows this run — the
  // author's, and every tagged athlete's.
  revalidatePath(`/athletes/${user.athleteId}`);
  for (const id of tagIds) revalidatePath(`/athletes/${id}`);

  return { status: 'success' };
}

// Delete by id. Only the author can delete; participants don't get to
// untag themselves in v1 (low signal/effort, easy to add later if it
// turns out people care). We scope the WHERE to (id, createdByAthleteId)
// so a tampered formData can't delete someone else's row.
export type DeleteDailyRunState = DailyRunState;

export async function deleteDailyRun(
  _prev: DeleteDailyRunState,
  formData: FormData,
): Promise<DeleteDailyRunState> {
  const user = await requireUser('/me');
  if (!user.athleteId) {
    return {
      status: 'error',
      error: 'Your account is not linked to an athlete profile yet.',
    };
  }

  const runId = String(formData.get('runId') ?? '').trim();
  if (!runId) return { status: 'error', error: 'Missing run id.' };

  // Look up the run before delete so we know which tagged-athlete
  // pages to revalidate. participants cascade-delete with the run.
  const tagged = await db
    .select({ athleteId: dailyRunParticipants.athleteId })
    .from(dailyRunParticipants)
    .where(eq(dailyRunParticipants.dailyRunId, runId));

  const deleted = await db
    .delete(dailyRuns)
    .where(
      and(
        eq(dailyRuns.id, runId),
        eq(dailyRuns.createdByAthleteId, user.athleteId),
      ),
    )
    .returning({ id: dailyRuns.id });

  if (deleted.length === 0) {
    return { status: 'error', error: 'Run not found or not yours to delete.' };
  }

  revalidatePath(`/athletes/${user.athleteId}`);
  for (const row of tagged) revalidatePath(`/athletes/${row.athleteId}`);

  return { status: 'success' };
}
