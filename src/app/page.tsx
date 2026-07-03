import type { Metadata } from "next";

// The home page is the self-contained "STRENGTH_SCAN" bundle exported from
// the design tool. It ships its own runtime, styles, and fonts as a single
// HTML document (public/strength-scan.html), so we render it full-viewport
// inside an iframe. This keeps the layout's AdSense loader + SEO metadata in
// the SSR <head> (crawler-visible) while displaying the design exactly as
// authored, with no globals.css bleed. The previous React calculator is kept
// at src/app/_previous-page.tsx.bak.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <iframe
      src="/strength-scan.html"
      title="Bedrock.fit — Strength Scan"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
      }}
    />
  );
}
