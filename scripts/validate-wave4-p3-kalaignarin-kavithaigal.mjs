// Wave 4 P3 — கலைஞரின் கவிதைகள் publication validator.
//
// Validates the integrated 77-item anthology against the pinned source by a DIFFERENT route from the
// importer: Tamil is re-read from sections/ with its own line state machine, English is reconstructed
// from the reader-facing COMBINED ASSEMBLY (the importer builds English from the per-item files and
// only proves them equal to the assembly, so reading the assembly here is an independent artifact),
// and page records are re-parsed independently. Every check proves presence → structure → equality;
// `empty == empty` never certifies.
//
// Usage: node scripts/validate-wave4-p3-kalaignarin-kavithaigal.mjs <kalaignar-poems-clone>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-wave4-p3-kalaignarin-kavithaigal.mjs <kalaignar-poems-clone>");
  process.exit(1);
}
const readText = (p) => fs.readFileSync(p, "utf8");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const git = (...a) => execFileSync("git", ["-C", SRC_REPO, ...a], { encoding: "utf8" }).trim();

let pass = 0;
const failures = [];
const check = (label, cond) => (cond ? pass++ : failures.push(label));
const eq = (label, a, b) =>
  JSON.stringify(a) === JSON.stringify(b) ? pass++ : failures.push(`${label}\n     expected ${JSON.stringify(b)}\n     actual   ${JSON.stringify(a)}`);

