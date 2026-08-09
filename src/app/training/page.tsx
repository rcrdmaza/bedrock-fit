import type { Metadata } from "next";
import Link from "next/link";
import { LightPage, archivo, kicker, mono, space, wrap } from "@/components/LightFrame";
import { CATEGORIES, getArticles, getCategoriesWithArticles, getCategory } from "@/lib/articles";
import type { Article } from "@/lib/articles/types";

/**
 * /training — the article index.
 *
 * Until 2026-08-08 this route *was* the leg-strength article; it now lives at
 * /training/leg-strength. No redirect: /training is a real page with its own
 * content, and 301-ing it would make the index unreachable. The article had been
 * live four days, so there is nothing meaningful to preserve — the index links
 * to it prominently and the sitemap carries both URLs.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bedrock.fit";

const INDEX_DESCRIPTION =
  "Long-form, footnoted articles on strength training, endurance, training over 40, and mobility. Every figure sourced to primary research or public health guidance.";

export const metadata: Metadata = {
  title: "Training — Evidence-Based Strength & Endurance Articles | Bedrock.fit",
  description: INDEX_DESCRIPTION,
  alternates: { canonical: "/training" },
  openGraph: {
    type: "website",
    title: "Training — Evidence-Based Strength & Endurance Articles",
    description:
      "Long-form, footnoted articles on strength, endurance, training over 40, and mobility. Every figure sourced.",
    url: "/training",
  },
};

/* ── card ──────────────────────────────────────────────────────────────── */

function ArticleCard({ article, feature = false }: { article: Article; feature?: boolean }) {
  const category = getCategory(article.category);
  return (
    <Link
      href={`/training/${article.slug}`}
      style={{
        display: "block",
        background: feature ? "var(--mint)" : "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: feature ? "26px 26px" : "20px 22px",
        textDecoration: "none",
        height: "100%",
      }}
    >
      <span style={{ ...kicker, display: "block" }}>
        {category.short}
        {article.topic ? ` · ${article.topic}` : ""}
      </span>
      <h3 style={{ font: `800 ${feature ? 26 : 19}px/1.2 ${archivo}`, color: "var(--ink)", margin: "10px 0 8px", letterSpacing: "-.01em" }}>
        {article.title}
      </h3>
      <p style={{ font: `500 ${feature ? 15.5 : 14.5}px/1.65 ${space}`, color: "var(--muted)", margin: "0 0 14px" }}>{article.dek}</p>
      <span style={{ font: `500 11px ${mono}`, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>
        ~{article.readingMinutes} min · {article.sources.length} sources
      </span>
    </Link>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function TrainingIndexPage() {
  const articles = getArticles();
  const featured = articles.filter((a) => a.featured);
  const sections = getCategoriesWithArticles();

  /* A Blog + ItemList tells crawlers this is a hub and enumerates its posts,
     which is what earns the sitelinks under the /training result. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Bedrock.fit Training",
    description: INDEX_DESCRIPTION,
    url: `${SITE_URL}/training`,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Bedrock.fit", url: SITE_URL },
    blogPost: articles.map((a) => ({
      "@type": "BlogPosting",
      headline: a.seoTitle,
      description: a.description,
      url: `${SITE_URL}/training/${a.slug}`,
      datePublished: a.published,
      dateModified: a.updated,
      articleSection: getCategory(a.category).name,
    })),
  };

  return (
    <LightPage active="training">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── header ── */}
      <section style={{ background: "radial-gradient(1100px 480px at 50% -90px, var(--mint2), var(--paper) 75%)", padding: "60px 0 40px", textAlign: "center" }}>
        <div style={{ ...wrap, maxWidth: 860 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-soft)", color: "var(--green-dark)", borderRadius: 999, padding: "7px 16px", font: `700 12px ${space}`, letterSpacing: ".02em" }}>
            Bedrock.fit editorial
          </span>
          <h1 style={{ font: `800 clamp(34px, 5.6vw, 58px)/1.06 ${archivo}`, letterSpacing: "-.015em", color: "var(--ink)", margin: "22px auto 0", maxWidth: 780 }}>
            Training, <span style={{ color: "var(--green)" }}>with the receipts</span>
          </h1>
          <p style={{ font: `500 17.5px/1.65 ${space}`, color: "var(--muted)", maxWidth: 620, margin: "18px auto 0" }}>
            Long-form articles on getting and staying strong. Every number is footnoted to primary research or public
            health guidance — no citation, no claim.
          </p>
        </div>
      </section>

      {/* ── category jump row ── */}
      <nav aria-label="Categories" style={{ ...wrap, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, paddingBottom: 8 }}>
        {CATEGORIES.map((c) => (
          <a
            key={c.slug}
            href={`#${c.slug}`}
            style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 16px", font: `600 13px ${space}`, color: "var(--body)", textDecoration: "none" }}
          >
            {c.name}
          </a>
        ))}
      </nav>

      <main style={{ ...wrap, paddingTop: 34 }}>
        {/* ── featured ── */}
        {featured.length > 0 && (
          <section aria-labelledby="featured-heading" style={{ marginBottom: 46 }}>
            <h2 id="featured-heading" style={{ ...kicker, color: "var(--muted)", margin: "0 0 14px" }}>
              Start here
            </h2>
            <div className="lp-feats" style={{ gridTemplateColumns: featured.length === 1 ? "1fr" : undefined }}>
              {featured.map((a) => (
                <ArticleCard key={a.slug} article={a} feature />
              ))}
            </div>
          </section>
        )}

        {/* ── by category ── */}
        {sections.map(({ category, articles: inCategory }) => (
          <section key={category.slug} id={category.slug} aria-labelledby={`${category.slug}-heading`} style={{ marginBottom: 46, scrollMarginTop: 96 }}>
            <h2 id={`${category.slug}-heading`} style={{ font: `800 clamp(22px, 3vw, 28px)/1.2 ${archivo}`, color: "var(--ink)", margin: "0 0 6px", letterSpacing: "-.01em" }}>
              {category.name}
            </h2>
            <p style={{ font: `500 15px/1.7 ${space}`, color: "var(--muted)", margin: "0 0 18px", maxWidth: 680 }}>{category.description}</p>

            {inCategory.length > 0 ? (
              <div className="lp-feats">
                {inCategory.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            ) : (
              /* An empty section is a promise, not a bug — it tells readers and
                 crawlers what this hub is going to cover. */
              <p style={{ font: `500 14px/1.6 ${space}`, color: "var(--muted)", background: "var(--mint)", border: "1px dashed var(--line)", borderRadius: 14, padding: "18px 20px", margin: 0 }}>
                Nothing published here yet. First up: {category.covers.slice(0, 3).join(", ")}.
              </p>
            )}
          </section>
        ))}

        {/* ── CTA ── */}
        <section style={{ background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 18, padding: "34px 26px", textAlign: "center", margin: "10px 0 6px" }}>
          <h2 style={{ font: `800 24px ${archivo}`, color: "var(--ink)", margin: "0 0 8px" }}>Where do you actually stand?</h2>
          <p style={{ font: `500 15px/1.65 ${space}`, color: "var(--muted)", margin: "0 auto 20px", maxWidth: 480 }}>
            Enter one squat, bench or deadlift set and get an estimated 1-rep max, your strength tier, and training
            zones — free, no signup.
          </p>
          <Link href="/" style={{ display: "inline-block", background: "var(--green)", color: "#fff", borderRadius: 12, padding: "14px 28px", font: `800 14px ${archivo}`, textDecoration: "none" }}>
            Get my strength scan →
          </Link>
        </section>
      </main>
    </LightPage>
  );
}
