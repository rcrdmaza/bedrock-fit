'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/db';
import {
  orgInvites,
  orgMembers,
  organizations,
  users,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getAppUrl, getEmailFrom, getResendApiKey } from '@/lib/env';
import { isEmail, normalizeEmail } from '@/lib/magic-link';
import {
  getActiveOrgForUser,
  listOrgsForUser,
  slugifyOrgName,
  type OrgRole,
} from '@/lib/org';

// Invites live for 7 days. Long enough that a recipient can sit on
// "I'll do this later," short enough that a stale invite to an old
// email doesn't haunt us forever.
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Same hashing discipline as login_tokens — only the digest is stored.
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// ---- create org ------------------------------------------------------

export type CreateOrgState =
  | { status: 'idle' }
  | { status: 'error'; error: string }
  | { status: 'created'; orgId: string; slug: string };

// Generate a unique slug. We try the base slug first, then append
// short hex suffixes on collision. After a few attempts we give up
// and let the DB error surface — that's a sign the chosen name is
// pathological enough to warrant human attention.
async function reserveSlug(name: string): Promise<string> {
  const base = slugifyOrgName(name) || 'org';
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate =
      attempt === 0
        ? base
        : `${base.slice(0, 50)}-${randomBytes(2).toString('hex')}`;
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  // Pathological fallback — caller will propagate the unique-violation.
  return `${base}-${randomBytes(4).toString('hex')}`;
}

export async function createOrg(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: 'error', error: 'Sign in to create an organization.' };
  }

  const rawName = String(formData.get('name') ?? '').trim();
  if (!rawName) {
    return { status: 'error', error: 'Enter an organization name.' };
  }
  if (rawName.length > 100) {
    return { status: 'error', error: 'Name is too long (max 100 chars).' };
  }

  // Block creating a second org for v1 — single-org users are the
  // common case and we don't yet have a switcher in the UI. Override
  // by removing the existing membership manually if you really need
  // to land in two orgs in dev.
  const existing = await listOrgsForUser(user.id);
  if (existing.length > 0) {
    return {
      status: 'error',
      error: 'You already belong to an organization.',
    };
  }

  const slug = await reserveSlug(rawName);

  // One transaction so a partial insert (org row but no membership)
  // can't strand a user out of their own org.
  const orgId = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: rawName, slug, createdByUserId: user.id })
      .returning({ id: organizations.id });
    await tx.insert(orgMembers).values({
      orgId: org.id,
      userId: user.id,
      role: 'owner',
    });
    return org.id;
  });

  revalidatePath('/admin');
  revalidatePath('/admin/org');
  return { status: 'created', orgId, slug };
}

// ---- invite member ---------------------------------------------------

export type InviteState =
  | { status: 'idle' }
  | { status: 'error'; error: string }
  | { status: 'sent'; email: string };

export async function inviteMember(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: 'error', error: 'Sign in to invite teammates.' };
  }
  const membership = await getActiveOrgForUser(user.id);
  if (!membership) {
    return { status: 'error', error: 'You are not a member of any org.' };
  }
  if (membership.role !== 'owner') {
    return {
      status: 'error',
      error: 'Only owners can invite new members.',
    };
  }

  const rawEmail = String(formData.get('email') ?? '').trim();
  if (!isEmail(rawEmail)) {
    return { status: 'error', error: 'Enter a valid email address.' };
  }
  const email = normalizeEmail(rawEmail);

  // Reject inviting an existing member outright. We could no-op
  // gracefully but a clearer error helps the inviter.
  const dupe = await db
    .select({ id: orgMembers.id })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(
      and(eq(users.email, email), eq(orgMembers.orgId, membership.org.id)),
    )
    .limit(1);
  if (dupe.length > 0) {
    return {
      status: 'error',
      error: 'That email is already a member of this org.',
    };
  }

  const role: OrgRole = 'admin'; // v1 only invites at admin level
  const raw = randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await db.insert(orgInvites).values({
    orgId: membership.org.id,
    email,
    role,
    tokenHash,
    expiresAt,
    invitedByUserId: user.id,
  });

  try {
    await sendInviteEmail({
      to: email,
      orgName: membership.org.name,
      inviterName: user.name ?? user.email,
      token: raw,
    });
  } catch {
    return {
      status: 'error',
      error: "We couldn't send the invite email. Try again in a moment.",
    };
  }

  revalidatePath('/admin/org');
  return { status: 'sent', email };
}

// ---- accept invite ---------------------------------------------------
//
// Called by the /auth/invite/accept route handler after the user is
// already signed in (the route enforces requireUser before this
// runs). Atomically marks the invite consumed AND inserts the
// membership.

export interface AcceptInviteResult {
  status: 'ok' | 'invalid' | 'wrong-user' | 'already-member';
  orgSlug?: string;
}

