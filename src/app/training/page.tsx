import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bedrock.fit";

/* Bump DATE_MODIFIED whenever the article copy or its figures change. */
const DATE_PUBLISHED = "2026-08-04";
const DATE_MODIFIED = "2026-08-04";

export const metadata: Metadata = {
  title: "Leg Strength: Why Strong Legs Matter More As You Age | Bedrock.fit",
  description:
    "The evidence behind leg strength: how fast lower-body strength declines with age, why it predicts independence and survival, and what the research says actually works to rebuild it.",
  alternates: { canonical: "/training" },
  openGraph: {
    type: "article",
    title: "Leg Strength — Why Strong Legs Matter More As You Age",
    description:
      "How fast lower-body strength declines, why it predicts independence and survival, and what actually works to rebuild it.",
    url: "/training",
  },
};

/* palette shared with the home page (light green · charcoal · white) */
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
const mono = "var(--font-mono-bf), monospace";

const wrap: React.CSSProperties = { width: "100%", maxWidth: 1120, margin: "0 auto", padding: "0 20px" };
const article: React.CSSProperties = { width: "100%", maxWidth: 760, margin: "0 auto", padding: "0 20px" };
const btnGreen: React.CSSProperties = {
  display: "inline-block", background: "var(--green)", color: "#fff", border: "none", borderRadius: 12,
  padding: "10px 18px", font: `800 13px ${archivo}`, letterSpacing: ".02em", cursor: "pointer", textDecoration: "none",
};
const h2: React.CSSProperties = { font: `800 clamp(22px, 3vw, 29px)/1.2 ${archivo}`, letterSpacing: "-.01em", color: "var(--ink)", margin: "44px 0 14px" };
const h3: React.CSSProperties = { font: `800 17px ${archivo}`, color: "var(--ink)", margin: "26px 0 8px" };
const p: React.CSSProperties = { font: `500 16.5px/1.78 ${space}`, color: "var(--body)", margin: "0 0 18px" };
const kicker: React.CSSProperties = { font: `700 11px ${mono}`, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--green-dark)" };

/* ── the same "Ascend" mark used in the home-page nav ── */
function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <svg width="32" height="32" viewBox="0 0 120 120" aria-hidden="true" style={{ flex: "none" }}>
        <defs>
          <radialGradient id={light ? "bfTileTF" : "bfTileTH"} cx="30%" cy="20%" r="120%">
            <stop offset="0%" stopColor="#26292D" />
            <stop offset="70%" stopColor="#1B1E21" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="120" height="120" rx="26" fill={`url(#${light ? "bfTileTF" : "bfTileTH"})`} />
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

/* ── charts: dependency-free horizontal bars, laid out in CSS ──
   Deliberately not inline SVG: a fixed-viewBox SVG scaled to a 274px-wide
   phone column renders its 12px labels at ~6px. CSS bars keep the text at
   its real size and let long labels wrap and stack (see .bf-chart* in
   globals.css). */
type Bar = { label: string; value: number; display?: string; accent?: boolean };

function BarChart({
  title, sub, bars, max, unit = "%", source,
}: { title: string; sub?: string; bars: Bar[]; max: number; unit?: string; source: string }) {
  return (
    <figure style={{ margin: "26px 0 30px", background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 16, padding: "22px 22px 16px" }}>
      <figcaption style={{ marginBottom: 14 }}>
        <span style={kicker}>Figure</span>
        <h4 style={{ font: `800 16px ${archivo}`, color: "var(--ink)", margin: "6px 0 2px" }}>{title}</h4>
        {sub && <p style={{ font: `500 13px/1.55 ${space}`, color: "var(--muted)", margin: "0 0 8px" }}>{sub}</p>}
      </figcaption>
      <div className="bf-chart" role="img" aria-label={`${title}. ${bars.map((b) => `${b.label}: ${b.display ?? b.value + unit}`).join("; ")}`}>
        {bars.map((b) => (
          <div className="bf-chart-row" key={b.label}>
            <div className="bf-chart-label">{b.label}</div>
            <div className="bf-chart-track">
              <div className="bf-chart-meter">
                <div className={b.accent ? "bf-chart-bar is-accent" : "bf-chart-bar"} style={{ width: `${Math.max(1.5, (b.value / max) * 100)}%` }} />
              </div>
              <div className={b.accent ? "bf-chart-val is-accent" : "bf-chart-val"}>{b.display ?? `${b.value}${unit}`}</div>
            </div>
          </div>
        ))}
        <div className="bf-chart-axis" aria-hidden="true"><span>0</span><span>{max}{unit}</span></div>
      </div>
      <p style={{ font: `500 10.5px/1.5 ${mono}`, color: "var(--muted)", margin: "12px 0 0", letterSpacing: ".02em" }}>{source}</p>
    </figure>
  );
}

