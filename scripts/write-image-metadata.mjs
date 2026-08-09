#!/usr/bin/env node
/**
 * Prepares article images: resize to spec, compress under the size limit, and
 * write attribution into the file itself.
 *
 *   node scripts/write-image-metadata.mjs progressive-overload
 *   node scripts/write-image-metadata.mjs                 # every manifest
 *   node scripts/write-image-metadata.mjs --dry-run
 *
 * Reads `scripts/image-manifests/<slug>.json` and writes into
 * `public/articles/<slug>/`. Source files are read, never modified.
 *
 * Why this exists: `check-article.mjs` tests image metadata for *content*, not
 * for the presence of a metadata segment. Every stock photo in the first batch
 * shipped an XMP packet containing an empty `<rdf:RDF>` — a pipeline artefact
 * carrying no attribution at all — so the checker fails them, correctly. This
 * script is what makes them pass, honestly.
 *
 * Metadata is written by `exiftool` when it is on PATH, because it writes both
 * IPTC IIM and XMP and is the reference implementation. Without it we fall back
 * to sharp's `withXmp`, which covers the XMP half — that is enough for the
 * checker, which reads either. Neither path needs a new dependency: sharp is
 * already installed as a Next.js dependency, and is declared in devDependencies
 * so this script does not rely on a transitive hoist.
 */

import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_DIR = join(ROOT, "scripts/image-manifests");
const PUBLIC_DIR = join(ROOT, "public");

/** From docs/CONTENT-PLAN.md § Specification. A manifest entry may override both. */
const TARGETS = {
  portrait: { width: 1400, height: 2100 },  // 2:3, comfortably above the 1200×1800 floor
  landscape: { width: 1520, height: 1013 }, // 3:2
  square: { width: 1400, height: 1400 },
};

const MAX_KB = 500;
/* Step down quality until it fits. Resizing has already happened by this point —
   the spec is explicit that dimensions come first and compression second. */
const QUALITY_LADDER = [82, 76, 70, 64, 58];

