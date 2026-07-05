"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

/* ---------- still (non-animated) matrix background, low opacity ---------- */
function StillMatrix() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const parent = c?.parentElement;
    if (!c || !parent) return;
    const w = (c.width = parent.offsetWidth);
    const h = (c.height = parent.offsetHeight);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%*+<>アカサタナヒ".split("");
    const font = 14;
    ctx.font = `${font}px 'JetBrains Mono', monospace`;
    const cols = Math.floor(w / font);
    for (let i = 0; i < cols; i++) {
      const len = 3 + Math.floor(Math.random() * 16);
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
  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.2 }} />;
}

/* palette (calmer neon: accent reserved for key elements) */
const rootVars = {
  "--page": "#050705",
  "--surface": "#0a0f0a",
  "--surface2": "#070c07",
  "--input": "rgba(0,0,0,.4)",
  "--border": "rgba(77,255,77,.18)",
  "--border2": "rgba(77,255,77,.28)",
  "--dash": "rgba(77,255,77,.22)",
  "--ink": "#ffffff",
  "--body": "#e6f4e6",
  "--muted": "#9bb69b",
  "--faint": "#5f7a5f",
  "--accent": "#4dff4d",
  "--accent-ink": "#04120b",
} as React.CSSProperties;

const archivo = "var(--font-archivo), sans-serif";
const mono = "var(--font-mono-bf), monospace";

const labelStyle: React.CSSProperties = { display: "block", font: `800 11px ${archivo}`, letterSpacing: ".08em", color: "var(--accent)", margin: "0 0 9px" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--input)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", color: "var(--body)", font: `700 16px ${archivo}` };

