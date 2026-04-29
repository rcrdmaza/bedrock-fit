import { describe, expect, it } from 'vitest';
import { filterResults, type ResultRow } from './results-filter';

// Filter logic powers /results AND every deep-link from a profile
// page ("claim my races, name = X, country = Peru"). A regression
// here would silently strand athletes on a search that returns the
// wrong rows, so we pin the AND-semantics across every field combo
// rather than trusting a smoke test.

const baseRow: ResultRow = {
  id: 'r1',
  athleteId: 'a1',
  athleteName: 'Carlos Mendez',
  eventName: 'Lima Marathon',
  eventDate: '2025-04-12T00:00:00Z',
  raceCategory: '42K',
  finishTime: 11_400,
  overallRank: 87,
  totalFinishers: 2_500,
  percentile: 96.52,
  status: 'unclaimed',
  bib: '1042',
  eventCountry: 'Peru',
};

function row(overrides: Partial<ResultRow>): ResultRow {
  return { ...baseRow, ...overrides };
}

const ROWS: ResultRow[] = [
  row({ id: 'r1', athleteName: 'Carlos Mendez', eventCountry: 'Peru' }),
  row({ id: 'r2', athleteName: 'Carlos Vega', eventCountry: 'Chile' }),
  row({
    id: 'r3',
    athleteName: 'Maria Lopez',
    eventCountry: 'Peru',
    eventName: 'Cusco 21K',
    raceCategory: '21K',
  }),
  row({
    id: 'r4',
    athleteName: 'James Smith',
    eventCountry: null,
    eventName: 'Berlin Half',
  }),
  row({
    id: 'r5',
    athleteName: 'Carlos Mendez',
    eventCountry: 'Argentina',
    eventDate: '2024-10-01T00:00:00Z',
  }),
];

describe('filterResults — empty filter passthrough', () => {
  it('returns the input array reference when nothing is set', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
    });
    // Same reference — the filter takes a fast-path when there's
    // nothing to filter on, avoiding the .filter() allocation.
    expect(result).toBe(ROWS);
  });

  it('treats whitespace-only query as empty', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '   ',
      fromDate: '',
      toDate: '',
    });
    expect(result).toBe(ROWS);
  });
});

describe('filterResults — primary search field', () => {
  it('matches by name (case-insensitive substring)', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: 'carlos',
      fromDate: '',
      toDate: '',
    });
    expect(result.map((r) => r.id)).toEqual(['r1', 'r2', 'r5']);
  });

  it('matches by event name', () => {
    const result = filterResults(ROWS, {
      searchField: 'event',
      query: 'cusco',
      fromDate: '',
      toDate: '',
    });
    expect(result.map((r) => r.id)).toEqual(['r3']);
  });

  it('matches by bib (substring on the bib column)', () => {
    // All ROWS share bib 1042 in the fixture (baseRow default), so a
    // bib search for "1042" returns every row — confirms the bib
    // haystack is the bib field, not name or event.
    const result = filterResults(ROWS, {
      searchField: 'bib',
      query: '1042',
      fromDate: '',
      toDate: '',
    });
    expect(result.map((r) => r.id).sort()).toEqual([
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
    ]);
  });

  it('matches by primary country field', () => {
    const result = filterResults(ROWS, {
      searchField: 'country',
      query: 'peru',
      fromDate: '',
      toDate: '',
    });
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3']);
  });
});

describe('filterResults — country sub-filter', () => {
  it('filters by country independently of the primary search field', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      country: 'Peru',
    });
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('ANDs the country with the name query', () => {
    // Carlos Mendez has Peru AND Argentina results. Country=Peru should
    // narrow to just the Peru one — this is the deep-link from profile
    // pages with no claimed results.
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: 'carlos mendez',
      fromDate: '',
      toDate: '',
      country: 'Peru',
    });
    expect(result.map((r) => r.id)).toEqual(['r1']);
  });

  it('drops rows with null eventCountry when a country is set', () => {
    // r4 has no country — it should never match a non-empty country
    // filter (otherwise legacy imports without country data would
    // leak into "show me Peru" results).
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: 'james',
      fromDate: '',
      toDate: '',
      country: 'germany',
    });
    expect(result).toEqual([]);
  });

  it('treats whitespace country as empty (no filter)', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      country: '   ',
    });
    expect(result).toBe(ROWS);
  });

  it('country match is case-insensitive', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      country: 'PERU',
    });
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3']);
  });
});

describe('filterResults — date range', () => {
  it('applies an inclusive lower bound', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '2025-01-01',
      toDate: '',
    });
    // r5 is 2024-10 — excluded.
    expect(result.map((r) => r.id).sort()).toEqual(['r1', 'r2', 'r3', 'r4']);
  });

  it('applies an inclusive upper bound (matches end-of-day)', () => {
    // r1 is 2025-04-12T00:00Z; setting toDate=2025-04-12 should still
    // match thanks to the +24h-1ms inclusive math in the filter.
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: 'carlos mendez',
      fromDate: '2025-04-12',
      toDate: '2025-04-12',
    });
    expect(result.map((r) => r.id)).toEqual(['r1']);
  });

  it('combines name + country + date range with AND', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: 'carlos',
      fromDate: '2025-01-01',
      toDate: '2025-12-31',
      country: 'Peru',
    });
    expect(result.map((r) => r.id)).toEqual(['r1']);
  });
});

describe('filterResults — distance filter', () => {
  it('passes through when distances is empty/undefined', () => {
    const noKey = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
    });
    const empty = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      distances: [],
    });
    expect(noKey.length).toBe(ROWS.length);
    expect(empty.length).toBe(ROWS.length);
  });

  it('keeps only rows whose raceCategory is in the allow-list', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      distances: ['21K'],
    });
    expect(result.map((r) => r.id)).toEqual(['r3']);
  });

  it('matches multiple distances with OR semantics inside the list', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      distances: ['42K', '21K'],
    });
    // r1, r2, r5 are the seeded "Lima Marathon" rows (42K) plus r3
    // (21K). r4 is the Berlin Half but its raceCategory is still
    // '42K' from baseRow — the test fixture didn't override that —
    // so it survives too. We assert containment, not strict order.
    expect(result.map((r) => r.id).sort()).toEqual(
      ['r1', 'r2', 'r3', 'r4', 'r5'].sort(),
    );
  });

  it('drops rows with a null raceCategory when a distance filter is active', () => {
    const withNull = [...ROWS, row({ id: 'rn', raceCategory: null })];
    const result = filterResults(withNull, {
      searchField: 'name',
      query: '',
      fromDate: '',
      toDate: '',
      distances: ['42K'],
    });
    expect(result.find((r) => r.id === 'rn')).toBeUndefined();
  });

  it('ANDs with the existing primary search', () => {
    const result = filterResults(ROWS, {
      searchField: 'name',
      query: 'carlos',
      fromDate: '',
      toDate: '',
      distances: ['42K'],
    });
    // r1, r2, r5 are all "Carlos" + 42K; r3 is Maria.
    expect(result.map((r) => r.id).sort()).toEqual(['r1', 'r2', 'r5']);
  });
});
