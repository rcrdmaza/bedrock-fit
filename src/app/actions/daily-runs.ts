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
  type DistanceUnit,
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

// Shared parse + validate path. Both addDailyRun and updateDailyRun
// run the exact same checks against form fields, so the logic lives
// here once. Returns either an error (caller propagates verbatim) or
// the canonical values to write — including the resolved tag IDs and a
// caller-provided `selfId` excluded from the tag list.
type ParsedRun = {
  distance: { value: number; unit: DistanceUnit; meters: number };
  durationSeconds: number | null;
  stravaUrl: string | null;
  location: string | null;
  notes: string | null;
  runDate: Date;
  tagIds: string[];
};
type ParseResult =
  | { ok: true; values: ParsedRun }
  | { ok: false; error: string };

async function parseRunFormData(
  formData: FormData,
  selfId: string,
): Promise<ParseResult> {
  const distance = parseDistance(
    String(formData.get('distanceValue') ?? ''),
    String(formData.get('distanceUnit') ?? ''),
  );
  if (!distance.ok) return { ok: false, error: distance.error };

  const duration = parseDuration(String(formData.get('duration') ?? ''));
  if (!duration.ok) return { ok: false, error: duration.error };

  const strava = parseStravaUrl(String(formData.get('stravaUrl') ?? ''));
  if (!strava.ok) return { ok: false, error: strava.error };

  const locationRaw = String(formData.get('location') ?? '').trim();
  if (locationRaw.length > MAX_LOCATION) {
    return {
      ok: false,
      error: `Location is too long (max ${MAX_LOCATION} characters).`,
    };
  }
  const notesRaw = String(formData.get('notes') ?? '').trim();
  if (notesRaw.length > MAX_NOTES) {
    return {
      ok: false,
      error: `Notes are too long (max ${MAX_NOTES} characters).`,
    };
  }

  const runDateRaw = String(formData.get('runDate') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDateRaw)) {
    return { ok: false, error: 'Pick a valid date for the run.' };
  }
  const runDate = new Date(`${runDateRaw}T00:00:00Z`);
  if (Number.isNaN(runDate.getTime())) {
    return { ok: false, error: 'Pick a valid date for the run.' };
  }
  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (runDate.getTime() > tomorrow.getTime()) {
    return { ok: false, error: 'Run date can\u2019t be in the future.' };
  }

  const participants = parseParticipants(
    String(formData.get('participants') ?? ''),
  );
  if (!participants.ok) {
    return { ok: false, error: participants.error };
  }
  const tagIds = participants.ids.filter((id) => id !== selfId);
  if (tagIds.length > MAX_PARTICIPANTS) {
    return {
      ok: false,
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
      return {
        ok: false,
        error: `Couldn\u2019t find an athlete with ID ${missing[0]}.`,
      };
    }
  }

  return {
    ok: true,
    values: {
      distance: {
        value: distance.value,
        unit: distance.unit,
        meters: distance.meters,
      },
      durationSeconds: duration.seconds > 0 ? duration.seconds : null,
      stravaUrl: strava.url,
      location: locationRaw.length > 0 ? locationRaw : null,
      notes: notesRaw.length > 0 ? notesRaw : null,
      runDate,
      tagIds,
    },
  };
}

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

  const parsed = await parseRunFormData(formData, user.athleteId);
  if (!parsed.ok) return { status: 'error', error: parsed.error };
  const { distance, durationSeconds, stravaUrl, location, notes, runDate, tagIds } =
    parsed.values;

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
        durationSeconds,
        location,
        stravaUrl,
        runDate,
        notes,
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

// Update an existing run by id. Same validation surface as add; only
// the author can edit. Participants are replaced wholesale: easier to
// reason about than diffing the current set, and the unique constraint
// on (run, athlete) means we can't accidentally double-tag in the
// same transaction.
export async function updateDailyRun(
  _prev: DailyRunState,
  formData: FormData,
): Promise<DailyRunState> {
  const user = await requireUser('/me');
  if (!user.athleteId) {
    return {
      status: 'error',
      error: 'Your account is not linked to an athlete profile yet.',
    };
  }

  const runId = String(formData.get('runId') ?? '').trim();
  if (!runId) return { status: 'error', error: 'Missing run id.' };

  // Verify ownership *before* parsing so we don't waste a DB roundtrip
  // for someone tampering with another user's run id.
  const existing = await db
    .select({ id: dailyRuns.id, createdByAthleteId: dailyRuns.createdByAthleteId })
    .from(dailyRuns)
    .where(eq(dailyRuns.id, runId))
    .limit(1);
  if (existing.length === 0) {
    return { status: 'error', error: 'Run not found.' };
  }
  if (existing[0].createdByAthleteId !== user.athleteId) {
    return { status: 'error', error: 'Not your run to edit.' };
  }

  const parsed = await parseRunFormData(formData, user.athleteId);
  if (!parsed.ok) return { status: 'error', error: parsed.error };
  const { distance, durationSeconds, stravaUrl, location, notes, runDate, tagIds } =
    parsed.values;

  // We need the *previous* tag set so we can revalidate athletes who
  // were on the run and aren't anymore — their profiles need to drop
  // the row from the listing.
  const previousTags = await db
    .select({ athleteId: dailyRunParticipants.athleteId })
    .from(dailyRunParticipants)
    .where(eq(dailyRunParticipants.dailyRunId, runId));

  await db.transaction(async (tx) => {
    await tx
      .update(dailyRuns)
      .set({
        distanceValue: distance.value.toString(),
        distanceUnit: distance.unit,
        distanceMeters: distance.meters,
        durationSeconds,
        location,
        stravaUrl,
        runDate,
        notes,
      })
      .where(eq(dailyRuns.id, runId));

    // Wipe + re-insert the tag set. Cheaper to reason about than a
    // computed diff; the row count here is tiny (cap of 20).
    await tx
      .delete(dailyRunParticipants)
      .where(eq(dailyRunParticipants.dailyRunId, runId));
    if (tagIds.length > 0) {
      await tx.insert(dailyRunParticipants).values(
        tagIds.map((athleteId) => ({
          dailyRunId: runId,
          athleteId,
        })),
      );
    }
  });

  // Revalidate the union of old + new tag sets so nobody's profile
  // lags behind the edit.
  const affected = new Set<string>([
    user.athleteId!,
    ...previousTags.map((r) => r.athleteId),
    ...tagIds,
  ]);
  for (const id of affected) revalidatePath(`/athletes/${id}`);

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
