# Handoff: fix the liability wording, then clean the whole site to house style

Paste everything below the line into the local Claude Code session in
`~/bedrock-fit`. It holds the SSH key.

---

You are in `~/bedrock-fit` at `7c4ecd3`. Read `AGENTS.md` first.

There are three jobs, in this order. Job 1 is the one that matters most and
should ship on its own, before the sweep touches anything.

**Before you start**, note the working tree already has an unrelated change in
flight: `src/app/layout.tsx` carries a `display: "optional"` font fix with its
own handoff at `docs/claude-code/HANDOFF-cls-fix.md`. Ship that separately.
Do not fold it into these commits. `REVENUE-BOARD.html` and `.claude/` stay
untracked, always.

---

## Job 1: the liability wording. Do this first, commit it alone.

Two pages of the same site describe their liability differently, and **the
weaker wording is on the pages that actually give training guidance**:

```
src/components/LightFrame.tsx:178      /training and every article
  For entertainment and general fitness only — not medical, training, or
  nutrition advice. © 2026 Bedrock.fit. All rights reserved.

src/app/page.tsx:556                   home page
  For general fitness information only — not medical, training, or nutrition
  advice. See the terms of use. © 2026 Bedrock.fit. All rights reserved.
```

Commit `5bd9eae` reworded the home page and missed `LightFrame`. Align
`LightFrame` to the home page version: "general fitness information only", and
add the link to `/terms`. Write it without a dash while you are in there.

Two reasons this is worth care rather than a find and replace. "Entertainment
only" is a weaker and slightly odd claim for a page carrying sourced training
advice, and it is the page a reader is most likely to act on. And the missing
`/terms` link means the pages with the most substantive guidance are the ones
not pointing at the full disclaimer.

Show the exact before and after. Commit this on its own, small and reviewable.

---

## Job 2: remove every dash from the rendered copy

**Scope: about 40 instances across 13 files.** Articles are already clean and
stay untouched, because `check-article.mjs` hard-fails on a dash and all four
pass.

The rule, restated: **no em or en dashes anywhere.** Hyphens only inside compound
words such as `re-established`, `single-leg`, `30-second`. Never standing alone
between spaces. Write `2 to 4`, not `2–4`.

### Where they are

Counts are dashes in real copy, excluding code comments.

| File | In copy | Notes |
|---|---|---|
| `src/app/page.tsx` | 20 | The bulk. Archetype descriptions, feature blurbs, hero text. Also **8 spaced hyphens** used as punctuation. |
| `src/app/contact/page.tsx` | 5 | Includes the page title and "Last updated — ". |
| `src/app/training/page.tsx` | 4 | Two are the page title, in metadata and OpenGraph. |
| `src/app/terms/page.tsx` | 3 | One is inside a liability clause. Read Job 3 first. |
| `src/app/layout.tsx` | 3 | Site title, three copies of it. |
| `src/components/SiteFrame.tsx` | 3 | Plus 2 spaced hyphens. |
| `src/app/privacy/page.tsx` | 2 | Title and effective date. |
| `src/lib/articles/categories.ts` | 2 | Rendered on `/training` as taglines. |
| `src/components/LightFrame.tsx` | 1 | The footer line from Job 1. |
| `src/app/methodology/page.tsx` | 1 | The "last updated" line. |
| `src/app/training/opengraph-image.tsx` | 1 | Social image alt text. |

Rendered totals per route, for checking your work afterwards: home 10,
methodology 7, contact 5, `/training` 4, terms 3, privacy 2, not-found 1.
`/about` is currently the only route at zero and should stay there.

### Page titles are a separate judgement

Five titles use the `X — Bedrock.fit` pattern, including the site title in
`layout.tsx`. These are **already indexed**, so changing them changes how the
site appears in search results. Use a pipe, matching `/training` and `/about`
which already do: `Contact | Bedrock.fit`.

Do it, but flag it in the commit message so it is obvious later why listings
changed.

### How to rewrite

Do not swap a comma in mechanically. The rule exists because a dash welds two
sentences into one and pushes the reading grade up, so the fix is usually to
**split the sentence**, which is the outcome we actually want. Where a dash is
introducing an aside, ask whether the aside earns its place at all.

Comments containing dashes are not rendered and are not in scope, but cleaning
them costs nothing and stops the next author copying the pattern. Your call.

---

## Job 3: get every route to ninth grade or below

This is the part that needs real writing rather than substitution.

Measured on the rendered HTML, visible text only:

| Route | Words | Grade | Verdict |
|---|---|---|---|
| `/about` | 547 | **7.1** | fine, leave it |
| `/` | 451 | **7.7** | fine |
| `/contact` | 313 | **10.1** | over |
| `/training` | 468 | **10.4** | over |
| `/terms` | 847 | **11.7** | over, see the warning |
| `/privacy` | 541 | **12.0** | over, see the warning |
| `/methodology` | 414 | **15.3** | worst on the site |

`/methodology` is the clear priority and the easiest win. It is technical
writing about a formula, which is exactly the kind of prose that reads at
university level for no good reason. Nothing there is legally load-bearing, so
it can be rewritten freely. Explaining the Epley estimate in plain language is
also better for the reader who is trying to decide whether to trust the number.

### The warning, and I want you to take it seriously

**Do not chase a reading grade through the terms of use or the privacy policy at
the cost of meaning.** Those pages exist to be enforceable and to satisfy
privacy law. Simplifying a limitation of liability clause can narrow what it
actually covers, and simplifying a data disclosure can make it inaccurate.

Where a sentence is long because the law needs it to be long, **leave it and say
so in your report**. Shorten only what is genuinely just bad writing:
throat-clearing preambles, doubled synonyms, passive constructions that could be
active without changing scope. A grade of 10 on a legal page that is correct
beats an 8 that is not.

Everything else on this list is fair game.

---

## Gates

After each job:

```
npx tsc --noEmit
npx eslint src scripts
npm run check:articles     # expect 4/4 passing, untouched
npm run build
```

Then verify the sweep landed, from the built HTML rather than the source:

```
grep -rho '[—–]' .next/server/app/*.html | wc -l     # target: 0
```

And re-measure the grades the same way they were measured here: strip
`<script>`, `<style>` and comments, strip tags, unescape entities, then
Flesch Kincaid. `scripts/check-article.mjs` already contains a working
implementation of both the syllable counter and the grade formula. Reuse it
rather than writing a second one that disagrees.

## Strongly recommended: make it stick

Everything above is a one-off cleanup of a problem that will come straight back,
because `check-article.mjs` only reads `src/lib/articles/content/`. Nothing
guards the rest of the site, which is exactly why 40 dashes accumulated and five
routes drifted past the reading target without anyone noticing.

Consider adding `npm run check:copy`: build, then walk `.next/server/app/*.html`,
extract visible text, and fail on any em or en dash or on a grade above 9.0,
with a per-route report and legal pages on a documented exemption list. Reuse
the grade function from `check-article.mjs`.

That turns this handoff from something that has to be repeated into something
that cannot regress. If you build it, say what you exempted and why.

## Commits

Three, in order, each reviewable on its own:

1. `Align the training footer disclaimer with the home page`
2. `Remove every em and en dash from the rendered copy`
3. `Bring methodology and support pages to the house reading level`

Report back with the per-route dash count and reading grade after each, plus
anything on the legal pages you deliberately left alone.
