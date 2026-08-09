# Writing a Bedrock.fit article

Everything under `/training/*` is rendered from data. There is one layout, one
set of components, and one place each article lives. Adding a piece is a data
file plus a line in the registry — you never touch JSX.

---

## 1. Ship an article in five steps

```bash
cp src/lib/articles/content/_TEMPLATE.ts src/lib/articles/content/zone-2.ts
```

1. Rename the exported const (`templateArticle` → `zone2`).
2. Fill in the front matter, write the `blocks`, list the `sources`.
3. Register it in `src/lib/articles/index.ts`:

   ```ts
   import { zone2 } from "./content/zone-2";
   const REGISTRY: Article[] = [legStrength, zone2];
   ```

4. Set `draft: false` when it's ready.
5. Verify:

   ```bash
   npx tsc --noEmit
   npx eslint src/lib/articles src/components/article
   npm run build          # run this locally, not from a cloud session
   npm run dev            # then open http://localhost:3000/training/zone-2
   ```

The sitemap, the `/training` index, the category section, the JSON-LD, the
social card and the "keep reading" links all update on their own.

Files prefixed with `_` are never imported, so `_TEMPLATE.ts` never ships.

---

## 2. Categories

Four, deliberately. Every article belongs to exactly one.

| Slug | Name | What lives here |
|---|---|---|
| `strength-training` | Strength Training | Progressive overload, movement patterns, sets/reps/failure, 1RM and standards, power, programme design |
| `endurance` | Endurance | VO2max and mortality, zone 2 and threshold, walking and step volume, concurrent training, HR/HRV |
| `over-40` | Over 40 | Sarcopenia, falls and fractures, recovery capacity, menopause/andropause, restarting after a layoff, healthspan |
| `mobility-balance` | Mobility & Balance | Range of motion, single-leg stability, proprioception, balance protocols, stretching, working around a joint |

The definitive list is `src/lib/articles/categories.ts`, including a `covers`
array per category that acts as the editorial fence.

**If a piece doesn't obviously fit exactly one category, the piece needs a
sharper angle — not the taxonomy a fifth entry.** Four categories holding a
dozen articles each beat ten holding two.

Parked candidates, in rough priority order, for when the core four are full:

- **Recovery & Sleep** — sleep and performance, deloads, soreness, rest intervals
- **Nutrition & Protein** — protein targets, creatine, timing (needs heavier medical hedging)
- **Assessments & Benchmarks** — chair-stand norms, grip strength, VO2max tables, strength standards
- **Getting Started** — first twelve weeks, equipment-free, gym anxiety

Adding one is: an entry in the `CategorySlug` union, an entry in `CATEGORIES`,
done. Everything else follows.

---

## 3. Article shape

13,000 characters of body copy. The template ships with this skeleton:

| Section | Purpose |
|---|---|
| `lede` | The concrete, everyday stakes. No statistics. |
| `p` | Thesis in two sentences, and what the piece will show. |
| `h2` — mechanism | Why it works, in plain language, before any citation. |
| `h2` — evidence | The strongest study: design, size, effect size. Add a chart. |
| `h2` — objection | Steelman the sceptic, then answer honestly. |
| `h2` — what to do | Four or five `h3` prescriptions. |
| `h2` — how to measure | A test the reader can run today, plus a norms table. |
| `h2` — the short version | Restate with the numbers. Introduce nothing new. |
| `cta` | The strength scan. |

**Two to four charts per article.** Fewer and it reads like an unsourced
opinion; more and nothing stands out.

### Length

**13,000 characters of body copy**, ±8% (11,960–14,040). That is roughly
2,150–2,350 words.

Counted: `lede`, `p`, `h2`, `h3`, `list`, `callout` and `quote`, with inline
syntax stripped. Not counted: chart labels, figure captions, table contents,
sources, disclaimer, CTA.

Longer isn't better. If the argument runs out at 10,000 characters, ship 10,000
and say so — padding to a number is visible to a reader within two paragraphs.

### Links

| | Count | Rules |
|---|---|---|
| **Internal** | 3–6 | At least one to another `/training` article, at least one to `/` (the scan). Max one per 300 characters of prose. Descriptive anchor text — never "click here". Placed in prose, not in a see-also block. |
| **External — citations** | 8–12 | The numbered `sources`, reached via `[^n]`, rendered `nofollow`. Primary literature or national guidance only. |
| **External — inline** | 2–4 | `[text](url)` in the body, dofollow, pointing at something a reader would want to open now — a CDC assessment PDF, a WHO guideline page. Never a competitor's training content, never a supplement seller. |

A source can be both an inline link and a numbered citation if it is worth
opening mid-read as well as worth citing.

---

## 4. House style

- **Non-prescriptive and hedged.** "Associated with", not "causes" — unless
  you're describing a randomised trial, and then say so.
