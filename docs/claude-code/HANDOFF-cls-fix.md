# Handoff: ship the CLS fix, then verify it actually worked

Paste everything below the line into the local Claude Code session in
`~/bedrock-fit`. It holds the SSH key.

---

You are in `~/bedrock-fit` at `8e39c7e`. Read `AGENTS.md` first.

## The change

One file, four lines: `display: "optional"` added to all four `next/font`
families in `src/app/layout.tsx`, plus a long comment explaining why. Nothing
else is modified.

**Already verified, so you are confirming rather than discovering.** As of this
handoff: `tsc` exit 0, `eslint` clean, `check:articles` 4/4, build compiles, and
the output carries **35 `font-display:optional`** with the **4 `size-adjust`
fallbacks intact**. If any of that differs on your machine, something moved
between then and now and is worth understanding before you commit.

Two other things are uncommitted in the tree and are **not** part of this
commit: `docs/PERF-BASELINE.md` (carries the corrected diagnosis, commit it with
the post-fix numbers in step 4 below) and `docs/claude-code/HANDOFF-copy-sweep.md`.
`REVENUE-BOARD.html` and `.claude/` stay untracked, always.

## Why, because the reasoning is not obvious and you should be able to challenge it

`/training` measures **CLS 0.24** on mobile in PageSpeed Insights, against a 0.1
threshold, with the whole 0.240 attributed to `body` rather than any child. The
page is fully prerendered and has no images, so almost nothing on it can move.

The obvious explanation, that text reflows when the real font replaces the
fallback, was tested and is **wrong**. `next/font` generates a metric-adjusted
fallback per family and they are accurate: measured live at a 376px column,
`"Space Grotesk Fallback"` renders a 146-character paragraph at exactly the same
height as the real face.

The actual mechanism is that those fallbacks are declared `src: local("Arial")`.
Where Arial is absent and fontconfig does not alias it, the adjusted fallback
silently no-ops and the chain falls through to plain `sans-serif`, which measures
**25px taller** for that same paragraph. Every text block shifts, then the real
font arrives and it snaps back. Lighthouse runs headless Chromium on Linux, where
Arial frequently is not installed.

`display: "optional"` removes the swap entirely: the browser allows roughly 100ms
and, if the font is not ready, renders the fallback and does not swap for that
page view. The shift stops being possible rather than becoming less likely, and
it no longer depends on the presence of one Microsoft font.

**The trade is real.** A first-time visitor on a slow connection may read one page
view in the fallback face rather than Space Grotesk and Archivo. Returning
visitors always get the brand fonts from cache. This was put to the site owner as
a choice and `optional` was chosen deliberately. Do not quietly revert it to
`swap` because the first cold load looks less polished.

## Gates

Five now, not four. `check:copy` landed in `8e39c7e` and needs a build first.

```
npx tsc --noEmit
npx eslint src scripts
npm run check:articles      # expect 4/4 passing
npm run build
npm run check:copy          # expect all routes clean
```

`check:copy` should be unaffected: this change alters which font paints, not what
the text says, and the grade is computed from the words. If it does move, that is
interesting and worth reporting rather than working around.

Then confirm the build actually emitted the change:

```
grep -rho 'font-display:[a-z]*' .next/static | sort | uniq -c     # expect 35 optional
grep -rho 'size-adjust:[0-9.]*%' .next/static | sort | uniq -c    # expect 4, unchanged
```

If `size-adjust` disappears, something removed the metric-adjusted fallbacks and
the change has made things worse rather than better. Stop and say so.

A note on grep and locale, learned the hard way during the copy sweep: with
`LANG` unset the shell runs in the C locale and a bracket expression like
`'[—–]'` matches **individual UTF-8 bytes**, producing large false counts. The
two greps above match plain ASCII so they are safe, but do not reach for a
bracketed non-ASCII pattern to check anything here.

## Commit

```
Stop font swap from shifting the page, with display: optional

/training measured CLS 0.24 on mobile against a 0.1 threshold, the whole of
it attributed to body rather than any child element.

The usual explanation does not hold. next/font's metric-adjusted fallbacks
are accurate: at a 376px column, Space Grotesk Fallback renders a paragraph
at exactly the same height as the real face. Swapping between those two
moves nothing.

What moves is the level below. Those fallbacks are declared
src: local("Arial"). Where Arial is absent the fallback silently no-ops and
the chain drops to plain sans-serif, which measures 25px taller for the same
paragraph. Lighthouse runs headless Chromium on Linux, which is why the
shift appears there and measures zero in a real browser on a Mac.

optional removes the swap, so this stops depending on whether a given
machine happens to have one Microsoft font installed. The cost is that a
first cold load may render in the fallback face and stay there for that page
view.
```

## Verify, and this part is the point

The change cannot be validated locally. A Mac measures zero layout shift on
`/training` either way, before and after, because Arial is present. **The only
honest test is the environment that produced the number.**

After deploying, run PageSpeed Insights on
`https://www.bedrock.fit/training` with `form_factor=mobile` **three times** and
take the median CLS. Three runs, not one: the home page scored 44 and then 61 on
consecutive days with no code change between them, so a single run is not
evidence.

### What success looks like, so you can tell it from noise

`/training` mobile CLS should land at or near **0**, not merely under 0.1. The
mechanism being removed is binary: either the page swaps fonts mid-load or it
does not. A median of 0.08 would be a partial result and would mean something
else is also moving, which is worth saying rather than declaring victory on a
passing number.

Expect the Lighthouse **screenshots to look different**: text may render in the
fallback face throughout, because `optional` means the browser stops waiting and
does not swap. That is the fix working, not a regression.

Pre-fix numbers for comparison, all from 10 Aug:

| | `/` mobile | `/` desktop | `/training` mobile |
|---|---|---|---|
| Performance | 61 | 96 | 51 |
| LCP | 7.7 s | 0.7 s | 7.3 s |
| CLS | 0 | 0 | **0.24** |
| TBT | 120 ms | 160 ms | 10 ms |

Report back:

- median CLS for `/training` mobile across three runs, and the three raw values
- the Performance score alongside it, since `optional` can move LCP either way:
  it removes a swap but may also mean the fallback is what gets measured
- whether `/` mobile CLS is still 0, to confirm nothing regressed there

Then update the table and the "what the numbers actually say" section in
`docs/PERF-BASELINE.md` with the post-fix numbers, keeping the pre-fix ones so
the comparison survives.

**If the median is still above 0.1**, do not start guessing. Say so, and note
that the remaining candidates are the sticky nav in `LightFrame` and the
`radial-gradient` header block on `/training`, neither of which has been ruled
out yet.
