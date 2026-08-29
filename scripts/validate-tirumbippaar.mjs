// Validator for திரும்பிப்பார்! — Digital Library Cinema (Phase D2.1).
//
//   node scripts/validate-tirumbippaar.mjs <kalaignar-cinema-works-clone>
//
// This proves the released website data is a faithful, deterministic projection of
// the PINNED archive. It does not — and cannot — prove the controlling scan
// visually: that adjudication happened upstream and is recorded there. What this
// asserts is parity with the published source at one exact commit.
//
// The pin is read FROM THE RELEASED DATA, never hardcoded here, so the validator
// cannot drift into checking a different tree than the one the data claims.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
if (!SRC_REPO) {
  // Exit 2, not 1: no source clone means the check could not run, which is a
  // different fact from the released data being wrong. See docs/VALIDATOR_CONTRACT.md.
  console.error("\ntirumbippaar — CANNOT VALIDATE\n\n  usage: node scripts/validate-tirumbippaar.mjs <kalaignar-cinema-works-clone>\n");
  process.exit(2);
}

const SLUG = "tirumbippaar";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const DATA = path.join(process.cwd(), "public/data/cinema", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

let pass = 0;
const failures = [];
const check = (label, ok) => (ok ? pass++ : failures.push(label));
const eq = (label, actual, expected) =>
  check(`${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`, actual === expected);

if (!fs.existsSync(DATA)) {
  console.error(`\ntirumbippaar — CANNOT VALIDATE\n\n  generated data missing at ${DATA}\n`);
  process.exit(2);
}
const prov = readJSON(path.join(DATA, "provenance.json"));
const index = readJSON(path.join(DATA, "index.json"));
const PIN = prov.sourceCommit;

// The clone must be AT the pin. Never fall back to whatever `main` happens to be.
let head;
try {
  head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  console.error(`\ntirumbippaar — CANNOT VALIDATE\n\n  ${SRC_REPO} is not a git clone\n`);
  process.exit(2);
}
if (head !== PIN) {
  console.error(
    `\ntirumbippaar — CANNOT VALIDATE\n\n  clone is at ${head} but the released data pins ${PIN}\n` +
      `  run: git -C ${SRC_REPO} fetch origin ${PIN} && git -C ${SRC_REPO} checkout ${PIN}\n`,
  );
  process.exit(2);
}

// ── source surfaces ───────────────────────────────────────────────────────────
const sceneIndex = readJSON(path.join(WORK_DIR, "scenes/index.json"));
const dialogueIndex = readJSON(path.join(WORK_DIR, "dialogues/index.json"));
const translationIndex = readJSON(path.join(WORK_DIR, "translations/index.json"));
const manifest = readJSON(path.join(WORK_DIR, "editions/en/manifest.json"));
const pkgManifest = readJSON(path.join(WORK_DIR, "editions/en/package-manifest.json"));
const labels = (() => {
  const raw = readJSON(path.join(WORK_DIR, "characters/labels-inventory.json"));
  return Array.isArray(raw) ? raw : raw.labels || [];
})();
const entities = (() => {
  const raw = readJSON(path.join(WORK_DIR, "characters/entities.json"));
  return Array.isArray(raw) ? raw : raw.entities || [];
})();
const songs = (() => {
  const raw = readJSON(path.join(WORK_DIR, "songs/inventory.json"));
  return Array.isArray(raw) ? raw : raw.occurrences || raw.songs || raw.records || [];
})();

// ── pin and integrity ─────────────────────────────────────────────────────────
eq("released pin is the archive's publication commit", PIN, "6a8c59c445890e568dfe65cc36c2900dd2a8a0b3");
eq("controlling scan SHA matches the archive", prov.integrity.sourceScanSha256, manifest.source_scan_sha256);
eq("controlling scan SHA is the approved one", prov.integrity.sourceScanSha256, "973b9c3f7b84d6a1902a4a472af8799c783bf1ec2d6cd015796fc1df1ce59682");
eq("published EPUB hash matches the archive package", prov.publication.epubSha256, pkgManifest.epub.sha256);
eq("reader-edition hash matches the archive package", prov.publication.readerSha256, pkgManifest.reader_sha256);

// Re-derive both byte aggregates from the pinned tree. This is what proves the
// release was built from this exact source and not patched afterwards.
const aggregate = (rels) => {
  const h = crypto.createHash("sha256");
  for (const rel of rels) {
    h.update(rel);
    h.update(Buffer.from([0]));
    h.update(fs.readFileSync(path.join(SRC_REPO, rel)));
    h.update(Buffer.from([0]));
  }
  return h.digest("hex");
};
const sourceInputRel = [
  "data/works.json",
  `works/${SLUG}/metadata.yaml`,
  `works/${SLUG}/scenes/index.json`,
  `works/${SLUG}/dialogues/index.json`,
  `works/${SLUG}/songs/index.json`,
  `works/${SLUG}/songs/inventory.json`,
  `works/${SLUG}/songs/credits.json`,
  `works/${SLUG}/songs/tracklist-evidence.json`,
  `works/${SLUG}/characters/index.json`,
  `works/${SLUG}/characters/entities.json`,
  `works/${SLUG}/characters/labels-inventory.json`,
  `works/${SLUG}/editions/en/manifest.json`,
  ...sceneIndex.scenes.map((s) => `works/${SLUG}/scenes/${s.file}`),
  ...fs.readdirSync(path.join(WORK_DIR, "dialogues/records")).sort().map((f) => `works/${SLUG}/dialogues/records/${f}`),
].sort();
eq("source-input file count", sourceInputRel.length, prov.integrity.sourceInputFiles);
eq("source-input aggregate SHA re-derives from the pinned tree", aggregate(sourceInputRel), prov.integrity.sourceInputAggregateSha256);
const translationInputRel = [
  `works/${SLUG}/translations/index.json`,
  ...fs.readdirSync(path.join(WORK_DIR, "translations/records")).sort().map((f) => `works/${SLUG}/translations/records/${f}`),
].sort();
eq("translation-input file count", translationInputRel.length, prov.integrity.translationInputFiles);
eq("translation-input aggregate SHA re-derives from the pinned tree", aggregate(translationInputRel), prov.integrity.translationInputAggregateSha256);
eq("translation aggregate matches the archive's own manifest", prov.integrity.translationInputAggregateSha256, manifest.translation_input_aggregate_sha256);

// ── structure ─────────────────────────────────────────────────────────────────
eq("scene registry count", index.scenes.length, 93);
eq("scene count agrees with the archive", index.sceneCount, sceneIndex.scene_headings_observed);
eq("canonical page count", prov.tamil.canonicalPages, 104);
eq("no absent headings are claimed", prov.structure.headingsNotObserved.length, 0);
check(
  "canonical scene numbers are the consecutive run 1–93",
  JSON.stringify(index.scenes.map((s) => s.canonicalScene)) === JSON.stringify(Array.from({ length: 93 }, (_, i) => i + 1)),
);
check("no scene claims an editorial renumbering", index.scenes.every((s) => s.sourceHeading === s.canonicalScene));
check("scene slugs are unique", new Set(index.scenes.map((s) => s.slug)).size === index.scenes.length);
check("every registry scene has a payload file", index.scenes.every((s) => fs.existsSync(path.join(DATA, "scenes", `${s.slug}.json`))));
eq("scene payload files on disk", fs.readdirSync(path.join(DATA, "scenes")).filter((f) => f.endsWith(".json")).length, 93);

// ── Tamil reading layer, proved against the pinned source ─────────────────────
// Each scene's blocks must rebuild the pinned derivative once its heading and
// provenance comments are stripped. That is the fidelity proof; a count alone
// would not catch reordered or reworded text.
const PAGE_RE = /^<!--\s*source:\s*pdf=(\d+)\s+printed=(\d+)\s+status=([\w-]+)(\s+zero_dialogue=true)?\s*-->$/;
const DERIV_RE = /^<!--\s*derivative provenance:/;
const CONT_RE = /^<!--\s*derivative continuation:/;
const HEADING_RE = /^###\s+/;
let reconstructed = 0;
let dialogueBlocks = 0;
let separatorBlocks = 0;
const pagesSeen = new Set();
for (const rec of sceneIndex.scenes) {
  const payload = readJSON(path.join(DATA, "scenes", `scene-${String(rec.canonical_heading).padStart(2, "0")}.json`));
  const md = readText(path.join(WORK_DIR, "scenes", rec.file));
  const stripped = md
    .split("\n")
    .filter((l) => {
      const t = l.trim();
      return !PAGE_RE.test(t) && !DERIV_RE.test(t) && !CONT_RE.test(t) && !HEADING_RE.test(t);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const rebuilt = payload.tamil.blocks.map((b) => b.text).join("\n\n").trim();
  if (rebuilt === stripped) reconstructed++;
  dialogueBlocks += payload.tamil.blocks.filter((b) => b.kind === "dialogue").length;
  separatorBlocks += payload.tamil.blocks.filter((b) => b.kind === "separator").length;
  for (const p of payload.pageProvenance) {
    pagesSeen.add(p.pdfPage);
    if (p.printedPage !== p.pdfPage - 8) failures.push(`scene ${rec.canonical_heading}: printed ${p.printedPage} is not pdf ${p.pdfPage} − 8`);
    else pass++;
  }
}
eq("every scene reconstructs its pinned source text exactly", reconstructed, 93);
eq("canonical pages covered by scene provenance", pagesSeen.size, 104);
// The reading layer and the immutable dialogue index are DIFFERENT granularities
// in this work; the released data records both rather than pretending they match.
eq("Tamil speaker-labelled block census", dialogueBlocks, prov.tamil.tamilDialogueBlocks);
eq("star separators are kept structural", separatorBlocks, prov.tamil.separatorBlocks);
eq("dialogue record count matches the archive", prov.tamil.dialogueRecords, dialogueIndex.dialogue_records);
eq("dialogue record count", prov.tamil.dialogueRecords, 1042);
check(
  "zero-dialogue scenes match the archive",
  JSON.stringify(prov.tamil.zeroDialogueScenes) === JSON.stringify(dialogueIndex.zero_record_scenes),
);

// ── English layer and links ───────────────────────────────────────────────────
const dialogueIds = new Set();
for (const f of fs.readdirSync(path.join(WORK_DIR, "dialogues/records")).sort()) {
  const raw = readJSON(path.join(WORK_DIR, "dialogues/records", f));
  for (const r of Array.isArray(raw) ? raw : raw.records || []) dialogueIds.add(r.id);
}
eq("distinct dialogue record ids in the pinned source", dialogueIds.size, 1042);

const unitIds = new Set();
const linkCounts = new Map();
const kindCensus = {};
let units = 0;
let crossPage = 0;
for (const s of index.scenes) {
  const payload = readJSON(path.join(DATA, "scenes", `${s.slug}.json`));
  for (const u of payload.english.units) {
    units++;
    unitIds.add(u.id);
    kindCensus[u.kind] = (kindCensus[u.kind] || 0) + 1;
    if (u.pageProvenance.length > 1) crossPage++;
    if (!u.pageProvenance.length) failures.push(`English unit ${u.id} has no page provenance`);
    if (u.sourceRecordId) linkCounts.set(u.sourceRecordId, (linkCounts.get(u.sourceRecordId) || 0) + 1);
  }
}
eq("English unit total", units, 1330);
eq("English unit ids are unique", unitIds.size, 1330);
eq("English unit total agrees with the archive", units, translationIndex.translation_units);
eq("cross-page English units", crossPage, 12);
eq("cross-page count agrees with the archive", crossPage, translationIndex.cross_page_translation_units.length);
for (const [k, v] of Object.entries(translationIndex.unit_kind_counts)) {
  eq(`English unit kind ${k}`, kindCensus[k] || 0, v);
}
eq("this work carries no full song units", kindCensus.song || 0, 0);
eq("dialogue records linked at least once", linkCounts.size, 1042);
check("every dialogue link resolves to a real record", [...linkCounts.keys()].every((id) => dialogueIds.has(id)));
eq("no dialogue record is linked more than once", [...linkCounts.values()].filter((c) => c > 1).length, 0);
eq("no dialogue record is left unlinked", [...dialogueIds].filter((id) => !linkCounts.has(id)).length, 0);

// ── settled source readings ───────────────────────────────────────────────────
// These were adjudicated upstream against the controlling scan, one of them by
// the owner directly. The website must never reintroduce a superseded reading.
const allTamil = index.scenes
  .map((s) => readJSON(path.join(DATA, "scenes", `${s.slug}.json`)).tamil.blocks.map((b) => b.text).join("\n"))
  .join("\n");
eq("the settled reading ஊஹும் survives import", (allTamil.match(/ஊஹும்/g) || []).length, 5);
eq("the superseded reading ஊஹூம் is absent from the imported text", (allTamil.match(/ஊஹூம்/g) || []).length, 0);
check("scene 45 carries the verified source speaker form", allTamil.includes("பாண்டியன் : தொழிலாளர்கள்"));
check(
  "no பாண்டியன். speaker-label variant was invented",
  index.scenes.every((s) =>
    readJSON(path.join(DATA, "scenes", `${s.slug}.json`)).tamil.blocks.every((b) => b.speakerLabel !== "பாண்டியன்."),
  ),
);
// Heading anomalies are source typography and must survive verbatim.
const heading = (n) => index.scenes.find((s) => s.canonicalScene === n).headingTa;
check("scene 5 keeps its printed காட்சி 5[ heading", heading(5).includes("காட்சி 5["));
check("scene 36 keeps no closing glyph", !/காட்சி\s*36\s*[\])]/.test(heading(36)));
check("scene 43 keeps its printed காட்சி 43]. heading", heading(43).includes("காட்சி 43]."));

// ── characters and songs ──────────────────────────────────────────────────────
eq("character entities match the archive", prov.characters.entities, entities.length);
eq("exact source labels match the archive", prov.characters.exactSourceLabels, labels.length);
eq("exact source label count", prov.characters.exactSourceLabels, 45);
check("the label inventory contains no பாண்டியன். variant", !JSON.stringify(labels).includes("பாண்டியன்."));
eq("song occurrences match the archive", index.songs.length, songs.length);
eq("song occurrence count", index.songs.length, 8);
eq("verified song attributions", index.songs.filter((s) => s.authorshipStatus === "verified").length, 3);
eq("unresolved song attributions stay unresolved", index.songs.filter((s) => s.authorshipStatus === "unresolved").length, 5);
eq(
  "no song occurrence is attributed to Kalaignar",
  index.songs.filter((s) => (s.lyricistTa || "").includes("கருணாநிதி")).length,
  0,
);

// ── publication posture ───────────────────────────────────────────────────────
// D2.1 deliberately ships data without exposing the work. These assertions fail
// if a later change quietly publishes it without the reviewed route stages.
eq("no current-day rights block is asserted", prov.rights, undefined);
check("the 1953 rights notice is preserved as source evidence", typeof prov.historicalNotices.rightsNoticeAsPrinted === "string");
check("the front-matter crop stays unreconstructed", prov.frontMatterCrop.status === "unresolved-source-crop");

console.log(`\n${SLUG} — ${pass} assertions passed, ${failures.length} failed`);
console.log(`  validated against pinned source ${PIN}`);
console.log("  this proves deterministic parity with the released archive, not a visual re-reading of the scan");
if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error(" ✗ " + f);
  process.exit(1);
}
console.log("ALL PASS");
