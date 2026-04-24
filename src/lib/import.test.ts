import { describe, expect, it } from 'vitest';
import {
  canonicalizeCategory,
  computePercentile,
  normalizeName,
  parseFinishTime,
  parseImportCsv,
  tokenize,
} from './import';

// The import parser is the single biggest latent risk in the codebase:
// one bad assumption and a 26,000-row CSV corrupts the whole event.
// These tests pin every helper and the top-level parseImportCsv against
// the edge cases I could find in real-world race exports.

describe('tokenize', () => {
  it('parses a plain comma-separated row', () => {
    expect(tokenize('a,b,c\n')).toEqual([['a', 'b', 'c']]);
  });

  it('handles quoted fields with embedded commas', () => {
    expect(tokenize('"Smith, John",42\n')).toEqual([['Smith, John', '42']]);
  });

  it('handles escaped quotes inside quoted fields', () => {
    expect(tokenize('"she said ""hi""",ok\n')).toEqual([
      ['she said "hi"', 'ok'],
    ]);
  });

  it('strips a leading UTF-8 BOM', () => {
    // Excel on Windows prefixes exports with a BOM; if it leaks through
    // the header's first column won't match the required list.
    expect(tokenize('\uFEFFname,age\nJohn,30')).toEqual([
      ['name', 'age'],
      ['John', '30'],
    ]);
  });

  it('accepts CRLF, CR, and LF line terminators', () => {
    expect(tokenize('a,b\r\nc,d\re,f\ng,h')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
    ]);
  });

  it('permits newlines inside quoted fields', () => {
    expect(tokenize('"line 1\nline 2",ok')).toEqual([
      ['line 1\nline 2', 'ok'],
    ]);
  });

  it('drops purely-blank trailing rows', () => {
    expect(tokenize('a,b\n\n\n')).toEqual([['a', 'b']]);
  });

  it('preserves a row with blank cells in the middle of the file', () => {
    // We only drop trailing blanks — the middle-of-file blank is an
    // admin-fixable error that parseImportCsv flags explicitly.
    expect(tokenize('a,b\n,\nc,d\n')).toEqual([
      ['a', 'b'],
      ['', ''],
      ['c', 'd'],
    ]);
  });

  it('flushes the final row when the file has no trailing newline', () => {
    expect(tokenize('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('parseFinishTime', () => {
  it('parses H:MM:SS', () => {
    expect(parseFinishTime('1:23:45')).toBe(5025);
  });

  it('parses MM:SS', () => {
    expect(parseFinishTime('23:45')).toBe(1425);
  });

  it('rejects a single-part time', () => {
    expect(parseFinishTime('42')).toBeNull();
  });

  it('rejects a four-part time', () => {
    expect(parseFinishTime('1:2:3:4')).toBeNull();
  });

  it('rejects non-numeric components', () => {
    expect(parseFinishTime('1:2a:3')).toBeNull();
  });

  it('rejects minutes or seconds >= 60', () => {
    expect(parseFinishTime('1:60:00')).toBeNull();
    expect(parseFinishTime('1:00:60')).toBeNull();
  });

  it('rejects 24h and beyond', () => {
    expect(parseFinishTime('24:00:00')).toBeNull();
  });

  it('rejects zero and blank', () => {
    expect(parseFinishTime('0:00:00')).toBeNull();
    expect(parseFinishTime('')).toBeNull();
    expect(parseFinishTime('   ')).toBeNull();
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseFinishTime('  23:45  ')).toBe(1425);
  });
});

describe('normalizeName', () => {
  it('collapses whitespace and lowercases', () => {
    expect(normalizeName('  John   Doe ')).toBe('john doe');
  });

  it('NFC-normalizes decomposed accents', () => {
    // "José" in NFC vs. a base 'e' + combining acute accent. Both should
    // produce the same key so the importer doesn't create two athletes.
    const composed = 'Jos\u00e9';
    const decomposed = 'Jose\u0301';
    expect(normalizeName(composed)).toBe(normalizeName(decomposed));
  });
});

describe('canonicalizeCategory', () => {
  it('matches exact canonical values case-insensitively', () => {
    expect(canonicalizeCategory('5K')).toBe('5K');
    expect(canonicalizeCategory('marathon')).toBe('Marathon');
    expect(canonicalizeCategory('HALF MARATHON')).toBe('Half Marathon');
  });

  it('tolerates distance variants: "10k", "10 K", "10km"', () => {
    expect(canonicalizeCategory('10k')).toBe('10K');
    expect(canonicalizeCategory('10 K')).toBe('10K');
    expect(canonicalizeCategory('10km')).toBe('10K');
  });

  it('rejects non-canonical distances', () => {
    // We deliberately don't invent buckets: "8K" isn't on the list,
    // so the parser should raise a row-level error rather than guess.
    expect(canonicalizeCategory('8K')).toBeNull();
    expect(canonicalizeCategory('15km')).toBeNull();
  });

  it('rejects blank input', () => {
    expect(canonicalizeCategory('')).toBeNull();
    expect(canonicalizeCategory('   ')).toBeNull();
  });
});

describe('computePercentile', () => {
  it('rank 1 of 100 is top 1%', () => {
    // Convention: percentile is "percent beaten". Rank 1 beats 99 of 100
    // → 99.00, which the UI renders as "Top 1.0%".
    expect(computePercentile(1, 100)).toBe('99.00');
  });

  it('rank equal to totalFinishers is 0.00', () => {
    expect(computePercentile(100, 100)).toBe('0.00');
  });

  it('returns null when rank or total is missing/zero', () => {
    expect(computePercentile(null, 100)).toBeNull();
    expect(computePercentile(1, 0)).toBeNull();
  });

  it('returns a numeric(5,2)-safe string', () => {
    // Inserting into numeric(5,2) must not overflow — two decimals, max
    // 100.00. Drizzle expects a string for `numeric` columns.
    const result = computePercentile(50, 100);
    expect(result).toMatch(/^\d+\.\d{2}$/);
    expect(Number(result)).toBeGreaterThanOrEqual(0);
    expect(Number(result)).toBeLessThanOrEqual(100);
  });
});

describe('parseImportCsv — header validation', () => {
  it('rejects an empty file', () => {
    const { rows, errors } = parseImportCsv('');
    expect(rows).toHaveLength(0);
    expect(errors[0].message).toBe('File is empty.');
  });

  it('rejects too-short headers', () => {
    const csv = 'name,finish_time\nJohn,23:45\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/Header has 2 columns/);
  });

  it('rejects a misspelled required column', () => {
    const csv =
      'name,finishtime,overall_rank,gender,location,race_category\n' +
      'John,23:45,1,M,Lima,10K\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/Header column 2 must be "finish_time"/);
  });

  it('rejects unknown trailing columns', () => {
    const csv =
      'name,finish_time,overall_rank,gender,location,race_category,event_cntry\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/is not one of/);
  });

  it('rejects optional columns in the wrong order', () => {
    const csv =
      'name,finish_time,overall_rank,gender,location,race_category,event_country,bib\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/must appear in order/);
  });

  it('accepts a legacy 6-column CSV (no optional columns)', () => {
    const csv =
      'name,finish_time,overall_rank,gender,location,race_category\n' +
      'John Doe,23:45,1,M,Lima,10K\n';
    const { rows, errors } = parseImportCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].bib).toBeNull();
    expect(rows[0].eventCountry).toBeNull();
  });
});

