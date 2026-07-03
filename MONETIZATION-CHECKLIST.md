# Bedrock.fit — Monetization Checklist

Two tracks below. **Checklist 1** gets the site through AdSense review.
**Checklist 2** is the underlying tech stack that actually turns traffic into
revenue. Check items off as you go (`- [x]`).

> **Decision on record:** no ad-unit placeholder (`<ins class="adsbygoogle">`)
> lives in the site code yet — placing ad units is a deliberate post-approval
> step, so the codebase stays clean until then. The AdSense **loader** tag and
> `google-adsense-account` meta in `src/app/layout.tsx` stay (they're what the
> review crawler looks for), and `public/ads.txt` is already correct.

---

## Checklist 1 — AdSense review readiness

### Site must be live & reachable
- [x] `bedrock.fit` deployed to Vercel **production** (not just a preview URL)
- [x] Apex (`bedrock.fit`) **and** `www` both resolve, over HTTPS with a valid cert
- [x] Domain connected — **Cloudflare** DNS (registrar GoDaddy) → Vercel,
      showing **Valid Configuration**. Primary = `www.bedrock.fit`
      (apex 308→www). See `DOMAIN-SETUP.md`
- [x] No "coming soon" / parked page — the real site loads
- [ ] Set Vercel env `NEXT_PUBLIC_SITE_URL=https://www.bedrock.fit` (Production) + redeploy

### Verification signals (mostly already in place)
- [ ] AdSense loader tag present in `<head>` — ✅ in `layout.tsx`, leave it
- [ ] `google-adsense-account` meta tag present — ✅ in `layout.tsx`
- [ ] `public/ads.txt` = `google.com, pub-4738526719801061, DIRECT, f08c47fec0942fa0` — ✅
- [ ] `robots.txt` allows Google to crawl (check `src/app/robots.ts` isn't blocking)
- [ ] `sitemap.xml` reachable and lists real pages (`src/app/sitemap.ts`)

### Content — the biggest risk (a lone calculator reads as "thin content")
- [x] **Privacy Policy** page — built at route `/privacy`
      (`src/app/privacy/page.tsx`), contact = privacy@bedrock.fit
- [x] **About / Methodology** page — built at route `/methodology`
      (`src/app/methodology/page.tsx`); Epley named, no formula shown
- [x] **Navigation:** Privacy + Methodology links in the **footer only**,
      **12px** (via `SiteFrame`); no header/nav links
- [x] **Design:** document text is monochrome black-on-white (professional);
      neon header, still-matrix background, and footer are the creative frame
- [ ] Point the home-page bundle's footer "Privacy" link at `/privacy`
      (separate edit inside `public/strength-scan.html`)
- [ ] **Terms of Use** / disclaimer page (the "entertainment only, not medical
      advice" language belongs here too)
- [ ] **Contact** method (page or email) — reviewers look for site ownership signals
- [ ] A few genuine content pieces beyond the calculator (FAQ + 2–3 guides, e.g.
      "how strength standards work," "how to estimate your 1RM") to clear the
      low-value-content bar
- [ ] Footer links (Privacy / Terms / About / Contact) present and working

### Quality pass
- [ ] Mobile responsive; loads fast (good Core Web Vitals)
- [ ] No broken links or dead placeholder `href="#..."`
- [ ] Original content only (no copied text/images)
- [ ] Title + meta description on every page — ✅ home covered in `layout.tsx`

### Submit
- [ ] Add `bedrock.fit` under **AdSense → Sites**
- [ ] Confirm site verification passes
- [ ] Click **Request review** and wait (typically 3–14 days)
- [ ] *After approval only:* create a display ad unit, then add the
      `<ins class="adsbygoogle">` snippet to the page (currently intentionally absent)

---

## Checklist 2 — Revenue tech stack

### Serving ads (the core loop)
- [ ] AdSense account approved (publisher `ca-pub-4738526719801061`)
- [ ] `ads.txt` published at domain root — ✅
- [ ] **Consent Management Platform (CMP)** — Google-certified CMP is *required*
      to serve ads to EEA/UK visitors (e.g. Google's own Funding Choices, or
      Cookiebot / Osano). Without it, EU ad revenue is blocked
- [ ] Ad units created + placed (post-approval; see Checklist 1 last item)

### Get paid
- [ ] AdSense **payee profile** completed (name, address)
- [ ] **Tax info** submitted in AdSense
- [ ] Payment method added (bank / wire) and PIN verification done
- [ ] Aware of the **$100 payout threshold**

### Traffic & measurement (no traffic = no revenue)
- [ ] **GA4** installed and receiving data (you already have a GA4 connector)
- [ ] **Google Search Console** verified — track indexing & search traffic
- [ ] Structured data / SEO metadata on key pages
- [ ] Sitemap submitted to Search Console
- [ ] Core Web Vitals monitored (Vercel Analytics or GSC) — speed affects ranking

### Growth & diversification (later)
- [ ] Affiliate links wired in (DEPLOY.md notes ~3 placeholder slots)
- [ ] Email capture / newsletter for repeat visitors
- [ ] Content pipeline for ongoing SEO traffic
- [ ] Revisit premium ad networks once traffic qualifies (Ezoic ~10k/mo,
      Mediavine / Raptive have higher minimums) — typically pay more than AdSense

---

*Last updated: 2026-07-03*
