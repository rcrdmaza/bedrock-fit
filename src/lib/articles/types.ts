/**
 * Content model for Bedrock.fit articles.
 *
 * An article is *data*, not JSX. Each one is a plain TypeScript object living in
 * `src/lib/articles/content/`, and every article on the site is rendered by the
 * single `ArticleLayout` component. That means:
 *
 *   - chrome, typography, footnotes, JSON-LD and the sources list are written once
 *   - a new article is a new data file plus one line in the registry
 *   - the compiler catches a missing source, a bad category, or a malformed chart
 *
 * See `content/_TEMPLATE.ts` for a copy-paste starting point and
 * `docs/ARTICLE-GUIDE.md` for house style.
 */

/* ────────────────────────────── categories ────────────────────────────── */

export type CategorySlug =
  | "strength-training"
  | "endurance"
  | "over-40"
  | "mobility-balance";

export type Category = {
  slug: CategorySlug;
  /** Display name, e.g. "Strength Training". */
  name: string;
  /** Short label used in the article eyebrow, e.g. "Strength". */
  short: string;
  /** One line, shown on the category card on the /training index. */
  tagline: string;
  /** Two or three sentences, used for the section intro and meta description. */
  description: string;
  /** Subjects that belong here — the editorial fence, not shown to readers. */
  covers: string[];
};

/* ─────────────────────────────── inline text ───────────────────────────── */

/**
 * Body copy is a plain string with a deliberately tiny inline syntax. Keeping it
 * to four constructs means content files stay readable and no author has to think
 * about JSX escaping (write real ’ “ ” — smart punctuation is fine in a .ts string).
 *
 *   **bold**
 *   *italic*
 *   [link text](https://example.com)
 *   [^3]                                → footnote marker linking to source 3
 *
 * A `[^n]` with no matching entry in the article's `sources` array is a build
 * error, which is the point: no unsourced figure ever ships.
 */
export type RichText = string;

/* ──────────────────────────────── blocks ──────────────────────────────── */

export type Bar = {
  label: string;
  /** Numeric value used for the bar width. Always positive — express a decline as a magnitude and say so in `display`. */
  value: number;
  /** What the reader sees, e.g. "−34%" or "3.4%/yr". Defaults to `value + unit`. */
  display?: string;
  /** Accented bars are the point of the chart; leave the comparison bars plain. */
  accent?: boolean;
};

export type StatItem = { big: string; label: string };

/**
 * One panel inside a `charts` strip.
 *
 * Every kind is drawn in CSS rather than SVG, for the reason set out on the
 * chart component: a fixed-viewBox SVG scaled into a phone column renders its
 * labels at roughly half the intended size. The `line` kind is the exception
 * and uses SVG for the stroke only, with the labels kept in HTML alongside.
 */
export type ChartPanel = {
  /**
   * - `bar`    horizontal bars. Best for comparing named categories.
   * - `column` vertical bars. Best when the x axis is ordered, like weeks.
   * - `line`   a trend. Use only when the points are genuinely a sequence.
   * - `donut`  one proportion of a whole. A single figure, not a comparison.
   */
  kind: "bar" | "column" | "line" | "donut";
  caption: string;
  /** Upper bound of the scale. Ignored by `donut`, which is always out of 100. */
  max: number;
  unit?: string;
  bars: Bar[];
};

