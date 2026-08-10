import type { Article } from "../types";

/**
 * Hub B for the Over 40 cluster. Pairs with leg-strength, which carries the
 * daily-life consequences, and links back to progressive-overload for method.
 *
 * The angle is the 2019 EWGSOP2 inversion: a condition named after muscle size
 * stopped being defined by muscle size. Everything else in the piece follows
 * from that, including why the bathroom scale is the wrong instrument.
 */
export const sarcopenia: Article = {
  slug: "sarcopenia",
  title: "Sarcopenia: What It Is, When It Starts",
  titleAccent: "When It Starts",
  seoTitle: "Sarcopenia: What It Is and When It Starts",
  description:
    "The age-related muscle disease that stopped being about muscle size. What changed in 2019, how early it begins, and the two tests that actually detect it.",
  dek:
    "In 2019 the people who define this condition moved muscle size out of first place. What they put there instead changes what you should be measuring.",
  category: "over-40",
  topic: "Muscle loss",
  tags: ["sarcopenia", "muscle loss", "ageing", "grip strength", "dynapenia"],
  published: "2026-08-09",
  updated: "2026-08-09",
  readingMinutes: 11,
  wordCount: 2388,
  draft: false,

  ogStats: [
    ["10-27%", "of over 60s affected"],
    ["3×", "strength falls faster than size"],
    ["10 sources", "peer-reviewed"],
  ],

  blocks: [
    {
      type: "lede",
      text: "Think about the last time you got out of a low, soft chair. Did you push off the arms, or did you just stand up? Most people under fifty never notice the difference. It is one of the earliest signs of a condition with a name most people have never heard, and it shows up in what your muscle can do long before it shows up in the mirror.",
    },
    {
      type: "p",
      text: "The condition is sarcopenia. The word comes from Greek and means, roughly, poverty of flesh. For decades it described one thing: the muscle you lose as you get older. Less muscle, worse outcomes. Simple enough.",
    },
    {
      type: "p",
      text: "Then in 2019 the group that writes the European definition changed it. They moved muscle size out of first place and put muscle strength there instead[^1]. That sounds like a technical detail for specialists. It is not. It changes what you should measure, what counts as early, and what you can do about it.",
    },

    { type: "h2", text: "The definition turned itself inside out" },
    {
      type: "p",
      text: "The original idea was built around mass. If a scan showed you had lost enough muscle, you had sarcopenia. Strength was a secondary consideration and physical performance was a third.",
    },
    {
      type: "p",
      text: "The revised consensus reversed that order. Low muscle strength now comes first, because strength turned out to be the more reliable measure of whether a muscle is failing you[^1]. The new definition works in three steps.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**Probable sarcopenia.** Low strength on its own. That is enough to start treating it.",
        "**Confirmed sarcopenia.** Low strength, plus a scan showing low muscle quantity or quality.",
        "**Severe sarcopenia.** Both of those, plus poor physical performance such as slow walking.",
      ],
    },
    {
      type: "p",
      text: "Read that list again and notice what is missing from the first line. You can have probable sarcopenia without any scan at all. A grip test is enough to put you there. Under 27 kg for men, under 16 kg for women[^1]. Or five rises from a chair taking longer than 15 seconds[^1].",
    },
    {
      type: "callout",
      title: "Why this matters more than it sounds",
      text: "A definition tells you what to look for. When the definition was about size, the test was a scan you needed a clinic for. Now the first test is a squeeze and a chair, and either one can be done in a minute.",
    },

    { type: "h2", text: "Strength leaves faster than size does" },
    {
      type: "p",
      text: "The reason for the change is in the data, and the gap is much bigger than most people expect.",
    },
    {
      type: "p",
      text: "A quantitative review pulled together what is known about both curves. Muscle mass falls slowly. Across studies comparing young and old, the loss runs about 0.47% a year in men and 0.37% a year in women. By the age of 75 it speeds up a little, to somewhere near 1% a year[^2].",
    },
    {
      type: "p",
      text: "Strength is a different story. At 75, men lose 3% to 4% of their strength a year and women lose 2.5% to 3%[^2]. Put those two numbers side by side and the conclusion is hard to avoid. Strength drains away 2 to 5 times faster than muscle does[^2].",
    },
    {
      type: "charts",
      title: "Two curves that were assumed to be one",
      sub: "Annual rates of loss around age 75, and what a five year follow up of 1,678 older adults found.",
      panels: [
        {
          kind: "column",
          caption: "Yearly loss at age 75, strength against mass",
          max: 5,
          bars: [
            { label: "Strength, men", value: 3.5, display: "3-4%", accent: true },
            { label: "Strength, women", value: 2.75, display: "2.5-3%", accent: true },
            { label: "Mass, men", value: 0.9, display: "~1%" },
            { label: "Mass, women", value: 0.67, display: "~0.7%" },
          ],
        },
        {
          kind: "bar",
          caption: "Over five years, men lost three times more strength than muscle",
          max: 20,
          bars: [
            { label: "Knee extensor strength lost", value: 16, display: "16%", accent: true },
            { label: "Thigh muscle lost", value: 5, display: "5%" },
          ],
        },
        {
          kind: "donut",
          caption: "Share of strength loss that shrinking muscle can explain",
          max: 100,
          bars: [{ label: "Explained by lost size", value: 31, display: "31%", accent: true }],
        },
      ],
      source: "Mitchell et al., Frontiers in Physiology, 2012 [2]. The donut is the ratio of the two bars beside it, not a separately measured figure.",
    },
    { type: "h2", text: "Why the muscle you keep gets weaker" },
    {
      type: "p",
      text: "If size only explains part of the decline, something else has to explain the rest. Two things do, and both are invisible on a scan.",
    },
    {
      type: "p",
      text: "The first is muscle quality, which means the force a muscle produces for a given amount of it. That falls with age at the level of the individual fibre. Measured directly, the force a single fibre can generate drops by roughly 16% to 33% in the slow fibres. In the fastest fibres it may fall by as much as half[^2].",
    },
    {
      type: "p",
      text: "Read that ordering again, because it explains a lot of everyday experience. The fast fibres suffer worst. Those are the ones you use to catch yourself when you trip, to get a foot down quickly, to stand up in a hurry. They are not the ones you use to walk to the shop, which is why the loss stays hidden until the day something sudden is required.",
    },
    {
      type: "p",
      text: "The second is the wiring. A muscle is only as useful as the signal reaching it, and the whole neuromuscular system changes with age, not just the tissue. Researchers gave that half of the problem its own name, dynapenia, precisely because treating it as a size problem was misleading[^2]. Sarcopenia describes losing muscle. Dynapenia describes losing the ability to use it.",
    },
    {
      type: "p",
      text: "That distinction is the reason a scan can look reassuring while the chair test does not. It is also the reason training works as fast as it does, because the wiring responds in weeks while tissue takes months.",
    },

    { type: "h2", text: "The study that should have ended the argument" },
    {
      type: "p",
      text: "If mass and strength really came apart, you would expect to find people who kept their muscle and lost their strength anyway. That is exactly what one large study found.",
    },
    {
      type: "p",
      text: "It followed 1,880 older adults for three years and measured both[^3]. Strength fell between 2.6% and 4.1% a year depending on the group. Leg lean mass fell about 1% a year. So the rate of strength loss ran about three times the rate of muscle loss[^3].",
    },
    {
      type: "p",
      text: "Then comes the part worth sitting with. Some people in the study gained lean mass over those three years. They did not keep their strength. Gaining muscle was not accompanied by holding on to strength at all[^3].",
    },
    {
      type: "quote",
      text: "You can add muscle and still get weaker. Size and strength are related, but they are not the same thing, and only one of them is what you actually use.",
    },
    {
      type: "p",
      text: "This is why a bathroom scale is close to useless here, and why the mirror is worse. Both measure the thing that moves slowest and matters least. Someone can carry plenty of muscle under a layer of fat, weigh more than they did at forty, and still be unable to stand up without using their hands.",
    },
    {
      type: "video",
      youtubeId: "r8DSpOd0NZc",
      title: "Stuart Phillips, PhD, on Building Muscle with Resistance Exercise and Reassessing Protein Intake",
      caption: "A muscle physiologist on what actually drives muscle loss with age, and how much protein the evidence supports. Worth it for the section on why older muscle responds differently.",
    },

    { type: "h2", text: "How common it is, and when it starts" },
    {
      type: "p",
      text: "The honest answer to how common is that it depends on which definition you use, and the range is wide enough to be uncomfortable.",
    },
    {
      type: "p",
      text: "The largest review pooled 151 studies covering 692,056 people, at a mean age of 68.5 years. Depending on the criteria applied, prevalence landed between 10% and 27%. Severe cases ran from 2% to 9%[^4].",
    },
    {
      type: "p",
      text: "That spread is not sloppiness. It is the direct result of the field having used several definitions at once, which is precisely the problem the 2019 revision set out to fix. Under one set of criteria men came out worse, at 11% against 2% for women. Under another, women came out worse, at 17% against 12%[^4]. Same populations. Different rulers.",
    },
    {
      type: "p",
      text: "As for when it starts, the framing of the question is the problem. There is no birthday when muscle begins to leave. The decline is measurable from your forties and it is gradual, which is what makes it easy to miss. What changes with age is not whether it is happening but how fast, and how close you are to the point where it costs you something.",
    },
    {
      type: "p",
      text: "It helps to think of it as a distance rather than a date. You have a certain amount of strength above the level daily life demands, and that gap is your margin. Losing 3% of it a year is invisible while the margin is wide[^2]. The day it stops being invisible is the day the margin runs out, and by then you have been losing ground for twenty years.",
    },
    {
      type: "p",
      text: "That also explains why the same amount of loss lands so differently on two people. Someone who was strong at forty can afford decades of decline before anything gets hard. Someone who was never strong has very little to spend. Neither of them feels the loss while it is happening. Only one of them ends up needing their hands to get out of a chair.",
    },
    {
      type: "callout",
      title: "The threshold that matters",
      text: "Muscle loss becomes a diagnosis when it crosses a functional line, not when it reaches a certain amount. That line is different for a tall man and a small woman, which is why the cut-offs are set by strength and by speed rather than by mass alone.",
    },

    { type: "h2", text: "What it actually costs" },
    {
      type: "p",
      text: "It would be easy to treat this as a quality of life issue. It is more serious than that.",
    },
    {
      type: "p",
      text: "A review of 17 prospective studies found that people with sarcopenia were about 3.6 times more likely to die during follow up than people without it. They were also about 3 times more likely to lose physical function[^5]. Those are associations rather than proof of cause, and sick people are weak for many reasons. But the size of the gap is hard to explain away.",
    },
    {
      type: "p",
      text: "Grip strength on its own carries a similar signal. In a study of 139,691 people across 17 countries, every 5 kg drop in grip strength came with a 16% higher risk of death from any cause. Grip predicted death better than systolic blood pressure did[^6].",
    },
    {
      type: "p",
      text: "Think about what that means. A cheap spring gauge you squeeze for two seconds outperformed the measurement your doctor takes at every appointment. Not because blood pressure does not matter, but because strength is a summary of a great deal at once.",
    },

    { type: "h2", text: "“Isn’t this just getting old?”" },
    {
      type: "p",
      text: "Partly, yes. Some decline is built in and nobody trains their way out of ageing. But built in is not the same as fixed, and the rate is very much open to change.",
    },
    {
      type: "p",
      text: "A Cochrane review gathered 121 randomised trials covering about 6,700 older adults. Progressive resistance training produced a large improvement in muscle strength. It also improved getting out of a chair, and walking speed rose by about 0.08 metres per second[^7]. That walking figure looks tiny written down. It is roughly the difference between crossing a road comfortably and hurrying.",
    },
    {
      type: "p",
      text: "The more striking evidence is older and smaller. Nine frail nursing home residents, average age 90, trained three times a week for eight weeks. Knee extensor strength rose by an average of 174%[^8]. Not 17%. At ninety, after two months.",
    },
    {
      type: "charts",
      title: "What training does at the point people assume it is too late",
      sub: "A Cochrane pooling of 121 trials, set beside eight weeks of training at mean age 90.",
      panels: [
        {
          kind: "bar",
          caption: "Eight weeks at mean age 90",
          max: 180,
          bars: [
            { label: "Knee extensor strength", value: 174, display: "+174%", accent: true },
            { label: "Walking speed", value: 48, display: "+48%", accent: true },
            { label: "Mid thigh muscle area", value: 9, display: "+9%" },
          ],
        },
        {
          kind: "column",
          caption: "Trials and people behind the pooled result",
          max: 7000,
          bars: [
            { label: "Participants", value: 6700, display: "6,700", accent: true },
            { label: "Randomised trials", value: 121, display: "121" },
          ],
        },
        {
          kind: "line",
          caption: "Strength lost per year against strength gained in two months",
          max: 180,
          bars: [
            { label: "Yearly loss", value: 4, display: "4%" },
            { label: "Month 1", value: 80, display: "rising" },
            { label: "Month 2", value: 174, display: "+174%" },
          ],
        },
      ],
      source: "Liu and Latham, Cochrane, 2009 [7]; Fiatarone et al., JAMA, 1990 [8]. The third panel sketches the contrast between those two rates and is not a measured trajectory.",
    },
    {
      type: "p",
      text: "Note which number moved most. Strength rose by 174% while muscle area grew about 9%[^8]. The gain was mostly in using the muscle better, not in building more of it. That is the same gap the definition change was pointing at, seen from the other direction.",
    },

    { type: "h2", text: "What to actually do about it" },
    { type: "h3", text: "1. Train for strength, not for size" },
    {
      type: "p",
      text: "This follows directly from everything above. The quality that fades fastest is the one that responds fastest, and it is not measured in centimetres. That means lifting loads heavy enough to be genuinely hard, for a small number of reps, rather than long sets of something light. The method is the same at any age and we set it out in [progressive overload](/training/progressive-overload).",
    },
    { type: "h3", text: "2. Two sessions a week, as a floor" },
    {
      type: "p",
      text: "National guidance asks for muscle strengthening work on two or more days a week[^10]. Treat that as the minimum rather than the goal. You can read the [full physical activity guidelines](https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines) if you want the detail behind it. Two sessions is also about what the training trials used, so it is a floor with evidence under it.",
    },
    { type: "h3", text: "3. Eat more protein than you did at thirty" },
    {
      type: "p",
      text: "Older muscle responds less readily to the protein you eat, so the amount has to go up to get the same effect. A group of researchers reviewing the evidence recommended 1.0 to 1.2 grams per kilogram of body weight a day for healthy older adults, and at least 1.2 for those who exercise[^9]. For a person of 70 kg that is roughly 70 to 84 grams a day, spread across meals rather than loaded into one.",
    },
    {
      type: "p",
      text: "The same group was clear that protein on its own is not the answer. They recommended resistance and endurance exercise alongside it[^9]. This matters because protein is the easy half to sell and the easy half to do. A powder is simpler than a session. But food without a demand for it does not become muscle, and the evidence has never suggested otherwise.",
    },
    { type: "h3", text: "4. Test yourself, and write it down" },
    {
      type: "p",
      text: "You cannot notice a 3% yearly change by feel. You can notice it in a number. Time five chair rises. Do it again in six months. That is the whole protocol, and it uses the same cut-off the clinical definition uses[^1].",
    },
    { type: "h3", text: "5. Do not wait for a diagnosis" },
    {
      type: "p",
      text: "Probable sarcopenia is the stage where treatment is easiest and the stage most people never learn they are in. Nobody screens healthy fifty year olds for grip strength. If you want to know, you have to look.",
    },
    {
      type: "p",
      text: "If you would rather start from a plain guide than from a paper, the National Institute on Aging keeps a practical summary of [exercise and physical activity for older adults](https://www.nia.nih.gov/health/exercise-and-physical-activity) that covers the strength work alongside balance and endurance. It is written for people, not for clinicians.",
    },

    { type: "h2", text: "The two tests, and the numbers to beat" },
    {
      type: "p",
      text: "Here is the whole diagnostic first step in one table. If you fail either row, that is worth a conversation with a doctor rather than a panic.",
    },
    {
      type: "table",
      caption: "The EWGSOP2 cut-off values for low strength and slow performance",
      columns: ["Test", "Men", "Women"],
      rows: [
        ["Grip strength", "under 27 kg", "under 16 kg"],
        ["Five chair rises", "over 15 seconds", "over 15 seconds"],
        ["Walking speed", "0.8 m/s or slower", "0.8 m/s or slower"],
      ],
      source: "Cruz-Jentoft et al., Age and Ageing, 2019 [1]",
    },
    {
      type: "p",
      text: "A grip gauge costs about as much as a takeaway. The chair test costs nothing. Neither requires a referral, and either one tells you more about how your next twenty years are likely to go than your weight does.",
    },

    { type: "h2", text: "The short version" },
    {
      type: "p",
      text: "Sarcopenia is the age-related loss of muscle, but the field stopped defining it that way. Since 2019 the first criterion has been low strength, because strength falls 2 to 5 times faster than size and predicts outcomes better[^1][^2]. Somewhere between 10% and 27% of people over 60 meet the criteria, and having it roughly triples the risk of losing physical function[^4][^5].",
    },
    {
      type: "p",
      text: "The useful part is that the fast-moving quality is also the trainable one. Trials in frail people in their nineties have produced strength gains no drug comes close to[^8]. What that asks of you is unglamorous and small: lift something heavy twice a week, eat enough protein, and check a number twice a year.",
    },
    {
      type: "p",
      text: "What that buys you is not a longer life in the abstract. It is standing up out of a chair without thinking about it, which is where this article started, and which is a great deal easier to keep than it is to get back. We covered what that looks like day to day in [why leg strength matters more as you age](/training/leg-strength). If you want a starting number rather than a feeling, the [strength scan](/) will give you one.",
    },

    {
      type: "cta",
      title: "Where does your strength sit right now?",
      text: "Enter one squat or deadlift set and get an estimated one rep max, your strength tier, and training zones. Free, no signup.",
      label: "Get my strength scan →",
      href: "/",
    },
  ],

  sources: [
    {
      n: 1,
      text: "Sarcopenia: revised European consensus on definition and diagnosis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6322506/",
    },
    {
      n: 2,
      text: "Sarcopenia, Dynapenia, and the Impact of Advancing Age on Human Skeletal Muscle Size and Strength; a Quantitative Review",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3429036/",
    },
    {
      n: 3,
      text: "The Loss of Skeletal Muscle Strength, Mass, and Quality in Older Adults",
      url: "https://academic.oup.com/biomedgerontology/article/61/10/1059/600461",
    },
    {
      n: 4,
      text: "Global prevalence of sarcopenia and severe sarcopenia: a systematic review and meta-analysis",
      url: "https://pubmed.ncbi.nlm.nih.gov/34816624/",
    },
    {
      n: 5,
      text: "Health Outcomes of Sarcopenia: A Systematic Review and Meta-Analysis",
      url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0169548",
    },
    {
      n: 6,
      text: "Prognostic value of grip strength: findings from the Prospective Urban Rural Epidemiology (PURE) study",
      url: "https://pubmed.ncbi.nlm.nih.gov/25982160/",
    },
    {
      n: 7,
      text: "Progressive resistance strength training for improving physical function in older adults",
      url: "https://pubmed.ncbi.nlm.nih.gov/19588334/",
    },
    {
      n: 8,
      text: "High-intensity strength training in nonagenarians",
      url: "https://jamanetwork.com/journals/jama/article-abstract/382128",
    },
    {
      n: 9,
      text: "Evidence-based recommendations for optimal dietary protein intake in older people",
      url: "https://pubmed.ncbi.nlm.nih.gov/23867520/",
    },
    {
      n: 10,
      text: "Physical Activity Guidelines for Americans, 2nd edition",
      url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    },
  ],
};
