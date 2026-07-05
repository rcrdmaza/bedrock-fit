"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

/* A single, still (non-animated) frame of matrix rain, drawn once on mount.
   Purely decorative background — the readable document text stays black/white. */
function MatrixStill() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const parent = c?.parentElement;
    if (!c || !parent) return;
    const w = (c.width = parent.offsetWidth);
    const h = (c.height = parent.offsetHeight);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const chars =
      "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾉ0123456789ABCDEFZ".split("");
    const font = 14;
    ctx.font = `${font}px monospace`;
    const cols = Math.floor(w / font);
    for (let i = 0; i < cols; i++) {
      const len = 3 + Math.floor(Math.random() * 18);
      const startY = Math.floor(Math.random() * (h / font));
      for (let j = 0; j < len; j++) {
        const y = (startY - j) * font;
        if (y < 0) break;
        const op = Math.max(0, 1 - j / len) * 0.3;
        ctx.fillStyle = `rgba(77,255,77,${op.toFixed(3)})`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * font, y);
      }
    }
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.26 }}
    />
  );
}

export default function SiteFrame({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#050705",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-space), sans-serif",
      }}
    >
      <MatrixStill />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 18px 28px",
        }}
      >
        {/* Header — creative neon chrome */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 20px",
            marginTop: 18,
            background: "#0a0f0a",
            border: "1px solid rgba(77,255,77,.18)",
            borderRadius: 14,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <svg width="22" height="24" viewBox="0 0 26 28" aria-hidden="true">
              <polygon points="13,1 25,7.5 25,20.5 13,27 1,20.5 1,7.5" fill="none" stroke="#4dff4d" strokeWidth="2" />
              <polygon points="13,8 19,18 7,18" fill="#4dff4d" />
            </svg>
            <span style={{ fontFamily: "var(--font-archivo), sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>
              BEDROCK<span style={{ color: "#4dff4d" }}>.FIT</span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono-bf), monospace",
                fontWeight: 700,
                fontSize: 11,
                color: "#5f7a5f",
                letterSpacing: ".14em",
                marginLeft: 6,
              }}
            >
              {tag}
            </span>
          </Link>
          <Link
            href="/"
            style={{ fontFamily: "var(--font-mono-bf), monospace", fontSize: 11, fontWeight: 700, color: "#4dff4d", textDecoration: "none" }}
          >
            ← BACK
          </Link>
        </header>

        {/* Document — professional black-on-white */}
        <main className="bf-doc">{children}</main>

        {/* Footer — creative neon chrome, 12px links */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(77,255,77,.18)",
          }}
        >
          <Link href="/privacy" className="bf-foot-link">Privacy</Link>
          <Link href="/methodology" className="bf-foot-link">Methodology</Link>
          <Link href="/" className="bf-foot-link">Home</Link>
          <span style={{ fontFamily: "var(--font-mono-bf), monospace", fontSize: 12, color: "#5f7a5f" }}>
            © {new Date().getFullYear()} Bedrock.fit
          </span>
        </footer>
      </div>
    </div>
  );
}
