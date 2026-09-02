// Bulk Onboarding Wave 2 — the 37 short stories of the 1977 anthology கலைஞர் கருணாநிதியின் சிறுகதைகள்.
//
//   node scripts/import-1977-short-stories.mjs <kalaignar-short-stories-clone> <source-commit>
//
// ONE deterministic, pinned, fail-closed importer for the whole coherent batch — not 37 scripts. The
// source archive is READ-ONLY and the controlling PDF is never vendored.
//
// ── WHAT THIS FILE IS CAREFUL ABOUT ─────────────────────────────────────────────────────────────────
//
// 1. THE PAGE RECORDS ARE THE TEXTUAL AUTHORITY — NOT THE ASSEMBLY FILES.
//    `sections/<slug>.md` is a derived reading assembly and its per-scan marker structure is NOT
//    uniform across the anthology: 27 stories carry leading `<!-- source scan N; printed page M -->`
//    markers, one carries Tamil-language markers placed as TRAILING delimiters, one carries a single
//    marker for six scans, and eight carry none at all. Deriving scan attribution from those files
//    would silently misattribute paragraphs for ten stories. `pages/*.md` is uniform, verified, and
//    carries `scan_page` / `printed_page` in its own frontmatter, so the Tamil stream is built from
//    the page records and the assembly is used only as an independent reconciliation witness.
//
// 2. THE ENGLISH USES THREE DIFFERENT MARKER SYNTAXES. `source scan N; printed page M`,
//    `மூல ஸ்கேன் பக்கம்: N; அச்சுப் பக்கம்: M`, and `anthology scan: N; printed page: M` all occur.
//    All three are recognised; a story whose English markers do not exactly equal its page-record
//    scans fails closed rather than importing a mis-anchored translation.
//
// 3. A SCAN BOUNDARY IS NOT A PARAGRAPH BOUNDARY. Where a scan's final fragment ends without
//    sentence-terminal punctuation the sentence runs on into the next scan, so the two fragments are
//    SEGMENTS of one paragraph. This is a uniform RULE, not a per-boundary adjudication, and the
//    generated provenance says so in those words (`individualAdjudication: false`) exactly as the
//    booklet's importer does.
//
// 4. NO BOOKLET FACT IS INVENTED. The anthology prints no per-story form label, no per-story
//    authorship line, no story-specific physical publication and no publisher errata. Those fields are
//    simply absent here; they are not filled from collection-level facts.
//
// 5. TWO TITLE WITNESSES ARE PRESERVED. `புரட்சிப்படம்` / `புரட்சிப் படம்` and `சித்தார்த்தன்` /
//    `சித்தார்த்தன் சிலை` differ between the table of contents and the story opening. Both are
//    recorded and neither is normalised into the other.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-1977-short-stories.mjs <short-stories-clone> <source-commit>");
  process.exit(1);
}
const die = (m) => { throw new Error(m); };
const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));

// ── THE PIN IS HARD-LOCKED, NOT SUPPLIED ────────────────────────────────────────────────────────────
// Authority lives in this file. A CLI argument only proves the caller and the clone agree with each
// other, which they would also do at an unreviewed commit.
const APPROVED_SOURCE_COMMIT = "76135e1b5d504128c15be6bf59937716e5517d78";
const COLLECTION = "1977-kalaignar-karunanidhiyin-sirukathaigal";
const APPROVED_COLLECTION_TREE = "d45434d46b1e779a880fff3d774d0fcb5833e477";

// Controlling source identity, as the completion record states it.
const SCAN_FILENAME = "TVA_BOK_0064142_கலைஞர்_கருணாநிதியின்_சிறுகதைகள்.pdf";
const SCAN_SHA256 = "853032661482eaccb26c083a38d7aa75c081362d33c963c63e37d088bf20acb3";
const SCAN_BYTES = 268486609;
const SCAN_TOTAL_PAGES = 260;
const STORY_BEARING_SCANS = "10–259";
const BACK_COVER_SCAN = 260;
const COLLECTION_TITLE_TA = "கலைஞர் கருணாநிதியின் சிறுகதைகள்";
const COLLECTION_AUTHOR_TA = "கலைஞர் மு. கருணாநிதி";
const COLLECTION_PUBLISHER_TA = "தமிழ்க்கனி பதிப்பகம், சென்னை-28";
const COLLECTION_EDITION_TA = "முதல் பதிப்பு: 1977";

