# Content plan

Articles ship in batches of five. Each batch runs research → outlines → your
review → writing → preview. Nothing is written until the outlines are signed off.

Status: **Batch 1 agreed, not started.**

---

## Batch 1

One per category plus a second Strength piece, so no section on the index is
left reading "Nothing published here yet".

| # | Working title | Category | Subcategory | Why this one |
|---|---|---|---|---|
| 1 | Progressive Overload | Strength Training | Fundamentals | The mechanism every other strength article leans on. Write it first so the rest can link back to it. Sits directly next to the strength scan. |
| 2 | How Close to Failure Should You Train? | Strength Training | Programming | High-intent search, genuinely contested evidence, and the honest answer ("less close than you think, but it depends") is more useful than the usual one. |
| 3 | What Zone 2 Actually Means | Endurance | Intensity | The term has drifted a long way from the physiology it was named for. Correcting that is a real service and the search volume is there. |
| 4 | Protein After 50 | Over 40 | Sarcopenia | Anabolic resistance is well evidenced and badly explained. Pairs directly with Leg Strength, which is already the featured piece. |
| 5 | Does Stretching Prevent Injury? | Mobility & Balance | Range of Motion | Forty years of trials pointing somewhere most warm-ups haven't caught up with. Contrarian, but the evidence carries it. |

Each: **13,000 characters** of body copy, 2–4 charts, 8–12 sources, 1–2 figures,
video only where one genuinely helps.

### Length

**Target: 13,000 characters** — roughly 2,150–2,350 words depending on sentence
length. Tolerance ±8%, so **11,960–14,040** is in range.