const SLUG = "kalaignarin-kavithaigal";
const FREEZE = "969823195ea8943a67fad4286ab1bc7f1c876d56";
const WORK_TREE = "6489ab3d4fdf21a1442aa46d7a7aa1a08071be7e";
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
const fm = (t) => /^---\n([\s\S]*?)\n---/.exec(t)?.[1] ?? "";
const fmGet = (block, k) => {
  const v = new RegExp(`^${k}:\\s*(.*)$`, "m").exec(block)?.[1]?.trim() ?? null;
  if (v && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\(["\\])/g, "$1");
  return v;
};
function parseRunsV(spec) {
  const out = [];
  for (const part of String(spec).split(",")) {
    const t = part.trim();
    if (!t) continue;
    const m = /^(\d+)\s*[–-]\s*(\d+)$/.exec(t) || /^(\d+)$/.exec(t);
    if (!m) throw new Error(`unparseable run ${JSON.stringify(part)}`);
    out.push({ first: Number(m[1]), last: m[2] !== undefined ? Number(m[2]) : Number(m[1]) });
  }
  return out;
}
const runsToScans = (runs) => runs.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i));

// ── SOURCE FREEZE ────────────────────────────────────────────────────────────────────────────────
check("source clone HEAD is the Wave-4 freeze", git("rev-parse", "HEAD") === FREEZE);
eq("payload records the Wave-4 freeze commit", pub.sourceCommit, FREEZE);
eq("payload records the frozen P3 work tree", pub.sourceTree, WORK_TREE);
eq("the frozen work tree is what the freeze carries", git("rev-parse", `${FREEZE}:poems/${SLUG}`), WORK_TREE);
{
  const meta = readText(path.join(WORK, "metadata/source.md"));
  check("scan filename recorded verbatim upstream", meta.includes(prov.source.scanFilename));
  check("scan SHA-256 recorded verbatim upstream", meta.includes(prov.source.scanSha256));
  check("scan byte size recorded verbatim upstream", meta.includes(prov.source.scanFileSizeBytes.toLocaleString("en-US")));
  eq("465 physical scans", prov.source.scanTotalPages, 465);
  check("source PDF not vendored", prov.source.sourcePdfCommitted === false && !fs.existsSync(path.join(DATA, prov.source.scanFilename)));
}

// ── PUBLICATION IDENTITY ─────────────────────────────────────────────────────────────────────────
eq("POETRY_PUBLICATION_SLUGS holds both publications", arrayLiteral(poemsTs, "POETRY_PUBLICATION_SLUGS"), ["kaalap-pezhaiyum-kavithai-saaviyum", SLUG]);
eq("payload slug", pub.slug, SLUG);
eq("readerStructure is poetry-publication", pub.readerStructure, "poetry-publication");
eq("itemCount is 77", pub.itemCount, 77);
eq("items.length is 77", pub.items.length, 77);
eq("exactly one catalogue entry", (libraryTs.match(new RegExp(`\\n    id: "${SLUG}",`, "g")) ?? []).length, 1);
{
  const start = libraryTs.indexOf(`id: "${SLUG}"`);
  const block = libraryTs.slice(start, libraryTs.indexOf(`provenanceHref: "/poems/${SLUG}/source"`, start));
  check("catalogue declares unitCount 77", /unitCount:\s*\{\s*value:\s*77/.test(block));
  check("catalogue assigns no memberCount field", !/memberCount\s*:/.test(block));
  check("catalogue is a poetry-publication", block.includes('readerStructure: "poetry-publication"'));
}
// Poetry top-level count is 6; collections still 1.
{
  eq("six top-level Poetry works", (libraryTs.match(/\n    shelf: "poetry",/g) ?? []).length, 6);
  const m = /export const LIBRARY_COLLECTIONS:[^=]*=\s*\[([\s\S]*?)\n\];/.exec(collectionsTs);
  eq("exactly one LibraryCollection is defined", (m?.[1].match(/^ {2}\{$/gm) ?? []).length, 1);
}
for (const it of pub.items) check(`item ${it.ordinal} is not a top-level LibraryWork`, !libraryTs.includes(`id: "${it.slug}"`));

// ── ITEM ROSTER + SLUGS ──────────────────────────────────────────────────────────────────────────
eq("ordinals are exactly 1..77 in order", pub.items.map((i) => i.ordinal), Array.from({ length: 77 }, (_, i) => i + 1));
const fileSlug = {};
for (const f of fs.readdirSync(path.join(WORK, "translations/en/items"))) {
  const m = /^(\d+)-(.*)-en\.md$/.exec(f);
  if (m) fileSlug[Number(m[1])] = m[2];
}
eq("77 English item files provide 77 slugs", Object.keys(fileSlug).length, 77);
for (const it of pub.items) {
  eq(`item ${it.ordinal}: slug matches its released English filename`, it.slug, fileSlug[it.ordinal]);
  check(`item ${it.ordinal}: slug is well formed`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.slug));
  check(`item ${it.ordinal}: slug is not reserved`, !["source", "items"].includes(it.slug));
  check(`item ${it.ordinal}: slug is not the bare ordinal`, it.slug !== String(it.ordinal) && it.slug !== String(it.ordinal).padStart(2, "0"));
}
eq("all 77 slugs are unique", new Set(pub.items.map((i) => i.slug)).size, 77);

// ── INDEPENDENT TAMIL RECONSTRUCTION ─────────────────────────────────────────────────────────────
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
    const h = /^(#{1,6})\s+(.*\S)\s*$/.exec(t);
    if (h) {
      if (!sawTitle && h[1] === "#") { sawTitle = true; continue; }
      toks.push(`H:${h[2]}`); continue;
    }
    if (t === "") { toks.push("BLANK"); continue; }
    toks.push(`L:${line.replace(/\s+$/, "")}`);
  }
  return collapse(toks);
}
// English from the combined assembly: slice per `## Item N`, bound on next `## `, drop divider scan
// markers not belonging to the item.
const asm = readText(path.join(WORK, "translations/en", `${SLUG}-en.md`)).split("\n");
function reconstructEnglish(ord, validScans) {
  let cur = false;
  const toks = [];
  let started = false;
  for (const line of asm) {
    if (new RegExp(`^##\\s+Item\\s+${ord}\\s+—`).test(line)) { cur = true; started = true; continue; }
    if (cur && /^##\s/.test(line)) break;
    if (!cur) continue;
    const t = line.trim();
    const m = /^<!--\s*scan\s+(\d+)\s*-->$/.exec(t);
    if (m) {
      if (!validScans.has(Number(m[1]))) break;
      toks.push(`SCAN:${Number(m[1])}`); continue;
    }
    if (/^<!--/.test(t)) continue;
    const h = /^(#{1,6})\s+(.*\S)\s*$/.exec(t);
    if (h) { toks.push(`H:${h[2]}`); continue; }
    if (t === "") { toks.push("BLANK"); continue; }
    toks.push(`L:${line.replace(/\s+$/, "")}`);
  }
  return started ? collapse(toks) : null;
}
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
    } else if (e.kind === "stanza-break") toks.push("BLANK");
    else if (e.kind === "page-transition") { toks.push(`SCAN:${e.toScan}`); lastScan = e.toScan; }
  }
  return collapse(toks);
}

