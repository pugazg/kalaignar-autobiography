// Deterministic, work-specific importer for பெரிய இடத்துப் பெண் / "The Woman of the Great House"
// (Digital Library — Fiction; Wave 6 Batch 5). An eighth-edition (July 1953) novel by Kalaignar
// M. Karunanidhi. ONE continuous work whose source archive assembled it into SEVEN source-structured
// reading divisions built from 49 audited page records; six source-printed internal character
// headings punctuate the single narrative.
//
// Reads the AUTHORITATIVE frozen source from a local clone of pugazg/kalaignar-novels
// (works/periya-idathup-pen) at the pinned Batch-5 anchor commit, and vendors static bilingual
// reader data into public/data/novels/periya-idathup-pen/. Runtime never calls GitHub. The source
// PDF is never read and never vendored. The source clone is never modified.
//
// Usage: node scripts/import-periya-idathup-pen.mjs <kalaignar-novels-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import { readText, sha256, nfc, assertSourceHead, parseSection, literalBlocks } from "./lib/novel-assembled.mjs";

const SRC_REPO = process.argv[2];
// The REVISED, adjudicated Batch-5 source anchor (registers the 1978 அரும்பு witness). Written to
// provenance.json and used as the clone HEAD the literary + witness facts are read from.
const ACTIVE_ANCHOR = process.argv[3];
// The literary-freeze commit written to novel.json. The assembled sections/, pages/ and English
// translations/ are BYTE-IDENTICAL at the literary freeze and at the revised anchor (the revised
// anchor differs only by Periya's `metadata/source.md` + the added `metadata/witness-arumbu-1978.md`),
// so novel.json — the reader/literary payload — stays byte-stable across the provenance correction.
const LITERARY_FREEZE = process.argv[4] || "a99f135467dd38e294faff31088a937994790a47";
if (!SRC_REPO || !ACTIVE_ANCHOR) {
  console.error("usage: node scripts/import-periya-idathup-pen.mjs <kalaignar-novels-clone> <active-anchor-commit> [<literary-freeze-commit>]");
  process.exit(1);
}
assertSourceHead(SRC_REPO, ACTIVE_ANCHOR);

const SLUG = "periya-idathup-pen";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const OUT = path.join(process.cwd(), "public/data/novels", SLUG);

// ── Source identity, extracted from the source's own metadata record and asserted ─────────────────
const meta = nfc(readText(path.join(WORK_DIR, "metadata/source.md")));
const grab = (re, label) => {
  const m = re.exec(meta);
  if (!m) throw new Error(`source identity: metadata/source.md lacks ${label}`);
  return m[1];
};
const SCAN_FILENAME = grab(/Source filename:\s*`(.+?)`/, "scan filename");
const SCAN_SHA256 = grab(/SHA-256:\s*`(.+?)`/, "scan SHA-256");
const SCAN_SIZE = grab(/File size:\s*\*\*([\d,]+)\s*bytes\*\*/, "scan size");
const SCAN_PAGES = Number(grab(/Scan pages:\s*\*\*(\d+)\*\*/, "scan pages"));
if (!SCAN_FILENAME.endsWith(".pdf")) throw new Error(`unexpected scan filename ${SCAN_FILENAME}`);
if (SCAN_PAGES !== 49) throw new Error(`expected 49 source scans, metadata says ${SCAN_PAGES}`);
for (const [label, needle] of [
  ["eighth edition", "எட்டாம் பதிப்பு: ஜூலை 1953"],
  ["publisher", "திராவிடன் பதிப்பகம்"],
  ["one continuous work", "one continuous work"],
  ["seven source-structured files", "seven source-structured files"],
  ["printer colophon", "ஸ்ரீமகள் அச்சகம், சென்னை-1"],
]) {
  if (!meta.includes(nfc(needle))) throw new Error(`source identity mismatch: metadata/source.md lacks the expected ${label} (${needle})`);
}
// source.md must register the additional witness and keep the 1953 edition controlling.
if (!meta.includes(nfc("witness-arumbu-1978.md"))) throw new Error("source metadata no longer registers the 1978 அரும்பு witness — refusing to import");
if (!meta.includes(nfc("This witness is **not** the controlling source"))) throw new Error("source metadata no longer states the 1978 printing is a non-controlling witness — refusing to import");

