import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Next.js loads .env.local automatically at runtime. For standalone scripts
// (e.g. `tsx src/db/seed.ts`), fall back to loading it explicitly.
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check .env.local');
}

// Reuse the postgres client across hot reloads in development so we don't
// exhaust the connection pool.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