let taLinesTotal = 0;
let enLinesTotal = 0;
const allScans = new Set();
let pageRecordsRead = 0;
const sectionOwner = new Map();
for (const it of pub.items) {
  const scans = it.physicalScans.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i));
  const scanSet = new Set(scans);

  const ta = streamFromLayer(it.tamil);
  const taSrc = reconstructTamil(it.ordinal);
  const taLineCount = it.tamil.elements.filter((e) => e.kind === "line").length;
  taLinesTotal += taLineCount;
  check(`item ${it.ordinal}: Tamil is non-trivial (${taLineCount} lines)`, taLineCount > 1);
  eq(`item ${it.ordinal}: Tamil payload equals the independently parsed section`, ta, taSrc);

  const en = streamFromLayer(it.english);
  const enSrc = reconstructEnglish(it.ordinal, scanSet);
  const enLineCount = it.english.elements.filter((e) => e.kind === "line").length;
  enLinesTotal += enLineCount;
  check(`item ${it.ordinal}: English is non-trivial (${enLineCount} lines)`, enLineCount > 1);
  eq(`item ${it.ordinal}: English payload equals the independently reconstructed assembly`, en, enSrc);

  // A declared physical scan can be a blank verso/divider that carries a scan marker (hence a page
  // transition) but no verse line — e.g. item 1's scan 19. Coverage is the line scans PLUS the page-
  // transition endpoints, which together must be exactly the declared physical scans.
  const covered = new Set();
  for (const e of it.tamil.elements) {
    if (e.kind === "line" || e.kind === "source-heading") covered.add(e.sourceScan);
    else if (e.kind === "page-transition") { covered.add(e.fromScan); covered.add(e.toScan); }
  }
  eq(`item ${it.ordinal}: Tamil scan coverage equals declared physical scans`, [...covered].sort((a, b) => a - b), scans);
  for (const sc of scans) {
    check(`item ${it.ordinal}: scan ${sc} is claimed by no other item`, !allScans.has(sc));
    allScans.add(sc);
  }

  // Page records — independent parse. Section identity is the item's CANONICAL TITLE (canonical-title
  // mode), shared by all its scans and unique across items. Visible printed_page copied exactly.
  const sectionOf = new Set();
  for (const sc of scans) {
    const rel = `pages/${String(sc).padStart(4, "0")}.md`;
    const abs = path.join(WORK, rel);
    check(`item ${it.ordinal}: page record exists for scan ${sc}`, fs.existsSync(abs));
    if (!fs.existsSync(abs)) continue;
    pageRecordsRead++;
    const b = fm(readText(abs));
    eq(`item ${it.ordinal}: page record scan ${sc} identity`, [Number(fmGet(b, "scan_page")), fmGet(b, "work"), fmGet(b, "status")], [sc, SLUG, "verified"]);
    const secId = fmGet(b, "section");
    check(`item ${it.ordinal}: page record scan ${sc} carries a non-empty section`, typeof secId === "string" && secId.length > 0);
    sectionOf.add(secId);
    const rawPP = fmGet(b, "printed_page");
    const visible = rawPP === "null" ? null : /^\d+$/.test(rawPP ?? "") ? Number(rawPP) : undefined;
    check(`item ${it.ordinal}: scan ${sc} printed_page parses`, visible === null || typeof visible === "number");
    for (const e of [...it.tamil.elements, ...it.english.elements]) {
      if ((e.kind === "line" || e.kind === "source-heading") && e.sourceScan === sc) {
        eq(`item ${it.ordinal}: scan ${sc} line visible printedPage equals the page record`, e.printedPage, visible);
      }
    }
  }
  eq(`item ${it.ordinal}: all scans share ONE section (its canonical title)`, sectionOf.size, 1);
  const secId = [...sectionOf][0];
  eq(`item ${it.ordinal}: section id is the item's canonical Tamil title`, secId, it.titleTa);
  check(`item ${it.ordinal}: section id is used by no earlier item`, !sectionOwner.has(secId));
  sectionOwner.set(secId, it.ordinal);

  // Reconciled logical pages == the source section's printed_pages run list, EXACTLY (run-by-run);
  // physicalScans == the source physical_scans run list, EXACTLY. No constant offset is assumed.
  const secFm = fm(readText(path.join(WORK, `sections/${String(it.ordinal).padStart(2, "0")}.md`)));
  eq(`item ${it.ordinal}: physicalScans equals the source physical_scans run list`, it.physicalScans, parseRunsV(fmGet(secFm, "physical_scans")));
  eq(`item ${it.ordinal}: logicalPrintedPages equals the source printed_pages run list`, it.logicalPrintedPages, parseRunsV(fmGet(secFm, "printed_pages")));
  check(`item ${it.ordinal}: no ambiguous printedPages field`, !("printedPages" in it));
  // Visible numerals fall within the item's logical range (independent source-layer cross-check).
  const inLog = (pp) => it.logicalPrintedPages.some((r) => pp >= r.first && pp <= r.last);
  for (const e of it.tamil.elements) if (e.kind === "line" && e.printedPage != null) check(`item ${it.ordinal}: visible page ${e.printedPage} within logical range`, inLog(e.printedPage));
}
eq("numbered-item scans total 439", allScans.size, 439);
check("Tamil total is substantial", taLinesTotal > 5000);
check("English total is substantial", enLinesTotal > 5000);
eq("a verified page record was read for every one of the 439 item scans", pageRecordsRead, 439);
eq("no two items share a canonical-title section id", sectionOwner.size, 77);

