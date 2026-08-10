#!/usr/bin/env node
/**
 * Body stats for Bedrock.fit articles.
 *
 *   node scripts/articles-stats.mjs                 # every registered article
 *   node scripts/articles-stats.mjs sarcopenia      # just these
 *   node scripts/articles-stats.mjs --json          # machine-readable
 *
 * Prints the numbers an author needs when filling in front matter: body
 * characters, word count, and the `readingMinutes` those words imply.
 *
 * Deliberately does not parse anything itself. `check-article.mjs` already
 * walks the TypeScript AST, decides which blocks count toward the body, and
 * strips the inline syntax before measuring, and a second implementation of
 * those three decisions would drift from the first the moment either changed.
 * So this runs the checker in `--json` mode and reformats what comes back.
 *
 * That also means the numbers here are the same numbers the checker enforces.
 * If this says 2,388 words, `wordCount: 2388` is what will stop it warning.
 *
 * Always exits 0. The checker exits 1 when an article fails its rules, which is
 * correct for a gate and wrong for a report: you most want the stats for the
 * piece that is currently failing on length.
 */

import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(HERE, "check-article.mjs");

/** Words per minute assumed for `readingMinutes`. Matches docs/ARTICLE-GUIDE.md. */
const WPM = 220;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const slugs = args.filter((a) => !a.startsWith("--"));

const run = spawnSync(process.execPath, [CHECKER, "--json", ...slugs], {
  encoding: "utf8",
  cwd: resolve(HERE, ".."),
});

if (run.error) {
  console.error(`Could not run check-article.mjs: ${run.error.message}`);
  process.exit(1);
}

/* The checker prints JSON on stdout and nothing else in --json mode, but it
   still exits 1 when an article fails. Parse regardless of exit code, and only
   treat unparseable output as a real failure. */
let results;
try {
  results = JSON.parse(run.stdout);
} catch {
  console.error("check-article.mjs did not return JSON. Its output was:\n");
  console.error(run.stdout || run.stderr || "(nothing)");
  process.exit(1);
}

const withReading = results.map((r) => ({
  slug: r.slug,
  title: r.title,
  draft: r.draft,
  chars: r.chars,
  words: r.words,
  readingMinutes: Math.max(1, Math.round(r.words / WPM)),
}));

if (asJson) {
  console.log(JSON.stringify(withReading, null, 2));
  process.exit(0);
}

const DIM = "\x1b[2m", OFF = "\x1b[0m", BOLD = "\x1b[1m";
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

const w = Math.max(4, ...withReading.map((r) => r.slug.length));

console.log(
  `\n${BOLD}${pad("slug", w)}  ${padL("chars", 7)}  ${padL("words", 6)}  ${padL("min", 4)}${OFF}`
);
console.log(DIM + "-".repeat(w + 23) + OFF);

for (const r of withReading) {
  console.log(
    `${pad(r.slug, w)}  ${padL(r.chars.toLocaleString(), 7)}  ${padL(r.words.toLocaleString(), 6)}  ${padL(r.readingMinutes, 4)}${r.draft ? DIM + "  (draft)" + OFF : ""}`
  );
}

console.log(
  `\n${DIM}readingMinutes assumes ${WPM} words per minute. Copy these into the article's front matter.${OFF}\n`
);
