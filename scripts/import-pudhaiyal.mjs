// Deterministic, work-specific importer for புதையல் / "Treasure" (Digital Library — Fiction;
// Wave 6 Batch 5). A continuous novel: an Introduction (அறிமுகம்) followed by 51 source-printed
// chapters, assembled from 448 audited page records (narrative scans 7–447; front matter scans 1–6;
// a separately printed printer colophon on scan 448).
//
// ── ROUTABLE LITERARY MODEL (authoritative) ──────────────────────────────────────────────────────
// Exactly 52 routable literary reading units are published:
//   * `00-arimugam.md` / English `00-introduction.md` — genuine continuous introductory prose;
//   * chapters `01`–`51`.
// These are EXCLUDED from the literary `[section]` namespace but accounted for in provenance:
//   * `front-matter.md`  — cover/title/publication/publisher-note + copy-specific gift inscription;
//   * `99-printer-colophon.md` — scan 448 back matter (`அன்பு அச்சகம், பொறையார்.`);
//   * `sections/checkpoints/**` — provenance witnesses only;
//   * the English `translations/en/*` release/audit/workflow documentation.
//
// Reads the frozen source from a local clone of pugazg/kalaignar-novels (works/pudhaiyal) at the
// pinned Batch-5 anchor. Runtime never calls GitHub; the source PDF is never read or vendored; the
// source clone is never modified. Literary bytes are preserved exactly (no trim/normalization).
//
// Usage: node scripts/import-pudhaiyal.mjs <kalaignar-novels-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import { readText, sha256, nfc, assertSourceHead, parseSection, literalBlocks, frontMatter } from "./lib/novel-assembled.mjs";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-pudhaiyal.mjs <kalaignar-novels-clone> <source-commit>");
  process.exit(1);
}
assertSourceHead(SRC_REPO, SRC_COMMIT);

const SLUG = "pudhaiyal";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const OUT = path.join(process.cwd(), "public/data/novels", SLUG);
const TA_DIR = path.join(WORK_DIR, "sections");
const EN_DIR = path.join(WORK_DIR, "translations/en/sections");

// ── Source identity ───────────────────────────────────────────────────────────────────────────────
const meta = nfc(readText(path.join(WORK_DIR, "metadata/source.md")));
const grab = (re, label) => { const m = re.exec(meta); if (!m) throw new Error(`source identity: metadata/source.md lacks ${label}`); return m[1]; };
const SCAN_FILENAME = grab(/Source filename:\s*`(.+?)`/, "scan filename");
const SCAN_SIZE = grab(/size(?:[^*]*)\*\*([\d,]+)\s*bytes\*\*/i, "scan size (previously recorded)");
if (!SCAN_FILENAME.endsWith(".pdf")) throw new Error(`unexpected scan filename ${SCAN_FILENAME}`);
// The source explicitly states the full-PDF SHA-256 is not yet computed. It must NOT be invented.
if (!/Original full-source SHA-256:\s*\*\*pending/i.test(meta)) throw new Error("expected the source to declare its full-PDF SHA-256 as pending; refusing to invent one");
const SCAN_SHA256 = null;
const SCAN_PAGES = 448;
for (const [label, needle] of [
  ["scan coverage 1–448", "1–448"],
  ["narrative ending scan 447", "scan 447 / printed 443"],
  ["colophon scan 448", "scan 448"],
]) {
  if (!meta.includes(nfc(needle))) throw new Error(`source identity mismatch: metadata/source.md lacks the expected ${label} (${needle})`);
}

// ── Classify source section files ───────────────────────────────────────────────────────────────
const taAll = fs.readdirSync(TA_DIR).filter((f) => /\.md$/.test(f) && f !== "README.md");
const ROUTABLE_RE = /^(00-arimugam|\d\d-chapter-\d+)\.md$/;
const EXCLUDED_FILES = new Set(["front-matter.md", "99-printer-colophon.md"]);
const routableTa = taAll.filter((f) => ROUTABLE_RE.test(f)).sort((a, b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2)));
// Guard: every non-routable Tamil section file must be a known, explicitly-excluded paratext/apparatus.
for (const f of taAll) {
  if (ROUTABLE_RE.test(f)) continue;
  if (!EXCLUDED_FILES.has(f)) throw new Error(`unexpected Tamil section file not classified as routable or excluded: ${f}`);
}
if (routableTa.length !== 52) throw new Error(`expected exactly 52 routable Tamil units, found ${routableTa.length}`);

