// Wave 4 P2 — காலப் பேழையும் கவிதைச் சாவியும் publication validator.
//
// Validates the integrated publication against the pinned source, by a DIFFERENT route from the
// importer. The importer builds each item's English from the per-item files translations/en/items/
// and proves them equal to the reader-facing combined assembly; this validator instead reconstructs
// each item's English from the reviewed BATCH files and its Tamil from sections/ with its own line
// state machine, then compares token-for-token to the vendored payload. An importer and a validator
// that share a parser share a defect, and one that re-runs the importer proves only determinism.
//
// Every check proves presence → structure → equality; a comparison whose two sides are both empty
// never counts as a pass.
//
// Usage: node scripts/validate-wave4-p2-kaalap-pezhai.mjs <kalaignar-poems-clone>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-wave4-p2-kaalap-pezhai.mjs <kalaignar-poems-clone>");
  process.exit(1);
}
const readText = (p) => fs.readFileSync(p, "utf8");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();

// Independent read of a frozen page record's VISIBLE printed numeral. Deliberately a different parse
// from the engine's (a targeted frontmatter scan, no shared helper), so the two cannot share a bug.
function pageRecord(scan) {
  const rel = `pages/${String(scan).padStart(4, "0")}.md`;
  const abs = path.join(WORK, rel);
  if (!fs.existsSync(abs)) return null;
  const t = readText(abs);
  const fm = /^---\n([\s\S]*?)\n---/.exec(t);
  const get = (k) => (fm ? (new RegExp(`^${k}:\\s*(.*)$`, "m").exec(fm[1])?.[1]?.trim() ?? null) : null);
  const rawPP = get("printed_page");
  return {
    exists: true,
    scanPage: Number(get("scan_page")),
    work: (get("work") ?? "").replace(/^"|"$/g, ""),
    status: (get("status") ?? "").replace(/^"|"$/g, ""),
    printedPage: rawPP === "null" ? null : /^\d+$/.test(rawPP ?? "") ? Number(rawPP) : undefined,
  };
}

let pass = 0;
const failures = [];
const check = (label, cond) => (cond ? pass++ : failures.push(label));
const eq = (label, a, b) =>
  JSON.stringify(a) === JSON.stringify(b) ? pass++ : failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);

const SLUG = "kaalap-pezhaiyum-kavithai-saaviyum";
const FREEZE = "969823195ea8943a67fad4286ab1bc7f1c876d56";
const WORK_TREE = "07a2d3cba65a1eb10b887dac3c83ce993f94a710";
const WORK = path.join(SRC_REPO, "poems", SLUG);
const DATA = path.join(process.cwd(), "public/data/poems", SLUG);
const pub = JSON.parse(readText(path.join(DATA, "publication.json")));
const prov = JSON.parse(readText(path.join(DATA, "provenance.json")));

const poemsTs = readText(path.join(process.cwd(), "data/poems.ts"));
const libraryTs = readText(path.join(process.cwd(), "data/library.ts"));
const collectionsTs = readText(path.join(process.cwd(), "data/collections.ts"));
const arrayLiteral = (src, name) => {
  const m = new RegExp(`export const ${name}[^=]*=\\s*\\[([\\s\\S]*?)\\]\\s*as const;`).exec(src);
  return m ? (m[1].match(/"([^"]+)"/g) ?? []).map((x) => x.slice(1, -1)) : null;
};

// ── SOURCE FREEZE ────────────────────────────────────────────────────────────────────────────────
check("source clone HEAD is the Wave-4 freeze", git("rev-parse", "HEAD") === FREEZE);
eq("payload records the Wave-4 freeze commit", pub.sourceCommit, FREEZE);
eq("payload records the frozen work tree", pub.sourceTree, WORK_TREE);
eq("provenance records the frozen work tree", prov.sourceTree, WORK_TREE);
eq("the frozen work tree is what the freeze carries", git("rev-parse", `${FREEZE}:poems/${SLUG}`), WORK_TREE);
{
  const meta = readText(path.join(WORK, "metadata/source.md"));
  check("scan filename recorded verbatim upstream", meta.includes(prov.source.scanFilename));
  check("scan SHA-256 recorded verbatim upstream", meta.includes(prov.source.scanSha256));
  check("scan byte size recorded verbatim upstream", meta.includes(prov.source.scanFileSizeBytes.toLocaleString("en-US")));
  check("physical scan count recorded verbatim upstream", meta.includes(String(prov.source.scanTotalPages)));
  eq("306 physical scans", prov.source.scanTotalPages, 306);
  check("source PDF not vendored", prov.source.sourcePdfCommitted === false && !fs.existsSync(path.join(DATA, prov.source.scanFilename)));
}

