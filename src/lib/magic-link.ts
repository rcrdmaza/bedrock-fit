// Magic-link primitives: issue a single-use token, email it to the
// recipient, and later consume it to sign someone in.
//
// Design notes:
// - The raw token leaves the server exactly once — embedded in the
//   email link. We persist only a SHA-256 hex hash, so a database
//   read-only leak can't replay outstanding links.
// - Tokens are 32 random bytes → 64 hex chars. That's well past the
//   entropy we need to defeat guessing (2^256) but keeps URL lengths
//   manageable.
// - 15 minutes TTL: long enough for a phone handoff, short enough that
//   an unnoticed shoulder-surf is already stale.
// - Consumption marks `consumedAt` inside the same UPDATE ... WHERE
//   used-is-null that the SELECT ran against, so two concurrent
//   verifies can't both succeed.
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { loginTokens } from '@/db/schema';
import { getAppUrl, getEmailFrom, getResendApiKey } from '@/lib/env';

// Rough email shape check. We're not trying to be RFC 5322 — that's
// infamously hopeless — just filter obvious typos before we burn an
// INSERT.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOKEN_TTL_MS = 15 * 60 * 1000;

export function isEmail(raw: string): boolean {
  return EMAIL_RE.test(raw) && raw.length <= 254;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// Insert a fresh token row and return the raw token (to embed in the
// outbound email). Caller is responsible for calling sendMagicLink
// after this succeeds — we split the two so tests can issue a token
// and consume it without hitting Resend.
export async function issueLoginToken(email: string): Promise<string> {
  const raw = randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await db.insert(loginTokens).values({
    email: normalizeEmail(email),
    tokenHash,
    expiresAt,
  });
  return raw;
}

// Exchange a raw token for its email, marking the row consumed. Returns
// null if the token is unknown, expired, or already used. Does NOT
// touch the users table — the caller (verify route) handles find-or-
// create so the linkage logic stays in one place.
export async function consumeLoginToken(
  raw: string,
): Promise<{ email: string } | null> {
  const tokenHash = hashToken(raw);
  const now = new Date();
  // UPDATE ... RETURNING is the atomic "mark consumed iff still
  // consumable" we need. Doing a SELECT-then-UPDATE would open a race
  // where two tabs both think they got a fresh token.
  const rows = await db
    .update(loginTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(loginTokens.tokenHash, tokenHash),
        isNull(loginTokens.consumedAt),
        gt(loginTokens.expiresAt, now),
      ),
    )
    .returning({ email: loginTokens.email });
  return rows[0] ?? null;
}

function signInUrl(token: string): string {
  const base = getAppUrl();
  // encodeURIComponent is overkill for hex but cheap insurance against
  // a future token format that includes '+' or '/'.
  return `${base}/auth/verify?token=${encodeURIComponent(token)}`;
}

function renderEmailBody(url: string): { text: string; html: string } {
  const text =
    `Click this link to sign in to Bedrock.fit:\n\n${url}\n\n` +
    `This link expires in 15 minutes and can only be used once. ` +
    `If you didn't request it, you can ignore this email.`;
  // Very plain HTML — most mail clients strip everything fancy, and a
  // bright button stands out more than a templated card.
  const html = `
    <div style="font-family: system-ui, sans-serif; color: #1c1917; max-width: 480px;">
      <p>Click this link to sign in to <strong>Bedrock.fit</strong>:</p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; background: #1c1917; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Sign in</a>
      </p>
      <p style="color: #78716c; font-size: 13px;">
        Or paste this URL into your browser:<br>
        <span style="word-break: break-all;">${url}</span>
      </p>
      <p style="color: #78716c; font-size: 13px;">
        This link expires in 15 minutes and can only be used once. If you didn't request it, you can ignore this email.
      </p>
    </div>
  `;
  return { text, html };
}

// Send the magic-link email. In dev without RESEND_API_KEY this logs
// the URL to stdout so you can click through without a mail setup. In
// production without the key, it throws — silent "nothing happens" is
// a worse UX than a visible crash we can fix by setting the env var.
export async function sendMagicLink(
  email: string,
  token: string,
): Promise<void> {
  const url = signInUrl(token);
  const apiKey = getResendApiKey();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'RESEND_API_KEY is not set — cannot deliver magic-link email in production.',
      );
    }
    console.log(`[magic-link] ${email} → ${url}`);
    return;
  }

  const { text, html } = renderEmailBody(url);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [email],
      subject: 'Your Bedrock.fit sign-in link',
      text,
      html,
    }),
  });
  if (!res.ok) {
    // Resend returns JSON errors; surface the message so Sentry
    // captures something actionable.
    const body = await res.text().catch(() => '');
    throw new Error(
      `Resend API returned ${res.status}: ${body.slice(0, 200)}`,
    );
  }
}