const enName = (taFile) => (taFile === "00-arimugam.md" ? "00-introduction.md" : taFile);

const sections = [];
const allJoins = [];
for (let i = 0; i < routableTa.length; i++) {
  const taFile = routableTa[i];
  const enFile = enName(taFile);
  const taRaw = readText(path.join(TA_DIR, taFile));
  const enPath = path.join(EN_DIR, enFile);
  if (!fs.existsSync(enPath)) throw new Error(`English counterpart missing for ${taFile} (expected ${enFile})`);
  const enRaw = readText(enPath);
  const ta = parseSection(taRaw, { english: false });
  const en = parseSection(enRaw, { english: true });

  // Byte round-trip self-check.
  if (JSON.stringify(ta.rawBlocks) !== JSON.stringify(literalBlocks(taRaw, { english: false }))) throw new Error(`${taFile}: Tamil byte round-trip failed`);
  if (JSON.stringify(en.rawBlocks) !== JSON.stringify(literalBlocks(enRaw, { english: true }))) throw new Error(`${enFile}: English byte round-trip failed`);

  if (ta.fm.work !== SLUG || en.fm.work !== SLUG) throw new Error(`${taFile}: work identity is not ${SLUG}`);

  const isIntro = taFile === "00-arimugam.md";
  const sourceOrder = Number(ta.fm.section_order);
  const chapterNo = isIntro ? null : Number(taFile.match(/^\d\d-chapter-(\d+)\.md$/)[1]);
  if (!isIntro) {
    if (sourceOrder !== chapterNo) throw new Error(`${taFile}: section_order ${sourceOrder} != chapter number ${chapterNo}`);
    if (ta.fm.section_title !== String(chapterNo)) throw new Error(`${taFile}: Tamil section_title "${ta.fm.section_title}" != "${chapterNo}"`);
    if (en.fm.section_title !== `Chapter ${chapterNo}`) throw new Error(`${enFile}: English section_title "${en.fm.section_title}" != "Chapter ${chapterNo}"`);
  } else {
    if (sourceOrder !== 0) throw new Error(`00-arimugam.md: section_order ${sourceOrder} != 0`);
    if (nfc(ta.fm.section_title) !== nfc("அறிமுகம்")) throw new Error(`00-arimugam.md: Tamil section_title "${ta.fm.section_title}" != அறிமுகம்`);
    if (en.fm.section_title !== "Introduction") throw new Error(`00-introduction.md: English section_title "${en.fm.section_title}" != Introduction`);
  }

  allJoins.push(...ta.joins.map((j) => ({ ...j, unit: taFile })));
  sections.push({
    order: i + 1, // sequential reader order 1..52 (Introduction = 1)
    sourceOrder,
    chapterNumber: chapterNo,
    slug: taFile.replace(/^\d\d-/, "").replace(/\.md$/, ""),
    titleTa: isIntro ? "அறிமுகம்" : `அத்தியாயம் ${chapterNo}`,
    titleEn: isIntro ? "Introduction" : `Chapter ${chapterNo}`,
    sourceScansTa: ta.fm.source_scans,
    sourceScansEn: en.fm.source_scans,
    isEmbeddedSequence: false,
    titleIsPrintedHeading: false,
    carriesArchiveSectionLabel: false,
    unitNumberTa: isIntro ? null : String(chapterNo),
    unitNumberEn: isIntro ? null : String(chapterNo),
    isIntroduction: isIntro,
    tamil: { blocks: ta.blocks },
    english: { blocks: en.blocks, notes: en.notes },
  });
}

// Order proof: Introduction first, then chapters 1..51 exactly once, in numeric order.
if (!sections[0].isIntroduction) throw new Error("first routable unit is not the Introduction");
const chapterSeq = sections.slice(1).map((s) => s.chapterNumber);
const expected = Array.from({ length: 51 }, (_, k) => k + 1);
if (JSON.stringify(chapterSeq) !== JSON.stringify(expected)) throw new Error(`chapter sequence is not 1..51 exactly once: got ${chapterSeq.join(",")}`);

