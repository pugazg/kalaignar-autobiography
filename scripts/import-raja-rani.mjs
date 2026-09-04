#!/usr/bin/env node
// Deterministic ராஜா ராணி / Raja Rani import — Wave 5 P1.
//
//   node scripts/import-raja-rani.mjs <kalaignar-cinema-works-clone> <commit-sha>
//
// Consumes ONLY the pinned, verified Raja Rani derivatives from
// pugazg/kalaignar-cinema-works at one approved commit. Nothing reaches the network.
//
// Raja Rani is a full dialogue/screenplay booklet with 11 numbered songs. Facts
// that must never be flattened:
//   * the booklet prints NO numbered screenplay scenes. The 58 scene segments are
//     archival/editorial NAVIGATION only — never "scene as printed" or a source
//     scene number. (Numbered songs 1–11 ARE real source numbering.)
//   * 1,071 immutable dialogue records; the deleted duplicate IDs
//     s055-d026…s055-d030 must never reappear;
//   * the PDF-74 `K. N. சங்கரன்` ownership/library stamp is not canonical text;
//   * song authorship tiers are frozen: 5 later-anthology Kalaignar-attributed,
//     6 unresolved — the reader must not upgrade either tier;
//   * the scene-58 ↔ song-11 performance link stays review-level.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2];
const COMMIT = process.argv[3];
if (!SRC || !COMMIT) {
  console.error("usage: node scripts/import-raja-rani.mjs <clone-dir> <commit-sha>");
  process.exit(2);
}
const die = (m) => { console.error(`import-raja-rani: ${m}`); process.exit(1); };

const APPROVED_COMMIT = "75b22046490f92df3bbf641a69a59fcad7b91bde";
const WORK_TREE = "abbc5cb8890e67ad2b18e0ab50e5af6f678bbd06";
const PDF = {
  filename: "TVA_BOK_0017188_ராஜா_ராணி.pdf",
  sha256: "26ecc026b89deafac94bb3b107ee7c5f361c68796c4a1cdf4d01ad7c1c0d31a4",
  pages: 80,
  canonicalSourcePages: 79,
};
const READING_ROOM_SHA = "ab1058cb5a22ba78e68938f50efc586cc53eb07ef544bdf3919bb3c4b8c46c9b";
const EXPECT = {
  scenes: 58, sourceNumberedScenes: 0, screenplayUnits: 1236, immutableDialogueLinks: 1071,
  sourceUnlabelledSpokenUnits: 19, crossPageScreenplayUnits: 15, performanceOccurrenceLinks: 4,
  numberedSongs: 11, songSections: 67, songLineCues: 181, crossPageNumberedSongs: 4,
  songAnthologyAttributed: 5, songUnresolved: 6, songPerformanceLinksVerified: 3, songPerformanceLinksReview: 1,
  unitKinds: { dialogue: 1090, "stage-direction": 137, "performance-cue": 4, "written-text": 5 },
};
const DELETED_IDS = ["s055-d026", "s055-d027", "s055-d028", "s055-d029", "s055-d030"];
const PDF74_STAMP = "K. N. சங்கரன்";

