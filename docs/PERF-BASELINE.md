# Core Web Vitals baseline

Measured 9 August 2026, at commit `6d4fe03`, **before any ad units are placed**.

The point of this file is comparison. When ad units land, re-run the same
measurements and diff against the numbers here. Anything that moves is the ads.

---

## The headline finding, before the numbers

**The AdSense loader is already on every page.** `src/app/layout.tsx` emits

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=..." crossorigin="anonymous" />
```

verbatim into the `<head>` of the SSR HTML, on every route, and it is present in
the built HTML for both `/` and every article. It is there deliberately, so the
AdSense verification crawler finds a literal tag, and the comment above it says
not to swap it for `next/script`.

So this is not a clean pre-ads baseline. It is a **pre-ad-*units*** baseline. The
third-party script that does the most damage to INP is already loading and
already executing. What placing ad units adds on top is the fetching and painting
of the slots themselves, which is mostly a CLS and LCP story.

That distinction matters when reading the diff later. If INP is already poor
today, do not expect removing an ad unit to fix it.

---

## Field data: none, and that is the real headline

Chrome UX Report returns **No Data** for `https://www.bedrock.fit/`.

This is not a measurement failure. CrUX only reports an origin once it has enough
real visitors, and the site does not have them yet. The same absence is why the
BigQuery export has produced no dataset.

**LCP, CLS and INP as Google actually uses them are field metrics.** They come
from real sessions on real devices. Until CrUX populates:

- **INP cannot be measured at all.** It requires real interactions. Lighthouse
  does not produce it and never has. Total Blocking Time is the lab proxy, and
  it is a rough one.
- **LCP and CLS lab values are a simulation**, run on one throttled emulated
  device, from one location, once. Treat them as directional.

The honest position: this document is a **lab** baseline. It is worth having,
because a lab number moving after an ads change still tells you something. But
the field numbers will only start existing once traffic does, and those are the
ones that affect ranking.

---

## Lab results (Lighthouse via PageSpeed Insights)

Captured 10 Aug 2026. Environment for every mobile run: emulated Moto G Power,
Slow 4G throttling, Lighthouse 13.4.1, HeadlessChromium 150.

| | `/` mobile | `/` desktop | `/training` mobile |
|---|---|---|---|
| **Performance** | **61** | **96** | **51** |
| Accessibility | 94 | 94 | 93 |
| Best Practices | 81 | 100 | 100 |
| SEO | 100 | 100 | 100 |
| First Contentful Paint | 4.4 s | 0.3 s | 5.0 s |
| **Largest Contentful Paint** | **7.7 s** | 0.7 s | **7.3 s** |
| Total Blocking Time | 120 ms | 160 ms | 10 ms |
| **Cumulative Layout Shift** | 0 | 0 | **0.24** |
| Speed Index | 5.9 s | 0.8 s | 5.0 s |

Thresholds: LCP good under 2.5 s, poor over 4.0 s. CLS good under 0.1, poor over
0.25. TBT good under 200 ms.

`/training/leg-strength` **was not captured.** After four completed runs, PSI
stopped starting new analyses for this origin and the page never left its loading
state across two attempts. Retry it later; it is the heaviest article and the
only route carrying both the carousel script and a YouTube embed, so it is the
one most likely to differ from `/training`.

### Read the variance before you read anything else

The same URL, same form factor, measured twice:

| Run | Performance |
|---|---|
| 9 Aug, 21:33 | 44 |
| 10 Aug, 08:32 | 61 |

**Seventeen points apart with no code change between them.** Nothing shipped in
that window. This is what a single Lighthouse run is worth as evidence, and it is
the reason to compare the metric values rather than the headline score, and to
run three times and take the median before concluding anything after ads land.

---

## Static analysis, which does not need the network

These come from a production build and are exact. They are the most useful
comparison numbers in this file, because unlike Lighthouse they do not vary with
network conditions or which server answered.

### JavaScript per route

| Route | Chunks | Uncompressed |
|---|---|---|
| `/` | 10 | 667.8 KB |
| `/training/leg-strength` | 9 | 641.6 KB |
| `/methodology` | 9 | 625.0 KB |
| `/training` | 9 | 621.8 KB |

Home page bundle gzipped: **193.4 KB**. Largest single chunk: 221.0 KB
uncompressed.

### Everything in `.next/static`

| Type | Size |
|---|---|
| JS | 711.6 KB |
| **woff2 fonts** | **264.6 KB across 17 files** |
| CSS | 26.8 KB |
| SVG | 0.8 KB |

### Prerendered HTML per route

| Route | Size |
|---|---|
| `/training/leg-strength` | 144.8 KB |
| `/training/sarcopenia` | 136.9 KB |
| `/training/squats-knees` | 130.1 KB |
| `/training/progressive-overload` | 126.4 KB |
| `/training` | 55.7 KB |
| `/` | 29.6 KB |
| `/terms` | 26.6 KB |
| `/privacy` | 23.0 KB |
| `/methodology` | 20.1 KB |
| `/contact` | 19.1 KB |

Articles are large because the content is inlined in the prerendered HTML, which
is the right trade: it is the reason they paint without waiting on a fetch.

---

## The two flagged risks, both checked

### `strength-scan.html` — not a risk, already gone

