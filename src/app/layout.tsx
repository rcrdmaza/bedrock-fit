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

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

// Brand fonts, matching the home-page bundle: Archivo (headings),
// Space Grotesk (body), JetBrains Mono (mono labels). Exposed as CSS
// variables and consumed by the legal/methodology pages via SiteFrame.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["700", "800", "900"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["400", "500", "700"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono-bf", subsets: ["latin"], weight: ["500", "700"] });

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
