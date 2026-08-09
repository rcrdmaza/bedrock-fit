#!/usr/bin/env node
/**
 * Pre-publish checker for Bedrock.fit articles.
 *
 *   node scripts/check-article.mjs                 # every registered article
 *   node scripts/check-article.mjs progressive-overload leg-strength
 *   node scripts/check-article.mjs --json          # machine-readable
 *
 * Enforces the rules in docs/ARTICLE-GUIDE.md that a type checker can't:
 * character count, link minimums, footnote integrity, figure metadata, and
 * whether the image files themselves carry IPTC/XMP.
 *
 * Parses the content files through the TypeScript compiler's own AST rather
 * than importing them — no build step, no transpiler, no dependencies beyond
 * the `typescript` already in devDependencies. Reading the source also means a
 * draft with a deliberate error still gets checked.
 *
 * Exit code 1 if any article fails, so it works as a pre-commit or CI gate.
 */

import ts from "typescript";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "src/lib/articles/content");
const PUBLIC_DIR = join(ROOT, "public");

/* ── rules ─────────────────────────────────────────────────────────────── */

const RULES = {
  chars:            { min: 11960, max: 14040, label: "Body characters (13,000 ±8%)" },
  internalLinks:    { min: 3,     max: 6,     label: "Internal links" },
  inlineExternal:   { min: 2,     max: 4,     label: "Inline external links" },
  sources:          { min: 8,     max: 12,    label: "Citations" },
  charts:           { min: 2,     max: 4,     label: "Charts" },
};

/* Blocks whose prose counts toward the character target. Chart labels, table
   cells, figure captions, sources and the CTA are deliberately excluded. */
const COUNTED = new Set(["lede", "p", "h2", "h3", "list", "callout", "quote"]);

/* ── tiny TS-AST readers ───────────────────────────────────────────────── */

const isObj = (n) => ts.isObjectLiteralExpression(n);

/** Literal value of a property, or undefined. Handles strings, numbers, booleans and arrays of strings. */
function prop(objNode, name) {
  const p = objNode.properties.find(
    (x) => ts.isPropertyAssignment(x) && (x.name.text ?? x.name.escapedText) === name
  );
  if (!p) return undefined;
  return literal(p.initializer);
}

function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (isObj(node)) {
    const out = {};
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p)) out[p.name.text ?? p.name.escapedText] = literal(p.initializer);
    }
    return out;
  }
  // string concatenation across lines, as used by the long disclaimer
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = literal(node.left), r = literal(node.right);
    if (typeof l === "string" && typeof r === "string") return l + r;
  }
  return undefined;
}

