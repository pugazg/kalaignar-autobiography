// Validator for அம்மையப்பன் / Ammayappan — Wave 6 P1 (Batch 1, Cinema).
//
//   node scripts/validate-ammaiyappan.mjs <kalaignar-cinema-works-clone>
//
// The approved Wave-6 Batch-1 freeze is pinned as INDEPENDENT constants here — not taken from the
// released provenance. Two directions proved separately: independent constant -> provenance, and
// independent constant -> source/generated artifact, so a coordinated reader.json + provenance.json
// mutation cannot redefine truth.
//
// INDEPENDENCE OF EVIDENCE: the importer consumes integrations/reading-room/reading-room.json. This
// validator re-derives structure from a DIFFERENT path — the raw layer indexes scenes/index.json,
// dialogues/index.json, songs/index.json, translations/index.json and editions/en/manifest.json — so
// the two cannot share one wrong assumption.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const FREEZE = {
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourceCommit: "c33eb41db3670b097d1f318f66352dde672b5f37",
  repoTree: "c244bba49161277e7cbeec535b1d6a49777dc20b",
  workTree: "31d0d1219f76f6dc0cb068f8926d644d0cfd5573",
  sourcePath: "works/ammaiyappan",
  pdf: { filename: "TVA_BOK_0064230_அம்மையப்பன்.pdf", sha256: "eda6468a57022b418f44851a0013b090469bc6f4be44a682487800658771720d", pages: 111 },
  readingRoomSha: "f00efb816edf08b43702a3a1a9d71ed9cc54fd1a803b8881bc6e2c6466de1f8c",
  readerSha: "6b8ba6fcb1a005244f1dcf2c376ae85a6174b4f1c9d0919a5c98f4f62364ed33",
  provenanceSha: "ea84004c659ed581bcef4f297bd977d463086e2879a1f3d8275974ad90a97abb",
};

const SRC = process.argv[2];
const cannot = (m) => { console.error(`\nammaiyappan — CANNOT VALIDATE\n\n  ${m}\n`); process.exit(2); };
if (!SRC) cannot("usage: node scripts/validate-ammaiyappan.mjs <kalaignar-cinema-works-clone>");

const SLUG = "ammaiyappan";
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
eq("provenance rights.publicationYear null", prov.rights.publicationYear, null);
eq("provenance rights.editionStatement null", prov.rights.editionStatement, null);
eq("provenance rights.rightsStatus null", prov.rights.rightsStatus, null);
eq("provenance englishProvenance.kind project-created", prov.englishProvenance.kind, "project-created");

// ── 3. PDF SHA PROOF against the upstream source authority (editions/en/manifest.json) ─
const manifest = readJSON(path.join(W, "editions/en/manifest.json"));
eq("source authority (editions/en/manifest.json) source_scan_sha256 == approved", manifest.source_scan_sha256, FREEZE.pdf.sha256);
eq("generated provenance PDF sha256 == source authority", prov.pdf.sha256, manifest.source_scan_sha256);
eq("source authority: archival scene numbering is derivative-navigation-only", manifest.archival_scene_numbering, "derivative-navigation-only");
eq("source authority: source scene numbering none-printed", manifest.source_scene_numbering, "none-printed");

// ── 4. INDEPENDENT STRUCTURE from raw layer indexes ────────────────────────────
const scenesIdx = readJSON(path.join(W, "scenes/index.json"));
const dlgIdx = readJSON(path.join(W, "dialogues/index.json"));
const songsIdx = readJSON(path.join(W, "songs/index.json"));
const trIdx = readJSON(path.join(W, "translations/index.json"));
eq("independent: source_numbered_scenes false", scenesIdx.source_numbered_scenes, false);
eq("independent: archive scene count", scenesIdx.archive_scene_count, 63);
eq("independent (dialogues): archive scene count", dlgIdx.archive_scene_count, 63);
eq("independent: explicit dialogue records", dlgIdx.dialogue_record_count, 1009);
eq("independent (translations): translation units", trIdx.translation_units, 1210);
eq("independent (translations): dialogue source records linked", trIdx.dialogue_source_records_linked, 1009);
eq("independent (translations): source-role supplements linked", trIdx.source_role_supplement_records_linked, 16);
eq("independent (translations): scenes verified", trIdx.scenes_verified.length, 63);
eq("independent (translations): source scene numbering none-printed", trIdx.source_scene_numbering, "none-printed");
eq("independent (translations): cross-page units", trIdx.cross_page_translation_units.length, 28);
eq("independent (translations): translated song occurrences", trIdx.translated_song_performance_occurrences.length, 5);
eq("independent (manifest): dialogue_source_links_total", manifest.dialogue_source_links_total, 1025);
eq("independent (manifest): explicit records linked", manifest.explicit_dialogue_records_linked, 1009);
eq("independent (manifest): source-role supplements linked", manifest.source_role_supplements_linked, 16);
eq("independent (manifest): occurrence identities", manifest.occurrence_identities.length, 5);
eq("independent (manifest): occurrence source-span links total", manifest.occurrence_source_span_links_total, 7);
eq("independent (manifest): unit kind dialogue", manifest.unit_kind_counts.dialogue, 1025);
eq("independent (manifest): unit kind stage-direction", manifest.unit_kind_counts["stage-direction"], 181);
eq("independent (manifest): unit kind song-reference", manifest.unit_kind_counts["song-reference"], 3);
eq("independent (manifest): unit kind japa", manifest.unit_kind_counts.japa, 1);

