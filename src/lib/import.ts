// CSV parsing + validation for the admin bulk-import flow.
//
// Intentionally dependency-free: our strict schema (name, finish_time,
// overall_rank, gender, location) doesn't need the edge cases a general CSV
// library handles. We implement just enough to round-trip the output of a
// spreadsheet's "Save as CSV": double-quote escaping, embedded commas in
// quoted fields, CRLF line endings, and a stripped UTF-8 BOM.
//
// Pure and client-safe — no db imports here. Callers run this, then hand
// the parsed rows to a server action that does the actual inserts.

// Columns that must appear in the header, in this order. Keeping them
// positional (rather than name-mapped) preserves the "spreadsheet export"
// ergonomics — admins can Save As CSV and upload as-is without renaming.
export const REQUIRED_IMPORT_COLUMNS = [
  'name',
  'finish_time',
  'overall_rank',
  'gender',
  'location',
  'race_category',
] as const;

// Tail-optional columns. If present they must appear in this order, but
// CSVs that predate the columns (6-column shape) still parse fine.
// Future additions go here too — each one keeps old files valid.
export const OPTIONAL_IMPORT_COLUMNS = ['bib', 'event_country'] as const;

export const IMPORT_COLUMNS = [
  ...REQUIRED_IMPORT_COLUMNS,
  ...OPTIONAL_IMPORT_COLUMNS,
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

// Canonical race categories we render and rank against. Anything else in
// the CSV's race_category column is rejected so a typo doesn't create a
// new de-facto bucket. The blank value is allowed and stored as null
// (race_category is a nullable text column, not an enum).
export const CANONICAL_CATEGORIES = [
  '5K',
  '10K',
  'Half Marathon',
  'Marathon',
] as const;
const CANONICAL_SET: ReadonlySet<string> = new Set(CANONICAL_CATEGORIES);

// A row that passed shape validation. finish_time has already been
// normalized to seconds; blanks in optional fields become null.
export interface ParsedRow {
  lineNumber: number; // 1-indexed, counting the header as line 1
  name: string;
  finishTimeSeconds: number;
  overallRank: number | null;
  gender: string | null;
  location: string | null;
  // null when the CSV cell was blank; otherwise one of
  // CANONICAL_CATEGORIES. We canonicalize on parse so downstream
  // grouping doesn't have to worry about case variants.
  raceCategory: string | null;
  // Bib as typed by the timing export — free-form string, capped to 32
  // chars to prevent absurd payloads. Blank → null.
  bib: string | null;
  // Event country — free-form ("Peru", "PE", "United States"). Capped
  // at 100 chars. Blank → null. The admin is expected to keep this
  // consistent within one import; we don't canonicalize.
  eventCountry: string | null;
}

export interface RowError {
  lineNumber: number;
  // Human-readable, admin-facing. Short enough to render in a list.
  message: string;
  // The raw cell value (or the whole row) that failed, so the admin can
  // locate it in their source spreadsheet without opening the CSV.
  offendingValue?: string;
}

export interface ParseOutcome {
  rows: ParsedRow[];
  errors: RowError[];
}

// Strip a leading BOM — Excel / Sheets love to write one. We only tolerate
// it once at the start; anywhere else and it's a corruption the admin
// should fix in their source.
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// Tiny state-machine CSV tokenizer. Handles:
//   - Quoted fields that may contain commas, CR, LF, and "" escapes
//   - CR, LF, or CRLF line terminators
//   - Trailing blank line (ignored)
// Returns rows of raw string fields. No type coercion.
export function tokenize(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const src = stripBom(text);

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          // Escaped quote inside a quoted field.
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (c === '\n' || c === '\r') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      // Swallow the second half of a CRLF.
      if (c === '\r' && src[i + 1] === '\n') i++;
      continue;
    }
    field += c;
  }
  // Flush the final row if the file didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop any pure-blank trailing rows (common with spreadsheet exports).
  while (
    rows.length > 0 &&
    rows[rows.length - 1].every((f) => f.trim().length === 0)
  ) {
    rows.pop();
  }
  return rows;
}