// ── PUBLICATION IDENTITY ─────────────────────────────────────────────────────────────────────────
eq("POETRY_PUBLICATION_SLUGS is exactly the P2 publication", arrayLiteral(poemsTs, "POETRY_PUBLICATION_SLUGS"), [SLUG]);
eq("payload slug", pub.slug, SLUG);
eq("readerStructure is poetry-publication", pub.readerStructure, "poetry-publication");
eq("itemCount is 58", pub.itemCount, 58);
eq("items.length is 58", pub.items.length, 58);
eq("itemCount equals items.length", pub.itemCount, pub.items.length);
// One new LibraryWork, unitCount 58, no memberCount.
eq("exactly one catalogue entry for the publication", (libraryTs.match(new RegExp(`\\n    id: "${SLUG}",`, "g")) ?? []).length, 1);
{
  const start = libraryTs.indexOf(`id: "${SLUG}"`);
  const block = libraryTs.slice(start, libraryTs.indexOf(`provenanceHref: "/poems/${SLUG}/source"`, start));
  check("catalogue entry declares unitCount 58", /unitCount:\s*\{\s*value:\s*58/.test(block));
  // A FIELD assignment, not the word: the entry's own comment explains it uses unitCount "never
  // memberCount", and that sentence must not trip the guard.
  check("catalogue entry assigns no memberCount field", !/memberCount\s*:/.test(block));
  check("catalogue entry is a poetry-publication", block.includes('readerStructure: "poetry-publication"'));
}
// No 58 top-level LibraryWorks: none of the item slugs is a catalogue id.
for (const it of pub.items) check(`item ${it.ordinal} is not a top-level LibraryWork`, !libraryTs.includes(`id: "${it.slug}"`));

// ── ITEM ROSTER ──────────────────────────────────────────────────────────────────────────────────
eq("ordinals are exactly 1..58 in order", pub.items.map((i) => i.ordinal), Array.from({ length: 58 }, (_, i) => i + 1));
{
  const counts = {};
  for (const i of pub.items) counts[i.ordinal] = (counts[i.ordinal] ?? 0) + 1;
  check("every ordinal appears exactly once", Object.values(counts).every((c) => c === 1));
}

// ── SLUGS — re-derived INDEPENDENTLY from the released English item filenames ──────────────────────
const fileSlug = {};
for (const f of fs.readdirSync(path.join(WORK, "translations/en/items"))) {
  const m = /^(\d+)-(.*)-en\.md$/.exec(f);
  if (m) fileSlug[Number(m[1])] = m[2];
}
eq("58 English item files provide 58 slugs", Object.keys(fileSlug).length, 58);
for (const it of pub.items) {
  eq(`item ${it.ordinal}: slug matches its released English filename`, it.slug, fileSlug[it.ordinal]);
  check(`item ${it.ordinal}: slug is non-empty and well formed`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.slug));
  check(`item ${it.ordinal}: slug is not a reserved segment`, !["source", "items"].includes(it.slug));
  check(`item ${it.ordinal}: slug is not the bare ordinal`, it.slug !== String(it.ordinal) && it.slug !== String(it.ordinal).padStart(2, "0"));
}
eq("all 58 slugs are unique", new Set(pub.items.map((i) => i.slug)).size, 58);

