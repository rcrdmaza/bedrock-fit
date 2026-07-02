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
| `NEXT_PUBLIC_SITE_URL` | `https://bedrock.fit`   | Production  |

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

## 4. Point the GoDaddy domain at Vercel

1. In Vercel: **Project → Settings → Domains → Add** `bedrock.fit` (and
   `www.bedrock.fit`). Vercel shows you the exact DNS records to create —
   **use the values Vercel displays**; the ones below are the current
   defaults:

   | Type  | Name / Host | Value                    |
   | ----- | ----------- | ------------------------ |
   | A     | `@`         | `76.76.21.21`            |
   | CNAME | `www`       | `cname.vercel-dns.com`   |

2. In GoDaddy: **My Products → your domain → DNS → Manage DNS.**
   - Delete GoDaddy's existing parking `A @` record, add the `A @` above.
   - Add/replace the `CNAME www` above.
   - Save. Propagation is usually minutes, up to a couple hours.

3. Back in Vercel, the domain flips to **Valid Configuration** once DNS
   resolves. Vercel issues the HTTPS certificate automatically.

**Optional staging subdomain:** add `staging.bedrock.fit` in Vercel and assign
it to the `staging` branch, then add a `CNAME staging → cname.vercel-dns.com`
in GoDaddy.

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