// Cross-page joins, deduped and ordered.
const joins = [];
for (const j of allJoins) {
  const ex = joins.find((x) => x.fromScan === j.fromScan && x.toScan === j.toScan);
  if (ex) { if (!ex.evidence.includes(j.evidence)) ex.evidence = `${ex.evidence} | ${j.evidence}`; }
  else joins.push({ fromScan: j.fromScan, toScan: j.toScan, evidence: j.evidence });
}
joins.sort((a, b) => a.fromScan - b.fromScan || a.toScan - b.toScan);
const FRAGMENT_EVIDENCE = /`[^`]+`\s*\+\s*`[^`]+`/;
for (const j of joins) { j.evidenceKind = FRAGMENT_EVIDENCE.test(j.evidence) ? "page-edge-fragments" : "narrative-continuity"; j.hasInlineMarker = true; }

// ── Excluded paratext, represented (not silently dropped) ─────────────────────────────────────────
const fmTa = frontMatter(readText(path.join(TA_DIR, "front-matter.md")));
const colTa = frontMatter(readText(path.join(TA_DIR, "99-printer-colophon.md")));
const colEn = frontMatter(readText(path.join(EN_DIR, "99-printer-colophon.md")));
const colophonTa = colTa.body.replace(/<!--[\s\S]*?-->/g, "").trim();
const colophonEn = colEn.body.replace(/<!--[\s\S]*?-->/g, "").trim();
const checkpointCount = fs.existsSync(path.join(TA_DIR, "checkpoints"))
  ? fs.readdirSync(path.join(TA_DIR, "checkpoints")).filter((f) => /\.md$/.test(f)).length
  : 0;

// Locked exclusions the reading body must never contain.
const EXCLUDED = [
  ["translator's-note label", "**Translator's note:**"],
  ["source-damage provenance label", "**Source-damage provenance:**"],
  ["provenance comment", "<!-- source"],
  ["structural chapter comment", "<!-- Chapter"],
];
{
  const body = sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of EXCLUDED) if (body.includes(needle)) throw new Error(`reading body contains locked-excluded material (${label}): ${JSON.stringify(needle)}`);
  // The colophon and front-matter must be absent from the routable body.
  if (body.includes(colophonTa)) throw new Error("printer colophon text leaked into the reading body");
}

// ── Assemble ─────────────────────────────────────────────────────────────────────────────────────
const count = (sel) => sections.reduce((n, s) => n + sel(s), 0);
// Scan numbers come only from the range itself, never from incidental digits in a parenthetical
// note like "(chapter-1 portion)".
const allScanNums = sections.flatMap((s) => [...String(s.sourceScansTa).replace(/\([^)]*\)/g, "").matchAll(/\d+/g)].map((m) => Number(m[0])));
const bodyScans = { from: Math.min(...allScanNums), to: Math.max(...allScanNums) };

const structure = {
  unitKindTa: "மூலத்தில் அச்சிடப்பட்ட அத்தியாயங்கள்",
  unitKindEn: "source-printed chapters",
  unitNounTa: "அத்தியாயம்",
  unitNounEn: "Chapter",
  introUnitTa: "அறிமுகம்",
  introUnitEn: "Introduction",
  noteTa:
    "இது ஒரு தொடர்ச்சியான நாவல்: ஒரு அறிமுகத்தையும், அதைத் தொடர்ந்து மூலத்தில் அச்சிடப்பட்ட 51 அத்தியாயங்களையும் கொண்டது. இந்த அத்தியாயங்கள் காப்பகம் உருவாக்கிய பிரிவுகள் அல்ல; மூல நூலின் அத்தியாயங்களே.",
  noteEn:
    "This is a continuous novel: an Introduction (அறிமுகம்) followed by the 51 chapters printed in the source itself. These are the source's own printed chapters, not archive-invented reading divisions.",
};

