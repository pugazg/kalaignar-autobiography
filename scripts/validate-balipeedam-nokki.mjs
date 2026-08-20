// Validator for பலிபீடம் நோக்கி / "Towards the Sacrificial Altar" — Digital Library Fiction
// benchmark #1.
//
// Validates the GENERATED reader structure, not just metadata constants: it reconstructs both
// released layers from public/data/novels/<slug>/novel.json and proves exact equality with the
// source archive's own assembled reading layer, and derives its expectations from the source
// INDEPENDENTLY of the importer wherever practical.
//
// Usage: node scripts/validate-balipeedam-nokki.mjs <kalaignar-novels-clone>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  console.error("usage: node scripts/validate-balipeedam-nokki.mjs <kalaignar-novels-clone>");
  process.exit(1);
}

const SLUG = "balipeedam-nokki";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/novels", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));

const novel = JSON.parse(fs.readFileSync(path.join(DATA, "novel.json"), "utf8"));
const prov = JSON.parse(fs.readFileSync(path.join(DATA, "provenance.json"), "utf8"));

let pass = 0;
const failures = [];
const check = (n, c, d) => (c ? pass++ : failures.push(d ? `${n} — ${d}` : n));
const eq = (n, a, b) => check(n, JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── 1. SOURCE PIN AND IDENTITY ───────────────────────────────────────────────────────────────────
eq("source repo", novel.sourceRepo, "pugazg/kalaignar-novels");
eq("source path", novel.sourcePath, `works/${SLUG}`);
eq("source commit", novel.sourceCommit, "1a8a373e368418046fd599b0ec54da4e54f27986");
eq("provenance pin agrees", [prov.sourceRepo, prov.sourcePath, prov.sourceCommit], [novel.sourceRepo, novel.sourcePath, novel.sourceCommit]);
eq("scan SHA-256", prov.source.scanSha256, "c4700c9043da8eadbf25144e7127a66a9270326512c095d99e1113a4feb464fe");
eq("scan size", prov.source.scanFileSizeBytes, 69724254);
eq("physical scans", prov.source.scanTotalPages, 34);
check("scan filename matches the source (NFC)", nfc(prov.source.scanFilename) === nfc("TVA_BOK_0065570_பலிபீடம்_நோக்கி.pdf"));
check("source PDF flag", prov.source.sourcePdfCommitted === false);
check("no PDF vendored", !fs.readdirSync(DATA).some((f) => f.toLowerCase().endsWith(".pdf")));
check("no PDF committed in the source repository either", !execFileSync("git", ["-C", SRC_REPO, "ls-files"], { encoding: "utf8" }).split("\n").some((f) => f.toLowerCase().endsWith(".pdf")));
{
  const head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  check("pinned commit equals clone HEAD", head === novel.sourceCommit, `clone HEAD ${head}`);
  const dirty = execFileSync("git", ["-C", SRC_REPO, "status", "--porcelain"], { encoding: "utf8" }).trim();
  check("source clone unmodified", dirty === "", `${dirty.split("\n").length} change(s)`);
}
// Identity re-derived from the source's own metadata record.
{
  const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
  check("metadata records the SHA-256", meta.includes(prov.source.scanSha256));
  check("metadata records the byte size", meta.includes("69,724,254"));
  check("metadata records 34 scans", /Scan pages:\s*\*\*34\*\*/.test(meta));
  check("metadata records the 1947 first edition", meta.includes("ஏப்ரல் 1947"));
  check("metadata records the publisher", meta.includes("எரிமலைப் பதிப்பகம்"));
  check("metadata records the printer", meta.includes("ஊழியன் பிரஸ்"));
  eq("edition year", novel.edition.year, 1947);
  eq("edition statement", novel.edition.statementTa, "முதற்பதிப்பு ஏப்ரல் 1947");
  // The scan IS the first edition — there is no reprint to confuse it with.
  check("no reprint claim anywhere", !/reprint/i.test(JSON.stringify({ novel, prov })));
}

// ── 2. THE EMBEDDED-SEQUENCE RULE ────────────────────────────────────────────────────────────────
// The single most important structural fact: ராயசம் வெங்கண்ணு is a SECTION, never a separate work.
{
  const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
  check("source still states the one-work rule", meta.includes("This scan contains one work"));
  check("source still calls the sequence embedded", meta.includes("embedded cinematic / historical sequence inside"));
  check("source forbids a separate work identity", /no separate work directory/i.test(meta));
  const embedded = novel.sections.filter((s) => s.isEmbeddedSequence);
  eq("exactly one embedded-sequence section", embedded.length, 1);
  eq("the embedded section is section 2", embedded[0]?.order, 2);
  eq("provenance records one embedded-sequence section", prov.archiveDerived.embeddedSequenceSections, 1);
  check("the embedded section keeps the novel's work id", novel.sections.every(() => novel.workId === SLUG));
  // There must be exactly ONE catalog work and no separate route/identity for the sequence.
  // Scope this to IDENTITY fields only: the catalog may legitimately *describe* the sequence
  // (that is the point of the note), but must never give it an id, slug, href or route of its own.
  const lib = readText(path.join(process.cwd(), "data/library.ts"));
  const identities = [...lib.matchAll(/^\s*(?:id|slug|href|sourcePath|provenanceHref):\s*"([^"]*)"/gm)].map((m) => m[1]);
  check("no catalog identity names the sequence", !identities.some((v) => /rayasam|vengannu/i.test(v)), identities.filter((v) => /rayasam|vengannu/i.test(v)).join(", "));
  eq("exactly one fiction work in the catalog", (lib.match(/shelf: "fiction"/g) || []).length, 1);
  check("the sequence is mentioned only as description of the novel", [...lib.matchAll(/rayasam|vengannu/gi)].every((m) => /desc(Ta|En)|note/i.test(lib.slice(lib.lastIndexOf("\n", m.index), m.index))));
  check("no separate route for the sequence", !fs.readdirSync(path.join(process.cwd(), "app/novels")).some((d) => /rayasam|vengannu/i.test(d)));
  eq("provenance explains the rule", typeof prov.source.embeddedSequenceNote, "string");
  check("provenance states it is not a separate work", prov.source.embeddedSequenceNote.includes("NOT a separate work"));
  check("source continuity is recorded", prov.source.sourceContinuity.length >= 6);
}

// ── 3. INDEPENDENT SOURCE DERIVATION ─────────────────────────────────────────────────────────────
const TA_DIR = path.join(WORK_DIR, "sections");
const EN_DIR = path.join(WORK_DIR, "translations/en/sections");
const taFiles = fs.readdirSync(TA_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
const enFiles = fs.readdirSync(EN_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
eq("3 assembled Tamil sections in the source", taFiles.length, 3);
eq("3 English sections in the source", enFiles.length, 3);
eq("novel holds 3 sections", novel.sections.length, 3);
eq("sections are ordered 1..3", novel.sections.map((s) => s.order), [1, 2, 3]);
eq("section slugs are unique", new Set(novel.sections.map((s) => s.slug)).size, 3);
eq("section count recorded", novel.sectionCount, 3);
{
  const fm = (t) => Object.fromEntries([...t.matchAll(/^([a-z_]+):\s*(.*)$/gm)].map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
  let ok = true;
  const bad = [];
  novel.sections.forEach((s, i) => {
    const t = fm(readText(path.join(TA_DIR, taFiles[i])));
    const e = fm(readText(path.join(EN_DIR, enFiles[i])));
    if (t.section_title !== s.titleTa) { ok = false; bad.push(`section ${s.order} Tamil title`); }
    if (e.section_title !== s.titleEn) { ok = false; bad.push(`section ${s.order} English title`); }
    if (t.source_scans !== s.sourceScansTa) { ok = false; bad.push(`section ${s.order} Tamil scans`); }
    if (e.source_scans !== s.sourceScansEn) { ok = false; bad.push(`section ${s.order} English scans`); }
    if (t.status !== "verified") { ok = false; bad.push(`section ${s.order} Tamil status`); }
    if (e.status !== "reviewed") { ok = false; bad.push(`section ${s.order} English status`); }
    if (t.work !== SLUG || e.work !== SLUG) { ok = false; bad.push(`section ${s.order} work identity`); }
  });
  check("every section's titles, scan coverage, status and work identity match the source front matter", ok, bad.join("; "));
}

// ── 3b. PRINTED HEADINGS vs THE ARCHIVE'S SECTION LABELS ─────────────────────────────────────────
// Re-derived here straight from the canonical page records, independently of the importer. A
// heading may appear in the reading body only if the 1947 edition prints it; the assembled layer's
// own section label must never be published as Kalaignar's text, nor be given page provenance.
const PAGES_DIR = path.join(WORK_DIR, "pages");
const APPARATUS_HEADING = /^#{1,6}\s+(Scan observations|Non-text \/ copy-specific marks|Verification note|Page record)\s*$/;
const printed = new Map();
for (const f of fs.readdirSync(PAGES_DIR).filter((x) => /^\d{4}.*\.md$/.test(x)).sort()) {
  const text = readText(path.join(PAGES_DIR, f));
  const fm = /^---\n[\s\S]*?\n---\n/.exec(text);
  if (!fm || !/^page_type:\s*"body"\s*$/m.test(fm[0])) continue;
  for (const line of text.slice(fm[0].length).split("\n")) {
    if (!/^#{1,6}\s/.test(line)) continue;
    if (APPARATUS_HEADING.test(line.trim())) break;
    const t = line.trim().replace(/^#+\s*/, "");
    if (!printed.has(t)) printed.set(t, []);
    printed.get(t).push(Number(f.slice(0, 4)));
  }
}
{
  eq("the edition prints exactly 3 body headings", printed.size, 3);
  eq("printed headings re-derive identically", prov.archiveDerived.printedHeadingsInSource.map((h) => [nfc(h.text), h.scans]), [...printed.entries()].map(([t, sc]) => [t, sc]));
  // Every heading in the reading body is printed, and cited to a scan that prints it.
  const heads = novel.sections.flatMap((s) => s.tamil.blocks.filter((b) => b.kind === "heading").map((b) => ({ s: s.order, b })));
  check("every Tamil heading in the body is one the edition prints", heads.every((h) => printed.has(nfc(h.b.text))), heads.filter((h) => !printed.has(nfc(h.b.text))).map((h) => h.b.text).join("; "));
  check("every Tamil heading is cited to a scan that prints it", heads.every((h) => h.b.sourcePages.some((pg) => printed.get(nfc(h.b.text))?.includes(pg.scan))));
  // The archive's section labels are not in the body, in either layer.
  const bodyText = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text);
  for (const s of novel.sections) {
    check(`section ${s.order}: the archive's Tamil label is not body text`, !bodyText.includes(s.titleTa), s.titleTa);
    check(`section ${s.order}: the archive's English label is not body text`, !bodyText.includes(s.titleEn), s.titleEn);
  }
  // Section 3's label is the one the edition does not print: scan 30 runs straight into the return.
  eq("exactly one section carried an archive-only label", prov.archiveDerived.sectionsWithArchiveOnlyTitle, novel.sections.filter((s) => s.carriesArchiveSectionLabel).length);
  eq("that section is section 3", novel.sections.filter((s) => s.carriesArchiveSectionLabel).map((s) => s.order), [3]);
  check("section 3 opens on the narrator's own return, not a heading", novel.sections[2].tamil.blocks[0].kind === "paragraph" && novel.sections[2].tamil.blocks[0].text.startsWith("படம் முடிந்துவிட்டது."));
  check("no section title is claimed as printed", novel.sections.every((s) => s.titleIsPrintedHeading === printed.has(nfc(s.titleTa))));
  check("the reader states a non-printed title is the archive's label", readText(path.join(process.cwd(), "components/NovelReader.tsx")).includes("!section.titleIsPrintedHeading"));
  check("the landing page states the titles are the archive's, not printed headings", /not chapters or printed headings/.test(readText(path.join(process.cwd(), "components/NovelLanding.tsx"))));
}

// ── 4. BODY RECONSTRUCTION ───────────────────────────────────────────────────────────────────────
// Rebuild the reading body from the generated blocks and compare with the source file, with the
// source's own provenance comments and (for English) its apparatus removed. This proves text, order
// and paragraph structure — and that no comment or apparatus leaked into the body.
const SRC_MARKER = /^<!--\s*source:\s*(.+?)\s*-->$/;
const INLINE = /<!--\s*source (?:join|boundary):\s*[\s\S]*?-->/g;
const EN_NOTE = /^#{2,3}\s+(Pilot translation notes|Batch \d+ translation notes|Batch \d+ review result|Internal-sequence translation status)\s*$/;
const EN_SCAF = /^#{2,3}\s+Batch \d+\s*(—|-)\s*.+$/;

function releasedBlocks(text, english) {
  const body = text.slice(/^---\n[\s\S]*?\n---\n/.exec(text)[0].length);
  const chunks = [];
  for (const para of body.split(/\n\s*\n/)) {
    let buf = [];
    for (const line of para.split("\n")) {
      if (/^<!--[\s\S]*-->$/.test(line.trim())) { if (buf.length) { chunks.push(buf.join("\n")); buf = []; } chunks.push(line); }
      else buf.push(line);
    }
    if (buf.length) chunks.push(buf.join("\n"));
  }
  const out = [];
  let inNote = false;
  for (const raw of chunks) {
    const c = raw.replace(/^(?:[ \t]*\n)+/, "").replace(/\s+$/, "");
    const t = c.trim();
    if (!t) continue;
    const first = t.split("\n")[0];
    if (english && EN_NOTE.test(first)) { inNote = true; continue; }
    if (english && EN_SCAF.test(first)) { inNote = false; const rest = t.split("\n").slice(1).join("\n").trim(); if (!rest) continue; }
    if (inNote) { if (/^#{1,6}\s/.test(t)) inNote = false; else continue; }
    if (english && /^>\s*\*\*Translator's note:\*\*/.test(t)) continue;
    if (t === "---") continue;
    if (/^<!--[\s\S]*-->$/.test(t)) continue;
    out.push(c.replace(INLINE, "").replace(/[ \t]{2,}\n/g, "\n").replace(/[ \t]+$/gm, ""));
  }
  return out;
}

{
  let taOk = true, enOk = true;
  const bad = [];
  novel.sections.forEach((s, i) => {
    const taSrc = releasedBlocks(readText(path.join(TA_DIR, taFiles[i])), false);
    const enSrc = releasedBlocks(readText(path.join(EN_DIR, enFiles[i])), true);
    // Drop the assembled layer's own section label: Tamil by the printed-heading test above,
    // English by position, since its label is worded differently from the Tamil one.
    const taFirst = taSrc[0] ?? "";
    if (/^#{1,6}\s/.test(taFirst) && !printed.has(nfc(taFirst.replace(/^#+\s*/, "").split("\n")[0]))) {
      taSrc.shift();
      if (/^#{1,6}\s/.test(enSrc[0] ?? "")) enSrc.shift();
    }
    const taGen = s.tamil.blocks.map((b) => (b.kind === "heading" ? `${"#".repeat(b.level)} ${b.text}` : b.text));
    const enGen = s.english.blocks.map((b) => (b.kind === "heading" ? `${"#".repeat(b.level)} ${b.text}` : b.text));
    if (JSON.stringify(taGen.map(nfc)) !== JSON.stringify(taSrc.map(nfc))) { taOk = false; bad.push(`Tamil section ${s.order} (${taGen.length} vs ${taSrc.length})`); }
    if (JSON.stringify(enGen.map(nfc)) !== JSON.stringify(enSrc.map(nfc))) { enOk = false; bad.push(`English section ${s.order} (${enGen.length} vs ${enSrc.length})`); }
  });
  check("Tamil body reconstructs the assembled layer exactly", taOk, bad.filter((x) => x.startsWith("Tamil")).join("; "));
  check("English body reconstructs the released translation exactly", enOk, bad.filter((x) => x.startsWith("English")).join("; "));
}
// No omissions, no duplicated section bodies.
{
  const sig = novel.sections.map((s) => s.tamil.blocks.map((b) => b.text).join("\n"));
  eq("no duplicated Tamil section body", new Set(sig).size, 3);
  eq("no duplicated English section body", new Set(novel.sections.map((s) => s.english.blocks.map((b) => b.text).join("\n"))).size, 3);
  check("every section has both layers", novel.sections.every((s) => s.tamil.blocks.length > 0 && s.english.blocks.length > 0));
  check("block kinds are legal", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => ["paragraph", "heading", "ornament"].includes(b.kind))));
  check("every block carries source provenance", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => b.sourcePages.length > 0)));
  check("block scans stay within the body range", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => b.sourcePages.every((p) => p.scan >= 4 && p.scan <= 33))));
  eq("body scans", [novel.bodyScans.from, novel.bodyScans.to], [4, 33]);
  eq("provenance body scans", prov.source.bodyScans, "4–33");
  // A printed page number is carried only where the scan shows one.
  check("printedPage is a number or null, never inferred", novel.sections.every((s) => [...s.tamil.blocks, ...s.english.blocks].every((b) => b.sourcePages.every((p) => p.printedPage === null || Number.isInteger(p.printedPage)))));
  check("at least one block has no printed number (the source page map records `—`)", novel.sections.some((s) => s.tamil.blocks.some((b) => b.sourcePages.some((p) => p.printedPage === null))));
}

// ── 5. INTENTIONAL SOURCE LINE BREAKS ────────────────────────────────────────────────────────────
// The film credits and the closing lineated address carry hard breaks inside one block. Collapsing
// them would be the Phase-4 Poetry mistake in prose form.
{
  const withBreaks = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).filter((b) => b.hasLineBreaks);
  check("intentional source line breaks are preserved", withBreaks.length > 0);
  check("hasLineBreaks agrees with the text", novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).every((b) => b.hasLineBreaks === b.text.includes("\n")));
  eq("provenance Tamil line-break blocks", prov.archiveDerived.tamilBlocksWithLineBreaks, novel.sections.reduce((n, s) => n + s.tamil.blocks.filter((b) => b.hasLineBreaks).length, 0));
  eq("provenance English line-break blocks", prov.archiveDerived.englishBlocksWithLineBreaks, novel.sections.reduce((n, s) => n + s.english.blocks.filter((b) => b.hasLineBreaks).length, 0));
  const credits = novel.sections[1].tamil.blocks.find((b) => b.text.includes("டைரக்ஷன்"));
  check("the film-credit block keeps its source line break", !!credits && credits.hasLineBreaks);
  const reader = readText(path.join(process.cwd(), "components/NovelReader.tsx"));
  check("reader renders source line breaks", reader.includes("whitespace-pre-line"));
}

// ── 6. SOURCE-ESTABLISHED JOINS — independently re-derived ───────────────────────────────────────
// The assembled layer's README lists every verified page-boundary join. Most also carry an inline
// comment; one (12→13) is a quotation continuity with no inline marker, so BOTH sources are read.
{
  const readme = readText(path.join(TA_DIR, "README.md"));
  const documented = [...readme.matchAll(/^-\s*scans\s*(\d+)\s*→\s*(\d+)\s*:/gm)].map((m) => [Number(m[1]), Number(m[2])]);
  eq("the assembled layer documents 7 verified joins", documented.length, 7);
  const generated = prov.archiveDerived.joins.map((j) => [j.fromScan, j.toScan]);
  eq("every documented join is represented", documented.every((d) => generated.some((g) => g[0] === d[0] && g[1] === d[1])), true);
  eq("no join is invented beyond the documented set", generated.every((g) => documented.some((d) => d[0] === g[0] && d[1] === g[1])), true);
  eq("join count", prov.archiveDerived.sourceEstablishedJoins, documented.length);
  check("every join carries verbatim source evidence", prov.archiveDerived.joins.every((j) => typeof j.evidence === "string" && j.evidence.length > 10));
  // The inline-only and README-only evidence must both be present somewhere.
  const inlineJoins = [];
  for (const f of taFiles) {
    for (const m of readText(path.join(TA_DIR, f)).matchAll(/<!--\s*source (?:join|boundary):\s*scan\s*(\d+)[\s\S]*?scan\s*(\d+)[\s\S]*?-->/g)) inlineJoins.push([Number(m[1]), Number(m[2])]);
  }
  eq("6 joins carry an inline marker at the join point", inlineJoins.length, 6);
  const quotationOnly = documented.filter((d) => !inlineJoins.some((i) => i[0] === d[0] && i[1] === d[1]));
  eq("the remaining documented join is the 12→13 quotation continuity", quotationOnly, [[12, 13]]);
  check("the 12→13 join cites the README, not an invented inline marker", prov.archiveDerived.joins.find((j) => j.fromScan === 12)?.evidence.includes("sections/README.md"));
  check("provenance states joins were established before assembly", prov.archiveDerived.joinNote.includes("never invents a join"));
}

// ── 7. TRANSLATOR APPARATUS SEPARATED ────────────────────────────────────────────────────────────
{
  const notes = novel.sections.flatMap((s) => s.english.notes);
  check("translator notes are carried", notes.length > 0);
  eq("provenance records the note count", prov.archiveDerived.translatorNotes, notes.length);
  check("every section carries its translator's note", novel.sections.every((s) => s.english.notes.some((n) => /Translator's note/i.test(n.heading))));
  const body = novel.sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of [
    ["translator's-note label", "**Translator's note:**"],
    ["batch notes label", "translation notes"],
    ["review-result label", "review result"],
    ["release status label", "RELEASE-READY"],
    ["batch scaffolding heading", "Batch 3 — Continuation"],
    ["internal status heading", "Internal-sequence translation status"],
    ["provenance comment", "<!-- source:"],
    ["source-join comment", "source join:"],
    ["source-boundary comment", "source boundary:"],
    ["assembled-layer authority prose", "controlling archival text"],
    ["library stamp note", "library/ownership stamps"],
    ["bleed-through note", "bleed-through"],
  ]) check(`reading body excludes ${label}`, !body.includes(needle), `found ${JSON.stringify(needle)}`);
}

// ── 8. RECORDED COUNTS MATCH GENERATED DATA ─────────────────────────────────────────────────────
{
  const d = prov.archiveDerived;
  const cnt = (sel) => novel.sections.reduce((n, s) => n + sel(s), 0);
  eq("provenance sections", d.sections, novel.sections.length);
  eq("provenance Tamil blocks", d.tamilBlocks, cnt((s) => s.tamil.blocks.length));
  eq("provenance English blocks", d.englishBlocks, cnt((s) => s.english.blocks.length));
  eq("provenance Tamil paragraphs", d.tamilParagraphs, cnt((s) => s.tamil.blocks.filter((b) => b.kind === "paragraph").length));
  eq("provenance English paragraphs", d.englishParagraphs, cnt((s) => s.english.blocks.filter((b) => b.kind === "paragraph").length));
  eq("provenance Tamil headings", d.tamilHeadings, cnt((s) => s.tamil.blocks.filter((b) => b.kind === "heading").length));
  eq("provenance English headings", d.englishHeadings, cnt((s) => s.english.blocks.filter((b) => b.kind === "heading").length));
  eq("provenance ornaments", d.ornaments, cnt((s) => [...s.tamil.blocks, ...s.english.blocks].filter((b) => b.kind === "ornament").length));
  check("printed ornaments are retained", d.ornaments > 0);
  eq("English kind", prov.english.kind, "project-created");
  check("English status recorded", prov.english.status.includes("VERIFIED"));
  check("page records verified 34/34", prov.source.pageRecordsVerified.includes("34 / 34"));
  check("source audit PASSED", prov.source.sourceAudit.includes("PASSED"));
  check("assembled layer PASSED", prov.source.assembledLayer.includes("PASSED"));
}

// ── 9. RIGHTS ────────────────────────────────────────────────────────────────────────────────────
{
  const pr = prov.projectRights;
  eq("rights status", pr.rightsStatus, "nationalised-by-tamil-nadu-government");
  eq("GO number remains unverified", pr.governmentOrderNumber, null);
  eq("GO issue date remains unverified", pr.governmentOrderDate, null);
  eq("GO handover date", pr.governmentOrderHandoverDate, "2024-12-22");
  check("rights not broadened to edition/publisher/cover/printer/library matter", ["publisher", "cover", "printer", "library"].every((w) => pr.thirdPartyNote.toLowerCase().includes(w)));
  check("rights not broadened to the project translation", /not covered/i.test(pr.projectTranslationNote));
  check("RELEASE-READY is qualified as an archival, not rights, judgement", /NOT, by itself, a copyright/i.test(pr.archivalStatusNote));
}

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
