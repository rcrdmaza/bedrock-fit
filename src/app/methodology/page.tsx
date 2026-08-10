import type { Metadata } from "next";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "How Bedrock.fit Works (Methodology)",
  description:
    "How Bedrock.fit estimates your strength ceiling: the Epley baseline, weighting against recognized health and fitness standards, strength levels, and training ranges.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <SiteFrame tag="//METHOD">
      <h1>How Bedrock.fit Works</h1>
      <p className="eff">Methodology, last updated July 3, 2026</p>

      <h2>What this tool does</h2>
      <p>
        Bedrock.fit takes one set you&rsquo;ve actually performed. You give it the
        exercise, the weight, and the number of repetitions, along with your
        bodyweight and sex. From that it estimates your strength ceiling: an
        approximate one-rep max, where you fall on common strength standards,
        useful training ranges, and a few playful projected feats. It&rsquo;s a
        quick snapshot, not a laboratory measurement.
      </p>

      <h2>Estimating your one-rep max</h2>
      <p>
        Your estimated one-rep max is derived from your submaximal set using the
        Epley formula, a widely recognized method for estimating maximal strength
        from a lighter set. It is most reliable in the low-to-moderate repetition
        range, and its accuracy decreases as repetitions increase, since
        higher-rep performance depends more heavily on muscular endurance. The
        result should be treated as an estimate.
      </p>

      <h2>Beyond the baseline</h2>
      <p>
        The Epley estimate is only the baseline. From there we work out your
        strength level, your training ranges, and your projected results. Each of
        those is weighted against established health and fitness standards, drawn
        from recognised authorities and from government health resources around
        the world.
        This keeps the outputs grounded in credible benchmarks rather than any
        single source, and allows results to be adjusted appropriately for
        factors such as sex and bodyweight.
      </p>

      <h2>Strength levels</h2>
      <p>
        We compare your bodyweight-relative strength to a blended set of
        published standards and place you on a scale from beginner through elite,
        interpolating your position so that small changes in your inputs move the
        result smoothly rather than jumping between labels. Supported lifts
        include the bench press, back squat, deadlift, overhead press, barbell
        curl, and tricep pushdown.
      </p>

      <h2>Training ranges</h2>
      <p>
        Based on your estimated one-rep max, we suggest general working ranges for
        three goals: maximal strength, muscle growth, and muscular endurance. The
        ranges follow widely accepted training principles.
      </p>

      <h2>Archetype and projected feats</h2>
      <p>
        The athlete archetype and the projected feats (such as estimated
        pull-ups, a rough run time, and muscle-up likelihood) are playful
        extrapolations from your strength level and body statistics. They are
        intended for entertainment and motivation, and are not measured results
        or predictions.
      </p>

      <h2>Important disclaimer</h2>
      <p>
        Bedrock.fit is provided for general fitness and entertainment purposes
        only. It does not constitute medical, training, or nutritional advice,
        and its estimates may differ from your actual results. Do not attempt a
        true one-rep max without proper warm-up, technique, and appropriate
        supervision. Consult a qualified professional before beginning or
        changing any exercise program, particularly if you have any underlying
        health conditions.
      </p>
    </SiteFrame>
  );
}
