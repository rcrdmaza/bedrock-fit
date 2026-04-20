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

// Event-level metadata. raceCategory is intentionally NOT on the event —
// a single event can contain several distances (5K + 10K + Half + Marathon),
// so the category lives on each CSV row and the results table already
// stores it per-row.
interface EventMeta {
  eventName: string;
  eventDate: Date | null;
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

interface CategoryBreakdown {
  // Canonical category name, or "Uncategorized" when the CSV row left the
  // cell blank. Purely a display label — we still persist null for blanks.
  label: string;
  count: number;
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
      // Round-tripped to the commit form via hidden inputs so the admin
      // doesn't have to re-pick the CSV to confirm.
      csvText: string;
      eventName: string;
      eventDateISO: string;
      // Diagnostic payload the UI renders.
      rows: ParsedRow[];
      matches: MatchPair[];
      newAthletes: NewAthlete[];
      totalFinishers: number;
      categories: CategoryBreakdown[];
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
  error: string | null;
} {
  const rawEventName = String(formData.get('eventName') ?? '').trim();
  const rawEventDate = String(formData.get('eventDate') ?? '').trim();

  if (!rawEventName) {
    return {
      meta: { eventName: '', eventDate: null },
      rawEventName,
      rawEventDate,
      error: 'Event name is required.',
    };
  }
  if (rawEventName.length > 200) {
    return {
      meta: { eventName: '', eventDate: null },
      rawEventName,
      rawEventDate,
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
        meta: { eventName: '', eventDate: null },
        rawEventName,
        rawEventDate,
        error: 'Event date must be a valid YYYY-MM-DD value.',
      };
    }
    eventDate = d;
  }

  return {
    meta: { eventName: rawEventName, eventDate },
    rawEventName,
    rawEventDate,
    error: null,
  };
}

// Group parsed rows by their own raceCategory so we can compute the
// `totalFinishers` pool each row is ranked within. The Lima Marathon
// might list 1,840 marathon finishers and 620 10K finishers on the same
// day — ranks and percentiles only make sense inside their own field.
// `null` is a valid bucket: CSVs with a blank category still rank against
// each other under the `Uncategorized` label.
function groupByCategory(rows: ParsedRow[]): Map<string | null, ParsedRow[]> {
  const map = new Map<string | null, ParsedRow[]>();
  for (const row of rows) {
    const key = row.raceCategory;
    const bucket = map.get(key);
    if (bucket) bucket.push(row);
    else map.set(key, [row]);
  }
  return map;
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

  // Dedup pass — unchanged by the per-category change, since an athlete
  // who runs two distances at the same event is still one athlete.
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

  const grouped = groupByCategory(rows);
  const categories: CategoryBreakdown[] = [...grouped.entries()]
    .map(([label, items]) => ({
      label: label ?? 'Uncategorized',
      count: items.length,
    }))
    // Canonical order first, then any "Uncategorized" last so the preview
    // puts the meaningful buckets up top.
    .sort((a, b) => {
      if (a.label === 'Uncategorized') return 1;
      if (b.label === 'Uncategorized') return -1;
      return b.count - a.count;
    });

  return {
    status: 'preview',
    csvText,
    eventName: meta.eventName,
    eventDateISO: meta.eventDate ? meta.eventDate.toISOString() : '',
    rows,
    matches,
    newAthletes,
    totalFinishers: rows.length,
    categories,
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

  // Pre-compute per-category totals once. Each row's totalFinishers +
  // percentile reference the size of its own bucket, not the whole CSV.
  const grouped = groupByCategory(rows);
  const totalByCategory = new Map<string | null, number>();
  for (const [label, items] of grouped) {
    totalByCategory.set(label, items.length);
  }

  // Dedup lookup (redone on commit — another claim could have landed
  // between preview and confirm, and we'd rather match than double-create).
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

        for (const row of inserted) {
          idByKey.set(normalizeName(row.name), row.id);
        }
        athletesCreated = inserted.length;
      }

      const resultValues = rows.map((row) => {
        const key = normalizeName(row.name);
        const athleteId = idByKey.get(key);
        if (!athleteId) {
          throw new Error(`Missing athlete id for "${row.name}"`);
        }
        const categoryTotal = totalByCategory.get(row.raceCategory) ?? 0;
        return {
          athleteId,
          eventName: meta.eventName,
          eventDate: meta.eventDate,
          raceCategory: row.raceCategory,
          finishTime: row.finishTimeSeconds,
          overallRank: row.overallRank,
          totalFinishers: categoryTotal,
          percentile: computePercentile(row.overallRank, categoryTotal),
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
