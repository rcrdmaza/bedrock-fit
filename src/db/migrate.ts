// Minimal, idempotent migrator. Runs every *.sql file in
// drizzle/migrations/ in filename order against $DATABASE_URL.
//
// Why a handwritten runner rather than `drizzle-kit migrate`?
//   - The DB was initially bootstrapped with `drizzle-kit push`, so we
//     don't have a drizzle-meta/_journal.json to reconcile against.
//   - Our migration files use `ADD COLUMN IF NOT EXISTS` etc. — safe to
//     re-run. That means we can apply the whole directory every deploy
//     without tracking which ones have run.
//   - Zero new dependencies: we reuse the `postgres` driver that the
//     app already loads.
//
// Run locally:  npm run db:migrate
// On Railway:   railway run npm run db:migrate   (or wire into a deploy hook)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { getDatabaseUrl } from '@/lib/env';

const MIGRATIONS_DIR = 'drizzle/migrations';

async function main(): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migrations found.');
    return;
  }

  // Single connection, no prepared statements — migrations are one-shot
  // DDL, not hot-path queries.
  const sql = postgres(getDatabaseUrl(), { prepare: false, max: 1 });

  try {
    for (const file of files) {
      const body = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').trim();
      if (!body) continue;
      process.stdout.write(`→ ${file} ... `);
      // postgres.js treats .unsafe as "run this exact string" — required
      // because our files contain multiple statements separated by ';'.
      await sql.unsafe(body);
      console.log('ok');
    }
    console.log(`\nApplied ${files.length} migration${files.length === 1 ? '' : 's'}.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
