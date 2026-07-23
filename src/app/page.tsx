"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ---------- blended strength standards: 1RM as multiple of bodyweight ----------
   Tiers: [Beginner, Novice, Intermediate, Advanced, Elite] (MALE baseline).
   Blended/approximate from commonly published standards. */
const MALE: Record<string, number[]> = {
  bench: [0.5, 0.75, 1.0, 1.5, 2.0],
  squat: [0.75, 1.0, 1.5, 2.0, 2.5],
  deadlift: [1.0, 1.25, 1.75, 2.25, 2.75],
  ohp: [0.35, 0.5, 0.7, 0.9, 1.1],
  curl: [0.2, 0.35, 0.5, 0.7, 0.9],
  pushdown: [0.25, 0.4, 0.55, 0.72, 0.9],
};
const FEMALE_FACTOR = 0.68;
const STANDARDS: Record<string, Record<string, number[]>> = {
  male: MALE,
  female: Object.fromEntries(
    Object.entries(MALE).map(([k, v]) => [k, v.map((x) => +(x * FEMALE_FACTOR).toFixed(3))]),
  ),
};
const LEVELS = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];
const EXERCISES: [string, string][] = [
  ["bench", "Bench Press"],
  ["squat", "Back Squat"],
  ["deadlift", "Deadlift"],
  ["ohp", "Overhead Press"],
  ["curl", "Barbell Curl"],
  ["pushdown", "Tricep Pushdown"],
];
const LB_PER_KG = 0.45359237;

type Unit = "kg" | "lb";

interface Results {
  oneRM: string;
  ratio: string;
  levelName: string;
  levelPct: number;
  repRows: { label: string; reps: string }[];
  zStr: string;
  zHyp: string;
  zEnd: string;
  pullups: number;
  fivek: string;
  muscleup: string;
  arch: { emoji: string; name: string; desc: string };
}

function levelOf(ratio: number, std: number[]) {
  if (ratio < std[0]) return { name: "Untrained", idx: -1, pct: Math.max(4, (ratio / std[0]) * 10) };
  let i = 0;
  for (; i < std.length - 1; i++) if (ratio < std[i + 1]) break;
  let seg: number, within: number;
  if (ratio >= std[4]) {
    seg = 4;
    within = Math.min(1, (ratio - std[4]) / (std[4] - std[3]));
  } else {
    seg = i;
    within = (ratio - std[seg]) / (std[seg + 1] - std[seg]);
  }
  const pct = Math.min(100, ((seg + within) / 4) * 100);
  return { name: LEVELS[Math.min(4, seg)], idx: seg, pct };
}

function pickArchetype(a: { ex: string; lvName: string; lvIdx: number; maxPull: number; bwAdj: number; score: number }) {
  if (a.lvName === "Untrained")
    return { emoji: "💎", name: "Diamond in the Rough", desc: "Massive untapped upside. Your numbers only go up from here — time to get in the gym and shock yourself." };
  if (a.lvIdx >= 3 && (a.ex === "squat" || a.ex === "deadlift" || a.ex === "bench"))
    return { emoji: "🏋️", name: "Future Olympic Lifter", desc: "You're built for the barbell. Raw strength like this is rare — chase a big total and see how far it goes." };
  if (a.maxPull >= 12)
    return { emoji: "🤸", name: "Calisthenics Machine", desc: "Your strength-to-weight ratio is elite. Bars, rings, muscle-ups — the playground is yours." };
  if (a.bwAdj >= 1.15 && a.score >= 35)
    return { emoji: "🏃", name: "Marathoner in the Making", desc: "Light, efficient, and strong for your size — the perfect distance-runner build. Lace up." };
  if (a.lvIdx >= 2)
    return { emoji: "⚡", name: "The All-Rounder", desc: "Balanced power across the board. You'd hold your own in almost any sport you picked up." };
  return { emoji: "🌱", name: "The Rising Athlete", desc: "Solid foundation with clear room to grow. Pick a goal and the gains will come fast." };
}

