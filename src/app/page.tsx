"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- blended strength standards: 1RM as multiple of bodyweight ----------
   Tiers: [Beginner, Novice, Intermediate, Advanced, Elite]  (MALE baseline)
   Blended/approximate from common published standards; tune later.        */
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

function pickArchetype(a: {
  ex: string;
  lvName: string;
  lvIdx: number;
  maxPull: number;
  bwAdj: number;
  score: number;
}) {
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

/* ---------- Matrix rain background ---------- */
function MatrixCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾉ0123456789ABCDEFZ".split("");
    let w = 0, h = 0, cols = 0;
    let drops: number[] = [];
    const font = 14;
    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      cols = Math.floor(w / font);
      drops = Array(cols).fill(0).map(() => Math.random() * (h / font));
    }
    resize();
    window.addEventListener("resize", resize);
    const id = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#39ff14";
      ctx.font = `${font}px monospace`;
      for (let i = 0; i < cols; i++) {
        const c = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(c, i * font, drops[i] * font);
        if (drops[i] * font > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 60);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas id="matrix" ref={ref} aria-hidden="true" />;
}

/* ---------- Confetti burst ---------- */
function useConfetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  function fire() {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#39ff14", "#ffffff", "#b9ff9e", "#1f8f13"];
    const parts = Array.from({ length: 170 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 3,
      vx: (Math.random() - 0.5) * 13,
      vy: Math.random() * -15 - 3,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 22,
    }));
    let frame = 0;
    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      frame++;
      for (const p of parts) {
        p.vy += 0.4;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (frame < 150) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    }
    tick();
  }
  const canvas = <canvas id="confetti" ref={ref} aria-hidden="true" />;
  return { canvas, fire };
}