// ── Additional (non-controlling) 1978 witness, read verbatim from the source ─────────────────────
const wmeta = nfc(readText(path.join(WORK_DIR, "metadata/witness-arumbu-1978.md")));
const wgrab = (re, label) => { const m = re.exec(wmeta); if (!m) throw new Error(`witness metadata lacks ${label}`); return m[1]; };
const WIT_FILENAME = wgrab(/compilation filename:\s*`(.+?)`/, "compilation filename");
const WIT_SHA256 = wgrab(/compilation SHA-256:\s*`(.+?)`/, "compilation SHA-256");
const WIT_SIZE = wgrab(/compilation size:\s*\*\*([\d,]+)\s*bytes\*\*/, "compilation size");
const WIT_SCANS = Number(wgrab(/compilation scans:\s*\*\*(\d+)\*\*/, "compilation scans"));
const WIT_EDITION = wgrab(/compilation edition:\s*\*\*(.+?)\*\*/, "compilation edition");
const WIT_PUBLISHER = wgrab(/publisher:\s*\*\*(.+?)\*\*/, "witness publisher");
const WIT_RANGE = wgrab(/witness physical scans:\s*\*\*(.+?)\*\*/, "witness scan range");
const WIT_COUNT = Number(wgrab(/witness scan count:\s*\*\*(\d+)\*\*/, "witness scan count"));
if (WIT_FILENAME !== "TVA_BOK_0064361_அரும்பு.pdf") throw new Error(`unexpected witness filename ${WIT_FILENAME}`);
if (WIT_RANGE !== "49–74" && WIT_RANGE !== "49-74") throw new Error(`unexpected witness scan range ${WIT_RANGE}`);
if (WIT_COUNT !== 26) throw new Error(`unexpected witness scan count ${WIT_COUNT}`);
// The source must NOT claim any line-by-line comparison; the importer refuses to invent one.
if (!wmeta.includes(nfc("No line-by-line comparison has yet been performed"))) throw new Error("witness metadata no longer states that no line-by-line comparison exists — refusing to import");
if (!wmeta.includes(nfc("The existing 1953 eighth-edition scan remains the controlling source"))) throw new Error("witness metadata no longer states the 1953 edition is controlling — refusing to import");
// Guard against inventing weekly-magazine serialization: the source describes அரும்பு as a 1978
// four-story compilation, never a magazine; refuse if magazine/issue/serialization terms are present.
if (/\b(weekly|magazine|இதழ்|serial|serialis|serializ|வார)\b/i.test(wmeta)) throw new Error("witness metadata unexpectedly contains magazine/serialization terms — refusing to import a fabricated claim");

