import Link from "next/link";
import type { Article } from "@/lib/articles/types";
import { getCategory } from "@/lib/articles/categories";
import { getRelatedArticles } from "@/lib/articles";
import { LightPage, archivo, measure, mono, space, wrap } from "../LightFrame";
import { renderBlock } from "./blocks";
import { stripInline } from "./inline";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bedrock.fit";

/** Used unless an article overrides it. Matches the tone of /methodology. */
export const DEFAULT_DISCLAIMER =
  "This article is for general fitness and educational purposes only and is not medical or training advice. " +
  "Figures cited are population-level associations and do not predict individual outcomes. Consult a qualified " +
  "professional before beginning or changing an exercise program, particularly if you have existing health " +
  "conditions or joint problems.";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-08-04" → "August 2026". Parsed by hand: `new Date("2026-08-04")` is UTC and can render as July in a negative offset. */
function monthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * Renders a complete article from its data: eyebrow, headline, byline, body
 * blocks, numbered sources, disclaimer, related links and Article JSON-LD.
 *
 * Every page under /training/[slug] goes through here, so anything that should
 * be true of all articles — the sticky nav offset on footnote targets, the
 * `nofollow` on outbound citations, the schema shape — is fixed in one place.
 */
export function ArticleLayout({ article }: { article: Article }) {
  const category = getCategory(article.category);
  const related = getRelatedArticles(article.slug);
  const url = `${SITE_URL}/training/${article.slug}`;

  // Split the accent fragment off the end of the title so it can be greened.
  const accent = article.titleAccent && article.title.endsWith(article.titleAccent) ? article.titleAccent : undefined;
  const titleHead = accent ? article.title.slice(0, article.title.length - accent.length) : article.title;

  /* Every figure, as an ImageObject. Without this the Article schema forfeits
     the image-rich result entirely. Omitted rather than emitted empty for the
     articles that run on charts alone — `image: []` asserts "no images exist"
     where saying nothing is the honest signal. */
  const images = article.blocks
    .filter((b) => b.type === "figure")
    .map((b) => ({
      "@type": "ImageObject",
      url: `${SITE_URL}${b.src}`,
      width: b.width,
      height: b.height,
      caption: stripInline(b.alt),
      ...(b.credit ? { creditText: b.credit } : {}),
      ...(b.license ? { license: b.license } : {}),
      ...(b.sourceUrl ? { acquireLicensePage: b.sourceUrl } : {}),
    }));

  /* `citation` carries the source list through to crawlers, which is the whole
     point of a footnoted piece. `wordCount` is declared, not computed. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle,
    description: article.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: article.published,
    dateModified: article.updated,
    inLanguage: "en",
    articleSection: category.name,
    keywords: article.tags?.join(", "),
    wordCount: article.wordCount,
    author: { "@type": "Organization", name: "Bedrock.fit", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Bedrock.fit",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    citation: article.sources.map((s) => ({ "@type": "CreativeWork", name: stripInline(s.text), url: s.url })),
    ...(images.length ? { image: images } : {}),
  };

  return (
    <LightPage active="training">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── header ── */}
      <section style={{ background: "radial-gradient(1100px 480px at 50% -90px, var(--mint2), var(--paper) 75%)", padding: "60px 0 34px", textAlign: "center" }}>
        <div style={{ ...wrap, maxWidth: 860 }}>
          <Link
            href={`/training#${category.slug}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-soft)", color: "var(--green-dark)",
              borderRadius: 999, padding: "7px 16px", font: `700 12px ${space}`, letterSpacing: ".02em", textDecoration: "none",
            }}
          >
            {category.short}
            {article.topic ? ` · ${article.topic}` : ""}
          </Link>

          <h1 style={{ font: `800 clamp(34px, 5.6vw, 60px)/1.06 ${archivo}`, letterSpacing: "-.015em", color: "var(--ink)", margin: "22px auto 0", maxWidth: 820 }}>
            {titleHead}
            {accent && <span style={{ color: "var(--green)" }}>{accent}</span>}
          </h1>

          <p style={{ font: `500 17.5px/1.65 ${space}`, color: "var(--muted)", maxWidth: 660, margin: "18px auto 0" }}>{article.dek}</p>

          <p style={{ font: `500 11.5px ${mono}`, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 20 }}>
            Bedrock.fit editorial · ~{article.readingMinutes} min read · Updated {monthYear(article.updated)}
          </p>

          {article.draft && (
            <p style={{ font: `700 11.5px ${mono}`, color: "#b4531f", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 12 }}>
              Draft — not indexed, not linked from the index
            </p>
          )}
        </div>
      </section>

      {/* ── body ── */}
      <main style={{ ...measure, paddingBottom: 10 }}>
        {article.blocks.map(renderBlock)}

        {/* ── sources ── */}
        <section aria-labelledby="sources-heading" style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
          <h2 id="sources-heading" style={{ font: `700 11px ${mono}`, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 12px" }}>
            Sources
          </h2>
          <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
            {article.sources.map((s) => (
              // scrollMarginTop clears the sticky nav so a [n] jump doesn't land under it
              <li key={s.n} id={`source-${s.n}`} style={{ font: `400 11.5px/1.7 ${space}`, color: "var(--muted)", marginBottom: 7, scrollMarginTop: 96 }}>
                {/* The title is the link. A trailing "Link" was a second thing to
                    aim at for no benefit, and it read as boilerplate repeated ten
                    times down the page. */}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: "var(--green-dark)", textDecoration: "underline", wordBreak: "break-word" }}
                >
                  {s.text}
                </a>
              </li>
            ))}
          </ol>
          <p style={{ font: `400 11px/1.7 ${space}`, color: "var(--muted)", margin: "16px 0 0", fontStyle: "italic" }}>
            {article.disclaimer ?? DEFAULT_DISCLAIMER}
          </p>
        </section>

        {/* ── related ── */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
            <h2 id="related-heading" style={{ font: `700 11px ${mono}`, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px" }}>
              Keep reading
            </h2>
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/training/${r.slug}`}
                style={{ display: "block", padding: "14px 16px", marginBottom: 8, background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 12, textDecoration: "none" }}
              >
                <span style={{ font: `700 10.5px ${mono}`, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green-dark)" }}>
                  {getCategory(r.category).name}
                </span>
                <span style={{ display: "block", font: `800 16px ${archivo}`, color: "var(--ink)", margin: "5px 0 3px" }}>{r.title}</span>
                <span style={{ display: "block", font: `500 13.5px/1.55 ${space}`, color: "var(--muted)" }}>{r.dek}</span>
              </Link>
            ))}
          </section>
        )}
      </main>
    </LightPage>
  );
}