export default function Home() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [sex, setSex] = useState("male");
  const [height, setHeight] = useState("");
  const [bw, setBw] = useState("");
  const [exercise, setExercise] = useState("bench");
  const [lift, setLift] = useState("");
  const [reps, setReps] = useState("");
  const [res, setRes] = useState<Results | null>(null);
  const [err, setErr] = useState("");
  const { canvas: confettiCanvas, fire } = useConfetti();

  useEffect(() => {
    if (res) fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

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

    const oneRM = liftKg * (1 + r / 30); // Epley
    const ratio = oneRM / bwKg;
    const std = STANDARDS[sex][exercise];
    const lv = levelOf(ratio, std);

    const loads = [20, 60, 100, 140, 180];
    const labels = ["Empty bar", "1 plate / side", "2 plates / side", "3 plates / side", "4 plates / side"];
    const repRows: { label: string; reps: string }[] = [];
    loads.forEach((L, i) => {
      const n = Math.floor(30 * (oneRM / L - 1));
      if (L < oneRM * 0.98 && n >= 1) {
        repRows.push({ label: `${labels[i]} (${fmtW(L)})`, reps: `${n > 30 ? "30+" : n} reps` });
      }
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

  return (
    <>
      <MatrixCanvas />
      {confettiCanvas}

      <div className="site">
        <header className="site-header">
          <div className="header-inner">
            <a className="logo" href="/">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 2.5 L28.5 9.75 L28.5 22.25 L16 29.5 L3.5 22.25 L3.5 9.75 Z" stroke="#39ff14" strokeWidth="2.4" />
                <path d="M9 21 L16 9 L23 21 Z" fill="#39ff14" />
              </svg>
              <span className="word">
                BEDROCK<b>.FIT</b>
              </span>
            </a>
          </div>
        </header>

        <div className="wrap">
          <div className="hero">
            <div className="kicker">Strength Potential Calculator</div>
            <h1>
              What&apos;s Your <span className="grad">Athletic Potential?</span>
            </h1>
            <p className="sub">
              Enter a few numbers and one lift you do often. We&apos;ll estimate your true strength ceiling — and reveal
              the athlete you&apos;re built to become.
            </p>
          </div>

          <div className="card">
            <div className="grid cols-2">
              <div>
                <label>Sex</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label>Units</label>
                <div className="seg">
                  <button type="button" className={unit === "kg" ? "on" : ""} onClick={() => setUnit("kg")}>
                    kg
                  </button>
                  <button type="button" className={unit === "lb" ? "on" : ""} onClick={() => setUnit("lb")}>
                    lb
                  </button>
                </div>
              </div>
            </div>

            <div className="grid cols-2" style={{ marginTop: 14 }}>
              <div>
                <label>
                  Height <small style={{ color: "var(--muted)" }}>{unit === "kg" ? "(cm)" : "(in)"}</small>
                </label>
                <input type="number" inputMode="decimal" placeholder="188" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div>
                <label>
                  Bodyweight <small style={{ color: "var(--muted)" }}>{wl}</small>
                </label>
                <input type="number" inputMode="decimal" placeholder="91" value={bw} onChange={(e) => setBw(e.target.value)} />
              </div>
            </div>

            <h3 className="sec">Your go-to lift</h3>
            <div className="grid cols-3">
              <div>
                <label>Exercise</label>
                <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
                  {EXERCISES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>
                  Weight <small style={{ color: "var(--muted)" }}>{wl}</small>
                </label>
                <input type="number" inputMode="decimal" placeholder="100" value={lift} onChange={(e) => setLift(e.target.value)} />
              </div>
              <div>
                <label>Reps (best set)</label>
                <input type="number" inputMode="numeric" placeholder="5" value={reps} onChange={(e) => setReps(e.target.value)} />
              </div>
            </div>

            {err && <p style={{ color: "var(--neon)", fontSize: 13, marginTop: 12 }}>{err}</p>}
            <button className="cta" onClick={compute}>
              Reveal my potential →
            </button>
          </div>

          {res && (
            <div className="results">
              <div className="card archetype">
                <div className="emoji">{res.arch.emoji}</div>
                <div className="tag">Your athlete archetype</div>
                <h2>{res.arch.name}</h2>
                <p>{res.arch.desc}</p>
              </div>

              <div className="card">
                <h3 className="sec">Estimated 1-rep max</h3>
                <div className="grid cols-2">
                  <div className="stat">
                    <div className="big">{res.oneRM}</div>
                    <div className="lbl">Your max</div>
                  </div>
                  <div className="stat">
                    <div className="big">{res.ratio}</div>
                    <div className="lbl">× bodyweight</div>
                  </div>
                </div>
                <h3 className="sec">
                  Strength level <small style={{ textTransform: "none", letterSpacing: 0 }}>(vs blended global standards)</small>
                </h3>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{res.levelName}</div>
                <div className="rating-bar">
                  <i style={{ width: `${res.levelPct}%` }} />
                </div>
                <div className="levels">
                  <span>Beginner</span>
                  <span>Novice</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                  <span>Elite</span>
                </div>
              </div>

              <div className="card">
                <h3 className="sec">How many reps you could hit</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Load on the bar</th>
                      <th>Est. reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.repRows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.label}</td>
                        <td>
                          <b>{row.reps}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3 className="sec">Train here to build…</h3>
                <div className="zone">
                  <div>
                    <b>Max Strength</b>
                    <small>heavy, low reps</small>
                  </div>
                  <div className="v">{res.zStr}</div>
                </div>
                <div className="zone">
                  <div>
                    <b>Muscle Size</b>
                    <small>moderate, medium reps</small>
                  </div>
                  <div className="v">{res.zHyp}</div>
                </div>
                <div className="zone">
                  <div>
                    <b>Endurance</b>
                    <small>light, high reps</small>
                  </div>
                  <div className="v">{res.zEnd}</div>
                </div>
              </div>

              <div className="card">
                <h3 className="sec">Just for fun — your projected feats 🔮</h3>
                <div className="grid cols-3">
                  <div className="stat">
                    <div className="big">{res.pullups}</div>
                    <div className="lbl">Max pull-ups</div>
                  </div>
                  <div className="stat">
                    <div className="big">{res.fivek}</div>
                    <div className="lbl">5K run time</div>
                  </div>
                  <div className="stat">
                    <div className="big" style={{ fontSize: 20 }}>
                      {res.muscleup}
                    </div>
                    <div className="lbl">Muscle-up?</div>
                  </div>
                </div>
                <p style={{ color: "var(--muted)", fontSize: 12, margin: "12px 0 0" }}>
                  These are playful projections from your profile, not measured results — go test them!
                </p>
              </div>
            </div>
          )}

          <p className="disclaimer">
            Estimates use the Epley 1RM formula and a blended baseline of published strength standards (bodyweight-multiple
            benchmarks). For entertainment and general fitness only — not medical, training, or nutrition advice. Warm up
            and lift within your limits.
          </p>
        </div>

        <footer className="site-footer">
          <div className="footer-inner">
            <a href="#sources">Sources</a>
            <a href="#donate">Donate</a>
            <a href="#privacy">Privacy Policy</a>
            <span className="copy">© {new Date().getFullYear()} Bedrock.fit</span>
          </div>
        </footer>
      </div>
    </>
  );
}