// ── NON-CONTIGUOUS REGRESSION (items 23, 24) ─────────────────────────────────────────────────────
{
  const it23 = pub.items.find((i) => i.ordinal === 23);
  const it24 = pub.items.find((i) => i.ordinal === 24);
  eq("item 23 physical scans are the two runs 230–236, 238", it23.physicalScans, [{ first: 230, last: 236 }, { first: 238, last: 238 }]);
  eq("item 23 logical pages are the two runs 213–219, 221", it23.logicalPrintedPages, [{ first: 213, last: 219 }, { first: 221, last: 221 }]);
  eq("item 24 physical scans are the two runs 237, 239–244", it24.physicalScans, [{ first: 237, last: 237 }, { first: 239, last: 244 }]);
  eq("item 24 logical pages are the two runs 220, 222–227", it24.logicalPrintedPages, [{ first: 220, last: 220 }, { first: 222, last: 227 }]);
  // Not flattened: the gap scan/page belongs to the OTHER item, never both.
  check("item 23 does not claim scan 237 (item 24's)", !runsToScans(it23.physicalScans).includes(237));
  check("item 24 does not claim scan 238 (item 23's)", !runsToScans(it24.physicalScans).includes(238));
  check("item 23 does not claim page 220 (item 24's)", !it23.logicalPrintedPages.some((r) => 220 >= r.first && 220 <= r.last));
  check("item 24 does not claim page 221 (item 23's)", !it24.logicalPrintedPages.some((r) => 221 >= r.first && 221 <= r.last));
}

