# Deploying Bedrock.fit (Vercel + GoDaddy)

One page, no database, no server state → free on Vercel, with staging and
production for free. These are the one-time steps **you** run (I can't log
into your GitHub, Vercel, or GoDaddy accounts).

---

## 1. Push the code to GitHub

Same repo, same account as before:

```bash
git add -A
git commit -m "Rebuild as single-page athletic potential calculator"
git push origin main
```

---

## 2. Create the Vercel project

1. Go to https://vercel.com → sign in **with the same GitHub account**.
2. **Add New → Project → Import** the `bedrock-fit` repo.
3. Framework preset auto-detects **Next.js** — accept the defaults (build
   `next build`, output handled automatically). Click **Deploy**.
4. First deploy gives you a `*.vercel.app` URL. That's production until you
   attach the domain.

**Environment variable** (Project → Settings → Environment Variables):

| Name                   | Value                   | Environment |
| ---------------------- | ----------------------- | ----------- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.bedrock.fit` | Production  |

Leave it unset for Preview (it defaults fine), or set it to your staging
URL if you want canonical tags correct there too.

---

## 3. Staging vs. production

Vercel gives you both automatically:

- **Production** = the `main` branch → serves `bedrock.fit`.
- **Staging** = create a long-lived `staging` branch. Every push to it gets a
  stable preview URL, and you can pin a subdomain to it:

  ```bash
  git checkout -b staging
  git push origin staging
  ```

Workflow: merge work into `staging` first, check the preview, then merge
`staging → main` to ship to production. (Every PR also gets its own throwaway
preview URL for free.)

---

## 4. Point the domain at Vercel  →  see `DOMAIN-SETUP.md`

**DNS is managed at Cloudflare, not GoDaddy.** GoDaddy is only the registrar;
the nameservers are delegated to Cloudflare, so all DNS records are added in
the **Cloudflare** dashboard. Vercel confirms this by showing "The DNS records
at Cloudflare must match…".

The full, current process (records, proxy-off caveat, verification) lives in
**`DOMAIN-SETUP.md`**. In short:

1. In Vercel: **Settings → Domains → Add** `bedrock.fit` and
   `www.bedrock.fit` (`www` is the primary; apex 308-redirects to it).
2. In **Cloudflare → DNS → Records**, add a `CNAME @` and `CNAME www`, both
   pointing at the target Vercel shows, with **Proxy status = DNS only
   (grey cloud)**. Do not enable the orange-cloud proxy — it breaks Vercel's
   SSL. Delete any conflicting `A @` / parking records first.
3. Back in Vercel, both flip to **Valid Configuration** and HTTPS is issued
   automatically. ✅ Status: connected.

> **Status: connected.** Domain is live at `https://www.bedrock.fit`.

---

## 5. Turn on the money (after it's live)

AdSense is already wired in `src/app/layout.tsx` (publisher
`ca-pub-4738526719801061`).

1. In AdSense, add/verify `bedrock.fit` — the loader tag is already in `<head>`,
   so verification should pass once the site is live.
2. Create a display ad unit, copy its `<ins class="adsbygoogle">` snippet, and
   drop it where the `AD SLOT` placeholder is in `src/app/page.tsx`.
3. Replace the three affiliate `href="#..."` placeholders (bottom of the
   results card) with your real affiliate links.

> Note: for AdSense in the EU/UK you'll eventually need a cookie-consent
> banner and a privacy page. Not required to go live or to start earning from
> non-EU traffic — a down-the-road item.

---

## Recap

1. `git push` → 2. Import to Vercel → 3. `staging` branch for staging →
4. GoDaddy DNS → Vercel → 5. AdSense unit + affiliate links.

Result: `bedrock.fit` live, free hosting, staging + production, near-zero
maintenance.
