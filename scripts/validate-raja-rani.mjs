// Validator for ராஜா ராணி / Raja Rani — Wave 5 P1 (Cinema).
//
//   node scripts/validate-raja-rani.mjs <kalaignar-cinema-works-clone>
//
// HARDENING (post-review): the approved Wave-5 freeze is pinned as INDEPENDENT
// constants here — not taken from the released provenance. Two directions proved
// separately: independent constant -> provenance, and independent constant ->
// source/generated artifact. Never provenance -> expected artifact as the only
// proof, so a coordinated reader.json + provenance.json mutation cannot redefine
// truth.
//
// INDEPENDENCE OF EVIDENCE: the importer consumes integrations/reading-room/
// reading-room.json. This validator re-derives structure from a DIFFERENT path —
// the raw layer indexes scenes/index.json, dialogues/index.json, songs/index.json
// and editions/en/manifest.json — so the two cannot share one wrong assumption.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const FREEZE = {
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourceCommit: "75b22046490f92df3bbf641a69a59fcad7b91bde",
  repoTree: "43d28d85587294279e4d7fe901b143f5ec469194",
  workTree: "abbc5cb8890e67ad2b18e0ab50e5af6f678bbd06",
  sourcePath: "works/raja-rani",
  pdf: { filename: "TVA_BOK_0017188_ராஜா_ராணி.pdf", sha256: "26ecc026b89deafac94bb3b107ee7c5f361c68796c4a1cdf4d01ad7c1c0d31a4", pages: 80, canonicalPages: 79 },
  readingRoomSha: "ab1058cb5a22ba78e68938f50efc586cc53eb07ef544bdf3919bb3c4b8c46c9b",
  readerSha: "f1c28efe2a3be14a7a4e379ac7f7ebd41d080ebd59566074854fffe12e7c4acf",
  provenanceSha: "2dbcbd4786672dfcce6b9d97a9c0ca90bf3b990fbafe4a08d8e1bdc37097ec1b",
};

const SRC = process.argv[2];
const cannot = (m) => { console.error(`\nraja-rani — CANNOT VALIDATE\n\n  ${m}\n`); process.exit(2); };
if (!SRC) cannot("usage: node scripts/validate-raja-rani.mjs <kalaignar-cinema-works-clone>");