// ── Printed headings, derived from the CANONICAL page records ─────────────────────────────────────
// A heading is admitted to the reading body only if a body page record actually prints it. Apparatus
// headings inside a page record (the per-scan glyph re-audit, scan observations) are not the work's.
const PAGES_DIR = path.join(WORK_DIR, "pages");
const APPARATUS_HEADING = /^#{1,6}\s+(Historical-glyph|Scan observations|Non-text|Verification note|Page record|Copy|Page-boundary|Assembly|Provenance)/i;
const printedHeadings = new Map();
for (const file of fs.readdirSync(PAGES_DIR).filter((f) => /^\d{4}.*\.md$/.test(f)).sort()) {
  const scan = Number(file.slice(0, 4));
  const text = nfc(readText(path.join(PAGES_DIR, file)));
  const fmEnd = /^---\n[\s\S]*?\n---\n/.exec(text);
  if (!fmEnd) throw new Error(`page record ${file} has no front matter`);
  if (!/^page_type:\s*"body"\s*$/m.test(fmEnd[0])) continue;
  for (const line of text.slice(fmEnd[0].length).split("\n")) {
    if (!/^#{1,6}\s/.test(line)) continue;
    if (APPARATUS_HEADING.test(line.trim())) break; // apparatus begins; nothing after it is printed body
    const t = line.trim().replace(/^#+\s*/, "");
    if (!printedHeadings.has(t)) printedHeadings.set(t, []);
    if (!printedHeadings.get(t).includes(scan)) printedHeadings.get(t).push(scan);
  }
}
if (printedHeadings.size === 0) throw new Error("no printed headings found in the audited page records — refusing to import");

// ── Build the seven sections ──────────────────────────────────────────────────────────────────────
const TA_DIR = path.join(WORK_DIR, "sections");
const EN_DIR = path.join(WORK_DIR, "translations/en/sections");
const taFiles = fs.readdirSync(TA_DIR).filter((f) => /^0\d-.*\.md$/.test(f)).sort();
const enFiles = fs.readdirSync(EN_DIR).filter((f) => /^0\d-.*\.md$/.test(f)).sort();
if (taFiles.length !== 7) throw new Error(`expected exactly 7 assembled Tamil sections, found ${taFiles.length}`);
if (enFiles.length !== 7) throw new Error(`expected exactly 7 English sections, found ${enFiles.length}`);

const sections = [];
const allJoins = [];
for (let i = 0; i < 7; i++) {
  if (taFiles[i] !== enFiles[i]) throw new Error(`Tamil/English section filename mismatch at ${i}: ${taFiles[i]} vs ${enFiles[i]}`);
  const taRaw = readText(path.join(TA_DIR, taFiles[i]));
  const enRaw = readText(path.join(EN_DIR, enFiles[i]));
  const ta = parseSection(taRaw, { english: false });
  const en = parseSection(enRaw, { english: true });

  // Byte round-trip self-check: the block stream must reconstruct the comment-free source exactly.
  const taRt = JSON.stringify(ta.rawBlocks) === JSON.stringify(literalBlocks(taRaw, { english: false }));
  const enRt = JSON.stringify(en.rawBlocks) === JSON.stringify(literalBlocks(enRaw, { english: true }));
  if (!taRt) throw new Error(`${taFiles[i]}: Tamil byte round-trip failed`);
  if (!enRt) throw new Error(`${enFiles[i]}: English byte round-trip failed`);

  const order = Number(ta.fm.section_order);
  if (order !== i + 1) throw new Error(`${taFiles[i]}: section_order ${order}, expected ${i + 1}`);
  if (Number(en.fm.section_order || i + 1) !== order && en.fm.section_order !== undefined) throw new Error(`${enFiles[i]}: section_order disagrees with Tamil`);
  if (ta.fm.work !== SLUG || en.fm.work !== SLUG) throw new Error(`section ${order}: work identity is not ${SLUG}`);
  if (ta.fm.status !== "passed") throw new Error(`${taFiles[i]}: status "${ta.fm.status}", expected passed`);
  if (en.fm.translation_status !== "reviewed") throw new Error(`${enFiles[i]}: translation_status "${en.fm.translation_status}", expected reviewed`);

  // Every Tamil heading must be a heading a body page record actually prints (no archival label is
  // ever published as source text). Where the assembled layer cites that heading with a per-run
  // marker, the citation must name a scan that prints it; where the section uses only section-level
  // coverage (section 7), the printed-heading map is the proof and no per-block citation is required.
  for (const b of ta.blocks) {
    if (b.kind !== "heading") continue;
    const scans = printedHeadings.get(nfc(b.text));
    if (!scans) throw new Error(`section ${order}: Tamil heading "${b.text}" is printed on no body page record — refusing to publish it as source text`);
    if (b.sourcePages.length && !b.sourcePages.some((pg) => scans.includes(pg.scan))) {
      throw new Error(`section ${order}: heading "${b.text}" is printed on scan(s) ${scans.join(", ")} but is cited to ${b.sourcePages.map((pg) => pg.scan).join(", ")}`);
    }
  }

  const slug = taFiles[i].replace(/^0\d-/, "").replace(/\.md$/, "");
  const titleTa = ta.fm.section_title;
  const enHeading = en.blocks.find((b) => b.kind === "heading");
  if (!enHeading) throw new Error(`section ${order}: English file has no leading heading to use as its title`);
  const titleEn = enHeading.text;

  allJoins.push(...ta.joins);
  sections.push({
    order,
    slug,
    titleTa,
    titleEn,
    sourceScansTa: ta.fm.source_scans,
    sourceScansEn: en.fm.source_scans,
    isEmbeddedSequence: false,
    titleIsPrintedHeading: printedHeadings.has(nfc(titleTa)),
    carriesArchiveSectionLabel: false,
    unitNumberTa: order === 1 ? null : String(order),
    unitNumberEn: order === 1 ? null : String(order),
    tamil: { blocks: ta.blocks },
    english: { blocks: en.blocks, notes: en.notes },
  });
}

// Cross-page joins established by the source audit, carried verbatim, deduped and ordered.
const joins = [];
for (const j of allJoins) {
  const ex = joins.find((x) => x.fromScan === j.fromScan && x.toScan === j.toScan);
  if (ex) { if (!ex.evidence.includes(j.evidence)) ex.evidence = `${ex.evidence} | ${j.evidence}`; }
  else joins.push({ ...j });
}
joins.sort((a, b) => a.fromScan - b.fromScan || a.toScan - b.toScan);
const FRAGMENT_EVIDENCE = /`[^`]+`\s*\+\s*`[^`]+`/;
for (const j of joins) {
  j.evidenceKind = FRAGMENT_EVIDENCE.test(j.evidence) ? "page-edge-fragments" : "narrative-continuity";
  j.hasInlineMarker = true; // every Periya join is recorded at its inline point in the assembled layer
}

// Locked exclusions the reading body must never contain.
const EXCLUDED = [
  ["translator's-note label", "**Translator's note:**"],
  ["provenance comment", "<!-- source:"],
  ["source-join comment", "source join:"],
  ["source-boundary comment", "source boundary:"],
  ["glyph re-audit apparatus", "Historical-glyph re-audit"],
];
{
  const body = sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of EXCLUDED) {
    if (body.includes(needle)) throw new Error(`reading body contains locked-excluded material (${label}): ${JSON.stringify(needle)}`);
  }
}

// ── Assemble ─────────────────────────────────────────────────────────────────────────────────────
const count = (sel) => sections.reduce((n, s) => n + sel(s), 0);
// Body scan coverage is the authoritative section-level range (front-matter `source_scans` of each
// section), not the max per-block marker — the concluding section carries only section-level scans.
const allScanNums = sections.flatMap((s) => [...String(s.sourceScansTa).replace(/\([^)]*\)/g, "").matchAll(/\d+/g)].map((m) => Number(m[0])));
const bodyScans = { from: Math.min(...allScanNums), to: Math.max(...allScanNums) };