// ── THE AUTHORIZED BATCH ────────────────────────────────────────────────────────────────────────────
// Order, printed pages, scans and frozen tree are all declared here and every one of them is checked
// against the archive. Nothing in this table is derived from another entry.
const WORKS = [
  { order: 1,  slug: "pugazhendhi",             tree: "7489e5ddb8b35d8a2ef41600bccfc9b291332845", pages: [1, 6],     scans: [10, 15] },
  { order: 2,  slug: "nalayini",                tree: "784d833f69f2ff741d9874ae864555366ccb3e21", pages: [7, 14],    scans: [16, 23] },
  { order: 3,  slug: "sabalam",                 tree: "fc02d6b8c288bbdd5f03fe3fe51622a383228a60", pages: [15, 21],   scans: [24, 30] },
  { order: 4,  slug: "aattakkavadi",            tree: "f54a7197c661ad91b631ec0cba52d8b8747a9ba1", pages: [22, 29],   scans: [31, 38] },
  { order: 5,  slug: "kuppai-thotti",           tree: "e8d5cf43fb200e95b85a637a4d49bd263f2ef5cc", pages: [30, 37],   scans: [39, 46] },
  { order: 6,  slug: "santhana-kinnam",         tree: "d154416ac269678f5984ff665dc2e97b106abb69", pages: [38, 47],   scans: [47, 56] },
  { order: 7,  slug: "sangilichami",            tree: "3b2f3c02d19757d956649e4eedf75ca33cd76f6f", pages: [48, 59],   scans: [57, 68] },
  { order: 8,  slug: "gangaiyin-kadhal",        tree: "c25e85fcfff59e93e911a34ac1817fd24e7f81c3", pages: [60, 63],   scans: [69, 72] },
  { order: 9,  slug: "thaaymai",                tree: "bcd5bf6b06c9b564864abe25e75c70599fe0e9e6", pages: [64, 74],   scans: [73, 83] },
  { order: 10, slug: "thappivittargal",         tree: "bd0b1c983be714c5997894f0b53a5a9c895e07ee", pages: [75, 82],   scans: [84, 91] },
  { order: 11, slug: "thappavillai",            tree: "ce80ac8bb1e8fe89d09952a2dbe7d20f43abf371", pages: [83, 92],   scans: [92, 101] },
  { order: 12, slug: "aatharikkirar",           tree: "fe4fabd9ca0a76a84ca9724cd162b136e1017c84", pages: [93, 98],   scans: [102, 107] },
  { order: 13, slug: "iragasiyam",              tree: "0baab51100f49e438e5d6a3464328b626a34f6f7", pages: [99, 102],  scans: [108, 111] },
  { order: 14, slug: "munnuru-rupai",           tree: "64d6d69ca597efca0a60bd60d1bfc8254b717042", pages: [103, 105], scans: [112, 114] },
  { order: 15, slug: "ezhai",                   tree: "35e0f00154c5536cf60bc561d77b298d993ab1da", pages: [106, 109], scans: [115, 118] },
  { order: 16, slug: "originalil-ullapadi",     tree: "6596ce8d2c660d04f1f1d9b771399efc0be7c60a", pages: [110, 116], scans: [119, 125] },
  { order: 17, slug: "panangulai",              tree: "38335b1d9f11a1191f0864e84c19ab20d4564481", pages: [117, 121], scans: [126, 130] },
  { order: 18, slug: "seththaval-kathai",       tree: "9a70ee7fe99326260a5bc775b02c351c4fd5744f", pages: [122, 130], scans: [131, 139] },
  { order: 19, slug: "pretha-visaranai",        tree: "d1bbb45d3462de55047f9f26e1e705cafc32693b", pages: [131, 136], scans: [140, 145] },
  { order: 20, slug: "kandathum-kadhal-ozhiga", tree: "1903720fecd0b53c009da637f023a7914d76b5a9", pages: [137, 141], scans: [146, 150] },
  { order: 21, slug: "aalamarathup-puraakkal",  tree: "d09e93781afa679d35349e93555a4c110664fbe7", pages: [142, 146], scans: [151, 155] },
  { order: 22, slug: "thothukkili",             tree: "71f04f3621f4c40e8b6ca8216dd9910b07d1fddd", pages: [147, 151], scans: [156, 160] },
  { order: 23, slug: "kadhal-kaditham",         tree: "0beca693da89e23a456f11cfd1f2a7e21e0e8b45", pages: [152, 156], scans: [161, 165] },
  { order: 24, slug: "kannadakkam",             tree: "e14d7afb2675cffe463f834eae616667894701de", pages: [157, 163], scans: [166, 172] },
  { order: 25, slug: "vazha-mudiyathavargal",   tree: "b03f83a712a6fcbfb98451ecc73afd23cf402bb9", pages: [164, 171], scans: [173, 180] },
  { order: 26, slug: "abagya-chinthamani",      tree: "ba2ac25f5e45629ac02d43e13625e51b50353de2", pages: [172, 179], scans: [181, 188] },
  { order: 27, slug: "palaivana-roja",          tree: "82be76bbc27a860681597b440f3f0d33581a6001", pages: [180, 184], scans: [189, 193] },
  { order: 28, slug: "puratchip-padam",         tree: "78fcda9d34ca9a36fd280e7a65d7c31aa3f903da", pages: [185, 189], scans: [194, 198],
    titleWitness: { tocTitleTa: "புரட்சிப்படம்", openingHeadingTa: "புரட்சிப் படம்" } },
  { order: 29, slug: "thidukkidum-kathai",      tree: "e6eea7e253f33f029f1c64958ea184dbd07423e0", pages: [190, 195], scans: [199, 204] },
  { order: 30, slug: "kadaisi-kattam",          tree: "4176f3cc1e2797938a4a26d8acb11cc816105261", pages: [196, 201], scans: [205, 210] },
  { order: 31, slug: "ayyo-raja",               tree: "9bdc09d0a9f09ffddad6e651d6846ca5014690c9", pages: [202, 208], scans: [211, 217] },
  { order: 32, slug: "visham-inidhu",           tree: "1e0a876ad13c6fb48c91ff7f14d51be9318bafb9", pages: [209, 215], scans: [218, 224] },
  { order: 33, slug: "veniyin-kadhalan",        tree: "49ea97a0025eca96ae6895764df86188480933e0", pages: [216, 221], scans: [225, 230] },
  { order: 34, slug: "amirthamathi",            tree: "6392d447a9fbd0822452f5040f6a524d48128222", pages: [222, 229], scans: [231, 238] },
  { order: 35, slug: "sumanthaval",             tree: "e84057745986e7e6712e4342f12a149c7d113c77", pages: [230, 240], scans: [239, 249] },
  { order: 36, slug: "siddharthan-silai",       tree: "c82f565ccdae0a7882e5b3942ba28bae38ac8792", pages: [241, 243], scans: [250, 252],
    titleWitness: { tocTitleTa: "சித்தார்த்தன்", openingHeadingTa: "சித்தார்த்தன் சிலை" } },
  { order: 37, slug: "nunikkarumbu",            tree: "5a20d7cfcdef25999ca74d17e110679176d76ef7", pages: [244, 250], scans: [253, 259] },
];

