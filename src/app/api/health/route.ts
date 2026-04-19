// Liveness + DB-readiness probe. Intended for:
//   • Railway's service healthcheck (configure the healthcheck path to
//     /api/health so failed deploys don't accept traffic)
//   • External uptime monitors (UptimeRobot, BetterStack, etc.)
//   • Humans curling it when things look off
//
// Response shape is intentionally small and stable so anything polling
// it can parse trivially:
//   200 → { status: 'ok', db: { up: true, latencyMs }, uptimeMs }
//   503 → { status: 'down', db: { up: false, error }, uptimeMs }
import { sql } from 'drizzle-orm';
import { db } from '@/db';

// Must run in the node runtime — the postgres driver isn't edge-compatible.
export const runtime = 'nodejs';
// Never cache. A healthcheck that returns a cached 200 would be worse
// than useless.
export const dynamic = 'force-dynamic';

// Hard cap on DB round-trip. If the driver can't finish a trivial `select
// 1` in this window, something is genuinely wrong and we want the probe
// to report down rather than hold the request open for 30s.
const DB_TIMEOUT_MS = 500;

// Tracks process start so the response can report how long this instance
// has been serving. Useful when debugging flapping deploys.
const startedAt = Date.now();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`db check timed out after ${ms}ms`)),
      ms,
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export async function GET(): Promise<Response> {
  const pingStart = Date.now();
  try {
    await withTimeout(db.execute(sql`select 1`), DB_TIMEOUT_MS);
    return Response.json(
      {
        status: 'ok',
        db: { up: true, latencyMs: Date.now() - pingStart },
        uptimeMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch (e) {
    return Response.json(
      {
        status: 'down',
        db: { up: false, error: (e as Error).message },
        uptimeMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
