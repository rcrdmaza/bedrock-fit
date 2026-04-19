import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl } from '@/lib/env';
import * as schema from './schema';

// The DB client is created lazily on first use. This is important for two
// reasons:
//
// 1. During `next build`, Next.js imports route modules to collect page data
//    for `/results`. If we instantiated the client at module load, a missing
//    DATABASE_URL would crash the build — even though the route is marked
//    `force-dynamic` and will never run at build time.
// 2. It keeps cold-start work off the module-eval path, so an unrelated
//    import of `@/db` doesn't pay the connection cost.

type DbSchema = typeof schema;
type Db = PostgresJsDatabase<DbSchema>;

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: Db;
};

// Connection pool config — tuned for a single Railway instance. If we scale
// horizontally later, multiply `max` by the instance count and check it
// against the Postgres plan's `max_connections` ceiling (default 100 on
// Railway's hobby tier).
const POOL_OPTIONS = {
  // PgBouncer in transaction mode (Railway's default) can't use prepared
  // statements, so leave them off.
  prepare: false,
  // Cap concurrent connections at 10. Beyond this, queries queue in the
  // driver until a connection frees up — better than hammering Postgres.
  max: 10,
  // Close an idle connection after 20s so we're not holding a slot while
  // nothing's happening. Fresh connections on cold paths are cheap.
  idle_timeout: 20,
  // Recycle a connection after 30 min regardless, to dodge any long-lived
  // state issues (stale prepared-statement caches, SSL renegotiation, etc.).
  max_lifetime: 60 * 30,
  // Fail fast if the DB is unreachable — 30s is the postgres default and
  // way too long for a web request.
  connect_timeout: 10,
} as const;

function createDb(): Db {
  const client =
    globalForDb.pgClient ?? postgres(getDatabaseUrl(), POOL_OPTIONS);

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pgClient = client;
  }

  return drizzle(client, { schema });
}

function getDb(): Db {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;
  const instance = createDb();
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.drizzleDb = instance;
  }
  return instance;
}

// Proxy so callers can keep using `db.select()...` without noticing the
// laziness. Each property access routes through getDb(), which connects on
// first call and caches after that.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export { schema };