// ── GROUPS / DIVIDERS — independently source-verified ────────────────────────────────────────────
// The Tamil/structural group facts are re-parsed here from the authoritative source group table by a
// DIFFERENT implementation than the engine's, and the English group titles from the released
// assembly — two independent source witnesses.
{
  check("the publication carries 5 groups", Array.isArray(pub.groups) && pub.groups.length === 5);
  const flat = pub.groups.flatMap((g) => g.itemOrdinals);
  eq("groups partition items 1..77 in order", flat, Array.from({ length: 77 }, (_, i) => i + 1));
  eq("no item belongs to two groups", new Set(flat).size, flat.length);
  eq("total grouped items equals itemCount (no divider counted as an item)", flat.length, pub.itemCount);
  eq("provenance records the 5 groups", prov.groups?.length, 5);

  // Independent parse of the `## Anthology group structure` table.
  const map = readText(path.join(WORK, "indexes/canonical-source-map.md"));
  const secStart = map.indexOf("## Anthology group structure");
  const secEnd = map.indexOf("\n## ", secStart + 1);
  const section = map.slice(secStart, secEnd < 0 ? map.length : secEnd);
  const srcRows = new Map();
  for (const line of section.split("\n")) {
    const m = /^\|\s*(\d+)\s*\|(.+)\|\s*$/.exec(line);
    if (!m) continue;
    const cells = m[2].split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const unq = (c) => c.replace(/^`|`$/g, "");
    const rangeCell = cells[2].replace(/`/g, "").trim();
    const rr = /^(\d+)\s*[–-]\s*(\d+)$/.exec(rangeCell) || /^(\d+)$/.exec(rangeCell);
    const scanCell = cells[3];
    const structural = [];
    const sm = /(\d+)\s*[–-]\s*(\d+)/.exec(scanCell);
    if (sm && !/item 01|within item/i.test(scanCell)) for (let n = Number(sm[1]); n <= Number(sm[2]); n++) structural.push(n);
    const shares = /item 01|within item/i.test(scanCell);
    const range = sm ? Array.from({ length: Number(sm[2]) - Number(sm[1]) + 1 }, (_, i) => Number(sm[1]) + i) : [];
    srcRows.set(Number(m[1]), { contents: unq(cells[0]), canonical: unq(cells[1]), itemFirst: Number(rr[1]), itemLast: rr[2] !== undefined ? Number(rr[2]) : Number(rr[1]), structural: shares ? [] : structural, sharesItem01: shares, sharedScans: shares ? range : [], sharedItemOrdinal: shares ? Number(rr[1]) : null });
  }
  eq("source group table has exactly 5 rows", srcRows.size, 5);

  const asmGroups = new Map();
  for (const line of asm) {
    const g = /^##\s+(.*\S)\s+—\s+(.*\S)\s*$/.exec(line);
    if (g && !/^Item\s+\d+$/.test(g[1]) && g[2] !== "English Translation") asmGroups.set(g[1], g[2]);
  }

  const itemScans = new Set(pub.items.flatMap((it) => it.physicalScans.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i))));
  const allStructural = [];
  for (const g of pub.groups) {
    const row = srcRows.get(g.ordinal);
    check(`group ${g.ordinal}: present in the source table`, !!row);
    if (!row) continue;
    eq(`group ${g.ordinal}: canonical title equals the source authority`, g.titleTa, row.canonical);
    eq(`group ${g.ordinal}: contents witness equals the source table`, g.contentsTitleTa ?? g.titleTa, row.contents);
    eq(`group ${g.ordinal}: item range equals the source table`, [g.itemOrdinals[0], g.itemOrdinals.at(-1)], [row.itemFirst, row.itemLast]);
    if (g.titleEn) eq(`group ${g.ordinal}: English title matches the assembly divider`, g.titleEn, asmGroups.get(g.titleTa));
    for (const sc of row.structural) {
      check(`group ${g.ordinal}: structural scan ${sc} is excluded from every item's scans`, !itemScans.has(sc));
      allStructural.push(sc);
    }
  }
  // The 8 pure structural scans, and group-specific witness facts.
  const uniqStructural = [...new Set(allStructural)].sort((a, b) => a - b);
  eq("exactly 8 pure structural divider scans", uniqStructural.length, 8);
  eq("the 8 structural scans are 32,33,70,71,372,373,392,393", uniqStructural, [32, 33, 70, 71, 372, 373, 392, 393]);
  for (const sc of uniqStructural) check(`structural scan ${sc} is not in the 439 item scans`, !itemScans.has(sc));
  eq("group 4 retains a distinct contents witness (கண்ணீர்க் கவிதை / கண்ணீர்த் துளிகள்)", [srcRows.get(4).contents, srcRows.get(4).canonical], ["கண்ணீர்க் கவிதை", "கண்ணீர்த் துளிகள்"]);
  check("group 4 payload keeps both witnesses", pub.groups.find((g) => g.ordinal === 4)?.contentsTitleTa === "கண்ணீர்க் கவிதை" && pub.groups.find((g) => g.ordinal === 4)?.titleTa === "கண்ணீர்த் துளிகள்");
  // BLOCKER 2: the source names group 1's EXACT shared run 18–19, inside item 01, not structural.
  {
    const g1 = srcRows.get(1);
    check("group 1 source row states item-01 sharing", g1.sharesItem01);
    eq("group 1 shared scans are exactly [18, 19]", g1.sharedScans, [18, 19]);
    eq("group 1 shares item ordinal 1", g1.sharedItemOrdinal, 1);
    const it01Scans = new Set(pub.items[0].physicalScans.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i)));
    check("both shared scans 18 and 19 are inside item 01's own physical scans", it01Scans.has(18) && it01Scans.has(19));
    check("group 1's shared scans are NOT among the 8 pure structural scans", !uniqStructural.includes(18) && !uniqStructural.includes(19));
    check("group 1 contributes no pure structural scans", g1.structural.length === 0);
  }
}