if (COMMIT !== APPROVED_COMMIT) die(`commit ${COMMIT} != approved ${APPROVED_COMMIT}`);
let head;
try { head = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch { die(`${SRC} is not a git clone`); }
if (head !== APPROVED_COMMIT) die(`clone HEAD ${head} != approved ${APPROVED_COMMIT}`);
const workTree = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD:works/raja-rani"], { encoding: "utf8" }).trim();
if (workTree !== WORK_TREE) die(`work tree ${workTree} != approved ${WORK_TREE}`);

const nfc = (s) => s.normalize("NFC");
const W = path.join(SRC, "works", "raja-rani");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const rrBuf = fs.readFileSync(path.join(W, "integrations/reading-room/reading-room.json"));
if (sha256(rrBuf) !== READING_ROOM_SHA) die(`reading-room.json hash drift`);
const rr = JSON.parse(rrBuf.toString("utf8"));
const C = rr.work.counts;

// ── NUMBERED SONGS 1–11 (real source numbering) ────────────────────────────────
let songSectionTotal = 0, songLineCueTotal = 0, songAnthology = 0, songUnresolved = 0, crossPageSongs = 0, songLinksVerified = 0, songLinksReview = 0;
const numberedSongs = rr.numbered_songs.map((s) => {
  const sections = s.sections.map((sec) => {
    songSectionTotal++;
    const linePairs = sec.line_pairs.map((lp) => ({ id: lp.id, tamil: nfc(lp.tamil), english: nfc(lp.english) }));
    songLineCueTotal += linePairs.length;
    return { ordinal: sec.ordinal, sourceLabel: sec.source_label === null ? null : nfc(sec.source_label), englishLabel: sec.english_label === null ? null : nfc(sec.english_label), pdfPages: sec.pdf_pages, linePairs };
  });
  if (s.pdf_pages.length > 1) crossPageSongs++;
  if (s.authorship_status === "anthology-attributed") songAnthology++;
  else if (s.authorship_status === "unresolved") songUnresolved++;
  for (const pl of s.performance_links || []) { if (pl.status === "verified") songLinksVerified++; else if (pl.status === "review") songLinksReview++; }
  return {
    songId: s.song_id,
    translationId: s.translation_id,
    numberedSongNumber: s.numbered_song_number, // 1..11 real source numbering
    tamilTitle: nfc(s.tamil_title),
    englishTitle: nfc(s.english_title),
    authorshipStatus: s.authorship_status,       // anthology-attributed | unresolved (never upgraded)
    lyricistTa: s.lyricist_ta === null ? null : nfc(s.lyricist_ta),
    performanceLinks: (s.performance_links || []).map((pl) => ({ ...pl })),
    pdfPages: s.pdf_pages,
    sections,
  };
});

// ── 58 ARCHIVAL SCENE SEGMENTS (navigation only — NOT source scene numbers) ────
let unitTotal = 0, immutableLinks = 0, unlabelledSpoken = 0, crossPageUnits = 0, perfOccurrenceLinks = 0;
const kindCount = {};
const screenplayScenes = rr.screenplay_scenes.map((sc) => {
  if (sc.source_scene_number !== null) die(`scene ${sc.scene_id} claims a source scene number`);
  const tamilText = nfc(sc.tamil_text);
  if (tamilText.includes(PDF74_STAMP)) die(`PDF-74 ownership stamp present in canonical scene ${sc.scene_id}`);
  const englishUnits = sc.english_units.map((u) => {
    // An immutable dialogue link is carried by source_record_id (e.g. raja-rani-s001-d001);
    // the deleted T055 duplicates must never reappear on any unit id or record link.
    if (DELETED_IDS.some((d) => (u.id || "").includes(d) || (u.source_record_id || "").includes(d))) die(`deleted duplicate id referenced in ${sc.scene_id}`);
    unitTotal++;
    kindCount[u.kind] = (kindCount[u.kind] || 0) + 1;
    if (u.kind === "dialogue") {
      if (u.source_record_id) immutableLinks++;   // 1071 immutable dialogue links
      if (u.speaker_label === null) unlabelledSpoken++; // 19 source-unlabelled spoken units
    }
    if (u.kind === "performance-cue") perfOccurrenceLinks++;
    if (Array.isArray(u.page_provenance) && u.page_provenance.length > 1) crossPageUnits++;
    return {
      id: u.id,
      kind: u.kind,
      speakerLabel: u.speaker_label === null ? null : nfc(u.speaker_label),
      sourceRecordId: u.source_record_id,
      sourceOccurrenceId: u.source_occurrence_id,
      pageProvenance: u.page_provenance,
      englishText: nfc(u.english_text),
      englishLines: u.english_lines === null || u.english_lines === undefined ? null : u.english_lines.map(nfc),
    };
  });
  return {
    sceneId: sc.scene_id,
    archivalSceneOrdinal: sc.archival_scene_ordinal, // 1..58, navigation only
    sourceSceneNumber: sc.source_scene_number,       // null — booklet prints none
    tamilText,
    englishUnits,
  };
});

// ── SEMANTIC ASSERTIONS ────────────────────────────────────────────────────────
const A = (label, actual, expected) => { if (actual !== expected) die(`${label}: ${actual} != ${expected}`); };
A("scenes", screenplayScenes.length, EXPECT.scenes);
A("source-numbered scenes", screenplayScenes.filter((s) => s.sourceSceneNumber !== null).length, EXPECT.sourceNumberedScenes);
A("screenplay units", unitTotal, EXPECT.screenplayUnits);
A("immutable dialogue links", immutableLinks, EXPECT.immutableDialogueLinks);
A("source-unlabelled spoken units", unlabelledSpoken, EXPECT.sourceUnlabelledSpokenUnits);
A("cross-page screenplay units", crossPageUnits, EXPECT.crossPageScreenplayUnits);
A("performance-cue occurrence links", perfOccurrenceLinks, EXPECT.performanceOccurrenceLinks);
A("numbered songs", numberedSongs.length, EXPECT.numberedSongs);
A("song sections", songSectionTotal, EXPECT.songSections);
A("song line-cues", songLineCueTotal, EXPECT.songLineCues);
A("song anthology-attributed", songAnthology, EXPECT.songAnthologyAttributed);
A("song unresolved", songUnresolved, EXPECT.songUnresolved);
A("cross-page numbered songs", crossPageSongs, EXPECT.crossPageNumberedSongs);
A("song performance links verified", songLinksVerified, EXPECT.songPerformanceLinksVerified);
A("song performance links review", songLinksReview, EXPECT.songPerformanceLinksReview);
for (const [k, n] of Object.entries(EXPECT.unitKinds)) A(`unit kind ${k}`, kindCount[k] || 0, n);
// Composition self-consistency: reading-room counts must equal what we recomputed.
A("rr screenplay_units", C.screenplay_units, unitTotal);
A("rr immutable_dialogue_links", C.immutable_dialogue_links, immutableLinks);
A("rr numbered_song_line_cues", C.numbered_song_line_cues, songLineCueTotal);
// Numbering-semantics invariant, straight from the source policy.
if (rr.navigation.screenplay_scene_numbers_are_source_numbers !== false || rr.navigation.screenplay_scene_navigation_is_editorial !== true) die(`navigation claims source scene numbering`);

const reader = {
  work: {
    slug: "raja-rani",
    kind: rr.work.kind,
    titleTa: nfc(rr.work.title_ta),
    titleEn: nfc(rr.work.presentation_title_en),
    titleEnIsEditorial: rr.work.presentation_title_en_is_editorial,
    languages: rr.work.languages,
  },
  navigation: {
    primarySections: rr.navigation.primary_sections,                                 // ["numbered-songs","screenplay-scenes"]
    numberedSongOrderIsSourceNumbering: true,
    screenplaySceneNumbersAreSourceNumbers: rr.navigation.screenplay_scene_numbers_are_source_numbers, // false
    screenplaySceneNavigationIsEditorial: rr.navigation.screenplay_scene_navigation_is_editorial,       // true
  },
  numberedSongs,
  screenplayScenes,
  counts: {
    scenes: EXPECT.scenes, sourceNumberedScenes: EXPECT.sourceNumberedScenes, screenplayUnits: EXPECT.screenplayUnits,
    immutableDialogueLinks: EXPECT.immutableDialogueLinks, sourceUnlabelledSpokenUnits: EXPECT.sourceUnlabelledSpokenUnits,
    crossPageScreenplayUnits: EXPECT.crossPageScreenplayUnits, numberedSongs: EXPECT.numberedSongs,
    songSections: EXPECT.songSections, songLineCues: EXPECT.songLineCues, crossPageNumberedSongs: EXPECT.crossPageNumberedSongs,
    songAnthologyAttributed: EXPECT.songAnthologyAttributed, songUnresolved: EXPECT.songUnresolved,
    songPerformanceLinksVerified: EXPECT.songPerformanceLinksVerified, songPerformanceLinksReview: EXPECT.songPerformanceLinksReview,
    unitKinds: EXPECT.unitKinds,
  },
};

const OUT = path.join(process.cwd(), "public/data/cinema/raja-rani");
fs.mkdirSync(OUT, { recursive: true });
const writeJSON = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 2) + "\n");
writeJSON("reader.json", reader);
const readerSha = sha256(fs.readFileSync(path.join(OUT, "reader.json")));

