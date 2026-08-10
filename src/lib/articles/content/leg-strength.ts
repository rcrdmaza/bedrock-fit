import type { Article } from "../types";

/**
 * Originally shipped 2026-08-04 as a hand-written page at /training.
 * Ported to the shared article format on 2026-08-08, copy and figures unchanged.
 *
 * Retrofitted to the house style on 2026-08-09. Four standalone `chart` blocks
 * folded into three `charts` strips, em and en dashes removed throughout, prose
 * shortened to bring the reading grade under 9.0, a video added, sibling links
 * added now that siblings exist, and the sources cut back to title only.
 */
export const legStrength: Article = {
  slug: "leg-strength",

  title: "Leg Strength",
  titleAccent: "Strength",

  seoTitle: "Leg Strength: Why Strong Legs Matter More As You Age",
  description:
    "The evidence behind leg strength: how fast lower-body strength declines with age, why it predicts independence and survival, and what the research says actually works to rebuild it.",
  dek: "The simple case for strong legs, and why it gets more important rather than less with every decade you add.",

  category: "over-40",
  topic: "Lower body",
  tags: ["leg strength", "sarcopenia", "falls", "gait speed", "resistance training"],

  published: "2026-08-04",
  updated: "2026-08-09",

  readingMinutes: 11,
  wordCount: 2325,

  featured: true,

  ogStats: [
    ["34%", "fewer falls, trained"],
    ["+174%", "strength at age 90"],
    ["12 sources", "peer-reviewed"],
  ],

  blocks: [
    {
      type: "lede",
      text: "Almost everything you want to keep doing for the rest of your life runs through your legs. Standing up from a chair. Getting off the floor. Carrying shopping up a flight of stairs. Making it across a road before the light changes. Catching yourself when a kerb comes earlier than you expected. None of that is a fitness goal. It is just ordinary life. But all of it is paid for out of the same account, which is the strength in your hips, thighs and calves.",
    },
    {
      type: "p",
      text: "That account has an unusual property. Left alone, it drains. Funded deliberately, it grows, at almost any age. That includes people well into their nineties. What follows is the case for treating lower-body strength as a long-term asset rather than a gym vanity project, with the numbers behind it.",
    },

    { type: "h2", text: "Your legs are the largest muscle system you own" },
    {
      type: "figure",
      src: "/articles/leg-strength/calf-raise-heels-lowered.jpg",
      alt: "Close-up of calves on a raised block with the heels lowered below the step.",
      width: 1400,
      height: 2100,
      layout: "wrap-left",
      caption: "The calves are the smallest of the four leg muscle groups and the most often skipped. They are also the ones doing the work every time you push off a kerb.",
      credit: "Amar / Pexels",
      sourceUrl: "https://www.pexels.com/photo/13965339/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "The quadriceps, hamstrings, glutes and calves together make up the biggest concentration of muscle tissue in the human body. That matters for reasons well beyond how much you can squat. Skeletal muscle is the main site where glucose is disposed of, and it takes up the large majority of it after a meal[^8]. So your legs are the biggest metabolic sink you have. A large, active, insulin-sensitive sink handles a meal more gracefully than a small, sedentary one.",
    },
    {
      type: "p",
      text: "Muscle is also your structural insurance. It is the tissue that slows you down when you trip. It protects a hip when you land. It keeps a knee tracking properly on a step down. And because the legs carry load by design, training them stresses exactly the bones where a fracture later in life does the most damage: the femur, the pelvis and the spine.",
    },

    { type: "h2", text: "What actually declines, and how fast" },
    {
      type: "p",
      text: "The common framing is that we lose muscle with age. That is true, but it undersells the problem. After roughly age 30, most people shed something like 3% to 5% of muscle mass per decade if they do nothing about it[^11]. The more revealing data comes from a study that tracked nearly 1,900 older adults for three years and measured two things at once: thigh muscle area, and actual knee extensor strength[^1].",
    },
    {
      type: "p",
      text: "Strength fell two to four times faster than muscle size. Losing mass is not the whole story. The muscle you keep also gets worse at producing force.",
    },
    {
      type: "p",
      text: "It gets one layer worse than that. Muscle power means force produced quickly, which is what recovering from a stumble actually demands. Power declines earlier and more steeply than raw strength does. Comparing mobility-limited older adults against healthy peers, leg power was down by around 65% while muscle mass differed by only about 13%[^2]. Peak leg power predicts chair rises, stair climbing and walking speed better than strength alone.",
    },
    {
      type: "charts",
      title: "Two things drain faster than muscle size",
      sub: "Yearly rates of loss in adults aged 70 to 79, and the gap between mobility-limited older adults and healthy peers.",
      panels: [
        {
          kind: "column",
          caption: "Yearly loss, strength against muscle size",
          max: 5,
          unit: "%",
          bars: [
            { label: "Knee extensor strength, men", value: 3.4, display: "3.4%/yr", accent: true },
            { label: "Knee extensor strength, women", value: 2.6, display: "2.6%/yr", accent: true },
            { label: "Thigh muscle area", value: 1.0, display: "~1.0%/yr" },
          ],
        },
        {
          kind: "bar",
          caption: "Power is the bigger gap, not size",
          max: 70,
          bars: [
            { label: "Leg power deficit", value: 65, display: "65%", accent: true },
            { label: "Muscle mass difference", value: 13, display: "13%" },
          ],
        },
      ],
      source: "Health, Aging and Body Composition Study, n = 1,880 [1]; Reid and Fielding, Exercise and Sport Sciences Reviews, 2012 [2]",
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
      text: "So the thing that goes first is not size. It is the ability to produce force fast. That is also the thing most conventional exercise never trains. The same split shows up in how the condition itself is now defined, which we cover in [what sarcopenia is and when it starts](/training/sarcopenia).",
    },

    { type: "h2", text: "Leg strength is a survival statistic" },
    {
      type: "p",
      text: "This is where the argument stops being about aesthetics. A pooled analysis of nine cohort studies followed 34,485 adults aged 65 and over, some of them for as long as 21 years. Walking speed tracked survival with remarkable consistency. Every extra 0.1 metres per second of gait speed came with roughly a 12% lower risk of death[^3].",
    },
    { type: "p", text: "The spread across the range is not subtle." },
    {
      type: "charts",
      title: "How well you walk at 75 tracks how long you live",
      sub: "Nine pooled cohorts, 34,485 adults aged 65 and over, followed for up to 21 years.",
      panels: [
        {
          kind: "bar",
          caption: "Predicted 10 year survival at age 75, by walking speed",
          max: 100,
          bars: [
            { label: "Men, slowest", value: 19, display: "19%" },
            { label: "Men, fastest", value: 87, display: "87%", accent: true },
            { label: "Women, slowest", value: 35, display: "35%" },
            { label: "Women, fastest", value: 91, display: "91%", accent: true },
          ],
        },
        {
          kind: "donut",
          caption: "Lower risk of death per 0.1 m/s of walking speed",
          max: 100,
          bars: [{ label: "Reduction in risk of death", value: 12, display: "12%", accent: true }],
        },
      ],
      source: "Studenski et al., JAMA, 2011 [3]",
    },
    {
      type: "p",
      text: "Walking speed is not the same thing as leg strength, and nobody claims that walking faster on command adds years to your life. Gait speed is a summary measure. It reflects leg strength and power, joint health, balance, heart and lung capacity and nerve function, all at once. That is precisely why it works so well as a signal. The authors found that age, sex and gait speed alone predicted survival about as accurately as models loaded with disease history, blood pressure, weight and hospital records.",
    },
    {
      type: "p",
      text: "The practical reading is simple. The systems that make you a fast, confident walker at 75 are systems worth defending at 45.",
    },

    { type: "h2", text: "The falls cascade, and how much of it is preventable" },
    {
      type: "p",
      text: "More than one in four adults over 65 falls each year in the United States. Those falls produce roughly 3 million emergency department visits and about a million hospital admissions a year, including nearly 319,000 admissions for hip fracture. Falls cause most hip fracture deaths, and one fall roughly doubles the odds of falling again[^4].",
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
      text: "A hip fracture is rarely a self-contained event. It is bed rest, then lost condition, then lost confidence, then less walking, then further strength loss. It is a spiral that starts with one bad landing. The encouraging half of the picture is how responsive that risk turns out to be. A Cochrane review pooled 108 randomised trials across 23,407 people living in the community. Exercise cut the rate of falls by about 23% overall, and the best results came from programmes that combined balance and functional work with resistance training[^5].",
    },
    {
      type: "charts",
      title: "What training changes, in falls and in the very old",
      sub: "Pooled randomised trials in community-dwelling older adults, beside eight weeks of training at mean age 90.",
      panels: [
        {
          kind: "bar",
          caption: "Reduction in fall rate, by type of programme",
          max: 40,
          bars: [
            { label: "Balance, function and resistance", value: 34, display: "34% fewer", accent: true },
            { label: "Balance and functional exercise", value: 24, display: "24% fewer", accent: true },
            { label: "Tai chi", value: 19, display: "19% fewer" },
          ],
        },
        {
          kind: "column",
          caption: "Eight weeks of training at mean age 90",
          max: 180,
          bars: [
            { label: "Knee extensor strength", value: 174, display: "+174%", accent: true },
            { label: "Tandem walking speed", value: 48, display: "+48%", accent: true },
            { label: "Midthigh muscle area", value: 9, display: "+9%" },
          ],
        },
      ],
      source: "Sherrington et al., Cochrane, 2019 [5]; Fiatarone et al., JAMA, 1990 [6]",
    },
    {
      type: "p",
      text: "A third fewer falls is a large effect for something with no side effects worth speaking of. And the mechanism is not mysterious. Stronger, faster legs recover from a stumble that would otherwise become a fall.",
    },

    { type: "h2", text: "“But squats are bad for my knees”" },
    {
      type: "p",
      text: "This is the most common objection to leg training, and it usually has the causality backwards. Weak quadriceps are a risk factor for knee pain and for knee arthritis getting worse. They are not a consequence of avoiding load. Cartilage and tendon are living tissue. They adapt to sensible, progressive stress and they degrade under disuse. The muscles crossing a joint are part of how that joint absorbs shock, and a knee surrounded by strong muscle spends less of its day pushing force through passive structures.",
    },
    {
      type: "p",
      text: "That does not mean any exercise at any load is fine for any knee. It means the answer to a cranky joint is usually a modified movement rather than no movement. A shorter range, a different foot position, a leg press instead of a barbell, a longer warm up, slower progression. If something hurts sharply, in the joint, during or after a set, that is information about your technique, range or load. It is not a verdict on training legs. We took the depth question apart properly in [do squats wreck your knees](/training/squats-knees).",
    },
    {
      type: "p",
      text: "The same logic applies to bone. Bone rebuilds itself in response to the strain put on it, which is why loaded resistance training is a first-line recommendation for keeping bone density. The fracture you are trying to avoid at 80 is most likely at the hip or spine, and those are exactly the sites that squats, hinges and loaded carries stress.",
    },

    { type: "h2", text: "Strength training and the long game" },
    {
      type: "p",
      text: "Zoom out from falls and the association holds across causes. A meta-analysis of prospective cohort studies found that muscle strengthening activity came with roughly a 10% to 17% lower risk of death from any cause. It also came with 10% to 20% lower risk of heart disease and cancer. The dose that captured most of the benefit was modest, somewhere between 30 and 60 minutes a week, and adding aerobic activity on top pushed the associations further[^7].",
    },
    {
      type: "p",
      text: "Thirty to sixty minutes a week. That is two short sessions. The barrier to entry is genuinely low, which makes the widespread avoidance of resistance training all the more expensive. It is also a floor rather than a target. The [US Physical Activity Guidelines](https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines) ask for muscle strengthening work on two or more days a week alongside aerobic activity, and note that the two together do more than either alone.",
    },

    { type: "h2", text: "It is not too late, and that is not a platitude" },
    {
      type: "p",
      text: "The most cited demonstration of this is decades old and still striking. Researchers put nine frail nursing home residents, mean age 90, through eight weeks of progressive resistance training three times a week. Knee extensor strength rose by an average of 174%. Midthigh muscle area grew about 9%. Tandem walking speed improved by 48%[^6].",
    },
    {
      type: "p",
      text: "Two things stand out. First, the strength gains dwarfed the size gains. That is the same relationship seen in decline, running in reverse. Much of what you gain early is neural, meaning better recruitment of the muscle you already have. Second, these were not healthy masters athletes. They were frail, institutionalised ninety year olds. If eight weeks can produce that, the phrase too old to start deserves retirement.",
    },

    { type: "h2", text: "What actually works" },
    {
      type: "p",
      text: "The World Health Organization recommends that all adults do muscle strengthening activity involving the major muscle groups on at least two days a week. It asks adults 65 and over to add work emphasising balance and strength on three or more days[^10]. US federal guidance says essentially the same[^12]. Beneath that framework, a lower-body programme needs only a handful of movement patterns.",
    },

    { type: "h3", text: "1. Squat something, twice a week" },
    {
      type: "p",
      text: "Any loaded knee bend counts. Back squat, goblet squat, leg press, or standing up from a low box if you are starting from scratch. Two to four sets in the 5 to 12 rep range, taken close enough to failure that the last couple of reps are genuinely hard. The load matters less than the effort and the consistency. What does matter is that it gets harder over time. Add a little weight, a rep, or a set when the current version stops feeling difficult. That mechanism is the whole thing, and we set it out in [progressive overload](/training/progressive-overload).",
    },

    { type: "h3", text: "2. Hinge at the hip" },
    {
      type: "p",
      text: "Deadlifts, Romanian deadlifts, hip thrusts or back extensions train the glutes and hamstrings, which squats alone under-serve. This is the pattern that protects your back when you pick up something heavy and awkward, which is how most people actually hurt themselves.",
    },

    { type: "h3", text: "3. Train one leg at a time" },
    {
      type: "figure",
      src: "/articles/leg-strength/dumbbell-split-squat.jpg",
      alt: "A woman performing a dumbbell split squat, rear knee lowered toward the floor.",
      width: 1400,
      height: 2100,
      layout: "wrap-right",
      caption: "A split squat trains the position you spend most of every stride in, with one leg loaded and the other passing through.",
      credit: "Amar / Pexels",
      sourceUrl: "https://www.pexels.com/photo/14673249/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "Walking, stairs and stumble recovery are all single-leg events. Split squats, step-ups and lunges expose the side-to-side imbalances that two-legged lifts hide, and they load balance and hip stability at the same time. This matters more than it sounds. A two-legged squat lets the stronger side quietly cover for the weaker one, and that gap can persist for years without showing up in any number you track. Standing on one leg removes the option. It is also the position you are in for roughly 40% of every walking stride, so controlling it is not an accessory to walking. It is walking. Start with your bodyweight and a hand on a doorframe, and add load only once you can lower under control rather than drop.",
    },

    { type: "h3", text: "4. Train speed, not just strength" },
    {
      type: "p",
      text: "Because power declines fastest, add something explosive. A light jump, a fast push on the leg press, a brisk step-up, a medicine ball throw. Keep the load light and the intent maximal. The goal is speed, not fatigue. A few sets of 3 to 5 fast reps, early in the session while you are fresh, is enough.",
    },

    { type: "h3", text: "5. Carry things and walk" },
    {
      type: "p",
      text: "Loaded carries and hills build the unglamorous everyday capacity that shows up in gait speed. They also double as a signal you can watch. If your usual walk to the shop has quietly got slower over two years, that is data.",
    },

    { type: "h3", text: "6. Do not skip the calves" },
    {
      type: "p",
      text: "The calves are named in every list of leg muscles and trained in almost none of them. They are also the muscles that push you off the ground at the end of every step, absorb the landing when you come down a kerb, and hold the ankle steady when the ground turns out to be less level than you assumed. Ankle strength and range both narrow with age. A stiff, weak ankle shifts the work of balancing upward to the hip, where the corrections are slower and larger. Straight-leg calf raises off a step, lowering under control through a full range, cost nothing and take two minutes. Do them where you will actually see them, by a stair rather than in a programme you never open.",
    },

    { type: "h2", text: "How to know whether it is working" },
    {
      type: "p",
      text: "Two tests need nothing beyond a chair and a stopwatch. The first is the 30-second chair stand, which counts how many times you can rise fully from a standard chair without using your arms in 30 seconds. It is the test the CDC fall prevention programme uses to flag risk. The [CDC assessment sheet](https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf) gives the full protocol, including the detail most people get wrong: arms crossed at the wrists, against the chest, the whole time. Below-average scores by age and sex are shown below[^9].",
    },
    {
      type: "video",
      youtubeId: "O1BXw0abQLs",
      title: "30-Second Sit-to-Stand Test | Muscle Power Assessment in Elderly",
      caption: "The chair stand test performed properly, including the arm position and the counting rule. Watch this before you score yourself, because the common mistakes all inflate the result.",
    },
    {
      type: "table",
      caption: "30-second chair stand, where a below-average score indicates fall risk",
      columns: ["Age", "Men, fewer than", "Women, fewer than"],
      rows: [
        ["60 to 64", "14 stands", "12 stands"],
        ["65 to 69", "12 stands", "11 stands"],
        ["70 to 74", "12 stands", "10 stands"],
        ["75 to 79", "11 stands", "10 stands"],
        ["80 to 84", "10 stands", "9 stands"],
        ["85 to 89", "8 stands", "8 stands"],
        ["90 to 94", "7 stands", "4 stands"],
      ],
      source: "CDC STEADI, Assessment: 30-Second Chair Stand [9]",
    },
    {
      type: "p",
      text: "The second test is walking speed. Mark out four metres, walk it at your normal pace, and divide the distance by the time. Anything comfortably above 1.0 metres per second is reassuring. Drifting below 0.8 is worth paying attention to. Retest both every few months. If the chair stand number is climbing and your walk is holding or getting quicker, the programme is doing its job, whatever the barbell says.",
    },

    { type: "h2", text: "The short version" },
    {
      type: "p",
      text: "Lower-body strength declines faster than muscle mass, and power declines faster still. Those declines predict the loss of independence, meaning slower walking, harder chair rises, more falls and more fractures. The measures that capture them predict survival about as well as a full medical history. Two sessions a week, totalling under an hour, is associated with meaningfully lower mortality risk, and structured leg training cuts fall rates by roughly a third. The response to training persists into the tenth decade of life.",
    },
    {
      type: "p",
      text: "Strong legs are not really about lifting. They are about how much of your own life you get to keep running yourself, and for how long.",
    },
    {
      type: "p",
      text: "If you want a number to start from rather than a feeling, the [strength scan](/) estimates a one rep max from a single set you have already done and places it against population standards. The [method behind those estimates](/methodology) is written up separately, including where it is least reliable.",
    },

    {
      type: "cta",
      title: "Where do your legs stand right now?",
      text: "Enter one squat or deadlift set and get an estimated 1-rep max, your strength tier, and training zones. Free, no signup.",
      label: "Get my strength scan →",
      href: "/",
    },
  ],

  sources: [
    {
      n: 1,
      text: "The Loss of Skeletal Muscle Strength, Mass, and Quality in Older Adults",
      url: "https://academic.oup.com/biomedgerontology/article/61/10/1059/600461",
    },
    {
      n: 2,
      text: "Skeletal Muscle Power: A Critical Determinant of Physical Functioning in Older Adults",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3245773/",
    },
    {
      n: 3,
      text: "Gait Speed and Survival in Older Adults",
      url: "https://jamanetwork.com/journals/jama/fullarticle/645520",
    },
    {
      n: 4,
      text: "Facts About Falls",
      url: "https://www.cdc.gov/falls/data-research/facts-stats/index.html",
    },
    {
      n: 5,
      text: "Exercise for preventing falls in older people living in the community",
      url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012424.pub2/full",
    },
    {
      n: 6,
      text: "High-Intensity Strength Training in Nonagenarians",
      url: "https://jamanetwork.com/journals/jama/article-abstract/382128",
    },
    {
      n: 7,
      text: "Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases",
      url: "https://bjsm.bmj.com/content/56/13/755",
    },
    {
      n: 8,
      text: "Skeletal Muscle Insulin Resistance Is the Primary Defect in Type 2 Diabetes",
      url: "https://diabetesjournals.org/care/article/32/suppl_2/S157/27357/Skeletal-Muscle-Insulin-Resistance-Is-the-Primary",
    },
    {
      n: 9,
      text: "Assessment: 30-Second Chair Stand",
      url: "https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf",
    },
    {
      n: 10,
      text: "WHO Guidelines on Physical Activity and Sedentary Behaviour",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK566046/",
    },
    {
      n: 11,
      text: "Preserve your muscle mass",
      url: "https://www.health.harvard.edu/staying-healthy/preserve-your-muscle-mass",
    },
    {
      n: 12,
      text: "Physical Activity Guidelines for Americans, 2nd edition",
      url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    },
  ],
};