// ── 5. SONG-OCCURRENCE SAFEGUARD (raw songs/index.json): NOT Kalaignar-authored lyrics ─
eq("independent (songs): source-visible occurrences", songsIdx.source_visible_occurrences, 5);
eq("independent (songs): full named lyric blocks printed", songsIdx.full_named_song_lyric_blocks_printed, 0);
eq("independent (songs): standalone tamil lyric files created", songsIdx.standalone_tamil_lyric_files_created, 0);
eq("independent (songs): external item-level evidence used", songsIdx.external_item_level_evidence_used, false);
eq("independent (songs): canonical tamil changed", songsIdx.canonical_tamil_changed, false);
check("provenance records the retained-song-occurrence-not-lyric-authorship exception",
  prov.structuralExceptions.some((e) => e.id === "retained-song-occurrences-not-lyric-authorship"));

// ── 6. GENERATED READER matches independent derivation ─────────────────────────
eq("reader scenes", reader.screenplayScenes.length, scenesIdx.archive_scene_count);
eq("reader scenes count field", reader.counts.scenes, 63);
eq("reader source-numbered scenes", reader.counts.sourceNumberedScenes, 0);
check("no reader scene carries a source scene number", reader.screenplayScenes.every((s) => s.sourceSceneNumber === null));
check("every reader scene is archival-navigation ordinal 1..63", reader.screenplayScenes.every((s, i) => s.archivalSceneOrdinal === i + 1));
let units = 0, dialogueLinks = 0, occSpanLinks = 0, crossPage = 0; const kinds = {}; const occ = new Set();
for (const sc of reader.screenplayScenes) for (const u of sc.englishUnits) {
  units++; kinds[u.kind] = (kinds[u.kind] || 0) + 1;
  if (u.kind === "dialogue" && u.sourceRecordId) dialogueLinks++;
  if (u.sourceOccurrenceId) { occ.add(u.sourceOccurrenceId); occSpanLinks++; }
  if (Array.isArray(u.pageProvenance) && u.pageProvenance.length > 1) crossPage++;
}
eq("reader english units", units, trIdx.translation_units);
eq("reader dialogue source links == manifest total", dialogueLinks, manifest.dialogue_source_links_total);
eq("reader stage-direction units", kinds["stage-direction"], 181);
eq("reader song-reference units", kinds["song-reference"], 3);
eq("reader japa units", kinds["japa"], 1);
eq("reader cross-page units", crossPage, trIdx.cross_page_translation_units.length);
eq("reader occurrence identities", occ.size, manifest.occurrence_identities.length);
eq("reader occurrence span links", occSpanLinks, manifest.occurrence_source_span_links_total);
eq("reader counts.englishUnits", reader.counts.englishUnits, 1210);
eq("reader counts.dialogueSourceLinks", reader.counts.dialogueSourceLinks, 1025);

// ── 7. NUMBERING SEMANTICS + IDENTITY EXCLUSIONS ───────────────────────────────
check("navigation: scene numbers are NOT source numbers", reader.navigation.screenplaySceneNumbersAreSourceNumbers === false);
check("navigation: scene navigation is editorial", reader.navigation.screenplaySceneNavigationIsEditorial === true);
check("provenance records archival-scene-not-source-numbering", prov.structuralExceptions.some((e) => e.id === "archival-scene-navigation-not-source-numbering"));
check("provenance records not-the-film-songs-anthology safeguard", prov.structuralExceptions.some((e) => e.id === "not-the-film-songs-anthology"));
check("no canonical scene Tamil is empty", reader.screenplayScenes.every((s) => s.tamilText.length > 0));
check("printed 1954 credit recorded as source witness (not promoted)", prov.printedSourceWitnesses && prov.printedSourceWitnesses.publicationYear === undefined && /1954/.test(prov.printedSourceWitnesses.publicationMonthYear || ""));

if (failures.length) {
  console.error(`\nammaiyappan — ${pass} checks passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nammaiyappan — ${pass} checks, 0 failed`);
console.log("  AMMAYAPPAN RELEASED DATA FAITHFUL TO SOURCE — freeze-pinned · 63 archival scenes (0 source-numbered) · 1210 english units · 1025 dialogue links · 5 song occurrences (0 lyric blocks / not authorship) · no year/edition/rights promoted");