function StatRow({ items }: { items: { big: string; label: string }[] }) {
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

const CHAIR_NORMS: [string, string, string][] = [
  ["60–64", "14", "12"],
  ["65–69", "12", "11"],
  ["70–74", "12", "10"],
  ["75–79", "11", "10"],
  ["80–84", "10", "9"],
  ["85–89", "8", "8"],
  ["90–94", "7", "4"],
];

const SOURCES: { n: number; text: string; url: string }[] = [
  { n: 1, text: "Goodpaster BH, et al. “The Loss of Skeletal Muscle Strength, Mass, and Quality in Older Adults: The Health, Aging and Body Composition Study.” Journals of Gerontology: Series A, 2006;61(10):1059–1064.", url: "https://academic.oup.com/biomedgerontology/article/61/10/1059/600461" },
  { n: 2, text: "Reid KF, Fielding RA. “Skeletal Muscle Power: A Critical Determinant of Physical Functioning in Older Adults.” Exercise and Sport Sciences Reviews, 2012;40(1):4–12.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3245773/" },
  { n: 3, text: "Studenski S, et al. “Gait Speed and Survival in Older Adults.” JAMA, 2011;305(1):50–58.", url: "https://jamanetwork.com/journals/jama/fullarticle/645520" },
  { n: 4, text: "Centers for Disease Control and Prevention. “Facts About Falls.” Older Adult Fall Prevention.", url: "https://www.cdc.gov/falls/data-research/facts-stats/index.html" },
  { n: 5, text: "Sherrington C, et al. “Exercise for preventing falls in older people living in the community.” Cochrane Database of Systematic Reviews, 2019, Issue 1, CD012424.", url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012424.pub2/full" },
  { n: 6, text: "Fiatarone MA, et al. “High-Intensity Strength Training in Nonagenarians: Effects on Skeletal Muscle.” JAMA, 1990;263(22):3029–3034.", url: "https://jamanetwork.com/journals/jama/article-abstract/382128" },
  { n: 7, text: "Momma H, et al. “Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: a systematic review and meta-analysis of cohort studies.” British Journal of Sports Medicine, 2022;56:755–763.", url: "https://bjsm.bmj.com/content/56/13/755" },
  { n: 8, text: "DeFronzo RA, Tripathy D. “Skeletal Muscle Insulin Resistance Is the Primary Defect in Type 2 Diabetes.” Diabetes Care, 2009;32(suppl 2):S157–S163.", url: "https://diabetesjournals.org/care/article/32/suppl_2/S157/27357/Skeletal-Muscle-Insulin-Resistance-Is-the-Primary" },
  { n: 9, text: "Centers for Disease Control and Prevention. STEADI — “Assessment: 30-Second Chair Stand.”", url: "https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf" },
  { n: 10, text: "World Health Organization. WHO Guidelines on Physical Activity and Sedentary Behaviour, 2020.", url: "https://www.ncbi.nlm.nih.gov/books/NBK566046/" },
  { n: 11, text: "Harvard Health Publishing. “Preserve your muscle mass.” Harvard Medical School.", url: "https://www.health.harvard.edu/staying-healthy/preserve-your-muscle-mass" },
  { n: 12, text: "U.S. Department of Health and Human Services. Physical Activity Guidelines for Americans, 2nd edition, 2018.", url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines" },
];

function Ref({ n }: { n: number }) {
  return (
    <a href={`#source-${n}`} style={{ font: `700 10px ${mono}`, color: "var(--green-dark)", textDecoration: "none", verticalAlign: "super", padding: "0 1px" }}>
      [{n}]
    </a>
  );
}

/* Article structured data. `citation` carries the source list through to
   crawlers, which is the point of a footnoted piece like this one. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Leg Strength: Why Strong Legs Matter More As You Age",
  description:
    "The evidence behind leg strength: how fast lower-body strength declines with age, why it predicts independence and survival, and what the research says actually works to rebuild it.",
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/training` },
  url: `${SITE_URL}/training`,
  datePublished: DATE_PUBLISHED,
  dateModified: DATE_MODIFIED,
  inLanguage: "en",
  articleSection: "Training",
  wordCount: 1950,
  author: { "@type": "Organization", name: "Bedrock.fit", url: SITE_URL },
  publisher: {
    "@type": "Organization",
    name: "Bedrock.fit",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
  },
  citation: SOURCES.map((s) => ({ "@type": "CreativeWork", name: s.text, url: s.url })),
};

export default function TrainingPage() {
  return (
    <div style={{ ...rootVars, background: "var(--paper)", minHeight: "100vh", color: "var(--body)", fontFamily: space }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── sticky nav — matches the home page ── */}
      <header className="lp-nav" style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        {/* flexWrap lets .lp-nav-links drop to its own row under 820px — see globals.css */}
        <div style={{ ...wrap, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "14px 20px" }}>
          <Logo />
          <nav className="lp-nav-links" aria-label="Main">
            <Link href="/#features" style={{ font: `600 14px ${space}`, color: "var(--body)", textDecoration: "none" }}>Features</Link>
            <Link href="/#archetypes" style={{ font: `600 14px ${space}`, color: "var(--body)", textDecoration: "none" }}>Archetypes</Link>
            <Link href="/training" style={{ font: `700 14px ${space}`, color: "var(--green-dark)", textDecoration: "none" }}>Training</Link>
            <Link href="/methodology" style={{ font: `600 14px ${space}`, color: "var(--body)", textDecoration: "none" }}>Methodology</Link>
          </nav>
          <Link href="/" className="lp-nav-cta" style={btnGreen}>Get my strength scan</Link>
        </div>
      </header>

      {/* ── article header ── */}
      <section style={{ background: "radial-gradient(1100px 480px at 50% -90px, var(--mint2), var(--paper) 75%)", padding: "60px 0 34px", textAlign: "center" }}>
        <div style={{ ...wrap, maxWidth: 860 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-soft)", color: "var(--green-dark)", borderRadius: 999, padding: "7px 16px", font: `700 12px ${space}`, letterSpacing: ".02em" }}>
            🦵 Training · Lower body
          </span>
          <h1 style={{ font: `800 clamp(34px, 5.6vw, 60px)/1.06 ${archivo}`, letterSpacing: "-.015em", color: "var(--ink)", margin: "22px auto 0", maxWidth: 820 }}>
            Leg <span style={{ color: "var(--green)" }}>Strength</span>
          </h1>
          <p style={{ font: `500 17.5px/1.65 ${space}`, color: "var(--muted)", maxWidth: 660, margin: "18px auto 0" }}>
            The simple case for strong legs — and why it gets more important, not less, with every decade you add.
          </p>
          <p style={{ font: `500 11.5px ${mono}`, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 20 }}>
            Bedrock.fit editorial · ~9 min read · Updated August 2026
          </p>
        </div>
      </section>

      {/* ── article body ── */}
      <main style={{ ...article, paddingBottom: 10 }}>
        <p style={{ ...p, font: `500 19px/1.7 ${space}`, color: "var(--ink)" }}>
          Almost everything you want to keep doing for the rest of your life runs through your legs. Standing up from a
          chair. Getting off the floor. Carrying groceries up a flight of stairs. Making it across an intersection before
          the light changes. Catching yourself when a curb comes earlier than you expected. None of that is a fitness
          goal, exactly — it&rsquo;s just ordinary life. But all of it is paid for out of the same account: the strength
          in your hips, thighs, and calves.
        </p>
        <p style={p}>
          That account has an unusual property. Left alone, it drains. Deliberately funded, it grows — at almost any age,
          including in people well into their nineties. What follows is the case for treating lower-body strength as a
          long-term asset rather than a gym vanity project, with the numbers behind it.
        </p>

        <h2 style={h2}>Your legs are the largest muscle system you own</h2>
        <p style={p}>
          The quadriceps, hamstrings, glutes, and calves together make up the biggest concentration of muscle tissue in
          the human body. That matters for reasons that go far beyond how much you can squat. Skeletal muscle is the
          primary site of glucose disposal — the tissue responsible for the large majority of insulin-stimulated glucose
          uptake after a meal<Ref n={8} />. Practically speaking, your legs are the biggest metabolic sink you have. A
          larger, more active, more insulin-sensitive sink handles a carbohydrate load more gracefully than a small,
          sedentary one.
        </p>
        <p style={p}>
          Muscle is also your structural insurance. It is the tissue that decelerates you when you trip, that protects a
          hip when you land, that keeps a knee tracking properly through a step-down. And because the legs are load-bearing
          by design, training them applies mechanical stress to exactly the bones — femur, pelvis, spine — where a fracture
          later in life is most consequential.
        </p>

        <h2 style={h2}>What actually declines, and how fast</h2>
        <p style={p}>
          The common framing is that we &ldquo;lose muscle&rdquo; with age. That&rsquo;s true, but it undersells the
          problem. After roughly age 30, most people shed something on the order of 3–5% of muscle mass per decade if
          they do nothing about it<Ref n={11} />. The more revealing data comes from the Health, Aging and Body
          Composition study, which tracked nearly 1,900 older adults and measured both thigh muscle area and actual knee
          extensor strength over three years<Ref n={1} />.
        </p>
        <p style={p}>
          Strength fell two to four times faster than muscle size. Losing mass isn&rsquo;t the whole story — the muscle
          you keep also gets worse at producing force.
        </p>

        <BarChart
          title="Strength declines faster than muscle size"
          sub="Annualized rate of loss in adults aged 70–79 over three years of follow-up."
          unit="%/yr"
          max={5}
          bars={[
            { label: "Knee extensor strength — men", value: 3.4, display: "3.4%/yr", accent: true },
            { label: "Knee extensor strength — women", value: 2.6, display: "2.6%/yr", accent: true },
            { label: "Thigh muscle area (both sexes)", value: 1.0, display: "~1.0%/yr" },
          ]}
          source="Source: Health, Aging and Body Composition Study, n = 1,880 [1]"
        />

        <p style={p}>
          It gets one layer worse. Muscle <em>power</em> — force produced quickly, which is what a stumble recovery or a
          fast step off a curb actually demands — declines earlier and more steeply than raw strength does. In
          comparisons of mobility-limited older adults against healthy peers, leg muscle power was reduced by around 65%
          while muscle mass differed by only about 13%<Ref n={2} />. Peak leg power turns out to predict chair-rise
          performance, stair-climbing, and walking speed better than strength alone.
        </p>
        <p style={p}>
          So the thing that goes first is not size. It&rsquo;s the ability to produce force <em>fast</em> — and that is
          also the thing most conventional exercise never trains.
        </p>

        <h2 style={h2}>Leg strength is a survival statistic</h2>
        <p style={p}>
          This is where the argument stops being about aesthetics. A pooled analysis of nine cohort studies — 34,485
          community-dwelling adults aged 65 and over, followed for as long as 21 years — found that walking speed tracked
          survival with remarkable consistency. Every 0.1 m/s of additional gait speed was associated with roughly a 12%
          lower risk of death<Ref n={3} />.
        </p>
        <p style={p}>
          The spread across the range is not subtle.
        </p>

        <BarChart
          title="Predicted 10-year survival at age 75, by walking speed"
          sub="Slowest walkers (under 0.4 m/s) compared with the fastest (over 1.4 m/s)."
          max={100}
          bars={[
            { label: "Men — slowest", value: 19, display: "19%" },
            { label: "Men — fastest", value: 87, display: "87%", accent: true },
            { label: "Women — slowest", value: 35, display: "35%" },
            { label: "Women — fastest", value: 91, display: "91%", accent: true },
          ]}
          source="Source: Studenski et al., JAMA 2011; pooled analysis of 9 cohorts, n = 34,485 [3]"
        />

        <p style={p}>
          Walking speed is not the same thing as leg strength, and nobody is claiming that walking faster on command adds
          years to your life. Gait speed is a summary measure — it reflects leg strength and power, joint health,
          balance, cardiovascular capacity, and neurological function all at once. That&rsquo;s precisely why it works so
          well as a signal. Notably, the authors found that age, sex, and gait speed alone predicted survival about as
          accurately as models loaded with chronic disease history, blood pressure, BMI, and hospitalization records.
        </p>
        <p style={p}>
          The practical reading: the systems that make you a fast, confident walker at 75 are systems worth defending at
          45.
        </p>

        <h2 style={h2}>The falls cascade — and how much of it is preventable</h2>
        <p style={p}>
          More than one in four adults over 65 falls each year in the United States. Those falls generate roughly 3
          million emergency department visits and about a million hospitalizations annually, including nearly 319,000
          hospitalizations for hip fracture. Falls cause the large majority of hip fracture deaths, and a single fall
          roughly doubles the odds of falling again<Ref n={4} />.
        </p>

        <StatRow
          items={[
            { big: "1 in 4", label: "Adults 65+ who fall each year" },
            { big: "3M", label: "Annual ER visits from falls" },
            { big: "319K", label: "Hip fracture hospitalizations/yr" },
          ]}
        />

        <p style={p}>
          A hip fracture is rarely a self-contained event. It is bed rest, deconditioning, lost confidence, reduced
          walking, further strength loss — a spiral that starts with one bad landing. The encouraging half of the picture
          is how responsive that risk is to training. A Cochrane review pooling 108 randomized trials across 23,407
          community-dwelling participants found that exercise reduced the <em>rate</em> of falls by about 23% overall,
          with the best results coming from programs that combined balance and functional work with resistance
          training<Ref n={5} />.
        </p>

        <BarChart
          title="Reduction in fall rate, by type of exercise program"
          sub="Community-dwelling older adults; pooled randomized controlled trials."
          max={40}
          bars={[
            { label: "Balance + functional + resistance", value: 34, display: "−34%", accent: true },
            { label: "Balance and functional exercise", value: 24, display: "−24%", accent: true },
            { label: "Tai chi", value: 19, display: "−19%" },
          ]}
          source="Source: Sherrington et al., Cochrane Database of Systematic Reviews 2019 [5]"
        />

        <p style={p}>
          A third fewer falls is a large effect for an intervention with no side-effect profile to speak of. And the
          mechanism is not mysterious: stronger, faster legs recover from a stumble that would otherwise become a fall.
        </p>

        <h2 style={h2}>&ldquo;But squats are bad for my knees&rdquo;</h2>
        <p style={p}>
          This is the most common objection to leg training, and it has the causality backwards more often than not.
          Weak quadriceps are a risk factor for knee pain and for the progression of knee osteoarthritis, not a
          consequence of avoiding load. Cartilage and tendon are living tissue: they adapt to appropriate, progressive
          mechanical stress and they degrade under disuse. The muscles crossing a joint are part of that joint&rsquo;s
          shock-absorption system, and a knee surrounded by strong, well-coordinated musculature spends less of its day
          absorbing force through passive structures.
        </p>
        <p style={p}>
          That does not mean any exercise at any load is fine for any knee. It means the answer to a cranky joint is
          usually a modified movement — a shorter range, a different foot position, a leg press instead of a barbell, more
          warm-up, slower progression — rather than no movement at all. If something hurts sharply, in the joint, during
          or after a set, that is information about your technique, range, or load, not a verdict on training legs.
        </p>
        <p style={p}>
          The same logic applies to bone. Bone remodels in response to the strain placed on it, which is why load-bearing
          resistance training is a first-line recommendation for preserving bone mineral density. The fracture you are
          trying to avoid at 80 is most likely to occur at the hip or spine — and those are precisely the sites that
          squats, hinges, and loaded carries stress.
        </p>

        <h2 style={h2}>Strength training and the long game</h2>
        <p style={p}>
          Zoom out from falls and the association holds across causes. A meta-analysis of prospective cohort studies
          found that muscle-strengthening activity was associated with roughly a 10–17% lower risk of all-cause
          mortality, along with 10–20% lower risk of cardiovascular disease and cancer. The dose that captured most of
          the benefit was modest — somewhere between 30 and 60 minutes per week — and adding aerobic activity on top
          pushed the associations considerably further<Ref n={7} />.
        </p>
        <p style={p}>
          Thirty to sixty minutes a week. That is two short sessions. The barrier to entry here is genuinely low, which
          makes the widespread avoidance of resistance training all the more expensive.
        </p>

        <h2 style={h2}>It is not too late — and that isn&rsquo;t a platitude</h2>
        <p style={p}>
          The most cited demonstration of this is now decades old and still striking. Researchers put nine frail nursing
          home residents, mean age 90, through eight weeks of progressive resistance training three times per week. Knee
          extensor strength rose by an average of 174%. Midthigh muscle area grew about 9%. Tandem walking speed improved
          48%<Ref n={6} />.
        </p>

        <BarChart
          title="Eight weeks of progressive resistance training at mean age 90"
          sub="Nine frail nursing-home residents, ages 86–96, training three times weekly."
          max={180}
          bars={[
            { label: "Knee extensor strength", value: 174, display: "+174%", accent: true },
            { label: "Tandem walking speed", value: 48, display: "+48%", accent: true },
            { label: "Midthigh muscle area", value: 9, display: "+9%" },
          ]}
          source="Source: Fiatarone et al., JAMA 1990 [6]"
        />

        <p style={p}>
          Two things stand out. First, the strength gains dwarfed the size gains — the same relationship seen in decline,
          running in reverse. Much of what you gain early is neural: better recruitment of the muscle you already have.
          Second, these were not healthy, motivated masters athletes. They were frail, institutionalized
          ninety-year-olds. If eight weeks can produce that, the phrase &ldquo;too old to start&rdquo; deserves
          retirement.
        </p>

        <h2 style={h2}>What actually works</h2>
        <p style={p}>
          The WHO recommends that all adults do muscle-strengthening activity involving major muscle groups on at least
          two days per week, and that adults 65 and over add multicomponent activity emphasizing balance and strength
          three or more days per week<Ref n={10} />. U.S. federal guidance is essentially the same<Ref n={12} />. Beneath
          that framework, a lower-body program only needs a handful of movement patterns.
        </p>

        <h3 style={h3}>1. Squat something, twice a week</h3>
        <p style={p}>
          Any loaded knee-bend counts: back squat, goblet squat, leg press, or a sit-to-stand from a low box if you are
          starting from scratch. Two to four sets in the 5–12 rep range, taken close enough to failure that the last
          couple of reps are genuinely hard. The load matters less than the effort and the consistency. What does matter is
          that it gets harder over time: add a little weight, a rep, or a set when the current version stops feeling
          difficult. Progressive overload is the whole mechanism — a program you never make harder eventually becomes
          maintenance, and maintenance loses slowly to the decline rates above.
        </p>

        <h3 style={h3}>2. Hinge at the hip</h3>
        <p style={p}>
          Deadlifts, Romanian deadlifts, hip thrusts, or back extensions train the posterior chain — glutes and hamstrings
          — which squats alone under-serve. This is the pattern that protects your back when you pick up something heavy
          and awkward, which is how most people actually hurt themselves.
        </p>

        <h3 style={h3}>3. Train one leg at a time</h3>
        <p style={p}>
          Walking, stairs, and stumble recovery are all single-leg events. Split squats, step-ups, and lunges expose and
          correct side-to-side imbalances that bilateral lifts hide, and they load balance and hip stability at the same
          time.
        </p>

        <h3 style={h3}>4. Train speed, not just strength</h3>
        <p style={p}>
          Because power declines fastest, add something explosive: a light jump, a fast concentric on the leg press, a
          brisk step-up, a med-ball throw. Keep the load light and the intent maximal — the goal is velocity, not
          fatigue. A few sets of 3–5 fast reps, early in the session while you are fresh, is enough.
        </p>

        <h3 style={h3}>5. Carry things and walk</h3>
        <p style={p}>
          Loaded carries and hills build the unglamorous, everyday capacity that shows up in gait speed. They also
          double as a signal you can monitor: if your usual walk to the store has quietly gotten slower over two years,
          that is data.
        </p>

        <h2 style={h2}>How to know whether it&rsquo;s working</h2>
        <p style={p}>
          Two tests need no equipment beyond a chair and a stopwatch. The 30-second chair stand — how many times you can
          rise fully from a standard chair without using your arms in 30 seconds — is the test the CDC&rsquo;s fall
          prevention program uses to flag risk. Below-average scores by age and sex are shown below<Ref n={9} />.
        </p>

        <div style={{ overflowX: "auto", margin: "22px 0 10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <caption style={{ captionSide: "top", textAlign: "left", font: `700 12px ${mono}`, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--green-dark)", paddingBottom: 10 }}>
              30-second chair stand — below-average score indicates fall risk
            </caption>
            <thead>
              <tr style={{ background: "var(--mint)" }}>
                <th style={{ textAlign: "left", padding: "11px 14px", font: `700 11.5px ${space}`, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>Age</th>
                <th style={{ textAlign: "left", padding: "11px 14px", font: `700 11.5px ${space}`, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>Men — fewer than</th>
                <th style={{ textAlign: "left", padding: "11px 14px", font: `700 11.5px ${space}`, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>Women — fewer than</th>
              </tr>
            </thead>
            <tbody>
              {CHAIR_NORMS.map(([age, m, w]) => (
                <tr key={age}>
                  <td style={{ padding: "10px 14px", font: `600 14px ${space}`, color: "var(--ink)", borderBottom: "1px solid var(--line)" }}>{age}</td>
                  <td style={{ padding: "10px 14px", font: `700 14px ${space}`, color: "var(--green-dark)", borderBottom: "1px solid var(--line)" }}>{m} stands</td>
                  <td style={{ padding: "10px 14px", font: `700 14px ${space}`, color: "var(--green-dark)", borderBottom: "1px solid var(--line)" }}>{w} stands</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ font: `500 11.5px/1.6 ${mono}`, color: "var(--muted)", margin: "0 0 22px" }}>Source: CDC STEADI, Assessment: 30-Second Chair Stand [9]</p>

        <p style={p}>
          The second is walking speed. Mark out four metres, walk it at your normal pace, divide distance by time.
          Anything comfortably above 1.0 m/s is reassuring; drifting below 0.8 m/s is worth paying attention to. Retest
          both every few months. If the chair stand number is climbing and your walk is holding or getting quicker, the
          program is doing its job — regardless of what the barbell says.
        </p>

        <h2 style={h2}>The short version</h2>
        <p style={p}>
          Lower-body strength declines faster than muscle mass, and power declines faster still. Those declines
          predict the loss of independence — slower walking, harder chair rises, more falls, more fractures — and the
          measures that capture them predict survival about as well as a full medical history. Two sessions a week,
          totalling under an hour, is associated with meaningfully lower mortality risk, and structured leg training
          cuts fall rates by roughly a third. The response to training persists into the tenth decade of life.
        </p>
        <p style={p}>
          Strong legs are not really about lifting. They are about how much of your own life you get to keep running
          yourself, and for how long.
        </p>

        <div style={{ background: "var(--mint)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 24px", margin: "34px 0 10px", textAlign: "center" }}>
          <h3 style={{ font: `800 19px ${archivo}`, color: "var(--ink)", margin: "0 0 8px" }}>Where do your legs stand right now?</h3>
          <p style={{ font: `500 14.5px/1.6 ${space}`, color: "var(--muted)", margin: "0 auto 18px", maxWidth: 460 }}>
            Enter one squat or deadlift set and get an estimated 1-rep max, your strength tier, and training zones — free, no signup.
          </p>
          <Link href="/" style={{ ...btnGreen, padding: "14px 26px", font: `800 14px ${archivo}` }}>Get my strength scan →</Link>
        </div>

        {/* ── sources, small print ── */}
        <section aria-labelledby="sources-heading" style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
          <h2 id="sources-heading" style={{ font: `700 11px ${mono}`, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 12px" }}>
            Sources
          </h2>
          <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
            {/* scrollMarginTop clears the sticky nav so a [n] jump doesn't land under it */}
            {SOURCES.map((s) => (
              <li key={s.n} id={`source-${s.n}`} style={{ font: `400 11.5px/1.7 ${space}`, color: "var(--muted)", marginBottom: 7, scrollMarginTop: 96 }}>
                {s.text}{" "}
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--green-dark)", textDecoration: "underline", wordBreak: "break-word" }}>
                  Link
                </a>
              </li>
            ))}
          </ol>
          <p style={{ font: `400 11px/1.7 ${space}`, color: "var(--muted)", margin: "16px 0 0", fontStyle: "italic" }}>
            This article is for general fitness and educational purposes only and is not medical or training advice.
            Figures cited are population-level associations and do not predict individual outcomes. Consult a qualified
            professional before beginning or changing an exercise program, particularly if you have existing health
            conditions or joint problems.
          </p>
        </section>
      </main>

      {/* ── footer — matches the home page ── */}
      <footer style={{ background: "var(--charcoal)", padding: "48px 0 32px", marginTop: 52 }}>
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
    </div>
  );
}