export type Block =
  /** Opening paragraph. Larger and darker than body copy. Use exactly one, first. */
  | { type: "lede"; text: RichText }
  /** Body paragraph. */
  | { type: "p"; text: RichText }
  /** Section heading. `id` is auto-derived from the text unless given; it is what deep links point at. */
  | { type: "h2"; text: string; id?: string }
  /** Sub-heading inside a section. */
  | { type: "h3"; text: string }
  /** Horizontal bar chart. CSS-based, so labels stay legible on a phone. */
  | {
      type: "chart";
      title: string;
      sub?: string;
      bars: Bar[];
      /** Axis maximum. Set it a little above the largest bar so nothing hits the edge. */
      max: number;
      /** Appended to `value` when a bar has no `display`. */
      unit?: string;
      /** Attribution line under the figure, e.g. "Source: Sherrington et al., Cochrane 2019 [5]". */
      source: string;
    }
  /**
   * Two to four charts in one horizontally scrolling strip.
   *
   * The strip breaks out past the reading measure on both sides and scrolls
   * sideways with snap points, so a section can carry several views of the same
   * question without turning into a stack of boxes the reader scrolls past.
   *
   * Vary `kind` across the group. Four identical bar charts side by side is
   * just a long chart; the point is that each panel answers its part of the
   * question in the shape that suits it.
   */
  | {
      type: "charts";
      /** Shown once, above the strip. */
      title: string;
      sub?: string;
      panels: ChartPanel[];
      /** One attribution line for the whole group. */
      source: string;
    }
  /** Row of two to four headline numbers. */
  | { type: "stats"; items: StatItem[] }
  /** Data table. First column renders as label, remaining columns as accented values. */
  | {
      type: "table";
      caption: string;
      columns: string[];
      rows: string[][];
      source?: string;
    }
  /** Ordered or unordered list. Items support inline syntax. */
  | { type: "list"; ordered?: boolean; items: RichText[] }
  /**
   * Image or diagram. `src` is a path under /public — remote hosts would need
   * a `next.config.ts` allowlist, so keep assets in the repo.
   *
   * `width`/`height` are the file's intrinsic pixels and are required: they set
   * the aspect ratio that reserves space before the image loads. Ship at 2× the
   * 760px reading measure (so 1520 wide) and the layout scales it down.
   */
  | {
      type: "figure";
      src: string;
      /** Describe the content, not the file. Empty string only if purely decorative. */
      alt: string;
      width: number;
      height: number;
      /** Shown under the image. Supports inline syntax, so it can carry a [^n]. */
      caption?: RichText;
      /** Photographer, source or licence line. */
      credit?: string;
      /**
       * Landscape runs full width; portrait floats with text wrapping. Default "full".
       *
       * A portrait image at the full 760px measure is taller than most viewports
       * and pushes the next paragraph off-screen, so `check-article` rejects a
       * portrait figure left on "full".
       */
      layout?: "full" | "wrap-left" | "wrap-right";
      /**
       * Where the image came from. Required for anything licensed rather than
       * shot in-house. Emitted as `acquireLicensePage` in the JSON-LD.
       */
      sourceUrl?: string;
      /**
       * A **URL to the licence terms**, e.g. "https://www.pexels.com/license/".
       *
       * Not the licence's name. This is emitted straight into the `license`
       * property of the `ImageObject`, and Google's licensable-image structured
       * data requires a URL there — a human-readable string like "Pexels
       * Licence" populates the field without qualifying, which looks correct in
       * a casual check while silently forfeiting the result.
       *
       * The plain-words form belongs in the image file's own XMP `dc:rights`,
       * written from the `copyright` field of the manifest. Different layer,
       * different format, deliberately.
       */
      license?: string;
    }
  /**
   * YouTube embed, on-topic only — a demonstration of a movement, a lecture, a
   * researcher explaining their own study. Not filler.
   *
   * Served from youtube-nocookie.com and lazy-loaded, so nothing is requested
   * until the reader scrolls to it.
   */
  | {
      type: "video";
      /** The 11-character ID only, not a full URL. From youtu.be/<id> or watch?v=<id>. */
      youtubeId: string;
      /** Real video title — becomes the iframe's accessible name. */
      title: string;
      /** Why this video is here, in one line. Supports inline syntax. */
      caption?: RichText;
      /** Start offset in seconds. */
      start?: number;
    }
  /** Tinted aside — a caveat, a definition, a "how to test this yourself". */
  | { type: "callout"; title: string; text: RichText }
  /** Pull quote. Use sparingly, at most once per article. */
  | { type: "quote"; text: RichText; attribution?: string }
  /** Mid- or end-of-article conversion block. */
  | { type: "cta"; title: string; text: string; label: string; href: string };

/* ──────────────────────────────── sources ─────────────────────────────── */

export type Source = {
  /** 1-based, matching the `[^n]` markers in the body. Keep them in first-use order. */
  n: number;
  /**
   * The work's title, and nothing else. No authors, no journal, no year, no
   * page range.
   *
   * The full citation string was tried first and read as academic clutter at
   * the foot of a page meant for a general reader. The title alone still tells
   * you what you are about to open, and the link carries the rest. It also
   * removes the one legitimate use of en dashes on the page, which were page
   * ranges fighting the house style rule.
   *
   * The whole title becomes the link, so there is no bare "Link" to click.
   */
  text: string;
  url: string;
};

/* ──────────────────────────────── article ─────────────────────────────── */

export type Article = {
  /** URL segment: /training/<slug>. Lowercase, hyphenated, never changed after publish. */
  slug: string;

  /** H1 as displayed. */
  title: string;
  /**
   * A trailing fragment of `title` rendered in green. Must appear verbatim at the
   * end of `title`, or it is ignored.
   */
  titleAccent?: string;

  /** <title> tag. " | Bedrock.fit" is appended automatically. Aim for under 60 chars before the suffix. */
  seoTitle: string;
  /** Meta description and social description. 140–160 characters. */
  description: string;
  /** Standfirst under the H1. One sentence, plain language, no numbers. */
  dek: string;

  category: CategorySlug;
  /** Optional finer-grained label shown in the eyebrow after the category, e.g. "Lower body". */
  topic?: string;
  /** Free-form keywords. Not rendered; used for metadata and future related-article logic. */
  tags?: string[];

  /** ISO date. Never change after publish. */
  published: string;
  /** ISO date. Bump whenever copy or a figure changes. */
  updated: string;

  /** Shown in the byline strip. Estimate at ~220 words/minute, rounded. */
  readingMinutes: number;
  /** Body word count, used for Article JSON-LD. Run `npm run articles:stats` to refresh. */
  wordCount: number;

  /** Pinned to the top of the /training index. At most two at a time. */
  featured?: boolean;
  /** Excluded from the index, the sitemap and generateStaticParams, and marked noindex. */
  draft?: boolean;

  blocks: Block[];
  sources: Source[];

  /** Overrides the standard medical disclaimer when an article needs a stricter one. */
  disclaimer?: string;

  /** Three short number/label pairs burned into the generated OG image. */
  ogStats?: [string, string][];
};
