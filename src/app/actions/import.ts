'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, results } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import {
  computePercentile,
  normalizeName,
  parseImportCsv,
  type ParsedRow,
  type RowError,
} from '@/lib/import';

// Hard cap on file size to keep pathological uploads from eating server
// memory. 5 MB comfortably fits a 50k-finisher race; anything larger is
// probably a mistake or needs a streaming flow we haven't built yet.
const MAX_CSV_BYTES = 5 * 1024 * 1024;

const ALLOWED_CATEGORIES = new Set([
  '5K',
  '10K',
  'Half Marathon',
  'Marathon',
  'Other',
]);

// Shared metadata vector — the preview form collects these, the commit
// form round-trips them in hidden inputs. Validated in both actions so
// neither trusts the other to have done its job.
interface EventMeta {
  eventName: string;
  eventDate: Date | null;
  raceCategory: string | null;
}

interface MatchPair {
  lineNumber: number;
  csvName: string;
  existingAthleteId: string;
  existingAthleteName: string;
}

interface NewAthlete {
  normalizedName: string;
  displayName: string;
  rowCount: number;
}

export type PreviewState =
  | { status: 'idle' }
  | {
      status: 'error';
      error: string;
      rowErrors?: RowError[];
    }
  | {
      status: 'preview';
      // Round-tripped to the commit form via hidden inputs.
      csvText: string;
      eventName: string;
      eventDateISO: string;
      raceCategory: string;
      // Diagnostic payload the UI renders.
      rows: ParsedRow[];
      matches: MatchPair[];
      newAthletes: NewAthlete[];
      totalFinishers: number;
    };

export type CommitState =
  | { status: 'idle' }
  | { status: 'error'; error: string }
  | {
      status: 'success';
      rowsInserted: number;
      athletesCreated: number;
      eventName: string;
    };

function readEventMeta(formData: FormData): {
  meta: EventMeta;
  rawEventName: string;
  rawEventDate: string;
  rawCategory: string;
  error: string | null;
} {
  const rawEventName = String(formData.get('eventName') ?? '').trim();
  const rawEventDate = String(formData.get('eventDate') ?? '').trim();
  const rawCategory = String(formData.get('raceCategory') ?? '').trim();

  if (!rawEventName) {
    return {
      meta: { eventName: '', eventDate: null, raceCategory: null },
      rawEventName,
      rawEventDate,
      rawCategory,
      error: 'Event name is required.',
    };
  }
  if (rawEventName.length > 200) {
    return {
      meta: { eventName: '', eventDate: null, raceCategory: null },
      rawEventName,
      rawEventDate,
      rawCategory,
      error: 'Event name is too long (max 200 chars).',
    };
  }

  let eventDate: Date | null = null;
  if (rawEventDate) {
    // HTML <input type="date"> yields "YYYY-MM-DD". new Date() interprets
    // that as UTC midnight, which is what we want for a date-only field.
    const d = new Date(rawEventDate);
    if (Number.isNaN(d.getTime())) {
      return {
        meta: { eventName: '', eventDate: null, raceCategory: null },
        rawEventName,
        rawEventDate,
        rawCategory,
        error: 'Event date must be a valid YYYY-MM-DD value.',
      };
    }
    eventDate = d;
  }

  let raceCategory: string | null = null;
  if (rawCategory) {
    if (!ALLOWED_CATEGORIES.has(rawCategory)) {
      return {
        meta: { eventName: '', eventDate: null, raceCategory: null },
        rawEventName,
        rawEventDate,
        rawCategory,
        error: `Race category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}.`,
      };
    }
    // Persist null rather than the "Other" placeholder — the column is
    // nullable and "Other" carries no useful info downstream.
    raceCategory = rawCategory === 'Other' ? null : rawCategory;
  }

  return {
    meta: { eventName: rawEventName, eventDate, raceCategory },
    rawEventName,
    rawEventDate,
    rawCategory,
    error: null,
  };
}

