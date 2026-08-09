# Handoff — `/training` subpage (Leg Strength article)

**Date:** August 4, 2026 · **Branch:** `main` · **Built in:** Cowork (cloud session)
**Read this first if you're Claude Code picking up this work.**

---

## ⚠️ Superseded in part — August 8, 2026

`/training` was restructured into a proper blog. The article now lives at
**`/training/leg-strength`**; `/training` is the category index. Articles are
data files rendered by a shared layout — see **`docs/ARTICLE-GUIDE.md`**, which
is now the document to read before writing an article.

Resolved from the TODO list below: **#4** (Article JSON-LD), **#5** (OG image,
now generated per-article), **#7** (URL shape), and the *duplicated chrome* and
*BarChart is local* entries under Known debt. `npm run build` also now passes.

**No 301 from `/training`.** The old URL is a real page with its own content
now, so redirecting it would make the index unreachable. The article had been
live four days with no accrued link equity; the index links to it prominently
and the sitemap carries both URLs.

Still open below: **#1** (visual QA), **#2** (mobile nav — since fixed in
`globals.css`, verify), **#3** (chart legibility at 360px), **#6** (ad units),
**#8** (commit), and the *two frame systems coexist* debt.

---

## What was done

Added a new subpage at `/training` containing a ~1,950-word evidence-based article
titled **"Leg Strength"**, styled to match the home-page chrome exactly.

### Files changed

| File | Change |
|---|---|
| `src/app/training/page.tsx` | **NEW** — server component, ~470 lines. Full article. |
| `src/app/page.tsx` | Added `Training` link to nav (line ~374) and to footer Resources column. **Nothing else touched.** |
| `src/app/sitemap.ts` | Added `/training` entry, priority 0.8. |

`DOMAIN-SETUP.md` also shows as modified in `git status` — that was **already dirty
before this work started**. Not mine. Leave it or handle separately.

### How the page is built

- **Server component** (no `"use client"`) so `export const metadata` works for SEO.
  Do not add hooks/state without splitting out a client child.
- Palette (`rootVars`), `archivo` / `space` / `mono` font vars, `Logo()`, nav markup
  and footer markup are **copy-pasted from `src/app/page.tsx`** to keep the header
  identical without refactoring the 40 KB home page. See "Known debt" below.
- `Logo()` gradient IDs are `bfTileTH` / `bfTileTF` (note the extra `T`) to avoid
  colliding with the home page's `bfTileH` / `bfTileF` if both ever render together.
- Home CTA is a `<button onClick={openScan}>`; here it's a `<Link href="/">` styled
  identically, since the scan modal lives in the home page's client state.
- 4 charts are built from **CSS grid**, not SVG — zero new dependencies.
  Horizontal bars, `role="img"` + generated `aria-label` listing every data
  point. Palette: `#2f9e5f` accent, `#8fcfa8` secondary. **Corrected
  2026-08-09:** an earlier draft of this document called them hand-written
  inline SVG. They are not, and the difference is deliberate — a fixed-`viewBox`
  SVG scaled into a phone's ~274px column rendered its 12px labels at roughly
  6px and pushed long labels outside the plot area. The CSS-grid approach holds
  a real `12.5px` label at a 375px viewport. The only inline `<svg>` on the page
  is the logo.
- Footnotes are anchor links (`<Ref n={3} />` → `#source-3`) into an ordered list
  of 12 sources rendered at 11.5px, followed by a medical disclaimer.
- Reuses existing global classes: `.lp-nav`, `.lp-nav-links`, `.lp-stats`,
  `.lp-footer-cols`, `.lp-flink`.
- ⚠️ **`globals.css` WAS changed — 33 lines, and not all of it is scoped to
  this page.** An earlier draft of this document claimed no changes were
  needed. Two blocks landed:
  - `.bf-chart*` — new, additive, used only by the article. Safe.
  - `.lp-nav-links` mobile override at line ~122 — **site-wide**. It replaces
    `@media(max-width:820px){.lp-nav-links{display:none}}`, which left phones
    with no navigation on *any* page. Links now drop to their own scrollable
    row under the logo with a mask fade for overflow. A genuine bug fix, but it
    changed every page's mobile header, not just this one.

---

## Verification status

