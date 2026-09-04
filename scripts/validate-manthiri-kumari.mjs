// Validator for மந்திரி குமாரி / Manthiri Kumari — Wave 5 P1 (Cinema).
//
//   node scripts/validate-manthiri-kumari.mjs <kalaignar-cinema-works-clone>
//
// HARDENING (post-review): the approved Wave-5 freeze is pinned as INDEPENDENT
// constants in this file — not taken from the released provenance. The validator
// proves two directions separately:
//     independent constant  ->  generated provenance   (provenance is honest)
//     independent constant  ->  source / generated artifact  (artifact is faithful)
// It never uses `provenance -> expected artifact` as the only proof, so a
// coordinated mutation of reader.json + provenance.json cannot redefine truth.
//
// INDEPENDENCE OF EVIDENCE: the importer consumes integrations/reading-room/
// reading-room.json. This validator re-derives structure from a DIFFERENT path —
// the raw record directories (songs/records, translations/performances,
// translations/story-summary) and metadata.yaml — so importer and validator cannot
// share one wrong assumption.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

// ── APPROVED WAVE-5 FREEZE — INDEPENDENT CONSTANTS (never read from provenance) ─
const FREEZE = {
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourceCommit: "75b22046490f92df3bbf641a69a59fcad7b91bde",
  repoTree: "43d28d85587294279e4d7fe901b143f5ec469194",
  workTree: "225662fc8f93d91daff0005b348948da6372840b",
  sourcePath: "works/manthiri-kumari",
  pdf: { filename: "TVA_BOK_0026144_மந்திரி_குமாரி.pdf", sha256: "a64ac0b5ff4adca75d0860d9d52c5324f93f55da3b060cecb43743d0bbc696ee", pages: 14 },
  readingRoomSha: "20a0db293b936757e7d01def336252f28543337f319dfae6ad7bf5ae886bab43",
  readerSha: "ebdbf54fde3031a5027eb0bd61874c2c606a4c765676d2b2f2802082c965bffe",
  provenanceSha: "1355625046f020110e815c12b5aa16e006afa9dd9deb375aea44838c646a67b2",
};

const SRC = process.argv[2];
const cannot = (m) => { console.error(`\nmanthiri-kumari — CANNOT VALIDATE\n\n  ${m}\n`); process.exit(2); };
if (!SRC) cannot("usage: node scripts/validate-manthiri-kumari.mjs <kalaignar-cinema-works-clone>");

const SLUG = "manthiri-kumari";
const W = path.join(SRC, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/cinema", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
if (!fs.existsSync(DATA)) cannot(`generated data missing at ${DATA}`);
if (!fs.existsSync(W)) cannot(`source work missing at ${W}`);

// Clone must be checked out AT the approved freeze — read from the CONSTANT, not provenance.
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

// ── 1. HASH PINS against INDEPENDENT constants (not against provenance) ─────────
eq("reader.json sha256 == approved constant", sha256(fs.readFileSync(path.join(DATA, "reader.json"))), FREEZE.readerSha);
eq("provenance.json sha256 == approved constant", sha256(fs.readFileSync(path.join(DATA, "provenance.json"))), FREEZE.provenanceSha);
eq("reading-room payload sha256 == approved constant", sha256(fs.readFileSync(path.join(W, "integrations/reading-room/reading-room.json"))), FREEZE.readingRoomSha);
// Consistency: what provenance CLAIMS must equal the independent constant too.
eq("provenance.readerSha256 == approved constant", prov.readerSha256, FREEZE.readerSha);
eq("provenance.readingRoomPayloadSha256 == approved constant", prov.readingRoomPayloadSha256, FREEZE.readingRoomSha);

// ── 2. INDEPENDENT CONSTANT -> PROVENANCE (provenance is honest) ────────────────
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
check("provenance titleEnIsEditorial", prov.englishProvenance.titleEnIsEditorial === true);

// ── 3. PDF SHA PROOF against the upstream source authority (metadata.yaml) ──────
const meta = readText(path.join(W, "metadata.yaml"));
const metaSha = /^\s*sha256:\s*"?([0-9a-f]{64})"?/m.exec(meta)?.[1];
const metaPages = /^\s*physical_pdf_pages:\s*(\d+)/m.exec(meta)?.[1];
const metaFile = /^\s*filename:\s*"?([^"\n]+?)"?\s*$/m.exec(meta)?.[1];
eq("source authority (metadata.yaml) PDF sha256 == approved", metaSha, FREEZE.pdf.sha256);
eq("source authority (metadata.yaml) PDF pages == approved", Number(metaPages), FREEZE.pdf.pages);
eq("source authority (metadata.yaml) PDF filename == approved", metaFile && nfc(metaFile), FREEZE.pdf.filename);
eq("generated provenance PDF sha256 == source authority", prov.pdf.sha256, metaSha);