// ── INDEPENDENT TAMIL RECONSTRUCTION (line state machine over sections/NN.md) ─────────────────────
function reconstructTamil(ord) {
  const raw = readText(path.join(WORK, `sections/${String(ord).padStart(2, "0")}.md`));
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  const toks = [];
  let scan = null;
  let sawTitle = false;
  for (const line of body.split("\n")) {
    const t = line.trim();
    const m = /^<!--\s*scan_page:\s*(\d+)\s*-->$/.exec(t);
    if (m) { scan = Number(m[1]); toks.push(`SCAN:${scan}`); continue; }
    if (/^<!--/.test(t)) continue;
    if (!sawTitle && /^#\s/.test(t)) { sawTitle = true; continue; }
    if (t === "") { toks.push("BLANK"); continue; }
    toks.push(`L:${line.replace(/\s+$/, "")}`);
  }
  return collapse(toks);
}
// ── INDEPENDENT ENGLISH RECONSTRUCTION (from reviewed BATCH files, not the item files) ────────────
function batchItemBodies() {
  const byItem = {};
  for (let b = 1; b <= 21; b++) {
    const src = readText(path.join(WORK, "translations/en/batches", `batch-${String(b).padStart(2, "0")}.md`));
    const lines = src.split("\n");
    let ord = null;
    let inVerse = false;
    for (const line of lines) {
      const mi = /^##\s+Item\s+(\d+)\s+—/.exec(line);
      if (mi) { ord = Number(mi[1]); inVerse = false; byItem[ord] = []; continue; }
      if (ord === null) continue;
      if (/^###\s+English translation\s*$/.test(line)) { inVerse = true; continue; }
      if (/^##\s/.test(line)) { inVerse = false; ord = null; continue; } // Translator notes / Batch review / next item header handled above
      if (inVerse) byItem[ord].push(line);
    }
  }
  return byItem;
}
function streamFromBatchBody(bodyLines) {
  const toks = [];
  for (const line of bodyLines) {
    const t = line.trim();
    const m = /^<!--\s*scan\s+(\d+)\s*-->$/.exec(t);
    if (m) { toks.push(`SCAN:${Number(m[1])}`); continue; }
    if (/^<!--/.test(t)) continue;
    const h = /^(#{1,6})\s+(.*\S)\s*$/.exec(t);
    if (h) { toks.push(`H:${h[2]}`); continue; }
    if (t === "") { toks.push("BLANK"); continue; }
    toks.push(`L:${line.replace(/\s+$/, "")}`);
  }
  return collapse(toks);
}
// Collapse: drop leading/trailing BLANKs and BLANKs adjacent to SCAN boundaries, and fold BLANK runs
// to one — matching how the payload models a stanza break (one break, only between verse on a page).
function collapse(toks) {
  const out = [];
  for (const t of toks) {
    if (t === "BLANK") {
      if (!out.length || out[out.length - 1] === "BLANK" || out[out.length - 1].startsWith("SCAN:")) continue;
      out.push("BLANK");
    } else {
      if (t.startsWith("SCAN:") && out[out.length - 1] === "BLANK") out.pop();
      out.push(t);
    }
  }
  while (out[out.length - 1] === "BLANK") out.pop();
  return out;
}
// The payload layer, rendered to the same token vocabulary.
function streamFromLayer(layer) {
  const toks = [];
  let lastScan = null;
  for (const e of layer.elements) {
    if (e.kind === "line") {
      if (e.sourceScan !== lastScan) { toks.push(`SCAN:${e.sourceScan}`); lastScan = e.sourceScan; }
      toks.push(`L:${" ".repeat(e.indent)}${e.text}`);
    } else if (e.kind === "source-heading") {
      if (e.sourceScan !== lastScan) { toks.push(`SCAN:${e.sourceScan}`); lastScan = e.sourceScan; }
      toks.push(`H:${e.text}`);
    } else if (e.kind === "stanza-break") {
      toks.push("BLANK");
    } else if (e.kind === "page-transition") {
      toks.push(`SCAN:${e.toScan}`);
      lastScan = e.toScan;
    }
  }
  return collapse(toks);
}

const batchBodies = batchItemBodies();
let taLinesTotal = 0;
let enLinesTotal = 0;
const allScans = new Set();
let pageRecordsRead = 0;
for (const it of pub.items) {
  const ta = streamFromLayer(it.tamil);
  const taSrc = reconstructTamil(it.ordinal);
  const taLineCount = it.tamil.elements.filter((e) => e.kind === "line").length;
  taLinesTotal += taLineCount;
  check(`item ${it.ordinal}: Tamil is non-trivial (${taLineCount} lines)`, taLineCount > 3);
  eq(`item ${it.ordinal}: Tamil payload equals the independently parsed section`, ta, taSrc);

  const en = streamFromLayer(it.english);
  const enSrc = streamFromBatchBody(batchBodies[it.ordinal] ?? []);
  const enLineCount = it.english.elements.filter((e) => e.kind === "line").length;
  enLinesTotal += enLineCount;
  check(`item ${it.ordinal}: English is non-trivial (${enLineCount} lines)`, enLineCount > 3);
  eq(`item ${it.ordinal}: English payload equals the independently reconstructed batch`, en, enSrc);

  // Scan coverage: the item's reading scans equal its declared physicalScans, and nothing overlaps.
  const scans = it.physicalScans.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i));
  const taScans = [...new Set(it.tamil.elements.filter((e) => e.kind === "line").map((e) => e.sourceScan))].sort((a, b) => a - b);
  eq(`item ${it.ordinal}: Tamil scan coverage equals declared physical scans`, taScans, scans);
  for (const sc of scans) {
    check(`item ${it.ordinal}: scan ${sc} is claimed by no other item`, !allScans.has(sc));
    allScans.add(sc);
  }
  // RECONCILED LOGICAL pagination is the section's own range, and equals scan − 1 for this
  // publication — but that is structural, NOT a claim any numeral is printed.
  check(`item ${it.ordinal}: reconciled logical pages present`, Array.isArray(it.logicalPrintedPages) && it.logicalPrintedPages.length > 0);
  eq(`item ${it.ordinal}: reconciled logical range is scan − 1`, [it.logicalPrintedPages[0].first, it.logicalPrintedPages.at(-1).last], [scans[0] - 1, scans.at(-1) - 1]);
  check(`item ${it.ordinal}: payload carries no ambiguous printedPages field`, !("printedPages" in it));

  // VISIBLE printedPage per line/heading must equal the frozen page record's printed_page EXACTLY —
  // never scan − 1. Every consumed scan must have a verified page record (fail closed, no fallback).
  for (const sc of scans) {
    const rec = pageRecord(sc);
    check(`item ${it.ordinal}: page record exists for scan ${sc}`, rec !== null);
    if (!rec) continue;
    pageRecordsRead++;
    eq(`item ${it.ordinal}: page record scan ${sc} identity`, [rec.scanPage, rec.work, rec.status], [sc, SLUG, "verified"]);
    check(`item ${it.ordinal}: page record scan ${sc} printed_page parses`, rec.printedPage === null || typeof rec.printedPage === "number");
    // Source-internal: where a numeral is visible it equals the reconciled scan − 1; null where absent.
    if (rec.printedPage !== null) eq(`item ${it.ordinal}: visible numeral on scan ${sc} equals scan − 1`, rec.printedPage, sc - 1);
    for (const e of [...it.tamil.elements, ...it.english.elements]) {
      if ((e.kind === "line" || e.kind === "source-heading") && e.sourceScan === sc) {
        eq(`item ${it.ordinal}: scan ${sc} line visible printedPage equals the page record`, e.printedPage, rec.printedPage);
      }
    }
  }
}
eq("numbered-item scans total 290", allScans.size, 290);
check("provenance roster uses the reconciled-logical name, not the ambiguous one", prov.itemRoster.every((r) => !("printedPages" in r)));
eq("numbered-item scans are exactly 10..299", [...allScans].sort((a, b) => a - b), Array.from({ length: 290 }, (_, i) => i + 10));
// ── VISIBLE-vs-LOGICAL PAGINATION — explicit regressions ─────────────────────────────────────────
// These pin the exact defect this repair fixed: an item title scan prints no numeral (null), while
// the scans around it do. A universal "scan − 1" cannot satisfy all three at once.
{
  const visibleFor = (scan) => {
    for (const it of pub.items) for (const e of [...it.tamil.elements, ...it.english.elements]) {
      if ((e.kind === "line" || e.kind === "source-heading") && e.sourceScan === scan) return e.printedPage;
    }
    return "no-line";
  };
  eq("scan 10 page record prints no numeral", pageRecord(10).printedPage, null);
  eq("scan 10 payload lines carry printedPage null (not 9)", visibleFor(10), null);
  eq("scan 11 page record prints 10", pageRecord(11).printedPage, 10);
  eq("scan 11 payload lines carry printedPage 10", visibleFor(11), 10);
  eq("scan 69 page record prints 68", pageRecord(69).printedPage, 68);
  eq("scan 69 payload lines carry printedPage 68", visibleFor(69), 68);
  // Logical never overwrites visible: item 1's logical range starts at 9, but its scan-10 title page
  // shows no visible 9.
  const it1 = pub.items[0];
  eq("item 1 reconciled logical range starts at 9", it1.logicalPrintedPages[0].first, 9);
  eq("but no scan-10 line claims a visible 9", visibleFor(10), null);
}
eq("a verified page record was read for every one of the 290 numbered scans", pageRecordsRead, 290);
check("Tamil total is substantial", taLinesTotal > 5000);
check("English total is substantial", enLinesTotal > 5000);

// ── PUBLICATION BOUNDARY ─────────────────────────────────────────────────────────────────────────
{
  const last = pub.items[pub.items.length - 1];
  eq("item 58 is the terminal item", last.ordinal, 58);
  eq("item 58 closes on scan 299", last.physicalScans[last.physicalScans.length - 1].last, 299);
  const lastLines = last.tamil.elements.filter((e) => e.kind === "line").map((e) => e.text);
  check("item 58 carries the closing marker (முதல் பாகம் முற்றிற்று)", lastLines.includes("(முதல் பாகம் முற்றிற்று)"));
  check("no item reaches scan 300 or beyond", ![...allScans].some((s) => s >= 300));
  check("boundary note states the first-part-only boundary", /numbered FIRST-PART boundary only/.test(prov.source.boundaryNote));
  // The source must DENY a broader second part, not merely omit one. The boundary note carries that
  // denial; what must be absent is any POSITIVE claim that this payload contains a second part.
  check("the boundary note explicitly denies a broader second part", /No broader second part is contained in or established/.test(prov.source.boundaryNote));
  check("no positive second-part claim is made", !/(?:contains|includes|establishes)[^.]*second part/i.test(JSON.stringify(pub) + JSON.stringify(prov)));
  // The end matter and back cover are named as exclusions, never absorbed.
  check("scans 300–305 குறிப்புகள் named as excluded", prov.source.lockedExclusions.some((x) => x.includes("300") && x.includes("குறிப்புகள்")));
  check("scan 306 back cover named as excluded", prov.source.lockedExclusions.some((x) => x.includes("306")));
}

// ── TITLE WITNESSES ──────────────────────────────────────────────────────────────────────────────
{
  const EXPECTED = [18, 22, 25, 26, 29, 31, 32, 37, 40, 44, 46, 50, 54, 58];
  const witnessOrdinals = pub.items.filter((i) => i.contentsTitleTa).map((i) => i.ordinal);
  eq("exactly the 14 documented title-witness items differ", witnessOrdinals, EXPECTED);
  eq("provenance records 14 title witnesses", prov.titleWitnesses.count, 14);
  // Canonical title never overwritten by the contents witness; each witness verbatim upstream.
  for (const it of pub.items) {
    const secRaw = readText(path.join(WORK, `sections/${String(it.ordinal).padStart(2, "0")}.md`));
    const titleFm = /^title:\s*"(.*)"$/m.exec(secRaw)[1];
    const contentsFm = /^contents_title:\s*"(.*)"$/m.exec(secRaw)[1];
    eq(`item ${it.ordinal}: canonical title is the title-page witness verbatim`, it.titleTa, titleFm);
    if (it.contentsTitleTa) {
      eq(`item ${it.ordinal}: contents witness is preserved verbatim`, it.contentsTitleTa, contentsFm);
      check(`item ${it.ordinal}: the two witnesses genuinely differ`, it.titleTa !== it.contentsTitleTa);
    } else {
      check(`item ${it.ordinal}: no witness split where the source agrees`, titleFm === contentsFm);
    }
  }
  // No hybrid: every canonical title is exactly one of the two source witnesses, never a blend.
  for (const w of prov.titleWitnesses.items) check(`item ${w.ordinal}: title-page and contents witnesses are both preserved and distinct`, w.titlePageWitness !== w.contentsWitness);
}

// ── ITEM 37 NUMBERING ANOMALY ────────────────────────────────────────────────────────────────────
{
  const it37 = pub.items.find((i) => i.ordinal === 37);
  eq("item 37 keeps stable ordinal 37", it37.ordinal, 37);
  eq("item 37 preserves printed number 36", it37.printedOrdinal, 36);
  eq("provenance records the item-37 anomaly", prov.itemNumberingAnomalies.map((a) => [a.ordinal, a.printedNumber]), [[37, 36]]);
  // Items 38–58 are not shifted: each ordinal maps to its own slug/scan, unchanged.
  eq("item 38 still begins where the roster says", pub.items.find((i) => i.ordinal === 38).physicalScans[0].first, 186);
}

// ── ARCHITECTURE GUARDS ──────────────────────────────────────────────────────────────────────────
check("POETRY_WITNESS_RELATIONS remains empty", /POETRY_WITNESS_RELATIONS: PoetryWitnessRelation\[\] = \[\];/.test(poemsTs));
check("no P3 publication is vendored", !fs.existsSync(path.join(process.cwd(), "public/data/poems/kalaignarin-kavithaigal")));
check("no P3 declaration exists", !fs.existsSync(path.join(process.cwd(), "scripts/publication-declarations/kalaignarin-kavithaigal.mjs")));
check("no P3 slug in the registry", !(arrayLiteral(poemsTs, "POETRY_PUBLICATION_SLUGS") ?? []).includes("kalaignarin-kavithaigal"));
{
  const m = /export const LIBRARY_COLLECTIONS:[^=]*=\s*\[([\s\S]*?)\n\];/.exec(collectionsTs);
  eq("exactly one LibraryCollection is defined", (m?.[1].match(/^ {2}\{$/gm) ?? []).length, 1);
}

// ── ROUTES ───────────────────────────────────────────────────────────────────────────────────────
{
  check("the publication item route exists", fs.existsSync(path.join(process.cwd(), "app/poems/[slug]/[item]/page.tsx")));
  const itemRoute = readText(path.join(process.cwd(), "app/poems/[slug]/[item]/page.tsx"));
  check("the item route fails closed on unknown children", /export const dynamicParams = false/.test(itemRoute));
  check("the item route is driven by the frozen roster", /POETRY_PUBLICATION_SLUGS/.test(itemRoute) && /pub\?\.items/.test(itemRoute));
  // Built sitemap: exactly 60 new routes for this publication, all resolving to a prerendered page.
  const body = path.join(process.cwd(), ".next/server/app/sitemap.xml.body");
  if (fs.existsSync(body)) {
    const urls = [...readText(body).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const mine = urls.filter((u) => u.includes(`/poems/${SLUG}`));
    eq("sitemap carries exactly 60 routes for the publication", mine.length, 60);
    eq("those routes are unique", new Set(mine).size, mine.length);
    check(`sitemap carries the landing`, mine.includes(`https://nenjukkuneethi.org/poems/${SLUG}`));
    check(`sitemap carries the source page`, mine.includes(`https://nenjukkuneethi.org/poems/${SLUG}/source`));
    for (const it of pub.items) {
      const url = `https://nenjukkuneethi.org/poems/${SLUG}/${it.slug}`;
      check(`sitemap carries item ${it.ordinal}`, mine.includes(url));
    }
    // Every one resolves to a prerendered page on disk.
    check("landing page is prerendered", fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", `${SLUG}.html`)));
    check("source page is prerendered", fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", SLUG, "source.html")));
    for (const it of pub.items) check(`item ${it.ordinal} page is prerendered`, fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", SLUG, `${it.slug}.html`)));
    eq("no duplicate sitemap URL anywhere", urls.length - new Set(urls).size, 0);
  } else {
    console.log("  (note: no build output — the 60-route/prerender checks were skipped; run `npm run build`)");
  }
}

// ── ENGLISH TITLE / PUBLICATION EVIDENCE ─────────────────────────────────────────────────────────
{
  const asm = readText(path.join(WORK, "translations/en", `${SLUG}-en.md`));
  const h1 = /^#\s+(.*\S)\s*$/m.exec(asm)[1];
  eq("publication English title is the release-cleared assembly H1", pub.title.en, h1);
  eq("publication year 2006 (source-established)", pub.publicationYear, 2006);
  check("edition statement is present", typeof pub.editionStatement === "string" && pub.editionStatement.length > 0);
}

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
console.log(`\nwave4-p2-kaalap-pezhai — ${pass} assertions passed, ${failures.length} failed`);
console.log(`  publication.json sha256: ${sha256(readText(path.join(DATA, "publication.json")))}`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