**Updated 2026-08-09.** Everything below has since been run and the page is
deployed.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| `npx eslint src` | ✅ clean |
| `npm run build` | ✅ clean — first real run 2026-08-08, 10/10 static |
| Visual / mobile QA | ✅ float verified at 1280px and 375px |
| Deployed | ✅ live, article now at `/training/leg-strength` |

The original blocker — `EPERM: operation not permitted, unlink '.../.next/…'`
when a cloud session tries to clear `.next` — is a sandbox filesystem
limitation, not a code error. The workaround is to build in a copied tree
outside the mount rather than in place.

**This page has since moved.** `/training` is now the article index;
the article itself lives at `/training/leg-strength`, rendered from
`src/lib/articles/content/leg-strength.ts` through the `[slug]` route rather
than from the hand-written page described below. Read `docs/ARTICLE-GUIDE.md`
for the current model — this document is retained as the record of how the
first article was built, not as a guide to the present structure.

---

## TODO — in order

1. **Build + eyeball it.**
   ```bash
   rm -rf .next && npm run build && npm run dev
   ```
   Open `http://localhost:3000/training`. Confirm the header is pixel-identical to
   `/` (logo, sticky blur, green CTA) and that the 4 SVG charts scale correctly.

2. **Mobile nav is broken site-wide — pre-existing, now more visible.**
   `globals.css:112` → `@media(max-width:820px){.lp-nav-links{display:none}}`.
   Under 820px there is **no navigation at all**, so `/training` is unreachable on
   phones except via the footer. The article is a mobile-heavy content page, so this
   matters more now. Options: hamburger menu, or a horizontally-scrolling link row.
   *Decide with Rick before building.*

3. **Check chart legibility at 360px width.** The `BarChart` viewBox is `0 0 560 H`
   with a 176px label column — labels like "Balance + functional + resistance" may
   get tight when scaled down. If so, add a `labelW` prop and shorten labels on
   narrow viewports (or wrap labels to two `<tspan>`s).

4. **Add `Article` JSON-LD** to `/training` (`headline`, `datePublished`,
   `dateModified`, `author`, `publisher`). The page has good `metadata` already but
   no structured data. Worth it for a long-form SEO page.

5. **OG image.** `openGraph` is set but there's no `images` entry, so social shares
   fall back to text. Consider `app/training/opengraph-image.tsx`.

6. **AdSense.** The loader is in `layout.tsx` but no ad units are placed anywhere.
   This page is the best inventory on the site (long, on-topic, scroll depth). If
   Rick wants units, mid-article after the second chart is the natural slot.
   Check `MONETIZATION-CHECKLIST.md` first.

7. **Decide the URL shape before writing article #2.** Right now `/training` *is*
   the leg-strength article. If more articles are coming, restructure to
   `/training` (index) + `/training/leg-strength`, and set up a 301. Cheaper to do
   now than after it indexes.

8. **Commit.** Suggested message:
   ```
   Add /training subpage: Leg Strength article with inline SVG charts and sources
   ```
   Note `DOMAIN-SETUP.md` is separately dirty — stage selectively:
   ```bash
   git add src/app/training src/app/page.tsx src/app/sitemap.ts
   ```

---

## Known debt

- **Duplicated chrome.** `rootVars`, `Logo()`, the nav `<header>` and the `<footer>`
  now exist in both `src/app/page.tsx` and `src/app/training/page.tsx`. A third
  light-theme page is the point at which this should become
  `src/components/LightFrame.tsx` (analogous to the existing dark
  `SiteFrame.tsx`). Deliberately deferred to avoid touching the home page.
- **Two frame systems coexist.** `/methodology` and `/privacy` use the dark neon
  `SiteFrame`; `/` and `/training` are the light involve.me-style theme. Rick may
  eventually want the legal pages migrated to the light theme for consistency.
- `BarChart` is local to the training page. Promote to `src/components/` when a
  second page needs a chart.

---

## Editorial notes

- All statistics are footnoted to primary or authoritative secondary sources
  (JAMA, Cochrane, BJSM, Journals of Gerontology, CDC, WHO, Harvard Health).
  **Do not add or alter a figure without adding its source to the `SOURCES` array.**
- Framing is deliberately non-prescriptive and hedged (associations, not causal
  claims), with a disclaimer at the foot — consistent with `/methodology`.
- Body prose is ~1,950 words; total on-page copy including captions and sources
  clears 2,000.
