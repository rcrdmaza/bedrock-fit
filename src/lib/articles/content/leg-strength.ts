import type { Article } from "../types";

/**
 * Originally shipped 2026-08-04 as a hand-written page at /training.
 * Ported to the shared article format on 2026-08-08 — copy and figures unchanged.
 */
export const legStrength: Article = {
  slug: "leg-strength",

  title: "Leg Strength",
  titleAccent: "Strength",

  seoTitle: "Leg Strength: Why Strong Legs Matter More As You Age",
  description:
    "The evidence behind leg strength: how fast lower-body strength declines with age, why it predicts independence and survival, and what the research says actually works to rebuild it.",
  dek: "The simple case for strong legs — and why it gets more important, not less, with every decade you add.",

  category: "over-40",
  topic: "Lower body",
  tags: ["leg strength", "sarcopenia", "falls", "gait speed", "resistance training"],

  published: "2026-08-04",
  updated: "2026-08-08",

  readingMinutes: 9,
  wordCount: 2343,

  featured: true,

  ogStats: [
    ["−34%", "fall rate, trained"],
    ["+174%", "strength at age 90"],
    ["12 sources", "peer-reviewed"],
  ],

  blocks: [
    {
      type: "lede",
      text: "Almost everything you want to keep doing for the rest of your life runs through your legs. Standing up from a chair. Getting off the floor. Carrying groceries up a flight of stairs. Making it across an intersection before the light changes. Catching yourself when a curb comes earlier than you expected. None of that is a fitness goal, exactly — it’s just ordinary life. But all of it is paid for out of the same account: the strength in your hips, thighs, and calves.",
    },
    {
      type: "p",
      text: "That account has an unusual property. Left alone, it drains. Deliberately funded, it grows — at almost any age, including in people well into their nineties. What follows is the case for treating lower-body strength as a long-term asset rather than a gym vanity project, with the numbers behind it.",
    },

    { type: "h2", text: "Your legs are the largest muscle system you own" },
    {
      type: "figure",
      src: "/articles/leg-strength/calf-raise-heels-lowered.jpg",
      alt: "Close-up of calves on a raised block with the heels lowered below the step.",
      width: 1400,
      height: 2100,
      layout: "wrap-left",
      caption: "The calves are the smallest of the four leg muscle groups and the most often skipped — and they are the ones doing the work every time you push off a kerb.",
      credit: "Amar / Pexels",
      sourceUrl: "https://www.pexels.com/photo/13965339/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "The quadriceps, hamstrings, glutes, and calves together make up the biggest concentration of muscle tissue in the human body. That matters for reasons that go far beyond how much you can squat. Skeletal muscle is the primary site of glucose disposal — the tissue responsible for the large majority of insulin-stimulated glucose uptake after a meal[^8]. Practically speaking, your legs are the biggest metabolic sink you have. A larger, more active, more insulin-sensitive sink handles a carbohydrate load more gracefully than a small, sedentary one.",
    },
    {
      type: "p",
      text: "Muscle is also your structural insurance. It is the tissue that decelerates you when you trip, that protects a hip when you land, that keeps a knee tracking properly through a step-down. And because the legs are load-bearing by design, training them applies mechanical stress to exactly the bones — femur, pelvis, spine — where a fracture later in life is most consequential.",
    },

    { type: "h2", text: "What actually declines, and how fast" },
    {
      type: "p",
      text: "The common framing is that we “lose muscle” with age. That’s true, but it undersells the problem. After roughly age 30, most people shed something on the order of 3–5% of muscle mass per decade if they do nothing about it[^11]. The more revealing data comes from the Health, Aging and Body Composition study, which tracked nearly 1,900 older adults and measured both thigh muscle area and actual knee extensor strength over three years[^1].",
    },
    {
      type: "p",
      text: "Strength fell two to four times faster than muscle size. Losing mass isn’t the whole story — the muscle you keep also gets worse at producing force.",
    },
    {
      type: "chart",
      title: "Strength declines faster than muscle size",
      sub: "Annualized rate of loss in adults aged 70–79 over three years of follow-up.",
      unit: "%/yr",
      max: 5,
      bars: [
        { label: "Knee extensor strength — men", value: 3.4, display: "3.4%/yr", accent: true },
        { label: "Knee extensor strength — women", value: 2.6, display: "2.6%/yr", accent: true },
        { label: "Thigh muscle area (both sexes)", value: 1.0, display: "~1.0%/yr" },
      ],
      source: "Source: Health, Aging and Body Composition Study, n = 1,880 [1]",
    },
    {
      type: "p",
      text: "It gets one layer worse. Muscle *power* — force produced quickly, which is what a stumble recovery or a fast step off a curb actually demands — declines earlier and more steeply than raw strength does. In comparisons of mobility-limited older adults against healthy peers, leg muscle power was reduced by around 65% while muscle mass differed by only about 13%[^2]. Peak leg power turns out to predict chair-rise performance, stair-climbing, and walking speed better than strength alone.",
    },
    {
      type: "figure",
      src: "/articles/leg-strength/stairs-in-trainers.jpg",
      alt: "Legs in trainers climbing a flight of concrete stairs.",
      width: 1520,
      height: 1013,
      layout: "full",
      caption: "A flight of stairs is a power test disguised as an errand. It is one of the first things to feel harder, and one of the last things people mention to a doctor.",
      credit: "Maks Gelatin / Pexels",
      sourceUrl: "https://www.pexels.com/photo/4422912/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "So the thing that goes first is not size. It’s the ability to produce force *fast* — and that is also the thing most conventional exercise never trains.",
    },

    { type: "h2", text: "Leg strength is a survival statistic" },
    {
      type: "p",
      text: "This is where the argument stops being about aesthetics. A pooled analysis of nine cohort studies — 34,485 community-dwelling adults aged 65 and over, followed for as long as 21 years — found that walking speed tracked survival with remarkable consistency. Every 0.1 m/s of additional gait speed was associated with roughly a 12% lower risk of death[^3].",
    },
    { type: "p", text: "The spread across the range is not subtle." },
    {
      type: "chart",
      title: "Predicted 10-year survival at age 75, by walking speed",
      sub: "Slowest walkers (under 0.4 m/s) compared with the fastest (over 1.4 m/s).",
      max: 100,
      bars: [
        { label: "Men — slowest", value: 19, display: "19%" },
        { label: "Men — fastest", value: 87, display: "87%", accent: true },
        { label: "Women — slowest", value: 35, display: "35%" },
        { label: "Women — fastest", value: 91, display: "91%", accent: true },
      ],
      source: "Source: Studenski et al., JAMA 2011; pooled analysis of 9 cohorts, n = 34,485 [3]",
    },
    {
      type: "p",
      text: "Walking speed is not the same thing as leg strength, and nobody is claiming that walking faster on command adds years to your life. Gait speed is a summary measure — it reflects leg strength and power, joint health, balance, cardiovascular capacity, and neurological function all at once. That’s precisely why it works so well as a signal. Notably, the authors found that age, sex, and gait speed alone predicted survival about as accurately as models loaded with chronic disease history, blood pressure, BMI, and hospitalization records.",
    },
    {
      type: "p",
      text: "The practical reading: the systems that make you a fast, confident walker at 75 are systems worth defending at 45.",
    },

    { type: "h2", text: "The falls cascade — and how much of it is preventable" },
    {
      type: "p",
      text: "More than one in four adults over 65 falls each year in the United States. Those falls generate roughly 3 million emergency department visits and about a million hospitalizations annually, including nearly 319,000 hospitalizations for hip fracture. Falls cause the large majority of hip fracture deaths, and a single fall roughly doubles the odds of falling again[^4].",
    },
    {
      type: "stats",
      items: [
        { big: "1 in 4", label: "Adults 65+ who fall each year" },
        { big: "3M", label: "Annual ER visits from falls" },
        { big: "319K", label: "Hip fracture hospitalizations/yr" },
      ],
    },
    {
      type: "p",
      text: "A hip fracture is rarely a self-contained event. It is bed rest, deconditioning, lost confidence, reduced walking, further strength loss — a spiral that starts with one bad landing. The encouraging half of the picture is how responsive that risk is to training. A Cochrane review pooling 108 randomized trials across 23,407 community-dwelling participants found that exercise reduced the *rate* of falls by about 23% overall, with the best results coming from programs that combined balance and functional work with resistance training[^5].",
    },
    {
      type: "chart",
      title: "Reduction in fall rate, by type of exercise program",
      sub: "Community-dwelling older adults; pooled randomized controlled trials.",
      max: 40,
      bars: [
        { label: "Balance + functional + resistance", value: 34, display: "−34%", accent: true },
        { label: "Balance and functional exercise", value: 24, display: "−24%", accent: true },
        { label: "Tai chi", value: 19, display: "−19%" },
      ],
      source: "Source: Sherrington et al., Cochrane Database of Systematic Reviews 2019 [5]",
    },
    {
      type: "p",
      text: "A third fewer falls is a large effect for an intervention with no side-effect profile to speak of. And the mechanism is not mysterious: stronger, faster legs recover from a stumble that would otherwise become a fall.",
    },

    { type: "h2", text: "“But squats are bad for my knees”" },
    {
      type: "p",
      text: "This is the most common objection to leg training, and it has the causality backwards more often than not. Weak quadriceps are a risk factor for knee pain and for the progression of knee osteoarthritis, not a consequence of avoiding load. Cartilage and tendon are living tissue: they adapt to appropriate, progressive mechanical stress and they degrade under disuse. The muscles crossing a joint are part of that joint’s shock-absorption system, and a knee surrounded by strong, well-coordinated musculature spends less of its day absorbing force through passive structures.",
    },
    {
      type: "p",
      text: "That does not mean any exercise at any load is fine for any knee. It means the answer to a cranky joint is usually a modified movement — a shorter range, a different foot position, a leg press instead of a barbell, more warm-up, slower progression — rather than no movement at all. If something hurts sharply, in the joint, during or after a set, that is information about your technique, range, or load, not a verdict on training legs.",
    },
    {
      type: "p",
      text: "The same logic applies to bone. Bone remodels in response to the strain placed on it, which is why load-bearing resistance training is a first-line recommendation for preserving bone mineral density. The fracture you are trying to avoid at 80 is most likely to occur at the hip or spine — and those are precisely the sites that squats, hinges, and loaded carries stress.",
    },

    { type: "h2", text: "Strength training and the long game" },
    {
      type: "p",
      text: "Zoom out from falls and the association holds across causes. A meta-analysis of prospective cohort studies found that muscle-strengthening activity was associated with roughly a 10–17% lower risk of all-cause mortality, along with 10–20% lower risk of cardiovascular disease and cancer. The dose that captured most of the benefit was modest — somewhere between 30 and 60 minutes per week — and adding aerobic activity on top pushed the associations considerably further[^7].",
    },
    {
      type: "p",
      text: "Thirty to sixty minutes a week. That is two short sessions. The barrier to entry here is genuinely low, which makes the widespread avoidance of resistance training all the more expensive. It is also the floor rather than the target: the [US Physical Activity Guidelines](https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines) ask for muscle-strengthening work on two or more days a week alongside aerobic activity, and note that the two together do more than either alone.",
    },

    { type: "h2", text: "It is not too late — and that isn’t a platitude" },
    {
      type: "p",
      text: "The most cited demonstration of this is now decades old and still striking. Researchers put nine frail nursing home residents, mean age 90, through eight weeks of progressive resistance training three times per week. Knee extensor strength rose by an average of 174%. Midthigh muscle area grew about 9%. Tandem walking speed improved 48%[^6].",
    },
    {
      type: "chart",
      title: "Eight weeks of progressive resistance training at mean age 90",
      sub: "Nine frail nursing-home residents, ages 86–96, training three times weekly.",
      max: 180,
      bars: [
        { label: "Knee extensor strength", value: 174, display: "+174%", accent: true },
        { label: "Tandem walking speed", value: 48, display: "+48%", accent: true },
        { label: "Midthigh muscle area", value: 9, display: "+9%" },
      ],
      source: "Source: Fiatarone et al., JAMA 1990 [6]",
    },
    {
      type: "p",
      text: "Two things stand out. First, the strength gains dwarfed the size gains — the same relationship seen in decline, running in reverse. Much of what you gain early is neural: better recruitment of the muscle you already have. Second, these were not healthy, motivated masters athletes. They were frail, institutionalized ninety-year-olds. If eight weeks can produce that, the phrase “too old to start” deserves retirement.",
    },

    { type: "h2", text: "What actually works" },
    {
      type: "p",
      text: "The WHO recommends that all adults do muscle-strengthening activity involving major muscle groups on at least two days per week, and that adults 65 and over add multicomponent activity emphasizing balance and strength three or more days per week[^10]. U.S. federal guidance is essentially the same[^12]. Beneath that framework, a lower-body program only needs a handful of movement patterns.",
    },

    { type: "h3", text: "1. Squat something, twice a week" },
    {
      type: "p",
      text: "Any loaded knee-bend counts: back squat, goblet squat, leg press, or a sit-to-stand from a low box if you are starting from scratch. Two to four sets in the 5–12 rep range, taken close enough to failure that the last couple of reps are genuinely hard. The load matters less than the effort and the consistency. What does matter is that it gets harder over time: add a little weight, a rep, or a set when the current version stops feeling difficult. Progressive overload is the whole mechanism — a program you never make harder eventually becomes maintenance, and maintenance loses slowly to the decline rates above.",
    },

    { type: "h3", text: "2. Hinge at the hip" },
    {
      type: "p",
      text: "Deadlifts, Romanian deadlifts, hip thrusts, or back extensions train the posterior chain — glutes and hamstrings — which squats alone under-serve. This is the pattern that protects your back when you pick up something heavy and awkward, which is how most people actually hurt themselves.",
    },

    { type: "h3", text: "3. Train one leg at a time" },
    {
      type: "figure",
      src: "/articles/leg-strength/dumbbell-split-squat.jpg",
      alt: "A woman performing a dumbbell split squat, rear knee lowered toward the floor.",
      width: 1400,
      height: 2100,
      layout: "wrap-right",
      caption: "A split squat trains the position you spend most of every stride in — one leg loaded, the other passing through.",
      credit: "Amar / Pexels",
      sourceUrl: "https://www.pexels.com/photo/14673249/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "Walking, stairs, and stumble recovery are all single-leg events. Split squats, step-ups, and lunges expose and correct side-to-side imbalances that bilateral lifts hide, and they load balance and hip stability at the same time. This matters more than it sounds. A two-legged squat lets the stronger side quietly compensate for the weaker one, and the asymmetry can persist for years without ever showing up in the numbers you track. Standing on one leg removes that option. It is also the position you are actually in for roughly 40% of every walking stride — so the ability to control it is not an accessory to walking, it *is* walking. Start with your bodyweight and a hand on a doorframe if you need it, and add load only once you can lower under control rather than drop.",
    },

    { type: "h3", text: "4. Train speed, not just strength" },
    {
      type: "p",
      text: "Because power declines fastest, add something explosive: a light jump, a fast concentric on the leg press, a brisk step-up, a med-ball throw. Keep the load light and the intent maximal — the goal is velocity, not fatigue. A few sets of 3–5 fast reps, early in the session while you are fresh, is enough.",
    },

    { type: "h3", text: "5. Carry things and walk" },
    {
      type: "p",
      text: "Loaded carries and hills build the unglamorous, everyday capacity that shows up in gait speed. They also double as a signal you can monitor: if your usual walk to the store has quietly gotten slower over two years, that is data.",
    },

    { type: "h3", text: "6. Don’t skip the calves" },
    {
      type: "p",
      text: "The calves are named in every list of leg muscles and trained in almost none of them. They are also the muscles that push you off the ground at the end of every step, absorb the landing when you come down a kerb, and hold the ankle steady when the ground turns out to be less level than you assumed. Ankle strength and range of motion both narrow with age, and a stiff, weak ankle shifts the work of balancing upward to the hip, where the corrections are slower and larger. Straight-leg calf raises off a step, lowering under control through a full range, cost nothing and take two minutes. Do them where you will actually see them — by a stair, not in a programme you never open.",
    },

    { type: "h2", text: "How to know whether it’s working" },
    {
      type: "p",
      text: "Two tests need no equipment beyond a chair and a stopwatch. The 30-second chair stand — how many times you can rise fully from a standard chair without using your arms in 30 seconds — is the test the CDC’s fall prevention program uses to flag risk. The [CDC’s one-page assessment sheet](https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf) gives the full protocol, including the detail most people get wrong: arms crossed at the wrists, against the chest, throughout. Below-average scores by age and sex are shown below[^9].",
    },
    {
      type: "table",
      caption: "30-second chair stand — below-average score indicates fall risk",
      columns: ["Age", "Men — fewer than", "Women — fewer than"],
      rows: [
        ["60–64", "14 stands", "12 stands"],
        ["65–69", "12 stands", "11 stands"],
        ["70–74", "12 stands", "10 stands"],
        ["75–79", "11 stands", "10 stands"],
        ["80–84", "10 stands", "9 stands"],
        ["85–89", "8 stands", "8 stands"],
        ["90–94", "7 stands", "4 stands"],
      ],
      source: "Source: CDC STEADI, Assessment: 30-Second Chair Stand [9]",
    },
    {
      type: "p",
      text: "The second is walking speed. Mark out four metres, walk it at your normal pace, divide distance by time. Anything comfortably above 1.0 m/s is reassuring; drifting below 0.8 m/s is worth paying attention to. Retest both every few months. If the chair stand number is climbing and your walk is holding or getting quicker, the program is doing its job — regardless of what the barbell says.",
    },

    { type: "h2", text: "The short version" },
    {
      type: "p",
      text: "Lower-body strength declines faster than muscle mass, and power declines faster still. Those declines predict the loss of independence — slower walking, harder chair rises, more falls, more fractures — and the measures that capture them predict survival about as well as a full medical history. Two sessions a week, totalling under an hour, is associated with meaningfully lower mortality risk, and structured leg training cuts fall rates by roughly a third. The response to training persists into the tenth decade of life.",
    },
    {
      type: "p",
      text: "Strong legs are not really about lifting. They are about how much of your own life you get to keep running yourself, and for how long.",
    },
    {
      type: "p",
      text: "If you want a number to start from rather than a feeling, the [strength scan](/) estimates a one-rep max from a single set you have already done and places it against population standards — the [method behind those estimates](/methodology) is written up separately, including where it is least reliable. And if this was useful, the rest of the [training library](/training) works the same way: sourced, hedged where the evidence is thin, and specific about what it does not know.",
    },

    {
      type: "cta",
      title: "Where do your legs stand right now?",
      text: "Enter one squat or deadlift set and get an estimated 1-rep max, your strength tier, and training zones — free, no signup.",
      label: "Get my strength scan →",
      href: "/",
    },
  ],

  sources: [
    {
      n: 1,
      text: "Goodpaster BH, et al. “The Loss of Skeletal Muscle Strength, Mass, and Quality in Older Adults: The Health, Aging and Body Composition Study.” Journals of Gerontology: Series A, 2006;61(10):1059–1064.",
      url: "https://academic.oup.com/biomedgerontology/article/61/10/1059/600461",
    },
    {
      n: 2,
      text: "Reid KF, Fielding RA. “Skeletal Muscle Power: A Critical Determinant of Physical Functioning in Older Adults.” Exercise and Sport Sciences Reviews, 2012;40(1):4–12.",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3245773/",
    },
    {
      n: 3,
      text: "Studenski S, et al. “Gait Speed and Survival in Older Adults.” JAMA, 2011;305(1):50–58.",
      url: "https://jamanetwork.com/journals/jama/fullarticle/645520",
    },
    {
      n: 4,
      text: "Centers for Disease Control and Prevention. “Facts About Falls.” Older Adult Fall Prevention.",
      url: "https://www.cdc.gov/falls/data-research/facts-stats/index.html",
    },
    {
      n: 5,
      text: "Sherrington C, et al. “Exercise for preventing falls in older people living in the community.” Cochrane Database of Systematic Reviews, 2019, Issue 1, CD012424.",
      url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012424.pub2/full",
    },
    {
      n: 6,
      text: "Fiatarone MA, et al. “High-Intensity Strength Training in Nonagenarians: Effects on Skeletal Muscle.” JAMA, 1990;263(22):3029–3034.",
      url: "https://jamanetwork.com/journals/jama/article-abstract/382128",
    },
    {
      n: 7,
      text: "Momma H, et al. “Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: a systematic review and meta-analysis of cohort studies.” British Journal of Sports Medicine, 2022;56:755–763.",
      url: "https://bjsm.bmj.com/content/56/13/755",
    },
    {
      n: 8,
      text: "DeFronzo RA, Tripathy D. “Skeletal Muscle Insulin Resistance Is the Primary Defect in Type 2 Diabetes.” Diabetes Care, 2009;32(suppl 2):S157–S163.",
      url: "https://diabetesjournals.org/care/article/32/suppl_2/S157/27357/Skeletal-Muscle-Insulin-Resistance-Is-the-Primary",
    },
    {
      n: 9,
      text: "Centers for Disease Control and Prevention. STEADI — “Assessment: 30-Second Chair Stand.”",
      url: "https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf",
    },
    {
      n: 10,
      text: "World Health Organization. WHO Guidelines on Physical Activity and Sedentary Behaviour, 2020.",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK566046/",
    },
    {
      n: 11,
      text: "Harvard Health Publishing. “Preserve your muscle mass.” Harvard Medical School.",
      url: "https://www.health.harvard.edu/staying-healthy/preserve-your-muscle-mass",
    },
    {
      n: 12,
      text: "U.S. Department of Health and Human Services. Physical Activity Guidelines for Americans, 2nd edition, 2018.",
      url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    },
  ],
};
