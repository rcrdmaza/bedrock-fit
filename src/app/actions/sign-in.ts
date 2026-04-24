'use server';

import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { loginTokens } from '@/db/schema';
import { clearUserCookie } from '@/lib/auth';
import {
  isEmail,
  issueLoginToken,
  normalizeEmail,
  sendMagicLink,
} from '@/lib/magic-link';
import { redirect } from 'next/navigation';

// One sign-in request per email every 60s. The cap is per-email rather
// than per-IP so a user behind NAT doesn't block their whole office,
// and a distributed attacker can't amplify by cycling IPs. The token
// generation cost is tiny; this is mostly about avoiding email-bombing
// an innocent address when someone abuses the form.
const REQUEST_COOLDOWN_MS = 60 * 1000;

export type SignInState =
  | { status: 'idle' }
  | { status: 'error'; error: string }
  // On success we don't auto-redirect — the user needs to check their
  // email. The page flips to a "we sent you a link" screen.
  | { status: 'sent'; email: string };

// Check the rate limit by looking for a token issued in the last
// COOLDOWN that hasn't yet been consumed. If one exists, we quietly
// succeed without issuing another — same UX as a first request, but
// without burning an extra email.
async function recentlyIssued(email: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - REQUEST_COOLDOWN_MS);
  const rows = await db
    .select({ id: loginTokens.id })
    .from(loginTokens)
    .where(and(eq(loginTokens.email, email), gt(loginTokens.createdAt, cutoff)))
    .limit(1);
  return rows.length > 0;
}

export async function requestSignInLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const raw = String(formData.get('email') ?? '').trim();
  if (!raw) return { status: 'error', error: 'Enter your email.' };
  if (!isEmail(raw)) {
    return { status: 'error', error: 'Enter a valid email address.' };
  }
  const email = normalizeEmail(raw);

  // Rate limit: if a link went out recently, pretend we sent another
  // (the existing one still works) rather than erroring. This avoids
  // leaking "this email is in-flight" timing and keeps the success UI
  // stable from the user's perspective.
  if (await recentlyIssued(email)) {
    return { status: 'sent', email };
  }

  try {
    const token = await issueLoginToken(email);
    await sendMagicLink(email, token);
  } catch {
    // Do NOT echo the underlying error to the user — it could include
    // infrastructure details. Sentry (where wired up) captures the
    // full trace automatically via Next's error boundary.
    return {
      status: 'error',
      error: "We couldn't send the sign-in email. Try again in a moment.",
    };
  }

  return { status: 'sent', email };
}

export async function signOut(): Promise<void> {
  await clearUserCookie();
  redirect('/');
}