// "1:23:45" → 5025, "23:45" → 1425. Rejects non-numeric components and
// anything out of range (>= 24h, minutes/seconds >= 60). We don't support
// fractional seconds — race chip times report to the nearest second.
export function parseFinishTime(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  let h = 0,
    m = 0,
    s = 0;
  if (nums.length === 3) [h, m, s] = nums as [number, number, number];
  else [m, s] = nums as [number, number];
  if (h >= 24 || m >= 60 || s >= 60) return null;
  const total = h * 3600 + m * 60 + s;
  if (total <= 0) return null;
  return total;
}

// Normalize an athlete name to a dedup key. Case-insensitive, whitespace
// collapsed. Unicode NFC so "José" and the decomposed "Jose\u0301" match.
export function normalizeName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Map a free-form category cell ("10k", "10 K", "half marathon", "MARATHON")
// to its canonical form from CANONICAL_CATEGORIES. Returns null if the
// string doesn't match any canonical value so the caller can raise a
// row-level validation error. We don't want silent fuzzy matches here —
// "5km" that isn't "5K" exactly, for example, should be rejected and
// corrected in the source CSV rather than guessed at.
export function canonicalizeCategory(raw: string): string | null {
  const compact = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!compact) return null;
  for (const canonical of CANONICAL_CATEGORIES) {
    if (canonical.toLowerCase() === compact) return canonical;
  }
  // Tolerate "10 k" → "10K" and "10km" → "10K" for the distance-only
  // buckets. Half Marathon / Marathon are written out, so they only
  // match the exact string above.
  const distanceMatch = compact.match(/^(\d+)\s*(k|km)?$/);
  if (distanceMatch) {
    const withK = `${distanceMatch[1]}K`;
    if (CANONICAL_SET.has(withK)) return withK;
  }
  return null;
}

// Header validator. Returns either an error message, or a map from the
// optional-column name to the index in the row where it lives (or -1 if
// the CSV omitted it). The row parser consults that map so callers can
// still upload 6-column CSVs produced before the optional columns
// existed.
interface HeaderShape {
  optionalIndex: Record<(typeof OPTIONAL_IMPORT_COLUMNS)[number], number>;
}

function matchesHeader(header: string[]): HeaderShape | string {
  const required = REQUIRED_IMPORT_COLUMNS;
  if (header.length < required.length) {
    return `Header has ${header.length} columns but expected at least ${required.length} (${required.join(', ')}).`;
  }
  for (let i = 0; i < required.length; i++) {
    const got = header[i]?.trim().toLowerCase();
    const want = required[i];
    if (got !== want) {
      return `Header column ${i + 1} must be "${want}" but got "${header[i] ?? ''}".`;
    }
  }

  // Anything past the required prefix must come from the optional list
  // and appear in canonical order. Unknown trailing columns are rejected
  // so a typo ("event_cntry") doesn't silently drop data.
  const optionalIndex: Record<
    (typeof OPTIONAL_IMPORT_COLUMNS)[number],
    number
  > = {
    bib: -1,
    event_country: -1,
  };
  const remainder = header
    .slice(required.length)
    .map((h) => h.trim().toLowerCase());
  let nextAllowed = 0;
  for (let i = 0; i < remainder.length; i++) {
    const name = remainder[i];
    const match = OPTIONAL_IMPORT_COLUMNS.indexOf(
      name as (typeof OPTIONAL_IMPORT_COLUMNS)[number],
    );
    if (match === -1) {
      return `Header column ${required.length + i + 1} "${header[required.length + i] ?? ''}" is not one of: ${OPTIONAL_IMPORT_COLUMNS.join(', ')}.`;
    }
    if (match < nextAllowed) {
      return `Optional columns must appear in order: ${OPTIONAL_IMPORT_COLUMNS.join(', ')}.`;
    }
    optionalIndex[OPTIONAL_IMPORT_COLUMNS[match]] = required.length + i;
    nextAllowed = match + 1;
  }
  return { optionalIndex };
}

