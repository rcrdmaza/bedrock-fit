import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

/**
 * About Us.
 *
 * Deliberately short, and deliberately anonymous. No names, no personal email,
 * no founder story. The contact page already carries the one line about who
 * runs the site, and this page is about the idea rather than the person.
 *
 * House style applies even though `check-article` cannot see this file: no em
 * or en dashes anywhere, and the copy is written to sit at or below a ninth
 * grade reading level. Short sentences do most of that work.
 *
 * Linked from the footer only, labelled "About Us". It is not in the top
 * navigation on purpose, since the nav is for things a visitor came to do.
 */
export const metadata: Metadata = {
  /*
   * Pipe, not an em dash. Every other page on the site uses "X — Bedrock.fit",
   * which quietly breaks the no-dash rule in the one place it is most visible,
   * the search result. Those are already indexed, so changing them is a
   * separate decision; this page starts correct.
   */
  title: "About Us | Bedrock.fit",
  description:
    "Why Bedrock.fit exists: strong legs change how long you stay independent, and everything you do on your feet starts from the ground up. A short note on the idea behind the site.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us | Bedrock.fit",
    description:
      "Strong legs change how long you stay independent. Everything you do on your feet starts from the ground up. The idea behind Bedrock.fit.",
    url: "/about",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <SiteFrame tag="//ABOUT">
      <h1>About Us</h1>

      <p>
        This site started with a simple question. What actually happens to a
        person when their legs get weaker?
      </p>

      <p>
        The answer turned out to be bigger than we expected. Leg strength shows
        up in how easily you get out of a chair, how confident you feel on
        stairs, whether you take the walk or drive instead, and how long you keep
        living on your own terms. It shows up in how likely you are to fall, and
        in how well you recover if you do. Researchers have been measuring this
        for decades, and the pattern is remarkably consistent. Strong legs are
        tied to a longer, more independent life.
      </p>

      <p>
        Are other parts of your body important? Absolutely. Your heart matters
        more. So does your brain, your sleep, and the people around you. We are
        not here to argue that legs beat everything else, because they do not.
      </p>

      <p>
        But there is a large body of research, and a much larger body of ordinary
        human experience, showing how much changes when someone stops walking,
        stops moving, and stops asking anything of their legs. That slide is
        quiet, it is slow, and it is far easier to prevent than to reverse. It is
        also one of the few things in health where the fix is genuinely available
        to almost everybody.
      </p>

      <h2>Where the name comes from</h2>

      <p>
        There is an old saying that everything starts from your feet.
      </p>

      <p>
        Watch anybody do anything physical and you will see it. A jump shot
        starts with where the feet are planted. Catching a football starts with
        how the feet are set before the ball arrives. Kicking a soccer ball
        starts with the plant foot, not the kicking one. Everything above the
        ground is only as steady as what is on it, and the power travels upward
        from there.
      </p>

      <p>
        Bedrock is the solid layer underneath everything else. That felt like the
        right name for a site about the part of you that holds the rest up.
      </p>

      <h2>What we try to do here</h2>

      <p>
        We look for the good evidence, read it properly, and then explain what it
        says in plain language. Every number on this site traces back to a
        numbered source, and every one of those sources gets opened and read
        before it is cited.
      </p>

      <p>
        We also try to make it enjoyable. Health writing has a habit of being
        either frightening or dull, and neither one gets anybody to train. This
        should be interesting to read even when you are not planning to do
        anything about it yet.
      </p>

      <p>
        None of it assumes a particular starting point. It does not matter how
        old you are, what sport you like, whether you have ever lifted anything
        in your life, or what your body will and will not let you do right now.
        There is almost always a version of this that fits, and finding that
        version is the interesting part.
      </p>

      <h2>Our mission</h2>

      <p>
        To help anyone, at any age, treat their legs as something worth keeping
        strong, and to make that feel like an invitation rather than a warning.
      </p>

      <p>
        You can read the{" "}
        <Link href="/training">training articles</Link> for the long-form,
        sourced pieces, or start with the{" "}
        <Link href="/">strength scan</Link> if you want a number to work from.
      </p>
    </SiteFrame>
  );
}
