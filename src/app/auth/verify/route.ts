// GET /auth/verify?token=... consumes a magic-link token, finds-or-
// creates the matching user row, auto-links to an existing athletes
// row if one shares the same email, and sets the session cookie.
//
// We keep this in a route handler (not a server action) because it's
// triggered by a click from an email client — a plain GET is the path
// of least resistance. Forms would add extra friction for no real
// security gain (the token is single-use and short-lived).
import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { athletes, users } from '@/db/schema';
import { setUserCookie } from '@/lib/auth';
import { consumeLoginToken, normalizeEmail } from '@/lib/magic-link';
import { getAppUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

function errorUrl(reason: 'invalid' | 'expired' | 'used' | 'server'): string {
  return `${getAppUrl()}/auth/sign-in?err=${reason}`;
}

// Auto-link: on first sign-in, attach the new user to an athletes row
// that already uses their email. That row was probably created by the
// claim flow (admin approves → inserts or updates the athlete with
// `email = claimEmail`). If no matching athlete exists yet, we create
// one with just the email — the /me page can fill in name/location
// later.
async function findOrCreateAthleteForEmail(email: string): Promise<string> {
  const existing = await db
    .select({ id: athletes.id })
    .from(athletes)
    .where(eq(athletes.email, email))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const inserted = await db
    .insert(athletes)
    .values({
      // `name` is notNull in the schema. We seed with the email local-
      // part so the athlete profile has *something* to render; the
      // user can rename themselves from /me.
      name: email.split('@')[0] ?? email,
      email,
    })
    .returning({ id: athletes.id });
  return inserted[0].id;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');
  if (!token || token.length < 16) {
    return NextResponse.redirect(errorUrl('invalid'));
  }

  let email: string;
  try {
    const consumed = await consumeLoginToken(token);
    if (!consumed) {
      // Could be unknown, expired, or already used. We don't
      // distinguish in the redirect — the three outcomes all mean
      // "ask for a new link" and the attacker doesn't learn whether
      // they hit a real token.
      return NextResponse.redirect(errorUrl('expired'));
    }
    email = normalizeEmail(consumed.email);
  } catch {
    return NextResponse.redirect(errorUrl('server'));
  }

  try {
    // Find or create the user row. The unique(email) constraint makes
    // this race-safe — if two tabs hit verify at the exact same
    // millisecond (unlikely given the single-use token), the second
    // INSERT errors and we fall through to SELECT.
    let user = (
      await db.select().from(users).where(eq(users.email, email)).limit(1)
    )[0];

    if (!user) {
      const athleteId = await findOrCreateAthleteForEmail(email);
      const inserted = await db
        .insert(users)
        .values({ email, athleteId, lastSignInAt: new Date() })
        .returning();
      user = inserted[0];
    } else {
      // Returning user: refresh lastSignInAt and, if their user row
      // predates a claim, backfill the athleteId link lazily.
      const athleteId =
        user.athleteId ?? (await findOrCreateAthleteForEmail(email));
      await db
        .update(users)
        .set({ athleteId, lastSignInAt: new Date() })
        .where(eq(users.id, user.id));
      user = { ...user, athleteId };
    }

    await setUserCookie(user.id);
  } catch {
    return NextResponse.redirect(errorUrl('server'));
  }

  return NextResponse.redirect(`${getAppUrl()}/me`);
}
