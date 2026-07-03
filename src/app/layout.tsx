import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Google AdSense publisher ID (carried over from the previous site — the
// account is already approved). The raw <script> loader below is what the
// AdSense crawler greps <head> for; the `google-adsense-account` meta tag
// is the backup verification method. Ad units get placed in the page.
const ADSENSE_CLIENT_ID = "ca-pub-4738526719801061";
const ADSENSE_LOADER_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bedrock.fit";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bedrock.fit — What's Your Athletic Potential?",
  description:
    "Enter your stats and one lift to estimate your true strength ceiling, training zones, and the athlete you're built to become. Free strength standards calculator.",
  applicationName: "Bedrock.fit",
  openGraph: {
    type: "website",
    siteName: "Bedrock.fit",
    title: "What's Your Athletic Potential? — Bedrock.fit",
    description:
      "Estimate your 1-rep max, strength level, and playful athlete archetype from a single lift.",
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <head>
        {/* Raw AdSense loader — emitted verbatim into SSR HTML so the
            AdSense verification crawler finds the literal tag. Do NOT
            swap this for next/script. */}
        <script async src={ADSENSE_LOADER_SRC} crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
