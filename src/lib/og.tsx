import { ImageResponse } from "next/og";

/**
 * Shared social-card renderer for every `opengraph-image` route.
 *
 * Satori (what `next/og` renders with) only supports a flexbox subset of CSS and
 * requires `display: flex` on anything with children — hence the explicit
 * `display: "flex"` on nodes that look like they wouldn't need it.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];

/**
 * Satori can't read the next/font bundle, so pull Archivo straight from Google
 * at build time. Ask with an ancient UA: the css2 endpoint only hands back a
 * TTF (which Satori can parse) to clients it thinks can't do woff2.
 * Any failure returns null and we fall back to the built-in font rather than
 * breaking the build.
 */
async function archivoWeight(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.20.25" },
    }).then((r) => (r.ok ? r.text() : ""));
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function loadArchivo(): Promise<Fonts> {
  const [bold, extrabold] = await Promise.all([archivoWeight(700), archivoWeight(800)]);
  const fonts = [
    bold && { name: "Archivo", data: bold, style: "normal" as const, weight: 700 as const },
    extrabold && { name: "Archivo", data: extrabold, style: "normal" as const, weight: 800 as const },
  ].filter(Boolean) as Fonts;
  return fonts && fonts.length ? fonts : undefined;
}

export type OgCard = {
  /** Pill next to the wordmark, e.g. "OVER 40 · LOWER BODY". Rendered uppercase. */
  eyebrow: string;
  /** Headline. `accent` must be a trailing fragment of it to be greened. */
  title: string;
  accent?: string;
  /** One line under the headline. */
  dek: string;
  /** Up to three number/label pairs along the bottom. */
  stats?: [string, string][];
};

export async function renderOgCard({ eyebrow, title, accent, dek, stats = [] }: OgCard) {
  const fonts = await loadArchivo();
  const family = fonts ? "Archivo" : "sans-serif";

  const useAccent = accent && title.endsWith(accent) ? accent : undefined;
  const head = useAccent ? title.slice(0, title.length - useAccent.length) : title;

  // Long headlines need to come down or they overflow the 1200×630 frame.
  const titleSize = title.length > 34 ? 76 : title.length > 22 ? 92 : 108;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1B1E21",
          backgroundImage: "radial-gradient(900px 460px at 12% -10%, #26312a 0%, #1B1E21 62%)",
          padding: "64px 72px",
          fontFamily: family,
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="62" height="62" viewBox="0 0 120 120">
            <rect x="0" y="0" width="120" height="120" rx="26" fill="#26292D" />
            <g transform="translate(13.2 13.2) scale(0.78)">
              <rect x="28" y="90" width="64" height="11" rx="5.5" fill="#F2F4EF" />
              <path d="M32 74 L60 52 L88 74" fill="none" stroke="#F2F4EF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 52 L60 30 L88 52" fill="none" stroke="#A8E063" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#F2F4EF", letterSpacing: "-0.01em" }}>
            bedrock<span style={{ color: "#A8E063" }}>.fit</span>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 12,
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(168,224,99,.14)",
              border: "1px solid rgba(168,224,99,.32)",
              color: "#A8E063",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            {eyebrow.toUpperCase()}
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, color: "#F2F4EF", letterSpacing: "-0.03em", lineHeight: 1.02 }}>
            {head}
            {useAccent && <span style={{ color: "#7FD05A" }}>{useAccent}</span>}
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 31, fontWeight: 700, color: "rgba(242,244,239,.62)", lineHeight: 1.35, maxWidth: 1010 }}>
            {dek}
          </div>
        </div>

        {/* stat strip — the numbers the piece turns on */}
        <div style={{ display: "flex", alignItems: "center", gap: 46 }}>
          {stats.map(([big, small]) => (
            <div key={big} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#7FD05A" }}>{big}</div>
              <div style={{ display: "flex", marginTop: 4, fontSize: 20, fontWeight: 700, color: "rgba(242,244,239,.45)" }}>{small}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
