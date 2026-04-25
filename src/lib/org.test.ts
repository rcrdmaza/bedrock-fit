import { beforeEach, describe, expect, it, vi } from 'vitest';

// Same fluent-stub pattern the magic-link tests use: every Drizzle
// query method is a no-op chain that ultimately resolves with a value
// the test sets per-call. The helpers in org.ts only ever build
// SELECT chains, so we mock the chain to terminate at a `.orderBy()`
// or `.limit()` call returning rows.

type Rows = unknown[];

const mockSelectRows = vi.fn<() => Promise<Rows>>();

vi.mock('@/db', () => {
  // Every method on the chain returns the chain itself, except the
  // final await — `.orderBy(...)` and `.limit(...)` return a Promise.
  // We resolve that Promise from mockSelectRows so each test can
  // queue up the rows it expects to see.
  const chain: Record<string, unknown> = {};
  const passthrough = () => chain;
  const terminal = () => mockSelectRows();
  chain.from = passthrough;
  chain.where = passthrough;
  chain.innerJoin = passthrough;
  chain.leftJoin = passthrough;
  chain.orderBy = terminal;
  chain.limit = terminal;
  const db = {
    select: vi.fn(() => chain),
  };
  return { db };
});

// Auth helpers are pure — stub them so we can drive the requireOrgOrAdmin
// branches without juggling cookies or Postgres.
const mockIsAdmin = vi.fn<() => Promise<boolean>>();
const mockGetCurrentUser = vi.fn<() => Promise<unknown>>();

vi.mock('@/lib/auth', () => ({
  isAdmin: () => mockIsAdmin(),
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('next/navigation', () => ({
  // The real redirect throws NEXT_REDIRECT; in tests we throw a tagged
  // Error so we can assert it was called with the right path.
  redirect: (path: string) => {
    throw new Error(`__redirect__:${path}`);
  },
}));

import {
  canEditEventMetadata,
  getActiveOrgForUser,
  getAdminOrOrg,
  listOrgsForUser,
  requireOrgOrAdmin,
  slugifyOrgName,
} from './org';

beforeEach(() => {
  mockSelectRows.mockReset();
  mockIsAdmin.mockReset();
  mockGetCurrentUser.mockReset();
});

describe('slugifyOrgName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyOrgName('Bedrock Fit')).toBe('bedrock-fit');
    expect(slugifyOrgName('Lima Runners 2026!')).toBe('lima-runners-2026');
  });

  it('strips diacritics and trims dashes', () => {
    expect(slugifyOrgName('  Crónicas  Andinas  ')).toBe('cronicas-andinas');
  });

  it('caps length at 60 chars', () => {
    const long = 'a'.repeat(80);
    expect(slugifyOrgName(long).length).toBeLessThanOrEqual(60);
  });
});

describe('listOrgsForUser', () => {
  it('returns memberships in owner-then-join-time order', async () => {
    // Drizzle returns the joined shape we project; the helper just
    // remaps it. We resolve directly with that shape.
    mockSelectRows.mockResolvedValueOnce([
      {
        orgId: 'o1',
        orgName: 'Bedrock.fit',
        orgSlug: 'bedrock-fit',
        role: 'owner',
        createdAt: new Date('2026-01-01'),
      },
      {
        orgId: 'o2',
        orgName: 'Other Org',
        orgSlug: 'other',
        role: 'admin',
        createdAt: new Date('2026-02-01'),
      },
    ]);
    const out = await listOrgsForUser('u-1');
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({
      org: { id: 'o1', name: 'Bedrock.fit', slug: 'bedrock-fit' },
      role: 'owner',
    });
    expect(out[1].role).toBe('admin');
  });

  it('returns empty array when the user is in no orgs', async () => {
    mockSelectRows.mockResolvedValueOnce([]);
    const out = await listOrgsForUser('u-1');
    expect(out).toEqual([]);
  });
});