// Look up existing athletes whose normalized names match anything in `needles`.
// We pre-filter in SQL with a loose lower(name) match, then refine in JS
// using the same normalizeName() the rest of the app uses — this keeps
// the dedup contract identical everywhere and survives athletes whose
// names contain double spaces or stray whitespace.
async function findExistingAthletes(
  needles: Set<string>,
): Promise<Map<string, { id: string; name: string }>> {
  const map = new Map<string, { id: string; name: string }>();
  if (needles.size === 0) return map;

  // Coarse SQL filter: lowercased names that land in the candidate set.
  // We pass a Postgres text[] via ANY for index-friendly matching.
  const loweredNeedles = [...needles].map((n) =>
    n.toLowerCase().replace(/\s+/g, ' ').trim(),
  );

  // inArray generates `expr IN (?, ?, ...)` which binds each value as a
  // separate positional parameter — compatible with postgres-js without
  // needing a pg-side ARRAY cast.
  const candidates = await db
    .select({ id: athletes.id, name: athletes.name })
    .from(athletes)
    .where(inArray(sql`lower(trim(${athletes.name}))`, loweredNeedles));

  for (const row of candidates) {
    const key = normalizeName(row.name);
    if (needles.has(key) && !map.has(key)) {
      map.set(key, { id: row.id, name: row.name });
    }
  }
  return map;
}

export async function previewImport(
  _prev: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  await requireAdmin();

  const metaResult = readEventMeta(formData);
  if (metaResult.error) {
    return { status: 'error', error: metaResult.error };
  }
  const { meta } = metaResult;

  const file = formData.get('csvFile');
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', error: 'Upload a CSV file.' };
  }
  if (file.size > MAX_CSV_BYTES) {
    return {
      status: 'error',
      error: `CSV is too large (max ${MAX_CSV_BYTES / 1024 / 1024} MB).`,
    };
  }

  const csvText = await file.text();
  const { rows, errors } = parseImportCsv(csvText);

  if (errors.length > 0) {
    return {
      status: 'error',
      error: `Found ${errors.length} issue${errors.length === 1 ? '' : 's'} in the CSV. Fix and re-upload.`,
      rowErrors: errors,
    };
  }
  if (rows.length === 0) {
    return {
      status: 'error',
      error: 'CSV has a valid header but no finisher rows.',
    };
  }

  // Bucket rows by normalized name, tracking how many times each appears
  // in the CSV — useful both for the dedup display and for warning on
  // accidental duplicates within the same file (shared runners is fine;
  // double-entered rows are not, but we surface the count either way).
  const byKey = new Map<string, { displayName: string; lines: number[] }>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    const bucket = byKey.get(key);
    if (bucket) bucket.lines.push(row.lineNumber);
    else byKey.set(key, { displayName: row.name, lines: [row.lineNumber] });
  }

  const existing = await findExistingAthletes(new Set(byKey.keys()));

  const matches: MatchPair[] = [];
  const newAthletes: NewAthlete[] = [];
  for (const [key, info] of byKey) {
    const hit = existing.get(key);
    if (hit) {
      // Only record the first occurrence per athlete — the UI doesn't
      // need to list the same match pair multiple times, it'll just say
      // how many rows will attach.
      matches.push({
        lineNumber: info.lines[0],
        csvName: info.displayName,
        existingAthleteId: hit.id,
        existingAthleteName: hit.name,
      });
    } else {
      newAthletes.push({
        normalizedName: key,
        displayName: info.displayName,
        rowCount: info.lines.length,
      });
    }
  }

  return {
    status: 'preview',
    csvText,
    eventName: meta.eventName,
    eventDateISO: meta.eventDate ? meta.eventDate.toISOString() : '',
    raceCategory: meta.raceCategory ?? '',
    rows,
    matches,
    newAthletes,
    totalFinishers: rows.length,
  };
}