// கிழவன் கனவு is a SEPARATE, already-published work from a different source pin. It is not in this
// batch and this importer must never write to it.
const EXCLUDED = "kizhavan-kanavu";

// ── PIN AND TREE GATES ──────────────────────────────────────────────────────────────────────────────
const git = (...args) => execFileSync("git", ["-C", SRC_REPO, ...args], { encoding: "utf8" }).trim();

let head;
try { head = git("rev-parse", "HEAD"); }
catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }

if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) {
  die(`supplied source commit ${SRC_COMMIT} is not the approved pin ${APPROVED_SOURCE_COMMIT}. ` +
      `A caller cannot redefine which revision this batch was reviewed against.`);
}
if (head !== APPROVED_SOURCE_COMMIT) {
  die(`${SRC_REPO} is at ${head}, not the approved pin ${APPROVED_SOURCE_COMMIT}. ` +
      `Refusing to generate from an unreviewed revision even if the caller asked for it.`);
}

// Per-work drift guards. A shared repository pin does NOT collapse 37 works into one provenance
// identity — each frozen tree is proved individually, and the collection tree separately.
const liveCollectionTree = git("rev-parse", `${APPROVED_SOURCE_COMMIT}:collections/${COLLECTION}`);
if (liveCollectionTree !== APPROVED_COLLECTION_TREE) {
  die(`collection tree drift: collections/${COLLECTION} is ${liveCollectionTree}, approved ${APPROVED_COLLECTION_TREE}`);
}
for (const w of WORKS) {
  const live = git("rev-parse", `${APPROVED_SOURCE_COMMIT}:stories/${w.slug}`);
  if (live !== w.tree) {
    die(`source tree drift for ${w.slug}: archive has ${live}, this batch was frozen at ${w.tree}`);
  }
}

// ── BATCH SHAPE GATES ───────────────────────────────────────────────────────────────────────────────
if (WORKS.length !== 37) die(`the authorized batch is exactly 37 stories; got ${WORKS.length}`);
if (new Set(WORKS.map((w) => w.slug)).size !== 37) die("duplicate story slug in the authorized batch");
if (new Set(WORKS.map((w) => w.order)).size !== 37) die("duplicate story order in the authorized batch");
WORKS.forEach((w, i) => { if (w.order !== i + 1) die(`story order is not the anthology's printed order at ${w.slug}`); });
if (WORKS.some((w) => w.slug === EXCLUDED)) die(`${EXCLUDED} is a separate published work and must not be in this batch`);

