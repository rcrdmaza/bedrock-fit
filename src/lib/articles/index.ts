import type { Article, CategorySlug } from "./types";
import { CATEGORIES } from "./categories";
import { legStrength } from "./content/leg-strength";
import { progressiveOverload } from "./content/progressive-overload";

export * from "./types";
export { CATEGORIES, getCategory } from "./categories";

/**
 * The article registry.
 *
 * Adding an article is two lines: an import above, and an entry here. Order in
 * this array is irrelevant — everything that renders a list sorts by date.
 * Files prefixed with `_` (like `_TEMPLATE.ts`) are never imported and never ship.
 */
const REGISTRY: Article[] = [legStrength, progressiveOverload];

/* ── integrity checks ──────────────────────────────────────────────────────
 *
 * These run at module load, which on a statically-generated site means at build
 * time. A duplicate slug or an orphaned footnote fails `next build` rather than
 * shipping a broken page — cheaper to catch here than in review.
 */
function assertRegistryIsSound(articles: Article[]) {
  const seen = new Set<string>();

  for (const a of articles) {
    if (seen.has(a.slug)) throw new Error(`Duplicate article slug: "${a.slug}"`);
    seen.add(a.slug);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)) {
      throw new Error(`Article slug must be lowercase and hyphenated: "${a.slug}"`);
    }

    const sourceNumbers = new Set(a.sources.map((s) => s.n));
    if (sourceNumbers.size !== a.sources.length) {
      throw new Error(`Article "${a.slug}" has duplicate source numbers`);
    }

    // Every [^n] in the body must resolve, or the footnote link goes nowhere.
    for (const block of a.blocks) {
      const text = "text" in block ? block.text : "";
      const items = block.type === "list" ? block.items.join(" ") : "";
      for (const [, n] of `${text} ${items}`.matchAll(/\[\^(\d+)\]/g)) {
        if (!sourceNumbers.has(Number(n))) {
          throw new Error(`Article "${a.slug}" cites source [${n}], which is not in its sources list`);
        }
      }
    }

    if (a.titleAccent && !a.title.endsWith(a.titleAccent)) {
      throw new Error(`Article "${a.slug}": titleAccent "${a.titleAccent}" is not the end of title "${a.title}"`);
    }
  }
}

assertRegistryIsSound(REGISTRY);

/* ── queries ───────────────────────────────────────────────────────────── */

const byNewest = (a: Article, b: Article) => (a.published < b.published ? 1 : -1);

/** Everything publishable, newest first. Drafts are excluded outside `next dev`. */
export function getArticles(): Article[] {
  const showDrafts = process.env.NODE_ENV === "development";
  return REGISTRY.filter((a) => showDrafts || !a.draft).sort(byNewest);
}

/** Includes drafts. Used by the [slug] route so a draft is previewable by direct URL. */
export function getAllArticlesIncludingDrafts(): Article[] {
  return [...REGISTRY].sort(byNewest);
}

export function getArticle(slug: string): Article | undefined {
  return REGISTRY.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: CategorySlug): Article[] {
  return getArticles().filter((a) => a.category === category);
}

/** Categories in display order, each with its articles. Empty categories are kept — they signal what's coming. */
export function getCategoriesWithArticles() {
  return CATEGORIES.map((category) => ({
    category,
    articles: getArticlesByCategory(category.slug),
  }));
}

export function getFeaturedArticles(): Article[] {
  return getArticles().filter((a) => a.featured);
}

/** Up to `limit` other articles, preferring the same category. */
export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const current = getArticle(slug);
  if (!current) return [];
  const others = getArticles().filter((a) => a.slug !== slug);
  const sameCategory = others.filter((a) => a.category === current.category);
  const rest = others.filter((a) => a.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
