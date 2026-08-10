# Handoff: commit the carousel work, then write articles 2 and 3

Paste everything below the line into the local Claude Code session running in
`~/bedrock-fit`. It has network access without the rate limit that blocked the
desktop session, and it holds the SSH key, so it can research, write, verify and
push in one pass.

---

You are working in `~/bedrock-fit`. Read `AGENTS.md` first. This is Next.js
16.2.3 and it is not the Next.js you have memorised, so read
`node_modules/next/dist/docs/` before writing any framework code.

There are two jobs here, in order. Do not start job 2 until job 1 is committed.

## Job 1: commit the uncommitted work, then verify it

`git log` is at `4b56f1f`. Everything since then is uncommitted in the working
tree. It is one coherent change: article chart sections became auto-rotating
carousels, and the template that produces them got written into the guardrails.

Modified:

```
docs/CONTENT-PLAN.md                     new Charts and Sources sections
scripts/check-article.mjs                bans standalone chart, caps strips at 3
src/app/globals.css                      strip centring, blur, dots, media queries
src/components/article/ArticleLayout.tsx sources render as title-only links
src/components/article/blocks.tsx        chart strip code moved out
src/lib/articles/content/_TEMPLATE.ts    rewritten to the signed off shape
src/lib/articles/index.ts                registers progressiveOverload
src/lib/articles/types.ts                ChartPanel, charts block, Source docs
```

Untracked:

```
src/components/article/ChartStrip.tsx              new client component
src/lib/articles/content/progressive-overload.ts   the prototype article, draft
```

Do NOT commit `REVENUE-BOARD.html`. It carries the AdSense publisher ID and the
GA4 property ID and is deliberately untracked. Check whether `.claude/` should be
tracked before deciding; if it holds local MCP permissions, leave it out.

Before committing, confirm all four gates pass:

```
npx tsc --noEmit
npx eslint src scripts
npm run check:articles progressive-overload
npm run build
```

`progressive-overload` should PASS with one warning about the missing video.
`leg-strength` will FAIL with eight problems. That is expected and is job 3
below, not a regression. Do not fix it by weakening the checker.

Suggested message:

```
Turn chart sections into auto-rotating carousels, and lock the template

Every chart section is now a `charts` strip that advances itself on a one
second hold, keeps the centre panel sharp and blurs the rest, and stops the
moment the reader hovers, tabs in or scrolls it by hand. It does not run off
screen and does not auto advance under prefers-reduced-motion.

The blur is applied by script, never by the stylesheet. A stylesheet blur
would leave most figures on the page unreadable for anyone with JavaScript
off and for every crawler that reaches the article.

A standalone `chart` block is now a hard fail in check-article. The site has
nowhere to put a single static figure, and leg-strength's four are queued for
retrofit rather than grandfathered.

Sources render as the title alone, hyperlinked. The full citation string read
as academic clutter at the foot of a page written for a general reader, and
its page ranges carried the only legitimate en dashes on the site.
```

Then push and confirm the deploy: `https://www.bedrock.fit/training` returns 200,
and `/training/progressive-overload` returns 404, because it is still draft.

## Job 2: write articles 2 and 3

Two articles, from `docs/CONTENT-PLAN.md`, Batch 1 revised:

| # | Slug | Title | Category | Role |
|---|---|---|---|---|
| 2 | `sarcopenia` | Sarcopenia: What It Is, When It Starts | `over-40` | Hub B, pairs with leg-strength |
| 3 | `squats-knees` | Do Squats Wreck Your Knees? | `strength-training` | Highest traffic potential |

Start from `src/lib/articles/content/_TEMPLATE.ts`. Copy it, do not edit it.
Register each in `src/lib/articles/index.ts` (one import, one array entry).

### The guardrails, in full

These are enforced by `scripts/check-article.mjs`. Read it before you start; the
rules below are the summary, the script is the authority.

**Prose**

- No em or en dashes anywhere. Not as punctuation, not for asides, not in number
  ranges. Hyphens only inside compound words: `re-established`, `single-leg`,
  `30-second`. Never standing alone between spaces. Write `2 to 4`, not `2–4`.
- Flesch Kincaid grade 9.0 or below. The checker computes and reports it.
- 13,000 body characters, tolerance 8 percent, so 11,960 to 14,040.
- Tone is informative but not dry. Take an angle. The evidence is the
  constraint, not the voice. Aim for something a little outside the box, not a
  literature review with a headline on it.

**Shape**

- First block `lede`, last block `cta`. At least one `h2`.
- 1 or 2 `video` blocks. Required before `draft: false`.
- 1 to 3 `charts` strips, 2 to 8 panels total. A standalone `chart` is a hard
  fail. Each strip needs 2 to 4 panels and at least two different `kind` values
  from `bar`, `column`, `line`, `donut`. Four bar panels in a row is one long bar
  chart with gaps in it.
