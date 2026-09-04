// Validator for மந்திரி குமாரி / Manthiri Kumari — Wave 5 P1 (Cinema).
//
//   node scripts/validate-manthiri-kumari.mjs <kalaignar-cinema-works-clone>
//
// Proves the released website data is a faithful, deterministic projection of the
// PINNED archive. The pin is read FROM THE RELEASED DATA, never hardcoded, so this
// cannot drift into checking a different tree than the data claims.
//
// INDEPENDENCE: the importer consumes integrations/reading-room/reading-room.json.
// This validator deliberately reconstructs its expectations from a DIFFERENT path —
// the raw record directories (songs/records, translations/performances,
// translations/story-summary) — so importer and validator cannot share one wrong
// assumption. It re-derives counts, witnesses and dispositions from those records
// and asserts them against the generated reader.json + the pinned hashes.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2];
const cannot = (m) => { console.error(`\nmanthiri-kumari — CANNOT VALIDATE\n\n  ${m}\n`); process.exit(2); };
if (!SRC) cannot("usage: node scripts/validate-manthiri-kumari.mjs <kalaignar-cinema-works-clone>");

const SLUG = "manthiri-kumari";
const W = path.join(SRC, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/cinema", SLUG);
const nfc = (s) => s.normalize("NFC");
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

// ── INDEPENDENT COUNTS from raw record directories ─────────────────────────────
const perfRecords = fs.readdirSync(path.join(W, "songs/records")).filter((f) => /^\d+\.json$/.test(f)).sort();
eq("independent: 15 Tamil performance records", perfRecords.length, 15);
const enRecords = fs.readdirSync(path.join(W, "translations/performances")).filter((f) => /^\d+\.json$/.test(f)).sort();
eq("independent: 15 English performance records", enRecords.length, 15);

// Line-cues + sections re-summed from the raw English records (not reading-room.json).
let secTotal = 0, cueTotal = 0;
for (const f of enRecords) {
  const en = readJSON(path.join(W, "translations/performances", f));
  for (const s of en.translation.sections) {
    secTotal++;
    if (s.source_tamil_lines.length !== s.english_lines.length) failures.push(`raw ${f} section ${s.ordinal}: Tamil/English line-cue mismatch`);
    cueTotal += s.english_lines.length;
  }
}
eq("independent: performance sections", secTotal, 52);
eq("independent: performance line-cues", cueTotal, 234);

// Witnesses + authorship re-derived from raw Tamil records.
let confirmed = 0, sourceOnly = 0, unresolved = 0, b11ok = false;
for (const f of perfRecords) {
  const r = readJSON(path.join(W, "songs/records", f));
  const cw = String((r.cross_witness && (r.cross_witness.status || r.cross_witness)) || "");
  const au = String((r.authorship && (r.authorship.status || r.authorship)) || "");
  if (cw.includes("confirmed")) { confirmed++; if (r.sequence === 11) b11ok = true; } else sourceOnly++;
  if (au.includes("unresolved")) unresolved++;
}
eq("independent: confirmed anthology witnesses", confirmed, 1);
eq("independent: source-only in anthology", sourceOnly, 14);
eq("independent: unresolved lyricists", unresolved, 15);
check("independent: the one confirmed witness is block 11", b11ok);

// Story summary logical units from the raw translation record.
const ss = readJSON(path.join(W, "translations/story-summary.json"));
eq("independent: story summary logical units", ss.translation.sections.length, 13);

// ── RELEASED DATA MATCHES THE INDEPENDENT DERIVATION ───────────────────────────
eq("reader performances", reader.performances.length, 15);
eq("reader performance count field", reader.counts.performanceBlocks, 15);
eq("reader sections field", reader.counts.performanceSections, secTotal);
eq("reader line-cues field", reader.counts.performanceLineCues, cueTotal);
eq("reader confirmed witnesses", reader.counts.confirmedAnthologyWitnesses, confirmed);
eq("reader source-only", reader.counts.sourceOnlyInAnthology, sourceOnly);
eq("reader lyricists verified", reader.counts.lyricistsVerified, 0);
eq("reader lyricists unresolved", reader.counts.lyricistsUnresolved, unresolved);
eq("reader story summary units", reader.storySummary.units.length, 13);
// Actual embedded line-cues in reader.json equal the summed sections.
let readerCues = 0, readerSecs = 0;
for (const p of reader.performances) for (const s of p.sections) { readerSecs++; readerCues += s.englishLines.length; if (s.tamilLines.length !== s.englishLines.length) failures.push(`reader ${p.performanceId} section ${s.ordinal}: line mismatch`); }
eq("reader embedded sections", readerSecs, 52);
eq("reader embedded line-cues", readerCues, 234);

// ── SEMANTIC INVARIANTS ────────────────────────────────────────────────────────
check("no source-numbered scenes", reader.navigation.sourceNumberedScenes === false && reader.navigation.performanceOrderIsSourceNumbering === false);
check("performance order is archival navigation", reader.navigation.performanceOrderIsArchivalNavigation === true);
const b11 = reader.performances.find((p) => p.sourceOrder === 11);
check("block 11 confirmed witness -> kalaignar-song-001", !!b11 && b11.crossWitnessStatus === "confirmed-existing-anthology-witness" && b11.anthologyRecordId === "kalaignar-song-001");
check("no other performance claims an anthology witness", reader.performances.every((p) => p.sourceOrder === 11 || p.anthologyRecordId === null));
check("every performance authorship is unresolved", reader.performances.every((p) => p.authorshipStatus === "unresolved"));
// Performance 13 heading/label anomaly preserved (heading != normalized turn labels).
const p13 = reader.performances.find((p) => p.sourceOrder === 13);
check("performance 13 keeps its printed heading anomaly", !!p13 && p13.headingTa.includes("பார்த்திபன்—மந்திரிகுமாரி"));
check("provenance records the perf-13 heading-label exception", prov.structuralExceptions.some((e) => e.id === "perf-13-heading-label-anomaly"));
check("titleEn is editorial (presentation)", reader.work.titleEnIsEditorial === true && prov.englishProvenance.kind === "project-created");
check("no rights inferred", prov.rights.publicationYear === null && prov.rights.editionStatement === null && prov.rights.rightsStatus === null);
check("no canonical Tamil is empty", reader.performances.every((p) => p.sections.every((s) => s.tamilLines.every((l) => l.length > 0))));

if (failures.length) {
  console.error(`\nmanthiri-kumari — ${pass} checks passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error("  x " + f);
  process.exit(1);
}
console.log(`\nmanthiri-kumari — ${pass} checks, 0 failed`);
console.log("  MANTHIRI KUMARI RELEASED DATA FAITHFUL TO SOURCE — 15 performances · 52 sections · 234 line-cues · 1 witness / 14 source-only · 15 unresolved lyricists");