export async function acceptInvite(
  rawToken: string,
  user: { id: string; email: string },
): Promise<AcceptInviteResult> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // Same atomic-claim discipline as consumeLoginToken: UPDATE ...
  // RETURNING in a single statement so two concurrent accepts can't
  // both succeed.
  const consumed = await db
    .update(orgInvites)
    .set({ consumedAt: now })
    .where(
      and(
        eq(orgInvites.tokenHash, tokenHash),
        isNull(orgInvites.consumedAt),
        gt(orgInvites.expiresAt, now),
      ),
    )
    .returning({
      orgId: orgInvites.orgId,
      email: orgInvites.email,
      role: orgInvites.role,
    });

  const invite = consumed[0];
  if (!invite) return { status: 'invalid' };

  // The invite was issued to a specific email; the signed-in user
  // must match. If not, reverse the consumption so a legitimate
  // recipient can still claim it later.
  if (invite.email !== user.email.toLowerCase()) {
    await db
      .update(orgInvites)
      .set({ consumedAt: null })
      .where(eq(orgInvites.tokenHash, tokenHash));
    return { status: 'wrong-user' };
  }

  // Insert the membership. ON CONFLICT DO NOTHING isn't directly
  // exposed by Drizzle here; we instead try and swallow the unique
  // violation by checking first.
  const already = await db
    .select({ id: orgMembers.id })
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, invite.orgId),
        eq(orgMembers.userId, user.id),
      ),
    )
    .limit(1);

  if (already.length === 0) {
    await db.insert(orgMembers).values({
      orgId: invite.orgId,
      userId: user.id,
      role: invite.role,
    });
  }

  // Look up slug for the redirect target.
  const [org] = await db
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, invite.orgId))
    .limit(1);

  revalidatePath('/admin/org');
  return {
    status: already.length === 0 ? 'ok' : 'already-member',
    orgSlug: org?.slug,
  };
}

// ---- remove member ---------------------------------------------------

export async function removeMember(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in?next=/admin/org');
  const membership = await getActiveOrgForUser(user.id);
  if (!membership || membership.role !== 'owner') {
    redirect('/admin/org');
  }

  const targetUserId = String(formData.get('userId') ?? '').trim();
  if (!targetUserId) redirect('/admin/org');
  // Don't let an owner remove themselves — they'd lock the org out.
  // To leave, they should transfer ownership first (not in v1).
  if (targetUserId === user.id) redirect('/admin/org');

  await db
    .delete(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, membership.org.id),
        eq(orgMembers.userId, targetUserId),
      ),
    );

  revalidatePath('/admin/org');
  redirect('/admin/org');
}

// ---- email rendering -------------------------------------------------

function inviteUrl(token: string): string {
  return `${getAppUrl()}/auth/invite/accept?token=${encodeURIComponent(token)}`;
}

interface InviteEmailInput {
  to: string;
  orgName: string;
  inviterName: string;
  token: string;
}

// Same shape as sendMagicLink: dev fallback logs to stdout, prod
// without a key throws, otherwise POSTs to Resend with structured
// log lines so Railway logs can tell us which branch fired.
async function sendInviteEmail(input: InviteEmailInput): Promise<void> {
  const url = inviteUrl(input.token);
  const apiKey = getResendApiKey();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `[invite] RESEND_API_KEY missing in production — refusing to send to ${input.to}`,
      );
      throw new Error('RESEND_API_KEY is not set — cannot deliver invite.');
    }
    console.log(`[invite] dev fallback (no key) ${input.to} → ${url}`);
    return;
  }

  const from = getEmailFrom();
  console.log(
    `[invite] resend POST from="${from}" to="${input.to}" tokenPrefix=${input.token.slice(0, 8)}…`,
  );

  const text =
    `${input.inviterName} invited you to manage ${input.orgName} on Bedrock.fit.\n\n` +
    `Accept the invite by signing in here:\n${url}\n\n` +
    `This invite expires in 7 days. If you didn't expect it, you can ignore this email.`;
  const html = `
    <div style="font-family: system-ui, sans-serif; color: #1c1917; max-width: 480px;">
      <p><strong>${escapeHtml(input.inviterName)}</strong> invited you to manage <strong>${escapeHtml(input.orgName)}</strong> on Bedrock.fit.</p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; background: #1c1917; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Accept invite</a>
      </p>
      <p style="color: #78716c; font-size: 13px;">
        Or paste this URL into your browser:<br>
        <span style="word-break: break-all;">${url}</span>
      </p>
      <p style="color: #78716c; font-size: 13px;">
        This invite expires in 7 days.
      </p>
    </div>
  `;

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `You're invited to ${input.orgName} on Bedrock.fit`,
        text,
        html,
      }),
    });
  } catch (err) {
    console.error(`[invite] resend network error: ${String(err)}`);
    throw err;
  }

  const body = await res.text().catch(() => '');
  if (!res.ok) {
    console.error(
      `[invite] resend rejected ${res.status}: ${body.slice(0, 300)}`,
    );
    throw new Error(`Resend API returned ${res.status}: ${body.slice(0, 200)}`);
  }
  console.log(`[invite] resend accepted: ${body.slice(0, 200)}`);
}

// Tiny HTML escape — only the inviter and org name flow into the
// HTML body, both server-controlled, but defense in depth costs nothing.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