- 8 to 12 sources. Each `text` is **the title of the work and nothing else**. No
  authors, no journal, no year, no page range. The whole title becomes the link.
- 3 to 6 internal links. At least one to `/`, and at least one to a sibling
  article at `/training/<slug>`. The `/training` index does not count now that
  siblings exist, and a self-link is rejected.
- 2 to 4 inline external links, `dofollow`, opening in a new tab. Citations stay
  `nofollow`.
- Every number carries a `[^n]`. A `[^n]` with no matching source is a build
  error.

**Sourcing, the rule you cannot automate**

Every source is opened and read before it is cited. Not the abstract, not a
secondary write up, not memory. This is why the desktop session handed this to
you: its `web_fetch` was rate limited after one source and it would have had to
write from search snippets.

If a figure does not survive contact with the paper, drop the figure. Do not
soften it into something the paper nearly says.

### Source shortlists

Starting points only. Open each one, and replace any that does not hold up.

**Sarcopenia.** One source is already verified and read:

- *Sarcopenia: revised European consensus on definition and diagnosis* (EWGSOP2),
  `10.1093/ageing/afy169`, PMC6322506. The 2019 revision made **low strength**
  the primary criterion rather than low lean mass. Probable sarcopenia is low
  strength; confirmed adds low quantity or quality; severe adds poor physical
  performance. That inversion is the spine of the article: the field itself
  stopped defining this by size.

Then look for, and verify:

- Petermann-Rocha et al. 2022, *Global prevalence of sarcopenia and severe
  sarcopenia*, J Cachexia Sarcopenia Muscle. Search results say 10 to 27 percent
  depending on criteria, n = 692,056, mean age 68.5. **Confirm those numbers in
  the paper**, they came from a snippet.
- Goodpaster et al. 2006, Health ABC study, on strength falling faster than mass.
- Mitchell et al. 2012, on sarcopenia versus dynapenia.
- Fiatarone et al. 1990, JAMA. Already cited as source 6 in
  `progressive-overload`, so reuse the same URL for consistency.
- A resistance training intervention trial or Cochrane review in older adults.
- Bauer et al. 2013, PROT-AGE, for the protein angle.
- A mortality or disability outcome association, so the piece is about stakes
  rather than definitions.

**Do Squats Wreck Your Knees.** Nothing verified yet.

- *Impact of the deep squat on articular knee joint structures, friend or enemy?
  A scoping review*, Frontiers in Sports and Active Living 2024, PMC11618833.
  Direct answer to the headline question.
- Hartmann, Wirth, Klusemann 2013, Sports Medicine, on knee and spine load by
  squat depth. This is the load-mechanics backbone.
- *Squatting, lunging and kneeling provided similar kinematic profiles in healthy
  knees*, The Knee 2018, PMID 29802075.
- Something on knee OA prevalence in lifelong weightlifters versus controls, if a
  credible one exists. If it does not, say so in the article rather than
  reaching.
- An RCT comparing full versus partial range squats on strength outcomes.

The honest answer looks like: the load at depth is real, the evidence that it
damages healthy knees is not there, and depth is not the variable most people
should be worrying about. Do not overclaim in the other direction either.

### Videos

Each article needs 1 or 2 real YouTube embeds before it can leave draft, and
`progressive-overload` needs one too, which is the only thing keeping it in
draft.

`youtubeId` is the 11 character ID, not a URL. Verify each ID actually resolves
and the channel is credible before using it. A movement demonstrated properly, a
lecture, or a researcher explaining their own study. Never filler, never a
channel you have not watched.

Report which three you picked and why, so they can be vetoed.

### Images

Publish without images. Where a processed image already exists under
`public/articles/<slug>/` for the slug, apply it now. Do not invent paths for
files that are not there, the build will fail on the missing dimensions.

### Finishing

For each article: `npm run articles:stats` to get the real `wordCount`, set
`readingMinutes` at roughly 220 words per minute, then all four gates green.
Flip `draft: false` on all three, including `progressive-overload`, only once
each has a verified video and passes clean.

Confirm after deploy that `/training` lists three articles, that each
`/training/<slug>` returns 200, and that `sitemap.xml` carries all three.

## Job 3, only if there is time: retrofit leg-strength

It currently fails on eight counts. `npm run check:articles leg-strength` prints
them. Four are the standalone charts, which need folding into `charts` strips of
2 to 4 panels with varied kinds. The rest are 26 blocks containing em dashes,
grade 9.3 against a 9.0 target, no video, and a missing sibling link.

Do not weaken any rule to make this pass.