- **Concrete before abstract.** Chair rises and grocery bags, then physiology.
- **Name the study.** Design, sample size, follow-up. "A Cochrane review pooling
  108 randomised trials across 23,407 participants" beats "studies show".
- **Own the caveats.** If gait speed is a summary measure and not the same thing
  as leg strength, say so in the paragraph, not a footnote.
- **No hype, no fear.** The numbers are striking enough unassisted. Don't
  catastrophise ageing and don't sell a supplement's worth of certainty.
- **Second person, present tense.** "Your legs are", not "one's legs are".
- **Real punctuation.** Type ’ “ ” – — directly into the string. These are `.ts`
  files, not JSX, so no HTML entities and no escaping.

---

## 5. Sourcing — the one rule with no exceptions

**Every figure gets a `[^n]`. Every `[^n]` gets a source. No exceptions.**

The registry enforces the second half at build time: a marker with no matching
entry throws during `next build`.

Acceptable sources:

- Peer-reviewed journals (JAMA, BJSM, *Journals of Gerontology*, Diabetes Care…)
- Systematic reviews and meta-analyses (Cochrane especially)
- National and international guidance (CDC, WHO, NIH, HHS)
- Reputable academic health publishers (Harvard Health) for background claims only

Not acceptable: blogs, press releases, supplement companies, YouTube, news
write-ups of studies (cite the study), and anything you haven't opened.

Format: authors, full title in quotes, journal, year, volume(issue), pages.
Link to DOI, PubMed or the publisher — never a PDF mirror. Number sources in
order of first use. Outbound citation links get `nofollow` automatically.

Changing a figure means changing its source *and* bumping `updated`.

---

## 6. Blocks reference

Defined in `src/lib/articles/types.ts`; rendered by
`src/components/article/blocks.tsx`.

| Block | Notes |
|---|---|
| `lede` | Exactly one, first. Larger and darker than body copy. |
| `p` | Body paragraph. |
| `h2` | Section heading. `id` auto-derived from the text; deep links point here. |
| `h3` | Sub-heading. |
| `chart` | Horizontal bars. `max` slightly above the largest value; `accent: true` on the bars that are the point. |
| `stats` | Two to four headline numbers. |
| `table` | First column renders as a label, the rest as accented values. |
| `list` | `ordered: true` for numbered. |
| `figure` | Image or diagram. See below. |
| `video` | YouTube embed. See below. |
| `callout` | Tinted aside for a caveat or a self-test. One or two per article. |
| `quote` | Pull quote. At most one. |
| `cta` | Conversion block. Usually last. |

### Inline syntax

Available in every `text` field:

```
**bold**
*italic*
[link text](https://example.com)
[^3]                              → footnote marker
```

That's the whole grammar. Anything else is literal text.

### Charts

Bars are CSS, not SVG — a fixed-viewBox SVG scaled into a 274px phone column
renders 12px labels at about 6px. Styles live in `globals.css` under
`.bf-chart*`; below 640px labels move above their bar and left-align.

`value` is always positive. Express a decline as a magnitude and say so in
`display`:

```ts
{ label: "Balance + functional + resistance", value: 34, display: "−34%", accent: true }
```

### Graphics

Assets live in `public/articles/<slug>/`. `src` is the path from `/public`.

```ts
{
  type: "figure",
  src: "/articles/leg-strength/chair-stand.png",
  alt: "A person rising from a standard chair with arms crossed over the chest.",
  width: 1520, height: 855,
  caption: "The chair stand, performed without pushing off.",
  credit: "Illustration: Bedrock.fit",
}
```

- `width`/`height` are the file's **real pixel dimensions** and are required —
  they reserve space so nothing reflows on load. Export at 2× the 760px reading
  column (1520 wide) and let `next/image` scale it down.
- **Orientation decides layout.** Landscape (3:2, 16:9) runs full column width.
  Portrait (2:3) **floats at 42% with body text wrapping around it** — a 2:3
  image at full width is 1,140px tall and buries the argument. Set `layout` to
  `"wrap-left"` or `"wrap-right"`; alternate sides down the page, never two
  wrapped figures in one section, and leave at least 400 characters of prose
  after the float so the text doesn't run out before the image does. Below
  640px the float is dropped and the image goes full width.
- **Metadata is required in the file, not just the markup.** Before an image
  ships it carries IPTC/XMP `Creator`, `Credit`, `Copyright`, `Description`
  (same sentence as the `alt`) and `Source`. Stock downloads arrive stripped.
- `credit` is required on any licensed image; `sourceUrl` and `license` carry
  through to an `ImageObject` in the Article JSON-LD.
- `alt` describes what the image *shows*, for someone who can't see it. Not
  "diagram.png", not the caption repeated. Empty string only if purely decorative.
