#!/usr/bin/env node
// Deterministic அம்மையப்பன் / Ammayappan import — Wave 6 P1 (Batch 1).
//
//   node scripts/import-ammaiyappan.mjs <kalaignar-cinema-works-clone> <commit-sha>
//
// Consumes ONLY the pinned, QA-PASS Ammayappan Reading Room integration payload from
// pugazg/kalaignar-cinema-works at one approved commit. Nothing reaches the network. It makes the
// source repository's already-approved canonical text machine-consumable — it never reinterprets,
// normalizes or reconstructs it.
//
// Facts that must never be flattened:
//   * the 1954 booklet prints NO numbered screenplay scenes. The 63 scene segments are
//     archival/editorial NAVIGATION only — never a source scene number.
//   * this is the full screenplay/dialogue booklet, NOT the Film Songs anthology.
//   * FIVE retained song/performance occurrences (ammaiyappan-song-001..005) are in-scene occurrence
//     references, NOT standalone Kalaignar-authored lyrics; the reader must not upgrade them.
//   * no publication year/edition/rights is promoted; the printed 1954 credit/copyright line is a
//     source witness only.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2];
const COMMIT = process.argv[3];
if (!SRC || !COMMIT) {
  console.error("usage: node scripts/import-ammaiyappan.mjs <clone-dir> <commit-sha>");
  process.exit(2);
}
const die = (m) => { console.error(`import-ammaiyappan: ${m}`); process.exit(1); };

const APPROVED_COMMIT = "c33eb41db3670b097d1f318f66352dde672b5f37";
const REPO_TREE = "c244bba49161277e7cbeec535b1d6a49777dc20b";
const WORK_TREE = "31d0d1219f76f6dc0cb068f8926d644d0cfd5573";
const PDF = {
  filename: "TVA_BOK_0064230_அம்மையப்பன்.pdf",
  sha256: "eda6468a57022b418f44851a0013b090469bc6f4be44a682487800658771720d",
  pages: 111,
  mainTextPdfPages: "5-109",
};
const READING_ROOM_SHA = "f00efb816edf08b43702a3a1a9d71ed9cc54fd1a803b8881bc6e2c6466de1f8c";
const EXPECT = {
  scenes: 63, sourceNumberedScenes: 0, englishUnits: 1210, dialogueSourceLinks: 1025,
  stageActionUnits: 181, songReferenceUnits: 3, japaUnits: 1, crossPageUnits: 28,
  occurrenceIdentities: 5, occurrenceSourceSpanLinks: 7,
  unitKinds: { dialogue: 1025, "stage-direction": 181, "song-reference": 3, japa: 1 },
};