describe('getActiveOrgForUser', () => {
  it('returns the first membership', async () => {
    mockSelectRows.mockResolvedValueOnce([
      {
        orgId: 'o1',
        orgName: 'Bedrock.fit',
        orgSlug: 'bedrock-fit',
        role: 'owner',
        createdAt: new Date(),
      },
    ]);
    const out = await getActiveOrgForUser('u-1');
    expect(out?.org.slug).toBe('bedrock-fit');
  });

  it('returns null when no memberships', async () => {
    mockSelectRows.mockResolvedValueOnce([]);
    expect(await getActiveOrgForUser('u-1')).toBeNull();
  });
});

describe('requireOrgOrAdmin', () => {
  it('returns kind=admin when the legacy admin cookie is set', async () => {
    mockIsAdmin.mockResolvedValueOnce(true);
    const ctx = await requireOrgOrAdmin();
    expect(ctx.kind).toBe('admin');
    // Should never have tried to load a user when admin already passes.
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it('returns kind=org with membership when the user belongs to an org', async () => {
    mockIsAdmin.mockResolvedValueOnce(false);
    mockGetCurrentUser.mockResolvedValueOnce({
      id: 'u-1',
      email: 'rhmaza@gmail.com',
    });
    mockSelectRows.mockResolvedValueOnce([
      {
        orgId: 'o1',
        orgName: 'Bedrock.fit',
        orgSlug: 'bedrock-fit',
        role: 'owner',
        createdAt: new Date(),
      },
    ]);
    const ctx = await requireOrgOrAdmin();
    expect(ctx.kind).toBe('org');
    if (ctx.kind === 'org') {
      expect(ctx.user.email).toBe('rhmaza@gmail.com');
      expect(ctx.membership.org.id).toBe('o1');
      expect(ctx.membership.role).toBe('owner');
    }
  });

  it('redirects to /admin/login when no admin cookie and no user', async () => {
    mockIsAdmin.mockResolvedValueOnce(false);
    mockGetCurrentUser.mockResolvedValueOnce(null);
    await expect(requireOrgOrAdmin()).rejects.toThrow(
      '__redirect__:/admin/login',
    );
  });

  it('redirects when the user has no org membership', async () => {
    mockIsAdmin.mockResolvedValueOnce(false);
    mockGetCurrentUser.mockResolvedValueOnce({ id: 'u-1' });
    mockSelectRows.mockResolvedValueOnce([]);
    await expect(requireOrgOrAdmin()).rejects.toThrow(
      '__redirect__:/admin/login',
    );
  });
});

describe('getAdminOrOrg (soft variant)', () => {
  it('returns null instead of redirecting when nobody is signed in', async () => {
    mockIsAdmin.mockResolvedValueOnce(false);
    mockGetCurrentUser.mockResolvedValueOnce(null);
    expect(await getAdminOrOrg()).toBeNull();
  });

  it('returns admin when admin cookie is set', async () => {
    mockIsAdmin.mockResolvedValueOnce(true);
    expect(await getAdminOrOrg()).toEqual({ kind: 'admin' });
  });
});

describe('canEditEventMetadata', () => {
  it('admin can always edit', () => {
    expect(canEditEventMetadata({ kind: 'admin' }, null)).toBe(true);
    expect(canEditEventMetadata({ kind: 'admin' }, 'o-9')).toBe(true);
  });

  it('org member can edit only their own org events', () => {
    const ctx = {
      kind: 'org' as const,
      user: { id: 'u-1' } as never,
      membership: {
        org: { id: 'o-1', name: 'X', slug: 'x' },
        role: 'admin' as const,
      },
    };
    expect(canEditEventMetadata(ctx, 'o-1')).toBe(true);
    expect(canEditEventMetadata(ctx, 'o-2')).toBe(false);
    // Unowned events are NOT editable by org members — only admin
    // god-mode can repair an event with a missing owner_org_id.
    expect(canEditEventMetadata(ctx, null)).toBe(false);
  });
});
