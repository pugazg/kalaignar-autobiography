// Source-linked batch validator — Bulk Onboarding Wave 2, the 1977 anthology's 37 short stories.
//
//   node scripts/validate-1977-short-stories.mjs <kalaignar-short-stories-clone>
//
// INDEPENDENT OF THE IMPORTER. It re-derives every expectation from the pinned source tree with its
// own extraction code and never imports a helper from the importer, so an importer bug cannot certify
// itself. Where both sides must agree, the source side is proved present and structured FIRST, and
// only then compared — `empty == empty` may never certify completeness. That rule exists because this
// project has already shipped a work whose verified introductory note was silently empty on both
// sides of a "verbatim" check.
//
// Exit codes: 0 all pass · 1 a validation failure · 2 cannot validate (pin/source mismatch).
// Normal completion sets `process.exitCode` rather than calling `process.exit()`, so a full report
// survives a CI pipe.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-1977-short-stories.mjs <short-stories-clone>");
  process.exit(2);
}

const nfc = (s) => s.normalize("NFC");
const read = (p) => nfc(fs.readFileSync(p, "utf8"));
const DATA = path.join(process.cwd(), "public/data/stories");

const PIN = "76135e1b5d504128c15be6bf59937716e5517d78";
const COLLECTION = "1977-kalaignar-karunanidhiyin-sirukathaigal";
const COLLECTION_TREE = "d45434d46b1e779a880fff3d774d0fcb5833e477";
const SCAN_SHA256 = "853032661482eaccb26c083a38d7aa75c081362d33c963c63e37d088bf20acb3";
const SCAN_BYTES = 268486609;
const SCAN_TOTAL = 260;
const BACK_COVER = 260;
const OBSOLETE_PIN = "a9b333f12128686785ee981f97313a64af12e29b";

