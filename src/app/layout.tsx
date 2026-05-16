import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAppUrl } from "@/lib/env";
import { getBranding } from "@/lib/site-branding";
import ConsentInit from "./consent-init";
import CookieBanner from "./cookie-banner";
import SiteFooter from "./site-footer";

// Google AdSense publisher ID. The loader <script> below is what
// AdSense's verification crawler looks for to approve the account;
// ad units (`<ins class="adsbygoogle">`) get placed separately once
// approved.
const ADSENSE_CLIENT_ID = "ca-pub-4738526719801061";

// AdSense loader URL, rendered as a raw <script async src> in <head>.
// We deliberately do NOT use next/script: in Next 16 + React 19,
// next/script — regardless of strategy — replaces the literal tag
// with a runtime loader pattern (a <link rel="preload"> in head plus
// a `self.__next_s.push([url, …])` queue entry in body). The AdSense
// verification crawler greps raw HTML for a literal
// `<script ... src="…adsbygoogle.js?client=…">` in <head>, and it
// does not find that runtime form, which is why the AdSense "Verify"
// step kept failing with "We couldn't verify your site. Make sure
// the changes you made to your site are published and accessible by
// the Google AdSense crawler." Rendering it as a plain JSX <script>
// inside <head> emits it verbatim into the SSR HTML — exactly the
// shape the verifier expects.
const ADSENSE_LOADER_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// metadataBase fixes the resolution of relative og:image / canonical
// URLs across all pages — without it, OG previews break on absolute
// product surfaces. We pull it from the same env helper the magic-link
// issuer uses so dev/preview/production all stay consistent.
//
// We use `generateMetadata` (not a static `metadata` export) because
// the favicon is operator-uploadable from /admin/branding. The DB-
// backed data URL gets wired into `icons.icon` per request; when no
// upload exists, `icons` is omitted so Next.js's `app/favicon.ico`
// file convention takes over as the fallback. `updatedAt` rides
// along as a `?v=` cache-buster so a fresh upload doesn't sit
// behind a browser's long-lived favicon cache.
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    metadataBase: new URL(getAppUrl()),
    title: {
      default: "Bedrock.fit — Race results & training log for runners",
      template: "%s · Bedrock.fit",
    },
    description:
      "Search race results, claim your finishes, follow leaderboards, and log your daily training runs.",
    applicationName: "Bedrock.fit",
    openGraph: {
      type: "website",
      siteName: "Bedrock.fit",
      title: "Bedrock.fit — Race results & training log for runners",
      description:
        "Search race results, claim your finishes, follow leaderboards, and log your daily training runs.",
    },
    icons: branding.faviconDataUrl
      ? {
          // Data URLs are valid icon hrefs in every modern browser
          // (Chrome, Safari, Firefox). Bundling the favicon inline in
          // <link rel=icon> trades a few KB of HTML per request for not
          // needing a separate /api route or object storage — same
          // trade-off the avatar + event-photo paths make.
          icon: branding.faviconDataUrl,
        }
      : undefined,
    other: {
      // Standardized Ad Choices opt-out hint; harmless if no ad network
      // is loaded.
      referrer: "strict-origin-when-cross-origin",
      // Backup AdSense verification path. The `<script src=adsbygoogle.js>`
      // tag in <head> is the primary method; this meta tag is the second
      // method AdSense's verifier accepts. Publishing both means we're
      // covered regardless of which method is selected in the AdSense UI
      // and regardless of which the crawler happens to check first.
      "google-adsense-account": ADSENSE_CLIENT_ID,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*
        Explicit <head> so we can guarantee:
          1. The Consent Mode v2 default runs *first* (synchronous inline
             script, executes the moment the parser hits it).
          2. The AdSense loader is a raw `<script async src>` element —
             not a next/script — so the literal tag is present in the
             server-rendered HTML for AdSense's verification crawler.
        Order matters: adsbygoogle.js reads window.dataLayer / gtag
        consent state on boot, so the default must be in place before
        the async loader's download completes.
        Next.js's metadata API still injects its tags into this <head>
        — we're not replacing it, just adding to it.
      */}
      <head>
        <ConsentInit />
        <script
          async
          src={ADSENSE_LOADER_SRC}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
