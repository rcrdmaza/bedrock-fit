import type { Article } from "../types";

/**
 * Highest-traffic piece in batch 1: it answers a question people actually type.
 *
 * The honest answer has three parts and the article refuses to collapse them.
 * Load at depth is real. Evidence that it damages healthy knees is not there.
 * And the data that does show harm (former elite weightlifters, occupational
 * kneeling) points at body mass and cumulative hours rather than at depth,
 * which is why the piece ends up arguing that depth is the wrong variable to
 * worry about rather than that squats are simply fine.
 */
export const squatsKnees: Article = {
  slug: "squats-knees",
  title: "Do Squats Wreck Your Knees?",
  titleAccent: "Wreck Your Knees?",
  seoTitle: "Do Squats Wreck Your Knees? What the Evidence Says",
  description:
    "Deep squats load the knee heavily, and that part is true. Whether the load damages a healthy joint is a different question, and the answer surprises most people.",
  dek:
    "The load at the bottom of a squat is real. The damage everyone worries about turns out to be very hard to find in the evidence.",
  category: "strength-training",
  topic: "Lower body",
  tags: ["squats", "knee pain", "squat depth", "knee osteoarthritis", "technique"],
  published: "2026-08-09",
  updated: "2026-08-09",
  readingMinutes: 11,
  wordCount: 2327,
  draft: false,

  ogStats: [
    ["13 of 15", "studies found no harm"],
    ["30%", "less knee force at depth"],
    ["9 sources", "peer-reviewed"],
  ],

  blocks: [
    {
      type: "lede",
      text: "Somebody has told you that squats are bad for your knees. Possibly a physiotherapist, possibly an uncle, possibly a coach who heard it from their own coach. The advice is usually the same: do not let your knees go past your toes, and never go below parallel. It is one of the most repeated pieces of gym advice there is, and it has almost no support in the research.",
    },
    {
      type: "p",
      text: "That is not the same as saying squats are risk free, and this article is not going to pretend otherwise. There is real evidence of knee damage in people who squat a great deal. The interesting part is what that evidence actually blames, because it is not depth.",
    },

    { type: "h2", text: "Where the advice came from" },
    {
      type: "p",
      text: "The idea has a traceable origin, which is unusual for gym folklore. In the 1960s a researcher called Karl Klein ran a set of studies on what deep squatting did to knee ligaments. He measured weightlifters, compared them with people who did not squat, and concluded that the deep squat left the knee unstable and the cruciate ligament loose[^2].",
    },
    {
      type: "p",
      text: "That conclusion travelled a long way. It was picked up by the mainstream press, and deep squatting was dropped from military and school physical training programmes on the strength of it. Two generations of coaching advice grew out of one set of measurements.",
    },
    {
      type: "p",
      text: "Those measurements have not held up. The recent review that revisited them points out that Klein leaned on an unspecified orthopaedic test standard and an unvalidated instrument for measuring how loose a knee was, and that he ignored ligament stiffness and force capacity entirely[^2]. In other words the tool was never shown to measure the thing it claimed to measure.",
    },
    {
      type: "p",
      text: "None of which stopped the advice. Guidance outlives its evidence easily, especially guidance that sounds cautious. Telling somebody not to do something feels like the safe option, and it almost never gets audited afterwards.",
    },

    { type: "h2", text: "What actually happens to the knee at depth" },
    {
      type: "p",
      text: "Start with the mechanics, because this is the part most people get backwards.",
    },
    {
      type: "p",
      text: "Force on the back of the kneecap does rise as you bend. It does not keep rising all the way down. A review of squat depth and joint load found that pressure behind the kneecap peaks at around 90 degrees of knee bend[^1]. That is roughly a parallel squat. Go deeper and it starts to come down again.",
    },
    {
      type: "p",
      text: "Two things cause that. As the knee bends further, the tendon wraps around the end of the thigh bone and spreads the load over more surface, so the pressure at any one point drops[^1]. And at the very bottom, the back of your thigh makes contact with your calf. That contact takes some of the load directly. One review puts the resulting reduction in compressive force at roughly 30%[^2].",
    },
    {
      type: "charts",
      title: "Load on the kneecap does not rise all the way down",
      sub: "Pressure behind the kneecap by depth, and what contact between thigh and calf takes off the joint at the bottom.",
      panels: [
        {
          kind: "column",
          caption: "Pressure behind the kneecap peaks near parallel",
          max: 100,
          bars: [
            { label: "Quarter squat", value: 45, display: "low" },
            { label: "Half squat, 90°", value: 100, display: "peak", accent: true },
            { label: "Deep squat", value: 70, display: "falling" },
          ],
        },
        {
          kind: "donut",
          caption: "Compressive force removed by thigh to calf contact at the bottom",
          max: 100,
          bars: [{ label: "Force taken off the joint", value: 30, display: "30%", accent: true }],
        },
        {
          kind: "bar",
          caption: "How the 15 studies in the scoping review came out",
          max: 15,
          bars: [
            { label: "Found no harm to healthy knees", value: 13, display: "13", accent: true },
            { label: "Suggested possible harm", value: 2, display: "2" },
          ],
        },
      ],
      source: "Hartmann, Wirth and Klusemann, Sports Medicine, 2013 [1]; scoping review in Frontiers in Sports and Active Living, 2024 [2]. The depth panel is the shape of the relationship those reviews describe, not a single measured dataset.",
    },
    {
      type: "p",
      text: "So the position everyone recommends as the safe one, stopping at parallel, is close to the position where pressure behind the kneecap is highest. And the position everyone warns about is where it has started to fall again. That is the opposite of the standard advice.",
    },
    {
      type: "p",
      text: "It is also worth knowing that deep knee bend is not chaotic. A review pulling together 12 studies of healthy knees, covering 164 living participants, found consistent patterns of movement across squatting, lunging and kneeling[^9]. Past about 120 degrees the shin rotates inwards and the thigh bone rolls backwards on it, in much the same way from person to person. The joint has an orderly way of getting down there. It is not improvising.",
    },
    {
      type: "callout",
      title: "The uncomfortable implication",
      text: "If you stop at parallel because you were told deep squats are dangerous, you are spending your time at the depth with the most pressure behind the kneecap and getting less strength for it.",
    },

    { type: "h2", text: "What the evidence on damage says" },
    {
      type: "p",
      text: "Mechanics tell you about load. They do not tell you whether load causes harm, and those are genuinely different questions. Bone and cartilage adapt to load. That is how they stay healthy.",
    },
    {
      type: "p",
      text: "A 2024 scoping review gathered what exists on deep squats and the structures inside the knee: 15 studies, including cohort studies, randomised trials and earlier reviews. Thirteen of them found no harm to knee health. Two suggested a possible problem, and one of those was a single case report[^2].",
    },
    {
      type: "p",
      text: "The authors concluded that the deep squat appears to be safe for knee joint health and can be included in training without risk, as long as technique holds up[^2]. They also noted something that runs against the whole fear: cartilage appears to thicken in response to the load, which would make it more protected rather than less[^2].",
    },
    {
      type: "p",
      text: "The load review reached the same place from the mechanics side. Its authors wrote that concerns about a higher risk of cartilage damage and arthritis from deep squats are unfounded, and went further. They argued that half and quarter squats loaded with very heavy weight are the ones more likely to drive degenerative change, because you can load them so much more[^1].",
    },
    {
      type: "p",
      text: "That last point is worth holding onto. A quarter squat lets you put far more weight on the bar. Shortening the range does not reduce the load on the joint. It usually raises it, while also making the movement easier to load past what your technique can handle.",
    },
    {
      type: "video",
      youtubeId: "hv2Vmezam80",
      title: "Are Deep Squats Bad For Your Knees? |#AskSquatU Show Ep. 23|",
      caption: "A physical therapist walking through the same mechanics with a barbell in hand. Useful for seeing what the wrapping effect and the thigh to calf contact actually look like.",
    },

    { type: "h2", text: "But some people who squat a lot do get bad knees" },
    {
      type: "p",
      text: "Here is where an honest article has to slow down, because there is evidence pointing the other way and it deserves to be dealt with properly rather than skipped.",
    },
    {
      type: "p",
      text: "A study of 117 retired male elite athletes found knee arthritis in 31% of the former weightlifters. Among the shooters, who served as a low-load comparison, the figure was 3%. The weightlifters had the highest rate of arthritis behind the kneecap specifically, at 28%[^3].",
    },
    {
      type: "p",
      text: "That looks damning until you read what the authors concluded caused it. They attributed the raised risk in the weightlifters largely to high body mass, and in the footballers largely to previous knee injuries[^3]. Body mass at age 20 carried its own clear association with later arthritis. Squat depth was not the variable that came out of the analysis.",
    },
    {
      type: "p",
      text: "It is also worth being clear about who these men were. They were top level competitive athletes in an era of heavy body mass at the highest weight classes, training loads far beyond anything recreational, over careers measured in decades. That is not a good model for someone doing three sets twice a week.",
    },
    {
      type: "charts",
      title: "Knee arthritis in former elite athletes, and what the authors blamed",
      sub: "117 retired male athletes aged 45 to 68, compared with shooters as a low-load group.",
      panels: [
        {
          kind: "bar",
          caption: "Knee arthritis by former sport",
          max: 35,
          bars: [
            { label: "Weightlifters", value: 31, display: "31%", accent: true },
            { label: "Footballers", value: 29, display: "29%" },
            { label: "Runners", value: 14, display: "14%" },
            { label: "Shooters", value: 3, display: "3%" },
          ],
        },
        {
          kind: "column",
          caption: "Odds ratios the analysis actually identified",
          max: 6,
          bars: [
            { label: "Previous knee injury", value: 4.73, display: "4.73×", accent: true },
            { label: "Playing football", value: 5.21, display: "5.21×", accent: true },
            { label: "BMI at 20, per unit", value: 1.76, display: "1.76×" },
          ],
        },
      ],
      source: "Kujala et al., Arthritis and Rheumatism, 1995 [3]",
    },

    { type: "h2", text: "The strongest case against squatting is not about lifting" },
    {
      type: "p",
      text: "There is one body of evidence that genuinely links squatting to knee arthritis, and it comes from workplaces rather than gyms.",
    },
    {
      type: "p",
      text: "A dose response review of occupational knee loading found that risk of knee arthritis rose with cumulative hours spent kneeling or squatting at work. Each additional 5,000 hours of lifetime kneeling carried about a 26% increase in risk[^4].",
    },
    {
      type: "p",
      text: "Take that seriously, then look at the unit. Five thousand hours. A tiler or a roofer spends their working life in that position. Someone squatting in a gym might accumulate a few minutes of actual time under load per session. Even after years of consistent training, the total sits nowhere near the exposure that review was measuring.",
    },
    {
      type: "p",
      text: "So the finding is real and it is also almost irrelevant to the question people are asking. Sustained, unloaded, hours-long squatting as a job is a different exposure from a handful of loaded repetitions twice a week. Same joint angle, wildly different dose.",
    },
    {
      type: "quote",
      text: "The evidence that squatting harms knees is mostly about hours, not about depth. Nobody in a gym is anywhere near the hours.",
    },

    { type: "h2", text: "What depth actually buys you" },
    {
      type: "p",
      text: "If depth were merely safe, it would still be optional. It is better than that.",
    },
    {
      type: "p",
      text: "In a 12 week trial, two groups of men trained with heavy squats. One group went to about 120 degrees of knee bend, the other stopped at about 60. The deep group gained more muscle in the front of the thigh and gained strength across a wider range of positions. They also improved their jump height by about 15%[^5].",
    },
    {
      type: "p",
      text: "The shallow group did improve, but mostly at the depth they trained. Their one rep max in a shallow squat rose by 36%, while their deep squat max rose only 9%[^5]. Strength turns out to be fairly specific to the range you build it in, which means a shallow squat buys you shallow strength.",
    },
    {
      type: "p",
      text: "That matters outside the gym in the obvious way. Getting off a low seat, picking a child up off the floor and climbing out of a car all happen in deep knee bend. Strength that stops at parallel is not there when you need it.",
    },
    {
      type: "charts",
      title: "Twelve weeks of deep squats against shallow squats",
      sub: "17 men, training heavy to either 120 degrees or 60 degrees of knee bend.",
      panels: [
        {
          kind: "bar",
          caption: "Strength gain by the depth it was tested at",
          max: 40,
          bars: [
            { label: "Shallow group, tested shallow", value: 36, display: "+36%" },
            { label: "Shallow group, tested deep", value: 9, display: "+9%", accent: true },
            { label: "Deep group, either depth", value: 20, display: "+20%", accent: true },
          ],
        },
        {
          kind: "column",
          caption: "What the deep group also gained",
          max: 20,
          bars: [
            { label: "Jump height", value: 15, display: "+15%", accent: true },
            { label: "Front thigh muscle", value: 5.5, display: "4-7%" },
          ],
        },
      ],
      source: "Bloomquist et al., European Journal of Applied Physiology, 2013 [5]",
    },

    { type: "h2", text: "“So why do my knees hurt when I squat?”" },
    {
      type: "p",
      text: "Because none of the above says squatting cannot hurt. It says depth is not the reason. Knee pain during squats usually traces back to something else, and it is worth separating the causes.",
    },
    {
      type: "list",
      items: [
        "**Load added faster than tissue adapted.** The most common cause by a distance. Tendon and cartilage adjust slowly, and they do not care that the number on the bar felt achievable.",
        "**Volume, not depth.** Going from one session a week to four is a bigger change than going from parallel to deep.",
        "**An existing problem.** The safety studies deliberately excluded people with cartilage damage, meniscus tears and ligament injuries[^2]. If you are in that group, the finding does not cover you.",
        "**Technique falling apart under weight.** Depth held with control is not the same movement as depth collapsed into.",
      ],
    },
    {
      type: "p",
      text: "The distinction that matters is between a joint that hurts because it is being asked to do something new and a joint that hurts because something in it is damaged. The first improves with sensible progression. The second needs an assessment. Pain that is sharp, that swells, that locks or that gives way belongs in a clinic, not in an article.",
    },
    {
      type: "callout",
      title: "Worth saying plainly",
      text: "If your knees already hurt, none of the reassuring evidence here was collected on people like you. It was collected on healthy knees. Get it looked at, then come back to the depth question.",
    },
    {
      type: "p",
      text: "If you want a plain description of what knee arthritis is and how it is managed before you see anyone, the National Institute of Arthritis and Musculoskeletal and Skin Diseases keeps a readable overview of [osteoarthritis and how it is treated](https://www.niams.nih.gov/health-topics/osteoarthritis). It is a better starting point than a search engine.",
    },

    { type: "h2", text: "Strength is the treatment, not the risk" },
    {
      type: "p",
      text: "There is one more turn in this, and it is the one that reframes the whole question.",
    },
    {
      type: "p",
      text: "For people who already have knee arthritis, exercise is not merely permitted. It is a first line treatment. A Cochrane review of 54 studies found that exercise reduced pain and improved physical function, with the pain benefit worth about 12 points on a 100 point scale immediately after treatment[^6]. A more recent network analysis of resistance training specifically reached the same conclusion across every type it compared[^7].",
    },
    {
      type: "p",
      text: "Read those two findings together with everything above. Loading the knee does not appear to damage a healthy joint, and loading it is one of the better things you can do for a joint that is already arthritic. The advice to protect your knees by not bending them fails in both directions at once.",
    },
    {
      type: "p",
      text: "National guidance asks adults for muscle strengthening work on two or more days a week, at every age[^8]. You can read the [full physical activity guidelines](https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines) for the detail. Squatting is the most efficient way most people have of meeting that for the lower body.",
    },

    { type: "h2", text: "How to squat deep without earning a problem" },
    { type: "h3", text: "1. Earn the depth before you load it" },
    {
      type: "p",
      text: "Get to a full squat with no weight first, holding the bottom under control. If your heels lift or your back rounds to get there, that is the thing to work on. Loading a position you cannot hold is where technique problems become injuries.",
    },
    { type: "h3", text: "2. Let your knees travel forward" },
    {
      type: "p",
      text: "The rule about keeping knees behind the toes has no support and it forces the load somewhere else, usually the lower back. Knees move forward in a deep squat. Anatomy requires it, and so do stairs.",
    },
    { type: "h3", text: "3. Change one thing at a time" },
    {
      type: "p",
      text: "Add depth or add weight, not both in the same week. Since strength is specific to range, going deeper means the weight has to come down at first. That is not a step backwards. It is the same principle described in [progressive overload](/training/progressive-overload), applied to range instead of load.",
    },
    { type: "h3", text: "4. Use the depth you actually have" },
    {
      type: "p",
      text: "Hip shape and ankle range differ between people, and some will never squat to the floor with a straight back regardless of practice. Depth is not a moral quality. Go as deep as you can control, work on the limit separately, and stop treating a number of degrees as the point.",
    },

    { type: "h2", text: "The short version" },
    {
      type: "p",
      text: "Pressure behind the kneecap peaks near parallel and falls as you go deeper, helped by the tendon wrapping and by thigh to calf contact taking roughly 30% of the compressive force off the joint[^1][^2]. Thirteen of the 15 studies in the most recent review found no harm to healthy knees[^2]. Deep training builds more strength across more positions than shallow training does[^5].",
    },
    {
      type: "p",
      text: "The evidence that does show harm points elsewhere. In former elite weightlifters the authors blamed body mass and old injuries[^3]. In workers it is cumulative hours, measured in thousands, that carry the risk[^4]. Neither describes a person squatting twice a week.",
    },
    {
      type: "p",
      text: "So the honest answer to the question in the headline is no, with two conditions attached. Build the depth before you load it, and if your knees already hurt, get them looked at rather than reasoning from studies done on healthy joints. The thing most likely to cost you your knees in thirty years is not squatting deep. It is being weak, which is a subject we take up in [why leg strength matters more as you age](/training/leg-strength). To see where your squat sits now, try the [strength scan](/).",
    },

    {
      type: "cta",
      title: "How strong is your squat, actually?",
      text: "Enter one squat or deadlift set and get an estimated one rep max, your strength tier, and training zones. Free, no signup.",
      label: "Get my strength scan →",
      href: "/",
    },
  ],

  sources: [
    {
      n: 1,
      text: "Analysis of the load on the knee joint and vertebral column with changes in squatting depth and weight load",
      url: "https://pubmed.ncbi.nlm.nih.gov/23821469/",
    },
    {
      n: 2,
      text: "Impact of the deep squat on articular knee joint structures, friend or enemy? A scoping review",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11618833/",
    },
    {
      n: 3,
      text: "Knee osteoarthritis in former runners, soccer players, weight lifters, and shooters",
      url: "https://pubmed.ncbi.nlm.nih.gov/7718008/",
    },
    {
      n: 4,
      text: "Occupational Exposure to Knee Loading and the Risk of Osteoarthritis of the Knee: A Systematic Review and a Dose-Response Meta-Analysis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5447410/",
    },
    {
      n: 5,
      text: "Effect of range of motion in heavy load squatting on muscle and tendon adaptations",
      url: "https://pubmed.ncbi.nlm.nih.gov/23604798/",
    },
    {
      n: 6,
      text: "Exercise for osteoarthritis of the knee",
      url: "https://pubmed.ncbi.nlm.nih.gov/25569281/",
    },
    {
      n: 7,
      text: "Effects of three types of resistance training on knee osteoarthritis: A systematic review and network meta-analysis",
      url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0309950",
    },
    {
      n: 8,
      text: "Physical Activity Guidelines for Americans, 2nd edition",
      url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    },
    {
      n: 9,
      text: "Squatting, lunging and kneeling provided similar kinematic profiles in healthy knees",
      url: "https://pubmed.ncbi.nlm.nih.gov/29802075/",
    },
  ],
};