const novel = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-novels",
  sourcePath: `works/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  shelf: "fiction",
  readerStructure: "novel",
  subtype: "novel",
  title: { ta: "புதையல்", en: "Treasure" },
  author: { ta: "கலைஞர் மு. கருணாநிதி, எம். எல். ஏ.", en: "Kalaignar M. Karunanidhi, M.L.A." },
  edition: {
    publisherTa: "அன்புப் பதிப்பகம்",
    placeTa: "பொறையார்",
    districtTa: "தஞ்சை மாவட்டம்",
    printerTa: "அன்பு அச்சகம், பொறையார்",
  },
  structure,
  editionSummaryTa: "அன்புப் பதிப்பகம், பொறையார் (தஞ்சை மாவட்டம்)",
  editionSummaryEn: "published by Anbu Pathippagam, Poraiyar (Thanjavur district)",
  readingUnitKind: "source-chapters",
  sections,
  sectionCount: sections.length,
  bodyScans,
};

const provenance = {
  workId: SLUG,
  sourceRepo: novel.sourceRepo,
  sourcePath: novel.sourcePath,
  sourceCommit: SRC_COMMIT,
  source: {
    titleTa: novel.title.ta,
    titleEn: novel.title.en,
    authorTa: novel.author.ta,
    scanFilename: SCAN_FILENAME,
    scanSha256: SCAN_SHA256,
    scanSha256Note: "The source explicitly records the full-PDF SHA-256 as pending exact byte-level calculation; it is NOT invented here. The source PDF is not vendored.",
    scanFileSizeBytes: Number(SCAN_SIZE.replace(/,/g, "")),
    scanFileSizeNote: "Previously-recorded attached full-source size, carried verbatim from the source metadata.",
    scanTotalPages: SCAN_PAGES,
    pageRecordsVerified: "448 / 448 canonical page records; 446 verified/completed, 2 needs-review (scans 223–224 physical loss)",
    sourceAudit: "assembled Tamil narrative continuous through scan 447 / printed 443; two Part-005 physical-loss qualifications (scans 223–224)",
    assembledLayer: "assembled Tamil reading layer derived only from the audited page records",
    sourcePdfCommitted: false,
    publisherTa: "அன்புப் பதிப்பகம், பொறையார் :: தஞ்சை மாவட்டம்",
    printerTa: "அன்பு அச்சகம், பொறையார்",
    printedPageNumbering:
      "Printed page numbers are recorded only where a scan shows one; where none is printed the page map records `—` and this integration carries `printedPage: null`. A number is never inferred from sequence.",
    bodyScans: `${bodyScans.from}–${bodyScans.to}`,
    structureNote:
      "A continuous novel of an Introduction (அறிமுகம், scans 7–12) followed by 51 source-printed chapters, ending at scan 447 / printed 443. Scan 448 is a separately printed printer colophon (back matter). There is NO embedded film-sequence in this work.",
    paratextExcluded: {
      note: "Canonical paratext kept OUT of the literary [section] namespace but represented here so it is never silently dropped.",
      frontMatter: { file: "sections/front-matter.md", sourceScans: fmTa.fm.source_scans, contains: "cover/title/publication matter, publisher note, and the copy-specific Meykandar-style gift inscription; not one of the novel's literary reading sections" },
      printerColophon: { file: "sections/99-printer-colophon.md", sourceScans: colTa.fm.source_scans, ta: colophonTa, en: colophonEn, note: "scan 448 back matter; represented as source/back-matter provenance, never a literary [section]" },
      checkpoints: { count: checkpointCount, note: "provenance witnesses only; never literary reader text or routes" },
      englishApparatus: "translations/en/RELEASE_REPORT.md, PROGRESS.md, PART_*_REVIEW.md, PART_*_ENGLISH_CHECK.md, TRANSLATION_PLAN.md, TRANSLATION_REVIEW.md, GLOSSARY.md, README.md — release/audit/workflow evidence only; never literary reader text or routes",
    },
    lockedExclusions: [
      "sections/front-matter.md (scans 1–6) — cover, title, publication and publisher-note matter and the copy-specific gift inscription",
      "sections/99-printer-colophon.md (scan 448) — separately printed printer colophon, back matter",
      "sections/checkpoints/** — provenance witnesses only",
      "the English translations/en release/audit/workflow documentation (RELEASE_REPORT.md and the PART_* review/check files, PROGRESS, PLAN, GLOSSARY, README)",
      "the assembled layer's own provenance comments; the English layer's labelled translator's-note and source-damage-provenance blockquotes (carried outside the reading body)",
    ],
  },
  english: {
    kind: "project-created",
    status: "whole-work English VERIFIED",
    batches: "Parts 001–010 reviewed; per-part English checks recorded",
    bodyCoverage: "English body-text coverage complete for the Introduction and 51 chapters (scans 7–447)",
    bilingualAlignment: "final bilingual review recorded per part; two Part-005 physical-loss spans (scans 223–224) explicitly qualified",
    releaseReadiness: "RELEASE-READY WITH TWO PART-005 PHYSICAL-LOSS QUALIFICATIONS (an editorial/archival status, not a rights determination)",
    translatorNotesSeparated:
      "English translator's-note and source-damage-provenance blockquotes are carried OUTSIDE the reading body and rendered in a separate, clearly-labelled area — never as Kalaignar's prose.",
  },
  archiveDerived: {
    sections: sections.length,
    literaryUnits: { introduction: 1, chapters: sections.length - 1 },
    tamilBlocks: count((s) => s.tamil.blocks.length),
    englishBlocks: count((s) => s.english.blocks.length),
    tamilParagraphs: count((s) => s.tamil.blocks.filter((b) => b.kind === "paragraph").length),
    englishParagraphs: count((s) => s.english.blocks.filter((b) => b.kind === "paragraph").length),
    tamilHeadings: count((s) => s.tamil.blocks.filter((b) => b.kind === "heading").length),
    englishHeadings: count((s) => s.english.blocks.filter((b) => b.kind === "heading").length),
    printedHeadingsInSource: [],
    sectionsWithArchiveOnlyTitle: 0,
    ornaments: count((s) => [...s.tamil.blocks, ...s.english.blocks].filter((b) => b.kind === "ornament").length),
    tamilBlocksWithLineBreaks: count((s) => s.tamil.blocks.filter((b) => b.hasLineBreaks).length),
    englishBlocksWithLineBreaks: count((s) => s.english.blocks.filter((b) => b.hasLineBreaks).length),
    translatorNotes: count((s) => s.english.notes.length),
    tamilBlocksWithPerBlockScan: count((s) => s.tamil.blocks.filter((b) => b.sourcePages.length > 0).length),
    englishBlocksWithPerBlockScan: count((s) => s.english.blocks.filter((b) => b.sourcePages.length > 0).length),
    perBlockScanNote:
      "Per-block scan provenance is carried wherever the assembled layer places a per-run `<!-- source: scan N … -->` marker; otherwise a block's `sourcePages` is left empty and the section's front-matter scan range remains authoritative. No scan is inferred.",
    sourceEstablishedJoins: joins.length,
    joins,
    embeddedSequenceSections: 0,
    note:
      "Derived structure only. The 448 canonical `pages/` records remain the controlling archival text; this integration reads the archive's own assembled reading layer. Paragraph and chapter structure are carried verbatim — never re-split, never merged — and no source wording, punctuation, spacing or historical spelling was normalized (byte-faithful).",
    joinNote:
      "Cross-page continuities recorded by the assembled layer are carried verbatim as join provenance and stripped from display text; this integration never invents a join.",
    provenanceGranularity:
      "Block-level scan provenance from the assembled layer's own trailing `<!-- source: … -->` markers where present; section-level scan coverage from each unit's front matter otherwise.",
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
      "This is the PRESENT project-level rights status of Kalaignar's underlying novel. The edition's own publisher and printer lines are edition facts, not statements about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored novel. It does NOT extend to the edition's publisher/imprint matter, the printer's material, or the library's stamps and accession marks.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    archivalStatusNote:
      "The source repository's release-readiness status is an editorial/archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },
  notes: [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. The source records its full-PDF SHA-256 as pending, so no hash is asserted; identity travels as filename + previously-recorded byte size + scan count.",
    "This is ONE continuous novel of an Introduction and 51 source-printed chapters. There is NO embedded film-sequence and NO separate work.",
    "Front matter (scans 1–6) and the printer colophon (scan 448) are canonical paratext, kept OUT of the literary [section] namespace and represented only as source/provenance; checkpoints and the English release/audit/workflow files are apparatus and are never reader text.",
    "The body covers scans 7–447 (printed through 443). Two Part-005 spans (scans 223–224) contain physically missing source regions and remain explicitly qualified in the source; that source state is reported, not altered.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "novel.json"), JSON.stringify(novel, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

const d = provenance.archiveDerived;
console.log("novel:", SLUG);
console.log("routable units:", d.sections, "(1 introduction +", d.sections - 1, "chapters)");
console.log("Tamil  blocks", d.tamilBlocks, "| paragraphs", d.tamilParagraphs, "| headings", d.tamilHeadings);
console.log("English blocks", d.englishBlocks, "| paragraphs", d.englishParagraphs, "| headings", d.englishHeadings, "| notes", d.translatorNotes);
console.log("ornaments:", d.ornaments, "| joins:", d.sourceEstablishedJoins, "| body scans:", provenance.source.bodyScans);
console.log("per-block scan attribution: Tamil", d.tamilBlocksWithPerBlockScan, "/", d.tamilBlocks, "| English", d.englishBlocksWithPerBlockScan, "/", d.englishBlocks);
console.log("colophon (ta):", JSON.stringify(colophonTa), "| checkpoints:", checkpointCount);
console.log("novel.json sha256:", sha256(readText(path.join(OUT, "novel.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