const structure = {
  unitKindTa: "மூலக் காப்பகத்தின் வாசிப்புப் பிரிவுகள்",
  unitKindEn: "source-archive assembled reading divisions",
  unitNounTa: "பகுதி",
  unitNounEn: "section",
  noteTa:
    "இது ஒரே தொடர்ச்சியான படைப்பு. கீழுள்ள ஏழு பகுதிகளும் அவற்றின் தலைப்புகளும் மூலக் காப்பகத்தின் வாசிப்புத் தொகுப்பின் பிரிவுகளும் விளக்கக் குறிப்புகளுமே; அச்சிடப்பட்ட அத்தியாயங்களோ தலைப்புகளோ அல்ல. ஆறு பாத்திரப்பெயர்த் தலைப்புகள் அந்த ஒரே தொடர்ச்சியான உரைக்குள் மூலத்தில் அச்சிடப்பட்டவை.",
  noteEn:
    "This is one continuous work. The seven sections below — and their titles — are the source archive's own assembled reading divisions and descriptive labels, not printed chapters. The six character-name headings are printed inside that single continuous narrative in the source itself.",
};
const editionSummaryTa = "எட்டாம் பதிப்பு (ஜூலை 1953, திராவிடன் பதிப்பகம், வேலூர்)";
const editionSummaryEn = "eighth edition, July 1953 (Dravidian Pathippagam, Vellore)";

