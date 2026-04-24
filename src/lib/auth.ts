// Session primitives for both the shared-secret admin ("admin_session"
// cookie) and the public magic-link users ("bf_user" cookie). Both use
// HMAC-SHA256 over SESSION_SECRET so rotating the env var invalidates
// every outstanding session of every kind.
//
// Everything here is server-only (Node crypto, next/headers). Do not import
// from client components — bundling would fail on `node:crypto` anyway.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getAdminPassword, getSessionSecret } from '@/lib/env';

// Shape of `users` rows as Drizzle infers them. Exported so callers
// (route handlers, the header, /me) can pass them around without
// reaching into the schema module directly.
export type AuthUser = typeof users.$inferSelect;

const COOKIE_NAME = 'admin_session';
const USER_COOKIE_NAME = 'bf_user';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days (admin)
const USER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days (public user)

// Exported so `magic-link.ts` can hash tokens against the same secret
// without re-deriving the HMAC primitive. Keeping one call-site for
// sign()/safeEqual() means a future crypto change (e.g. moving to a
// keyed BLAKE3) only has to happen here.
export function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  // timingSafeEqual throws on unequal lengths, so guard first.
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Constant-time password check. Pads the shorter string so an attacker can't
// learn the password length from response timing.
export function passwordMatches(input: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(input.padEnd(expected.length));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b) && input.length === expected.length;
}

// Cookie value is `<issuedAtMs>.<hex hmac>`. We keep issuedAt inside the
// signed payload so we can expire without extra storage.
function encodeSession(): string {
  const issued = Date.now().toString(10);
  return `${issued}.${sign(issued)}`;
}

function decodeSession(raw: string | undefined): { issued: number } | null {
  if (!raw) return null;
  const dot = raw.indexOf('.');
  if (dot <= 0) return null;
  const issued = raw.slice(0, dot);
  const provided = raw.slice(dot + 1);
  const expected = sign(issued);
  if (!safeEqual(provided, expected)) return null;
  const issuedMs = Number(issued);
  if (!Number.isFinite(issuedMs)) return null;
  if (Date.now() - issuedMs > MAX_AGE_SECONDS * 1000) return null;
  return { issued: issuedMs };
}

// Only callable from a server action or route handler — Next refuses to set
// cookies during render.
export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value) !== null;
}

// Use at the top of every admin server component and admin server action.
// Throws a NEXT_REDIRECT (via redirect()) if the caller isn't authenticated.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

// --- Public user session (magic-link) ---------------------------------
//
// Cookie value: `<userId>.<issuedAtMs>.<hmac(userId|issuedAtMs)>`.
// Including the userId in the signed payload means an attacker who
// steals a cookie still needs SESSION_SECRET to forge sessions for
// *other* users. issuedAt is there for server-side expiry.

function encodeUserSession(userId: string): string {
  const issued = Date.now().toString(10);
  const payload = `${userId}|${issued}`;
  return `${userId}.${issued}.${sign(payload)}`;
}

function decodeUserSession(
  raw: string | undefined,
): { userId: string; issued: number } | null {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const [userId, issued, provided] = parts;
  // UUIDs are 36 chars; anything drastically off is malformed and not
  // worth hashing. Cheap prefilter for garbage cookies.
  if (!userId || !issued || !provided) return null;
  const expected = sign(`${userId}|${issued}`);
  if (!safeEqual(provided, expected)) return null;
  const issuedMs = Number(issued);
  if (!Number.isFinite(issuedMs)) return null;
  if (Date.now() - issuedMs > USER_MAX_AGE_SECONDS * 1000) return null;
  return { userId, issued: issuedMs };
}

export async function setUserCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(USER_COOKIE_NAME, encodeUserSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: USER_MAX_AGE_SECONDS,
  });
}

export async function clearUserCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_COOKIE_NAME);
}

// Returns the signed-in user or null. Reads the cookie, verifies the
// HMAC, then does a single SELECT by id — we refuse to trust the
// cookie alone in case the user row has since been deleted or the
// admin wants to force-logout someone by wiping the row.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const decoded = decodeUserSession(store.get(USER_COOKIE_NAME)?.value);
  if (!decoded) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);
  return rows[0] ?? null;
}

// Mirror of requireAdmin() for public pages that need a logged-in user.
// Redirects to the sign-in page with `?next=` so we can bounce back.
export async function requireUser(redirectTo = '/me'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}
