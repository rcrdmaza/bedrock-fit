# Claude Code brief — Batch 1 (five articles)

**Run this locally, not from a cloud session.** `next build` fails in the Cowork
sandbox: the device bridge can't `unlink`, so Next errors clearing `.next` with
`EPERM`. Everything below assumes a normal local checkout.

Paste the prompt in §7 into Claude Code, or work through the phases by hand.

---

## 0. Read first

| File | Why |
|---|---|
| `docs/ARTICLE-GUIDE.md` | House style, sourcing rules, block reference, checklist. **The authority.** |
| `docs/CONTENT-PLAN.md` | Batch composition, length and link requirements, image spec, shot list |
| `src/lib/articles/types.ts` | The content model you're writing against |
| `src/lib/articles/content/leg-strength.ts` | The one worked example — match its voice |
| `scripts/check-article.mjs` | What "done" means, mechanically |

Do not read `docs/previews/*.html` — they're generated artefacts, gitignored,
and will waste your context.

---

## 1. Ground rules

**Research before writing. Always.**

- Every figure gets a `[^n]`, every `[^n]` gets a source. The build throws on an
  orphan, so this is enforced, not advisory.
- **Open every source.** Do not cite from an abstract, a press release, a news
  write-up, or a memory of a study. If you cannot reach the paper, find another
  or drop the claim.
- If a figure you expected to find doesn't hold up, **say so and change the
  argument**. Do not soften a number to fit a sentence you already wrote.
- Hedge honestly. "Associated with", not "causes", unless it's a randomised
  trial — and then name the design.
- Never invent a statistic, a sample size, a DOI, or a YouTube video ID.

**Stop and ask** if: a planned article's core claim doesn't survive the
literature; two articles in the batch end up making the same argument; or the
character target can't be hit without padding.

---

## 2. Phase A — prerequisite code (do this first)

Four small changes. The articles are authored against them, so they land first.

### A1. `layout` on the figure block

`src/lib/articles/types.ts` — add to the `figure` variant:

```ts
/** Landscape runs full width; portrait floats with text wrapping. Default "full". */
layout?: "full" | "wrap-left" | "wrap-right";
```

`src/components/article/blocks.tsx` — in `Figure`:

- `wrap-left` / `wrap-right` → `float: left|right`, `width: 42%`, margin on the
  inner edge (`0 26px 18px 0` for left, `0 0 18px 26px` for right), `margin-top: 6px`.
- Add `.bf-fig-wrap` to `globals.css` with the float rules and
  `@media(max-width:640px){ .bf-fig-wrap{float:none;width:100%;margin:26px 0} }` —
  a float in a 320px column leaves ~180px of text per line, which is unreadable.
- The `h2` style needs `clear: both` so a following section can't ride up beside
  a float.
- `sizes` for a wrapped figure is `(max-width: 640px) 100vw, 320px`, not 760px.

### A2. `sourceUrl` and `license` on the figure block

```ts
/** Where the image came from. Required for anything licensed rather than shot in-house. */
sourceUrl?: string;
/** e.g. "Pexels Licence". Required alongside sourceUrl. */
license?: string;
```

### A3. `image` in the Article JSON-LD

`src/components/article/ArticleLayout.tsx` — Article schema currently ships with
no `image` property, which forfeits the rich result. Add:

```ts
image: article.blocks
  .filter((b) => b.type === "figure")
  .map((b) => ({
    "@type": "ImageObject",
    url: `${SITE_URL}${b.src}`,
    width: b.width,
    height: b.height,
    caption: stripInline(b.alt),
    ...(b.credit ? { creditText: b.credit } : {}),
    ...(b.license ? { license: b.license } : {}),
    ...(b.sourceUrl ? { acquireLicensePage: b.sourceUrl } : {}),
  })),
```

### A4. `scripts/write-image-metadata.mjs`

Reads a per-article manifest and, for each image: resizes to spec, compresses
under 500 KB, and writes IPTC/XMP `Creator`, `Credit`, `Copyright`, `Description`
(the alt text verbatim) and `Source`.

Use `exiftool` if present, otherwise `sharp` with `withMetadata`. **Check what's
already available before adding a dependency.**

This matters: all nine supplied images carry XMP packets whose attribution fields
are entirely empty. `npm run check:articles` fails on that, correctly.

**Verify Phase A:** `npx tsc --noEmit && npx eslint src && npm run build`

---

## 3. Phase B — images

