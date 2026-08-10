# Handoff: commit and ship the About Us page

Paste everything below the line into the local Claude Code session running in
`~/bedrock-fit`. It holds the SSH key, so it can push.

---

You are working in `~/bedrock-fit`, currently at `6d4fe03`. Read `AGENTS.md`
first. This is Next.js 16.2.3 and not the Next.js you have memorised, so read
`node_modules/next/dist/docs/` before writing any framework code.

## What this is

An About Us page. It was the single page named as genuinely missing in the
AdSense re-assessment: Contact and Terms cover how to reach the site and what it
will not do, but nothing answered "who is telling me this", which carries real
weight on health content.

It is already written and verified locally. Your job is to review it, run the
gates, commit, push, and confirm the deploy. Do not rewrite the copy.

## Files in this change

```
src/app/about/page.tsx         new, the page itself
src/app/sitemap.ts             adds /about at priority 0.6
src/components/SiteFrame.tsx   footer link, dark theme pages
src/components/LightFrame.tsx  footer link, /training and articles
src/app/page.tsx               footer link, home page
```

Nineteen inserted lines across the four existing files. Nothing removed.

**Do NOT commit any of these**, all currently untracked and all deliberate:

```
REVENUE-BOARD.html             carries the AdSense publisher ID and GA4 property ID
.claude/                       local MCP permissions
```

`docs/previews/` is already gitignored, so the preview file will not appear.

**Two files you should decide on separately, not in this commit:**
`docs/PERF-BASELINE.md` and `docs/claude-code/HANDOFF-batch-1.md` are untracked
and both belong in git. They are unrelated to the About page. Commit them on
their own afterwards if you agree.

## Constraints the page was written under

These are the site's house style, enforced on articles by
`scripts/check-article.mjs`. That script only scans article content files, so it
cannot see this page. It was checked by hand instead:

- **No em or en dashes anywhere.** Verified: zero in the rendered page.
- **Ninth grade reading level or below.** Measured **6.7** on the rendered body
  text, against a 9.0 target.
- 532 words. Short on purpose.
- No names, no personal email, no founder story. The contact page already
  carries the one line about who runs the site.

If your review changes any copy, re-measure both before committing. Do not
introduce a dash.

## Run the gates

All four, in this order. All were green locally before handoff.

```
npx tsc --noEmit
npx eslint src scripts
npm run check:articles
npm run build
```

`check:articles` should report **4/4 passing**. It does not touch this page, but
run it anyway so a regression elsewhere cannot ride along unnoticed.

A note if a build fails on `lightningcss`: that only happens in a Linux sandbox
against this repo's `node_modules`, which ships a macOS binary. On your Mac it
builds fine.

## Review points, in case something looks off to you

- The footer link must appear in **all three** footers and in **none** of the
  top navs. That was the explicit request. Verified in the built HTML for
  `/about`, `/` and `/training`.
- The title is `About Us | Bedrock.fit`, with a pipe. Every other page uses
  `X — Bedrock.fit` with an em dash, which breaks the no-dash rule in the most
  visible place there is, the search result. Those pages are already indexed, so
  changing them alters live search listings and is a separate decision. **Leave
  them alone in this commit.**
- `/about` sits at sitemap priority 0.6, above the other supporting pages,
  because a footer-only page is realistically found through the sitemap.

## Commit

Suggested message:

```
Add an About Us page, linked from the footer only

Contact and Terms say how to reach the site and what it will not do. Nothing
said who is telling you this, which is the question that matters most on
health content and the one page an AdSense reviewer looks for that was
missing.

It argues the case for legs through independence, stairs, falls and
recovery, and concedes plainly that the heart and the brain matter more.
Leading with the concession is deliberate; it makes the rest more credible,
not less. The name is explained through the plant foot rather than through
an etymology.

Footer only, in all three footers, labelled About Us. Nothing in the top
nav, which is for things a visitor came to do.

532 words, reading grade 6.7 against the 9.0 house target, zero dashes.
The article checker cannot see this file, so both were measured by hand.
```

## After pushing, confirm

1. `https://www.bedrock.fit/about` returns **200**.
2. **About Us appears in the footer and not in the top nav.** Check on `/about`
   itself, on `/`, and on `/training`, since the three use different frames.
3. `https://www.bedrock.fit/sitemap.xml` carries **11 URLs**. It was 10 before:
   home, `/training`, four articles, methodology, privacy, terms, contact.
4. The page renders with the logo at top left and no images, which is expected.
   Images come later.

Report the sitemap count back explicitly. If it is still 10, the deploy served a
cached build and it is worth checking Vercel rather than assuming the code is
wrong.

## Then, if you have time

Two small things already on the board, both independent of this change:

- `src/components/LightFrame.tsx` around line 175 still has the old
  "entertainment only" footer wording and an em dash, while `SiteFrame` got
  reworded in `5bd9eae`. The two footers now disagree about liability. It is
  legal-adjacent copy, so show the before and after before committing.
- `npm run articles:stats` is referenced in three docs and does not exist in
  `package.json`. Either write it or remove the references.