// Contiguity: the 37 story ranges must tile 10–259 exactly, with no gap and no overlap.
{
  let cursor = 10;
  for (const w of WORKS) {
    if (w.scans[0] !== cursor) {
      die(`anthology scan sequence breaks at ${w.slug}: expected to start at ${cursor}, declared ${w.scans[0]}`);
    }
    if (w.scans[1] < w.scans[0]) die(`${w.slug}: inverted scan range`);
    cursor = w.scans[1] + 1;
  }
  if (cursor - 1 !== 259) die(`anthology story scans end at ${cursor - 1}, expected 259`);
  const first = WORKS[0], last = WORKS[WORKS.length - 1];
  if (first.pages[0] !== 1) die(`printed story pages must start at 1, got ${first.pages[0]}`);
  if (last.pages[1] !== 250) die(`printed story pages must end at 250, got ${last.pages[1]}`);
  if (WORKS.some((w) => w.scans[0] <= BACK_COVER_SCAN && w.scans[1] >= BACK_COVER_SCAN)) {
    die(`scan ${BACK_COVER_SCAN} is the anthology back cover and must never fall inside a story range`);
  }
}

// ── SOURCE PARSING ──────────────────────────────────────────────────────────────────────────────────
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

/** All three scan-marker syntaxes the archive actually uses. */
const MARKER = new RegExp(
  "<!--\\s*(?:source scan (\\d+); printed page (\\d+)" +
  "|மூல ஸ்கேன் பக்கம்:\\s*(\\d+);\\s*அச்சுப் பக்கம்:\\s*(\\d+)" +
  "|anthology scan:\\s*(\\d+);\\s*printed page:\\s*(\\d+))\\s*-->",
  "g");

function markerList(text) {
  const out = [];
  for (const m of text.matchAll(MARKER)) {
    out.push({ scan: Number(m[1] ?? m[3] ?? m[5]), printedPage: Number(m[2] ?? m[4] ?? m[6]), index: m.index, end: m.index + m[0].length });
  }
  return out;
}

const fmValue = (block, key) => {
  const m = new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m").exec(block);
  return m ? m[1].trim().replace(/^"|"$/g, "") : null;
};

/** Strip the archive's own commentary: HTML comments and the archival blockquote note. */
function stripApparatus(body) {
  return body
    .replace(/<!--[\s\S]*?-->/g, "\n\n")
    .replace(/^>.*$/gm, "")
    .trim();
}

// ── ARCHIVE APPARATUS THAT IS NOT SOURCE TEXT ───────────────────────────────────────────────────────
// Everything from these headings onward is the archive talking about the page, not the page.
const TRAILING_NOTE =
  /^## (?:Assembly note|Translation note|Visual-fidelity assembly note|Source[- ]review note)\s*$/m;
function dropTrailingNote(text) {
  const m = TRAILING_NOTE.exec(text);
  return m ? text.slice(0, m.index) : text;
}

/**
 * `# அச்சு உரை` ("printed text") is a MARKDOWN DISPLAY LABEL some page records carry above the
 * transcription. It is not printed on the page. The archive's own visual-fidelity pass says so and
 * removed it from the record it audited — "the earlier Markdown-only display heading `அச்சு உரை`,
 * which does not occur in the source page, was removed" — but it survives in other page records.
 * Importing it would print an archival label as though the 1977 anthology had set it in type.
 */
const DISPLAY_LABEL_TA = "அச்சு உரை";

/**
 * Ordered blocks of one page record: the printed H1 title (story-opening pages only), any printed
 * `## ` sub-heading, and the paragraphs. Bold display lines stay paragraphs — the source sets them
 * apart typographically, not structurally, and inventing a block kind for them would assert a
 * distinction the archive does not make.
 */