Nine images sit at the repo root. Move them into `public/articles/<slug>/` with
descriptive names, per the mapping table in `docs/CONTENT-PLAN.md`. Delete the
originals from the root once moved — they should never have been committed there.

Seven are portrait 2:3 and **must** use `wrap-left` / `wrap-right`, alternating
down the page. Two are landscape 3:2 and run full width.

Two articles have no image and will run on charts alone. That is fine. Do not
substitute a loosely-related photo.

---

## 4. Phase C — the five articles

Order matters: **Progressive Overload first.** It's the hub the other four link
back to.

Each article: 13,000 characters ±8%, 2–4 charts, 8–12 citations, 3–6 internal
links, 2–4 inline external links. Cross-link within the batch — that's how the
link minimum is met when the site has only one other article.

---

### C1 · Progressive Overload

```
slug      progressive-overload
category  strength-training      topic  Fundamentals
images    public/articles/progressive-overload/
          barbell-squat-depth.jpg    (portrait, wrap-right, lead)
          seated-leg-machine.jpg     (portrait, wrap-left)
```

**Thesis.** Adaptation is driven by a stimulus that keeps exceeding what the
tissue is currently accustomed to. Almost everyone understands this and almost
nobody applies it, because the failure mode is invisible: a programme you never
make harder silently becomes maintenance, and maintenance loses slowly to the
age-related decline curve.

**Must cover.** What actually drives hypertrophy and strength adaptation
(mechanical tension, effort, and volume — not soreness, not novelty). The
distinct levers: load, reps, sets, density, range of motion, tempo. Why load is
the one most people fixate on and the one that stalls first. Why a beginner's
linear progression ends and what replaces it. The plateau diagnostic — is it
recovery, technique, or genuinely a ceiling.

**Charts.** Dose–response of weekly sets versus hypertrophy; strength gain by
training status (untrained vs trained) showing the flattening curve.

**Objection to steelman.** "I've been lifting the same weights for years and I
feel fine." Answer honestly: maintenance is a legitimate goal, and it is not the
same as the trajectory they think they're on.

**Links out to.** Leg Strength (the decline rates it argues against), How Close
to Failure (the effort variable), the scan at `/`.

---

### C2 · How Close to Failure Should You Train?

```
slug      training-to-failure
category  strength-training      topic  Programming
images    public/articles/training-to-failure/
          leg-extension-effort.jpg   (portrait, wrap-left, lead)
          leg-press-heavy.jpg        (portrait, wrap-right)
```

**Thesis.** Training to momentary failure is not required for most of the
adaptation, costs disproportionate fatigue, and degrades the quality of
subsequent sets. But "leave reps in reserve" is routinely misapplied by people
who are nowhere near failure to begin with.

**Must cover.** What failure means mechanically. RIR and RPE, and how badly
people estimate them — the self-assessment error is large and skews toward
underestimating effort. Where failure matters more (low load, isolation,
machines) and less (heavy compounds, high volume). The fatigue cost and its
knock-on to session volume. How to calibrate: the last-rep velocity cue,
occasional deliberate failure sets on a machine as a reference point.

**Charts.** Hypertrophy and strength outcomes by proximity to failure; measured
RIR accuracy versus self-reported.

**Objection to steelman.** "If you're not going to failure you don't know how
hard you can work." There's something to this — hence the calibration section.

**Links out to.** Progressive Overload, Leg Strength, the scan.

---

### C3 · What Zone 2 Actually Means

```
slug      what-zone-2-means
category  endurance              topic  Intensity
images    public/articles/what-zone-2-means/
          runner-open-road.jpg       (landscape 3:2, full width, lead)
```

**Thesis.** "Zone 2" has drifted from a specific physiological boundary into a
vibe. The underlying concept — training below the first lactate threshold —
is well defined and worth understanding; the popular version is a heart-rate band
copied off a chart that may not describe the reader at all.

**Must cover.** What the zone models actually are and that there are several
incompatible ones (3-zone, 5-zone, 7-zone). The physiological anchor: LT1 /
aerobic threshold, and what's adapting below it — mitochondrial density,
capillarisation, fat oxidation. Why percentage-of-max-HR estimates fail
individually (the 220−age formula's standard deviation is large enough to make
it useless for one person). Field tests that don't need a lab: talk test,
nose-breathing, the 30-minute time-trial anchor. How much of it is actually
needed, and the honest answer that total volume matters more than zone precision.

**Charts.** Spread of measured max HR at a given age against the 220−age
prediction; adaptations by intensity domain.

