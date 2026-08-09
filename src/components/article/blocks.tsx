import Image from "next/image";
import Link from "next/link";
import type { Block } from "@/lib/articles/types";
import { archivo, btnGreen, kicker, mono, space } from "../LightFrame";
import { renderInline, stripInline } from "./inline";

/* ── typography ────────────────────────────────────────────────────────── */

const h2Style: React.CSSProperties = {
  font: `800 clamp(22px, 3vw, 29px)/1.2 ${archivo}`,
  letterSpacing: "-.01em",
  color: "var(--ink)",
  margin: "44px 0 14px",
  // clears the sticky nav when a table-of-contents link jumps here
  scrollMarginTop: 96,
  // stops a new section riding up alongside a wrapped figure from the section above
  clear: "both",
};
const h3Style: React.CSSProperties = { font: `800 17px ${archivo}`, color: "var(--ink)", margin: "26px 0 8px" };
const pStyle: React.CSSProperties = { font: `500 16.5px/1.78 ${space}`, color: "var(--body)", margin: "0 0 18px" };
const ledeStyle: React.CSSProperties = { ...pStyle, font: `500 19px/1.7 ${space}`, color: "var(--ink)" };

/** Stable, readable anchor for an h2 so deep links survive copy edits reasonably well. */
export function headingId(text: string): string {
  return stripInline(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/* ── figures ───────────────────────────────────────────────────────────── */

type ChartBlock = Extract<Block, { type: "chart" }>;

/**
 * Horizontal bar chart built from CSS, not SVG.
 *
 * A fixed-viewBox SVG scaled down to a 274px phone column renders its 12px
 * labels at roughly 6px. CSS bars keep text at its real size and let long
 * labels wrap and stack instead. Styles live in globals.css under `.bf-chart*`.
 */
export function BarChart({ title, sub, bars, max, unit = "%", source }: Omit<ChartBlock, "type">) {
  const label = `${title}. ${bars.map((b) => `${b.label}: ${b.display ?? b.value + unit}`).join("; ")}`;
  return (
    <figure style={{ margin: "26px 0 30px", background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 16, padding: "22px 22px 16px" }}>
      <figcaption style={{ marginBottom: 14 }}>
        <span style={kicker}>Figure</span>
        <h4 style={{ font: `800 16px ${archivo}`, color: "var(--ink)", margin: "6px 0 2px" }}>{title}</h4>
        {sub && <p style={{ font: `500 13px/1.55 ${space}`, color: "var(--muted)", margin: "0 0 8px" }}>{sub}</p>}
      </figcaption>
      <div className="bf-chart" role="img" aria-label={label}>
        {bars.map((b) => (
          <div className="bf-chart-row" key={b.label}>
            <div className="bf-chart-label">{b.label}</div>
            <div className="bf-chart-track">
              <div className="bf-chart-meter">
                {/* floor of 1.5% keeps a near-zero bar visible rather than invisible */}
                <div className={b.accent ? "bf-chart-bar is-accent" : "bf-chart-bar"} style={{ width: `${Math.max(1.5, (b.value / max) * 100)}%` }} />
              </div>
              <div className={b.accent ? "bf-chart-val is-accent" : "bf-chart-val"}>{b.display ?? `${b.value}${unit}`}</div>
            </div>
          </div>
        ))}
        <div className="bf-chart-axis" aria-hidden="true">
          <span>0</span>
          <span>{max}{unit}</span>
        </div>
      </div>
      <p style={{ font: `500 10.5px/1.5 ${mono}`, color: "var(--muted)", margin: "12px 0 0", letterSpacing: ".02em" }}>{source}</p>
    </figure>
  );
}

export function StatRow({ items }: { items: { big: string; label: string }[] }) {
  return (
    <div className="lp-stats" style={{ margin: "26px 0 30px" }}>
      {items.map((s) => (
        <div key={s.label} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
          <div style={{ font: `800 30px/1 ${archivo}`, color: "var(--green)" }}>{s.big}</div>
          <div style={{ font: `600 11.5px/1.45 ${space}`, color: "var(--muted)", marginTop: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "11px 14px",
  font: `700 11.5px ${space}`,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--muted)",
  borderBottom: "1px solid var(--line)",
};

export function DataTable({ caption, columns, rows, source }: Omit<Extract<Block, { type: "table" }>, "type">) {
  return (
    <>
      <div style={{ overflowX: "auto", margin: "22px 0 10px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <caption style={{ captionSide: "top", textAlign: "left", font: `700 12px ${mono}`, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--green-dark)", paddingBottom: 10 }}>
            {caption}
          </caption>
          <thead>
            <tr style={{ background: "var(--mint)" }}>
              {columns.map((c) => (
                <th key={c} style={thStyle}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  // first column is the row label; the rest are the values worth reading
                  <td
                    key={i}
                    style={{
                      padding: "10px 14px",
                      font: `${i === 0 ? 600 : 700} 14px ${space}`,
                      color: i === 0 ? "var(--ink)" : "var(--green-dark)",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source && <p style={{ font: `500 11.5px/1.6 ${mono}`, color: "var(--muted)", margin: "0 0 22px" }}>{source}</p>}
    </>
  );
}

/* ── media ─────────────────────────────────────────────────────────────── */

const captionStyle: React.CSSProperties = {
  font: `500 13px/1.6 ${space}`,
  color: "var(--muted)",
  margin: "10px 0 0",
};

/**
 * Image or diagram, either at the full reading measure or floated beside the text.
 *
 * `sizes` is capped at 760px because that is the widest the article column ever
 * gets — without it, next/image would serve a viewport-width source and waste
 * most of the bytes on a desktop screen. A wrapped figure occupies 42% of that
 * measure, so it declares 320px instead and drops to 100vw once the float is
 * disabled below 640px.
 *
 * The float itself lives in `.bf-fig-wrap` rather than inline styles: the mobile
 * override that unsets it needs a media query, which inline styles can't express.
 */
export function Figure({ src, alt, width, height, caption, credit, layout = "full" }: Omit<Extract<Block, { type: "figure" }>, "type">) {
  const wrapped = layout !== "full";
  return (
    <figure
      className={wrapped ? "bf-fig-wrap" : undefined}
      style={
        wrapped
          ? { float: layout === "wrap-left" ? "left" : "right", margin: layout === "wrap-left" ? "6px 26px 18px 0" : "6px 0 18px 26px" }
          : { margin: "28px 0 30px" }
      }
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={wrapped ? "(max-width: 640px) 100vw, 320px" : "(max-width: 800px) 100vw, 760px"}
        style={{ width: "100%", height: "auto", borderRadius: 14, border: "1px solid var(--line)", display: "block" }}
      />
      {(caption || credit) && (
        <figcaption style={captionStyle}>
          {caption && renderInline(caption)}
          {credit && (
            <span style={{ display: "block", font: `500 10.5px ${mono}`, color: "var(--muted)", marginTop: 6, letterSpacing: ".02em" }}>
              {credit}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * YouTube embed.
 *
 * `youtube-nocookie.com` is the privacy-enhanced host: no tracking cookie until
 * the reader actually plays it. `loading="lazy"` keeps the iframe out of the
 * initial request waterfall, which matters on a page that already carries four
 * charts. The wrapper holds a 16:9 box so nothing reflows when it arrives.
 */
export function VideoEmbed({ youtubeId, title, caption, start }: Omit<Extract<Block, { type: "video" }>, "type">) {
  const src = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0${start ? `&start=${start}` : ""}`;
  return (
    <figure style={{ margin: "28px 0 30px" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "var(--mint)" }}>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
      <figcaption style={captionStyle}>
        <span style={{ ...kicker, display: "block", marginBottom: 4 }}>Video</span>
        {caption ? renderInline(caption) : title}
      </figcaption>
    </figure>
  );
}

export function Callout({ title, text }: { title: string; text: string }) {
  return (
    <aside style={{ background: "var(--mint)", borderLeft: "3px solid var(--green)", borderRadius: "0 12px 12px 0", padding: "18px 20px", margin: "26px 0 28px" }}>
      <h4 style={{ font: `800 14px ${archivo}`, color: "var(--ink)", margin: "0 0 6px" }}>{title}</h4>
      <p style={{ font: `500 14.5px/1.7 ${space}`, color: "var(--body)", margin: 0 }}>{renderInline(text)}</p>
    </aside>
  );
}

export function PullQuote({ text, attribution }: { text: string; attribution?: string }) {
  return (
    <blockquote style={{ margin: "32px 0", padding: "0 0 0 22px", borderLeft: "3px solid var(--green-soft)" }}>
      <p style={{ font: `500 21px/1.5 ${archivo}`, color: "var(--ink)", margin: 0 }}>{renderInline(text)}</p>
      {attribution && <footer style={{ font: `600 12.5px ${mono}`, color: "var(--muted)", marginTop: 10, letterSpacing: ".04em" }}>— {attribution}</footer>}
    </blockquote>
  );
}

export function CtaCard({ title, text, label, href }: { title: string; text: string; label: string; href: string }) {
  return (
    <div style={{ background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 24px", margin: "34px 0 10px", textAlign: "center" }}>
      <h3 style={{ font: `800 19px ${archivo}`, color: "var(--ink)", margin: "0 0 8px" }}>{title}</h3>
      <p style={{ font: `500 14.5px/1.6 ${space}`, color: "var(--muted)", margin: "0 auto 18px", maxWidth: 460 }}>{text}</p>
      <Link href={href} style={{ ...btnGreen, padding: "14px 26px", font: `800 14px ${archivo}` }}>
        {label}
      </Link>
    </div>
  );
}

/* ── dispatcher ────────────────────────────────────────────────────────── */

/**
 * Renders one content block. The switch is exhaustive over the `Block` union —
 * adding a variant to types.ts without a case here is a compile error, which is
 * exactly the reminder you want.
 */
export function renderBlock(block: Block, key: number): React.ReactNode {
  switch (block.type) {
    case "lede":
      return <p key={key} style={ledeStyle}>{renderInline(block.text)}</p>;

    case "p":
      return <p key={key} style={pStyle}>{renderInline(block.text)}</p>;

    case "h2":
      return <h2 key={key} id={block.id ?? headingId(block.text)} style={h2Style}>{block.text}</h2>;

    case "h3":
      return <h3 key={key} style={h3Style}>{block.text}</h3>;

    case "chart":
      return <BarChart key={key} {...block} />;

    case "stats":
      return <StatRow key={key} items={block.items} />;

    case "table":
      return <DataTable key={key} {...block} />;

    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List key={key} style={{ ...pStyle, paddingLeft: 22, margin: "0 0 20px" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ marginBottom: 8 }}>{renderInline(item)}</li>
          ))}
        </List>
      );
    }

    case "figure":
      return <Figure key={key} {...block} />;

    case "video":
      return <VideoEmbed key={key} {...block} />;

    case "callout":
      return <Callout key={key} title={block.title} text={block.text} />;

    case "quote":
      return <PullQuote key={key} text={block.text} attribution={block.attribution} />;

    case "cta":
      return <CtaCard key={key} {...block} />;
  }
}
