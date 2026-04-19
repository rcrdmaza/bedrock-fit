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

export const IMPORT_COLUMNS = [
  'name',
  'finish_time',
  'overall_rank',
  'gender',
  'location',
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

// A row that passed shape validation. finish_time has already been
// normalized to seconds; blanks in optional fields become null.
export interface ParsedRow {
  lineNumber: number; // 1-indexed, counting the header as line 1
  name: string;
  finishTimeSeconds: number;
  overallRank: number | null;
  gender: string | null;
  location: string | null;
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

function matchesHeader(header: string[]): string | null {
  if (header.length < IMPORT_COLUMNS.length) {
    return `Header has ${header.length} columns but expected ${IMPORT_COLUMNS.length} (${IMPORT_COLUMNS.join(', ')}).`;
  }
  for (let i = 0; i < IMPORT_COLUMNS.length; i++) {
    const got = header[i]?.trim().toLowerCase();
    const want = IMPORT_COLUMNS[i];
    if (got !== want) {
      return `Header column ${i + 1} must be "${want}" but got "${header[i] ?? ''}".`;
    }
  }
  return null;
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

  const headerError = matchesHeader(rows[0]);
  if (headerError) {
    errors.push({ lineNumber: 1, message: headerError });
    // Without a valid header we can't trust any row — bail early.
    return { rows: parsed, errors };
  }

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

    const [name, finishTimeRaw, rankRaw, genderRaw, locationRaw] = [
      row[0] ?? '',
      row[1] ?? '',
      row[2] ?? '',
      row[3] ?? '',
      row[4] ?? '',
    ];

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

    parsed.push({
      lineNumber: line,
      name: trimmedName,
      finishTimeSeconds: seconds,
      overallRank,
      gender,
      location,
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