export async function commitImport(
  _prev: CommitState,
  formData: FormData,
): Promise<CommitState> {
  await requireAdmin();

  // Metadata comes back as plain strings from hidden inputs. Re-validate
  // rather than trust the preview's output — the admin could have edited
  // the DOM, and we want one code path for validation either way.
  const metaResult = readEventMeta(formData);
  if (metaResult.error) return { status: 'error', error: metaResult.error };
  const { meta } = metaResult;

  const csvText = String(formData.get('csvText') ?? '');
  if (!csvText) return { status: 'error', error: 'CSV payload was missing.' };
  if (csvText.length > MAX_CSV_BYTES) {
    return { status: 'error', error: 'CSV payload is too large.' };
  }

  const { rows, errors } = parseImportCsv(csvText);
  if (errors.length > 0) {
    return {
      status: 'error',
      error: 'CSV failed validation on commit — re-upload and try again.',
    };
  }
  if (rows.length === 0) {
    return { status: 'error', error: 'CSV has no finisher rows to import.' };
  }

  const totalFinishers = rows.length;

  // Same dedup lookup as preview. We redo it instead of trusting hidden
  // state: between preview and commit someone could have claimed the
  // same name via another route, and we'd rather match than double-create.
  const keys = new Set(rows.map((r) => normalizeName(r.name)));
  const existing = await findExistingAthletes(keys);

  let athletesCreated = 0;
  let rowsInserted = 0;

  try {
    await db.transaction(async (tx) => {
      // Insert all new athletes in one batch, then build the id map.
      const newAthletes: {
        name: string;
        gender: string | null;
        location: string | null;
        key: string;
      }[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        const key = normalizeName(row.name);
        if (existing.has(key) || seen.has(key)) continue;
        seen.add(key);
        newAthletes.push({
          name: row.name,
          gender: row.gender,
          location: row.location,
          key,
        });
      }

      const idByKey = new Map<string, string>();
      for (const [k, v] of existing) idByKey.set(k, v.id);

      if (newAthletes.length > 0) {
        const inserted = await tx
          .insert(athletes)
          .values(
            newAthletes.map((a) => ({
              name: a.name,
              gender: a.gender,
              location: a.location,
            })),
          )
          .returning({ id: athletes.id, name: athletes.name });

        // Order of returning rows matches values order on postgres-js,
        // but we use name-match to be resilient to future reordering.
        for (let i = 0; i < inserted.length; i++) {
          const row = inserted[i];
          const key = normalizeName(row.name);
          idByKey.set(key, row.id);
        }
        athletesCreated = inserted.length;
      }

      const resultValues = rows.map((row) => {
        const key = normalizeName(row.name);
        const athleteId = idByKey.get(key);
        if (!athleteId) {
          // Shouldn't happen — existing + newly inserted covers every
          // unique key. Throw to abort the transaction if it somehow does.
          throw new Error(`Missing athlete id for "${row.name}"`);
        }
        return {
          athleteId,
          eventName: meta.eventName,
          eventDate: meta.eventDate,
          raceCategory: meta.raceCategory,
          finishTime: row.finishTimeSeconds,
          overallRank: row.overallRank,
          totalFinishers,
          percentile: computePercentile(row.overallRank, totalFinishers),
          status: 'unclaimed' as const,
        };
      });

      const insertedResults = await tx
        .insert(results)
        .values(resultValues)
        .returning({ id: results.id });
      rowsInserted = insertedResults.length;
    });
  } catch (e) {
    return {
      status: 'error',
      error: `Import failed: ${(e as Error).message}`,
    };
  }

  // Fresh rows land everywhere results are listed.
  revalidatePath('/');
  revalidatePath('/results');
  revalidatePath('/admin');
  revalidatePath('/athletes/[id]', 'page');

  // Send the admin back to the dashboard with a success flag, which the
  // /admin page renders as a top banner for the next render.
  redirect(
    `/admin?imported=${rowsInserted}&created=${athletesCreated}&event=${encodeURIComponent(meta.eventName)}`,
  );
}