// Parse + validate an uploaded CSV. Blank rows in the middle of the file
// are treated as errors (to catch accidental double-enter during editing)
// rather than silently skipped — silence here costs more than a clear message.
export function parseImportCsv(text: string): ParseOutcome {
  const rows = tokenize(text);
  const errors: RowError[] = [];
  const parsed: ParsedRow[] = [];

  if (rows.length === 0) {
    errors.push({ lineNumber: 1, message: 'File is empty.' });
    return { rows: parsed, errors };
  }

  const headerResult = matchesHeader(rows[0]);
  if (typeof headerResult === 'string') {
    errors.push({ lineNumber: 1, message: headerResult });
    // Without a valid header we can't trust any row — bail early.
    return { rows: parsed, errors };
  }
  const { optionalIndex } = headerResult;

  for (let r = 1; r < rows.length; r++) {
    const line = r + 1;
    const row = rows[r];

    if (row.every((f) => f.trim().length === 0)) {
      errors.push({
        lineNumber: line,
        message: 'Row is blank. Remove the empty line.',
      });
      continue;
    }

    const [
      name,
      finishTimeRaw,
      rankRaw,
      genderRaw,
      locationRaw,
      categoryRaw,
    ] = [
      row[0] ?? '',
      row[1] ?? '',
      row[2] ?? '',
      row[3] ?? '',
      row[4] ?? '',
      row[5] ?? '',
    ];
    const bibRaw =
      optionalIndex.bib >= 0 ? row[optionalIndex.bib] ?? '' : '';
    const countryRaw =
      optionalIndex.event_country >= 0
        ? row[optionalIndex.event_country] ?? ''
        : '';

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.push({ lineNumber: line, message: 'name is required.' });
      continue;
    }

    const seconds = parseFinishTime(finishTimeRaw);
    if (seconds == null) {
      errors.push({
        lineNumber: line,
        message:
          'finish_time must look like H:MM:SS or MM:SS with positive values.',
        offendingValue: finishTimeRaw,
      });
      continue;
    }

    let overallRank: number | null = null;
    const rankTrim = rankRaw.trim();
    if (rankTrim) {
      if (!/^\d+$/.test(rankTrim) || Number(rankTrim) < 1) {
        errors.push({
          lineNumber: line,
          message: 'overall_rank must be a positive whole number or blank.',
          offendingValue: rankRaw,
        });
        continue;
      }
      overallRank = Number(rankTrim);
    }

    const gender = genderRaw.trim() || null;
    const location = locationRaw.trim() || null;

    // Canonicalize the category. Blank is allowed (null). Known categories
    // are matched case-insensitively so "10k", "10K", and "10 K" all
    // normalize to "10K" — then validated against the canonical set.
    let raceCategory: string | null = null;
    const categoryTrim = categoryRaw.trim();
    if (categoryTrim) {
      const normalized = canonicalizeCategory(categoryTrim);
      if (!normalized) {
        errors.push({
          lineNumber: line,
          message: `race_category must be blank or one of: ${CANONICAL_CATEGORIES.join(', ')}.`,
          offendingValue: categoryRaw,
        });
        continue;
      }
      raceCategory = normalized;
    }

    // Bib: free-form, capped at 32 chars. We don't validate the format
    // because timing systems disagree ("042" vs "42", "E021", "W-17").
    const bibTrim = bibRaw.trim();
    let bib: string | null = null;
    if (bibTrim) {
      if (bibTrim.length > 32) {
        errors.push({
          lineNumber: line,
          message: 'bib must be 32 characters or fewer.',
          offendingValue: bibRaw,
        });
        continue;
      }
      bib = bibTrim;
    }

    // Event country: free-form, capped at 100 chars.
    const countryTrim = countryRaw.trim();
    let eventCountry: string | null = null;
    if (countryTrim) {
      if (countryTrim.length > 100) {
        errors.push({
          lineNumber: line,
          message: 'event_country must be 100 characters or fewer.',
          offendingValue: countryRaw,
        });
        continue;
      }
      eventCountry = countryTrim;
    }

    parsed.push({
      lineNumber: line,
      name: trimmedName,
      finishTimeSeconds: seconds,
      overallRank,
      gender,
      location,
      raceCategory,
      bib,
      eventCountry,
    });
  }

  return { rows: parsed, errors };
}

// Percentile convention used across the app: higher is better. `#1 of 100`
// beats 99 others → percentile 99.00, which the UI renders as "Top 1.0%".
// Returns a numeric string so it can be inserted directly into the
// numeric(5,2) column without float-to-string rounding surprises.
export function computePercentile(
  rank: number | null,
  totalFinishers: number,
): string | null {
  if (rank == null || totalFinishers <= 0) return null;
  const raw = (100 * (totalFinishers - rank)) / totalFinishers;
  // Clamp to the column's range [0, 100] defensively.
  const clamped = Math.max(0, Math.min(100, raw));
  return clamped.toFixed(2);
}
