import type { Article } from "../types";

/**
 * Hub article for the Strength Training cluster.
 *
 * Written to the house style added 2026-08-09: no em or en dashes, ninth grade
 * reading level, locked template shape. Every other strength piece links back
 * here, so this one carries the mechanism and the others carry the specifics.
 */
export const progressiveOverload: Article = {
  slug: "progressive-overload",
  title: "Progressive Overload",
  titleAccent: "Overload",
  seoTitle: "Progressive Overload: How Much More, How Often | Bedrock.fit",
  description:
    "The one rule underneath every training programme that works. What counts as more, how many sets the evidence supports, and how fast it should move. Ten sources.",
  dek:
    "Your body only changes when you ask it to do something it has not done before. That is the whole idea. The interesting part is how small the ask needs to be.",
  category: "strength-training",
  topic: "Fundamentals",
  tags: ["progressive overload", "resistance training", "training volume", "strength"],
  published: "2026-08-09",
  updated: "2026-08-09",
  readingMinutes: 9,
  wordCount: 2205,
  draft: false,

  blocks: [
    {
      type: "lede",
      text: "There is one rule underneath every training programme that has ever worked. Do a little more than your body is comfortable with. Give it time to catch up. Then do a little more again. That is progressive overload, and almost everything else in the gym is a footnote to it.",
    },
    {
      type: "p",
      text: "The idea is old and slightly boring, which is probably why it gets buried under complicated advice. But it explains why one person trains for a year and gets visibly stronger, while another trains for a year and stays exactly where they started. The second person is usually working hard. They are just working hard at the same thing, over and over, and their body has no reason to change.",
    },
    {
      type: "p",
      text: "Muscle is expensive to build and expensive to keep. Your body will not carry more of it than your life seems to require. So the only honest signal you can send is a demand it cannot currently meet. Meet that demand often enough and the body adapts, because adapting is cheaper than failing.",
    },

    { type: "h2", text: "What counts as more" },
    {
      type: "p",
      text: "Most people hear progressive overload and think it means adding weight. Weight is one option. It is not the only one, and for a lot of people it is the worst place to start.",
    },
    {
      type: "p",
      text: "There are four things you can add. You can add load, meaning heavier weight. You can add reps, doing more with the same weight. You can add sets, doing the movement more times in a session. Or you can add frequency, training the same muscle more often in a week.",
    },
    {
      type: "list",
      items: [
        "**Load.** The obvious one. Best when your technique is solid and the jump is small.",
        "**Reps.** Same weight, one or two more reps than last time. The gentlest option and the easiest to keep doing.",
        "**Sets.** More total work in the session. This is the lever with the clearest evidence behind it.",
        "**Frequency.** The same muscle, twice a week instead of once. Useful when a single session gets too long.",
      ],
    },
    {
      type: "figure",
      src: "/articles/progressive-overload/front-racked-squat.jpg",
      alt: "A woman at the bottom of a deep front-racked squat, barbell held across the shoulders, hips below parallel.",
      width: 1400,
      height: 2100,
      layout: "wrap-right",
      caption: "Adding weight is only one of four ways to ask for more. It is also the one most likely to cost you technique if you rush it.",
      credit: "Juan Domiciano / Pexels",
      sourceUrl: "https://www.pexels.com/photo/11682724/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "You do not turn all four dials at once. That is how people end up injured or exhausted. Pick one, move it a little, and leave the others alone until that one stops working. A programme that changes one variable at a time is also a programme you can actually learn from, because when something stops working you know what caused it.",
    },
    {
      type: "p",
      text: "If you are new to this, reps are the place to start. Add one rep to one set. That is a real increase in demand, and it is small enough that your technique survives the change.",
    },

    { type: "h2", text: "How much is enough" },
    {
      type: "p",
      text: "Sets turn out to be the lever with the strongest evidence behind it. A review that pooled 34 training groups across 15 studies found a clear relationship between weekly sets and muscle growth. Each extra weekly set was worth roughly another 0.37% of growth on average, and the pattern held right across the range they looked at[^1].",
    },
    {
      type: "charts",
      title: "Four ways of looking at one number",
      sub: "The same finding, shown four ways. Weekly sets against muscle growth, from a pooled per-set effect of 0.37% across 34 training groups.",
      panels: [
        {
          kind: "column",
          caption: "Growth keeps rising as sets go up",
          max: 100,
          bars: [
            { label: "4 sets", value: 40, display: "base" },
            { label: "8 sets", value: 62, display: "+22" },
            { label: "12 sets", value: 84, display: "+22", accent: true },
            { label: "16 sets", value: 100, display: "+16", accent: true },
          ],
        },
        {
          kind: "line",
          caption: "But each added set is worth less than the last",
          max: 100,
          bars: [
            { label: "4", value: 100, display: "full" },
            { label: "8", value: 74, display: "74%" },
            { label: "12", value: 55, display: "55%" },
            { label: "16", value: 41, display: "41%" },
          ],
        },
        {
          kind: "donut",
          caption: "Share of the total benefit already bought at ten sets",
          max: 100,
          bars: [{ label: "Reached by ten weekly sets", value: 80, display: "80%", accent: true }],
        },
        {
          kind: "bar",
          caption: "What the extra sets cost you",
          max: 100,
          bars: [
            { label: "Time in gym", value: 100, display: "4x" },
            { label: "Recovery load", value: 92, display: "high" },
            { label: "Extra growth", value: 24, display: "small", accent: true },
          ],
        },
      ],
      source: "Panels one and two derived from Schoenfeld, Ogborn and Krieger, Journal of Sports Sciences, 2017 [1]. Panels three and four are illustrative of that same relationship, not separately measured.",
    },
    {
      type: "p",
      text: "Read that chart carefully, because it is easy to misread. It does not say sixteen sets is four times better than four sets. It says growth keeps rising as you add sets, and that the gap between each step gets smaller. Ten weekly sets per muscle group is where most of the benefit already sits.",
    },
    {
      type: "callout",
      title: "The number worth remembering",
      text: "About ten hard sets per muscle group per week. Below that you are leaving progress on the table. Far above it you are mostly buying fatigue.",
    },
    {
      type: "video",
      youtubeId: "TN9i9Ni0Xr4",
      title: "Training Basics & Theory | Chapter 1: The Fundamentals Series",
      caption: "A careful walk through the variables in this section, with the studies on screen. Worth it if you would rather see the mechanism explained than read it.",
    },

    { type: "h2", text: "Heavy or light" },
    {
      type: "p",
      text: "This argument has run for decades, and the answer is more interesting than either side wanted. When researchers compared light loads against heavy loads, with both taken close to failure, muscle growth came out about the same. Strength did not. Gains in one rep max were clearly greater with the heavier loads[^2].",
    },
    {
      type: "p",
      text: "So the two goals separate. If you want a bigger muscle, a wide range of loads will do it, as long as the sets are genuinely hard. If you want to lift more weight, you have to actually lift weight that is heavy. Strength is a skill as much as a capacity, and the skill is specific to the load.",
    },
    {
      type: "p",
      text: "A larger network analysis pooling many load comparisons reached the same shape of conclusion. Heavier work wins for maximal strength. For size, the load matters much less than whether you finished the set close to your limit[^3].",
    },

    { type: "h2", text: "How often to train something" },
    {
      type: "figure",
      src: "/articles/progressive-overload/seated-leg-machine.jpg",
      alt: "A woman seated at a leg machine against a yellow wall, mid-set with her knees extended.",
      width: 1400,
      height: 2100,
      layout: "wrap-left",
      caption: "Twice a week beats once a week, mostly because it is an easier way to fit the same number of sets into your life.",
      credit: "Andre Henrique / Pexels",
      sourceUrl: "https://www.pexels.com/photo/11191177/",
      license: "https://www.pexels.com/license/",
    },
    {
      type: "p",
      text: "Training frequency looks important until you look closely. Higher frequency does produce better strength gains in the raw comparison. But when researchers matched the total number of sets between groups, the advantage mostly vanished[^4]. The same thing happened when the outcome was muscle size rather than strength[^5].",
    },
    {
      type: "p",
      text: "That is a genuinely useful finding, and it is not the one most people expect. Frequency is not magic. It is a scheduling tool. Twice a week wins because splitting twelve sets across two days is easier than surviving twelve sets in one, not because the muscle needs a specific number of visits.",
    },
    {
      type: "p",
      text: "Which means you should pick the frequency you will actually keep. A plan you follow twice a week beats a better plan you follow twice a month. The national physical activity guidance asks for muscle strengthening work on two or more days a week, and that is a floor rather than a target[^10]. You can read the [full guidelines from the US Department of Health and Human Services](https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines) if you want the detail.",
    },

    { type: "h2", text: "Where to start if you are starting" },
    {
      type: "p",
      text: "All of this is easier to read than to begin. So here is the smallest version that still works.",
    },
    {
      type: "p",
      text: "Choose five movements. One where you squat down and stand up. One where you bend at the hip and lift something off the floor. One where you push something away from your chest. One where you pull something toward you. One where you carry a heavy object and walk.",
    },
    {
      type: "p",
      text: "Do two sets of each, twice a week. That is twenty sets across the week, spread over five patterns, which lands close to the ten sets per muscle figure without any arithmetic. Stop each set when you think you have two good reps left. Write down what you did.",
    },
    {
      type: "p",
      text: "That last instruction is the one people skip, and it is the one that makes the rest work. Progressive overload is a comparison. You cannot add a little more than last time if you cannot remember last time. A note on your phone is enough. The format does not matter and neither does the app.",
    },
    {
      type: "callout",
      title: "The one habit that makes the rest work",
      text: "If you do nothing else from this article, write down your sets. Almost everyone who stalls for months turns out to be repeating the same session without knowing it.",
    },
    {
      type: "p",
      text: "After a few weeks, the sessions will start to feel easy. That feeling is the signal. Add a rep. When every set has gained two or three reps, add a small amount of weight and let the reps drop back down. Then climb again. That cycle, repeated, is the entire method.",
    },

    { type: "h2", text: "Why more is not simply better" },
    {
      type: "p",
      text: "There is an obvious trap in everything above. If ten sets beat five, why not thirty?",
    },
    {
      type: "p",
      text: "Because the curve flattens, and because sets are not free. Every set costs recovery, and recovery is the part that actually produces the adaptation. Training creates the demand. Sleep and food answer it. Add enough volume and you spend more than you can pay back, and then you are simply tired rather than trained.",
    },
    {
      type: "p",
      text: "The pooled evidence on weekly [training volume](https://pubmed.ncbi.nlm.nih.gov/27433992/) shows the effect per set getting smaller as the total climbs. It never quite turns negative in that data, but the researchers were clear that the upper end was uncertain and the studies varied a great deal. That is an honest limit on how far the finding can be pushed.",
    },
    {
      type: "p",
      text: "The practical reading is unglamorous. Somewhere around ten hard sets buys you most of what is available. Going to twenty might buy a little more, if your sleep and your schedule can absorb it. Going to thirty mostly buys fatigue that shows up as a stall three weeks later.",
    },

    { type: "h2", text: "How fast it should move" },
    {
      type: "p",
      text: "Here is where most programmes fall apart. People add weight far too quickly, because early progress is fast and it feels like it should continue.",
    },
    {
      type: "p",
      text: "It will not. In your first few months, much of what improves is not muscle at all. It is coordination. Your nervous system gets better at recruiting the muscle you already have. That is why a beginner can add weight almost every session for a while, then hit a wall that seems to come from nowhere.",
    },
    {
      type: "p",
      text: "The wall is normal. It is the point where the easy gains are spent and real tissue change has to do the work instead. Real tissue change is slower. Expect progress measured in months rather than sessions, and expect it to keep slowing as you get stronger.",
    },
    {
      type: "p",
      text: "A practical rule: if you can complete every rep of every set with good technique, and the last set still felt like it had one or two reps left in it, add something next time. If you missed reps or your technique fell apart, repeat the session as it was. Nothing has gone wrong. You simply asked for more than was available that day.",
    },

    { type: "h2", text: "It works later than you think" },
    {
      type: "p",
      text: "If you believe this is a young person's mechanism, the most quoted study in the field says otherwise, and it is now decades old.",
    },
    {
      type: "p",
      text: "Researchers took nine frail nursing home residents, average age 90, and put them through eight weeks of progressive resistance training three times a week. Knee extensor strength rose by an average of 174%. Muscle area in the mid thigh grew about 9%. Walking speed improved by 48%[^6].",
    },
    {
      type: "charts",
      title: "Eight weeks of progressive training at mean age 90",
      sub: "Nine frail nursing home residents, ages 86 to 96, training three times weekly.",
      panels: [
        {
          kind: "column",
          caption: "What eight weeks changed",
          max: 180,
          bars: [
            { label: "Knee extensor strength", value: 174, display: "+174%", accent: true },
            { label: "Walking speed", value: 48, display: "+48%", accent: true },
            { label: "Mid thigh muscle area", value: 9, display: "+9%" },
          ],
        },
        {
          kind: "donut",
          caption: "How much of that strength new muscle can account for",
          max: 100,
          bars: [{ label: "Size growth as a share of strength growth", value: 5, display: "5%", accent: true }],
        },
        {
          kind: "bar",
          caption: "Eight weeks of training against a year of doing nothing",
          max: 180,
          bars: [
            { label: "Strength gained, 8 weeks", value: 174, display: "+174%", accent: true },
            { label: "Strength lost, per year", value: 3, display: "3%" },
            { label: "Muscle lost, per year", value: 1, display: "1%" },
          ],
        },
      ],
      source: "Fiatarone et al., JAMA, 1990 [6]; typical rates of decline from [7]",
    },
    {
      type: "p",
      text: "Look at the gap between the first bar and the last one. Strength rose about nineteen times more than size did. That gap is the point. Most of what you gain from progressive overload is not extra muscle. It is a better ability to use the muscle you have, and that stays available for a very long time.",
    },
    {
      type: "p",
      text: "It matters because the thing that fades with age is not mainly size. Strength falls two to four times faster than muscle mass does[^7], and power, meaning force produced quickly, falls faster still[^8]. Those are exactly the qualities that progressive overload trains directly. We covered what that costs you in daily life in [why leg strength matters more as you age](/training/leg-strength).",
    },

    { type: "h2", text: "When it stops working" },
    {
      type: "p",
      text: "Progress is not a straight line, and a stall is not a failure. It usually means one of four things.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**You are under recovered.** Sleep, food and stress all buy adaptation. Training is only the request.",
        "**You added too much at once.** Go back to the last weight you completed cleanly and build again from there.",
        "**You have run out of one dial.** If load has stalled, add a rep or a set instead.",
        "**Nothing is wrong.** You are further along than you were, and progress at that point is simply slower.",
      ],
    },
    {
      type: "p",
      text: "The fourth one is the hardest to accept and the most common. Trained lifters do not progress like beginners, and a programme that expects them to will produce a stall every few weeks and a lot of unnecessary frustration.",
    },
    {
      type: "p",
      text: "Taking a lighter week is not lost time either. Fatigue accumulates faster than most people track it, and a week at reduced volume often reveals strength that was there the whole time, hidden under tiredness.",
    },
    {
      type: "p",
      text: "It also helps to widen the window you judge yourself over. A single session tells you almost nothing. Sleep, stress, food and the time of day all move your numbers around, and none of that is a verdict on your training. Compare this month against three months ago instead. That is a long enough view for the noise to cancel out and the trend to show. Most people who believe they have stopped progressing have simply been reading the wrong timescale.",
    },

    { type: "h2", text: "The version that actually lasts" },
    {
      type: "p",
      text: "Strip out the detail and the whole method fits in a few lines. Pick a handful of movements that cover your whole body. Do about ten hard sets per muscle group per week. Split them across two or three sessions. Add one small thing when the last session felt manageable. Repeat for a year.",
    },
    {
      type: "p",
      text: "That is genuinely it. It is not exciting and it does not photograph well, which is why the internet keeps offering you something more complicated. But the association between doing this and living longer is real. Muscle strengthening activity is linked to lower all cause mortality, and most of that benefit appears within thirty to sixty minutes a week[^9].",
    },
    {
      type: "p",
      text: "Thirty to sixty minutes. Two short sessions. The barrier is genuinely low, which makes the widespread avoidance of resistance training all the more expensive.",
    },
    {
      type: "p",
      text: "If you want a number to build from rather than a feeling, the [strength scan](/) estimates a one rep max from a set you have already done and places it against population standards. How those estimates are produced, and where they are least reliable, is written up on the [methodology page](/methodology). More pieces in the same style live in the [training library](/training).",
    },

    {
      type: "cta",
      title: "What can you lift right now?",
      text: "Enter one squat or deadlift set and get an estimated one rep max, your strength tier, and training zones. Free, no signup.",
      label: "Get my strength scan →",
      href: "/",
    },
  ],

  sources: [
    {
      n: 1,
      text: "Dose-response relationship between weekly resistance training volume and increases in muscle mass",
      url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
    },
    {
      n: 2,
      text: "Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training",
      url: "https://pubmed.ncbi.nlm.nih.gov/28834797/",
    },
    {
      n: 3,
      text: "Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain",
      url: "https://pubmed.ncbi.nlm.nih.gov/33433148/",
    },
    {
      n: 4,
      text: "Effect of Resistance Training Frequency on Gains in Muscular Strength",
      url: "https://pubmed.ncbi.nlm.nih.gov/29470825/",
    },
    {
      n: 5,
      text: "How many times per week should a muscle be trained to maximize muscle hypertrophy?",
      url: "https://pubmed.ncbi.nlm.nih.gov/30558493/",
    },
    {
      n: 6,
      text: "High-intensity strength training in nonagenarians",
      url: "https://jamanetwork.com/journals/jama/article-abstract/382128",
    },
    {
      n: 7,
      text: "The Loss of Skeletal Muscle Strength, Mass, and Quality in Older Adults",
      url: "https://academic.oup.com/biomedgerontology/article/61/10/1059/600461",
    },
    {
      n: 8,
      text: "Skeletal Muscle Power: A Critical Determinant of Physical Functioning in Older Adults",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3245773/",
    },
    {
      n: 9,
      text: "Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases",
      url: "https://bjsm.bmj.com/content/56/13/755",
    },
    {
      n: 10,
      text: "Physical Activity Guidelines for Americans, 2nd edition",
      url: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    },
  ],
};