// ── 4. INDEPENDENT STRUCTURE from raw records ──────────────────────────────────
const perfRecords = fs.readdirSync(path.join(W, "songs/records")).filter((f) => /^\d+\.json$/.test(f)).sort();
eq("independent: 15 Tamil performance records", perfRecords.length, 15);
const enRecords = fs.readdirSync(path.join(W, "translations/performances")).filter((f) => /^\d+\.json$/.test(f)).sort();
eq("independent: 15 English performance records", enRecords.length, 15);
let secTotal = 0, cueTotal = 0;
for (const f of enRecords) {
  const en = readJSON(path.join(W, "translations/performances", f));
  for (const s of en.translation.sections) {
    secTotal++;
    if (s.source_tamil_lines.length !== s.english_lines.length) failures.push(`raw ${f} section ${s.ordinal}: line-cue mismatch`);
    cueTotal += s.english_lines.length;
  }
}
eq("independent: performance sections", secTotal, 52);
eq("independent: performance line-cues", cueTotal, 234);
const ss = readJSON(path.join(W, "translations/story-summary.json"));
eq("independent: story summary logical units", ss.translation.sections.length, 13);

// ── 5. FAIL-CLOSED CROSS-WITNESS + EXACT BLOCK-11 IDENTITY (from raw records) ───
const ALLOWED = new Set(["confirmed-existing-anthology-witness", "source-only-in-current-anthology"]);
let confirmed = 0, sourceOnly = 0, unresolved = 0;
for (const f of perfRecords) {
  const r = readJSON(path.join(W, "songs/records", f));
  const cw = r.cross_witness || {};
  const status = cw.status;
  // Unknown / missing / malformed status FAILS — never silently treated as source-only.
  check(`raw perf ${f}: cross-witness status is an allowed value (${JSON.stringify(status)})`, ALLOWED.has(status));
  const au = (r.authorship && r.authorship.status) || "";
  if (au === "unresolved") unresolved++;
  if (status === "confirmed-existing-anthology-witness") {
    confirmed++;
    // The one confirmation must be exactly block 11 -> kalaignar-song-001.
    check(`raw confirmed witness is sequence 11`, r.sequence === 11);
    eq(`raw block 11 anthology target`, cw.anthology_record_id, "kalaignar-song-001");
  } else if (status === "source-only-in-current-anthology") {
    sourceOnly++;
    check(`raw source-only ${f}: anthology target is null/absent`, cw.anthology_record_id === null || cw.anthology_record_id === undefined);
  }
}
eq("independent: confirmed anthology witnesses", confirmed, 1);
eq("independent: source-only in anthology", sourceOnly, 14);
eq("independent: unresolved lyricists", unresolved, 15);