Both `https://www.bedrock.fit/strength-scan.html` and the archived path return
**404**. The file survives at `archiv3ed/public/strength-scan.html`, which is
outside `public/` and therefore never built or served. It costs nothing at
runtime. Search Console previously confirmed Google never indexed it.

Closed. It does not belong on the performance list.

### The matrix canvas — smaller than it sounds, and on the wrong pages to matter

`src/components/SiteFrame.tsx` draws matrix rain onto a `<canvas>`. Three things
make it much less alarming than "canvas animation" suggests:

1. **It is not animated.** One still frame, drawn once in a `useEffect` on
   mount. No `requestAnimationFrame`, no `setInterval`. It draws roughly
   `viewport width / 14` columns of a few characters each and then stops. There
   is no ongoing main-thread cost, so it cannot degrade INP after load.
2. **It cannot cause layout shift.** The canvas is `position: absolute; inset: 0`
   behind the content, so it occupies no layout space and moves nothing.
3. **It is not on any page that matters commercially.** `SiteFrame` is imported
   only by `/methodology`, `/privacy`, `/terms` and `/contact`. The home page,
   `/training` and every article use `LightFrame` instead. The two mentions of
   SiteFrame in `layout.tsx` and `globals.css` are comments, not imports.

The one real cost is that it forces those four routes to hydrate a client
component for decoration, and it reads `parent.offsetWidth` on mount, which is a
forced reflow. On legal pages nobody is trying to convert, that is acceptable.

**Verdict: not the problem.** If Performance 44 needs explaining, look elsewhere.

---

## What the numbers actually say

### 1. `/training` already fails CLS, before a single ad exists

**0.24, against a 0.1 threshold.** This is the finding that matters most, because
layout shift is exactly what ad units make worse, and the budget is spent before
the ads arrive.

Lighthouse attributes the entire 0.240 to `body` rather than to a named child,
which means it is not one late image pushing things down. A whole-body shift that
size, on a route whose content is fully prerendered, points at web fonts:
text paints in a fallback face, the real face arrives, every line re-flows, and
the page shifts as one. Four families and 17 files make that a very plausible
mechanism, and the home page having CLS 0 fits, since it is a different, more
tightly controlled layout.

Worth confirming with the LCP breakdown and the font `display` strategy before
acting. But **do not place ad units on `/training` until this is fixed**, or the
two causes become impossible to separate.

### 2. LCP is the mobile problem, and it is not page-specific

7.7 s on the home page, 7.3 s on `/training`, against 0.7 s on desktop. Both are
in the "poor" band, both are close to each other, and the desktop numbers are
excellent. That pattern says the cost is in the shared shell under a throttled
connection, not in anything either page does individually.

The prime suspect remains **264.6 KB of fonts across four families and 17 files**:
`Geist`, `Archivo` (3 weights), `Space Grotesk` (3 weights) and `JetBrains Mono`
(2 weights), with four preloaded on the home page. `Geist` in particular is
referenced exactly once, as the `body` default in `globals.css`, sitting in front
of a system stack that would look nearly identical. Dropping it is the cheapest
experiment available.

### 3. It is not a JavaScript execution problem, so the canvas theory is dead

Total Blocking Time is **10 ms on `/training`** and 120 ms on the home page,
both comfortably inside the 200 ms threshold. Whatever is wrong, the main thread
is not choking on it. That closes the matrix-canvas line of enquiry for good.

There is still 350 KB of unused JavaScript on the home page and 284 KB on
`/training`, which costs download time on a slow connection even when it never
executes. That is an LCP contributor, not a TBT one.

### 4. Best Practices 81 is one audit, and only on mobile

Desktop scores 100 with identical headers, so the Trust and Safety entries (CSP,
HSTS, COOP, clickjacking, Trusted Types) are informational and not what is
costing the points. The single scored failure is **"Uses deprecated APIs, 1
warning found"**. Worth opening once to see which API, but it is a 19-point
cosmetic gap, not a real risk.

### 5. The home page being a client component

`src/app/page.tsx` opens with `"use client"` and runs 824 lines, the only route
on the site that does. Given TBT is fine, this is not currently hurting
responsiveness, but it does mean the one route that has to convert ships its
entire markup as JavaScript. Worth revisiting if LCP work stalls.

---

## How to re-measure

Same conditions, or the comparison is meaningless.

```
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.bedrock.fit%2F&form_factor=mobile
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.bedrock.fit%2Ftraining&form_factor=mobile
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.bedrock.fit%2Ftraining%2Fleg-strength&form_factor=mobile
```

For the static numbers, run a production build and read the same three tables.
Note that a build in a Linux sandbox against the repo's `node_modules` fails on
`lightningcss`, which ships a macOS binary here. Build in a copied tree with a
fresh `npm install`, or build on the Mac.

### After ad units land, check these specifically

- **CLS above all.** Ad slots that reserve no space are the single most common
  cause of layout shift on an ad-supported site. Every slot needs explicit
  dimensions, or a `min-height` matching the ad size, reserved before the ad
  arrives.
- **LCP on article pages**, if any slot sits above the first paragraph.
- **INP once CrUX populates**, which is the metric ads damage most and the one
  that cannot be seen in a lab run.
- **Total JS per route**, from the static analysis above. It is the cleanest
  signal because it does not depend on network conditions.