const novel = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-novels",
  sourcePath: `works/${SLUG}`,
  // The literary payload is pinned to the literary-freeze commit; the assembled reading layer is
  // byte-identical there and at the revised active anchor, so this reader payload stays byte-stable.
  sourceCommit: LITERARY_FREEZE,
  shelf: "fiction",
  readerStructure: "novel",
  subtype: "novel",
  title: { ta: "பெரிய இடத்துப் பெண்", en: "The Woman of the Great House" },
  author: { ta: "மு. கருணாநிதி", en: "M. Karunanidhi" },
  edition: {
    statementTa: "எட்டாம் பதிப்பு: ஜூலை 1953",
    year: 1953,
    monthTa: "ஜூலை",
    editionOrdinalTa: "எட்டாம் பதிப்பு",
    publisherTa: "திராவிடன் பதிப்பகம்",
    placeTa: "வேலூர் (வ. ஆ.)",
    priceTa: "விலை 0—8—0",
    printerTa: "ஸ்ரீமகள் அச்சகம், சென்னை-1",
  },
  structure,
  editionSummaryTa,
  editionSummaryEn,
  readingUnitKind: "archive-division",
  sections,
  sectionCount: sections.length,
  bodyScans,
};

const provenance = {
  workId: SLUG,
  sourceRepo: novel.sourceRepo,
  sourcePath: novel.sourcePath,
  // Provenance records the REVISED, adjudicated active source anchor (the snapshot that registers the
  // 1978 அரும்பு witness). The literary payload's freeze commit is recorded separately below.
  sourceCommit: ACTIVE_ANCHOR,
  literarySnapshotCommit: LITERARY_FREEZE,
  literarySnapshotNote:
    "The assembled reading layer (sections/, pages/, translations/en/) is byte-identical at the literary-freeze commit and at the revised active anchor; the anchor differs only by metadata/source.md and the added metadata/witness-arumbu-1978.md. novel.json is therefore pinned to the literary-freeze commit and is byte-unchanged by this provenance correction.",
  source: {
    titleTa: novel.title.ta,
    titleEn: novel.title.en,
    authorTa: novel.author.ta,
    scanFilename: SCAN_FILENAME,
    scanSha256: SCAN_SHA256,
    scanSha256Note: "Carried verbatim from the source metadata record; the source PDF is not vendored, so it is not recomputed here.",
    scanFileSizeBytes: Number(SCAN_SIZE.replace(/,/g, "")),
    scanTotalPages: SCAN_PAGES,
    pageRecordsVerified: "49 / 49 canonical page records; all needs-review under the source's user-mandated verification freeze (0 verified)",
    sourceAudit: "dedicated whole-work source comparison complete (scans 1–49); assembled Tamil consistency PASSED",
    assembledLayer: "assembled Tamil reading layer PASSED (derived only from the audited page records)",
    sourcePdfCommitted: false,
    editionTa: "எட்டாம் பதிப்பு: ஜூலை 1953",
    publisherTa: "திராவிடன் பதிப்பகம்",
    placeTa: "வேலூர் (வ. ஆ.)",
    priceTa: "விலை 0—8—0",
    printerTa: "ஸ்ரீமகள் அச்சகம், சென்னை-1",
    printedPageNumbering:
      "Printed page numbers are not visible on every scan (scans 1–6 and scan 8 show none). Where none is printed the page map records `—` and this integration carries `printedPage: null`; a number is never inferred from sequence.",
    bodyScans: `${bodyScans.from}–${bodyScans.to}`,
    structureNote:
      "ONE continuous work in SEVEN source-structured assembled reading divisions. The six character-name headings (உத்தண்டி scan 15, கண்ணம்மா scan 19, குமுதா scan 32, வீரன் scan 38, உலகநாதர் scan 45, கண்ணம்மா scan 46) are internal textual headings printed within that single narrative — not separate works and not archive-invented chapters. There is NO embedded film-sequence in this work.",
    sourceContinuity: [
      "scans 1–7 — cover, copy annotation, publication details, author/publisher/edition notes — kept in the canonical `pages/` layer, outside the continuous reading body;",
      "scan 8 — source title `பெரிய இடத்துப் பெண்` and the narrative opening;",
      "scans 8–49 — one continuous narrative, punctuated by six source-printed character-name headings;",
      "scan 49 — narrative ending followed by a separately printed printer colophon `ஸ்ரீமகள் அச்சகம், சென்னை-1`, retained as non-narrative source matter.",
    ],
    lockedExclusions: [
      "scans 1–7 — cover, copy annotation / gift label, publication details and the author/publisher/eighth-edition notes (canonical `pages/` layer, not duplicated in the continuous reading body)",
      "library/ownership marks, handwritten accession-style marks, the later Meykandar gift label, marginal marks and reverse-side bleed-through throughout",
      "the assembled layer's own provenance comments and its authority/assembly prose",
      "each canonical page record's per-scan historical-glyph re-audit apparatus",
      "the English layer's translator's-note blockquotes, carried outside the reading body",
    ],
  },
  // Additional (NON-controlling) printed witnesses of this work, registered from the source but NOT
  // used to alter any canonical Tamil, assembled Tamil or English. Read verbatim from
  // metadata/witness-arumbu-1978.md at the revised anchor.
  additionalWitnesses: [
    {
      kind: "additional-non-controlling-witness",
      appearsIn: "1978 four-story compilation `அரும்பு`",
      compilationFilename: WIT_FILENAME,
      compilationSha256: WIT_SHA256,
      compilationFileSizeBytes: Number(WIT_SIZE.replace(/,/g, "")),
      compilationScans: WIT_SCANS,
      compilationEditionTa: WIT_EDITION,
      compilationPublisherTa: WIT_PUBLISHER,
      witnessPhysicalScans: WIT_RANGE,
      witnessScanCount: WIT_COUNT,
      printedPageMarkers: "scan 49 title/opening (no clearly visible printed number); scan 50 printed 47; scan 74 printed 72",
      sourcePdfCommitted: false,
      controlling: false,
      comparisonStatus: "no line-by-line 1953↔1978 comparison has been performed; the 1978 text is not assumed identical, complete, abridged, corrected or authoritative relative to the 1953 controlling source",
      authorizes: "nothing — registering this witness does NOT authorize edits to canonical Tamil, assembled Tamil or English, and does not change the canonical verification freeze",
      note: "The controlling source for this archival package remains the 1953 eighth-edition scan. This is an additional witness only.",
    },
  ],
  english: {
    kind: "project-created",
    status: "whole-work English VERIFIED",
    batches: "English sections 7 / 7 reviewed; translation batches 8 / 8 reviewed",
    bodyCoverage: "English body-text coverage complete for the continuous narrative (scans 8–49)",
    bilingualAlignment: "final bilingual review PASSED",
    releaseReadiness: "release-readiness PASSED WITH CANONICAL-TAMIL VERIFICATION QUALIFICATION (an editorial/archival status, not a rights determination)",
    translatorNotesSeparated:
      "Each English section opens with a labelled translator's-note blockquote. These are carried OUTSIDE the reading body and rendered in a separate, clearly-labelled area — never as Kalaignar's prose.",
  },
  archiveDerived: {
    sections: sections.length,
    tamilBlocks: count((s) => s.tamil.blocks.length),
    englishBlocks: count((s) => s.english.blocks.length),
    tamilParagraphs: count((s) => s.tamil.blocks.filter((b) => b.kind === "paragraph").length),
    englishParagraphs: count((s) => s.english.blocks.filter((b) => b.kind === "paragraph").length),
    printedHeadingsInSource: [...printedHeadings.entries()].map(([text, scans]) => ({ text, scans })),
    sectionsWithArchiveOnlyTitle: sections.filter((s) => s.carriesArchiveSectionLabel).length,
    tamilHeadings: count((s) => s.tamil.blocks.filter((b) => b.kind === "heading").length),
    englishHeadings: count((s) => s.english.blocks.filter((b) => b.kind === "heading").length),
    ornaments: count((s) => [...s.tamil.blocks, ...s.english.blocks].filter((b) => b.kind === "ornament").length),
    tamilBlocksWithLineBreaks: count((s) => s.tamil.blocks.filter((b) => b.hasLineBreaks).length),
    englishBlocksWithLineBreaks: count((s) => s.english.blocks.filter((b) => b.hasLineBreaks).length),
    translatorNotes: count((s) => s.english.notes.length),
    tamilBlocksWithPerBlockScan: count((s) => s.tamil.blocks.filter((b) => b.sourcePages.length > 0).length),
    englishBlocksWithPerBlockScan: count((s) => s.english.blocks.filter((b) => b.sourcePages.length > 0).length),
    perBlockScanNote:
      "Per-block scan provenance is carried wherever the assembled layer places a per-run `<!-- source: scan N … -->` marker. Where a section uses only section-level scan coverage (its front-matter `source_scans`) — notably the concluding section — a block's `sourcePages` is left empty rather than inferred; the section's declared scan range remains authoritative and no scan is invented.",
    sourceEstablishedJoins: joins.length,
    joins,
    embeddedSequenceSections: 0,
    note:
      "Derived structure only. The 49 canonical `pages/` records remain the controlling archival text; this integration reads the archive's own assembled reading layer, built from those records. Paragraph structure is carried verbatim — never re-split, never merged — and no source wording, punctuation, spacing or historical spelling was normalized (byte-faithful).",
    joinNote:
      "The source audit established every cross-page continuity before assembly; the assembled layer applies each at the exact point it fixed, marked with an inline comment carried here as recorded join provenance and stripped from display text. This integration never invents a join and never re-opens one the archive made.",
    provenanceGranularity:
      "Block-level scan provenance from the assembled layer's own trailing `<!-- source: … -->` markers, which close the run of blocks above them. A block spanning a page carries both scans. Printed page numbers are recorded only where the scan shows one; otherwise null.",
  },
  projectRights: {
    appliesTo: "underlying-work-authored-by-kalaignar",
    rightsStatus: "nationalised-by-tamil-nadu-government",
    rightsAuthority: "Government of Tamil Nadu",
    rightsAction: "nationalisation",
    rightsAnnouncementDate: "2024-08-22",
    governmentOrderNumber: null,
    governmentOrderDate: null,
    governmentOrderHandoverDate: "2024-12-22",
    distinctionNote:
      "This is the PRESENT project-level rights status of Kalaignar's underlying novel. The 1953 eighth edition's own publisher, price and printer lines are edition facts, not statements about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored novel. It does NOT extend to the edition's publisher/imprint matter, the printer's material, or the library's stamps and accession marks — each retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    archivalStatusNote:
      "The source repository's release-readiness status is an editorial/archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },
  notes: [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count, carried verbatim from the source metadata.",
    "This is ONE continuous novel in SEVEN assembled reading divisions. There is NO embedded film-sequence and NO separate work; the six character-name headings are internal source-printed headings within the single narrative.",
    "Section titles are the archive's descriptive labels. Where the edition prints a heading (the work title on scan 8; the six character headings) it is carried in the body and cited to the scan that prints it; the archive's disambiguating labels (`— முதல் உரை`, `— முடிவு`, `தொடக்கம்`) are section titles only and are never given page provenance.",
    "The body covers scans 8–49. Scans 1–7 (cover, copy annotation, publication details, author/publisher/eighth-edition notes) and all copy-specific marks are outside the reading body.",
    "Canonical page records remain 0 verified / 49 needs-review under the source's user-mandated verification freeze; that freeze is a source state and is reported, not altered.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "novel.json"), JSON.stringify(novel, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

const d = provenance.archiveDerived;
console.log("novel:", SLUG);
console.log("sections:", d.sections, "| titles:", sections.map((s) => `${s.order}:${s.slug}`).join(" "));
console.log("Tamil  blocks", d.tamilBlocks, "| paragraphs", d.tamilParagraphs, "| headings", d.tamilHeadings, "| line-break blocks", d.tamilBlocksWithLineBreaks);
console.log("English blocks", d.englishBlocks, "| paragraphs", d.englishParagraphs, "| headings", d.englishHeadings, "| notes", d.translatorNotes);
console.log("ornaments:", d.ornaments, "| source-established joins:", d.sourceEstablishedJoins, "| body scans:", provenance.source.bodyScans);
console.log("printed headings:", d.printedHeadingsInSource.map((h) => `${h.text}(${h.scans.join(",")})`).join(" · "));
console.log("novel.json sha256:", sha256(readText(path.join(OUT, "novel.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
