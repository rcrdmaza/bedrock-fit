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
      "The mechanics of getting stronger: progressive overload, the movement patterns that matter, how much load is enough, and what the research actually supports about sets, reps and frequency.",
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
      "Cardiorespiratory fitness as a health variable rather than a race result: VO2max and mortality, zone 2 and threshold work, walking and gait speed, and how endurance training interacts with strength rather than cancelling it.",
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
      "Training when the recovery curve shifts: sarcopenia and the rate of strength loss, protein and hormonal changes, joint wear, fall and fracture risk, and the evidence that trainability persists into the ninth and tenth decades.",
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
      "The qualities that decide whether strength is usable: joint range of motion, single-leg stability, proprioception, and the balance training that shows the largest effect on fall rates in randomised trials.",
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
