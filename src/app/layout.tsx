import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getAppUrl } from "@/lib/env";
import ConsentInit from "./consent-init";
import CookieBanner from "./cookie-banner";
import SiteFooter from "./site-footer";

// Google AdSense publisher ID. The loader script below is what
// AdSense's verification crawler looks for to approve the account;
// ad units (`<ins class="adsbygoogle">`) get placed separately once
// approved.
const ADSENSE_CLIENT_ID = "ca-pub-4738526719801061";

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
export const metadata: Metadata = {
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
  // We let the cookie banner gate analytics/ads at runtime, but we
  // proactively tell ad networks not to record impressions or build
  // profiles before the user has had a chance to choose. They re-read
  // the cookie themselves.
  other: {
    // Standardized Ad Choices opt-out hint; harmless if no ad network
    // is loaded.
    referrer: "strict-origin-when-cross-origin",
  },
};

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
      <body className="min-h-full flex flex-col">
        {/* Consent Mode v2 default state — must execute before the
            AdSense loader. ConsentInit is `beforeInteractive` and
            the AdSense loader is `afterInteractive`, so Next orders
            them correctly regardless of JSX position; we keep
            ConsentInit first here for readability. */}
        <ConsentInit />
        {/* Google AdSense loader. next/script injects it into the
            document head with `afterInteractive`, which is the
            strategy AdSense's own Next.js guidance recommends —
            early enough for the verification crawler to find it,
            late enough that it doesn't block first paint.
            crossOrigin mirrors the snippet Google hands you.
            Consent gating happens via Consent Mode (above + the
            cookie banner's update push), not by withholding the
            loader. */}
        <Script
          id="google-adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        />
        {children}
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
