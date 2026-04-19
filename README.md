# Bedrock.fit

A public race-results directory. Anyone can search an event finisher by
name, view their athlete profile with pace + PR stats, and submit a claim
to "own" a result. An admin reviews and approves those claims from a
private dashboard.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19 Server Components)
- **TypeScript** everywhere
- **Tailwind CSS v4** for styling
- **Drizzle ORM** + **postgres-js** over a Railway Postgres
- **Railway** for hosting + auto-deploy on push to `main`

## Quickstart (local dev)

```bash
npm install
cp .env.example .env.local        # fill in the three secrets
npm run dev                        # http://localhost:3000
```

Seed the database with example data (idempotent):

```bash
npm run db:seed
```

Schema migrations use Drizzle Kit's push workflow:

```bash
npx drizzle-kit push
```

## Environment variables

Every variable is required. See `.env.example` for the template.

| Name             | Purpose                                                                                                 | Format                            |
| ---------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `DATABASE_URL`   | Postgres connection string. On Railway, bind to `${{Postgres.DATABASE_URL}}` so rotations propagate.    | `postgres://user:pw@host:5432/db` |
| `ADMIN_PASSWORD` | Sole credential for `/admin/login`. No account, no rate limit — pick something long and random.        | Any string, minimum 8 chars       |
| `SESSION_SECRET` | HMAC-SHA256 key used to sign the admin session cookie. Rotating it invalidates every active session.   | Hex/base64, minimum 32 chars      |

All three are validated on first access by `src/lib/env.ts`. A missing or
too-short value throws a descriptive error the moment the first request
hits the relevant code path.

Generate a fresh `SESSION_SECRET`:

```bash
openssl rand -hex 32
# or, if you don't have openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Routes

| Path             | Visibility | Purpose                               |
| ---------------- | ---------- | ------------------------------------- |
| `/`              | Public     | Search + claim from the home page     |
| `/results`       | Public     | Same search, alternative entry point  |
| `/athletes/[id]` | Public     | Athlete profile: stats + race history |
| `/admin/login`   | Public     | Password form                         |
| `/admin`         | Admin      | List + approve/reject pending claims  |

## Deploy

Push to `main`. Railway's GitHub integration runs `npm run build` and then
`npm start` (which binds `${PORT:-3000}`). The Postgres plugin exposes its
connection string via `${{Postgres.DATABASE_URL}}`; reference it in the
web service's `DATABASE_URL` variable so credential rotations propagate
without a redeploy.

Healthcheck target: `/` (returns 200 once the DB connection succeeds).

## Secret rotation runbook

Rotations should take under 5 minutes and are safe to do at any time.
Each secret has a different blast radius, so the steps differ.

### Rotating `SESSION_SECRET` (invalidates all admin sessions)

1. Generate a new value: `openssl rand -hex 32`.
2. On Railway → web service → **Variables**, update `SESSION_SECRET` to
   the new value. Save.
3. Railway redeploys in ~30s. The moment the new instance takes over,
   every outstanding `admin_session` cookie fails HMAC verification and
   gets treated as unauthenticated.
4. Log in again at `/admin/login`.

No database migration, no user impact (public pages don't use the
cookie). Do this whenever you suspect the secret may have leaked, or on
a quarterly cadence.

### Rotating `ADMIN_PASSWORD` (just log in with the new one)

1. Pick a new password. Don't reuse.
2. On Railway → web service → **Variables**, update `ADMIN_PASSWORD`.
   Save.
3. Wait for redeploy (~30s). Your current session cookie is still valid
   — only future logins are affected.
4. Optionally sign out of `/admin` and sign back in with the new
   password to verify.

Rotate this the moment you suspect it leaked. Existing signed cookies
are unaffected, so rotate `SESSION_SECRET` at the same time if in doubt
about session compromise.

### Rotating `DATABASE_URL` (zero-downtime if using Railway references)

If the web service's `DATABASE_URL` is set to the literal reference
`${{Postgres.DATABASE_URL}}`, Railway rotates credentials for you:

1. On the Postgres plugin → **Data** → **Credentials** → **Rotate**.
2. Railway regenerates the password and updates the reference. The web
   service redeploys automatically with the new connection string.

If `DATABASE_URL` is pinned to a literal string instead (not
recommended), update both the Postgres credentials *and* the web
service's `DATABASE_URL` at the same time. Expect a brief (~30s) window
of failing requests while the web service redeploys.

## Architecture notes

- **Lazy DB client.** `src/db/index.ts` exports a Proxy that materializes
  the `postgres-js` client on first property access. This lets `next
  build` import routes without needing production credentials, and keeps
  cold-start paths cheap.
- **Connection pool size.** Capped at 10 in `src/db/index.ts`. If we
  scale past one instance, multiply by the replica count and check
  against the Postgres plan's `max_connections`.
- **Client/server lib split.** `src/lib/race.ts` is pure + client-safe.
  `src/lib/results.ts` touches the DB. The search client component
  imports only from `race.ts` so the DB driver doesn't leak into the
  browser bundle.
- **Admin auth.** Single shared password, cookie signed with HMAC-SHA256.
  See `src/lib/auth.ts`. No user table, no OAuth. Appropriate while the
  admin surface is one person.
- **Claim atomicity.** Both the public claim action and the admin
  approve/reject actions guard the `UPDATE` with the expected current
  `status`, so stale form submissions or concurrent admins can't
  double-apply.
