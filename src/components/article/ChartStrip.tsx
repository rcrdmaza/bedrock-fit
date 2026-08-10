"use client";

import { useEffect, useRef, useState } from "react";
import type { Block } from "@/lib/articles/types";
import { archivo, kicker, space } from "../LightFrame";

/* ── chart strip ───────────────────────────────────────────────────────── */

type ChartsBlock = Extract<Block, { type: "charts" }>;
type PanelData = ChartsBlock["panels"][number];

/**
 * Two to four charts in a strip that advances itself.
 *
 * The strip is pulled wider than the 720px reading measure using negative
 * margins, so it reads as a break in the column rather than another box inside
 * it. It stays inside the page gutter on narrow screens, where there is no
 * width to borrow.
 *
 * Colours come from the article palette only: `--green` for the figure being
 * argued, `--green-soft` family for everything it is being compared against.
 *
 * This file is a client component and the rest of the article is not. That is
 * deliberate and the boundary is drawn here rather than around `blocks.tsx`,
 * which would otherwise ship an entire article renderer to the browser to
 * animate one section.
 */

/**
 * How long each panel holds at centre.
 *
 * Short. A reader who wants to study a panel stops it by hovering, tabbing to
 * it or touching it, and it stays stopped until they leave.
 */
const HOLD_MS = 1000;

/** Idle time after a manual scroll or touch before rotation resumes. */
const RESUME_MS = 4000;

