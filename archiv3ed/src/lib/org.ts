// Organization scoping primitives. Mirrors auth.ts in shape — small,
// pure server functions that the admin pages and server actions call
// at the top of every request.
//
// The mental model:
// - Legacy admin (the shared password) is "god-mode": sees and edits
//   every event regardless of org. We keep this for solo / debug use.
// - A magic-link user who's a member of an organization is scoped:
//   they only see events whose event_metadata.owner_org_id matches
//   their org, and only those events' claims, edits, photos, etc.
// - Anyone else gets bounced to /admin/login.
//
// "Active org" is implicit for v1 — the user's only org membership.
// If we ever support multi-org users, switch this to read an
// `active_org_id` cookie set by a switcher in the header.
import { and, asc, desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import {
  eventMetadata,
  orgMembers,
  organizations,
  users,
} from '@/db/schema';
import { getCurrentUser, isAdmin, type AuthUser } from '@/lib/auth';

export type OrgRole = 'owner' | 'admin';

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
}

export interface OrgMembership {
  org: OrgSummary;
  role: OrgRole;
}

// Discriminated union returned by requireOrgOrAdmin. The two callers
// (admin pages and admin server actions) branch on `kind` to decide
// whether to apply scoping — `admin` means "no scope, see everything".
export type AdminOrOrg =
  | { kind: 'admin' }
  | { kind: 'org'; user: AuthUser; membership: OrgMembership };

// Slug from a freeform org name. Lowercase, hyphenated, ASCII-only.
// We append a short suffix on collision in createOrg — the slug here
// is best-effort, not guaranteed unique.
export function slugifyOrgName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Find every org the user belongs to, ordered owner-first then by
// join time. The first row is treated as the "active" org elsewhere.
export async function listOrgsForUser(
  userId: string,
): Promise<OrgMembership[]> {
  const rows = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      role: orgMembers.role,
      createdAt: orgMembers.createdAt,
    })
    .from(orgMembers)
    .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
    .where(eq(orgMembers.userId, userId))
    // 'owner' < 'admin' alphabetically, so asc(role) puts owners first.
    .orderBy(asc(orgMembers.role), asc(orgMembers.createdAt));

  return rows.map((r) => ({
    org: { id: r.orgId, name: r.orgName, slug: r.orgSlug },
    role: r.role as OrgRole,
  }));
}

// Single-org convenience: most users are in exactly one org in v1.
// Returns null when the user has no membership at all.
export async function getActiveOrgForUser(
  userId: string,
): Promise<OrgMembership | null> {
  const memberships = await listOrgsForUser(userId);
  return memberships[0] ?? null;
}

// The gate every admin page calls at the top. Returns:
//   - { kind: 'admin' } if the legacy admin-password cookie is set
//   - { kind: 'org', user, membership } if the magic-link user belongs
//     to at least one org
//   - redirects to /admin/login otherwise
//
// Order matters: legacy admin wins so a developer with both cookies
// keeps god-mode. Flip the order if you want org-scoping to apply to
// the founder's normal day-to-day.
export async function requireOrgOrAdmin(): Promise<AdminOrOrg> {
  if (await isAdmin()) return { kind: 'admin' };
  const user = await getCurrentUser();
  if (user) {
    const membership = await getActiveOrgForUser(user.id);
    if (membership) return { kind: 'org', user, membership };
  }
  redirect('/admin/login');
}

// Soft variant — returns null instead of redirecting. Useful in places
// like the admin sub-nav where we want to render different links based
// on whether the caller is an admin or a member, without bouncing them
// before they hit the page.
export async function getAdminOrOrg(): Promise<AdminOrOrg | null> {
  if (await isAdmin()) return { kind: 'admin' };
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await getActiveOrgForUser(user.id);
  if (!membership) return null;
  return { kind: 'org', user, membership };
}

// True if the AdminOrOrg has rights to act on the given event metadata
// row. Legacy admin says yes always. Org members say yes iff the
// metadata's owner_org_id matches their org. Used by edit/photo/import
// actions to gate writes after the page has rendered.
export function canEditEventMetadata(
  ctx: AdminOrOrg,
  metadataOwnerOrgId: string | null | undefined,
): boolean {
  if (ctx.kind === 'admin') return true;
  if (!metadataOwnerOrgId) return false;
  return metadataOwnerOrgId === ctx.membership.org.id;
}

// Org members in display order — owners first, then by join time.
// Joined to users so the UI can show name + email without a second
// roundtrip.
export interface OrgMemberRow {
  userId: string;
  email: string;
  name: string | null;
  role: OrgRole;
  joinedAt: Date;
}

export async function listOrgMembers(orgId: string): Promise<OrgMemberRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: orgMembers.role,
      joinedAt: orgMembers.createdAt,
    })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(orgMembers.orgId, orgId))
    .orderBy(asc(orgMembers.role), asc(orgMembers.createdAt));

  return rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    name: r.name,
    role: r.role as OrgRole,
    joinedAt: r.joinedAt,
  }));
}

// "Did this org create at least one event?" — drives the empty-state
// copy on /admin/events without forcing a full event-list query.
export async function orgHasEvents(orgId: string): Promise<boolean> {
  const rows = await db
    .select({ id: eventMetadata.id })
    .from(eventMetadata)
    .where(eq(eventMetadata.ownerOrgId, orgId))
    .limit(1);
  return rows.length > 0;
}

// Look up an event_metadata row by its identifying triple. Used by the
// import action's "lazy upsert on commit" path so we can stamp
// owner_org_id on the row that may or may not already exist.
export async function findEventMetadataByTriple(input: {
  eventName: string;
  eventDate: Date | null;
  raceCategory: string;
}): Promise<{ id: string; ownerOrgId: string | null } | null> {
  if (!input.eventDate) return null;
  const rows = await db
    .select({
      id: eventMetadata.id,
      ownerOrgId: eventMetadata.ownerOrgId,
    })
    .from(eventMetadata)
    .where(
      and(
        eq(eventMetadata.eventName, input.eventName),
        eq(eventMetadata.eventDate, input.eventDate),
        eq(eventMetadata.raceCategory, input.raceCategory),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, ownerOrgId: row.ownerOrgId ?? null };
}

// Re-export for convenience in tests/actions that want a stable order.
export { desc };
