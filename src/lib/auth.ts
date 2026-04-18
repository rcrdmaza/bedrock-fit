// Minimal shared-secret admin auth. One password, one cookie, no user table.
// The cookie stores a timestamp signed with SESSION_SECRET via HMAC-SHA256 so
// a stolen cookie can't be forged without the secret. Rotating SESSION_SECRET
// invalidates every outstanding session.
//
// Everything here is server-only (Node crypto, next/headers). Do not import
// from client components — bundling would fail on `node:crypto` anyway.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET env var is missing or too short (need >= 16 chars).',
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  // timingSafeEqual throws on unequal lengths, so guard first.
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Constant-time password check. Pads the shorter string so an attacker can't
// learn the password length from response timing.
export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
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