function Panel({ panel }: { panel: PanelData }) {
  const { kind, caption, max, unit = "%", bars } = panel;
  const label = `${caption}. ${bars.map((b) => `${b.label}: ${b.display ?? b.value + unit}`).join("; ")}`;

  return (
    <figure className="bf-strip-panel" role="img" aria-label={label}>
      <figcaption className="bf-strip-cap">{caption}</figcaption>

      {kind === "bar" && (
        <div className="bf-chart">
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
        </div>
      )}

      {kind === "column" && (
        <div className="bf-col">
          {bars.map((b) => (
            <div className="bf-col-item" key={b.label}>
              <div className="bf-col-val">{b.display ?? `${b.value}${unit}`}</div>
              <div className="bf-col-track">
                <div className={b.accent ? "bf-col-bar is-accent" : "bf-col-bar"} style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }} />
              </div>
              <div className="bf-col-label">{b.label}</div>
            </div>
          ))}
        </div>
      )}

      {kind === "line" && (
        <div className="bf-line">
          {/* SVG carries the stroke only. Labels stay in HTML so they never
              scale with the viewBox, which is the failure the CSS charts exist
              to avoid. preserveAspectRatio none lets the path stretch. */}
          <svg className="bf-line-svg" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={bars.map((b, i) => `${(i / Math.max(1, bars.length - 1)) * 100},${40 - (b.value / max) * 38}`).join(" ")}
              fill="none"
              stroke="var(--green)"
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <div className="bf-line-dots">
            {bars.map((b, i) => (
              <span key={b.label} className="bf-line-dot" style={{ left: `${(i / Math.max(1, bars.length - 1)) * 100}%`, bottom: `${(b.value / max) * 95}%` }} />
            ))}
          </div>
          <div className="bf-line-axis">
            {bars.map((b) => (
              <div key={b.label} className="bf-line-tick">
                <span className="bf-line-num">{b.display ?? `${b.value}${unit}`}</span>
                <span className="bf-line-lab">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === "donut" && (
        <div className="bf-donut-wrap">
          {bars.slice(0, 1).map((b) => (
            <div key={b.label} className="bf-donut" style={{ ["--pct" as string]: `${Math.min(100, b.value)}%` }}>
              <div className="bf-donut-hole">
                <span className="bf-donut-val">{b.display ?? `${b.value}${unit}`}</span>
              </div>
            </div>
          ))}
          <p className="bf-donut-label">{bars[0]?.label}</p>
        </div>
      )}
    </figure>
  );
}

export function ChartStrip({ title, sub, panels, source }: Omit<ChartsBlock, "type">) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* Centre-nearest panel wins the focus, whether it arrived there by the timer
     or by the reader's thumb. Deriving it from scroll position rather than
     from the timer's own index keeps the two in agreement after a manual
     scroll, which is the case where an index-only implementation drifts. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    /* `is-live` gates every visual difference this component introduces: the
       blur, the scale, the dots. Until this line runs the markup is a plain
       scrollable strip, which is what a reader with JavaScript off and every
       crawler gets. A blur written into the stylesheet unconditionally would
       leave all but one panel permanently unreadable for them. It is set on
       the DOM rather than held in state because it is a one-way switch that
       nothing re-renders on. */
    el.closest(".bf-strip")?.classList.add("is-live");

    let frame = 0;
    const measure = () => {
      frame = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      const kids = Array.from(el.querySelectorAll<HTMLElement>(".bf-strip-slot"));
      let best = 0;
      let bestGap = Infinity;
      kids.forEach((k, i) => {
        const gap = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid);
        if (gap < bestGap) {
          bestGap = gap;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* Rotation. Four things stop it, and all four are the reader telling us they
     want to look at something: the pointer is over the strip, focus is inside
     it, they scrolled it themselves within the last few seconds, or the strip
     is not on screen at all. The last one matters most — an unwatched carousel
     scrolling in a background tab is pure battery. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let held = false;
    let onScreen = false;
    let touchedAt = 0;

    const step = () => {
      if (held || !onScreen) return;
      if (Date.now() - touchedAt < RESUME_MS) return;
      const kids = Array.from(el.querySelectorAll<HTMLElement>(".bf-strip-slot"));
      if (kids.length < 2) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let cur = 0;
      let bestGap = Infinity;
      kids.forEach((k, i) => {
        const gap = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid);
        if (gap < bestGap) {
          bestGap = gap;
          cur = i;
        }
      });
      const next = kids[(cur + 1) % kids.length];
      el.scrollTo({ left: next.offsetLeft + next.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
    };

    const timer = window.setInterval(step, HOLD_MS);
    const hold = () => {
      held = true;
    };
    const release = () => {
      held = false;
    };
    const touched = () => {
      touchedAt = Date.now();
    };

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
    }, { threshold: 0.35 });
    io.observe(el);

    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", release);
    el.addEventListener("touchstart", touched, { passive: true });
    el.addEventListener("wheel", touched, { passive: true });

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("touchstart", touched);
      el.removeEventListener("wheel", touched);
    };
  }, []);

  const go = (i: number) => {
    const el = rail.current;
    const k = el?.querySelectorAll<HTMLElement>(".bf-strip-slot")[i];
    if (!el || !k) return;
    el.scrollTo({ left: k.offsetLeft + k.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  };

  return (
    <section className="bf-strip" aria-label={title} aria-roledescription="carousel">
      <div className="bf-strip-head">
        <span style={kicker}>Figures</span>
        <h4 style={{ font: `800 16px ${archivo}`, color: "var(--ink)", margin: "6px 0 2px" }}>{title}</h4>
        {sub && <p style={{ font: `500 13px/1.55 ${space}`, color: "var(--muted)", margin: "0 0 4px" }}>{sub}</p>}
        <p className="bf-strip-hint" aria-hidden="true">Hover or touch to hold a panel</p>
      </div>

      <div className="bf-strip-rail" ref={rail}>
        <span className="bf-strip-pad" aria-hidden="true" />
        {panels.map((p, i) => (
          <div key={p.caption} className={i === active ? "bf-strip-slot is-focus" : "bf-strip-slot"}>
            <Panel panel={p} />
          </div>
        ))}
        <span className="bf-strip-pad" aria-hidden="true" />
      </div>

      {/* Hidden by the stylesheet until `is-live` is set, because with no script
          these are dead controls under a strip that already scrolls. Hidden
          with display:none rather than opacity, so they stay out of the tab
          order too. */}
      <div className="bf-strip-dots">
        {panels.map((p, i) => (
          <button
            key={p.caption}
            type="button"
            className={i === active ? "bf-strip-dot is-on" : "bf-strip-dot"}
            aria-label={`Show figure ${i + 1}: ${p.caption}`}
            aria-current={i === active}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <p className="bf-strip-src">{source}</p>
    </section>
  );
}
