// Validator for ராஜா ராணி / Raja Rani — Wave 5 P1 (Cinema).
//
//   node scripts/validate-raja-rani.mjs <kalaignar-cinema-works-clone>
//
// Proves the released website data is a faithful, deterministic projection of the
// PINNED archive. The pin is read FROM THE RELEASED DATA, never hardcoded.
//
// INDEPENDENCE: the importer consumes integrations/reading-room/reading-room.json.
// This validator re-derives its expectations from a DIFFERENT path — the raw layer
// indexes scenes/index.json, dialogues/index.json and songs/index.json — so
// importer and validator cannot share one wrong assumption.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

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

const prov = readJSON(path.join(DATA, "provenance.json"));
const reader = readJSON(path.join(DATA, "reader.json"));
const PIN = prov.sourceCommit;

let head;
try { head = execFileSync("git", ["-C", SRC, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch { cannot(`${SRC} is not a git clone`); }
if (head !== PIN) cannot(`clone HEAD ${head} != released pin ${PIN}`);
const workTree = execFileSync("git", ["-C", SRC, "rev-parse", `HEAD:works/${SLUG}`], { encoding: "utf8" }).trim();
if (workTree !== prov.workTree) cannot(`work tree ${workTree} != released ${prov.workTree}`);

let pass = 0;
const failures = [];
const check = (label, ok) => (ok ? pass++ : failures.push(label));
const eq = (label, a, b) => check(`${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`, a === b);

// ── HASH PINS ─────────────────────────────────────────────────────────────────
eq("reading-room payload sha256", sha256(fs.readFileSync(path.join(W, "integrations/reading-room/reading-room.json"))), prov.readingRoomPayloadSha256);
eq("reader.json self-hash", sha256(fs.readFileSync(path.join(DATA, "reader.json"))), prov.readerSha256);

// ── INDEPENDENT DERIVATION from the raw layer indexes ──────────────────────────
const scenesIdx = readJSON(path.join(W, "scenes/index.json"));
const dlgIdx = readJSON(path.join(W, "dialogues/index.json"));
const songsIdx = readJSON(path.join(W, "songs/index.json"));

// Scenes: archival navigation, never source-numbered.
eq("independent: source_numbered_scenes false", scenesIdx.source_numbered_scenes, false);
eq("independent: archival scene segments", scenesIdx.archival_scene_segments, 58);
check("independent: source scene count is null/absent", scenesIdx.source_scene_count === null || scenesIdx.source_scene_count === undefined);
// Immutable dialogue records.
eq("independent: dialogue records", dlgIdx.dialogue_records, 1071);
// Numbered songs + authorship tiers.
eq("independent: numbered song blocks", songsIdx.numbered_song_blocks, 11);
eq("independent: song authorship verified/attributed", songsIdx.numbered_song_authorship_verified, 5);
eq("independent: song authorship unresolved", songsIdx.numbered_song_authorship_unresolved, 6);
eq("independent: song source line-cues", songsIdx.english_numbered_song_source_line_cues, 181);
eq("independent: song english line-cues", songsIdx.english_numbered_song_english_line_cues, 181);
eq("independent: song sections", songsIdx.english_numbered_song_translation_sections, 67);
const attributedIds = new Set(songsIdx.kalaignar_attributed_numbered_song_ids);

// ── RELEASED DATA MATCHES THE INDEPENDENT DERIVATION ───────────────────────────
eq("reader scenes", reader.screenplayScenes.length, scenesIdx.archival_scene_segments);
eq("reader scenes count field", reader.counts.scenes, 58);
eq("reader source-numbered scenes", reader.counts.sourceNumberedScenes, 0);
check("no reader scene carries a source scene number", reader.screenplayScenes.every((s) => s.sourceSceneNumber === null));
// Recount immutable dialogue links from the embedded units.
let dialogueUnits = 0, immutable = 0, unlabelled = 0, units = 0;
const kinds = {};
for (const sc of reader.screenplayScenes) for (const u of sc.englishUnits) {
  units++; kinds[u.kind] = (kinds[u.kind] || 0) + 1;
  if (u.kind === "dialogue") { dialogueUnits++; if (u.sourceRecordId) immutable++; if (u.speakerLabel === null) unlabelled++; }
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
}
eq("reader song sections", songSecs, 67);
eq("reader song line-cues", songCues, 181);
eq("reader song anthology-attributed", attributed, 5);
eq("reader song unresolved", unresolvedSongs, 6);

// ── SEMANTIC INVARIANTS ────────────────────────────────────────────────────────
check("navigation: scene numbers are NOT source numbers", reader.navigation.screenplaySceneNumbersAreSourceNumbers === false);
check("navigation: scene navigation is editorial", reader.navigation.screenplaySceneNavigationIsEditorial === true);
check("provenance records archival-scene-not-source-numbering", prov.structuralExceptions.some((e) => e.id === "archival-scene-navigation-not-source-numbering"));
// Deleted T055 duplicate ids never reappear anywhere in the released content.
const blob = JSON.stringify(reader);
const deleted = ["s055-d026", "s055-d027", "s055-d028", "s055-d029", "s055-d030"];
check("deleted T055 duplicate ids are absent", deleted.every((d) => !blob.includes(d)));
check("provenance records the deleted-ids exception", prov.structuralExceptions.some((e) => e.id === "deleted-t055-duplicate-ids"));
// PDF-74 ownership/library stamp absent from canonical scene text.
check("PDF-74 K. N. சங்கரன் stamp absent from canonical text", reader.screenplayScenes.every((s) => !s.tamilText.includes("K. N. சங்கரன்")));
check("provenance records the PDF-74 stamp exclusion", prov.structuralExceptions.some((e) => e.id === "pdf-74-ownership-stamp-excluded"));
// Scene-58 / song-11 relation stays review-level.
check("scene-58/song-11 link recorded review-level", prov.structuralExceptions.some((e) => e.id === "scene-58-song-11-review-level"));
eq("song performance links review", reader.counts.songPerformanceLinksReview, 1);
eq("song performance links verified", reader.counts.songPerformanceLinksVerified, 3);
check("titleEn is editorial (presentation)", reader.work.titleEnIsEditorial === true && prov.englishProvenance.kind === "project-created");
check("no rights inferred", prov.rights.publicationYear === null && prov.rights.editionStatement === null && prov.rights.rightsStatus === null);
check("no canonical scene Tamil is empty", reader.screenplayScenes.every((s) => s.tamilText.length > 0));

if (failures.length) {
  console.error(`\nraja-rani — ${pass} checks passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nraja-rani — ${pass} checks, 0 failed`);
console.log("  RAJA RANI RELEASED DATA FAITHFUL TO SOURCE — 58 archival scenes (0 source-numbered) · 1071 immutable dialogues · 1236 units · 11 songs (5 attributed / 6 unresolved) · 181 song line-cues");
