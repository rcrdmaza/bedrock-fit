import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/article/ArticleLayout";
import { getAllArticlesIncludingDrafts, getArticle, getArticles, getCategory } from "@/lib/articles";

/**
 * Every article on the site renders through this one route. To publish a new
 * piece you add a data file under src/lib/articles/content/ and register it —
 * nothing here changes.
 */

/* Only non-draft articles are prerendered. `dynamicParams` stays on so a draft
   is still reachable by direct URL for review (rendered on demand, marked
   noindex below), while anything else 404s via notFound(). */
export const dynamicParams = true;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  const category = getCategory(article.category);
  const path = `/training/${article.slug}`;

  return {
    title: `${article.seoTitle} | Bedrock.fit`,
    description: article.description,
    keywords: article.tags,
    alternates: { canonical: path },
    // Drafts must never reach the index, even if someone shares the preview URL.
    robots: article.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: article.seoTitle,
      description: article.description,
      url: path,
      publishedTime: article.published,
      modifiedTime: article.updated,
      section: category.name,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.description,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Drafts included: getArticles() would hide them, and a preview URL should render.
  const article = getAllArticlesIncludingDrafts().find((a) => a.slug === slug);
  if (!article) notFound();

  return <ArticleLayout article={article} />;
}
