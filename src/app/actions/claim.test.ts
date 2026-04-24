import { beforeEach, describe, expect, it, vi } from 'vitest';

// A single vi.mocked stub per module we don't want to hit for real.
// Both mocks are hoisted by Vitest before the action module loads, so
// when claim.ts calls `db.update(...).set(...).where(...).returning()`
// it gets our fluent fake rather than talking to Postgres.

const mockReturning = vi.fn<() => Promise<Array<{ id: string }>>>();
const mockRevalidatePath = vi.fn<(path: string, type?: string) => void>();

vi.mock('@/db', () => {
  // Chainable stub: every method returns `this` except returning(), which
  // resolves with whatever the test queued via mockReturning.
  const chain = {
    update: vi.fn(() => chain),
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: (...args: unknown[]) => mockReturning(...(args as [])),
  };
  return { db: chain };
});

vi.mock('next/cache', () => ({
  revalidatePath: (...args: [string, string?]) => mockRevalidatePath(...args),
}));

// Import AFTER the mocks are registered so claim.ts picks them up.
import { claimResult, claimResults } from './claim';

function form(data: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) for (const item of v) fd.append(k, item);
    else fd.append(k, v);
  }
  return fd;
}

beforeEach(() => {
  mockReturning.mockReset();
  mockRevalidatePath.mockReset();
});

describe('claimResult', () => {
  it('rejects missing resultId', async () => {
    const res = await claimResult(
      { status: 'idle' },
      form({ email: 'a@b.co' }),
    );
    expect(res).toEqual({ status: 'error', error: 'Missing result id.' });
    expect(mockReturning).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const res = await claimResult(
      { status: 'idle' },
      form({ resultId: 'abc', email: 'not-an-email' }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') {
      expect(res.error).toMatch(/valid email/);
    }
    expect(mockReturning).not.toHaveBeenCalled();
  });

  it('rejects a note longer than 500 chars', async () => {
    const res = await claimResult(
      { status: 'idle' },
      form({ resultId: 'abc', email: 'a@b.co', note: 'x'.repeat(501) }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') expect(res.error).toMatch(/500 characters/);
  });

  it('returns a friendly error when the row is no longer unclaimed', async () => {
    // The WHERE guard includes status='unclaimed'; if the row was
    // already pending/claimed, the update returns zero rows and the
    // action converts that into a user-facing message instead of a
    // silent no-op.
    mockReturning.mockResolvedValueOnce([]);
    const res = await claimResult(
      { status: 'idle' },
      form({ resultId: 'abc', email: 'a@b.co' }),
    );
    expect(res).toEqual({
      status: 'error',
      error: 'This result is no longer available to claim.',
    });
    // No revalidation when nothing actually flipped.
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it('succeeds and revalidates the public result pages', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'abc' }]);
    const res = await claimResult(
      { status: 'idle' },
      form({ resultId: 'abc', email: 'a@b.co', note: 'Strava link' }),
    );
    expect(res).toEqual({ status: 'success' });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/results');
  });
});

describe('claimResults (bulk)', () => {
  it('rejects when no ids are provided', async () => {
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co' }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') expect(res.error).toMatch(/at least one/);
  });

  it('enforces the MAX_BULK_CLAIM cap', async () => {
    const ids = Array.from({ length: 21 }, (_, i) => `id-${i}`);
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co', resultIds: ids }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') expect(res.error).toMatch(/max 20/);
    expect(mockReturning).not.toHaveBeenCalled();
  });

  it('de-dupes the id list and treats an all-blank payload as empty', async () => {
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co', resultIds: ['', '   ', ''] }),
    );
    // All values strip to blank → filtered out → same "select at least
    // one" error path as if nothing was posted.
    expect(res.status).toBe('error');
    if (res.status === 'error') expect(res.error).toMatch(/at least one/);
  });

  it('validates email AFTER id validation', async () => {
    // A bad email with a good id list should surface the email error
    // so the user fixes one thing at a time.
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'bad', resultIds: ['abc'] }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') expect(res.error).toMatch(/valid email/);
  });

  it('reports skipped = requested − updated when some rows were already taken', async () => {
    // Submitter asked to claim 3 ids; only 2 were still unclaimed.
    mockReturning.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co', resultIds: ['1', '2', '3'] }),
    );
    expect(res).toEqual({ status: 'success', claimed: 2, skipped: 1 });
  });

  it('counts dedup-collapsed ids against the skipped tally correctly', async () => {
    // The action de-dupes "1,1,2" → ["1","2"]; if only "1" flips,
    // skipped should be 1 (unique ids minus updated).
    mockReturning.mockResolvedValueOnce([{ id: '1' }]);
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co', resultIds: ['1', '1', '2'] }),
    );
    expect(res).toEqual({ status: 'success', claimed: 1, skipped: 1 });
  });

  it('errors when no rows were still claimable', async () => {
    mockReturning.mockResolvedValueOnce([]);
    const res = await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co', resultIds: ['1', '2'] }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error')
      expect(res.error).toMatch(/None of the selected results/);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it('revalidates the athlete profile page on success', async () => {
    mockReturning.mockResolvedValueOnce([{ id: '1' }]);
    await claimResults(
      { status: 'idle' },
      form({ email: 'a@b.co', resultIds: ['1'] }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/athletes/[id]', 'page');
  });
});