describe('parseImportCsv — row validation', () => {
  const HEADER =
    'name,finish_time,overall_rank,gender,location,race_category,bib,event_country\n';

  it('parses a full happy-path row', () => {
    const csv = HEADER + 'Jane Runner,1:23:45,7,F,Lima,Marathon,042,Peru\n';
    const { rows, errors } = parseImportCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toEqual([
      {
        lineNumber: 2,
        name: 'Jane Runner',
        finishTimeSeconds: 5025,
        overallRank: 7,
        gender: 'F',
        location: 'Lima',
        raceCategory: 'Marathon',
        bib: '042',
        eventCountry: 'Peru',
      },
    ]);
  });

  it('flags a blank middle-of-file row as an error (not silently skipped)', () => {
    const csv = HEADER + 'Jane,23:45,1,F,Lima,10K,,\n,,,,,,,\nJack,24:00,2,M,Lima,10K,,\n';
    const { rows, errors } = parseImportCsv(csv);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/blank/);
    expect(rows).toHaveLength(2); // blank row doesn't block surrounding rows
  });

  it('requires name', () => {
    const csv = HEADER + ',23:45,1,F,Lima,10K,,\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/name is required/);
  });

  it('requires a valid finish_time', () => {
    const csv = HEADER + 'Jane,bogus,1,F,Lima,10K,,\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/finish_time/);
    expect(errors[0].offendingValue).toBe('bogus');
  });

  it('rejects an unknown race category with a helpful message', () => {
    const csv = HEADER + 'Jane,23:45,1,F,Lima,8K,,\n';
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/race_category must be blank or one of/);
    expect(errors[0].offendingValue).toBe('8K');
  });

  it('canonicalizes "10k" → "10K"', () => {
    const csv = HEADER + 'Jane,23:45,1,F,Lima,10k,,\n';
    const { rows } = parseImportCsv(csv);
    expect(rows[0].raceCategory).toBe('10K');
  });

  it('accepts blank rank, gender, location, and optional fields', () => {
    const csv = HEADER + 'Solo,23:45,,,,,,\n';
    const { rows, errors } = parseImportCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toMatchObject({
      overallRank: null,
      gender: null,
      location: null,
      raceCategory: null,
      bib: null,
      eventCountry: null,
    });
  });

  it('caps bib at 32 chars', () => {
    const longBib = 'A'.repeat(33);
    const csv = HEADER + `Jane,23:45,1,F,Lima,10K,${longBib},\n`;
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/bib must be 32 characters or fewer/);
  });

  it('caps event_country at 100 chars', () => {
    const longCountry = 'X'.repeat(101);
    const csv = HEADER + `Jane,23:45,1,F,Lima,10K,,${longCountry}\n`;
    const { errors } = parseImportCsv(csv);
    expect(errors[0].message).toMatch(/event_country must be 100 characters or fewer/);
  });

  it('reports lineNumber as 1-indexed relative to the source file', () => {
    // Header is line 1 → first data row is line 2 → second is line 3.
    const csv = HEADER + 'Jane,23:45,1,F,Lima,10K,,\nJack,24:00,2,M,Lima,10K,,\n';
    const { rows } = parseImportCsv(csv);
    expect(rows.map((r) => r.lineNumber)).toEqual([2, 3]);
  });
});
