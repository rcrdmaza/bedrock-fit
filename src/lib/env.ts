// Typed, fail-fast accessors for every env var the server needs.
//
// Why not just read process.env directly?
//   1. We want a single definition of "what counts as valid" per var, so a
//      half-set deploy (e.g. SESSION_SECRET="change-me") fails with a clear
//      message instead of silently using a weak key.
//   2. Validation happens on first access, not at module load — so `next
//      build` can still import modules that transitively reach this file
//      without forcing the build box to know the production secrets.
//   3. Each accessor memoizes, so the regex/length checks only run once per
//      process. Hot paths stay hot.
//
// This module is server-only. Bundling it into a client component would ship
// dotenv + node:process to the browser; don't.
import * as dotenv from 'dotenv';

let dotenvLoaded = false;
function ensureLoaded(): void {
  // Next auto-loads .env.local in `next dev` and `next start`. Standalone
  // scripts (`tsx src/db/seed.ts`, the smoke-test harness) don't get that
  // for free — fall back to loading it exactly once if nothing's there yet.
  if (dotenvLoaded) return;
  dotenvLoaded = true;
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.local' });
  }
}

class EnvError extends Error {
  constructor(name: string, reason: string) {
    super(
      `${name} env var ${reason}. See .env.example and the "Environment variables" section in README.md.`,
    );
    this.name = 'EnvError';
  }
}

function readString(name: string, minLen: number, purpose: string): string {
  ensureLoaded();
  const raw = process.env[name];
  if (!raw) throw new EnvError(name, 'is not set');
  const trimmed = raw.trim();
  if (trimmed.length < minLen) {
    throw new EnvError(
      name,
      `is too short (need >= ${minLen} chars for ${purpose})`,
    );
  }
  return trimmed;
}

// Cached after first successful validation. Separate from the `process.env`
// read so we never revalidate on every cookie check.
let databaseUrl: string | undefined;
let adminPassword: string | undefined;
let sessionSecret: string | undefined;

export function getDatabaseUrl(): string {
  if (databaseUrl) return databaseUrl;
  const v = readString('DATABASE_URL', 12, 'a postgres connection string');
  try {
    const u = new URL(v);
    if (!u.protocol.startsWith('postgres')) throw new Error('bad protocol');
  } catch {
    throw new EnvError(
      'DATABASE_URL',
      'must be a postgres:// or postgresql:// URL',
    );
  }
  databaseUrl = v;
  return v;
}

export function getAdminPassword(): string {
  if (adminPassword) return adminPassword;
  // 8 is the pragmatic minimum — the /admin/login form doesn't rate-limit,
  // so an 8-char random password is acceptable but users should pick much
  // longer. Anything weaker than 8 is a clear misconfiguration.
  adminPassword = readString(
    'ADMIN_PASSWORD',
    8,
    'a reasonably strong admin password',
  );
  return adminPassword;
}

export function getSessionSecret(): string {
  if (sessionSecret) return sessionSecret;
  // 32 chars ≈ 128 bits of entropy once you use hex/base64. `openssl rand
  // -hex 32` gives 64 hex chars and is the recommended generator.
  sessionSecret = readString(
    'SESSION_SECRET',
    32,
    'an hmac key (use `openssl rand -hex 32`)',
  );
  return sessionSecret;
}