// Declared independently of the importer's table.
const WORKS = [
  ["pugazhendhi", 1, 1, 6, 10, 15, "7489e5ddb8b35d8a2ef41600bccfc9b291332845"],
  ["nalayini", 2, 7, 14, 16, 23, "784d833f69f2ff741d9874ae864555366ccb3e21"],
  ["sabalam", 3, 15, 21, 24, 30, "fc02d6b8c288bbdd5f03fe3fe51622a383228a60"],
  ["aattakkavadi", 4, 22, 29, 31, 38, "f54a7197c661ad91b631ec0cba52d8b8747a9ba1"],
  ["kuppai-thotti", 5, 30, 37, 39, 46, "e8d5cf43fb200e95b85a637a4d49bd263f2ef5cc"],
  ["santhana-kinnam", 6, 38, 47, 47, 56, "d154416ac269678f5984ff665dc2e97b106abb69"],
  ["sangilichami", 7, 48, 59, 57, 68, "3b2f3c02d19757d956649e4eedf75ca33cd76f6f"],
  ["gangaiyin-kadhal", 8, 60, 63, 69, 72, "c25e85fcfff59e93e911a34ac1817fd24e7f81c3"],
  ["thaaymai", 9, 64, 74, 73, 83, "bcd5bf6b06c9b564864abe25e75c70599fe0e9e6"],
  ["thappivittargal", 10, 75, 82, 84, 91, "bd0b1c983be714c5997894f0b53a5a9c895e07ee"],
  ["thappavillai", 11, 83, 92, 92, 101, "ce80ac8bb1e8fe89d09952a2dbe7d20f43abf371"],
  ["aatharikkirar", 12, 93, 98, 102, 107, "fe4fabd9ca0a76a84ca9724cd162b136e1017c84"],
  ["iragasiyam", 13, 99, 102, 108, 111, "0baab51100f49e438e5d6a3464328b626a34f6f7"],
  ["munnuru-rupai", 14, 103, 105, 112, 114, "64d6d69ca597efca0a60bd60d1bfc8254b717042"],
  ["ezhai", 15, 106, 109, 115, 118, "35e0f00154c5536cf60bc561d77b298d993ab1da"],
  ["originalil-ullapadi", 16, 110, 116, 119, 125, "6596ce8d2c660d04f1f1d9b771399efc0be7c60a"],
  ["panangulai", 17, 117, 121, 126, 130, "38335b1d9f11a1191f0864e84c19ab20d4564481"],
  ["seththaval-kathai", 18, 122, 130, 131, 139, "9a70ee7fe99326260a5bc775b02c351c4fd5744f"],
  ["pretha-visaranai", 19, 131, 136, 140, 145, "d1bbb45d3462de55047f9f26e1e705cafc32693b"],
  ["kandathum-kadhal-ozhiga", 20, 137, 141, 146, 150, "1903720fecd0b53c009da637f023a7914d76b5a9"],
  ["aalamarathup-puraakkal", 21, 142, 146, 151, 155, "d09e93781afa679d35349e93555a4c110664fbe7"],
  ["thothukkili", 22, 147, 151, 156, 160, "71f04f3621f4c40e8b6ca8216dd9910b07d1fddd"],
  ["kadhal-kaditham", 23, 152, 156, 161, 165, "0beca693da89e23a456f11cfd1f2a7e21e0e8b45"],
  ["kannadakkam", 24, 157, 163, 166, 172, "e14d7afb2675cffe463f834eae616667894701de"],
  ["vazha-mudiyathavargal", 25, 164, 171, 173, 180, "b03f83a712a6fcbfb98451ecc73afd23cf402bb9"],
  ["abagya-chinthamani", 26, 172, 179, 181, 188, "ba2ac25f5e45629ac02d43e13625e51b50353de2"],
  ["palaivana-roja", 27, 180, 184, 189, 193, "82be76bbc27a860681597b440f3f0d33581a6001"],
  ["puratchip-padam", 28, 185, 189, 194, 198, "78fcda9d34ca9a36fd280e7a65d7c31aa3f903da"],
  ["thidukkidum-kathai", 29, 190, 195, 199, 204, "e6eea7e253f33f029f1c64958ea184dbd07423e0"],
  ["kadaisi-kattam", 30, 196, 201, 205, 210, "4176f3cc1e2797938a4a26d8acb11cc816105261"],
  ["ayyo-raja", 31, 202, 208, 211, 217, "9bdc09d0a9f09ffddad6e651d6846ca5014690c9"],
  ["visham-inidhu", 32, 209, 215, 218, 224, "1e0a876ad13c6fb48c91ff7f14d51be9318bafb9"],
  ["veniyin-kadhalan", 33, 216, 221, 225, 230, "49ea97a0025eca96ae6895764df86188480933e0"],
  ["amirthamathi", 34, 222, 229, 231, 238, "6392d447a9fbd0822452f5040f6a524d48128222"],
  ["sumanthaval", 35, 230, 240, 239, 249, "e84057745986e7e6712e4342f12a149c7d113c77"],
  ["siddharthan-silai", 36, 241, 243, 250, 252, "c82f565ccdae0a7882e5b3942ba28bae38ac8792"],
  ["nunikkarumbu", 37, 244, 250, 253, 259, "5a20d7cfcdef25999ca74d17e110679176d76ef7"],
].map(([slug, order, p1, p2, s1, s2, tree]) => ({ slug, order, p1, p2, s1, s2, tree }));

const TITLE_WITNESSES = {
  "puratchip-padam": { toc: "புரட்சிப்படம்", opening: "புரட்சிப் படம்" },
  "siddharthan-silai": { toc: "சித்தார்த்தன்", opening: "சித்தார்த்தன் சிலை" },
};

// ── HARNESS ─────────────────────────────────────────────────────────────────────────────────────────
const results = [];
let cur = null;
const group = (name) => { cur = { name, n: 0, fails: [] }; results.push(cur); console.log(`\n${name}`); };
function check(label, ok) {
  cur.n++;
  if (ok) console.log(`    ok  ${label}`);
  else { cur.fails.push(label); console.log(`  FAIL  ${label}`); }
}
const eq = (label, got, want) =>
  check(`${label} (${JSON.stringify(got)} === ${JSON.stringify(want)})`,
        JSON.stringify(got) === JSON.stringify(want));

