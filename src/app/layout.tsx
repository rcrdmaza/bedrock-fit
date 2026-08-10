import type { Metadata } from "next";
import { Geist, Archivo, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Google AdSense publisher ID (carried over from the previous site — the
// account is already approved). The raw <script> loader below is what the
// AdSense crawler greps <head> for; the `google-adsense-account` meta tag
// is the backup verification method. Ad units get placed in the page.
const ADSENSE_CLIENT_ID = "ca-pub-4738526719801061";
const ADSENSE_LOADER_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bedrock.fit";

// GA4 measurement ID for the bedrock.fit property (account 404040503,
// property 549144058, stream "bedrock.fit-web"). Hardcoded default matching
// the ADSENSE_CLIENT_ID pattern above, so production still reports if the env
// var is never set in Vercel; override per-environment with NEXT_PUBLIC_GA_ID.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-ES80M9ZLC4";

// Only report from real production builds, so local `next dev` doesn't
// pollute the property with localhost sessions.
const GA_ENABLED = process.env.NODE_ENV === "production";

/*
 * Every font here is `display: "optional"`, which is a deliberate trade and the
 * reasoning is worth keeping.
 *
 * /training measured CLS 0.24 on mobile against a 0.1 threshold, with the whole
 * 0.240 attributed to `body` rather than to any child element. That shape means
 * everything moved at once, which on a fully prerendered page with no images
 * leaves font swap as the only real candidate.
 *
 * next/font already generates a metric-adjusted fallback per family, and those
 * are correct: measured at a 376px column, "Space Grotesk Fallback" renders to
 * exactly the same height as the real face. But every one of those fallbacks is
 * declared `src: local("Arial")`. If Arial is not present and fontconfig does
 * not alias it, the adjusted fallback silently does nothing and the chain drops
 * to plain `sans-serif` — which measured **25px taller** for the same
 * paragraph. Then the real font arrives and the page snaps up. That is the
 * whole-body shift, and it explains why it appears in a headless Linux
 * Lighthouse run and not on a Mac, where the shift measures zero.
 *
 * `swap` is what allows that snap. `optional` removes it: the browser gives the
 * font about 100ms, and if it is not ready it renders the fallback and **does
 * not swap for that page view**. Font-driven layout shift stops being possible
 * rather than becoming unlikely, and it no longer depends on whether a given
 * machine happens to have Arial.
 *
 * The cost is real and worth stating plainly: a first-time visitor on a slow
 * connection may read one page view in the fallback face instead of the brand
 * one. Returning visitors always get the real fonts from cache. CLS is a
 * ranking signal and typography fidelity on a first cold load is not, so this
 * is the right way round, but it is a trade rather than a free win.
 */
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "optional" });

// Brand fonts, matching the home-page bundle: Archivo (headings),
// Space Grotesk (body), JetBrains Mono (mono labels). Exposed as CSS
// variables and consumed by the legal/methodology pages via SiteFrame.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["700", "800", "900"], display: "optional" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["400", "500", "700"], display: "optional" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono-bf", subsets: ["latin"], weight: ["500", "700"], display: "optional" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bedrock.fit | Free Strength Calculator & Athletic Potential Scan",
  description:
    "Free strength calculator: enter one lift to estimate your 1-rep max, rank against global strength standards, get training zones, and reveal your athlete archetype. No signup.",
  applicationName: "Bedrock.fit",
  keywords: [
    "strength calculator",
    "1RM calculator",
    "one rep max",
    "strength standards",
    "athletic potential",
    "training zones",
  ],
  openGraph: {
    type: "website",
    siteName: "Bedrock.fit",
    url: SITE_URL,
    title: "Bedrock.fit | Free Strength Calculator & Athletic Potential Scan",
    description:
      "Estimate your 1-rep max, strength level, training zones, and athlete archetype from a single lift. Free, no signup.",
  },
  twitter: {
    card: "summary",
    title: "Bedrock.fit | Free Strength Calculator",
    description:
      "Estimate your 1-rep max, strength level, and athlete archetype from a single lift. Free, no signup.",
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${archivo.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Raw AdSense loader — emitted verbatim into SSR HTML so the
            AdSense verification crawler finds the literal tag. Do NOT
            swap this for next/script. */}
        <script async src={ADSENSE_LOADER_SRC} crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
      {/* GA4 (gtag.js) via next/script — App Router docs place Script as a
          sibling of <body> inside <html>. Default strategy is
          `afterInteractive`, stated explicitly here for clarity. The inline
          companion needs an `id` so Next can track it. */}
      {GA_ENABLED && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
    </html>
  );
}