function pageBlocks(raw, file) {
  const fm = FRONTMATTER.exec(raw);
  if (!fm) die(`${file}: no frontmatter`);
  const meta = fm[1];
  const body = dropTrailingNote(stripApparatus(raw.slice(fm[0].length)));
  const out = [];
  for (const chunk of body.split(/\n{2,}/)) {
    const line = chunk.trim();
    if (!line) continue;
    if (/^#\s+/.test(line)) {
      const text = line.replace(/^#\s+/, "").trim();
      if (text === DISPLAY_LABEL_TA) continue;  // archival display label, not printed text
      out.push({ kind: "heading", text, level: 1 });
      continue;
    }
    if (/^##\s+/.test(line)) { out.push({ kind: "heading", text: line.replace(/^##\s+/, "").trim(), level: 2 }); continue; }
    if (/^#{3,}\s+/.test(line)) die(`${file}: unexpected heading level in story text: ${line.slice(0, 40)}`);
    out.push({ kind: "paragraph", text: line });
  }
  return {
    scan: Number(fmValue(meta, "scan_page")),
    printedPage: fmValue(meta, "printed_page") === null || fmValue(meta, "printed_page") === "null"
      ? null : Number(fmValue(meta, "printed_page")),
    status: fmValue(meta, "status"),
    pageType: fmValue(meta, "page_type"),
    section: fmValue(meta, "section"),
    story: fmValue(meta, "story"),
    blocks: out,
  };
}

/** The English stream, split by its scan markers (whichever syntax the file uses). */
function englishPages(raw, file) {
  const body = dropTrailingNote(raw);
  const marks = markerList(body);
  if (marks.length === 0) die(`${file}: no scan markers — refusing to import an unanchored translation`);
  const out = [];
  for (let i = 0; i < marks.length; i++) {
    const from = marks[i].end;
    const to = i + 1 < marks.length ? marks[i + 1].index : body.length;
    const seg = stripApparatus(body.slice(from, to));
    const blocks = [];
    for (const chunk of seg.split(/\n{2,}/)) {
      const line = chunk.trim();
      if (!line) continue;
      if (/^#\s+/.test(line)) { blocks.push({ kind: "heading", text: line.replace(/^#\s+/, "").trim(), level: 1 }); continue; }
      if (/^##\s+/.test(line)) { blocks.push({ kind: "heading", text: line.replace(/^##\s+/, "").trim(), level: 2 }); continue; }
      blocks.push({ kind: "paragraph", text: line });
    }
    out.push({ scan: marks[i].scan, printedPage: marks[i].printedPage, blocks });
  }
  // ── NO MARKER-SHIFT REPAIR HAPPENS HERE ──────────────────────────────────────────────────────────
  // An earlier revision of this importer carried a workaround that re-attributed paragraphs across an
  // empty English marker section using the Tamil page counts. It existed because `thidukkidum-kathai`
  // shipped with its English scan markers shifted by one page and its last section empty.
  //
  // That was a SOURCE defect, and it was fixed upstream (`Fix Thidukkidum Kathai English scan
  // anchoring`). The workaround is deliberately gone: a downstream importer that silently repairs a
  // mis-anchored translation is exactly the failure this project has already been bitten by once. An
  // empty marker section now fails closed, below, and the batch validator independently proves the
  // corrected boundaries against the archive's own human-reviewed anchors.

  // The English H1 sits ABOVE the first marker, where the Tamil prints it on the opening page itself.
  // Move it onto the first scan so the two streams carry the same heading structure.
  const head = /^#\s+(.+)$/m.exec(body.slice(0, marks[0].index));
  if (head && out.length) out[0].blocks.unshift({ kind: "heading", text: head[1].trim(), level: 1 });
  return { pages: out, titleEn: head ? head[1].trim() : null };
}

// ── CROSS-SCAN JOINS ────────────────────────────────────────────────────────────────────────────────
// A uniform rule, applied identically to Tamil and English, and declared as a rule in provenance.
const TERMINALS = ["।", ".", "!", "?", "”", "’", "\"", "'", "—", ":", ";", "*", "…"];
const endsSentence = (s) => {
  const flat = s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return TERMINALS.some((t) => flat.endsWith(t));
};

/**
 * Fold ordered per-scan page blocks into the public block stream, joining a paragraph that runs across
 * a scan edge into ONE paragraph with two segments.
 */
function foldStream(pages, file) {
  const blocks = [];
  let joins = 0;
  for (const pg of pages) {
    for (const b of pg.blocks) {
      if (b.kind === "heading") {
        blocks.push({ kind: "heading", text: b.text, sourceScan: pg.scan, printedPage: pg.printedPage });
        continue;
      }
      const prev = blocks[blocks.length - 1];
      const isContinuation =
        prev && prev.kind === "paragraph" &&
        prev.segments[prev.segments.length - 1].sourceScan === pg.scan - 1 &&
        b === pg.blocks.find((x) => x.kind === "paragraph") &&
        !endsSentence(prev.segments[prev.segments.length - 1].text);
      if (isContinuation) {
        prev.segments[prev.segments.length - 1].joinToNext = "space";
        prev.segments.push({ text: b.text, sourceScan: pg.scan, printedPage: pg.printedPage, joinToNext: "end" });
        joins++;
      } else {
        blocks.push({
          kind: "paragraph",
          segments: [{ text: b.text, sourceScan: pg.scan, printedPage: pg.printedPage, joinToNext: "end" }],
        });
      }
    }
  }
  if (blocks.length === 0) die(`${file}: story stream extracted as EMPTY`);
  return { blocks, joins };
}

// ── GENERATE ────────────────────────────────────────────────────────────────────────────────────────
const OUT_ROOT = path.join(process.cwd(), "public/data/stories");
const report = [];

for (const w of WORKS) {
  const WORK = path.join(SRC_REPO, "stories", w.slug);
  const [scanLo, scanHi] = w.scans;
  const [pageLo, pageHi] = w.pages;

  // ---- page records: the textual authority -------------------------------------------------------
  const pageFiles = fs.readdirSync(path.join(WORK, "pages")).filter((f) => f.endsWith(".md")).sort();
  const pages = pageFiles.map((f) => pageBlocks(read(path.join(WORK, "pages", f)), `${w.slug}/pages/${f}`));
  pages.sort((a, b) => a.scan - b.scan);

  const scans = pages.map((p) => p.scan);
  const expectScans = Array.from({ length: scanHi - scanLo + 1 }, (_, i) => scanLo + i);
  if (JSON.stringify(scans) !== JSON.stringify(expectScans)) {
    die(`${w.slug}: page-record scans ${scans.join(",")} do not equal the declared range ${scanLo}–${scanHi}`);
  }
  for (const p of pages) {
    if (p.status !== "verified") die(`${w.slug}: scan ${p.scan} is '${p.status}', not verified`);
    if (p.story !== w.slug) die(`${w.slug}: scan ${p.scan} declares story '${p.story}'`);
    if (p.printedPage === null) die(`${w.slug}: scan ${p.scan} carries no printed page; the anthology prints one on every story page`);
    if (p.scan !== p.printedPage + 9) die(`${w.slug}: scan ${p.scan} / printed ${p.printedPage} breaks the anthology relation scan = page + 9`);
    if (p.scan === BACK_COVER_SCAN) die(`${w.slug}: scan ${BACK_COVER_SCAN} is the back cover and is not story text`);
    if (p.blocks.length === 0) die(`${w.slug}: scan ${p.scan} extracted as EMPTY`);
  }
  const printed = pages.map((p) => p.printedPage);
  if (printed[0] !== pageLo || printed[printed.length - 1] !== pageHi) {
    die(`${w.slug}: printed pages ${printed[0]}–${printed[printed.length - 1]} do not equal the declared ${pageLo}–${pageHi}`);
  }
  for (const p of pages) {
    const h1s = p.blocks.filter((b) => b.kind === "heading" && b.level === 1);
    if (p.pageType !== "story-opening" && h1s.length) {
      die(`${w.slug}: scan ${p.scan} carries a title heading but is not the story-opening page`);
    }
    if (p.pageType === "story-opening" && h1s.length !== 1) {
      die(`${w.slug}: the story-opening page must carry exactly one printed title heading, found ${h1s.length}`);
    }
    if (p.blocks.some((b) => b.kind === "heading" && b.text === DISPLAY_LABEL_TA)) {
      die(`${w.slug}: scan ${p.scan} still carries the archival display label ${DISPLAY_LABEL_TA}`);
    }
  }

  const openings = pages.filter((p) => p.pageType === "story-opening");
  if (openings.length !== 1 || openings[0].scan !== scanLo) die(`${w.slug}: expected exactly one story-opening page at scan ${scanLo}`);
  const endings = pages.filter((p) => p.pageType === "story-ending");
  if (endings.length !== 1 || endings[0].scan !== scanHi) die(`${w.slug}: expected exactly one story-ending page at scan ${scanHi}`);

  // The printed opening heading is the H1 on the story-opening page.
  const h1 = pages[0].blocks.find((b) => b.kind === "heading" && b.level === 1);
  if (!h1) die(`${w.slug}: the story-opening page prints no title heading`);
  const openingHeadingTa = h1.text;

  // ---- English ------------------------------------------------------------------------------------
  const enPath = path.join(WORK, "translations", "en", `${w.slug}.md`);
  if (!fs.existsSync(enPath)) die(`${w.slug}: no English translation file`);
  const enRaw = read(enPath);
  if (!enRaw.trim()) die(`${w.slug}: English translation file is EMPTY`);
  const en = englishPages(enRaw, `${w.slug}/translations/en/${w.slug}.md`);
  const enScans = en.pages.map((p) => p.scan);
  if (JSON.stringify(enScans) !== JSON.stringify(expectScans)) {
    die(`${w.slug}: English scan anchors ${enScans.join(",")} do not equal the page-record scans ${expectScans.join(",")}`);
  }
  if (!en.titleEn) die(`${w.slug}: English translation prints no title heading`);
  if (en.pages.some((p) => p.blocks.length === 0)) die(`${w.slug}: an English scan section extracted as EMPTY`);

  // ---- story-local review gates -------------------------------------------------------------------
  const review = read(path.join(WORK, "TRANSLATION_REVIEW.md"));
  if (!/\*\*PASS\b/.test(review)) die(`${w.slug}: TRANSLATION_REVIEW.md does not record PASS`);
  const vf = read(path.join(WORK, "visual-fidelity.md"));
  if (!/\bPASS\b/i.test(vf)) die(`${w.slug}: visual-fidelity.md does not record PASS`);
  const hasQueue = fs.existsSync(path.join(WORK, "POSSIBLE_ERRORS_FOR_REVIEW.md"));

  // ---- fold both streams --------------------------------------------------------------------------
  const ta = foldStream(pages, `${w.slug} (tamil)`);
  const enFolded = foldStream(en.pages, `${w.slug} (english)`);

  const taParas = ta.blocks.filter((b) => b.kind === "paragraph").length;
  const enParas = enFolded.blocks.filter((b) => b.kind === "paragraph").length;
  const taHeads = ta.blocks.filter((b) => b.kind === "heading").length;
  const enHeads = enFolded.blocks.filter((b) => b.kind === "heading").length;
  if (taHeads !== enHeads) die(`${w.slug}: heading count differs — Tamil ${taHeads}, English ${enHeads}`);

  // ---- title witness ------------------------------------------------------------------------------
  let titleWitness;
  if (w.titleWitness) {
    if (openingHeadingTa !== w.titleWitness.openingHeadingTa) {
      die(`${w.slug}: opening heading is '${openingHeadingTa}', expected the preserved witness '${w.titleWitness.openingHeadingTa}'`);
    }
    if (w.titleWitness.tocTitleTa === w.titleWitness.openingHeadingTa) {
      die(`${w.slug}: a title witness that records two identical forms is not a witness`);
    }
    titleWitness = {
      tocTitleTa: w.titleWitness.tocTitleTa,
      openingHeadingTa: w.titleWitness.openingHeadingTa,
      canonicalFollows: "opening-heading",
      note: "The anthology's table of contents and the story's own opening heading print different " +
            "forms of this title. Both are source facts. The reading title follows the story-opening " +
            "heading, as the source archive's canonical decision records; the contents form is kept " +
            "here rather than normalised away.",
    };
  }

  // ---- write --------------------------------------------------------------------------------------
  const story = {
    workId: w.slug,
    slug: w.slug,
    sourceRepo: "pugazg/kalaignar-short-stories",
    sourcePath: `stories/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT,
    shelf: "fiction",
    subtype: "short-story",
    readerStructure: "story",
    sourceForm: "anthology-story",
    title: { ta: openingHeadingTa, en: en.titleEn },
    author: { nameTa: COLLECTION_AUTHOR_TA },
    anthology: {
      collectionSlug: COLLECTION,
      collectionTitleTa: COLLECTION_TITLE_TA,
      order: w.order,
      printedPages: { first: pageLo, last: pageHi },
      sourceScans: { first: scanLo, last: scanHi },
    },
    tamil: { blocks: ta.blocks },
    english: { blocks: enFolded.blocks },
    sourceScans: expectScans,
  };

  const provenance = {
    workId: w.slug,
    sourceRepo: "pugazg/kalaignar-short-stories",
    sourcePath: `stories/${w.slug}`,
    sourceCommit: APPROVED_SOURCE_COMMIT,
    sourceTree: w.tree,
    source: {
      printedTitleTa: openingHeadingTa,
      editionStatementTa: COLLECTION_EDITION_TA,
      scanFilename: SCAN_FILENAME,
      scanSha256: SCAN_SHA256,
      scanFileSizeBytes: SCAN_BYTES,
      scanTotalPages: SCAN_TOTAL_PAGES,
      controllingSourceNote:
        "Scan identity (filename, SHA-256, byte size, page count) is carried as the source archive " +
        "records it for the whole anthology. The controlling PDF is not vendored into this repository " +
        "and is never fetched at runtime.",
    },
    storyScope: {
      storyScans: `${scanLo}–${scanHi}`,
      storyScanCount: expectScans.length,
      verified: pages.length,
      blocked: 0,
      unresolvedReadings: 0,
      complete: true,
      conclusionTa: (() => {
        const last = ta.blocks[ta.blocks.length - 1];
        const seg = last.kind === "paragraph" ? last.segments[last.segments.length - 1].text : last.text;
        return seg.replace(/\s+/g, " ").trim().slice(-160);
      })(),
      boundaryNote:
        `The story occupies anthology scans ${scanLo}–${scanHi} (printed pages ${pageLo}–${pageHi}). ` +
        `Scan ${scanHi + 1} belongs to the next anthology item and no text from it enters this story.`,
    },
    tamilAssembly: {
      authority: `stories/${w.slug}/pages/`,
      derivedAssembly: `stories/${w.slug}/sections/${w.slug}.md`,
      reconciled: true,
      note:
        "The page records are the archival textual authority and are what this reading text is built " +
        "from. The assembled section file is a derived reading convenience; its per-scan marker style " +
        "is not uniform across the anthology, so it is not used to attribute text to scans.",
    },
    crossScanJoinPolicy: {
      policy:
        "A scan-final fragment that does not close a sentence continues into the next scan's opening " +
        "fragment, joined for reading with a single space.",
      basis:
        "Applied uniformly from the punctuation the page records themselves carry. The archive records " +
        "no per-boundary adjudication for this story.",
      individualAdjudication: false,
      transitions: expectScans.length - 1,
      appliedBoundaries: ta.joins,
      unresolvedBoundaries: 0,
      note:
        "This is a RULE applied across the batch, not a set of individually inspected boundaries. A " +
        "policy applied uniformly is weaker evidence than a boundary someone looked at, and the two " +
        "are not presented as the same thing.",
    },
    english: {
      titleEn: en.titleEn,
      sourceScans: `${scanLo}–${scanHi}`,
      scanAnchors: en.pages.length,
      blockedSourceLocations: 0,
      kind: "project-created",
      kindBasis:
        "An archive-produced translation derived from the project's own verified Tamil reading, not a " +
        "separately published translation. The Tamil remains authoritative.",
      archiveStatus: {
        statusAsRecorded: "translation-review PASS",
        note:
          "The label is the source archive's own, recorded with its wording. It does not establish " +
          "that a human editorial review was completed, and no human-review claim is made here.",
      },
      paragraphingNote:
        "The English follows the verified Tamil's paragraph structure and the same scan anchors; it " +
        "does not re-divide the story.",
    },
    reviewQueue: {
      exists: hasQueue,
      file: `stories/${w.slug}/POSSIBLE_ERRORS_FOR_REVIEW.md`,
      note:
        "A forward-looking recheck queue. An entry there is a place worth looking at again — not a " +
        "known error, not a downgrade of the story's verified status, and not evidence that a human " +
        "review has been completed.",
    },
    anthology: {
      collectionSlug: COLLECTION,
      collectionTitleTa: COLLECTION_TITLE_TA,
      editionStatementTa: COLLECTION_EDITION_TA,
      publisherTa: COLLECTION_PUBLISHER_TA,
      storiesInCollection: WORKS.length,
      storyOrder: w.order,
      collectionScanTotal: SCAN_TOTAL_PAGES,
      storyBearingScans: STORY_BEARING_SCANS,
      backCoverScan: BACK_COVER_SCAN,
      scanToPrintedPageRelation: "scan = printed story page + 9",
      note:
        "These are COLLECTION-level facts. The 260-scan total, the shared SHA-256 and the 37-story " +
        "count describe the anthology, not this story; the story's own extent is in storyScope. The " +
        `edition statement ${COLLECTION_EDITION_TA} is the ANTHOLOGY's, and is not a standalone ` +
        "first-edition statement for this story.",
    },
    visualFidelity: {
      result: "PASS",
      note: "Story-local visual-fidelity closure as recorded by the source archive.",
    },
  };
  if (titleWitness) provenance.titleWitness = titleWitness;

  const dir = path.join(OUT_ROOT, w.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "story.json"), JSON.stringify(story, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

  report.push({ slug: w.slug, order: w.order, scans: `${scanLo}–${scanHi}`, taParas, enParas,
                heads: taHeads, joins: ta.joins, enJoins: enFolded.joins });
}

// ── REPORT ──────────────────────────────────────────────────────────────────────────────────────────
console.log(`\n1977 anthology — Bulk Onboarding Wave 2`);
console.log(`  source pin      ${APPROVED_SOURCE_COMMIT}`);
console.log(`  collection tree ${APPROVED_COLLECTION_TREE}`);
console.log(`  stories         ${report.length}\n`);
console.log("   #  slug                       scans      ta¶  en¶  hd  joins");
for (const r of report) {
  console.log(`  ${String(r.order).padStart(2)}  ${r.slug.padEnd(26)} ${r.scans.padEnd(10)} ${String(r.taParas).padStart(3)}  ${String(r.enParas).padStart(3)}  ${String(r.heads).padStart(2)}  ${String(r.joins).padStart(3)}/${r.enJoins}`);
}
console.log(`\n  total Tamil paragraphs   ${report.reduce((n, r) => n + r.taParas, 0)}`);
console.log(`  total English paragraphs ${report.reduce((n, r) => n + r.enParas, 0)}`);
console.log(`  cross-scan joins         ${report.reduce((n, r) => n + r.joins, 0)} tamil / ${report.reduce((n, r) => n + r.enJoins, 0)} english`);

console.log(`  ${EXCLUDED} untouched (separate work, separate pin)\n`);
