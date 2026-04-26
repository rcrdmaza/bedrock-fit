// Animated running-superhero placeholder shown when an athlete hasn't
// uploaded an avatar. Pure SVG + CSS — server-rendered, no client JS,
// no external image fetch. Sized via the `size` prop so the same
// component drops into the 24-px header chip and the 96-px profile
// banner without re-styling.
//
// The animation uses CSS keyframes scoped by a unique id (so multiple
// instances on the same page can run in parallel). Three motions:
//   1. Body bob — small Y translation, faster than the legs to read
//      as a stride bounce.
//   2. Front/back leg swap — legs trade positions with a phase offset
//      so the silhouette always has one leg forward.
//   3. Cape flutter — slight skew that makes the cape ripple back as
//      the hero "moves into the wind."
//
// Why a custom illustration instead of an emoji or icon-pack glyph?
// Bedrock.fit's brand is running-specific, and the running pose reads
// instantly from a tiny circle — even at 24 px the alternating legs
// register as motion. The cartoon style also stays warm next to the
// stone-toned chrome rather than feeling like a missing-image glyph.

interface Props {
  // CSS size in pixels. Determines the SVG viewBox-to-screen scale;
  // every internal dimension is in viewBox units, so the proportions
  // stay correct from 16 px header glyphs up to 128 px profile heroes.
  size?: number;
  // Background color of the circular cap. Defaults to a soft sky tone
  // so the cape's red pops; pass a tier-aware tint when used on a
  // tiered profile (e.g. amber-100 for kickstarter rings).
  bgClassName?: string;
  // When true, skips the keyframe animation entirely — used for
  // print, or contexts where motion is distracting (the favicon,
  // future settings preview thumbnails).
  reducedMotion?: boolean;
}

export default function RunningHeroAvatar({
  size = 96,
  bgClassName = 'bg-sky-100',
  reducedMotion = false,
}: Props) {
  // Static keyframe namespace. Every instance generates the same
  // animation values, so duplicate `@keyframes rha-bob` blocks across
  // multiple <style> tags are idempotent — the browser merges them and
  // the cascade resolves consistently. We previously used Math.random
  // here, but that's an impure call during render; the unique scope
  // turned out not to be necessary because nothing per-instance
  // changes inside the keyframe rules.
  const id = 'rha';

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full ${bgClassName}`}
      style={{ width: size, height: size }}
      aria-label="Running superhero placeholder avatar"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Sky / horizon gradient inside the circle so the figure has
            depth. Two-stop linear from lighter top to slightly darker
            bottom. The outer div already clips to a circle so we just
            paint a full square here. */}
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <style>
            {/* Per-instance keyframes. We scope by attribute selector
                on the unique class names below so two instances of
                this component animate independently and a global
                reduced-motion override (e.g. `* { animation: none }`)
                stops them all gracefully. */}
            {!reducedMotion &&
              `
              @keyframes ${id}-bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-1.5px); }
              }
              @keyframes ${id}-frontleg {
                0%, 100% { transform: rotate(-25deg); }
                50% { transform: rotate(25deg); }
              }
              @keyframes ${id}-backleg {
                0%, 100% { transform: rotate(25deg); }
                50% { transform: rotate(-25deg); }
              }
              @keyframes ${id}-cape {
                0%, 100% { transform: skewY(-2deg) translateX(0); }
                50% { transform: skewY(2deg) translateX(1.5px); }
              }
              @keyframes ${id}-arm {
                0%, 100% { transform: rotate(-30deg); }
                50% { transform: rotate(30deg); }
              }
              .${id}-body { transform-origin: 50px 50px; animation: ${id}-bob 0.6s ease-in-out infinite; }
              .${id}-cape { transform-origin: 38px 42px; animation: ${id}-cape 0.6s ease-in-out infinite; }
              .${id}-front-leg { transform-origin: 48px 70px; animation: ${id}-frontleg 0.6s ease-in-out infinite; }
              .${id}-back-leg { transform-origin: 50px 70px; animation: ${id}-backleg 0.6s ease-in-out infinite; }
              .${id}-arm { transform-origin: 50px 52px; animation: ${id}-arm 0.6s ease-in-out infinite; }
              `}
          </style>
        </defs>

        {/* Background */}
        <rect width="100" height="100" fill={`url(#${id}-sky)`} />

        {/* Speed lines — three short strokes behind the hero suggesting
            forward motion. Static (the legs do the moving) so the eye
            has a stable element to read against. */}
        <g stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <line x1="10" y1="48" x2="22" y2="48" />
          <line x1="6" y1="58" x2="20" y2="58" />
          <line x1="12" y1="68" x2="24" y2="68" />
        </g>

        {/* The whole figure bobs together. */}
        <g className={`${id}-body`}>
          {/* Cape — drawn first so the body sits on top. Triangle-ish
              quad with a gentle curve at the tail. Color matches the
              "hero red" pop we use elsewhere on the brand. */}
          <path
            className={`${id}-cape`}
            d="M 38 42 Q 22 48 28 70 L 42 60 Z"
            fill="#dc2626"
          />

          {/* Back leg — drawn before the front so depth ordering reads
              correctly. Thin rounded rectangle. */}
          <rect
            className={`${id}-back-leg`}
            x="46"
            y="68"
            width="6"
            height="18"
            rx="2.5"
            fill="#1e3a8a"
          />

          {/* Front leg */}
          <rect
            className={`${id}-front-leg`}
            x="48"
            y="68"
            width="6"
            height="18"
            rx="2.5"
            fill="#1e40af"
          />

          {/* Boots — tiny rounded rects clipped to leg ends. Static so
              the silhouette doesn't wobble; the legs handle the motion. */}
          <ellipse cx="50" cy="86" rx="5" ry="2" fill="#fbbf24" />

          {/* Body / torso — chest emblem rendered as a star to keep
              the "hero" read at small sizes. */}
          <path
            d="M 40 50 Q 40 44 50 44 Q 60 44 60 50 L 60 68 Q 60 70 58 70 L 42 70 Q 40 70 40 68 Z"
            fill="#1d4ed8"
          />
          <polygon
            points="50,52 51.5,55.5 55.5,55.5 52.2,57.8 53.5,61.5 50,59.2 46.5,61.5 47.8,57.8 44.5,55.5 48.5,55.5"
            fill="#fbbf24"
          />

          {/* Arms — the visible (front) arm pumps; the far arm is
              implied. One arm reads as motion at small sizes. */}
          <rect
            className={`${id}-arm`}
            x="56"
            y="48"
            width="5"
            height="14"
            rx="2.5"
            fill="#1d4ed8"
          />

          {/* Head — a circle with a tiny mask band across the eyes. */}
          <circle cx="50" cy="38" r="8" fill="#fde68a" />
          <rect x="42" y="36" width="16" height="3" rx="1.2" fill="#1e3a8a" />
          {/* Hair tuft — a small dark crescent on top so the head has
              orientation and doesn't read as a generic blob. */}
          <path d="M 43 33 Q 50 28 57 33 Q 53 31 50 31 Q 47 31 43 33 Z" fill="#1f2937" />
          {/* Mouth — a calm line; we want "determined", not "scared". */}
          <line x1="48" y1="42" x2="52" y2="42" stroke="#7f1d1d" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