if (COMMIT !== APPROVED_COMMIT) die(`commit ${COMMIT} != approved ${APPROVED_COMMIT}`);
let head;
try { head = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch { die(`${SRC} is not a git clone`); }
if (head !== APPROVED_COMMIT) die(`clone HEAD ${head} != approved ${APPROVED_COMMIT}`);
const workTree = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD:works/ammaiyappan"], { encoding: "utf8" }).trim();
if (workTree !== WORK_TREE) die(`work tree ${workTree} != approved ${WORK_TREE}`);

const nfc = (s) => (s === null || s === undefined ? s : String(s).normalize("NFC"));
const W = path.join(SRC, "works", "ammaiyappan");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const rrBuf = fs.readFileSync(path.join(W, "integrations/reading-room/reading-room.json"));
if (sha256(rrBuf) !== READING_ROOM_SHA) die(`reading-room.json hash drift`);
const rr = JSON.parse(rrBuf.toString("utf8"));

// Numbering-semantics invariant, straight from the source policy.
if (rr.navigation.screenplay_scene_numbers_are_source_numbers !== false || rr.navigation.screenplay_scene_navigation_is_editorial !== true) {
  die(`navigation claims source scene numbering`);
}

let unitTotal = 0, dialogueLinks = 0, crossPageUnits = 0;
const kindCount = {};
const occurrenceIds = new Set();
let occurrenceSpanLinks = 0;

const screenplayScenes = rr.screenplay_scenes.map((sc) => {
  if (sc.source_scene_number !== null) die(`scene ${sc.scene_id} claims a source scene number`);
  if (sc.archival_navigation_only !== true) die(`scene ${sc.scene_id} is not archival-navigation-only`);
  const tamilText = nfc(sc.tamil_text);
  const englishUnits = sc.english_units.map((u) => {
    unitTotal++;
    kindCount[u.kind] = (kindCount[u.kind] || 0) + 1;
    if (u.kind === "dialogue" && u.source_record_id) dialogueLinks++;
    if (u.source_occurrence_id) { occurrenceIds.add(u.source_occurrence_id); occurrenceSpanLinks++; }
    if (Array.isArray(u.page_provenance) && u.page_provenance.length > 1) crossPageUnits++;
    return {
      id: u.id,
      kind: u.kind,
      speakerLabel: u.speaker_label === null ? null : nfc(u.speaker_label),
      sourceRecordId: u.source_record_id ?? null,
      sourceOccurrenceId: u.source_occurrence_id ?? null,
      pageProvenance: u.page_provenance,
      englishText: nfc(u.english_text),
      englishLines: u.english_lines === null || u.english_lines === undefined ? null : u.english_lines.map(nfc),
    };
  });
  return {
    sceneId: sc.scene_id,
    archivalSceneOrdinal: sc.archival_scene_ordinal, // 1..63, navigation only
    sourceSceneNumber: sc.source_scene_number,       // null — booklet prints none
    sourceHeadingTa: sc.source_heading_ta === null || sc.source_heading_ta === undefined ? null : nfc(sc.source_heading_ta),
    pdfPages: sc.pdf_pages,
    printedPages: sc.printed_pages,
    tamilText,
    englishUnits,
  };
});

// ── SEMANTIC ASSERTIONS ────────────────────────────────────────────────────────
const A = (label, actual, expected) => { if (actual !== expected) die(`${label}: ${actual} != ${expected}`); };
A("scenes", screenplayScenes.length, EXPECT.scenes);
A("source-numbered scenes", screenplayScenes.filter((s) => s.sourceSceneNumber !== null).length, EXPECT.sourceNumberedScenes);
A("english units", unitTotal, EXPECT.englishUnits);
A("dialogue source links", dialogueLinks, EXPECT.dialogueSourceLinks);
A("stage-direction units", kindCount["stage-direction"] || 0, EXPECT.stageActionUnits);
A("song-reference units", kindCount["song-reference"] || 0, EXPECT.songReferenceUnits);
A("japa units", kindCount["japa"] || 0, EXPECT.japaUnits);
A("cross-page units", crossPageUnits, EXPECT.crossPageUnits);
A("occurrence identities", occurrenceIds.size, EXPECT.occurrenceIdentities);
A("occurrence source-span links", occurrenceSpanLinks, EXPECT.occurrenceSourceSpanLinks);
for (const [k, n] of Object.entries(EXPECT.unitKinds)) A(`unit kind ${k}`, kindCount[k] || 0, n);
// Composition self-consistency: reading-room counts must equal what we recomputed.
A("rr english_units", rr.work.counts.english_units, unitTotal);
A("rr screenplay_scenes", rr.work.counts.screenplay_scenes, screenplayScenes.length);
A("rr dialogue_source_links", rr.work.counts.dialogue_source_links, dialogueLinks);
A("rr occurrence_identities", rr.work.counts.occurrence_identities, occurrenceIds.size);

const reader = {
  work: {
    slug: "ammaiyappan",
    kind: rr.work.kind, // film-screenplay
    titleTa: nfc(rr.work.title_ta),
    titleEn: nfc(rr.work.presentation_title_en),
    titleEnIsEditorial: rr.work.presentation_title_en_is_editorial,
    languages: rr.work.languages,
  },
  navigation: {
    primarySections: rr.navigation.primary_sections, // ["screenplay-scenes"]
    screenplaySceneNumbersAreSourceNumbers: rr.navigation.screenplay_scene_numbers_are_source_numbers, // false
    screenplaySceneNavigationIsEditorial: rr.navigation.screenplay_scene_navigation_is_editorial,       // true
  },
  screenplayScenes,
  counts: {
    scenes: EXPECT.scenes, sourceNumberedScenes: EXPECT.sourceNumberedScenes, englishUnits: EXPECT.englishUnits,
    dialogueSourceLinks: EXPECT.dialogueSourceLinks, stageActionUnits: EXPECT.stageActionUnits,
    songReferenceUnits: EXPECT.songReferenceUnits, japaUnits: EXPECT.japaUnits, crossPageUnits: EXPECT.crossPageUnits,
    occurrenceIdentities: EXPECT.occurrenceIdentities, occurrenceSourceSpanLinks: EXPECT.occurrenceSourceSpanLinks,
    unitKinds: EXPECT.unitKinds,
  },
};

const OUT = path.join(process.cwd(), "public/data/cinema/ammaiyappan");
fs.mkdirSync(OUT, { recursive: true });
const writeJSON = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 2) + "\n");
writeJSON("reader.json", reader);
const readerSha = sha256(fs.readFileSync(path.join(OUT, "reader.json")));