/* archetype showcase copies (for the marketing section) */
const ARCHETYPES = [
  { emoji: "💎", name: "Diamond in the Rough", desc: "Massive untapped upside. Your numbers only go up from here." },
  { emoji: "🏋️", name: "Future Olympic Lifter", desc: "Built for the barbell. Raw strength like this is rare." },
  { emoji: "🤸", name: "Calisthenics Machine", desc: "Elite strength-to-weight ratio. Bars, rings, muscle-ups — the playground is yours." },
  { emoji: "🏃", name: "Marathoner in the Making", desc: "Light, efficient, and strong for your size — the perfect distance build." },
  { emoji: "⚡", name: "The All-Rounder", desc: "Balanced power across the board. You'd hold your own in almost any sport." },
  { emoji: "🌱", name: "The Rising Athlete", desc: "Solid foundation with clear room to grow. Gains come fast from here." },
];

/* palette: light green · charcoal · white (involve.me-style light theme) */
const rootVars = {
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

const archivo = "var(--font-archivo), sans-serif";
const space = "var(--font-space), sans-serif";

const labelStyle: React.CSSProperties = { display: "block", font: `700 11px ${space}`, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", color: "var(--ink)", font: `600 14px ${space}` };
const cardStyle: React.CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: "24px 26px" };
const secHead: React.CSSProperties = { font: `800 12px ${archivo}`, letterSpacing: ".08em", color: "var(--green)", textTransform: "uppercase", margin: "0 0 12px" };
const statBox: React.CSSProperties = { background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, textAlign: "center" };
const btnPrimary: React.CSSProperties = { display: "inline-block", background: "var(--charcoal)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 26px", font: `800 14px ${archivo}`, letterSpacing: ".02em", cursor: "pointer", textDecoration: "none" };
const btnGreen: React.CSSProperties = { ...btnPrimary, background: "var(--green)" };

const FEATURES = [
  { emoji: "📈", title: "True 1-rep max", desc: "No need to grind a risky max attempt. One comfortable set is enough to estimate your ceiling." },
  { emoji: "🌍", title: "Global strength level", desc: "See where you land — Beginner to Elite — against blended, published strength standards for your sex and bodyweight." },
  { emoji: "🎯", title: "Training zones", desc: "Exact weights and rep ranges to train max strength, muscle size, or endurance — personalized to your numbers." },
  { emoji: "🧮", title: "Rep predictions", desc: "How many reps could you hit with 1, 2, 3, or 4 plates per side? We do the math for every load." },
  { emoji: "🔮", title: "Projected feats", desc: "Playful projections of your max pull-ups, 5K time, and whether a muscle-up is within reach." },
  { emoji: "🦸", title: "Athlete archetype", desc: "The fun part: discover the athlete you're built to become, from Calisthenics Machine to Future Olympic Lifter." },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <svg width="24" height="26" viewBox="0 0 26 28" aria-hidden="true">
        <polygon points="13,1 25,7.5 25,20.5 13,27 1,20.5 1,7.5" fill="none" stroke="var(--green)" strokeWidth="2" />
        <polygon points="13,8 19,18 7,18" fill="var(--green)" />
      </svg>
      <span style={{ font: `800 17px ${archivo}`, color: light ? "#fff" : "var(--ink)" }}>
        bedrock<span style={{ color: "var(--green)" }}>.fit</span>
      </span>
    </Link>
  );
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [unit, setUnit] = useState<Unit>("lb");
  const [sex, setSex] = useState("male");
  const [height, setHeight] = useState("");
  const [bw, setBw] = useState("");
  const [exercise, setExercise] = useState("bench");
  const [lift, setLift] = useState("");
  const [reps, setReps] = useState("");
  const [res, setRes] = useState<Results | null>(null);
  const [err, setErr] = useState("");

  /* lock body scroll + close on Escape while the scan window is open */
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  const toKg = (w: number) => (unit === "kg" ? w : w * LB_PER_KG);
  const fmtW = (kg: number) => Math.round(unit === "kg" ? kg : kg / LB_PER_KG) + (unit === "kg" ? " kg" : " lb");
  const wl = unit === "kg" ? "(kg)" : "(lb)";

  function compute() {
    const bwKg = toKg(parseFloat(bw));
    const liftKg = toKg(parseFloat(lift));
    const r = parseFloat(reps);
    if (!bwKg || !liftKg || !r) {
      setErr("Fill in bodyweight, weight and reps.");
      return;
    }
    setErr("");
    const oneRM = liftKg * (1 + r / 30);
    const ratio = oneRM / bwKg;
    const std = STANDARDS[sex][exercise];
    const lv = levelOf(ratio, std);

    const loads = [20, 60, 100, 140, 180];
    const labels = ["Empty bar", "1 plate / side", "2 plates / side", "3 plates / side", "4 plates / side"];
    const repRows: { label: string; reps: string }[] = [];
    loads.forEach((L, i) => {
      const n = Math.floor(30 * (oneRM / L - 1));
      if (L < oneRM * 0.98 && n >= 1) repRows.push({ label: `${labels[i]} (${fmtW(L)})`, reps: `${n > 30 ? "30+" : n} reps` });
    });
    if (!repRows.length) repRows.push({ label: "Your max is near an empty bar — keep building!", reps: "" });

    const score = lv.pct;
    const bwRef = sex === "male" ? 80 : 65;
    const bwAdj = Math.max(0.6, Math.min(1.4, bwRef / bwKg));
    const maxPull = Math.max(0, Math.round((score / 100) * (sex === "male" ? 24 : 16) * bwAdj));
    const base5k = sex === "male" ? 34 : 37;
    let t = base5k - score * 0.15 - (bwAdj - 1) * 8;
    t = Math.max(sex === "male" ? 15 : 17, Math.min(45, t));
    const mm = Math.floor(t);
    const ss = Math.round((t - mm) * 60).toString().padStart(2, "0");

    setRes({
      oneRM: fmtW(oneRM),
      ratio: ratio.toFixed(2) + "×",
      levelName: lv.name,
      levelPct: lv.pct,
      repRows,
      zStr: `${fmtW(oneRM * 0.88)} × 3–5`,
      zHyp: `${fmtW(oneRM * 0.72)} × 8–12`,
      zEnd: `${fmtW(oneRM * 0.58)} × 15–20`,
      pullups: maxPull,
      fivek: `${mm}:${ss}`,
      muscleup: maxPull >= 12 ? "Likely 💪" : maxPull >= 7 ? "So close!" : "Not yet",
      arch: pickArchetype({ ex: exercise, lvName: lv.name, lvIdx: lv.idx, maxPull, bwAdj, score }),
    });
  }

  function reset() {
    setSex("male");
    setUnit("lb");
    setHeight("");
    setBw("");
    setExercise("bench");
    setLift("");
    setReps("");
    setRes(null);
    setErr("");
  }

  function openScan() {
    setModalOpen(true);
  }

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 12px",
    borderRadius: 10,
    border: `1px solid ${active ? "var(--green)" : "var(--line)"}`,
    background: active ? "var(--green)" : "#fff",
    color: active ? "#fff" : "var(--muted)",
    font: `700 12px ${archivo}`,
    cursor: "pointer",
  });

  const wrap: React.CSSProperties = { width: "100%", maxWidth: 1120, margin: "0 auto", padding: "0 20px" };
  const h2Style: React.CSSProperties = { font: `800 clamp(26px, 4vw, 38px)/1.15 ${archivo}`, letterSpacing: "-.01em", color: "var(--ink)", margin: 0 };

  return (
    <div style={{ ...rootVars, background: "var(--paper)", minHeight: "100vh", color: "var(--body)", fontFamily: space }}>
      {/* ── sticky nav ── */}
      <header className="lp-nav" style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "14px 20px" }}>
          <Logo />
          <nav className="lp-nav-links" aria-label="Main">
            <a href="#features" style={{ font: `600 14px ${space}`, color: "var(--body)", textDecoration: "none" }}>Features</a>
            <a href="#archetypes" style={{ font: `600 14px ${space}`, color: "var(--body)", textDecoration: "none" }}>Archetypes</a>
            <Link href="/methodology" style={{ font: `600 14px ${space}`, color: "var(--body)", textDecoration: "none" }}>Methodology</Link>
          </nav>
          <button type="button" onClick={openScan} style={{ ...btnGreen, padding: "10px 18px", font: `800 13px ${archivo}` }}>Get my strength scan</button>
        </div>
      </header>

      {/* ── hero ── */}
      <section style={{ background: "radial-gradient(1100px 500px at 50% -80px, var(--mint2), var(--paper) 75%)", padding: "72px 0 48px", textAlign: "center" }}>
        <div style={wrap}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-soft)", color: "var(--green-dark)", borderRadius: 999, padding: "7px 16px", font: `700 12px ${space}`, letterSpacing: ".02em" }}>
            🏆 Free forever · No signup · Runs 100% in your browser
          </span>
          <h1 style={{ font: `800 clamp(32px, 5.4vw, 58px)/1.08 ${archivo}`, letterSpacing: "-.015em", color: "var(--ink)", margin: "22px auto 0", maxWidth: 820 }}>
            The Free Strength Calculator That Reveals Your <span style={{ color: "var(--green)" }}>Athletic Potential</span>
          </h1>
          <p style={{ font: `500 17px/1.65 ${space}`, color: "var(--muted)", maxWidth: 620, margin: "18px auto 0" }}>
            Enter one lift you do often and we&rsquo;ll estimate your true 1-rep max, rank you against global strength standards, build your training zones — and reveal the athlete you&rsquo;re built to become.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
            <button type="button" onClick={openScan} style={btnGreen}>Get my strength scan →</button>
            <a href="#features" style={{ ...btnPrimary, background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}>See what you get</a>
          </div>
          <p style={{ font: `500 12px ${space}`, color: "var(--muted)", marginTop: 12 }}>No credit card required — because there&rsquo;s nothing to buy.</p>

          {/* trust strip */}
          <div className="lp-trust" style={{ display: "flex", justifyContent: "center", gap: 34, flexWrap: "wrap", marginTop: 42, padding: "18px 0", borderTop: "1px solid var(--line)" }}>
            {["6 barbell lifts supported", "5 strength tiers · Beginner → Elite", "Epley 1RM formula", "kg & lb"].map((t) => (
              <span key={t} style={{ font: `600 13px ${space}`, color: "var(--muted)" }}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── features ── */}
      <section id="features" style={{ padding: "64px 0", scrollMarginTop: 70 }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 40px" }}>
            <h2 style={h2Style}>Explore your strength scan. Six insights from a single lift.</h2>
          </div>
          <div className="lp-feats">
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 22px", boxShadow: "0 1px 2px rgba(39,44,39,.04)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{f.emoji}</div>
                <h3 style={{ font: `800 17px ${archivo}`, color: "var(--ink)", margin: "14px 0 8px" }}>{f.title}</h3>
                <p style={{ font: `500 13.5px/1.6 ${space}`, color: "var(--muted)", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── archetypes ── */}
      <section id="archetypes" style={{ background: "var(--mint)", padding: "64px 0", scrollMarginTop: 70 }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 40px" }}>
            <h2 style={h2Style}>Which athlete are you built to become?</h2>
            <p style={{ font: `500 15px/1.65 ${space}`, color: "var(--muted)", margin: "12px 0 0" }}>
              Your numbers map to one of six athlete archetypes. Run the scan to claim yours.
            </p>
          </div>
          <div className="lp-arch">
            {ARCHETYPES.map((a) => (
              <div key={a.name} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "22px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 38, lineHeight: 1 }}>{a.emoji}</div>
                <h3 style={{ font: `800 16px ${archivo}`, color: "var(--ink)", margin: "12px 0 6px" }}>{a.name}</h3>
                <p style={{ font: `500 13px/1.55 ${space}`, color: "var(--muted)", margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 34 }}>
            <button type="button" onClick={openScan} style={btnGreen}>Find my archetype →</button>
          </div>
        </div>
      </section>

      {/* ── footer ── */}
      <footer style={{ background: "var(--charcoal)", padding: "48px 0 32px" }}>
        <div style={wrap}>
          <div className="lp-footer-cols">
            <div>
              <Logo light />
              <p style={{ font: `500 13px/1.6 ${space}`, color: "rgba(255,255,255,.55)", margin: "14px 0 0", maxWidth: 260 }}>
                The free athletic potential calculator. Estimates use the Epley 1RM formula and a blended baseline of published strength standards.
              </p>
            </div>
            <div>
              <h4 style={{ font: `800 13px ${archivo}`, color: "#fff", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>Product</h4>
              <a href="#features" className="lp-flink">Features</a>
              <a href="#archetypes" className="lp-flink">Archetypes</a>
            </div>
            <div>
              <h4 style={{ font: `800 13px ${archivo}`, color: "#fff", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>Resources</h4>
              <Link href="/methodology" className="lp-flink">Methodology</Link>
              <Link href="/privacy" className="lp-flink">Privacy policy</Link>
            </div>
          </div>
          <p style={{ font: `400 11.5px/1.6 ${space}`, color: "rgba(255,255,255,.4)", margin: "36px 0 0", borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 20 }}>
            For entertainment and general fitness only — not medical, training, or nutrition advice. © {new Date().getFullYear()} Bedrock.fit. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── strength scan window (form → results) ── */}
      {modalOpen && (
        <div className="lp-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="lp-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Strength scan"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: 10, border: "1px solid var(--line)", background: "#fff", color: "var(--muted)", font: `700 15px ${space}`, cursor: "pointer", lineHeight: 1 }}
            >
              ✕
            </button>

            {!res ? (
              /* ---- step 1: the form ---- */
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <h2 style={{ font: `800 24px ${archivo}`, color: "var(--ink)", margin: 0 }}>Run your free strength scan</h2>
                  <p style={{ font: `500 13.5px/1.6 ${space}`, color: "var(--muted)", margin: "8px auto 0", maxWidth: 400 }}>
                    A few numbers and one lift. Results appear instantly — nothing is uploaded or stored.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Sex</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={seg(sex === "male")} onClick={() => setSex("male")}>M</button>
                      <button type="button" style={seg(sex === "female")} onClick={() => setSex("female")}>F</button>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Units</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={seg(unit === "kg")} onClick={() => setUnit("kg")}>KG</button>
                      <button type="button" style={seg(unit === "lb")} onClick={() => setUnit("lb")}>LB</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Height {unit === "kg" ? "(cm)" : "(in)"}</label>
                    <input type="number" inputMode="decimal" placeholder="0" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Weight {wl}</label>
                    <input type="number" inputMode="decimal" placeholder="0" value={bw} onChange={(e) => setBw(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <label style={labelStyle}>Lift</label>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <select value={exercise} onChange={(e) => setExercise(e.target.value)} style={inputStyle}>
                    {EXERCISES.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <input type="number" inputMode="decimal" placeholder="wt" value={lift} onChange={(e) => setLift(e.target.value)} style={inputStyle} />
                  <input type="number" inputMode="numeric" placeholder="reps" value={reps} onChange={(e) => setReps(e.target.value)} style={inputStyle} />
                </div>

                {err && <p style={{ color: "#c0392b", fontSize: 13, margin: "8px 0" }}>{err}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={compute} style={{ ...btnGreen, flex: 1, textAlign: "center" }}>
                    Reveal my results →
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="Reset the calculator"
                    style={{ padding: "12px 16px", background: "#fff", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 12, font: `700 12px ${archivo}`, letterSpacing: ".04em", cursor: "pointer" }}
                  >
                    Reset
                  </button>
                </div>
              </>
            ) : (
              /* ---- step 2: the results ---- */
              <>
                <div style={{ background: "var(--mint)", border: "2px solid var(--green)", borderRadius: 14, padding: "24px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 48, lineHeight: 1 }}>{res.arch.emoji}</div>
                  <div style={{ font: `700 11px ${space}`, color: "var(--muted)", letterSpacing: ".1em", margin: "10px 0 2px", textTransform: "uppercase" }}>Your archetype</div>
                  <div style={{ font: `900 23px ${archivo}`, color: "var(--green-dark)" }}>{res.arch.name}</div>
                  <p style={{ font: `500 13px/1.55 ${space}`, color: "var(--body)", margin: "8px 0 0" }}>{res.arch.desc}</p>
                </div>

                <div className="bf-two" style={{ marginTop: 16 }}>
                  <div style={cardStyle}>
                    <div style={secHead}>Estimated 1-rep max</div>
                    <div className="bf-two-tight">
                      <div style={statBox}>
                        <div style={{ font: `900 28px ${archivo}`, color: "var(--green-dark)" }}>{res.oneRM}</div>
                        <div style={{ font: `600 12px ${space}`, color: "var(--muted)" }}>Your max</div>
                      </div>
                      <div style={statBox}>
                        <div style={{ font: `900 28px ${archivo}`, color: "var(--ink)" }}>{res.ratio}</div>
                        <div style={{ font: `600 12px ${space}`, color: "var(--muted)" }}>× bodyweight</div>
                      </div>
                    </div>
                    <div style={{ ...secHead, marginTop: 20 }}>Strength level</div>
                    <div style={{ font: `800 19px ${archivo}`, color: "var(--ink)" }}>{res.levelName}</div>
                    <div style={{ height: 10, borderRadius: 6, background: "var(--mint2)", overflow: "hidden", marginTop: 10 }}>
                      <i style={{ display: "block", height: "100%", width: `${res.levelPct}%`, background: "var(--green)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", font: `500 10px ${space}`, color: "var(--muted)", marginTop: 6 }}>
                      {LEVELS.map((l) => <span key={l}>{l}</span>)}
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <div style={secHead}>Train here to build…</div>
                    {[["Max strength", "heavy, low reps", res.zStr], ["Muscle size", "moderate, medium reps", res.zHyp], ["Endurance", "light, high reps", res.zEnd]].map(([t, s, v]) => (
                      <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, background: "var(--mint)", border: "1px solid var(--line)", marginTop: 8 }}>
                        <div>
                          <b style={{ display: "block", color: "var(--green-dark)", font: `800 13px ${archivo}` }}>{t}</b>
                          <small style={{ color: "var(--muted)", fontSize: 11 }}>{s}</small>
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 700, alignSelf: "center", color: "var(--ink)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...cardStyle, marginTop: 16 }}>
                  <div style={secHead}>How many reps you could hit</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "9px 8px", borderBottom: "1px solid var(--line)", font: `600 11px ${space}`, color: "var(--muted)", textTransform: "uppercase" }}>Load on the bar</th>
                        <th style={{ textAlign: "left", padding: "9px 8px", borderBottom: "1px solid var(--line)", font: `600 11px ${space}`, color: "var(--muted)", textTransform: "uppercase" }}>Est. reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {res.repRows.map((row, i) => (
                        <tr key={i}>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--body)" }}>{row.label}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid var(--line)", fontSize: 14 }}><b style={{ color: "var(--green-dark)" }}>{row.reps}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ ...cardStyle, marginTop: 16 }}>
                  <div style={secHead}>Just for fun — your projected feats 🔮</div>
                  <div className="bf-three">
                    <div style={statBox}>
                      <div style={{ font: `900 28px ${archivo}`, color: "var(--green-dark)" }}>{res.pullups}</div>
                      <div style={{ font: `600 12px ${space}`, color: "var(--muted)" }}>Max pull-ups</div>
                    </div>
                    <div style={statBox}>
                      <div style={{ font: `900 28px ${archivo}`, color: "var(--green-dark)" }}>{res.fivek}</div>
                      <div style={{ font: `600 12px ${space}`, color: "var(--muted)" }}>5K run time</div>
                    </div>
                    <div style={statBox}>
                      <div style={{ font: `900 19px ${archivo}`, color: "var(--green-dark)", marginTop: 6 }}>{res.muscleup}</div>
                      <div style={{ font: `600 12px ${space}`, color: "var(--muted)" }}>Muscle-up?</div>
                    </div>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: 12, margin: "12px 0 0" }}>Playful projections from your profile, not measured results — go test them!</p>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button type="button" onClick={() => setRes(null)} style={{ padding: "12px 16px", background: "#fff", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 12, font: `700 13px ${archivo}`, cursor: "pointer" }}>
                    ← Edit my numbers
                  </button>
                  <button type="button" onClick={() => setModalOpen(false)} style={{ ...btnGreen, flex: 1, textAlign: "center" }}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