// ── 6. GENERATED READER matches the independent derivation ─────────────────────
eq("reader performances", reader.performances.length, 15);
eq("reader performance count field", reader.counts.performanceBlocks, 15);
eq("reader sections field", reader.counts.performanceSections, secTotal);
eq("reader line-cues field", reader.counts.performanceLineCues, cueTotal);
eq("reader confirmed witnesses", reader.counts.confirmedAnthologyWitnesses, confirmed);
eq("reader source-only", reader.counts.sourceOnlyInAnthology, sourceOnly);
eq("reader lyricists verified", reader.counts.lyricistsVerified, 0);
eq("reader lyricists unresolved", reader.counts.lyricistsUnresolved, unresolved);
eq("reader story summary units", reader.storySummary.units.length, 13);
// Reader cross-witness statuses are also fail-closed to the allowed set.
check("reader cross-witness statuses all allowed", reader.performances.every((p) => ALLOWED.has(p.crossWitnessStatus)));
const b11 = reader.performances.find((p) => p.sourceOrder === 11);
check("reader block 11 confirmed witness -> kalaignar-song-001", !!b11 && b11.crossWitnessStatus === "confirmed-existing-anthology-witness" && b11.anthologyRecordId === "kalaignar-song-001");
check("reader: exactly one confirmed witness (block 11)", reader.performances.filter((p) => p.crossWitnessStatus === "confirmed-existing-anthology-witness").length === 1);
check("reader: every non-11 is source-only with null target", reader.performances.every((p) => p.sourceOrder === 11 || (p.crossWitnessStatus === "source-only-in-current-anthology" && p.anthologyRecordId === null)));
check("reader: every performance authorship is unresolved", reader.performances.every((p) => p.authorshipStatus === "unresolved"));
let readerCues = 0, readerSecs = 0;
for (const p of reader.performances) for (const s of p.sections) { readerSecs++; readerCues += s.englishLines.length; if (s.tamilLines.length !== s.englishLines.length) failures.push(`reader ${p.performanceId} section ${s.ordinal}: line mismatch`); }
eq("reader embedded sections", readerSecs, 52);
eq("reader embedded line-cues", readerCues, 234);

// ── 7. PERFORMANCE 13 — printed heading vs distinct internal labels (both sides) ─
const raw13 = readJSON(path.join(W, "songs/records/013.json"));
eq("raw perf 13 printed heading", nfc(raw13.heading_ta), "பார்த்திபன்—மந்திரிகுமாரி");
const rawLabels = (raw13.source_visible_labels || []).map(nfc);
check("raw perf 13 internal labels are பார்த்திபன் + அமுதவல்லி", rawLabels.includes("பார்த்திபன்") && rawLabels.includes("அமுதவல்லி"));
check("raw perf 13 labels are distinct from the printed heading", rawLabels.every((l) => l !== "பார்த்திபன்—மந்திரிகுமாரி"));
const r13 = reader.performances.find((p) => p.sourceOrder === 13);
check("reader perf 13 keeps the compound printed heading", !!r13 && r13.headingTa === "பார்த்திபன்—மந்திரிகுமாரி");
const r13labels = new Set(r13.sections.map((s) => s.sourceLabel));
check("reader perf 13 preserves distinct internal turn labels பார்த்திபன் / அமுதவல்லி", r13labels.has("பார்த்திபன்") && r13labels.has("அமுதவல்லி"));
check("reader perf 13 internal labels are NOT collapsed into the heading", [...r13labels].every((l) => l !== "பார்த்திபன்—மந்திரிகுமாரி"));

// ── 8. NUMBERING SEMANTICS + PROVENANCE EXCEPTIONS ─────────────────────────────
check("no source-numbered scenes", reader.navigation.sourceNumberedScenes === false && reader.navigation.performanceOrderIsSourceNumbering === false);
check("performance order is archival navigation", reader.navigation.performanceOrderIsArchivalNavigation === true);
check("provenance records the perf-13 heading-label exception", prov.structuralExceptions.some((e) => e.id === "perf-13-heading-label-anomaly"));
check("provenance records the no-source-numbered-scenes exception", prov.structuralExceptions.some((e) => e.id === "no-source-numbered-scenes"));
eq("reader cross-page performance blocks", reader.counts.crossPagePerformanceBlocks, 7);
eq("reader story summary cross-page units", reader.counts.storySummaryCrossPageUnits, 1);
check("no canonical Tamil is empty", reader.performances.every((p) => p.sections.every((s) => s.tamilLines.every((l) => l.length > 0))));

if (failures.length) {
  console.error(`\nmanthiri-kumari — ${pass} checks passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nmanthiri-kumari — ${pass} checks, 0 failed`);
console.log("  MANTHIRI KUMARI RELEASED DATA FAITHFUL TO SOURCE — freeze-pinned · 15 performances · 52 sections · 234 line-cues · block-11 sole witness (kalaignar-song-001) / 14 source-only · 15 unresolved · perf-13 labels distinct");
