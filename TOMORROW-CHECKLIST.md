# Bedrock.fit — Tomorrow's Work

Planned from the 2026-07-03 session. Priority: 🔴 critical · 🟡 moderate · 🟢 polish.

> **Where the work lives.** Items marked **[bundle]** are inside
> `public/strength-scan.html` — the design-tool export. The calculator logic
> is a gzipped/base64 asset inside it, so these are cleanest to change in the
> original design tool and re-export, rather than hand-editing the bundle.
> Items marked **[next]** are normal edits in our Next.js code.

---

## A. Home calculator — functionality  ✅ REBUILT IN REACT (this batch)

- [x] 🔴 **Calculator built as a real React page** (`src/app/page.tsx`).
      Replaced the static iframe bundle with working Epley 1RM math, strength
      level, rep table, training zones, and projected feats — all computed live
      from the form. Logic reused from `_previous-page.tsx.bak`.
- [x] 🟡 **Reset button** — clears inputs + results, sits next to "Reveal".
- [x] 🟡 **Input placeholders set to `0`.**
- Note: the old `public/strength-scan.html` bundle is now **orphaned** (no route
      uses it). Safe to delete later; kept for reference for now.

## B. Home calculator — archetype visuals [bundle] + assets

- [ ] 🔴 **Archetype avatar images.** Give each archetype an image whose
      physique matches the generated result, shown in the "Your Projected
      Physique" panel — this replaces today's empty/broken render box and makes
      the result fun to visualize.
  - [ ] List every archetype and its physique (e.g. The Vanguard, Diamond in
        the Rough, Future Olympic Lifter, Calisthenics Machine, Marathoner in
        the Making, The All-Rounder, The Rising Athlete).
  - [ ] Decide source: AI-generated illustrations (consistent, rights-clean) vs.
        licensed stock. Recommend original illustrated avatars for a cohesive,
        rights-safe set. (Claude can generate these.)
  - [ ] Wire the correct avatar to each result.

## C. Celebrity comparison section — PLANNING

- [ ] 🟡 **Celebrity pictures for the relevant section.** The section already
      exists in the bundle ("You Match Up With") and **already hardcodes real
      public figures** — Chris Hemsworth (98%), Alex Honnold (91%), David
      Goggins (87%) — each with an empty circular photo slot. Plan: make these
      dynamic per archetype and fill the photos.
  - [ ] ⚠️ **Rights check first — elevated concern.** These are real, named
        public figures shown in an endorsement-style "you match" context. Real
        photos carry copyright *and* publicity/likeness rights; the current
        name-based matches may themselves need review. Safest path: original
        illustration/caricature, or licensed imagery, or generic athlete
        archetypes instead of named celebrities. Confirm approach before
        sourcing anything.

## D. Layout for monetization [next] / [bundle]

- [x] 🟡 **Ad-slot layout added (this batch).** The React home now has two
      reserved, dashed ad containers — a 728×90 leaderboard under the header and
      a 970×90 full-width unit above the footer — with fixed heights to minimize
      layout shift. **Still no live ad code** until AdSense approves (label-only
      placeholders). Follow-up: add an in-content slot between result panes if
      desired.

## E. Visual refinement

- [x] 🟡 **Reduced neon-green impact on home (this batch).** The React home uses
      a still, low-opacity (0.2) matrix, white headings with green reserved for
      key numbers/CTA (not every heading), and the calmer palette.
- [ ] 🟢 Optional further toning if still too loud after review.
- [x] 🟡 **Mobile responsive home (this batch)** — hero + results grids stack on
      phones (breakpoints at 860px / 600px).
- [x] 🟡 **Hero word-spacing fixed** — "UNLOCK YOUR" no longer renders tight.
- [ ] 🟢 **Logo.** Search for / design a real logo — the current mark is a
      generic hexagon. Explore concepts, then produce favicon + OG image set.

## F. Carry-over from the design audit

- [x] 🔴 **DONE + VERIFIED LIVE (2026-07-03)** — home footer "Privacy" →
      `/privacy`, "About" → `/methodology` (both `target="_top"`). Clicking
      Privacy on the live site navigates to `www.bedrock.fit/privacy`.
      AdSense navigation unblocked.
- [x] 🟢 **DONE + VERIFIED LIVE** — reduced neon/matrix intensity on the legal
      pages (SiteFrame canvas opacity 0.5 → 0.26, per-char 0.5 → 0.3).
- [ ] 🟡 Hero renders as "UNLOCKYOUR" (missing word-space); fix spacing. **[bundle]**
- [ ] 🟡 Stray "×" glyph before the "YOUR GO-TO LIFT" label; remove/replace. **[bundle]**
- [ ] 🟡 Redundant "Your projected physique" heading (banner + right column). **[bundle]**
- [ ] 🟡 Lighten faint muted text (`#5f7a5f`) to meet WCAG AA on the dark bg. **[bundle]**

---

*Created 2026-07-03.*