// ── TITLE-WITNESS ACCOUNTING (Gate 3, independently verified) ─────────────────────────────────────
{
  // Independent parse of the frozen Gate-3 evidence.
  const g3 = readText(path.join(WORK, "PHASE3_TITLE_WITNESS_RECONCILIATION.md"));
  const num = (label) => Number(new RegExp(`${label}[^\\d]*\\*\\*(\\d+)\\*\\*`).exec(g3)?.[1]);
  const total = Number(/title\/group witnesses inventoried[^*]*\*\*(\d+)\*\*/.exec(g3)?.[1]);
  const exact = Number(/exact title-string matches[^*]*\*\*(\d+)\*\*/.exec(g3)?.[1]);
  const variants = Number(/source-valid variant relationships[^*]*\*\*(\d+)\*\*/.exec(g3)?.[1]);
  const unresolved = /unresolved title witness:\s*\*\*none\*\*/i.test(g3) ? 0 : -1;
  void num;
  eq("source Gate-3 total witnesses is 81", total, 81);
  eq("source Gate-3 exact matches is 51", exact, 51);
  eq("source Gate-3 source-valid variants is 30", variants, 30);
  eq("source Gate-3 unresolved is 0", unresolved, 0);
  eq("total = exact + variants", total, exact + variants);

  // Independent count of the variant-inventory rows (must be 30), and the group-only row (group 4).
  const vsec = g3.slice(g3.indexOf("## Variant inventory"));
  const vend = vsec.indexOf("\n## ", 1);
  const vrows = (vend < 0 ? vsec : vsec.slice(0, vend)).split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l));
  eq("Gate-3 variant inventory has exactly 30 rows", vrows.length, 30);
  // Row 1 is the group-1/item-01 relationship (one row, both divider-18 and opening-20) — counted once.
  check("group 1's variant is a single Gate-3 row spanning divider and opening (not two)", /divider scan 18 and opening scan 20/.test(vrows[0]));

  // Payload accounting: overall totals present and consistent; 29 item variants + 1 group-only = 30.
  const tw = prov.titleWitnesses;
  eq("provenance overall totals equal the source", tw.overall, { total: 81, exact: 51, variants: 30, unresolved: 0 });
  eq("provenance records 29 item title variants", tw.count, 29);
  eq("provenance records exactly 1 group-only variant", tw.groupVariants?.count, 1);
  eq("the group-only variant is group 4 (கண்ணீர்க் கவிதை / கண்ணீர்த் துளிகள்)", tw.groupVariants?.groups, [{ ordinal: 4, canonicalWitness: "கண்ணீர்த் துளிகள்", contentsWitness: "கண்ணீர்க் கவிதை" }]);
  eq("29 item variants + 1 group-only variant = 30", tw.count + (tw.groupVariants?.count ?? 0), 30);
  // Group 1 is NOT double-counted as a group-only variant: its pair equals item 01's.
  check("group 1 is not a group-only variant (item 01 already carries it)", !(tw.groupVariants?.groups ?? []).some((g) => g.ordinal === 1));
  const it01 = pub.items.find((i) => i.ordinal === 1);
  check("item 01 carries the group-1 variant pair", it01.contentsTitleTa === "இதயத்தைத் தந்திடு அண்ணா!" && it01.titleTa === "இதயத்தைத் தந்திடு அண்ணா");
}

