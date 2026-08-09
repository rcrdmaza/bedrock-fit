import type { Article } from "../types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ARTICLE TEMPLATE — copy this file, don't edit it.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  1.  cp src/lib/articles/content/_TEMPLATE.ts src/lib/articles/content/<slug>.ts
 *  2.  Rename the exported const to a camelCase version of the slug.
 *  3.  Fill in the front matter, write the blocks, list the sources.
 *  4.  Register it in src/lib/articles/index.ts (one import + one array entry).
 *  5.  npx tsc --noEmit && npm run build, then open /training/<slug>.
 *
 *  Files starting with `_` are ignored by the registry, so this one never ships.
 *  Full house style, sourcing rules and the pre-publish checklist:
 *  docs/ARTICLE-GUIDE.md
 *
 *  ── Inline syntax available in every `text` field ──────────────────────────
 *    **bold**
 *    *italic*
 *    [link text](https://example.com)
 *    [^3]                    → footnote marker; 3 must exist in `sources`
 *
 *  Write real typographic punctuation directly — ’ “ ” — and en dashes in
 *  number ranges (5–12), em dashes in asides. No HTML entities: these are
 *  plain strings, not JSX.
 *
 *  ── Every figure needs a footnote. ────────────────────────────────────────
 *  A number without a [^n] does not ship. A [^n] with no matching source is a
 *  type error. This is the one rule with no exceptions.
 */
export const templateArticle: Article = {
  /* ── front matter ─────────────────────────────────────────────────────── */

  /** URL segment. Lowercase, hyphenated, 2–4 words, keyword-first. Never change it after publish. */
  slug: "replace-me",

  /** The H1 exactly as it should read. Short — the dek carries the detail. */
  title: "Headline Goes Here",
  /** Optional trailing fragment of `title` rendered in green. Must match the end of `title` verbatim. */
  titleAccent: "Here",

  /** <title> tag; " | Bedrock.fit" is appended for you. Under ~60 chars. Front-load the keyword. */
  seoTitle: "Headline Goes Here: The Specific Promise",
  /**
   * Meta + social description, 140–160 characters. State what the reader learns,
   * not that the article exists. No "In this article, we…".
   */
  description:
    "One or two sentences describing the concrete thing a reader takes away, with the specific angle that makes this piece different from every other page on the topic.",
  /** Standfirst under the H1. One sentence, conversational, no statistics. */
  dek: "The plain-language version of the argument, in a single sentence.",

  /** One of: "strength-training" | "endurance" | "over-40" | "mobility-balance". Exactly one. */
  category: "strength-training",
  /** Optional finer label shown after the category in the eyebrow, e.g. "Lower body". */
  topic: "Sub-topic",
  /** Not rendered. Keywords for metadata and future related-article logic. */
  tags: ["keyword one", "keyword two"],

  /** ISO dates. `published` is frozen; bump `updated` on any copy or figure change. */
  published: "2026-01-01",
  updated: "2026-01-01",

  /** ~220 words per minute, rounded to a whole number. */
  readingMinutes: 8,
  /** Body word count, for Article JSON-LD. `npm run articles:stats` prints the real number. */
  wordCount: 1800,

  /** Pins to the top of /training. Two at most across the whole site. */
  featured: false,
  /** Keeps it out of the index, sitemap and static params, and marks it noindex. Flip to false to publish. */
  draft: true,

  /** Three number/label pairs burned into the generated social image. Pick the article's best numbers. */
  ogStats: [
    ["00%", "the headline finding"],
    ["0×", "the surprising comparison"],
    ["0 sources", "peer-reviewed"],
  ],

  /* ── body ─────────────────────────────────────────────────────────────────
   *
   * A working shape for a Bedrock article, roughly 1,600–2,200 words:
   *
   *   lede            → the concrete, everyday stakes. No statistics yet.
   *   p               → the thesis in two sentences, and what the piece will show.
   *   h2 + p + chart  → what the mechanism is
   *   h2 + p + chart  → what the evidence says
   *   h2 + p          → the common objection, answered honestly
   *   h2 + h3 ×4–5    → what to actually do
   *   h2 + table      → how to measure whether it worked
   *   h2 + p          → the short version
   *   cta             → the strength scan
   *
   * Two to four charts per article. Fewer than two and it reads like an
   * unsourced opinion; more than four and nothing stands out.
   */
  blocks: [
    {
      type: "lede",
      text: "Open with something the reader already does — standing up, carrying a bag, walking to the station — and connect it to the physical quality this article is about. Concrete before abstract. No numbers in the lede.",
    },
    {
      type: "p",
      text: "Second paragraph states the thesis plainly and says what the rest of the piece will show. Two or three sentences.",
    },

    { type: "h2", text: "The mechanism — what is actually going on" },
    {
      type: "p",
      text: "Explain the physiology in plain language before citing anything. A reader who understands why should find the numbers unsurprising[^1].",
    },
    {
      type: "chart",
      title: "What the chart shows, stated as a claim",
      sub: "Population, sample size and follow-up period in one line.",
      /* `unit` is appended to `value` when a bar has no `display`. */
      unit: "%",
      /* Set `max` a little above the largest bar so nothing touches the edge. */
      max: 100,
      bars: [
        { label: "The finding that matters", value: 62, display: "62%", accent: true },
        { label: "The comparison group", value: 24, display: "24%" },
      ],
      source: "Source: Author et al., Journal Year; n = 0,000 [1]",
    },

    { type: "h2", text: "What the evidence says" },
    {
      type: "p",
      text: "Lead with the strongest study, name its design and size, and give the effect size in the units a reader can picture. Hedge honestly: *associated with*, not *causes*, unless it is a randomised trial[^2].",
    },
    {
      type: "stats",
      items: [
        { big: "1 in 4", label: "What this proportion describes" },
        { big: "3M", label: "What this count describes" },
        { big: "319K", label: "What this count describes" },
      ],
    },

    /* ── graphic ───────────────────────────────────────────────────────────
     * An image or diagram at the full reading measure. `src` is a path under
     * /public — put article assets in /public/articles/<slug>/.
     *
     * `width`/`height` are the file's real pixel dimensions and are required:
     * they reserve the space before the image loads. Export at 2× the 760px
     * column (1520 wide) and let the layout scale it down.
     *
     * `alt` describes what the image shows, not what the file is. Delete this
     * block if the piece doesn't need a graphic — never add one as filler.
     */
    {
      type: "figure",
      src: "/articles/replace-me/diagram.png",
      alt: "What the image actually shows, described for someone who can’t see it.",
      width: 1520,
      height: 855,
      caption: "What the reader should take from it — a sentence, not a label. Can carry a [^1].",
      credit: "Illustration: Bedrock.fit",
    },

    /* ── video ─────────────────────────────────────────────────────────────
     * On-topic only: a movement demonstrated properly, a lecture, a researcher
     * explaining their own study. Never filler, never a channel you haven't
     * watched end to end.
     *
     * `youtubeId` is the 11-character ID, not a URL:
     *   https://youtu.be/dQw4w9WgXcQ            → "dQw4w9WgXcQ"
     *   https://youtube.com/watch?v=dQw4w9WgXcQ → "dQw4w9WgXcQ"
     *
     * Served from youtube-nocookie.com and lazy-loaded, so nothing is requested
     * until the reader scrolls to it. `start` is an offset in seconds — use it
     * to skip to the part that's actually relevant.
     */
    {
      type: "video",
      youtubeId: "REPLACE_ME1",
      title: "The real video title, as it appears on YouTube",
      caption: "One line on why this video is here and what to watch for.",
      start: 0,
    },

    { type: "h2", text: "“The objection a sceptical reader would raise”" },
    {
      type: "p",
      text: "Steelman it, then answer it. Never wave it away. If the honest answer is “it depends”, say what it depends on.",
    },
    {
      type: "callout",
      title: "Worth saying plainly",
      text: "A caveat, a definition, or a self-test the reader can run today. Use at most one or two of these per article.",
    },

    { type: "h2", text: "What actually works" },
    { type: "h3", text: "1. The first thing to do" },
    {
      type: "p",
      text: "Prescriptive but not bossy. Give the range, say what matters most, and say what to do if the standard version is not available.",
    },
    { type: "h3", text: "2. The second thing to do" },
    { type: "p", text: "Same again. Four or five of these is the right number." },

    { type: "h2", text: "How to know whether it’s working" },
    {
      type: "p",
      text: "Give a test the reader can run with no equipment, and a number to compare against[^3].",
    },
    {
      type: "table",
      caption: "What the table measures — read this as a sentence",
      columns: ["Age", "Men", "Women"],
      rows: [
        ["60–64", "00", "00"],
        ["65–69", "00", "00"],
      ],
      source: "Source: Organisation, Document Title [3]",
    },

    { type: "h2", text: "The short version" },
    {
      type: "p",
      text: "One paragraph restating the argument with its key numbers, then one closing paragraph that zooms back out to what it means for the reader’s life. Do not introduce anything new here.",
    },

    {
      type: "cta",
      title: "A question the reader now wants answered",
      text: "Enter one squat or deadlift set and get an estimated 1-rep max, your strength tier, and training zones — free, no signup.",
      label: "Get my strength scan →",
      href: "/",
    },
  ],

  /* ── sources ───────────────────────────────────────────────────────────────
   *
   * Numbered in order of first use. Primary literature (journals, Cochrane) or
   * authoritative bodies (CDC, WHO, NIH, HHS) only — no blogs, no press
   * releases, no supplement companies, no YouTube. Full citation: authors,
   * title, journal, year, volume, pages. Link to the DOI, PubMed or the
   * publisher, never to a PDF mirror.
   */
  sources: [
    {
      n: 1,
      text: "Author AB, et al. “Full Title of the Paper.” Journal Name, Year;Volume(Issue):Pages.",
      url: "https://example.com/paper",
    },
    {
      n: 2,
      text: "Author CD, et al. “Full Title of the Paper.” Journal Name, Year;Volume(Issue):Pages.",
      url: "https://example.com/paper-2",
    },
    {
      n: 3,
      text: "Organisation Name. “Document Title.” Programme or series, Year.",
      url: "https://example.com/guidance",
    },
  ],

  /* Optional. Omit to use the standard medical disclaimer, which is what almost
     every article should do. Override only when a topic needs a stricter one. */
  // disclaimer: "…",
};
