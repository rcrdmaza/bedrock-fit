import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAppUrl } from "@/lib/env";
import CookieBanner from "./cookie-banner";
import SiteFooter from "./site-footer";

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
        {children}
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
