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

> If you'd rather make the **apex** (`bedrock.fit`) the primary instead:
> flip the primary in Vercel → Domains (so `www` redirects to apex), then
> revert the three files + env var back to `https://bedrock.fit`.

---

*Last updated: 2026-07-03*