- Remote URLs won't work without a `next.config.ts` allowlist. Keep assets in the repo.
- No graphic is better than a stock-photo graphic. Charts carry the argument; a
  figure earns its place by showing something a chart can't — a position, a
  piece of equipment, an anatomical relationship.

### Video

```ts
{
  type: "video",
  youtubeId: "dQw4w9WgXcQ",
  title: "The real video title, as it appears on YouTube",
  caption: "One line on why it's here and what to watch for.",
  start: 92,
}
```

- **The ID only, not a URL.** `youtu.be/<id>` or `watch?v=<id>` → the 11 characters.
- Embeds come from `youtube-nocookie.com` and are lazy-loaded: no tracking
  cookie until the reader presses play, no request until they scroll to it.
- `start` is an offset in seconds — use it to skip to the part that's relevant
  rather than making the reader hunt.
- On-topic only: a movement demonstrated properly, a lecture, a researcher
  explaining their own study. Watch it end to end first — you are vouching for
  everything in it, including whatever the presenter says at minute nine.
- A video is not a source. If it makes a factual claim you're relying on, cite
  the underlying study in `sources` as well.

---

## 7. Front matter that's easy to get wrong

| Field | Rule |
|---|---|
| `slug` | Lowercase, hyphenated, keyword-first. **Never changes after publish.** |
| `titleAccent` | Must be a verbatim trailing fragment of `title`, or it's dropped (and the registry throws). |
| `seoTitle` | Under ~60 chars. `" \| Bedrock.fit"` is appended for you — don't add it. |
| `description` | 140–160 chars. Say what the reader learns. Never "In this article…". |
| `dek` | One sentence, conversational, no numbers. |
| `published` | Frozen at first publish. |
| `updated` | Bump on **any** copy or figure change. |
| `wordCount` | Body only; feeds Article JSON-LD. |
| `featured` | Pins to the top of `/training`. Two at most site-wide. |
| `draft` | Excluded from index, sitemap and prerender, and marked `noindex`. Still reachable by direct URL for review. |
| `ogStats` | Three number/label pairs for the social card. Pick the article's best numbers. |

---

## 8. Pre-publish checklist

- [ ] Body copy is 11,960–14,040 characters.
- [ ] 3–6 internal links, including one to another article and one to `/`.
- [ ] 8–12 citations, plus 2–4 inline external links.
- [ ] Every image: non-empty `alt`, `credit` if licensed, IPTC written into the file.
- [ ] Portrait images use `wrap-left`/`wrap-right`, alternating; landscape is full width.
- [ ] Every figure has a `[^n]`; every source opened and verified.
- [ ] Hedged language everywhere the evidence is observational.
- [ ] `wordCount` and `readingMinutes` reflect the final draft.
- [ ] `updated` bumped.
- [ ] 2–4 charts, each with a `source` line ending in `[n]`.
- [ ] `draft: false`, registered in `index.ts`.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx eslint src/lib/articles src/components/article src/app/training` clean.
- [ ] `npm run build` succeeds and prerenders `/training/<slug>`.
- [ ] Read it at 360px width — charts, tables, nav.
- [ ] Social card looks right: `/training/<slug>/opengraph-image`.
- [ ] `/sitemap.xml` includes the new URL.

---

## 9. Where things live

```
src/lib/articles/
  types.ts               content model — Block union, Article, Category
  categories.ts          the four categories
  index.ts               registry, integrity checks, queries
  content/
    _TEMPLATE.ts         copy this
    leg-strength.ts      first article

src/components/
  LightFrame.tsx         light-theme palette, tokens, Logo, nav, footer
  article/
    ArticleLayout.tsx    hero, body, sources, related, JSON-LD
    blocks.tsx           block components + dispatcher
    inline.tsx           the four-construct inline parser

src/lib/og.tsx           shared social-card renderer

src/app/training/
  page.tsx               the index
  opengraph-image.tsx    index social card
  [slug]/
    page.tsx             every article
    opengraph-image.tsx  per-article social card
```

---

## 10. Known gaps

- **The home page still inlines its own chrome.** `src/app/page.tsx` carries a
  duplicate palette, `Logo()`, nav and footer. It's a 40 KB client component
  with the scan modal wired through it; migrating it to `LightFrame` is a
  separate job. Until then, a nav change means editing two files.
- **No `/training/category/[slug]` routes.** Categories are anchor sections on
  the index (`/training#endurance`). Worth splitting out at roughly four
  articles per category.
- **No ad units.** `layout.tsx` loads AdSense but nothing is placed. Articles are
  the best inventory on the site; mid-article after the second chart is the
  natural slot. See `MONETIZATION-CHECKLIST.md`.
- **`wordCount` is hand-maintained.** No script computes it yet.
