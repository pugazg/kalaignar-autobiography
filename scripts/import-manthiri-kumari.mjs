#!/usr/bin/env node
// Deterministic மந்திரி குமாரி / Manthiri Kumari import — Wave 5 P1.
//
//   node scripts/import-manthiri-kumari.mjs <kalaignar-cinema-works-clone> <commit-sha>
//
// Consumes ONLY the pinned, verified Manthiri Kumari derivatives from
// pugazg/kalaignar-cinema-works at one approved commit and emits the website's
// generated reading data. Nothing reaches the network.
//
// Manthiri Kumari is a compact film booklet — a continuous story summary plus 15
// song/performance blocks — NOT a screenplay. Facts that must never be flattened:
//   * performance ordinals 1–15 are archival source-order navigation, NOT printed
//     source numbering, and there are ZERO source-numbered screenplay scenes;
//   * item-level lyric authorship is 0 verified / 15 unresolved — story/dialogue
//     credit never establishes a lyricist;
//   * exactly ONE block (11, மாட்டுக்கார பையன்) is a confirmed current-anthology
//     witness of kalaignar-song-001; the other 14 are source-only and later
//     anthology text must not repair this booklet;
//   * performance 13 keeps its printed heading `பார்த்திபன்—மந்திரிகுமாரி` while its
//     internal turn labels stay `பார்த்திபன்` / `அமுதவல்லி` — never one identity.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2];
const COMMIT = process.argv[3];
if (!SRC || !COMMIT) {
  console.error("usage: node scripts/import-manthiri-kumari.mjs <clone-dir> <commit-sha>");
  process.exit(2);
}
const die = (m) => { console.error(`import-manthiri-kumari: ${m}`); process.exit(1); };

// ── APPROVED PINS AND EXPECTED SOURCE FACTS (assertions, not configuration) ────
const APPROVED_COMMIT = "75b22046490f92df3bbf641a69a59fcad7b91bde";
const WORK_TREE = "225662fc8f93d91daff0005b348948da6372840b";
const PDF = {
  filename: "TVA_BOK_0026144_மந்திரி_குமாரி.pdf",
  sha256: "a64ac0b5ff4adca75d0860d9d52c5324f93f55da3b060cecb43743d0bbc696ee",
  pages: 14,
};
const READING_ROOM_SHA = "20a0db293b936757e7d01def336252f28543337f319dfae6ad7bf5ae886bab43";
const EXPECT = {
  storySummaryRecords: 1, storySummaryUnits: 13, storySummaryCrossPageUnits: 1,
  performanceBlocks: 15, performanceSections: 52, performanceLineCues: 234,
  crossPagePerformanceBlocks: 7, confirmedAnthologyWitnesses: 1, sourceOnlyInAnthology: 14,
  lyricistsVerified: 0, lyricistsUnresolved: 15,
};