// ── WITNESS RELATIONS (exactly two) ──────────────────────────────────────────────────────────────
{
  const relBlock = /export const POETRY_WITNESS_RELATIONS: PoetryWitnessRelation\[\] = \[([\s\S]*?)\n\];/.exec(poemsTs);
  check("POETRY_WITNESS_RELATIONS is declared", !!relBlock);
  const count = (relBlock?.[1].match(/relation: "same-canonical-poem-alternate-witness"/g) ?? []).length;
  eq("exactly two witness relations are declared", count, 2);
  // Stable, unique, declaration-authored ids (never index-based, never title-derived).
  const ids = [...(relBlock?.[1].matchAll(/id:\s*"([^"]+)"/g) ?? [])].map((m) => m[1]);
  eq("exactly two relation ids are declared", ids.length, 2);
  eq("the two relation ids are unique", new Set(ids).size, 2);
  eq("relation id A is the expected stable id", ids.includes("idhayathai-thanthidu-anna--kalaignarin-kavithaigal--item-01"), true);
  eq("relation id B is the expected stable id", ids.includes("thennan-kathai--kalaignarin-kavithaigal--item-02"), true);
  for (const id of ids) check(`relation id ${JSON.stringify(id)} is non-empty and semantic`, id.length > 0 && !/^\d+$/.test(id));
  // Relation A: idhayathai ↔ item 01; Relation B: thennan ↔ item 02.
  const body = relBlock?.[1] ?? "";
  check("relation A links idhayathai to item give-me-your-heart-anna", /slug: "idhayathai-thanthidu-anna"/.test(body) && /itemSlug: "give-me-your-heart-anna"/.test(body));
  check("relation B links thennan to item the-tale-of-the-southerner", /slug: "thennan-kathai"/.test(body) && /itemSlug: "the-tale-of-the-southerner"/.test(body));
  check("no relation targets Kaalap Pezhai", !body.includes("kaalap-pezhaiyum-kavithai-saaviyum"));
  // The counterpart items exist in this payload.
  check("item 01 give-me-your-heart-anna exists", pub.items.some((i) => i.ordinal === 1 && i.slug === "give-me-your-heart-anna"));
  check("item 02 the-tale-of-the-southerner exists", pub.items.some((i) => i.ordinal === 2 && i.slug === "the-tale-of-the-southerner"));
  // No title-only auto-dedup: the two witnesses have DIFFERENT English titles.
  const it01 = pub.items.find((i) => i.ordinal === 1);
  check("item 01 English title differs from the standalone's (not deduplicated)", it01.titleEn === "Give Me Your Heart, Anna");
  // The public note claims no identity/supersession.
  check("the public note claims no textual identity", /Another source witness/.test(body) && !/identical|supersed|corrected|original version/i.test(body));
}

// ── THENNAN WITNESS ISOLATION ────────────────────────────────────────────────────────────────────
{
  const it02 = pub.items.find((i) => i.ordinal === 2);
  check("P3 item 02 carries NO editorial exception (it is not the standalone witness)", !("editorialExceptions" in it02));
  const standalone = JSON.parse(readText(path.join(process.cwd(), "public/data/poems/thennan-kathai/poem.json")));
  check("the standalone Thennan retains its editorial exception", Array.isArray(standalone.editorialExceptions) && standalone.editorialExceptions.length === 1);
  eq("the standalone's omitted term is still not reproduced", standalone.editorialExceptions[0].omittedTermReproduced, false);
  // The anthology item follows its own source witness (Tamil equals its own section, already proved
  // above); it is not forced to byte-equal the standalone.
  const standaloneLines = standalone.tamil.elements.filter((e) => e.kind === "line").map((e) => e.text).join("\n");
  const anthologyLines = it02.tamil.elements.filter((e) => e.kind === "line").map((e) => e.text).join("\n");
  check("the two witnesses are not forced byte-identical", standaloneLines !== anthologyLines);
}

// ── P1 REGRESSION (idhayathai byte-identity) ─────────────────────────────────────────────────────
{
  const root = path.join(process.cwd(), "public/data/poems/idhayathai-thanthidu-anna");
  eq("idhayathai poem.json is byte-identical", sha256(readText(path.join(root, "poem.json"))), "6833738340243833b712479e017f25294bb0e45b701d66d060a77f634c3e64f7");
  eq("idhayathai provenance.json is byte-identical", sha256(readText(path.join(root, "provenance.json"))), "d06a664052178762372d42727c95620a3c3a88159f85b56e43a095e8a401e930");
}

// ── ROUTES ───────────────────────────────────────────────────────────────────────────────────────
{
  const itemRoute = readText(path.join(process.cwd(), "app/poems/[slug]/[item]/page.tsx"));
  check("the item route fails closed on unknown children", /export const dynamicParams = false/.test(itemRoute));
  const body = path.join(process.cwd(), ".next/server/app/sitemap.xml.body");
  if (fs.existsSync(body)) {
    const urls = [...readText(body).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const mine = urls.filter((u) => u.includes(`/poems/${SLUG}`));
    eq("sitemap carries exactly 79 routes for the publication", mine.length, 79);
    eq("those routes are unique", new Set(mine).size, mine.length);
    check("sitemap carries the landing", mine.includes(`https://nenjukkuneethi.org/poems/${SLUG}`));
    check("sitemap carries the source page", mine.includes(`https://nenjukkuneethi.org/poems/${SLUG}/source`));
    for (const it of pub.items) check(`sitemap carries item ${it.ordinal}`, mine.includes(`https://nenjukkuneethi.org/poems/${SLUG}/${it.slug}`));
    check("landing page is prerendered", fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", `${SLUG}.html`)));
    check("source page is prerendered", fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", SLUG, "source.html")));
    for (const it of pub.items) check(`item ${it.ordinal} page is prerendered`, fs.existsSync(path.join(process.cwd(), ".next/server/app/poems", SLUG, `${it.slug}.html`)));
    eq("no duplicate sitemap URL anywhere", urls.length - new Set(urls).size, 0);
  } else {
    console.log("  (note: no build output — the 79-route/prerender checks were skipped; run `npm run build`)");
  }
}

// ── ENGLISH TITLE / PUBLICATION EVIDENCE ─────────────────────────────────────────────────────────
{
  const h1 = /^#\s+(.*\S)\s*$/m.exec(readText(path.join(WORK, "translations/en", `${SLUG}-en.md`)))[1];
  eq("publication English title is the release-cleared assembly H1", pub.title.en, h1);
  eq("publication year 1995", pub.publicationYear, 1995);
  check("edition statement present", typeof pub.editionStatement === "string" && pub.editionStatement.length > 0);
}

console.log(`\nwave4-p3-kalaignarin-kavithaigal — ${pass} assertions passed, ${failures.length} failed`);
console.log(`  publication.json sha256: ${sha256(readText(path.join(DATA, "publication.json")))}`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures.slice(0, 40)) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
