import type { Category, CategorySlug } from "./types";

/**
 * The four sections the blog launches with.
 *
 * They are deliberately few and non-overlapping — four categories that each hold
 * a dozen articles beat ten that hold two. `covers` is the editorial fence: if a
 * piece doesn't obviously belong to exactly one of these, either it needs a
 * sharper angle or the taxonomy needs a fifth entry (candidates parked in
 * docs/ARTICLE-GUIDE.md).
 *
 * Order here is the order they appear on the /training index.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "strength-training",
    name: "Strength Training",
    short: "Strength",
    tagline: "How force is built, loaded and progressed.",
    description:
      "How you actually get stronger. Progressive overload, the movement patterns worth your time, how much load is enough, and what the research supports on sets, reps and frequency.",
    covers: [
      "progressive overload",
      "squat / hinge / carry patterns",
      "sets, reps, proximity to failure",
      "1RM estimation and strength standards",
      "power and rate of force development",
      "programme design",
    ],
  },
  {
    slug: "endurance",
    name: "Endurance",
    short: "Endurance",
    tagline: "Aerobic capacity, and why it outlives most fitness metrics.",
    description:
      "Aerobic fitness treated as a health measure, not a race result. VO2max and how long people live, zone 2 and threshold work, walking speed, and how endurance training sits alongside strength rather than cancelling it.",
    covers: [
      "VO2max and all-cause mortality",
      "zone 2, threshold and interval work",
      "walking speed and daily step volume",
      "concurrent training and the interference effect",
      "heart rate, HRV and effort measurement",
    ],
  },
  {
    slug: "over-40",
    name: "Over 40",
    short: "Over 40",
    tagline: "What changes after 40, and what turns out not to.",
    description:
      "Training once recovery starts to shift. Muscle loss and how fast strength goes, protein and hormones, joint wear, the risk of falls and breaks, and the evidence that you can still gain in your nineties.",
    covers: [
      "sarcopenia and age-related strength loss",
      "falls, fractures and bone density",
      "recovery capacity and training frequency",
      "menopause, andropause and body composition",
      "starting or restarting after a long layoff",
      "healthspan, independence and functional benchmarks",
    ],
  },
  {
    slug: "mobility-balance",
    name: "Mobility & Balance",
    short: "Mobility",
    tagline: "Range of motion, stability, and staying upright.",
    description:
      "What decides whether your strength is any use to you. How far your joints move, how steady you are on one leg, your sense of where your body is, and the balance work that cuts fall rates most in trials.",
    covers: [
      "hip, ankle and thoracic range of motion",
      "single-leg stability and proprioception",
      "balance training protocols",
      "stretching, whether static, dynamic or loaded",
      "warm-ups and movement prep",
      "working around a cranky joint",
    ],
  },
];

const BY_SLUG = new Map<CategorySlug, Category>(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: CategorySlug): Category {
  const category = BY_SLUG.get(slug);
  // Unreachable while `CategorySlug` and `CATEGORIES` agree — this exists so a
  // future slug added to the union but not the array fails loudly at build time.
  if (!category) throw new Error(`Unknown article category: ${slug}`);
  return category;
}