const SLUG = "raja-rani";
const W = path.join(SRC, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/cinema", SLUG);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
if (!fs.existsSync(DATA)) cannot(`generated data missing at ${DATA}`);
if (!fs.existsSync(W)) cannot(`source work missing at ${W}`);

let head;
try { head = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch { cannot(`${SRC} is not a git clone`); }
if (head !== FREEZE.sourceCommit) cannot(`clone HEAD ${head} != approved freeze ${FREEZE.sourceCommit}`);
const workTree = execFileSync("git", ["-C", SRC, "rev-parse", `HEAD:${FREEZE.sourcePath}`], { encoding: "utf8" }).trim();
if (workTree !== FREEZE.workTree) cannot(`work tree ${workTree} != approved ${FREEZE.workTree}`);

const prov = readJSON(path.join(DATA, "provenance.json"));
const reader = readJSON(path.join(DATA, "reader.json"));

let pass = 0;
const failures = [];
const check = (label, ok) => (ok ? pass++ : failures.push(label));
const eq = (label, a, b) => check(`${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`, a === b);

// ── 1. HASH PINS against INDEPENDENT constants ─────────────────────────────────
eq("reader.json sha256 == approved constant", sha256(fs.readFileSync(path.join(DATA, "reader.json"))), FREEZE.readerSha);
eq("provenance.json sha256 == approved constant", sha256(fs.readFileSync(path.join(DATA, "provenance.json"))), FREEZE.provenanceSha);
eq("reading-room payload sha256 == approved constant", sha256(fs.readFileSync(path.join(W, "integrations/reading-room/reading-room.json"))), FREEZE.readingRoomSha);
eq("provenance.readerSha256 == approved constant", prov.readerSha256, FREEZE.readerSha);
eq("provenance.readingRoomPayloadSha256 == approved constant", prov.readingRoomPayloadSha256, FREEZE.readingRoomSha);

// ── 2. INDEPENDENT CONSTANT -> PROVENANCE ──────────────────────────────────────
eq("provenance sourceRepo", prov.sourceRepo, FREEZE.sourceRepo);
eq("provenance sourceCommit", prov.sourceCommit, FREEZE.sourceCommit);
eq("provenance repoTree", prov.repoTree, FREEZE.repoTree);
eq("provenance workTree", prov.workTree, FREEZE.workTree);
eq("provenance sourcePath", prov.sourcePath, FREEZE.sourcePath);
eq("provenance pdf.filename", prov.pdf.filename, FREEZE.pdf.filename);
eq("provenance pdf.sha256", prov.pdf.sha256, FREEZE.pdf.sha256);
eq("provenance pdf.pages", prov.pdf.pages, FREEZE.pdf.pages);
eq("provenance pdf.canonicalSourcePages", prov.pdf.canonicalSourcePages, FREEZE.pdf.canonicalPages);
eq("provenance rights.publicationYear null", prov.rights.publicationYear, null);
eq("provenance rights.editionStatement null", prov.rights.editionStatement, null);
eq("provenance rights.rightsStatus null", prov.rights.rightsStatus, null);
eq("provenance englishProvenance.kind project-created", prov.englishProvenance.kind, "project-created");

// ── 3. PDF SHA PROOF against the upstream source authority (editions/en/manifest.json) ─
const manifest = readJSON(path.join(W, "editions/en/manifest.json"));
eq("source authority (editions/en/manifest.json) source_sha256 == approved", manifest.source_sha256, FREEZE.pdf.sha256);
eq("generated provenance PDF sha256 == source authority", prov.pdf.sha256, manifest.source_sha256);

// ── 4. INDEPENDENT STRUCTURE from raw layer indexes ────────────────────────────
const scenesIdx = readJSON(path.join(W, "scenes/index.json"));
const dlgIdx = readJSON(path.join(W, "dialogues/index.json"));
const songsIdx = readJSON(path.join(W, "songs/index.json"));
eq("independent: source_numbered_scenes false", scenesIdx.source_numbered_scenes, false);
eq("independent: archival scene segments", scenesIdx.archival_scene_segments, 58);
check("independent: source scene count is null/absent", scenesIdx.source_scene_count === null || scenesIdx.source_scene_count === undefined);
eq("independent: dialogue records", dlgIdx.dialogue_records, 1071);
eq("independent: numbered song blocks", songsIdx.numbered_song_blocks, 11);
eq("independent: song authorship verified/attributed", songsIdx.numbered_song_authorship_verified, 5);
eq("independent: song authorship unresolved", songsIdx.numbered_song_authorship_unresolved, 6);
eq("independent: song source line-cues", songsIdx.english_numbered_song_source_line_cues, 181);
eq("independent: song english line-cues", songsIdx.english_numbered_song_english_line_cues, 181);
eq("independent: song sections", songsIdx.english_numbered_song_translation_sections, 67);
const attributedIds = new Set(songsIdx.kalaignar_attributed_numbered_song_ids);

// ── 5. EXACT scene-58 <-> song-11 REVIEW relation (raw songs/index.json) ───────
const links = songsIdx.screenplay_performance_links || {};
eq("independent: verified performance links", (links.verified || []).length, 3);
eq("independent: review performance links", (links.review || []).length, 1);
const rev = (links.review || [])[0] || {};
eq("independent: the review link is song-011", rev.linked_song, "raja-rani-song-011");
eq("independent: the review link is scene 58", rev.scene, 58);
eq("independent: the review link occurrence", rev.occurrence, "raja-rani-song-perf-004");
// The 3 verified relations are the exact frozen ones, none of them song-011/scene-58.
const verifiedKey = new Set((links.verified || []).map((v) => `${v.linked_song}@${v.scene}`));
check("independent: verified links are songs 003@4, 005@16, 008@40", verifiedKey.has("raja-rani-song-003@4") && verifiedKey.has("raja-rani-song-005@16") && verifiedKey.has("raja-rani-song-008@40"));
check("independent: no verified link is scene 58 or song-011", !(links.verified || []).some((v) => v.scene === 58 || v.linked_song === "raja-rani-song-011"));

// Generated reader must retain that exact relation as review-level, and no other review.
let readerReview = [], readerVerified = 0;
for (const s of reader.numberedSongs) for (const pl of s.performanceLinks || []) {
  if (pl.status === "review") readerReview.push({ song: s.songId, scene: pl.scene, occ: pl.occurrence_id });
  else if (pl.status === "verified") readerVerified++;
}
eq("reader: exactly one review-level performance link", readerReview.length, 1);
eq("reader: the review link is song-011", readerReview[0] && readerReview[0].song, "raja-rani-song-011");
eq("reader: the review link is scene 58", readerReview[0] && readerReview[0].scene, 58);
eq("reader: the review link occurrence", readerReview[0] && readerReview[0].occ, "raja-rani-song-perf-004");
eq("reader: verified performance links", readerVerified, 3);
eq("reader counts songPerformanceLinksReview", reader.counts.songPerformanceLinksReview, 1);
eq("reader counts songPerformanceLinksVerified", reader.counts.songPerformanceLinksVerified, 3);
check("provenance records scene-58/song-11 review exception", prov.structuralExceptions.some((e) => e.id === "scene-58-song-11-review-level"));

// ── 6. GENERATED READER matches independent derivation ─────────────────────────
eq("reader scenes", reader.screenplayScenes.length, scenesIdx.archival_scene_segments);
eq("reader scenes count field", reader.counts.scenes, 58);
eq("reader source-numbered scenes", reader.counts.sourceNumberedScenes, 0);
check("no reader scene carries a source scene number", reader.screenplayScenes.every((s) => s.sourceSceneNumber === null));
let units = 0, immutable = 0, unlabelled = 0; const kinds = {};
for (const sc of reader.screenplayScenes) for (const u of sc.englishUnits) {
  units++; kinds[u.kind] = (kinds[u.kind] || 0) + 1;
  if (u.kind === "dialogue") { if (u.sourceRecordId) immutable++; if (u.speakerLabel === null) unlabelled++; }
}
eq("reader screenplay units", units, 1236);
eq("reader immutable dialogue links == source dialogue_records", immutable, dlgIdx.dialogue_records);
eq("reader source-unlabelled spoken units", unlabelled, 19);
eq("reader dialogue units", kinds.dialogue, 1090);
eq("reader stage-direction units", kinds["stage-direction"], 137);
eq("reader performance-cue units", kinds["performance-cue"], 4);
eq("reader written-text units", kinds["written-text"], 5);
eq("reader numbered songs", reader.numberedSongs.length, 11);
let songSecs = 0, songCues = 0, attributed = 0, unresolvedSongs = 0;
for (const s of reader.numberedSongs) {
  for (const sec of s.sections) { songSecs++; songCues += sec.linePairs.length; }
  if (s.authorshipStatus === "anthology-attributed") { attributed++; check(`song ${s.songId} attribution matches source index`, attributedIds.has(s.songId)); }
  else if (s.authorshipStatus === "unresolved") unresolvedSongs++;
  else failures.push(`song ${s.songId} has an unexpected authorship status ${s.authorshipStatus}`);
}
eq("reader song sections", songSecs, 67);
eq("reader song line-cues", songCues, 181);
eq("reader song anthology-attributed", attributed, 5);
eq("reader song unresolved", unresolvedSongs, 6);

// ── 7. NUMBERING SEMANTICS + EXCLUSIONS ────────────────────────────────────────
check("navigation: scene numbers are NOT source numbers", reader.navigation.screenplaySceneNumbersAreSourceNumbers === false);
check("navigation: scene navigation is editorial", reader.navigation.screenplaySceneNavigationIsEditorial === true);
check("navigation: numbered songs ARE source numbering", reader.navigation.numberedSongOrderIsSourceNumbering === true);
check("provenance records archival-scene-not-source-numbering", prov.structuralExceptions.some((e) => e.id === "archival-scene-navigation-not-source-numbering"));
const blob = JSON.stringify(reader);
const deleted = ["s055-d026", "s055-d027", "s055-d028", "s055-d029", "s055-d030"];
check("deleted T055 duplicate ids are absent", deleted.every((d) => !blob.includes(d)));
check("provenance records the deleted-ids exception", prov.structuralExceptions.some((e) => e.id === "deleted-t055-duplicate-ids"));
check("PDF-74 K. N. சங்கரன் stamp absent from canonical text", reader.screenplayScenes.every((s) => !s.tamilText.includes("K. N. சங்கரன்")));
check("provenance records the PDF-74 stamp exclusion", prov.structuralExceptions.some((e) => e.id === "pdf-74-ownership-stamp-excluded"));
check("no canonical scene Tamil is empty", reader.screenplayScenes.every((s) => s.tamilText.length > 0));

if (failures.length) {
  console.error(`\nraja-rani — ${pass} checks passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nraja-rani — ${pass} checks, 0 failed`);
console.log("  RAJA RANI RELEASED DATA FAITHFUL TO SOURCE — freeze-pinned · 58 archival scenes (0 source-numbered) · 1071 immutable dialogues · 1236 units · 11 songs (5 attributed / 6 unresolved) · scene-58↔song-11 sole review link");
