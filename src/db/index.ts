import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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

function createDb(): Db {
  // Next.js loads .env.local automatically at runtime. For standalone scripts
  // (e.g. `tsx src/db/seed.ts`), fall back to loading it explicitly.
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.local' });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. In dev, check .env.local. In production, set it on the Railway service.',
    );
  }

  const client =
    globalForDb.pgClient ?? postgres(connectionString, { prepare: false });

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