/* reserved ad slot — layout only, NO live ad code until AdSense approves */
function AdSlot({ label, height }: { label: string; height: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ font: `700 9px ${mono}`, letterSpacing: ".16em", color: "var(--faint)", margin: "0 0 8px" }}>ADVERTISEMENT</div>
      <div
        style={{
          minHeight: height,
          border: "1px dashed var(--dash)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface)",
          font: `600 12px ${mono}`,
          color: "var(--faint)",
          letterSpacing: ".1em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function Home() {
  const [unit, setUnit] = useState<Unit>("lb");
  const [sex, setSex] = useState("male");
  const [height, setHeight] = useState("");
  const [bw, setBw] = useState("");
  const [exercise, setExercise] = useState("bench");
  const [lift, setLift] = useState("");
  const [reps, setReps] = useState("");
  const [res, setRes] = useState<Results | null>(null);
  const [err, setErr] = useState("");

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

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "transparent",
    color: active ? "var(--accent-ink)" : "var(--muted)",
    font: `800 13px ${archivo}`,
    cursor: "pointer",
  });

  const statBox: React.CSSProperties = { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, textAlign: "center" };
  const secHead: React.CSSProperties = { font: `800 12px ${archivo}`, letterSpacing: ".08em", color: "var(--accent)", textTransform: "uppercase", margin: "0 0 12px" };

  return (
    <div style={{ ...rootVars, position: "relative", minHeight: "100vh", background: "var(--page)", overflow: "hidden", color: "var(--body)", fontFamily: archivo, display: "flex", flexDirection: "column" }}>
      <StillMatrix />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "0 20px 40px", flex: 1 }}>
        {/* header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "16px 24px", marginTop: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <svg width="22" height="24" viewBox="0 0 26 28" aria-hidden="true">
              <polygon points="13,1 25,7.5 25,20.5 13,27 1,20.5 1,7.5" fill="none" stroke="#4dff4d" strokeWidth="2" />
              <polygon points="13,8 19,18 7,18" fill="#4dff4d" />
            </svg>
            <span style={{ font: `800 15px ${archivo}`, color: "var(--ink)" }}>
              BEDROCK<span style={{ color: "var(--accent)" }}>.FIT</span>
            </span>
            <span style={{ font: `700 11px ${mono}`, color: "var(--faint)", letterSpacing: ".14em", marginLeft: 8 }}>{"//STRENGTH_SCAN"}</span>
          </Link>
        </header>

        <AdSlot label="728 × 90 · LEADERBOARD" height={90} />

        {/* hero: form + result */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "30px 32px", marginTop: 16 }}>
          <h1 className="bf-h1">
            Unlock your <span style={{ color: "var(--accent)" }}>athletic potential</span>
          </h1>
          <p style={{ margin: "0 0 24px", maxWidth: 560, font: `500 14px/1.6 var(--font-space), sans-serif`, color: "var(--muted)" }}>
            Enter a few numbers and one lift you do often. We&rsquo;ll estimate your true strength ceiling — and reveal the athlete you&rsquo;re built to become.
          </p>

          <div className="bf-hero">
            {/* form */}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <div className="bf-two" style={{ marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>SEX</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" style={seg(sex === "male")} onClick={() => setSex("male")}>MALE</button>
                    <button type="button" style={seg(sex === "female")} onClick={() => setSex("female")}>FEMALE</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>UNITS</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" style={seg(unit === "kg")} onClick={() => setUnit("kg")}>KG</button>
                    <button type="button" style={seg(unit === "lb")} onClick={() => setUnit("lb")}>LB</button>
                  </div>
                </div>
              </div>

              <div className="bf-two" style={{ marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>HEIGHT {unit === "kg" ? "(cm)" : "(in)"}</label>
                  <input type="number" inputMode="decimal" placeholder="0" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>BODYWEIGHT {wl}</label>
                  <input type="number" inputMode="decimal" placeholder="0" value={bw} onChange={(e) => setBw(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <label style={{ ...labelStyle, letterSpacing: ".1em" }}>YOUR GO-TO LIFT</label>
              <div className="bf-lift">
                <select value={exercise} onChange={(e) => setExercise(e.target.value)} style={{ ...inputStyle, font: `700 14px var(--font-space), sans-serif` }}>
                  {EXERCISES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <input type="number" inputMode="decimal" placeholder="0" value={lift} onChange={(e) => setLift(e.target.value)} style={inputStyle} aria-label={`Weight ${wl}`} />
                <input type="number" inputMode="numeric" placeholder="0" value={reps} onChange={(e) => setReps(e.target.value)} style={inputStyle} aria-label="Reps" />
              </div>

              {err && <p style={{ color: "var(--accent)", fontSize: 13, margin: "12px 0 0" }}>{err}</p>}

              <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={compute}
                  style={{ flex: 1, background: "var(--accent)", color: "var(--accent-ink)", border: "none", borderRadius: 12, padding: 18, font: `900 18px ${archivo}`, letterSpacing: ".02em", cursor: "pointer", textTransform: "uppercase" }}
                >
                  Reveal my potential →
                </button>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Reset the calculator"
                  style={{ padding: "18px 20px", background: "transparent", color: "var(--muted)", border: "1px solid var(--border2)", borderRadius: 12, font: `800 13px ${archivo}`, letterSpacing: ".06em", cursor: "pointer", textTransform: "uppercase" }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* result summary */}
            <div>
              <div style={secHead}>Your projected potential</div>
              {res ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 14, padding: "22px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 46, lineHeight: 1 }}>{res.arch.emoji}</div>
                  <div style={{ font: `800 11px ${mono}`, color: "var(--faint)", letterSpacing: ".1em", margin: "10px 0 2px", textTransform: "uppercase" }}>Your archetype</div>
                  <div style={{ font: `900 22px ${archivo}`, color: "var(--accent)", textTransform: "uppercase" }}>{res.arch.name}</div>
                  <p style={{ font: `500 12px/1.5 var(--font-space), sans-serif`, color: "var(--muted)", margin: "8px 0 0" }}>{res.arch.desc}</p>
                </div>
              ) : (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 14, padding: "40px 20px", textAlign: "center", color: "var(--faint)", font: `600 13px ${mono}` }}>
                  Your result appears here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* full results */}
        {res && (
          <>
            <div className="bf-two" style={{ marginTop: 16 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px" }}>
                <div style={secHead}>Estimated 1-rep max</div>
                <div className="bf-two-tight">
                  <div style={statBox}>
                    <div style={{ font: `900 30px ${archivo}`, color: "var(--accent)" }}>{res.oneRM}</div>
                    <div style={{ font: `600 12px ${mono}`, color: "var(--muted)" }}>Your max</div>
                  </div>
                  <div style={statBox}>
                    <div style={{ font: `900 30px ${archivo}`, color: "var(--ink)" }}>{res.ratio}</div>
                    <div style={{ font: `600 12px ${mono}`, color: "var(--muted)" }}>× bodyweight</div>
                  </div>
                </div>
                <div style={{ ...secHead, marginTop: 22 }}>Strength level</div>
                <div style={{ font: `800 20px ${archivo}`, color: "var(--ink)" }}>{res.levelName}</div>
                <div style={{ height: 10, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", overflow: "hidden", marginTop: 10 }}>
                  <i style={{ display: "block", height: "100%", width: `${res.levelPct}%`, background: "var(--accent)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", font: `500 10px ${mono}`, color: "var(--faint)", marginTop: 6 }}>
                  {LEVELS.map((l) => <span key={l}>{l}</span>)}
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px" }}>
                <div style={secHead}>Train here to build…</div>
                {[["Max strength", "heavy, low reps", res.zStr], ["Muscle size", "moderate, medium reps", res.zHyp], ["Endurance", "light, high reps", res.zEnd]].map(([t, s, v]) => (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", marginTop: 8 }}>
                    <div>
                      <b style={{ display: "block", color: "var(--accent)", font: `800 13px ${archivo}` }}>{t}</b>
                      <small style={{ color: "var(--muted)", fontSize: 11 }}>{s}</small>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, alignSelf: "center", color: "var(--body)" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px", marginTop: 16 }}>
              <div style={secHead}>How many reps you could hit</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "9px 8px", borderBottom: "1px solid var(--border)", font: `600 11px ${mono}`, color: "var(--muted)", textTransform: "uppercase" }}>Load on the bar</th>
                    <th style={{ textAlign: "left", padding: "9px 8px", borderBottom: "1px solid var(--border)", font: `600 11px ${mono}`, color: "var(--muted)", textTransform: "uppercase" }}>Est. reps</th>
                  </tr>
                </thead>
                <tbody>
                  {res.repRows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid var(--border)", fontSize: 14, color: "var(--body)" }}>{row.label}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid var(--border)", fontSize: 14 }}><b style={{ color: "var(--accent)" }}>{row.reps}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px", marginTop: 16 }}>
              <div style={secHead}>Just for fun — your projected feats 🔮</div>
              <div className="bf-three">
                <div style={statBox}>
                  <div style={{ font: `900 30px ${archivo}`, color: "var(--accent)" }}>{res.pullups}</div>
                  <div style={{ font: `600 12px ${mono}`, color: "var(--muted)" }}>Max pull-ups</div>
                </div>
                <div style={statBox}>
                  <div style={{ font: `900 30px ${archivo}`, color: "var(--accent)" }}>{res.fivek}</div>
                  <div style={{ font: `600 12px ${mono}`, color: "var(--muted)" }}>5K run time</div>
                </div>
                <div style={statBox}>
                  <div style={{ font: `900 20px ${archivo}`, color: "var(--accent)", marginTop: 6 }}>{res.muscleup}</div>
                  <div style={{ font: `600 12px ${mono}`, color: "var(--muted)" }}>Muscle-up?</div>
                </div>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "12px 0 0" }}>Playful projections from your profile, not measured results — go test them!</p>
            </div>
          </>
        )}

        <AdSlot label="970 × 90 · FULL-WIDTH AD UNIT" height={110} />

        <p style={{ color: "var(--faint)", font: `400 11px/1.5 ${mono}`, textAlign: "center", margin: "22px auto 0", maxWidth: 620 }}>
          Estimates use the Epley 1RM formula and a blended baseline of published strength standards. For entertainment and general fitness only — not medical, training, or nutrition advice.
        </p>

        {/* footer */}
        <footer style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <Link href="/privacy" style={{ font: `500 12px ${mono}`, color: "var(--accent)", textDecoration: "none", letterSpacing: ".04em" }}>Privacy</Link>
          <Link href="/methodology" style={{ font: `500 12px ${mono}`, color: "var(--accent)", textDecoration: "none", letterSpacing: ".04em" }}>Methodology</Link>
          <span style={{ font: `400 12px ${mono}`, color: "var(--faint)" }}>© {new Date().getFullYear()} Bedrock.fit</span>
        </footer>
      </div>
    </div>
  );
}