Counted: the body prose only — `lede`, `p`, `h2`, `h3`, `list`, `callout` and
`quote` blocks, with inline syntax stripped (`[^3]`, `**`, link URLs don't count).

Not counted: chart labels and figure captions, table contents, the sources list,
the disclaimer, and the CTA block.

The `wordCount` field in front matter stays as the word figure for JSON-LD; the
character count is the editorial target. Both get checked before publish.

Longer isn't better. If a piece hits 13,000 characters at 10,000 characters'
worth of argument, cut it and say so rather than padding to the number.

**Not in batch 1, deliberately:** anything nutrition-adjacent beyond protein
(needs heavier medical hedging), and anything requiring individual medical
judgement.

---

## Process per batch

**1. Research.** Primary literature per topic — journals, Cochrane, CDC/WHO/HHS.
Every figure verified at the source, not from a secondary write-up. Nothing gets
into an outline that hasn't been opened.

**2. Outlines.** One page each, covering:

- final title, slug, category, subcategory, dek
- the thesis in two sentences
- section-by-section skeleton with the argument each section carries
- every chart: the actual numbers, the study, the sample size
- the figure: what it needs to show
- video candidate, or a note that none is warranted
- full numbered source list with links

**3. Your review.** Edit angles, cut sections, challenge claims. This is the
cheap moment to change direction.

**4. Writing.** Five content files, registered, built, verified. You get five
standalone preview pages like the ones in `docs/previews/`.

Rough shape: research and outlines are the bulk of the work; writing from a
signed-off outline is fast.

---

## Linking requirements

Per article, non-negotiable. Checked before publish.

### Internal — 3 to 6

- **At least one** to another `/training` article.
- **At least one** to the strength scan at `/`.
- The rest to `/methodology` or other articles as the argument warrants.
- **No more than one per 300 characters of prose** — beyond that it reads like a
  link farm and dilutes each link.
- Descriptive anchor text that says where it goes: "the rate lower-body strength
  declines", not "this article" and never "click here".
- Links go in prose where the reader would actually want them, not clustered in a
  see-also block at the end.

Batch 1 has a bootstrapping problem: article one has almost nothing to point at.
All five are written together, so they cross-link within the batch, with
**Progressive Overload as the hub** — the other four link back to it, and it links
forward to each of them.

### External — 8 to 12 citations, plus 2 to 4 inline

**Citations** (8–12): the numbered `sources` entries, reached by `[^n]` markers
and rendered `nofollow` in the sources list. Primary literature or national
guidance only. Unchanged from existing rules.

**Inline contextual links** (2–4): `[text](url)` links in the body, *dofollow*,
pointing at authoritative resources a reader would genuinely want to open — a CDC
assessment PDF, a WHO guideline page, a public calculator. These are separate
from citations and serve the reader, not the argument.

- Never link a competitor's training content or a supplement seller.
- Never link something you haven't opened.
- If a source is worth citing *and* worth opening mid-read, it can be both — an
  inline link and a numbered citation.

---

## Graphics — what to upload

You supply photos; each outline will carry a shot list telling you exactly what
the image needs to show and where to put it.

### Orientation — landscape runs full width, portrait wraps

| Orientation | Ratio | Treatment |
|---|---|---|
| **Landscape** | 3:2 or 16:9 | Full column width, 760px, text above and below. |
| **Portrait** | 2:3 | **Floats at 42% of the column with body text wrapping around it.** |
| **Square** | 1:1 | Either — full width if it's the section's anchor image, wrapped if it's supporting. |

A 2:3 portrait at full column width renders 1,140px tall. That is most of a
laptop screen for one photo, and it shoves the argument off the page. Wrapping it
keeps the reader in the prose.

This needs a `layout` field on the `figure` block — `"full"` (default),
`"wrap-left"` or `"wrap-right"` — plus the float CSS and a clearfix so the next
`h2` doesn't ride up beside it. **Not built yet.** Below 640px the float is
dropped and the image goes full width: a floated image in a 320px column leaves
about 180px of text per line, which is unreadable.

Rules for wrapped images:

- At least 400 characters of prose must follow the float, or the text runs out
  before the image does and leaves a ragged gap.
- Alternate sides down the page. Two floats on the same side stack into a column.
- Never two wrapped figures in the same section.

### Specification

| | |
|---|---|
| Dimensions | Landscape ≥ 1520 × 1013 (3:2) or 1520 × 855 (16:9). Portrait ≥ 1200 × 1800 (2:3). |
| Format | JPG for photos, PNG for diagrams, sRGB |
| File size | Under ~500 KB after export — resize before compressing, not after |
| Location | `public/articles/<slug>/` |
| Naming | `descriptive-kebab-case.jpg` — what it shows, not `pexels-amar-13965336` |

### Metadata — required, both layers

**Layer 1: in the file.** IPTC/XMP written into the image before it ships.

All nine uploaded images do carry XMP packets, and four carry IPTC blocks — but
every attribution field in them is empty. They are camera and pipeline artefacts
carrying `tiff:` and `exif:` namespaces and nothing else. The single exception is
`pexels-maksgelatin-4422912`, which has `dc:rights = "Copyright 2019. All rights
reserved."` and no creator to attach it to.

So: presence of a metadata segment proves nothing, and the checker tests for
field *content* rather than segment presence.

| Field | Content |
|---|---|
| `Creator` / `Artist` | Photographer's name |
| `Credit` | "Photographer Name / Pexels" |
| `Copyright` | Licence in plain words, e.g. "Pexels Licence — free to use" |
| `Description` | The same sentence as the `alt` text |
| `Source` | The URL the file came from |

Can be written in bulk from the manifest — nothing to do by hand.

**Layer 2: in the markup.** Carried by the `figure` block:

| Field | Required | Purpose |
|---|---|---|
| `alt` | **yes** | What the image shows, for someone who can't see it. Never the filename, never a repeat of the caption. |
| `caption` | recommended | What the reader should take from it |
| `credit` | **yes for licensed images** | Rendered under the caption |
| `sourceUrl` | for licensed images | Where it came from |
| `license` | for licensed images | **A URL to the licence terms**, e.g. `https://www.pexels.com/license/` — not its name. Google's licensable-image structured data requires a URL here; a plain string populates the property without qualifying. The human-readable form belongs in the file's XMP `dc:rights` (layer 1), written from the manifest's `copyright`. |

`sourceUrl` and `license` are **not built yet** — they need adding to the block
type, and they should feed an `ImageObject` into the Article JSON-LD `image`
array. Article schema currently ships with no `image` property at all, which
costs the rich result in search. Worth fixing with the same change.

### Rights

Your own photos, or something you hold a licence for. No stock pulled from search
results, no screenshots of other people's diagrams. Pexels images are free to use
commercially without attribution — we credit anyway, because a page arguing from
sources shouldn't be quiet about where its pictures came from.

### The nine uploaded images

All currently sitting at the repo root and needing to move into
`public/articles/<slug>/` with real filenames. Seven portrait (2:3 — all wrap),
two landscape (3:2 — both full width).

| # | File | Shows | Best home |
|---|---|---|---|
| 1 | `pexels-197092734-19722966` | Man on a seated leg extension, quads loaded | How Close to Failure — a machine set is where proximity to failure is safest to push |
| 2 | `pexels-amar-13965336` | Woman mid-rep on a leg press, heavy | How Close to Failure, or Progressive Overload |
| 3 | `pexels-amar-13965339` | Calves close-up on a raise block, heels lowered | Leg Strength — the calf paragraph currently has no image |
| 4 | `pexels-amar-14673249` | Woman in a dumbbell split squat / walking lunge | Leg Strength — sits directly beside "train one leg at a time" |
| 5 | `pexels-andre-henrique-1490223-11191177` | Woman on a seated leg machine, yellow wall | Progressive Overload — clean, uncluttered, reads at small size |
| 6 | `pexels-jean-daniel-19254709` | Man on a leg extension, tight on the quad | Spare / second option for #1 |
| 7 | `pexels-juan-domiciano-135445434-11682724` | Woman in a deep front-racked or overhead squat | **Progressive Overload — lead image** |
| 8 | `pexels-kinkate-421160` *(landscape)* | Runner's legs on an open road at sunset | **What Zone 2 Actually Means — lead image**, full width |
| 9 | `pexels-maksgelatin-4422912` *(landscape)* | Legs climbing stairs in trainers | Leg Strength — stair-climbing is named in the article; full width |

**Two gaps.** Nothing here fits **Protein After 50** (needs a plated meal) or
**Does Stretching Prevent Injury?** (needs a static hold versus a dynamic warm-up).
Both articles run on charts alone unless you add images — which is fine, and
better than a forced one.

**One caution.** Six of the nine are conventional gym-physique stock: posed,
heavily lit, aesthetically-focused subjects. The site's argument is that strength
is about keeping your life, not about looking a certain way. #8 and #9 — anonymous
legs, real settings, no posing — are much closer to the right register. Worth
weighting toward that kind of shot in future.

**Still to source**

| Article | Folder | What it needs |
|---|---|---|
| Protein After 50 | `public/articles/protein-after-50/` | A plated meal at roughly 40 g protein, shot from directly above, components individually identifiable. Landscape. |
| Does Stretching Prevent Injury? | `public/articles/does-stretching-prevent-injury/` | Static hold versus dynamic warm-up — same subject, same framing, two frames. Portrait works well here as a wrapped pair. |

One good photo beats three weak ones. If a shot isn't working, say so and the
article runs on its charts — no figure is better than a filler figure.

---

## Build work these requirements imply

None of this is done. All of it is small, and all of it should land before batch 1
is written so the articles are authored against the finished blocks.

1. **`layout` on the `figure` block** — `"full" | "wrap-left" | "wrap-right"`,
   float CSS, clearfix, and the sub-640px full-width fallback.
2. **`sourceUrl` and `license` on the `figure` block**, feeding an `ImageObject`
   array into the Article JSON-LD `image` property. Article schema ships without
   `image` today.
3. **A metadata-writing script** — reads a per-article manifest, writes IPTC/XMP
   into each JPEG, resizes and compresses to spec. Run once per batch.
4. **A pre-publish checker** — character count, internal link count, external link
   count, orphaned `[^n]`, missing `alt`, missing `credit` on a licensed image.
   Cheaper as a script than as a checklist item nobody runs.
5. **The two-pane index.** `docs/previews/prototype-training-index.html` is a
   hand-written prototype. Needs a client component for the rail plus
   `/training/category/[slug]` routes so categories are linkable and indexable.
   Worth landing before five new articles arrive, since the current index gets
   worse as it fills.
- **Ad placement.** Five long articles is the first real inventory on the site.
  See `MONETIZATION-CHECKLIST.md`.
- **Nothing is committed yet.** Everything from the restructure is still working
  tree only.

---

# House style, enforced

Added 2026-08-09. Everything in this section is checked by
`scripts/check-article.mjs`, not left to review. An article that breaks any of
it cannot pass `npm run check:articles`, which is deliberate: these are the
rules most likely to decay into "we usually do it this way".

## Prose

| Rule | Enforced as |
|---|---|
| **No em or en dashes.** Not as punctuation, not for asides, not ever. | Hard fail. Names the first offending block. |
| **Hyphens only inside compound words** — `re-established`, `single-leg`, `30-second`. Never standing alone between spaces. | Hard fail. |
| **Ninth grade reading level or below.** Flesch Kincaid grade 9.0 max. | Hard fail, reports the computed grade. |
| **13,000 characters**, tolerance 8%, so 11,960 to 14,040. Body prose only. | Hard fail. |

Why the dash rule: a dash welds two sentences into one and pushes the grade
level up, which fights the ninth grade target directly. Removing them forces
shorter sentences, which is the single biggest lever on readability.

Tone is informative but not dry. Take an angle. The evidence is the constraint,
not the voice.

## Shape

Every article is the same shape. The checker locks it:

- First block is a `lede`. Last block is a `cta`.
- At least one `h2`.
- **One or two `video` blocks**, YouTube, on topic, embedded small.
- 2 to 4 charts.
- 8 to 12 numbered sources, rendered small at the foot.
- 3 to 6 internal links, at least one into `/training`, at least one to `/`.
- 2 to 4 inline external links, opening in a new tab so the reader keeps our
  page. Citations stay `nofollow`; inline contextual links are `dofollow`.

## Sourcing

Every source is opened and read before it is cited. Not the abstract, not a
secondary write up, not memory. This is the rule that sets the pace: at 8 to 12
sources an article, expect one to two articles per working session rather than
a batch of ten drafted at once.

## Images

Articles publish without images and gain them later. Where a processed image
already exists for the slug it is applied immediately. Metadata is written into
every image file before it ships, and the `figure` block carries `alt`,
`credit`, `sourceUrl` and a `license` **URL**.

---

# Batch 1, revised

Ten articles. Narrower than the original five: leg work, strength training and
mature adult leg health. Ordered so the two hubs are written first and
everything else links back to one of them.

| # | Article | Category | Cluster role |
|---|---|---|---|
| 1 | Progressive Overload | Strength Training | **Hub A.** Write first. |
| 2 | Sarcopenia: What It Is, When It Starts | Over 40 | **Hub B.** Pairs with Leg Strength, already live. |
| 3 | Do Squats Wreck Your Knees? | Strength Training | Highest traffic potential. Evidence points the other way. |
| 4 | How Close to Failure Should You Train? | Strength Training | Contested evidence, honest answer is unpopular. |
| 5 | How Many Sets Per Muscle Per Week? | Strength Training | Strong meta analytic base. |
| 6 | Squat Depth: How Low Is Necessary? | Strength Training | Leg specific, resolvable from evidence. |
| 7 | Single Leg Training: Why Bilateral Is Not Enough | Mobility & Balance | Extends a section already in Leg Strength. |
| 8 | Calves: Trained Last, Matter Most | Strength Training | The calf section has no depth behind it yet. |
| 9 | Protein After 50 | Over 40 | Anabolic resistance, badly explained everywhere. |
| 10 | Balance Training: The Third Nobody Does | Mobility & Balance | Fall rates cut 23 to 34%. Almost nobody trains it. |

**Dropped from the original five:** What Zone 2 Actually Means, and Does
Stretching Prevent Injury. Both sit outside the three areas above. Dropping
Zone 2 leaves the Endurance category empty on the index, and orphans
`runner-open-road.jpg`, which would suit #10 instead.
