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
        Bedrock.fit takes one set you have actually done. You tell it the lift,
        the weight, and how many reps you managed. You also give it your
        bodyweight and your sex. From that it works out a rough ceiling for your
        strength. You get an estimated one-rep max, a sense of where you sit
        against common strength standards, some useful training ranges, and a few
        playful projected feats. It is a quick snapshot. It is not a lab test.
      </p>

      <h2>Estimating your one-rep max</h2>
      <p>
        The estimate comes from the Epley formula. It is a well known way to work
        out a top-end lift from a lighter one, and the idea behind it is simple.
        The more reps you can do with a given weight, the further that weight
        sits below your true limit. The formula turns that gap into a number.
      </p>
      <p>
        It works best at low and moderate rep counts. The further past about ten
        reps you go, the more it drifts. That is because a long set leans on
        endurance as much as on strength, and endurance varies far more from one
        person to the next. So treat the number as an estimate rather than a
        measurement.
      </p>

      <h2>Beyond the baseline</h2>
      <p>
        The Epley number is only the starting point. From there we work out your
        strength level, your training ranges, and your projected feats. Each of
        those is weighted against published health and fitness standards. Those
        standards come from recognised bodies and from government health
        resources around the world. Using several sources rather than one keeps
        the results honest, and it lets us adjust them for sex and bodyweight.
      </p>

      <h2>Strength levels</h2>
      <p>
        We take your strength relative to your bodyweight and compare it against
        a blended set of published standards. That places you on a scale that
        runs from beginner to elite. The scale is smoothed, so a small change in
        what you enter moves your result a little rather than jumping you between
        labels. Supported lifts are the bench press, back squat, deadlift,
        overhead press, barbell curl, and tricep pushdown.
      </p>

      <h2>Training ranges</h2>
      <p>
        Based on your estimated one-rep max, we suggest general working ranges for
        three goals: maximal strength, muscle growth, and muscular endurance. The
        ranges follow widely accepted training principles.
      </p>

      <h2>Archetype and projected feats</h2>
      <p>
        The athlete archetype and the projected feats are for fun. They are rough
        guesses drawn from your strength level and your body stats, and they
        cover things like how many pull-ups you might manage, a rough run time,
        and whether a muscle-up is within reach. They are not measured results.
        They are not predictions either.
      </p>

      <h2>Important disclaimer</h2>
      <p>
        Bedrock.fit is provided for general fitness and entertainment purposes
        only. It is not medical, training, or nutritional advice. Its estimates
        may differ from what you can actually lift. Do not attempt a true one-rep
        max without a proper warm-up, sound technique, and someone on hand to
        help. Talk to a qualified professional before you start or change any
        exercise programme. That matters most if you have a health condition.
      </p>
    </SiteFrame>
  );
}
