# Bedrock.fit — Stop All Billing

Goal: halt charges on every paid account behind Bedrock.fit. The site will go
offline. Do the backup step **first** — suspending Railway can destroy the
Postgres data if you skip it.

The services in play (from `.env.example` / `README.md`):

| Service     | What it costs money for            | Data loss risk if removed        |
| ----------- | ---------------------------------- | -------------------------------- |
| **Railway** | App hosting + Postgres database    | **High** — DB is deleted with it |
| **Resend**  | Magic-link sign-in emails          | None (no stored data you need)   |
| **Sentry**  | Error monitoring (often free tier) | None                             |
| **Domain**  | `bedrock.fit` registration/renewal | None, but you lose the name      |

---

## 0. Back up the database first (do not skip)

If you ever want to bring Bedrock.fit back, you need this dump. Run locally
with the production `DATABASE_URL` (copy it from Railway → Postgres → Variables):

```bash
pg_dump "postgresql://user:password@host:5432/dbname" > bedrock-fit-backup.sql
```

Store `bedrock-fit-backup.sql` somewhere safe off Railway. Confirm the file is
non-empty before continuing.

---

## 1. Railway — biggest cost, do this to stop hosting + DB charges

Railway bills for both the app service and the Postgres plugin, so this is
where most of the spend is.

**Fastest way to stop charges (keeps the project shell):**
1. Go to https://railway.app → your **Bedrock.fit** project.
2. For the **app service**: open it → Settings → **Remove Service** (or pause
   the deployment). This stops it serving traffic.
3. For **Postgres**: only remove it *after* your backup is confirmed. Open the
   Postgres service → Settings → **Remove Service**.
4. Also disable auto-deploy so a future `git push` to `main` doesn't spin it
   back up: app service → Settings → disconnect the GitHub repo / turn off
   "Deploy on push."

**To end billing entirely:**
- Delete the whole project: Project → Settings → **Danger** → **Delete Project**.
- Then check **Account → Usage / Billing** to confirm no other projects are
  accruing, and downgrade the plan to the free/hobby tier if you're on a paid
  seat: https://railway.app/account/billing.

> Note: On the usage-based Hobby plan, removing services stops metered charges
> immediately. On a Pro seat you're also paying a flat monthly seat fee —
> downgrade the plan to fully zero it out.

---

## 2. Resend — stop email sending charges

1. Go to https://resend.com → sign in.
2. If you're on a paid plan: **Settings → Billing → Cancel plan / downgrade to
   free.** The free tier is $0, so downgrading is enough to stop charges.
3. Optional cleanup: revoke the API key so nothing can send in your name —
   **API Keys →** delete the key referenced by `RESEND_API_KEY`.
4. Optional: remove the verified `bedrock.fit` sending domain under **Domains**
   if you're done with it.

---

## 3. Sentry — usually free, but close it out

Sentry's Developer tier is free, so you may not be billed at all. To be sure:

1. Go to https://sentry.io → **Settings → Subscription / Billing.**
2. If on a paid plan, **cancel / downgrade to the Developer (free) plan.**
3. Optional: disable the project so it stops ingesting — **Projects →
   bedrock-fit → Settings → Disable/Delete.** (Not required to stop billing if
   you're already on the free tier.)

---

## 4. Domain — recurring annual charge

The `bedrock.fit` domain renews yearly wherever you registered it (Namecheap,
Cloudflare, Porkbun, Google Domains successor, etc. — check your email for the
registration receipt).

1. Log into your registrar.
2. Find `bedrock.fit` → **turn off auto-renew** so it isn't charged again.
3. Leave it registered until it expires if you might want the name back;
   otherwise let it lapse.

---

## Things I can't do for you (no connected access)

I don't have connectors to Railway, Resend, Sentry, or your domain registrar,
so every step above is something you'll do while logged into each dashboard. If
you connect any of those accounts, I can help drive the parts that have an API
(e.g. Railway project/service management). The `pg_dump` backup in step 0 I can
run for you if you paste in (or point me at) the production `DATABASE_URL`.

## Quick recap / order of operations

1. `pg_dump` the database and verify the file.
2. Railway: remove app + Postgres services (or delete project) and disable
   auto-deploy → **stops the largest charge.**
3. Resend: downgrade to free, revoke API key.
4. Sentry: confirm free tier / downgrade.
5. Domain: turn off auto-renew.