/** Pull the single exported article object out of a content file. */
function parseArticle(file) {
  const src = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  let obj = null;
  const visit = (node) => {
    if (obj) return;
    if (ts.isVariableDeclaration(node) && node.initializer) {
      // `export const x: Article = { ... }` — unwrap the `as`/type assertion if present
      let init = node.initializer;
      while (ts.isAsExpression(init) || ts.isTypeAssertionExpression?.(init)) init = init.expression;
      if (isObj(init) && init.properties.some((p) => (p.name?.text ?? p.name?.escapedText) === "blocks")) {
        obj = init;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  if (!obj) throw new Error(`No article object found in ${file}`);

  const blocksNode = obj.properties.find(
    (p) => ts.isPropertyAssignment(p) && (p.name.text ?? p.name.escapedText) === "blocks"
  )?.initializer;

  const blocks = ts.isArrayLiteralExpression(blocksNode)
    ? blocksNode.elements.filter(isObj).map((n) => literal(n))
    : [];

  return {
    slug: prop(obj, "slug"),
    title: prop(obj, "title"),
    draft: prop(obj, "draft") === true,
    wordCount: prop(obj, "wordCount"),
    sources: prop(obj, "sources") ?? [],
    blocks,
  };
}

/* ── text helpers ──────────────────────────────────────────────────────── */

const stripInline = (t) =>
  String(t)
    .replace(/\[\^(\d+)\]/g, "")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");

/** Every piece of prose in a block that counts toward the character target. */
function countedText(b) {
  if (!COUNTED.has(b.type)) return [];
  if (b.type === "list") return b.items ?? [];
  return [b.text].filter(Boolean);
}

/** All prose, counted or not, for link scanning. */
function allText(b) {
  const out = [];
  for (const k of ["text", "caption", "sub", "title"]) if (typeof b[k] === "string") out.push(b[k]);
  if (Array.isArray(b.items)) out.push(...b.items);
  return out;
}

/* ── image inspection (no dependencies) ────────────────────────────────── */

/** Intrinsic dimensions from a PNG IHDR or a JPEG SOF marker. */
function imageSize(buf) {
  if (buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      // SOF0–SOF15, excluding the DHT/JPG/DAC markers that share the range
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/**
 * Attribution actually written into the file.
 *
 * Deliberately checks for *content*, not for the presence of a metadata
 * segment. Camera and stock pipelines routinely emit an XMP packet carrying
 * nothing but tiff/exif namespaces — all nine of the first batch of stock
 * photos did exactly that — so "has XMP" is not evidence of anything.
 *
 * Reads XMP (APP1) and IPTC IIM (APP13 → 8BIM 0x0404) and returns whatever
 * creator / credit / rights / description it can find.
 */
function attribution(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return { na: true };

  let xmp = "";
  let iptc = null;
  let i = 2;
  while (i < buf.length - 4) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xda) break; // start of scan — metadata all precedes this
    const len = buf.readUInt16BE(i + 2);
    const seg = buf.slice(i + 4, i + 2 + len);
    if (marker === 0xe1 && seg.toString("latin1", 0, 40).includes("ns.adobe.com/xap")) xmp += seg.toString("utf8");
    if (marker === 0xed && seg.toString("latin1", 0, 13) === "Photoshop 3.0") iptc = seg;
    i += 2 + len;
  }

  const xmpTag = (tag) => {
    const m = xmp.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
  };

  /* IPTC IIM: 8BIM resource 0x0404 holds records of
     0x1C <record> <dataset> <2-byte length> <value>. Record 2 is the app record. */
  const iim = {};
  if (iptc) {
    let p = 0;
    while (p < iptc.length - 12) {
      if (iptc.toString("latin1", p, p + 4) !== "8BIM") { p++; continue; }
      const id = iptc.readUInt16BE(p + 4);
      let q = p + 6;
      const nameLen = iptc[q]; q += 1 + nameLen + ((nameLen + 1) % 2 ? 1 : 0);
      const size = iptc.readUInt32BE(q); q += 4;
      if (id === 0x0404) {
        const block = iptc.slice(q, q + size);
        let r = 0;
        while (r < block.length - 5) {
          if (block[r] !== 0x1c) { r++; continue; }
          const dataset = block[r + 2];
          const dlen = block.readUInt16BE(r + 3);
          iim[dataset] = block.toString("utf8", r + 5, r + 5 + dlen).trim();
          r += 5 + dlen;
        }
      }
      p = q + size + (size % 2);
    }
  }

  return {
    na: false,
    creator: xmpTag("dc:creator") || iim[80] || "",              // 2:80  By-line
    credit:  xmpTag("photoshop:Credit") || iim[110] || "",       // 2:110 Credit
    rights:  xmpTag("dc:rights") || iim[116] || "",              // 2:116 Copyright Notice
    description: xmpTag("dc:description") || iim[120] || "",     // 2:120 Caption/Abstract
  };
}

/* ── the check ─────────────────────────────────────────────────────────── */

function check(file) {
  const a = parseArticle(file);
  const problems = [];
  const warnings = [];
  const add = (ok, msg) => { if (!ok) problems.push(msg); };

  /* characters */
  const chars = a.blocks
    .flatMap(countedText)
    .reduce((n, t) => n + stripInline(t).length, 0);
  add(chars >= RULES.chars.min && chars <= RULES.chars.max,
      `${RULES.chars.label}: ${chars.toLocaleString()} — outside ${RULES.chars.min.toLocaleString()}–${RULES.chars.max.toLocaleString()}`);

  /* links */
  const prose = a.blocks.flatMap(allText).join("\n");
  const links = [...prose.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({ text: m[1], url: m[2] }));
  const internal = links.filter((l) => l.url.startsWith("/"));
  const external = links.filter((l) => /^https?:\/\//.test(l.url));

  add(internal.length >= RULES.internalLinks.min && internal.length <= RULES.internalLinks.max,
      `${RULES.internalLinks.label}: ${internal.length} — need ${RULES.internalLinks.min}–${RULES.internalLinks.max}`);
  add(internal.some((l) => l.url.startsWith("/training/")),
      "Internal links: none point at another /training article");
  add(internal.some((l) => l.url === "/" || l.url.startsWith("/#")),
      "Internal links: none point at the strength scan (/)");
  add(external.length >= RULES.inlineExternal.min && external.length <= RULES.inlineExternal.max,
      `${RULES.inlineExternal.label}: ${external.length} — need ${RULES.inlineExternal.min}–${RULES.inlineExternal.max}`);

  // one internal link per 300 characters, at most
  const density = chars ? internal.length / (chars / 300) : 0;
  if (density > 1) warnings.push(`Internal link density ${density.toFixed(2)} per 300 chars — above 1`);

  for (const l of links) {
    if (/^(click here|here|this|read more|link)$/i.test(l.text.trim()))
      problems.push(`Non-descriptive anchor text: "${l.text}" → ${l.url}`);
  }

  /* footnotes */
  const cited = new Set([...prose.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1])));
  const have = new Set((a.sources ?? []).map((s) => s.n));
  for (const n of cited) add(have.has(n), `Cites [^${n}] with no matching source`);
  for (const n of have) if (!cited.has(n)) warnings.push(`Source [${n}] is listed but never cited in the body`);

  add(a.sources.length >= RULES.sources.min && a.sources.length <= RULES.sources.max,
      `${RULES.sources.label}: ${a.sources.length} — need ${RULES.sources.min}–${RULES.sources.max}`);

  /* charts */
  const charts = a.blocks.filter((b) => b.type === "chart");
  add(charts.length >= RULES.charts.min && charts.length <= RULES.charts.max,
      `${RULES.charts.label}: ${charts.length} — need ${RULES.charts.min}–${RULES.charts.max}`);
  for (const c of charts) {
    const biggest = Math.max(...(c.bars ?? []).map((b) => b.value ?? 0));
    if (c.max !== undefined && biggest > c.max) problems.push(`Chart "${c.title}": a bar (${biggest}) exceeds max (${c.max})`);
    if (!/\[\d+\]$/.test(String(c.source ?? "").trim())) warnings.push(`Chart "${c.title}": source line doesn't end in a [n] citation`);
  }

  /* figures */
  const figures = a.blocks.filter((b) => b.type === "figure");
  let wrapSides = [];
  for (const f of figures) {
    if (!f.alt || !String(f.alt).trim()) problems.push(`Figure ${f.src}: empty alt`);
    if (f.license || f.sourceUrl) add(!!f.credit, `Figure ${f.src}: licensed image with no credit`);

    const path = join(PUBLIC_DIR, String(f.src ?? "").replace(/^\//, ""));
    if (!existsSync(path)) { problems.push(`Figure ${f.src}: file not found in /public`); continue; }

    const buf = readFileSync(path);
    const size = imageSize(buf);
    if (size) {
      if (f.width !== size.w || f.height !== size.h)
        problems.push(`Figure ${f.src}: declared ${f.width}×${f.height}, file is ${size.w}×${size.h}`);

      const portrait = size.h > size.w * 1.15;
      const layout = f.layout ?? "full";
      if (portrait && layout === "full")
        problems.push(`Figure ${f.src}: portrait (${size.w}×${size.h}) must use wrap-left or wrap-right`);
      if (!portrait && layout !== "full" && size.w > size.h * 1.15)
        warnings.push(`Figure ${f.src}: landscape image is wrapped — usually should be full width`);
      if (layout !== "full") wrapSides.push(layout);
    }

    const kb = buf.length / 1024;
    if (kb > 500) problems.push(`Figure ${f.src}: ${kb.toFixed(0)} KB — over the 500 KB limit`);

    const meta = attribution(buf);
    if (!meta.na) {
      if (!meta.creator) problems.push(`Figure ${f.src}: no Creator/By-line written into the file`);
      if (!meta.credit && !meta.rights) problems.push(`Figure ${f.src}: no Credit or Copyright written into the file`);
      if (!meta.description) warnings.push(`Figure ${f.src}: no Description in the file metadata (should match the alt text)`);
      else if (f.alt && meta.description.trim() !== String(f.alt).trim())
        warnings.push(`Figure ${f.src}: file Description doesn't match the alt text`);
    }
  }
  // alternate sides down the page
  for (let i = 1; i < wrapSides.length; i++)
    if (wrapSides[i] === wrapSides[i - 1]) { warnings.push("Two consecutive wrapped figures on the same side"); break; }

  /* structure */
  const ledes = a.blocks.filter((b) => b.type === "lede").length;
  add(ledes === 1, `Expected exactly one lede block, found ${ledes}`);
  add(a.blocks.some((b) => b.type === "cta"), "No CTA block");

  const words = a.blocks.flatMap(countedText).reduce((n, t) => n + stripInline(t).split(/\s+/).filter(Boolean).length, 0);
  if (a.wordCount && Math.abs(a.wordCount - words) / words > 0.1)
    warnings.push(`wordCount says ${a.wordCount}, actual is ${words}`);

  return { slug: a.slug, title: a.title, draft: a.draft, chars, words, internal: internal.length, external: external.length, sources: a.sources.length, charts: charts.length, figures: figures.length, problems, warnings };
}

/* ── run ───────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const wanted = args.filter((a) => !a.startsWith("--"));

const files = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
  .filter((f) => !wanted.length || wanted.includes(f.replace(/\.ts$/, "")))
  .map((f) => join(CONTENT_DIR, f));

if (!files.length) {
  console.error(wanted.length ? `No content file matches: ${wanted.join(", ")}` : "No content files found.");
  process.exit(1);
}

const results = files.map(check);

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const GREEN = "\x1b[32m", RED = "\x1b[31m", YEL = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";
  for (const r of results) {
    const ok = r.problems.length === 0;
    console.log(`\n${ok ? GREEN + "PASS" : RED + "FAIL"}${OFF}  ${r.title}${r.draft ? DIM + "  (draft)" + OFF : ""}`);
    console.log(`${DIM}      ${r.chars.toLocaleString()} chars · ${r.words.toLocaleString()} words · ${r.internal} internal · ${r.external} external · ${r.sources} sources · ${r.charts} charts · ${r.figures} figures${OFF}`);
    for (const p of r.problems) console.log(`  ${RED}✗${OFF} ${p}`);
    for (const w of r.warnings) console.log(`  ${YEL}!${OFF} ${w}`);
  }
  const failed = results.filter((r) => r.problems.length).length;
  console.log(`\n${failed ? RED : GREEN}${results.length - failed}/${results.length} passing${OFF}\n`);
}

process.exit(results.some((r) => r.problems.length) ? 1 : 0);
