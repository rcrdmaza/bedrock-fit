# Bedrock.fit — Tomorrow's Work

Planned from the 2026-07-03 session. Priority: 🔴 critical · 🟡 moderate · 🟢 polish.

> **Where the work lives.** Items marked **[bundle]** are inside
> `public/strength-scan.html` — the design-tool export. The calculator logic
> is a gzipped/base64 asset inside it, so these are cleanest to change in the
> original design tool and re-export, rather than hand-editing the bundle.
> Items marked **[next]** are normal edits in our Next.js code.

---

## A. Home calculator — functionality [bundle]

- [ ] 🔴 **Build the calculator — there is NO calc logic today.** Inspected the
      bundle: the only script handles theme, language, and the matrix animation.
      The form, "Reveal my physique" button, 245 1RM, nutrition, and celebrity
      matches are **hardcoded static HTML** — nothing computes. Confirmed live
      (bodyweight 200 + lift 315 → still 245). This is a build, not a fix.
      **Recommendation:** rebuild the home experience as a real React page
      (reusing the working logic already in `src/app/_previous-page.tsx.bak`)
      rather than trying to add logic inside the opaque bundle.
- [ ] 🟡 **Add a Reset button** — clears all inputs and results back to the
      default/empty state (sits next to "Reveal my physique").
- [ ] 🟡 **Set input placeholders to `0`** — currently 70 / 185 / 185 / 5.

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

- [ ] 🟡 **Ad-slot spacing along the panes.** Note: the bundle **already has a
      dashed "970 × 90 · FULL-WIDTH AD UNIT" placeholder** just above the footer
      (visual only, no real ad code). Plan real, well-spaced responsive slots
      between the hero, results, and nutrition panes (plus the existing full-
      width slot), reserving fixed heights to keep layout shift (CLS) low.
  - Note: still **no live ad code** until AdSense approves the site — layout
        planning only, consistent with the earlier decision.

## E. Visual refinement

- [ ] 🟡 **Reduce neon-green impact** for a more refined feel: lower matrix
      background opacity, use green as an accent rather than on every heading,
      and soften the all-caps green blocks. Improves polish and ad legibility.
      (Matrix opacity is easy to tune on the legal pages **[next]**; the home
      version is **[bundle]**.)
- [ ] 🟢 **Logo.** Search for / design a real logo — the current mark is a
      generic hexagon. Explore concepts, then produce favicon + OG image set.

## F. Carry-over from the design audit

- [x] 🔴 **DONE — home footer "Privacy" → `/privacy`, "About" → `/methodology`**
      (both `target="_top"`, edited in the bundle). Unblocks AdSense navigation.
- [x] 🟢 **DONE — reduced neon/matrix intensity on the legal pages** (SiteFrame
      canvas opacity 0.5 → 0.26, per-char 0.5 → 0.3).
- [ ] 🟡 Hero renders as "UNLOCKYOUR" (missing word-space); fix spacing. **[bundle]**
- [ ] 🟡 Stray "×" glyph before the "YOUR GO-TO LIFT" label; remove/replace. **[bundle]**
- [ ] 🟡 Redundant "Your projected physique" heading (banner + right column). **[bundle]**
- [ ] 🟡 Lighten faint muted text (`#5f7a5f`) to meet WCAG AA on the dark bg. **[bundle]**

---

*Created 2026-07-03.*
