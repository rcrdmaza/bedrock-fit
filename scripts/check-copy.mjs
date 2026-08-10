#!/usr/bin/env node
/**
 * House style gate for everything that is not an article.
 *
 *   npm run build && npm run check:copy
 *   node scripts/check-copy.mjs --json
 *
 * `check-article.mjs` only reads src/lib/articles/content/, so it guards four
 * files and nothing else. That is why roughly thirty dashes accumulated across
 * the marketing and support pages and why five routes drifted past the reading
 * target without anyone noticing. This closes that gap.
 *
 * Runs against **built HTML**, not source, for three reasons the source-based
 * approach got wrong:
 *
 *   1. `&mdash;` entities are invisible to a search for the literal character.
 *      Six of methodology's seven dashes were written that way, so a source
 *      grep reported that page as carrying one.
 *   2. Copy in a component is rendered on every route that uses it. A dash in
 *      the shared footer is a dash on ten pages, and only the output shows that.
 *   3. Comments contain dashes freely and legitimately. Rendered output has no
 *      comments in it, so there is nothing to filter and nothing to argue about.
 *
 * Requires a build first. It fails loudly rather than silently passing when
 * .next/server/app is missing, because a gate that quietly succeeds on no input
 * is worse than no gate.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { fleschKincaid, MAX_GRADE, BANNED_DASHES } from "./lib/readability.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, ".next/server/app");

/**
 * Routes exempt from the reading grade, and only from the reading grade. The
 * dash rule has no exemptions anywhere.
 *
 * Both are legal documents. They exist to be enforceable and to satisfy privacy
 * law, and simplifying them costs meaning: a shortened limitation of liability
 * can narrow what it covers, and a tidied data disclosure can become inaccurate.
 * Both have already had their throat-clearing removed and their non-operative
 * sentences split; what is left is long because the law needs it to be long.
 *
 * See the "Bring methodology and support pages to the house reading level"
 * commit for the clause-by-clause reasoning on what was left and why.
 */
const GRADE_EXEMPT = new Map([
  ["/privacy", "legal document, simplifying narrows what it covers"],
  ["/terms", "legal document, simplifying narrows what it covers"],
]);

/** Routes with no meaningful prose to grade. */
const MIN_WORDS = 40;

const ENTITIES = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”",
  "&nbsp;": " ", "&copy;": "©", "&mdash;": "—", "&ndash;": "–",
  "&times;": "×", "&hellip;": "…",
};

/**
 * Visible text of a page.
 *
 * Scripts are dropped first, which also drops the RSC flight payload. That
 * payload repeats most of the page's copy as JSON, so counting it would double
 * every finding and report dashes that no reader can see.
 */
function visibleText(html) {
  let t = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  t = t.replace(/<!--[\s\S]*?-->/g, " ");
  t = t.replace(/<[^>]+>/g, " ");
  t = t.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
  t = t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  t = t.replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ");
  return t.replace(/\s+/g, " ").trim();
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : []
  );
}

function routeOf(file) {
  const r = "/" + relative(APP, file).replace(/\.html$/, "");
  return r === "/index" ? "/" : r;
}

/* ── run ───────────────────────────────────────────────────────────────── */

if (!existsSync(APP)) {
  console.error(`No built output at ${relative(ROOT, APP)}. Run \`npm run build\` first.`);
  process.exit(1);
}

const files = htmlFiles(APP).sort();
if (!files.length) {
  console.error(`No HTML found under ${relative(ROOT, APP)}. Run \`npm run build\` first.`);
  process.exit(1);
}

const asJson = process.argv.includes("--json");
const results = [];

for (const file of files) {
  const route = routeOf(file);
  const text = visibleText(readFileSync(file, "utf8"));
  const words = text.split(/\s+/).filter(Boolean).length;

  /* Built from the shared pattern rather than retyped, so there is exactly one
     definition of "banned dash" across both gates. matchAll needs the global
     flag, which the shared constant deliberately does not carry. */
  const dashes = [...text.matchAll(new RegExp(BANNED_DASHES.source, "g"))].map((m) => ({
    char: m[0],
    context: text.slice(Math.max(0, m.index - 45), m.index + 45),
  }));

  const graded = words >= MIN_WORDS;
  const grade = graded ? Number(fleschKincaid(text).toFixed(1)) : null;
  const exemptReason = GRADE_EXEMPT.get(route);

  const problems = [];
  for (const d of dashes) {
    problems.push(`Dash "${d.char}" in rendered copy: ...${d.context.trim()}...`);
  }
  if (graded && !exemptReason && grade > MAX_GRADE) {
    problems.push(`Reading level: grade ${grade} — target is ${MAX_GRADE.toFixed(1)} or below`);
  }

  results.push({ route, words, grade, exempt: exemptReason ?? null, dashes: dashes.length, problems });
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.problems.length) ? 1 : 0);
}

const GREEN = "\x1b[32m", RED = "\x1b[31m", YEL = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";
const w = Math.max(6, ...results.map((r) => r.route.length));

console.log(`\n${DIM}${"route".padEnd(w)}  ${"words".padStart(6)}  ${"grade".padStart(6)}  dashes${OFF}`);
console.log(DIM + "-".repeat(w + 24) + OFF);

for (const r of results) {
  const ok = r.problems.length === 0;
  const gradeCell = r.grade === null ? "n/a" : String(r.grade);
  const note = r.exempt ? `${YEL}  exempt${OFF}` : "";
  console.log(
    `${ok ? GREEN + "✓" : RED + "✗"}${OFF} ${r.route.padEnd(w - 2)}  ${String(r.words).padStart(6)}  ${gradeCell.padStart(6)}  ${String(r.dashes).padStart(6)}${note}`
  );
  for (const p of r.problems) console.log(`    ${RED}✗${OFF} ${p}`);
}

const exempt = results.filter((r) => r.exempt);
if (exempt.length) {
  console.log(`\n${DIM}Grade-exempt routes (the dash rule still applies to them):${OFF}`);
  for (const r of exempt) console.log(`${DIM}  ${r.route}  grade ${r.grade}  ${r.exempt}${OFF}`);
}

const failed = results.filter((r) => r.problems.length).length;
console.log(
  `\n${failed ? RED : GREEN}${results.length - failed}/${results.length} routes passing${OFF}\n`
);

process.exit(failed ? 1 : 0);
