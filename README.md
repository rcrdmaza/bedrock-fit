# Bedrock.fit

A single-page **athletic potential calculator**. Enter your sex, bodyweight,
and one lift (weight × reps) and it estimates your 1-rep max, strength level
(vs. blended global standards), training zones, and a playful "athlete
archetype" plus projected pull-ups / 5K / muscle-up.

No database, no auth, no server state — it's a static single page. All the
math runs in the browser.

## Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript**
- One page: `src/app/page.tsx` (client component)

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build && npm run start
```

## Environment variables

| Name                   | Required | Purpose                                                        |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | no       | Canonical/OG base URL. Defaults to `https://bedrock.fit`.      |

## Deploy

Hosted on Vercel: `main` → production, every branch/PR → a preview (staging)
URL. See `DEPLOY.md` for the one-time Vercel + GoDaddy DNS setup.

## Revenue hooks (stubbed)

- Google AdSense loader is wired in `src/app/layout.tsx` (publisher
  `ca-pub-4738526719801061`, carried over from the prior site). Drop `<ins
  class="adsbygoogle">` units where the `AD SLOT` placeholder is.
- Affiliate link slots live at the bottom of the results card in
  `src/app/page.tsx`.

## Notes

The strength standards in `page.tsx` (`MALE` table) are an approximate blend
of published bodyweight-multiple benchmarks and are meant to be tuned. The
"fun" projections (pull-ups, 5K, muscle-up) are intentionally playful, not
scientific.
