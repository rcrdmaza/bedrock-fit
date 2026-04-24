import { beforeEach, describe, expect, it, vi } from 'vitest';

// The action talks to two collaborators: the db (for rate-limit
// lookup) and magic-link.ts (for issue+send). We mock both so the
// test is pure — one path per branch, no real tokens in flight.

const mockSelectRows = vi.fn<() => Promise<Array<{ id: string }>>>();
const mockIssue = vi.fn<(email: string) => Promise<string>>();
const mockSend = vi.fn<(email: string, token: string) => Promise<void>>();

vi.mock('@/db', () => {
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    limit: () => mockSelectRows(),
  };
  return {
    db: {
      select: vi.fn(() => selectChain),
    },
  };
});

vi.mock('@/lib/magic-link', async () => {
  // Keep the real helpers for normalization/validation; stub the two
  // that would hit the network or DB.
  const real = await vi.importActual<typeof import('@/lib/magic-link')>(
    '@/lib/magic-link',
  );
  return {
    ...real,
    issueLoginToken: (email: string) => mockIssue(email),
    sendMagicLink: (email: string, token: string) => mockSend(email, token),
  };
});

// clearUserCookie isn't exercised here but signOut imports it. Stub so
// next/headers (cookies()) doesn't blow up when the module loads.
vi.mock('@/lib/auth', () => ({
  clearUserCookie: vi.fn(),
}));

import { requestSignInLink } from './sign-in';

function form(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  mockSelectRows.mockReset();
  mockIssue.mockReset();
  mockSend.mockReset();
  // Default: no recent token, so a new link is issued.
  mockSelectRows.mockResolvedValue([]);
  mockIssue.mockResolvedValue('abc123');
  mockSend.mockResolvedValue(undefined);
});

describe('requestSignInLink', () => {
  it('rejects an empty email', async () => {
    const res = await requestSignInLink(
      { status: 'idle' },
      form({ email: '' }),
    );
    expect(res).toEqual({ status: 'error', error: 'Enter your email.' });
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const res = await requestSignInLink(
      { status: 'idle' },
      form({ email: 'not-an-email' }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') expect(res.error).toMatch(/valid email/);
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it('issues a token and sends the email on the happy path', async () => {
    const res = await requestSignInLink(
      { status: 'idle' },
      form({ email: 'Alice@Example.COM' }),
    );
    expect(res).toEqual({ status: 'sent', email: 'alice@example.com' });
    expect(mockIssue).toHaveBeenCalledWith('alice@example.com');
    expect(mockSend).toHaveBeenCalledWith('alice@example.com', 'abc123');
  });

  it('skips issuing when a recent token is still outstanding', async () => {
    // Rate limit: DB returns a row → we return success without
    // burning another issue call.
    mockSelectRows.mockResolvedValueOnce([{ id: 'r1' }]);
    const res = await requestSignInLink(
      { status: 'idle' },
      form({ email: 'alice@example.com' }),
    );
    expect(res).toEqual({ status: 'sent', email: 'alice@example.com' });
    expect(mockIssue).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns a generic error if sending throws, without leaking details', async () => {
    mockSend.mockRejectedValueOnce(
      new Error('Resend API returned 500: Internal Server Error'),
    );
    const res = await requestSignInLink(
      { status: 'idle' },
      form({ email: 'alice@example.com' }),
    );
    expect(res.status).toBe('error');
    if (res.status === 'error') {
      expect(res.error).toMatch(/couldn.t send/i);
      // Crucially, we do NOT forward the upstream message.
      expect(res.error).not.toMatch(/Resend/);
      expect(res.error).not.toMatch(/500/);
    }
  });
});
