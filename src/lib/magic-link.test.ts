import { beforeEach, describe, expect, it, vi } from 'vitest';

// The DB helpers in magic-link.ts are exercised via issueLoginToken /
// consumeLoginToken, which talk to Postgres. We mock @/db with a
// per-table fluent stub so we can assert on the values the module
// actually persists without touching a real database.

const mockInsertValues = vi.fn<(v: unknown) => Promise<void>>();
const mockUpdateReturning =
  vi.fn<() => Promise<Array<{ email: string }>>>();

vi.mock('@/db', () => {
  const insertChain = {
    values: (v: unknown) => mockInsertValues(v),
  };
  const updateChain = {
    set: () => updateChain,
    where: () => updateChain,
    returning: () => mockUpdateReturning(),
  };
  const db = {
    insert: vi.fn(() => insertChain),
    update: vi.fn(() => updateChain),
  };
  return { db };
});

// env helpers are read at call time; stub them so getAppUrl et al.
// don't try to load .env.local from the test cwd.
vi.mock('@/lib/env', () => ({
  getAppUrl: () => 'https://bedrock.fit',
  getEmailFrom: () => 'Bedrock.fit <noreply@bedrock.fit>',
  getResendApiKey: () => null,
}));

// Import AFTER the mocks register.
import {
  consumeLoginToken,
  isEmail,
  issueLoginToken,
  normalizeEmail,
  sendMagicLink,
} from './magic-link';

beforeEach(() => {
  mockInsertValues.mockReset();
  mockUpdateReturning.mockReset();
  mockInsertValues.mockResolvedValue(undefined);
});

describe('isEmail', () => {
  it('accepts normal addresses', () => {
    expect(isEmail('alice@example.com')).toBe(true);
    expect(isEmail('a+tag@sub.example.co')).toBe(true);
  });

  it('rejects addresses with no @ or no dot', () => {
    expect(isEmail('no-at')).toBe(false);
    expect(isEmail('no@dot')).toBe(false);
    expect(isEmail('@example.com')).toBe(false);
    expect(isEmail('alice@')).toBe(false);
  });

  it('rejects whitespace-containing strings', () => {
    expect(isEmail('alice @ example.com')).toBe(false);
    expect(isEmail(' alice@example.com')).toBe(false);
  });

  it('rejects absurdly long input', () => {
    // RFC caps total at 254; we use that as the hard limit.
    const local = 'a'.repeat(200);
    expect(isEmail(`${local}@${local}.co`)).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
  });
});

describe('issueLoginToken', () => {
  it('persists a hashed token and returns the raw value', async () => {
    const raw = await issueLoginToken('user@example.com');
    // Raw token is 32 random bytes as hex → 64 chars.
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(mockInsertValues).toHaveBeenCalledTimes(1);
    const payload = mockInsertValues.mock.calls[0][0] as {
      email: string;
      tokenHash: string;
      expiresAt: Date;
    };
    expect(payload.email).toBe('user@example.com');
    // The persisted hash is NOT the raw token — that's the whole point
    // of storing only the digest.
    expect(payload.tokenHash).not.toBe(raw);
    expect(payload.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    // Expiry lives about 15 minutes in the future. Allow ±2s for slop.
    const delta = payload.expiresAt.getTime() - Date.now();
    expect(delta).toBeGreaterThan(14 * 60 * 1000);
    expect(delta).toBeLessThan(16 * 60 * 1000);
  });

  it('normalizes the stored email', async () => {
    await issueLoginToken('  Alice@Example.COM ');
    const payload = mockInsertValues.mock.calls[0][0] as { email: string };
    expect(payload.email).toBe('alice@example.com');
  });

  it('generates a different raw token every call', async () => {
    const a = await issueLoginToken('x@y.com');
    const b = await issueLoginToken('x@y.com');
    expect(a).not.toBe(b);
  });
});

describe('consumeLoginToken', () => {
  it('returns the row email when the token is valid', async () => {
    mockUpdateReturning.mockResolvedValueOnce([{ email: 'found@example.com' }]);
    const res = await consumeLoginToken('any-token');
    expect(res).toEqual({ email: 'found@example.com' });
  });

  it('returns null when no row matches (unknown/expired/used)', async () => {
    mockUpdateReturning.mockResolvedValueOnce([]);
    const res = await consumeLoginToken('stale-token');
    expect(res).toBeNull();
  });
});

describe('sendMagicLink (no API key)', () => {
  it('logs the URL in dev when RESEND_API_KEY is not set', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await sendMagicLink('dev@example.com', 'token-abc');
      expect(spy).toHaveBeenCalledTimes(1);
      const msg = spy.mock.calls[0][0] as string;
      expect(msg).toContain('dev@example.com');
      expect(msg).toContain('https://bedrock.fit/auth/verify?token=token-abc');
    } finally {
      spy.mockRestore();
    }
  });

  it('throws in production when the API key is missing', async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error -- Node's NODE_ENV is readonly in @types/node
    process.env.NODE_ENV = 'production';
    try {
      await expect(
        sendMagicLink('prod@example.com', 'token-abc'),
      ).rejects.toThrow(/RESEND_API_KEY/);
    } finally {
      // @ts-expect-error -- Node's NODE_ENV is readonly in @types/node
      process.env.NODE_ENV = original;
    }
  });
});