function cannotValidate(msg) {
  console.log(`\n  ${msg}`);
  console.log("\nBATCH RESULT: CANNOT VALIDATE\n");
  process.exit(2);
}

// ── PIN / IDENTITY (fail-closed BEFORE anything else) ───────────────────────────────────────────────
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();
let head;
try { head = git("rev-parse", "HEAD"); }
catch (e) { cannotValidate(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (head !== PIN) cannotValidate(`source clone is at ${head}, not the reviewed pin ${PIN}`);

// ── INDEPENDENT SOURCE EXTRACTION ───────────────────────────────────────────────────────────────────
// Deliberately re-implemented here rather than shared with the importer.
const MARKER = new RegExp(
  "<!--\\s*(?:source scan (\\d+); printed page (\\d+)" +
  "|மூல ஸ்கேன் பக்கம்:\\s*(\\d+);\\s*அச்சுப் பக்கம்:\\s*(\\d+)" +
  "|anthology scan:\\s*(\\d+);\\s*printed page:\\s*(\\d+))\\s*-->", "g");
const NOTE_HEAD = /^## (?:Assembly note|Translation note|Visual-fidelity assembly note|Source[- ]review note)\s*$/m;
const DISPLAY_LABEL = "அச்சு உரை";

const cutNote = (t) => { const m = NOTE_HEAD.exec(t); return m ? t.slice(0, m.index) : t; };
const stripComments = (t) => t.replace(/<!--[\s\S]*?-->/g, "\n\n").replace(/^>.*$/gm, "");

function chunks(text) {
  const out = [];
  for (const c of stripComments(text).split(/\n{2,}/)) {
    const line = c.trim();
    if (!line || line === `# ${DISPLAY_LABEL}`) continue;
    out.push(line);
  }
  return out;
}

/** Source page records, keyed by scan. */
function sourcePages(slug) {
  const dir = path.join(SRC_REPO, "stories", slug, "pages");
  const map = new Map();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
    const raw = read(path.join(dir, f));
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
    if (!fm) continue;
    const get = (k) => {
      const m = new RegExp(`^${k}:\\s*(.+?)\\s*$`, "m").exec(fm[1]);
      return m ? m[1].trim().replace(/^"|"$/g, "") : null;
    };
    const body = cutNote(raw.slice(fm[0].length));
    map.set(Number(get("scan_page")), {
      printedPage: get("printed_page") === "null" ? null : Number(get("printed_page")),
      status: get("status"),
      pageType: get("page_type"),
      story: get("story"),
      blocks: chunks(body),
      file: f,
    });
  }
  return map;
}

/** English marker sections, keyed by scan. */
function sourceEnglish(slug) {
  const raw = cutNote(read(path.join(SRC_REPO, "stories", slug, "translations", "en", `${slug}.md`)));
  const marks = [...raw.matchAll(MARKER)].map((m) => ({
    scan: Number(m[1] ?? m[3] ?? m[5]), printedPage: Number(m[2] ?? m[4] ?? m[6]),
    start: m.index, end: m.index + m[0].length,
  }));
  const map = new Map();
  marks.forEach((mk, i) => {
    const to = i + 1 < marks.length ? marks[i + 1].start : raw.length;
    map.set(mk.scan, { printedPage: mk.printedPage, blocks: chunks(raw.slice(mk.end, to)) });
  });
  const h1 = /^#\s+(.+)$/m.exec(marks.length ? raw.slice(0, marks[0].start) : raw);
  return { map, titleEn: h1 ? h1[1].trim() : null, markerCount: marks.length };
}

const flatten = (blocks) =>
  blocks.filter((b) => b.kind === "paragraph")
        .map((b) => b.segments.map((s) => s.text).join(" "))
        .join("\n");

// ── 1. BATCH PRECONDITIONS ──────────────────────────────────────────────────────────────────────────
group("BATCH PRECONDITIONS");
eq("the authorized batch is exactly 37 stories", WORKS.length, 37);
eq("no duplicate slug", new Set(WORKS.map((w) => w.slug)).size, 37);
eq("no duplicate order", new Set(WORKS.map((w) => w.order)).size, 37);
check("orders are the anthology's printed sequence 1..37",
      WORKS.every((w, i) => w.order === i + 1));
check("kizhavan-kanavu is NOT in the batch", !WORKS.some((w) => w.slug === "kizhavan-kanavu"));
eq("source clone HEAD is exactly the reviewed pin", head, PIN);
eq("collection tree is the reviewed collection tree",
   git("rev-parse", `${PIN}:collections/${COLLECTION}`), COLLECTION_TREE);

// Story ranges must tile 10–259 with no gap and no overlap.
{
  let cursor = 10, gaps = 0, overlaps = 0;
  for (const w of WORKS) {
    if (w.s1 > cursor) gaps++;
    if (w.s1 < cursor) overlaps++;
    cursor = w.s2 + 1;
  }
  eq("story scans begin at 10", WORKS[0].s1, 10);
  eq("story scans end at 259", WORKS[WORKS.length - 1].s2, 259);
  eq("no gap in the anthology story sequence", gaps, 0);
  eq("no overlap between adjacent story ranges", overlaps, 0);
  eq("printed story pages begin at 1", WORKS[0].p1, 1);
  eq("printed story pages end at 250", WORKS[WORKS.length - 1].p2, 250);
  check(`scan ${BACK_COVER} (back cover) lies outside every story range`,
        !WORKS.some((w) => w.s1 <= BACK_COVER && w.s2 >= BACK_COVER));
}

// The obsolete pre-correction pin must appear nowhere in generated data.
{
  let stale = 0;
  for (const w of WORKS) {
    for (const f of ["story.json", "provenance.json"]) {
      const p = path.join(DATA, w.slug, f);
      if (fs.existsSync(p) && read(p).includes(OBSOLETE_PIN)) stale++;
    }
  }
  eq("the obsolete pre-correction pin appears in NO generated file", stale, 0);
}

// Anthology-wide source gates.
{
  const completion = read(path.join(SRC_REPO, "PROJECT_COMPLETION.md"));
  check("completion register records 37/37 Tamil", /37 \/ 37 complete/.test(completion));
  check("completion register records 37/37 English PASS", /37 \/ 37 PASS/.test(completion));
  check("final English structural/control QA is PASS", /Final English structural\/control QA \| \*\*PASS\*\*/.test(completion));
  check("completion register carries the controlling SHA-256", completion.includes(SCAN_SHA256));
  const qa = read(path.join(SRC_REPO, "ENGLISH_TRANSLATION_FINAL_QA.md"));
  check("anthology-wide final English QA file records PASS", /\bPASS\b/.test(qa));
}

// ── 2. PER-STORY ────────────────────────────────────────────────────────────────────────────────────
for (const w of WORKS) {
  group(`${String(w.order).padStart(2)}. ${w.slug.toUpperCase()}`);

  eq("frozen source tree is unchanged", git("rev-parse", `${PIN}:stories/${w.slug}`), w.tree);

  const storyPath = path.join(DATA, w.slug, "story.json");
  const provPath = path.join(DATA, w.slug, "provenance.json");
  check("generated story.json exists", fs.existsSync(storyPath));
  check("generated provenance.json exists", fs.existsSync(provPath));
  if (!fs.existsSync(storyPath) || !fs.existsSync(provPath)) continue;
  const story = JSON.parse(read(storyPath));
  const prov = JSON.parse(read(provPath));

  eq("generated data records the corrected source pin", story.sourceCommit, PIN);
  eq("provenance records the frozen tree", prov.sourceTree, w.tree);
  eq("shelf", story.shelf, "fiction");
  eq("subtype", story.subtype, "short-story");
  eq("reader structure", story.readerStructure, "story");
  eq("source form is the anthology form", story.sourceForm, "anthology-story");
  eq("anthology order", story.anthology.order, w.order);
  eq("printed page range", [story.anthology.printedPages.first, story.anthology.printedPages.last], [w.p1, w.p2]);
  eq("source scan range", [story.anthology.sourceScans.first, story.anthology.sourceScans.last], [w.s1, w.s2]);

  // ── SOURCE SIDE: prove PRESENCE, then STRUCTURE, before any equality ──────────────────────────────
  const pages = sourcePages(w.slug);
  const expect = Array.from({ length: w.s2 - w.s1 + 1 }, (_, i) => w.s1 + i);
  // Defensive readers: a missing page record or English section must produce a clean assertion
  // failure, never a TypeError that kills the run before it prints its report.
  const EMPTY_PAGE = { printedPage: null, status: null, pageType: null, story: null, blocks: [], file: null };
  const EMPTY_SEC = { printedPage: null, blocks: [] };
  const pg = (s) => pages.get(s) ?? EMPTY_PAGE;
  eq("source page records cover exactly the declared scans", [...pages.keys()].sort((a, b) => a - b), expect);
  check("every source page record is verified",
        expect.every((s) => pg(s).status === "verified"));
  check("every source page record is NON-EMPTY",
        expect.every((s) => pg(s).blocks.length > 0));
  check("every source page carries its printed page number",
        expect.every((s) => Number.isInteger(pg(s).printedPage)));
  check("the anthology relation scan = printed page + 9 holds on every page",
        expect.every((s) => s === pg(s).printedPage + 9));
  check(`no source page is the back cover (scan ${BACK_COVER})`, !pages.has(BACK_COVER));
  check("no source page record still carries the archival display label",
        expect.every((s) => !pg(s).blocks.includes(`# ${DISPLAY_LABEL}`)));
  eq("exactly one story-opening page, at the first scan",
     expect.filter((s) => pg(s).pageType === "story-opening"), [w.s1]);
  eq("exactly one story-ending page, at the last scan",
     expect.filter((s) => pg(s).pageType === "story-ending"), [w.s2]);

  const en = sourceEnglish(w.slug);
  const es = (s) => en.map.get(s) ?? EMPTY_SEC;
  check("English translation carries scan markers", en.markerCount > 0);
  eq("English scan anchors equal the page-record scans", [...en.map.keys()].sort((a, b) => a - b), expect);
  check("every English marker section is NON-EMPTY",
        expect.every((s) => es(s).blocks.length > 0));
  check("every English marker's printed page matches the page record",
        expect.every((s) => es(s).printedPage === pg(s).printedPage));
  check("English translation carries a title heading", !!en.titleEn && en.titleEn.length > 0);

  const review = read(path.join(SRC_REPO, "stories", w.slug, "TRANSLATION_REVIEW.md"));
  check("story-local translation review records PASS", /\*\*PASS\b/.test(review));
  const vf = read(path.join(SRC_REPO, "stories", w.slug, "visual-fidelity.md"));
  check("story-local visual fidelity records PASS", /\bPASS\b/i.test(vf));

  // ── GENERATED SIDE: prove PRESENCE, then compare ──────────────────────────────────────────────────
  const taParas = story.tamil.blocks.filter((b) => b.kind === "paragraph");
  const enParas = story.english.blocks.filter((b) => b.kind === "paragraph");
  check(`generated Tamil stream is NON-EMPTY (${taParas.length} paragraphs)`, taParas.length > 0);
  check(`generated English stream is NON-EMPTY (${enParas.length} paragraphs)`, enParas.length > 0);
  eq("generated Tamil cites exactly the declared scans", story.sourceScans, expect);
  check("every Tamil segment cites a scan inside the story range",
        story.tamil.blocks.every((b) => b.kind !== "paragraph" ||
          b.segments.every((s) => s.sourceScan >= w.s1 && s.sourceScan <= w.s2)));
  check("every English segment cites a scan inside the story range",
        story.english.blocks.every((b) => b.kind !== "paragraph" ||
          b.segments.every((s) => s.sourceScan >= w.s1 && s.sourceScan <= w.s2)));
  check("no generated segment cites the back-cover scan",
        !JSON.stringify(story).includes(`"sourceScan":${BACK_COVER}`));

  // Verbatim: every source paragraph must appear in the generated stream, with both sides non-empty.
  const srcTa = expect.flatMap((s) => pg(s).blocks).filter((b) => !/^#{1,2}\s/.test(b));
  check(`source-derived Tamil paragraphs are NON-EMPTY (${srcTa.length})`, srcTa.length > 0);
  const genTa = flatten(story.tamil.blocks);
  check("generated Tamil flattening is NON-EMPTY", genTa.length > 0);
  {
    const missing = srcTa.filter((p) => !genTa.includes(p.replace(/\s+/g, " ").trim())
                                     && !genTa.includes(p));
    eq("every source Tamil paragraph is present verbatim in the generated stream", missing.length, 0);
  }
  const srcEn = expect.flatMap((s) => es(s).blocks).filter((b) => !/^#{1,2}\s/.test(b));
  check(`source-derived English paragraphs are NON-EMPTY (${srcEn.length})`, srcEn.length > 0);
  const genEn = flatten(story.english.blocks);
  check("generated English flattening is NON-EMPTY", genEn.length > 0);
  {
    const missing = srcEn.filter((p) => !genEn.includes(p.replace(/\s+/g, " ").trim())
                                     && !genEn.includes(p));
    eq("every source English paragraph is present verbatim in the generated stream", missing.length, 0);
  }

  // Title: canonical display title follows the story-opening heading.
  const openingBlock = pg(w.s1).blocks.find((b) => /^#\s/.test(b));
  check("the story-opening page prints a title heading", !!openingBlock);
  const openingHeading = openingBlock ? openingBlock.replace(/^#\s+/, "").trim() : null;
  eq("public Tamil title is the printed story-opening heading", story.title.ta, openingHeading);
  eq("public English title is the archive's released English heading", story.title.en, en.titleEn);

  const tw = TITLE_WITNESSES[w.slug];
  if (tw) {
    check("both title witnesses are recorded", !!prov.titleWitness);
    eq("table-of-contents witness preserved", prov.titleWitness.tocTitleTa, tw.toc);
    eq("story-opening witness preserved", prov.titleWitness.openingHeadingTa, tw.opening);
    check("the two witnesses remain DISTINCT (not normalised into one)",
          prov.titleWitness.tocTitleTa !== prov.titleWitness.openingHeadingTa);
    eq("the canonical title follows the opening heading", story.title.ta, tw.opening);
  } else {
    check("no title witness is invented where the source records one form", !prov.titleWitness);
  }

  // NO BOOKLET FACT MAY BE FABRICATED.
  check("no `கற்பனையுரை`-style form label is invented", story.formLabel === undefined);
  check("no per-story printed authorship line is invented", story.author.printedAuthorshipLineTa === undefined);
  check("no standalone physical publication is invented", prov.physicalPublication === undefined);
  check("no printed-page uncertainty is invented", prov.printedPageUncertainty === undefined);
  check("no publisher errata are invented", prov.errata === undefined);
  eq("author name is the collection's printed credit", story.author.nameTa, "கலைஞர் மு. கருணாநிதி");

  // Collection facts stay at collection level, and the edition is not a standalone claim.
  eq("provenance carries the anthology block", typeof prov.anthology, "object");
  eq("collection scan total", prov.anthology.collectionScanTotal, SCAN_TOTAL);
  eq("stories in collection", prov.anthology.storiesInCollection, 37);
  eq("controlling scan SHA-256", prov.source.scanSha256, SCAN_SHA256);
  eq("controlling scan byte size", prov.source.scanFileSizeBytes, SCAN_BYTES);
  check("the 1977 edition statement is recorded as the ANTHOLOGY's",
        prov.anthology.editionStatementTa.includes("1977") &&
        /ANTHOLOGY'?s|தொகுப்ப/.test(prov.anthology.note + prov.anthology.editionStatementTa) === true ||
        prov.anthology.note.includes("ANTHOLOGY"));
  check("story scope is complete with no unresolved reading",
        prov.storyScope.complete === true && prov.storyScope.unresolvedReadings === 0 &&
        prov.storyScope.blocked === 0);
  eq("story scope scan count", prov.storyScope.storyScanCount, expect.length);
  eq("English layer is project-created", prov.english.kind, "project-created");
  check("the recheck queue is recorded as forward-looking, not a known error",
        prov.reviewQueue.note.includes("not a") && !/known error(?!s)/i.test(prov.reviewQueue.note.replace("not a known error", "")));
}

// ── 3. STORY-29 CORRECTED ANCHORING ─────────────────────────────────────────────────────────────────
// The upstream repair (`Fix Thidukkidum Kathai English scan anchoring`) is proved here independently
// of the source repository's own Python checker, against the archive's human-reviewed anchors.
group("STORY 29 — CORRECTED PAGE ANCHORING");
{
  const slug = "thidukkidum-kathai";
  const anchorsPath = path.join(SRC_REPO, "stories", slug, "translations", "en", "page-anchors.json");
  check("the archive publishes human-reviewed page anchors", fs.existsSync(anchorsPath));
  if (fs.existsSync(anchorsPath)) {
    const anchors = JSON.parse(read(anchorsPath));
    const pages = sourcePages(slug);
    const en = sourceEnglish(slug);
    eq("anchors cover scans 199–204", anchors.anchors.map((a) => a.scan), [199, 200, 201, 202, 203, 204]);
    for (const a of anchors.anchors) {
      const src = pages.get(a.scan);
      const tr = en.map.get(a.scan);
      check(`scan ${a.scan}: Tamil page record is NON-EMPTY`, !!src && src.blocks.length > 0);
      check(`scan ${a.scan}: English section is NON-EMPTY`, !!tr && tr.blocks.length > 0);
      if (!src || !tr || !src.blocks.length || !tr.blocks.length) continue;
      // The reviewed anchors describe where the STORY PROSE starts on each page. A page record may
      // open with the printed title heading and, on this story, a printed bracketed authorial note
      // (`[குறிப்பு : …]` / `[Note: …]`) — both are source content but neither is the prose boundary
      // the anchor names, so leading heading/bracket blocks are stepped over rather than compared.
      const prose = (bs) => {
        const out = [...bs];
        while (out.length && (/^#{1,2}\s/.test(out[0]) || /^\[[\s\S]*\]$/.test(out[0].trim()))) out.shift();
        return out.join(" ").replace(/\s+/g, " ");
      };
      const taText = prose(src.blocks);
      const enText = prose(tr.blocks);
      check(`scan ${a.scan}: Tamil begins at the reviewed boundary`,
            taText.startsWith(nfc(a.tamil_starts_with).slice(0, 40)));
      check(`scan ${a.scan}: English begins at the reviewed boundary`,
            enText.startsWith(nfc(a.english_starts_with).slice(0, 40)));
      check(`scan ${a.scan}: English ends at the reviewed boundary`,
            enText.trimEnd().endsWith(nfc(a.english_ends_with).trim()));
    }
    // The specific defect that was repaired must not be able to reappear.
    check("scan 204 is NOT empty (the repaired defect)", (en.map.get(204)?.blocks.length ?? 0) > 0);
    check("the old shifted mapping has NOT leaked into generated data",
          (() => {
            const story = JSON.parse(read(path.join(DATA, slug, "story.json")));
            const seg = story.english.blocks
              .filter((b) => b.kind === "paragraph")
              .flatMap((b) => b.segments)
              .find((s) => s.text.includes("Dear friends! Today you will have to walk"));
            return !!seg && seg.sourceScan === 200;
          })());
  }
}

// ── 4. CATALOGUE / REGISTRY ─────────────────────────────────────────────────────────────────────────
group("CATALOGUE AND REGISTRY");
{
  const lib = read(path.join(process.cwd(), "data/library.ts"));
  const stories = read(path.join(process.cwd(), "data/stories.ts"));
  for (const w of WORKS) {
    check(`${w.slug} is registered in STORY_SLUGS`, new RegExp(`"${w.slug}"`).test(stories));
  }
  const entries = WORKS.filter((w) => lib.includes(`id: "${w.slug}"`));
  eq("all 37 stories have a catalogue entry", entries.length, 37);
  check("kizhavan-kanavu remains catalogued", lib.includes('id: "kizhavan-kanavu"'));
  check("kizhavan-kanavu remains in the registry", stories.includes('"kizhavan-kanavu"'));
  for (const w of WORKS) {
    const start = lib.indexOf(`id: "${w.slug}"`);
    const next = lib.indexOf("\n  {", start);
    const entry = lib.slice(start, next === -1 ? lib.length : next);
    check(`${w.slug}: catalogue entry carries the corrected pin`, entry.includes(PIN));
    check(`${w.slug}: catalogue entry invents NO edition`, !/\bedition:/.test(entry));
    check(`${w.slug}: catalogue entry invents NO unitCount`, !/\bunitCount:/.test(entry));
    check(`${w.slug}: catalogue entry invents NO rights block`, !/\brights:/.test(entry));
    check(`${w.slug}: English is marked project-created`, entry.includes('englishKind: "project-created"'));
  }
  check("no catalogue entry carries the obsolete pin", !lib.includes(OBSOLETE_PIN));
}

// ── 5. KIZHAVAN REGRESSION ──────────────────────────────────────────────────────────────────────────
group("KIZHAVAN KANAVU REGRESSION");
{
  const p = path.join(DATA, "kizhavan-kanavu");
  const story = JSON.parse(read(path.join(p, "story.json")));
  const prov = JSON.parse(read(path.join(p, "provenance.json")));
  eq("keeps its own source pin, not the anthology's", story.sourceCommit, "d9a411d40bd54d9770e5b28854ac5b4e804dd419");
  check("keeps the booklet's printed form label", story.formLabel?.ta === "கற்பனையுரை");
  check("keeps the booklet's printed authorship line", !!story.author.printedAuthorshipLineTa);
  check("keeps its standalone physical-publication record", !!prov.physicalPublication);
  check("keeps its printed-page uncertainty", !!prov.printedPageUncertainty);
  check("keeps the publisher errata as a SEPARATE witness",
        !!prov.errata && prov.errata.appliedToReadingText === false);
  check("keeps its blocked non-story front-matter distinction",
        Array.isArray(prov.physicalPublication.blockedScans) && prov.physicalPublication.blockedScans.length > 0);
  check("no anthology block is falsely attached", prov.anthology === undefined && story.anthology === undefined);
  check("no anthology title witness is falsely attached", prov.titleWitness === undefined);
  check("Tamil reading stream is present", story.tamil.blocks.length > 0);
  check("English reading stream is present", story.english.blocks.length > 0);
}

// ── 6. ROUTE / SITEMAP CONTRACT ─────────────────────────────────────────────────────────────────────
group("ROUTE AND SITEMAP CONTRACT");
{
  const sitemap = read(path.join(process.cwd(), "app/sitemap.ts"));
  check("story routes are driven by STORY_SLUGS, not hard-coded", sitemap.includes("STORY_SLUGS"));
  const hardcoded = WORKS.filter((w) => sitemap.includes(w.slug));
  eq("no Wave-2 slug is hard-coded into the sitemap", hardcoded.length, 0);
  const stories = read(path.join(process.cwd(), "data/stories.ts"));
  const listed = (stories.match(/^\s+"[a-z0-9-]+",$/gm) || []).length;
  eq("the story registry holds 38 slugs (kizhavan + 37)", listed, 38);
}

// ── REPORT ──────────────────────────────────────────────────────────────────────────────────────────
const total = results.reduce((n, r) => n + r.n, 0);
const failed = results.reduce((n, r) => n + r.fails.length, 0);
console.log("\n" + "─".repeat(72));
for (const r of results) {
  const status = r.fails.length ? "FAIL" : "PASS";
  console.log(`  ${r.name.padEnd(44)} ${status}  (${r.n} assertions, ${r.fails.length} failed)`);
}
console.log("─".repeat(72));
console.log(`  1977-short-stories — ${total} assertions, ${failed} failed across ${results.length} groups`);
if (failed) {
  console.log("\n  failed assertions:");
  for (const r of results) for (const f of r.fails) console.log(`    · ${r.name} — ${f}`);
}
console.log(`\nBATCH RESULT: ${failed ? "FAILURES PRESENT" : "ALL PASS"}\n`);

// `process.exitCode`, never `process.exit()` — a hard exit can discard buffered stdout on a CI pipe,
// which once made a fully-passing validator look like it had stopped 64 lines in.
process.exitCode = failed ? 1 : 0;
