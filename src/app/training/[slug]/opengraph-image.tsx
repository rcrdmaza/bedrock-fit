import { getAllArticlesIncludingDrafts, getCategory } from "@/lib/articles";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

/**
 * Per-article social card, generated from the article's own front matter.
 * Layout and font loading live in src/lib/og.tsx and are shared with the
 * /training index card.
 */

export const alt = "Bedrock.fit training article";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getAllArticlesIncludingDrafts().map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getAllArticlesIncludingDrafts().find((a) => a.slug === slug);

  // The [slug] page 404s for an unknown slug; this route can still be hit
  // directly, so fall back to a generic card rather than throwing.
  if (!article) {
    return renderOgCard({
      eyebrow: "Training",
      title: "Bedrock.fit",
      dek: "Evidence-based training articles.",
    });
  }

  const category = getCategory(article.category);

  return renderOgCard({
    eyebrow: article.topic ? `${category.short} · ${article.topic}` : category.name,
    title: article.title,
    accent: article.titleAccent,
    dek: article.dek,
    // Without hand-picked numbers, fall back to the one stat every article has.
    stats: article.ogStats ?? [[`${article.sources.length} sources`, "peer-reviewed"]],
  });
}