const provenance = {
  slug: "raja-rani",
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourceCommit: APPROVED_COMMIT,
  repoTree: "43d28d85587294279e4d7fe901b143f5ec469194",
  workTree: WORK_TREE,
  sourcePath: "works/raja-rani",
  pdf: PDF,
  readingRoomPayloadSha256: READING_ROOM_SHA,
  payloadMode: "source-linked-composition",
  integrationQaStatus: rr.integration_status,
  englishProvenance: { status: "complete-verified", kind: "project-created", titleEnIsEditorial: true },
  counts: reader.counts,
  authorship: { anthologyAttributed: EXPECT.songAnthologyAttributed, unresolved: EXPECT.songUnresolved, rule: "song authorship tiers are frozen; the reader must not upgrade either tier" },
  structuralExceptions: [
    { id: "archival-scene-navigation-not-source-numbering", rule: "the booklet prints no numbered screenplay scenes; the 58 scene segments are archival/editorial navigation only" },
    { id: "deleted-t055-duplicate-ids", rule: "dialogue ids s055-d026..s055-d030 were deleted duplicates and must never return", ids: DELETED_IDS },
    { id: "pdf-74-ownership-stamp-excluded", rule: "the PDF-74 K. N. சங்கரன் ownership/library stamp is not canonical screenplay text" },
    { id: "scene-58-song-11-review-level", rule: "the scene-58 to song-11 performance link remains review-level and must not be upgraded" },
  ],
  rights: { publicationYear: null, editionStatement: null, rightsStatus: null, note: "no year/edition/rights promoted from the source" },
  readerSha256: readerSha,
};
writeJSON("provenance.json", provenance);

console.log(`import-raja-rani — OK`);
console.log(`  songs 11 · song sections 67 · song line-cues 181 · scenes 58 (archival navigation, 0 source-numbered)`);
console.log(`  screenplay units 1236 (dialogue 1090 / stage 137 / cue 4 / text 5) · immutable dialogue links 1071 · unlabelled spoken 19`);
console.log(`  song authorship: 5 anthology-attributed / 6 unresolved · scene58-song11 review-level`);
console.log(`  reader.json ${readerSha}`);