if (COMMIT !== APPROVED_COMMIT) die(`commit ${COMMIT} != approved ${APPROVED_COMMIT}`);
let head;
try { head = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch { die(`${SRC} is not a git clone`); }
if (head !== APPROVED_COMMIT) die(`clone HEAD ${head} != approved ${APPROVED_COMMIT}`);
const workTree = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD:works/manthiri-kumari"], { encoding: "utf8" }).trim();
if (workTree !== WORK_TREE) die(`work tree ${workTree} != approved ${WORK_TREE}`);

const nfc = (s) => s.normalize("NFC");
const W = path.join(SRC, "works", "manthiri-kumari");
const readJSON = (rel) => JSON.parse(fs.readFileSync(path.join(W, rel), "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

// Reading-room composition is a pinned, QA-PASS artifact; verify its hash before use.
const rrBuf = fs.readFileSync(path.join(W, "integrations/reading-room/reading-room.json"));
if (sha256(rrBuf) !== READING_ROOM_SHA) die(`reading-room.json hash drift`);
const rr = JSON.parse(rrBuf.toString("utf8"));

// ── STORY SUMMARY — 13 logical bilingual units, single continuous synopsis ─────
const ssRec = readJSON("translations/story-summary.json");
const ssUnits = ssRec.translation.sections.map((s) => ({
  ordinal: s.ordinal,
  sourcePdfPages: s.source_pdf_pages,
  tamil: nfc(s.source_tamil),
  english: nfc(s.english),
}));
if (ssUnits.length !== EXPECT.storySummaryUnits) die(`story summary units ${ssUnits.length} != ${EXPECT.storySummaryUnits}`);
const storySummary = {
  recordId: rr.story_summary.record_id,
  titleTa: nfc(rr.story_summary.title_ta),
  titleEn: nfc(rr.story_summary.title_en),
  pdfPages: rr.story_summary.pdf_pages,
  logicalUnits: rr.story_summary.logical_units,
  crossPageUnits: rr.story_summary.cross_page_units,
  units: ssUnits,
};

// ── 15 PERFORMANCE BLOCKS — Tamil canonical + aligned English, dispositions ────
let sectionTotal = 0, lineCueTotal = 0, crossPageBlocks = 0, witnessConfirmed = 0, sourceOnly = 0, unresolved = 0;
const performances = rr.performances.map((p) => {
  const num = String(p.source_order).padStart(3, "0");
  const en = readJSON(`translations/performances/${num}.json`);
  const sections = en.translation.sections.map((s) => ({
    ordinal: s.ordinal,
    sourceLabel: s.source_label === null ? null : nfc(s.source_label),
    englishLabel: s.english_label === null ? null : nfc(s.english_label),
    sourcePdfPages: s.source_pdf_pages,
    tamilLines: s.source_tamil_lines.map(nfc),
    englishLines: s.english_lines.map(nfc),
  }));
  sectionTotal += sections.length;
  for (const s of sections) {
    if (s.tamilLines.length !== s.englishLines.length) die(`perf ${num} section ${s.ordinal}: line-cue mismatch ${s.tamilLines.length}/${s.englishLines.length}`);
    lineCueTotal += s.englishLines.length;
  }
  if (p.pdf_pages.length > 1) crossPageBlocks++;
  if (p.cross_witness_status === "confirmed-existing-anthology-witness") witnessConfirmed++;
  else if (p.cross_witness_status === "source-only-in-current-anthology") sourceOnly++;
  if (p.authorship_status === "unresolved") unresolved++;
  return {
    sourceOrder: p.source_order,
    sourceOrderIsPrintedNumbering: p.source_order_is_printed_numbering, // false — archival navigation
    performanceId: p.performance_id,
    translationId: p.translation_id,
    headingTa: nfc(p.heading_ta),
    headingEn: nfc(p.heading_en),
    pdfPages: p.pdf_pages,
    lineCues: p.line_cues,
    authorshipStatus: p.authorship_status,          // "unresolved" for all 15
    crossWitnessStatus: p.cross_witness_status,
    anthologyRecordId: p.anthology_record_id,        // only block 11 -> kalaignar-song-001
    sections,
  };
});

// ── SEMANTIC ASSERTIONS (fail loudly rather than emit a false claim) ───────────
if (performances.length !== EXPECT.performanceBlocks) die(`performances ${performances.length} != ${EXPECT.performanceBlocks}`);
if (sectionTotal !== EXPECT.performanceSections) die(`performance sections ${sectionTotal} != ${EXPECT.performanceSections}`);
if (lineCueTotal !== EXPECT.performanceLineCues) die(`performance line-cues ${lineCueTotal} != ${EXPECT.performanceLineCues}`);
if (crossPageBlocks !== EXPECT.crossPagePerformanceBlocks) die(`cross-page blocks ${crossPageBlocks} != ${EXPECT.crossPagePerformanceBlocks}`);
if (witnessConfirmed !== EXPECT.confirmedAnthologyWitnesses) die(`confirmed anthology witnesses ${witnessConfirmed} != ${EXPECT.confirmedAnthologyWitnesses}`);
if (sourceOnly !== EXPECT.sourceOnlyInAnthology) die(`source-only in anthology ${sourceOnly} != ${EXPECT.sourceOnlyInAnthology}`);
if (unresolved !== EXPECT.lyricistsUnresolved) die(`unresolved lyricists ${unresolved} != ${EXPECT.lyricistsUnresolved}`);
// Block 11 alone carries the confirmed witness, and it points at kalaignar-song-001.
const b11 = performances.find((p) => p.sourceOrder === 11);
if (!b11 || b11.crossWitnessStatus !== "confirmed-existing-anthology-witness" || b11.anthologyRecordId !== "kalaignar-song-001") die(`block 11 witness contract broken`);
if (performances.some((p) => p.sourceOrder !== 11 && p.anthologyRecordId !== null)) die(`a non-block-11 performance claims an anthology witness`);
// No source-numbered scenes anywhere.
if (rr.navigation.source_numbered_scenes !== false || rr.navigation.performance_order_is_source_numbering !== false) die(`navigation claims source scene numbering`);

const reader = {
  work: {
    slug: "manthiri-kumari",
    kind: rr.work.kind, // film-story-song-booklet
    titleTa: nfc(rr.work.title_ta),
    titleEn: nfc(rr.work.presentation_title_en),
    titleEnIsEditorial: rr.work.presentation_title_en_is_editorial,
    storyDialogueCreditAsPrinted: nfc(rr.work.story_dialogue_credit_as_printed),
    languages: rr.work.languages,
  },
  navigation: {
    primarySections: rr.navigation.primary_sections,               // ["story-summary","performances"]
    performanceOrderIsArchivalNavigation: rr.navigation.performance_order_is_archival_navigation, // true
    performanceOrderIsSourceNumbering: rr.navigation.performance_order_is_source_numbering,       // false
    sourceNumberedScenes: rr.navigation.source_numbered_scenes,     // false
  },
  storySummary,
  performances,
  counts: {
    storySummaryRecords: EXPECT.storySummaryRecords,
    storySummaryUnits: EXPECT.storySummaryUnits,
    storySummaryCrossPageUnits: EXPECT.storySummaryCrossPageUnits,
    performanceBlocks: EXPECT.performanceBlocks,
    performanceSections: EXPECT.performanceSections,
    performanceLineCues: EXPECT.performanceLineCues,
    crossPagePerformanceBlocks: EXPECT.crossPagePerformanceBlocks,
    confirmedAnthologyWitnesses: EXPECT.confirmedAnthologyWitnesses,
    sourceOnlyInAnthology: EXPECT.sourceOnlyInAnthology,
    lyricistsVerified: EXPECT.lyricistsVerified,
    lyricistsUnresolved: EXPECT.lyricistsUnresolved,
  },
};

const OUT = path.join(process.cwd(), "public/data/cinema/manthiri-kumari");
fs.mkdirSync(OUT, { recursive: true });
// Stable 2-space JSON with a trailing newline; no timestamps, no clone paths.
const writeJSON = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 2) + "\n");
writeJSON("reader.json", reader);
const readerSha = sha256(fs.readFileSync(path.join(OUT, "reader.json")));

const provenance = {
  slug: "manthiri-kumari",
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourceCommit: APPROVED_COMMIT,
  repoTree: "43d28d85587294279e4d7fe901b143f5ec469194",
  workTree: WORK_TREE,
  sourcePath: "works/manthiri-kumari",
  pdf: PDF,
  readingRoomPayloadSha256: READING_ROOM_SHA,
  payloadMode: rr.payload_mode, // source-linked-composition
  integrationQaStatus: rr.integration_status, // payload-complete-verified
  englishProvenance: { status: "complete-verified", kind: "project-created", titleEnIsEditorial: true },
  counts: reader.counts,
  authorship: { verified: EXPECT.lyricistsVerified, unresolved: EXPECT.lyricistsUnresolved, rule: "story/dialogue credit does not establish item-level lyricists" },
  crossWitness: { confirmed: EXPECT.confirmedAnthologyWitnesses, sourceOnly: EXPECT.sourceOnlyInAnthology, confirmedBlock: 11, confirmedAnthologyRecordId: "kalaignar-song-001", rule: "later anthology text must not repair this booklet" },
  structuralExceptions: [
    { id: "perf-13-heading-label-anomaly", rule: "performance 13 keeps printed heading பார்த்திபன்—மந்திரிகுமாரி while internal turn labels stay பார்த்திபன் / அமுதவல்லி; do not normalize into one identity" },
    { id: "no-source-numbered-scenes", rule: "performance ordinals 1-15 are archival source-order navigation; the booklet prints no screenplay scene numbers" },
  ],
  rights: { publicationYear: null, editionStatement: null, rightsStatus: null, note: "no year/edition/rights promoted from the source" },
  readerSha256: readerSha,
};
writeJSON("provenance.json", provenance);

console.log(`import-manthiri-kumari — OK`);
console.log(`  story summary 1 record / 13 units · performances 15 · sections 52 · line-cues 234`);
console.log(`  witnesses: 1 confirmed (block 11 -> kalaignar-song-001) / 14 source-only · lyricists 0 verified / 15 unresolved`);
console.log(`  reader.json ${readerSha}`);
