# Domain Setup — bedrock.fit

How the custom domain is wired up. **The DNS lives at Cloudflare**, not
GoDaddy. GoDaddy is only the registrar; the domain's nameservers are
delegated to Cloudflare, so all DNS records are managed in the Cloudflare
dashboard. Vercel detects this and shows "The DNS records at Cloudflare
must match…".

- **Registrar:** GoDaddy
- **DNS / nameservers:** Cloudflare (authoritative)
- **Host:** Vercel (project `bedrock-fit`)
- **Primary production domain:** `www.bedrock.fit`
  (apex `bedrock.fit` 308-redirects to `www`)
- **Default Vercel URL (fallback):** `bedrock-fit.vercel.app`

---

## The connection process (what was done)

### 1. Add the domains in Vercel
Vercel → project `bedrock-fit` → **Settings → Domains** → add both
`bedrock.fit` and `www.bedrock.fit`. `www` is set as the primary; the apex
redirects to it (308). Vercel then displays the DNS record(s) to create and
the target value (a per-project `…​.vercel-dns…` CNAME target).

### 2. Add the records in Cloudflare
Cloudflare → select `bedrock.fit` → **DNS → Records**. Add:

| Type  | Name  | Target                              | Proxy status        |
| ----- | ----- | ----------------------------------- | ------------------- |
| CNAME | `@`   | *(the value Vercel shows — copy it)* | **DNS only** (grey) |
| CNAME | `www` | *(same value)*                      | **DNS only** (grey) |

Copy the exact target from Vercel's copy button (don't hand-type the
truncated display value). Cloudflare flattens the apex `@` CNAME to A
records automatically, so an apex CNAME is valid here.

### 3. Critical gotchas
- **Proxy must be OFF (grey cloud / "DNS only").** Vercel shows
  "Proxy: Disabled". Leaving Cloudflare's orange-cloud proxy in front of
  Vercel causes SSL "too many redirects" errors and blocks Vercel's
  certificate issuance.
- **Remove conflicting records first.** Delete any pre-existing `A @`,
  old `76.76.21.21`, parking records, or redirect rules on `@`/`www` —
  Cloudflare won't allow a CNAME to coexist with them on the same name.
- **New vs. old targets.** Vercel's "planned IP range expansion" note means
  the new `…vercel-dns…` target is preferred; the legacy
  `cname.vercel-dns.com` / `76.76.21.21` still work but use the new value.

### 4. Verify
Wait a few minutes. In Vercel, both entries flip from **Invalid
Configuration** to **Valid Configuration** and HTTPS is auto-issued. Then
load `https://www.bedrock.fit` and confirm `https://bedrock.fit` redirects
to it. ✅ **Status: connected.**

---

## Code alignment (kept in sync with the primary domain)

Because `www.bedrock.fit` is the primary, the app's canonical / metadata
base is set to it. The default lives in three files and is overridable via
env:

- `src/app/layout.tsx` — `metadataBase`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

All default to `https://www.bedrock.fit`, overridable with
`NEXT_PUBLIC_SITE_URL`.

### Action item — set the Vercel env var
On Vercel → **Settings → Environment Variables**, set (Production):

| Name                   | Value                       |
| ---------------------- | --------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.bedrock.fit`   |

(Older docs said `https://bedrock.fit` — update it to the `www` value so
canonical tags, OG URLs, sitemap, and robots all point at the
non-redirecting primary. Redeploy after changing.)

**Verified 2026-08-09 — resolved, no action outstanding.** The env var was
updated to the `www` value on 2026-07-03 and a live fetch now confirms
everything renders the non-redirecting primary:

| Surface | Live value |
| ------- | ---------- |
| `<link rel="canonical">` on `/training`, `/training/leg-strength` | `https://www.bedrock.fit/…` |
| `og:url` | `https://www.bedrock.fit/…` |
| `Article` / `ItemList` JSON-LD | `https://www.bedrock.fit/…` |
| `sitemap.xml` — all five `<loc>` | `https://www.bedrock.fit/…` |
| `robots.txt` — `Sitemap:` | `https://www.bedrock.fit/sitemap.xml` |

Code default and live output now agree, so an unset env var would produce the
same result.

**Changed 2026-08-09:** the var was scoped to Production *and* Preview; it is
now **Production only**, and its value was re-entered explicitly as
`https://www.bedrock.fit`.

Two things worth knowing:

- **The Sensitive flag could not be cleared.** Vercel does not let an existing
  variable be un-flagged through Edit — it needs deleting and recreating. This
  is a misuse of the flag for a `NEXT_PUBLIC_*` value, which is compiled into
  the client bundle and publicly readable in the shipped JS anyway. The only
  real effect is that the value cannot be read back in the dashboard, which
  makes editing risky: the Value field opens **empty**, so saving without
  retyping the value would silently blank it. Recorded here precisely so that
  is recoverable.
- **Removing it from Preview does not change preview behaviour.** The code
  fallback is the same production URL, so preview builds still render
  `https://www.bedrock.fit` canonicals. Genuinely fixing that would mean
  teaching the code to prefer `VERCEL_URL` outside production — a code change,
  not a config one. Low priority: Vercel previews ship `noindex`, so the only
  cost is that previews can't be used to check metadata.

> If you'd rather make the **apex** (`bedrock.fit`) the primary instead:
> flip the primary in Vercel → Domains (so `www` redirects to apex), then
> revert the three files + env var back to `https://bedrock.fit`.

---

*Last updated: 2026-07-03*