const provenance = {
  slug: "ammaiyappan",
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourceCommit: APPROVED_COMMIT,
  repoTree: REPO_TREE,
  workTree: WORK_TREE,
  sourcePath: "works/ammaiyappan",
  pdf: PDF,
  readingRoomPayloadSha256: READING_ROOM_SHA,
  payloadMode: "source-linked-composition",
  integrationQaStatus: rr.integration_status,
  englishProvenance: { status: "complete-verified", kind: "project-created", titleEnIsEditorial: true },
  counts: reader.counts,
  // Printed source witnesses — recorded, NOT promoted to a present-day determination.
  printedSourceWitnesses: {
    titlePageCredit: { roleTa: "கதை வசனம்", nameTa: "மு. கருணாநிதி" },
    edition: "முதற் பதிப்பு",
    publicationMonthYear: "செப்டம்பர், 1954",
    price: "விலை எட்டணா",
    publisher: "முரசொலி பதிப்பகம்",
    rightsLine: "[ உரிமை பதிவு செய்யப் பட்டிருக்கிறது ]",
  },
  structuralExceptions: [
    { id: "archival-scene-navigation-not-source-numbering", rule: "the booklet prints no numbered screenplay scenes; the 63 scene segments are archival/editorial navigation only" },
    { id: "not-the-film-songs-anthology", rule: "this is the full Ammayappan screenplay/dialogue booklet (TVA_BOK_0064230); it is distinct from the Kalaignar Film Songs anthology and must not be conflated with it" },
    { id: "retained-song-occurrences-not-lyric-authorship", rule: "the 5 retained song/performance occurrences (ammaiyappan-song-001..005) are in-scene occurrence references, not standalone Kalaignar-authored lyrics; do not upgrade" },
  ],
  rights: { publicationYear: null, editionStatement: null, rightsStatus: null, note: "no year/edition/rights promoted from the source; the printed 1954 credit and copyright line are source witnesses only" },
  readerSha256: readerSha,
};
writeJSON("provenance.json", provenance);

console.log(`import-ammaiyappan — OK`);
console.log(`  scenes 63 (archival navigation, 0 source-numbered) · english units 1210 (dialogue 1025 / stage 181 / song-ref 3 / japa 1)`);
console.log(`  dialogue source links 1025 · cross-page units 28 · 5 song occurrences / 7 span links (not lyric authorship)`);
console.log(`  reader.json ${readerSha}`);