**Objection to steelman.** "Polarised training is just what elites do and it
doesn't transfer to someone with four hours a week." Largely fair — address the
time-constrained case directly.

**Links out to.** Leg Strength (gait speed as a summary measure), Progressive
Overload, the scan.

---

### C4 · Protein After 50

```
slug      protein-after-50
category  over-40                topic  Sarcopenia
images    none yet — runs on charts. Do not substitute a stock meal photo.
```

**Thesis.** Anabolic resistance is real and specific: older muscle needs a larger
per-meal protein dose to trigger the same synthetic response. The common advice
("eat more protein") is directionally right and mechanically vague enough to be
useless.

**Must cover.** Muscle protein synthesis and the leucine threshold. The measured
per-meal dose difference between younger and older adults. Daily totals — where
the RDA came from, why it is a floor for preventing deficiency rather than a
target for preserving muscle, and what the sarcopenia literature suggests
instead. Distribution across meals versus a single large dose. Protein without
resistance training does very little — say this plainly. Kidney concerns in
healthy people versus existing renal disease.

**Charts.** Per-meal protein dose versus muscle protein synthesis, young versus
older; daily intake recommendations, RDA against sarcopenia-prevention figures.

**Objection to steelman.** "High protein damages your kidneys." Answer carefully
and name the population where the caution genuinely applies.

**Extra care.** This is the most medically adjacent piece in the batch. Hedge
harder, and keep the standard disclaimer.

**Links out to.** Leg Strength, Progressive Overload, the scan.

---

### C5 · Does Stretching Prevent Injury?

```
slug      does-stretching-prevent-injury
category  mobility-balance       topic  Range of Motion
images    none yet — runs on charts. A static-hold vs dynamic-warm-up pair is
          wanted but not yet shot; ship without it.
```

**Thesis.** Static stretching before activity has been studied for decades and
does not meaningfully reduce injury risk — and acutely reduces force production.
Warming up does help. These get conflated constantly.

**Must cover.** Separate the three claims: injury prevention, performance,
soreness. What the trials actually show for each. The acute force deficit from
prolonged static stretching and the duration threshold below which it's
negligible. What does reduce injury rates — progressive loading, eccentric work,
neuromuscular warm-up programmes. Where static stretching is genuinely useful:
increasing range of motion, which is a real and separate goal.

**Charts.** Injury rate, stretching versus control; force output after static
stretching by hold duration.

**Objection to steelman.** "I stretch and I feel better, and I've never been
injured." Take the subjective benefit seriously while separating it from the
injury claim.

**Links out to.** Leg Strength, Progressive Overload, the scan.

---

## 5. Verify

Per article, then across the batch:

```bash
npx tsc --noEmit
npx eslint src
npm run check:articles              # all five must pass
npm run build
npm run dev                         # open each /training/<slug>
```

`check:articles` enforces character count, link minimums and split, citation
count, chart count and bounds, footnote integrity, figure alt/credit,
declared-vs-actual image dimensions, file size, portrait-must-wrap, and whether
attribution is actually written into the image files.

**Known:** `leg-strength` currently fails — 11,723 characters and zero links,
because it predates these rules. Bringing it up to standard is a separate task;
don't let it block the batch, and don't quietly rewrite it as part of this work.

Then by hand: read each at 360px width, check the wrapped figures don't strand
text, and confirm the social card at `/training/<slug>/opengraph-image`.

---

## 6. Definition of done

- [ ] Phase A merged; `tsc`, `eslint`, `build` clean
- [ ] Images moved into `public/articles/<slug>/`, root copies deleted, metadata written
- [ ] Five content files written and registered in `src/lib/articles/index.ts`
- [ ] All five `draft: false`
- [ ] `npm run check:articles` passes for all five
- [ ] Every source opened and verified; no figure without a citation
- [ ] Cross-links resolve — no 404s between the batch
- [ ] `npm run build` prerenders all five
- [ ] Read at 360px

---

## 7. Prompt

> Read `docs/claude-code/BATCH-1.md` and follow it end to end.
>
> Work in phases and stop for review after each: Phase A (the four code changes),
> Phase B (images), then one article at a time starting with Progressive Overload.
>
> Research every article before writing it — open every source, and tell me if a
> figure doesn't hold up rather than softening it to fit. Never invent a
> statistic, a DOI, or a video ID.
>
> After each article run `npm run check:articles <slug>` and fix what it flags
> before moving on. Don't touch `leg-strength` — it fails on purpose, for
> reasons explained in §5.
>
> Show me the outline for each article before you write the prose.