const hasExiftool = (() => {
  try {
    execFileSync("exiftool", ["-ver"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
})();

/* ── XMP fallback ──────────────────────────────────────────────────────── */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A minimal but valid XMP packet carrying exactly the five fields the guide
 * requires. `dc:creator` is a Seq and `dc:rights`/`dc:description` are language
 * alternatives because that is what the XMP spec says they are — writing them
 * as bare strings is the most common way to produce a packet that validators
 * and stock pipelines silently drop.
 */
function buildXmp({ creator, credit, copyright, description, source }) {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="bedrock.fit">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
   <dc:creator><rdf:Seq><rdf:li>${esc(creator)}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${esc(copyright)}</rdf:li></rdf:Alt></dc:rights>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(description)}</rdf:li></rdf:Alt></dc:description>
   <photoshop:Credit>${esc(credit)}</photoshop:Credit>
   <photoshop:Source>${esc(source)}</photoshop:Source>
   <xmpRights:WebStatement>${esc(source)}</xmpRights:WebStatement>
   <xmpRights:Marked>True</xmpRights:Marked>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/** IPTC IIM *and* XMP, via the reference implementation. */
function writeWithExiftool(file, m) {
  execFileSync(
    "exiftool",
    [
      "-overwrite_original",
      "-codedcharacterset=utf8",
      `-XMP-dc:Creator=${m.creator}`,
      `-IPTC:By-line=${m.creator}`,
      `-EXIF:Artist=${m.creator}`,
      `-XMP-photoshop:Credit=${m.credit}`,
      `-IPTC:Credit=${m.credit}`,
      `-XMP-dc:Rights=${m.copyright}`,
      `-IPTC:CopyrightNotice=${m.copyright}`,
      `-EXIF:Copyright=${m.copyright}`,
      `-XMP-dc:Description=${m.description}`,
      `-IPTC:Caption-Abstract=${m.description}`,
      `-XMP-photoshop:Source=${m.source}`,
      `-IPTC:Source=${m.source}`,
      `-XMP-xmpRights:WebStatement=${m.source}`,
      file,
    ],
    { stdio: "pipe" }
  );
}

/* ── one image ─────────────────────────────────────────────────────────── */

async function processImage(slug, entry, dryRun) {
  const srcPath = resolve(ROOT, entry.source);
  if (!existsSync(srcPath)) throw new Error(`source not found: ${entry.source}`);

  const outDir = join(PUBLIC_DIR, "articles", slug);
  const outPath = join(outDir, entry.out);

  const orientation = entry.orientation ?? "portrait";
  const target = TARGETS[orientation];
  if (!target) throw new Error(`unknown orientation "${orientation}" for ${entry.out}`);
  const width = entry.width ?? target.width;
  const height = entry.height ?? target.height;

  const meta = {
    creator: entry.creator,
    credit: entry.credit,
    copyright: entry.copyright,
    description: entry.alt, // the guide is explicit: Description is the alt text, verbatim
    source: entry.sourceUrl,
  };
  for (const [k, v] of Object.entries(meta)) {
    if (!v || !String(v).trim()) throw new Error(`${entry.out}: missing "${k}"`);
  }

  if (dryRun) {
    return { out: entry.out, width, height, kb: null, quality: null, dryRun: true };
  }

  mkdirSync(outDir, { recursive: true });

  /* Resize once, then walk the quality ladder until it fits the budget. */
  let buf = null;
  let usedQuality = null;
  for (const quality of QUALITY_LADDER) {
    buf = await sharp(srcPath)
      .resize({ width, height, fit: "cover", position: "attention", withoutEnlargement: false })
      .toColorspace("srgb")
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
    usedQuality = quality;
    if (buf.length / 1024 <= MAX_KB) break;
  }
  if (buf.length / 1024 > MAX_KB) {
    throw new Error(`${entry.out}: still ${(buf.length / 1024).toFixed(0)} KB at quality ${usedQuality}`);
  }

  if (hasExiftool) {
    writeFileSync(outPath, buf);
    writeWithExiftool(outPath, meta);
  } else {
    // sharp writes the packet during encode, so re-encode from the sized buffer
    await sharp(buf).jpeg({ quality: usedQuality, mozjpeg: true, chromaSubsampling: "4:4:4" }).withXmp(buildXmp(meta)).toFile(outPath);
  }

  const kb = statSync(outPath).size / 1024;
  if (kb > MAX_KB) throw new Error(`${entry.out}: ${kb.toFixed(0)} KB after metadata — over ${MAX_KB} KB`);

  return { out: entry.out, width, height, kb: +kb.toFixed(1), quality: usedQuality, dryRun: false };
}

/* ── run ───────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const wanted = args.filter((a) => !a.startsWith("--"));

if (!existsSync(MANIFEST_DIR)) {
  console.error(`No manifest directory at ${MANIFEST_DIR}`);
  process.exit(1);
}

const manifests = readdirSync(MANIFEST_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !wanted.length || wanted.includes(f.replace(/\.json$/, "")))
  .map((f) => join(MANIFEST_DIR, f));

if (!manifests.length) {
  console.error(wanted.length ? `No manifest matches: ${wanted.join(", ")}` : "No manifests found.");
  process.exit(1);
}

const GREEN = "\x1b[32m", RED = "\x1b[31m", DIM = "\x1b[2m", OFF = "\x1b[0m";
console.log(`${DIM}metadata writer: ${hasExiftool ? "exiftool (IPTC + XMP)" : "sharp withXmp (XMP only)"}${OFF}`);

let failed = 0;
for (const file of manifests) {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const slug = manifest.slug ?? file.split("/").pop().replace(/\.json$/, "");
  console.log(`\n${slug}`);
  for (const entry of manifest.images ?? []) {
    try {
      const r = await processImage(slug, entry, dryRun);
      console.log(
        r.dryRun
          ? `  ${DIM}would write${OFF} ${r.out} ${DIM}${r.width}×${r.height}${OFF}`
          : `  ${GREEN}✓${OFF} ${r.out} ${DIM}${r.width}×${r.height} · ${r.kb} KB · q${r.quality}${OFF}`
      );
    } catch (err) {
      failed++;
      console.log(`  ${RED}✗${OFF} ${entry.out ?? entry.source}: ${err.message}`);
    }
  }
}

console.log("");
process.exit(failed ? 1 : 0);
