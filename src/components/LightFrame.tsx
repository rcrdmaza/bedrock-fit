import Link from "next/link";

/**
 * Shared chrome for the light (involve.me-style) theme: palette, type tokens,
 * logo, sticky nav and footer.
 *
 * The home page still carries its own inlined copy of all of this — it is a
 * 40 KB client component with a scan modal wired through it, and refactoring it
 * is a separate job. Everything else on the light theme (/training and every
 * article) renders through here, so a nav change is one edit, not N.
 *
 * The dark neon theme lives in SiteFrame.tsx and is used by /methodology and
 * /privacy.
 */

/* ── palette ───────────────────────────────────────────────────────────── */

export const lightVars = {
  "--paper": "#ffffff",
  "--mint": "#f1f8f3",
  "--mint2": "#e3f2e8",
  "--line": "#e2eae4",
  "--ink": "#272c27",
  "--body": "#414941",
  "--muted": "#6b756c",
  "--green": "#2f9e5f",
  "--green-dark": "#227a48",
  "--green-soft": "#cdecd8",
  "--charcoal": "#272c27",
} as React.CSSProperties;

/* ── type tokens ───────────────────────────────────────────────────────── */

export const archivo = "var(--font-archivo), sans-serif";
export const space = "var(--font-space), sans-serif";
export const mono = "var(--font-mono-bf), monospace";

/* ── layout tokens ─────────────────────────────────────────────────────── */

/** Full-width content container. */
export const wrap: React.CSSProperties = { width: "100%", maxWidth: 1120, margin: "0 auto", padding: "0 20px" };
/** Reading measure for long-form body copy. */
export const measure: React.CSSProperties = { width: "100%", maxWidth: 760, margin: "0 auto", padding: "0 20px" };

export const btnGreen: React.CSSProperties = {
  display: "inline-block",
  background: "var(--green)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "10px 18px",
  font: `800 13px ${archivo}`,
  letterSpacing: ".02em",
  cursor: "pointer",
  textDecoration: "none",
};

export const kicker: React.CSSProperties = {
  font: `700 11px ${mono}`,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  color: "var(--green-dark)",
};

/* ── logo ──────────────────────────────────────────────────────────────── */

/**
 * The "Ascend" mark. `idSuffix` namespaces the gradient def: SVG ids are global
 * to the document, and this logo renders twice per page (nav + footer). The
 * home page uses `bfTileH` / `bfTileF`, so anything prefixed `bfLF` is safe.
 */
export function Logo({ light = false, idSuffix = "n" }: { light?: boolean; idSuffix?: string }) {
  const gradientId = `bfLF-${idSuffix}`;
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <svg width="32" height="32" viewBox="0 0 120 120" aria-hidden="true" style={{ flex: "none" }}>
        <defs>
          <radialGradient id={gradientId} cx="30%" cy="20%" r="120%">
            <stop offset="0%" stopColor="#26292D" />
            <stop offset="70%" stopColor="#1B1E21" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="120" height="120" rx="26" fill={`url(#${gradientId})`} />
        <g transform="translate(13.2 13.2) scale(0.78)">
          <rect x="28" y="90" width="64" height="11" rx="5.5" fill="#F2F4EF" />
          <path d="M32 74 L60 52 L88 74" fill="none" stroke="#F2F4EF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 52 L60 30 L88 52" fill="none" stroke="#A8E063" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <span style={{ font: `800 17px ${archivo}`, color: light ? "#F2F4EF" : "#1E2124" }}>
        bedrock<span style={{ color: light ? "#A8E063" : "#7FBF3A" }}>.fit</span>
      </span>
    </Link>
  );
}

/* ── nav ───────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "/#features", label: "Features", key: "features" },
  { href: "/#archetypes", label: "Archetypes", key: "archetypes" },
  { href: "/training", label: "Training", key: "training" },
  { href: "/methodology", label: "Methodology", key: "methodology" },
];

/**
 * Sticky header. Under 820px the link row wraps to its own scrollable line —
 * see the `.lp-nav-links` media query in globals.css. `flexWrap` on the inner
 * container is what lets it wrap, so it stays inline here.
 */
export function LightNav({ active }: { active?: string }) {
  return (
    <header
      className="lp-nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(255,255,255,.9)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ ...wrap, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "14px 20px" }}>
        <Logo idSuffix="nav" />
        <nav className="lp-nav-links" aria-label="Main">
          {NAV_LINKS.map((l) => {
            const on = l.key === active;
            return (
              <Link
                key={l.key}
                href={l.href}
                aria-current={on ? "page" : undefined}
                style={{ font: `${on ? 700 : 600} 14px ${space}`, color: on ? "var(--green-dark)" : "var(--body)", textDecoration: "none" }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="lp-nav-cta" style={btnGreen}>
          Get my strength scan
        </Link>
      </div>
    </header>
  );
}

/* ── footer ────────────────────────────────────────────────────────────── */

export function LightFooter() {
  return (
    <footer style={{ background: "var(--charcoal)", padding: "48px 0 32px", marginTop: 52 }}>
      <div style={wrap}>
        <div className="lp-footer-cols">
          <div>
            <Logo light idSuffix="foot" />
            <p style={{ font: `500 13px/1.6 ${space}`, color: "rgba(255,255,255,.55)", margin: "14px 0 0", maxWidth: 260 }}>
              The free athletic potential calculator. Estimates use the Epley 1RM formula and a blended baseline of published strength standards.
            </p>
          </div>
          <div>
            <h4 style={{ font: `800 13px ${archivo}`, color: "#fff", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>Product</h4>
            <Link href="/#features" className="lp-flink">Features</Link>
            <Link href="/#archetypes" className="lp-flink">Archetypes</Link>
          </div>
          <div>
            <h4 style={{ font: `800 13px ${archivo}`, color: "#fff", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>Resources</h4>
            <Link href="/training" className="lp-flink">Training</Link>
            <Link href="/methodology" className="lp-flink">Methodology</Link>
            <Link href="/privacy" className="lp-flink">Privacy policy</Link>
          </div>
        </div>
        <p style={{ font: `400 11.5px/1.6 ${space}`, color: "rgba(255,255,255,.4)", margin: "36px 0 0", borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 20 }}>
          For entertainment and general fitness only — not medical, training, or nutrition advice. © {new Date().getFullYear()} Bedrock.fit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ── page shell ────────────────────────────────────────────────────────── */

/** Root wrapper: applies the palette variables, base font and nav/footer. */
export function LightPage({ active, children }: { active?: string; children: React.ReactNode }) {
  return (
    <div style={{ ...lightVars, background: "var(--paper)", minHeight: "100vh", color: "var(--body)", fontFamily: space }}>
      <LightNav active={active} />
      {children}
      <LightFooter />
    </div>
  );
}
