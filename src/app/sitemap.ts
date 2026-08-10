import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bedrock.fit";

/*
 * Hardcoded rather than `new Date()`, because these pages state their own date
 * on the page itself and it must not disagree with the sitemap. Using build
 * time would claim they changed on every deploy, which is false and teaches
 * crawlers to distrust `lastModified` across the whole site.
 *
 * Keep in sync with the dates rendered in the pages themselves:
 *   src/app/methodology/page.tsx — "last updated July 3, 2026"
 *   src/app/privacy/page.tsx     — "Effective date — July 3, 2026"
 */
const METHODOLOGY_UPDATED = "2026-07-03";
const PRIVACY_UPDATED = "2026-07-03";
const TERMS_UPDATED = "2026-08-09";
const CONTACT_UPDATED = "2026-08-09";
const ABOUT_UPDATED = "2026-08-10";

/**
 * Articles come from the registry, so publishing one adds it here automatically.
 * Drafts are excluded — `getArticles()` filters them out of production builds.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/training`,
      // The hub changes whenever its newest article does.
      lastModified: articles[0] ? new Date(articles[0].updated) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...articles.map((a) => ({
      url: `${SITE_URL}/training/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    /*
     * About sits highest of the supporting pages. It is reachable only through
     * a footer link, so the sitemap is realistically the sole route a crawler
     * has to it, and it is the page that answers "who is telling me this",
     * which carries real weight on health content.
     */
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(ABOUT_UPDATED),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    /*
     * Methodology and privacy. Low priority because they're supporting pages,
     * not what anyone arrives for — but they must be listed. They're reachable
     * only through a 12px footer link, so the sitemap is realistically the sole
     * route a crawler has to them, and they're the two pages an AdSense reviewer
     * looks for first. `yearly` because the content genuinely doesn't move;
     * claiming otherwise wastes crawl budget on pages that never change.
     */
    {
      url: `${SITE_URL}/methodology`,
      lastModified: new Date(METHODOLOGY_UPDATED),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(PRIVACY_UPDATED),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(TERMS_UPDATED),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    /*
     * Contact sits above the other supporting pages because it is the one a
     * reader might actually go looking for, and because ad-network reviewers
     * treat a reachable contact route as an ownership signal.
     */
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(CONTACT_UPDATED),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
