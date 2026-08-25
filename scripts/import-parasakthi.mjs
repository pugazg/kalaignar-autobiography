// Deterministic, work-specific importer for பராசக்தி / Parasakthi (Digital Library Phase C).
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-cinema-works
// (works/parasakthi) at a pinned commit and vendors static bilingual reader data into this
// website under public/data/cinema/parasakthi/. Runtime never calls GitHub.
//
// ── WHY THIS IS NOT THE MANOHARA IMPORTER ───────────────────────────────────────────────────────
// Both works sit on the திரை எழுத்து shelf and share nothing structurally.
//
//   * Manohara's booklet prints NO scene numbers. Its 57 "segments" are an ARCHIVE-CREATED
//     navigation layer — the generated data says so in `archivalSceneNumbering:
//     "derivative-navigation-only"` — so `segment-001` is a made-up handle and carries no source
//     claim.
//   * Parasakthi's booklet PRINTS its scene headings (`### காட்சி—N`). The numbers are the
//     booklet's own, which is exactly why their gaps and the late-number transposition are source
//     facts that must survive into the data rather than being smoothed away.
//
// Reusing Manohara's `segment-NNN` handle here would erase that distinction, so this importer keeps
// the canonical scene number as the identity and records the printed reading beside it.
//
// ── THE THREE SOURCE FACTS THIS IMPORTER EXISTS TO PROTECT ──────────────────────────────────────
//  1. SCENES 23 AND 34 ARE NOT PRINTED. The booklet's headings run 1–48 but 23 and 34 never appear.
//     The archive does not invent them and neither does this: the absence is recorded as absence,
//     and no scene file, route or placeholder is produced for either.
//  2. THE 43/48 TRANSPOSITION IS A PRINTED MISPRINT. PDF 49 prints heading 48 where the sequence
//     requires 43; PDF 57 prints 43 where it requires 48. The archive reads canonically and keeps
//     the printed readings. Both are carried: `canonicalScene` orders the reader, `sourceHeading`
//     records what the page actually shows, and `editorialNumberCorrection` marks the two records
//     so nothing downstream can quietly present one as the other.
//  3. THE SONGS ARE NOT ALL KALAIGNAR'S. The booklet credits him with திரைக்கதை/வசனம், but its
//     song-credits page lists SIX contributors booklet-wide and pairs none of them with a song
//     (`item_level_assignment_present: false`). Item-level authorship comes from the archive's
//     separate songs derivative, where 13 of 14 items rest on an EXTERNAL tracklist and only one on
//     the booklet's own words. Exactly ONE of the fourteen is Kalaignar's. Every item's lyricist AND
//     its evidence basis are carried, because flattening them would attribute five other poets' work
//     to him.
//
// Tamil authority: works/parasakthi/scenes/scene-NN.md — the verified scene derivatives. Provenance
// comments are stripped and captured as structured page metadata; all Tamil text, speaker labels,
// stage directions, verse lineation and punctuation are preserved verbatim.
// English authority: works/parasakthi/translations/records/scene-NN.json — the 769 verified units,
// carried with their kind and exact source speaker_label (including null). Never retranslated.
//
// Usage: node scripts/import-parasakthi.mjs <path-to-cinema-works-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-parasakthi.mjs <cinema-works-clone> <source-commit>");
  process.exit(1);
}
const die = (m) => {
  throw new Error(m);
};

// ── APPROVED PIN ────────────────────────────────────────────────────────────────────────────────
// The work-specific commit, not the source repository's main. Source main has moved on by ~1800
// commits for unrelated cinema work (a second film, Manohara updates, docs); NONE of it touches
// works/parasakthi. Pinning the last commit that actually changed this work keeps the import
// reproducible and independent of the rest of the archive's activity.
const APPROVED_SOURCE_COMMIT = "a593db5079e76887abeb41d9c2abfd978a7fe9a5";
const EXPECT_SCAN_SHA256 = "b0024315ca2018a63807b8ff44eb02d132868a7250e6399a2144a10e47c4ad4c";
const EXPECT_TRANSLATION_AGGREGATE = "a409ce63863c357ff729594147234b8e38406ac2d67fdd388c68d19f47760608";
// Every NON-ENGLISH source file this importer reads, hashed exactly as the archive hashes its own
// translation inputs: sorted relative path, NUL, raw bytes, NUL. Computed once from a clean checkout
// of the approved pin and hard-coded, so it is never derived from the tree it is meant to police.
//
// It exists because matching `git rev-parse HEAD` proves which COMMIT is checked out, not which
// BYTES were read. A clone can sit at the approved pin with a single Tamil word edited in the
// working tree: every structural invariant still holds, and the generated provenance would go on
// claiming the pinned commit. This closes that gap.
const EXPECT_SOURCE_INPUT_AGGREGATE = "38a0257bdf958481f7da560e4e8b4048b78bb329e8ccf6955095da479670a6c6";
const EXPECT_SOURCE_INPUT_FILES = 55;
const EXPECT_PDF_PAGES = 58;
const EXPECT_CANONICAL_PDF = "4-57";
const EXPECT_CANONICAL_PRINTED = "3-56";
const EXPECT_ABSENT = [23, 34];
const EXPECT_SCENES = Array.from({ length: 48 }, (_, i) => i + 1).filter((n) => !EXPECT_ABSENT.includes(n));
const EXPECT_SCENE_COUNT = 46;
const EXPECT_DIALOGUE_RECORDS = 642;
const EXPECT_TRANSLATION_UNITS = 769;
const EXPECT_UNIT_KINDS = { dialogue: 641, "stage-direction": 114, song: 13, "quoted-verse": 1 };
const EXPECT_SONG_ITEMS = 14;
const EXPECT_SOUNDTRACK_TRACKS = 11;
const EXPECT_SOUNDTRACK_OCCURRENCES = 13;
const EXPECT_QUOTED_VERSE = 1;
const EXPECT_BOOKLET_CONTRIBUTORS = 6;
// The two printed misnumberings, as the booklet shows them.
const EXPECT_ANOMALY = [
  { canonical: 43, source: 48, pdf: 49, printed: 48 },
  { canonical: 48, source: 43, pdf: 57, printed: 56 },
];

if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) {
  die(`supplied source commit ${SRC_COMMIT} is not the approved pin ${APPROVED_SOURCE_COMMIT}.`);
}
let head;
try {
  head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  die(`unable to read git HEAD of the source clone at ${SRC_REPO}: ${e.message}`);
}
if (head !== APPROVED_SOURCE_COMMIT) {
  die(`${SRC_REPO} is at ${head}, not the approved pin ${APPROVED_SOURCE_COMMIT}. Refusing to import.`);
}

const W = path.join(SRC_REPO, "works/parasakthi");
const OUT = path.join(process.cwd(), "public/data/cinema/parasakthi");
const SCENE_OUT = path.join(OUT, "scenes");

const nfc = (s) => s.normalize("NFC");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ── 1. SOURCE IDENTITY ──────────────────────────────────────────────────────────────────────────
const worksJson = readJSON(path.join(SRC_REPO, "data/works.json"));
const workEntry = (Array.isArray(worksJson) ? worksJson : worksJson.works).find((w) => w.id === "parasakthi");
if (!workEntry) die("works.json has no `parasakthi` entry.");
const manifest = readJSON(path.join(W, "editions/en/manifest.json"));
const sceneIndex = readJSON(path.join(W, "scenes/index.json"));
const dialogueIndex = readJSON(path.join(W, "dialogues/index.json"));
const songIndex = readJSON(path.join(W, "songs/index.json"));
const songInventory = readJSON(path.join(W, "songs/inventory.json"));
const songCredits = readJSON(path.join(W, "songs/credits.json"));
const tracklist = readJSON(path.join(W, "songs/tracklist-evidence.json"));
const translationIndex = readJSON(path.join(W, "translations/index.json"));

// The scan hash is the anchor for the whole edition; three independent places must agree.
if (workEntry.source_sha256 !== EXPECT_SCAN_SHA256) die(`works.json scan sha256 is ${workEntry.source_sha256}, expected ${EXPECT_SCAN_SHA256}`);
if (manifest.source_scan_sha256 !== EXPECT_SCAN_SHA256) die(`English manifest scan sha256 is ${manifest.source_scan_sha256}, expected ${EXPECT_SCAN_SHA256}`);
const metaYaml = readText(path.join(W, "metadata.yaml"));
if (!metaYaml.includes(EXPECT_SCAN_SHA256)) die("metadata.yaml does not record the expected scan sha256.");
if (workEntry.source_pdf_pages !== EXPECT_PDF_PAGES) die(`pdf page count is ${workEntry.source_pdf_pages}, expected ${EXPECT_PDF_PAGES}`);
if (sceneIndex.canonical_pdf_pages !== EXPECT_CANONICAL_PDF) die(`canonical pdf range is ${sceneIndex.canonical_pdf_pages}, expected ${EXPECT_CANONICAL_PDF}`);
if (sceneIndex.canonical_printed_pages !== EXPECT_CANONICAL_PRINTED) die(`canonical printed range is ${sceneIndex.canonical_printed_pages}, expected ${EXPECT_CANONICAL_PRINTED}`);
// 54 canonical pages, every one archive-verified. This is an archive-recorded verification state,
// not a claim that a person proofread the pages.
if (workEntry.total_canonical_pages !== 54 || workEntry.total_verified_pages !== 54 || workEntry.total_review_pages !== 0) {
  die(`canonical page verification is ${workEntry.total_verified_pages}/${workEntry.total_canonical_pages} with ${workEntry.total_review_pages} in review; expected 54/54 and 0.`);
}

// ── 2. SCENE STRUCTURE, ABSENCES AND THE PRINTED MISNUMBERING ───────────────────────────────────
if (sceneIndex.scenes.length !== EXPECT_SCENE_COUNT) die(`scene index has ${sceneIndex.scenes.length} records, expected ${EXPECT_SCENE_COUNT}`);
const canonical = sceneIndex.scenes.map((s) => s.canonical_heading);
if (JSON.stringify(canonical) !== JSON.stringify(EXPECT_SCENES)) {
  die(`canonical scene sequence is not 1–48 minus ${EXPECT_ABSENT.join(" and ")}: got ${canonical.join(",")}`);
}
if (JSON.stringify(sceneIndex.headings_not_observed) !== JSON.stringify(EXPECT_ABSENT)) {
  die(`headings_not_observed is ${JSON.stringify(sceneIndex.headings_not_observed)}, expected ${JSON.stringify(EXPECT_ABSENT)}`);
}
for (const n of EXPECT_ABSENT) {
  if (fs.existsSync(path.join(W, "scenes", `scene-${String(n).padStart(2, "0")}.md`))) {
    die(`scene ${n} is not printed in the booklet but a scene file exists for it. Refusing to fabricate it.`);
  }
}
const anomalies = sceneIndex.scenes.filter((s) => s.source_heading !== s.canonical_heading);
if (anomalies.length !== EXPECT_ANOMALY.length) die(`expected exactly ${EXPECT_ANOMALY.length} printed misnumberings, found ${anomalies.length}`);
for (const e of EXPECT_ANOMALY) {
  const got = anomalies.find((a) => a.canonical_heading === e.canonical);
  if (!got) die(`the printed misnumbering for canonical scene ${e.canonical} is missing from the scene index.`);
  if (got.source_heading !== e.source || got.pdf_page !== e.pdf || got.printed_page !== e.printed) {
    die(`canonical scene ${e.canonical}: expected source heading ${e.source} on pdf ${e.pdf} / printed ${e.printed}, got ${got.source_heading} on pdf ${got.pdf_page} / printed ${got.printed_page}`);
  }
  if (got.editorial_number_correction !== true) die(`canonical scene ${e.canonical} is not flagged editorial_number_correction.`);
}

// ── 3. TAMIL SCENE DERIVATIVES ──────────────────────────────────────────────────────────────────
// Paragraph classification uses only what the source itself marks:
//   dialogue        — the paragraph opens with a source speaker label (`LABEL : ` / `LABEL: `);
//   stage-direction — the paragraph opens with `(`;
//   verse           — the paragraph uses Markdown hard breaks (trailing two spaces), which is how
//                     the derivative lineates song and verse blocks;
//   prose           — anything else, carried as-is rather than forced into a category.
// No label is invented: `speakerLabel` is only ever the exact printed label.
const PAGE_RE = /^<!--\s*source:\s*pdf=(\d+)\s+printed=(\d+)\s+status=(\w+)\s*-->$/;
const DERIV_RE = /^<!--\s*derivative provenance:/;
// Scene 30 is the one scene whose text crosses the archive's part-01/part-02 boundary, and the
// derivative says so in its own comment. It is captured as a note rather than dropped, and the
// parser still refuses any comment kind it has not been taught — an unrecognised one is a signal
// that the source model changed, not something to skip.
const CONT_RE = /^<!--\s*derivative continuation:\s*(.+?)\s*-->$/;
const HEADING_RE = /^###\s+(.+)$/;
const LABEL_RE = /^([^:()\n]{1,40}?)\s*:\s(.*)$/;

function parseScene(md) {
  const lines = nfc(md).split("\n");
  const pageProvenance = [];
  const continuationNotes = [];
  let headingText = null;
  const kept = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, (m) => m.replace(/[^ ]/g, "")); // keep trailing spaces, drop \r
    const t = line.trim();
    const pm = t.match(PAGE_RE);
    if (pm) {
      pageProvenance.push({ pdfPage: Number(pm[1]), printedPage: Number(pm[2]), status: pm[3] });
      continue;
    }
    if (DERIV_RE.test(t)) continue;
    const cm = t.match(CONT_RE);
    if (cm) {
      continuationNotes.push(cm[1]);
      continue;
    }
    if (t.startsWith("<!--")) die(`unrecognised provenance comment in a scene derivative: ${t.slice(0, 90)}`);
    const hm = t.match(HEADING_RE);
    if (hm) {
      if (headingText !== null) die(`a scene derivative contains more than one heading: ${t}`);
      headingText = hm[1].trim();
      continue;
    }
    kept.push(line);
  }
  // Blank-line separated paragraphs.
  const paras = [];
  let cur = [];
  for (const l of kept) {
    if (!l.trim()) {
      if (cur.length) paras.push(cur), (cur = []);
    } else cur.push(l);
  }
  if (cur.length) paras.push(cur);

  const blocks = paras.map((p) => {
    const text = p.join("\n");
    const lm = p[0].match(LABEL_RE);
    if (lm && !p[0].startsWith("(")) {
      return { kind: "dialogue", speakerLabel: lm[1].trim(), text };
    }
    if (p[0].startsWith("(")) return { kind: "stage-direction", text };
    if (p.some((l) => l.endsWith("  "))) return { kind: "verse", text };
    return { kind: "prose", text };
  });
  return { headingText, pageProvenance, continuationNotes, blocks };
}

const scenes = [];
let dialogueBlockTotal = 0;
for (const rec of sceneIndex.scenes) {
  const file = path.join(W, "scenes", rec.file);
  if (!fs.existsSync(file)) die(`scene index names ${rec.file} but the file does not exist.`);
  const md = readText(file);
  const parsed = parseScene(md);
  if (!parsed.headingText) die(`${rec.file} has no scene heading.`);
  // The heading the derivative prints must carry the CANONICAL number, with the printed reading
  // recorded separately — never the other way round.
  if (!parsed.headingText.includes(String(rec.canonical_heading))) {
    die(`${rec.file} heading "${parsed.headingText}" does not carry canonical scene ${rec.canonical_heading}.`);
  }
  if (!parsed.blocks.length) die(`${rec.file} produced no reading blocks.`);
  dialogueBlockTotal += parsed.blocks.filter((b) => b.kind === "dialogue").length;

  // EXACT RECONSTRUCTION: the blocks must rebuild the source file byte for byte once its heading
  // and provenance comments are removed. This is what proves nothing was dropped or reworded.
  const stripped = nfc(md)
    .split("\n")
    .filter((l) => !PAGE_RE.test(l.trim()) && !DERIV_RE.test(l.trim()) && !CONT_RE.test(l.trim()) && !HEADING_RE.test(l.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const rebuilt = parsed.blocks.map((b) => b.text).join("\n\n").trim();
  if (rebuilt !== stripped) die(`${rec.file}: block reconstruction does not equal the source text.`);

  scenes.push({ rec, parsed });
}
if (dialogueBlockTotal !== EXPECT_DIALOGUE_RECORDS) {
  die(`Tamil scene text yields ${dialogueBlockTotal} speaker-labelled blocks but the dialogue index records ${EXPECT_DIALOGUE_RECORDS}.`);
}
if (dialogueIndex.dialogue_records !== EXPECT_DIALOGUE_RECORDS) die(`dialogue index reports ${dialogueIndex.dialogue_records} records, expected ${EXPECT_DIALOGUE_RECORDS}`);
if (dialogueIndex.status !== "complete-verified") die(`dialogue index status is ${dialogueIndex.status}`);
// The three scenes with no labelled dialogue are NOT empty scenes — they carry stage directions and
// full song blocks. Asserting both facts together stops a future dialogue-only reader from being
// mistaken for a complete one.
const EXPECT_ZERO_DIALOGUE_SCENES = [26, 29, 48];
if (JSON.stringify(dialogueIndex.zero_record_scenes) !== JSON.stringify(EXPECT_ZERO_DIALOGUE_SCENES)) {
  die(`zero-dialogue scenes are ${JSON.stringify(dialogueIndex.zero_record_scenes)}, expected ${JSON.stringify(EXPECT_ZERO_DIALOGUE_SCENES)}`);
}
for (const n of EXPECT_ZERO_DIALOGUE_SCENES) {
  const s = scenes.find((x) => x.rec.canonical_heading === n);
  const nonDialogue = s.parsed.blocks.filter((b) => b.kind !== "dialogue").length;
  if (s.parsed.blocks.some((b) => b.kind === "dialogue")) die(`scene ${n} should hold no labelled dialogue but does.`);
  if (nonDialogue === 0) die(`scene ${n} has no reading content; the scene text layer lost its stage directions and songs.`);
}

// ── 4. ENGLISH UNITS ────────────────────────────────────────────────────────────────────────────
// Recompute the archive's own aggregate hash over the exact 47 translation inputs, so a single
// changed byte anywhere in the English layer stops the import.
const trDir = path.join(W, "translations/records");
const trFiles = fs.readdirSync(trDir).filter((f) => f.endsWith(".json")).map((f) => path.join(trDir, f));
const aggInputs = [path.join(W, "translations/index.json"), ...trFiles].sort();
const agg = crypto.createHash("sha256");
for (const p of aggInputs) {
  agg.update(path.relative(SRC_REPO, p).split(path.sep).join("/"));
  agg.update(Buffer.from([0]));
  agg.update(fs.readFileSync(p));
  agg.update(Buffer.from([0]));
}
const aggHex = agg.digest("hex");
if (aggHex !== EXPECT_TRANSLATION_AGGREGATE) {
  die(`translation input aggregate sha256 is ${aggHex}, expected ${EXPECT_TRANSLATION_AGGREGATE}. The English layer changed.`);
}
if (manifest.translation_input_aggregate_sha256 !== EXPECT_TRANSLATION_AGGREGATE) die("manifest disagrees with the expected translation aggregate.");

const englishByScene = new Map();
const seenUnitIds = new Set();
const kindCounts = {};
for (const rec of sceneIndex.scenes) {
  const p = path.join(trDir, `scene-${String(rec.canonical_heading).padStart(2, "0")}.json`);
  if (!fs.existsSync(p)) die(`no English record file for canonical scene ${rec.canonical_heading}`);
  const d = readJSON(p);
  if (d.canonical_scene !== rec.canonical_heading) die(`${p} declares scene ${d.canonical_scene}, expected ${rec.canonical_heading}`);
  const units = d.units.map((u) => {
    if (u.status !== "verified") die(`English unit ${u.id} has status ${u.status}; only verified units may be imported.`);
    if (seenUnitIds.has(u.id)) die(`duplicate English unit id ${u.id}`);
    seenUnitIds.add(u.id);
    kindCounts[u.kind] = (kindCounts[u.kind] || 0) + 1;
    // The English layer stores text in TWO shapes and the difference is meaningful:
    //   `english_text`  — prose, 741 units;
    //   `english_lines` — 17 verse units (13 song, 1 quoted verse and 3 speaker-labelled sung
    //                     dialogue lines), lineated and marked `mode: semantic-poetic`.
    // Flattening `english_lines` into one paragraph would silently destroy the lineation of every
    // translated song, so lineated units keep their lines and say so.
    // `english_page_segments` (11 cross-page units) is the per-page split of text already whole in
    // `english_text`; it is page provenance and does not belong in the reading layer.
    const tr = u.translation ?? {};
    const lines = Array.isArray(tr.english_lines) ? tr.english_lines.map(nfc) : null;
    const text = tr.english_text != null ? nfc(tr.english_text) : lines ? lines.join("\n") : null;
    if (text == null) die(`English unit ${u.id} has neither english_text nor english_lines.`);
    return {
      id: u.id,
      kind: u.kind,
      // The exact source label, INCLUDING null. A null here means the source labelled nobody, and
      // inventing one would put words in a named character's mouth.
      speakerLabel: u.source?.speaker_label ?? null,
      text,
      lines,
      mode: tr.mode ?? null,
      sourceOccurrenceId: u.source?.source_occurrence_id ?? null,
    };
  });
  englishByScene.set(rec.canonical_heading, units);
}
const unitTotal = [...englishByScene.values()].reduce((n, u) => n + u.length, 0);
if (unitTotal !== EXPECT_TRANSLATION_UNITS) die(`imported ${unitTotal} English units, expected ${EXPECT_TRANSLATION_UNITS}`);
if (seenUnitIds.size !== EXPECT_TRANSLATION_UNITS) die(`English unit ids are not unique: ${seenUnitIds.size} distinct of ${unitTotal}`);
for (const [k, v] of Object.entries(EXPECT_UNIT_KINDS)) {
  if (kindCounts[k] !== v) die(`English unit kind "${k}" count is ${kindCounts[k] ?? 0}, expected ${v}`);
}
if (Object.keys(kindCounts).length !== Object.keys(EXPECT_UNIT_KINDS).length) {
  die(`unexpected English unit kinds: ${Object.keys(kindCounts).join(", ")}`);
}
const EXPECT_LINEATED_UNITS = 17;
const lineated = [...englishByScene.values()].flat().filter((u) => u.lines);
if (lineated.length !== EXPECT_LINEATED_UNITS) {
  die(`expected ${EXPECT_LINEATED_UNITS} lineated English units, found ${lineated.length}. Verse lineation must not be lost.`);
}
if (lineated.some((u) => u.mode !== "semantic-poetic")) die("a lineated English unit is not marked semantic-poetic; the verse model changed.");
if (lineated.some((u) => u.lines.length < 2)) die("a lineated English unit has fewer than two lines.");
if (translationIndex.status !== "complete-verified") die(`translation index status is ${translationIndex.status}`);
if (manifest.qa_status !== "PASS") die(`English reader edition QA status is ${manifest.qa_status}`);

// ── 5. SONGS AND THE QUOTED VERSE ───────────────────────────────────────────────────────────────
const songRecords = songInventory.records;
if (songRecords.length !== EXPECT_SONG_ITEMS) die(`song inventory has ${songRecords.length} records, expected ${EXPECT_SONG_ITEMS}`);
if (songIndex.soundtrack_tracks !== EXPECT_SOUNDTRACK_TRACKS) die(`soundtrack tracks ${songIndex.soundtrack_tracks}, expected ${EXPECT_SOUNDTRACK_TRACKS}`);
if (songIndex.soundtrack_occurrence_records !== EXPECT_SOUNDTRACK_OCCURRENCES) die(`soundtrack occurrences ${songIndex.soundtrack_occurrence_records}, expected ${EXPECT_SOUNDTRACK_OCCURRENCES}`);
if (songIndex.quoted_verse_records !== EXPECT_QUOTED_VERSE) die(`quoted verse records ${songIndex.quoted_verse_records}, expected ${EXPECT_QUOTED_VERSE}`);
if (songCredits.contributors_as_printed.length !== EXPECT_BOOKLET_CONTRIBUTORS) die(`booklet lists ${songCredits.contributors_as_printed.length} song contributors, expected ${EXPECT_BOOKLET_CONTRIBUTORS}`);
// The booklet does NOT pair a name to a song. If that ever changed, the item-level evidence tiers
// below would mean something different and must be re-reasoned rather than silently reused.
if (songCredits.item_level_assignment_present !== false) die("songs/credits.json now claims item-level booklet crediting; the evidence model must be revisited.");

const songs = songRecords.map((r) => {
  const a = r.authorship || {};
  if (a.status !== "verified") die(`song item ${r.id} authorship status is ${a.status}; expected verified.`);
  if (!a.lyricist_ta) die(`song item ${r.id} has no lyricist; attribution must not be dropped.`);
  if (!a.evidence_basis) die(`song item ${r.id} has no evidence_basis; the evidence tier must not be dropped.`);
  return {
    id: r.id,
    canonicalScene: r.canonical_scene,
    kind: r.candidate_kind,
    openingLineTa: r.opening_line_ta,
    lyricistTa: a.lyricist_ta,
    // `external-source` = a secondary tracklist, NOT the booklet. `canonical-context-explicit` = the
    // booklet's own text names the poet. Carrying the tier is the point: they are not equal evidence.
    evidenceBasis: a.evidence_basis,
    evidenceReference: a.evidence_reference ?? null,
    performanceContext: r.performance_context ?? null,
    reprisesId: r.relation?.type === "reprise-of" ? r.relation.target_id : null,
  };
});
const kalaignarSongs = songs.filter((s) => s.lyricistTa === "மு. கருணாநிதி");
if (kalaignarSongs.length !== 1) {
  die(`expected exactly 1 song attributed to மு. கருணாநிதி, found ${kalaignarSongs.length}. The booklet's songs have six credited contributors and must not be collapsed.`);
}
const quoted = songs.filter((s) => s.kind === "quoted-verse");
if (quoted.length !== EXPECT_QUOTED_VERSE) die(`expected ${EXPECT_QUOTED_VERSE} quoted verse, found ${quoted.length}`);

// ── 6. EXACT PINNED-CONTENT GUARD ───────────────────────────────────────────────────────────────
// Deliberately LAST among the checks and still before a single byte is written.
//
// Placing it first would be easier and worse: every mutation — a fabricated scene, a dropped
// lyricist, a repaired misprint — would collapse into one generic "aggregate mismatch", and the
// semantic guards above would stop proving anything. Run last, they keep reporting what actually
// went wrong, and this catches the one class they cannot see: a change that alters bytes while
// preserving every structure they inspect.
//
// The set is defined by a rule, not a hand-list: every non-English source file the importer reads
// and relies on. The English side is deliberately excluded because it is already byte-covered by
// EXPECT_TRANSLATION_AGGREGATE — `translations/index.json` and all 46 record files are exactly the
// 47 inputs of that hash, so including them here would duplicate the same guarantee.
const sourceInputRel = [
  "data/works.json",
  "works/parasakthi/metadata.yaml",
  "works/parasakthi/scenes/index.json",
  "works/parasakthi/dialogues/index.json",
  "works/parasakthi/songs/index.json",
  "works/parasakthi/songs/inventory.json",
  "works/parasakthi/songs/credits.json",
  "works/parasakthi/songs/tracklist-evidence.json",
  "works/parasakthi/editions/en/manifest.json",
  ...sceneIndex.scenes.map((s) => `works/parasakthi/scenes/${s.file}`),
].sort();
if (sourceInputRel.length !== EXPECT_SOURCE_INPUT_FILES) {
  die(`source input set has ${sourceInputRel.length} files, expected ${EXPECT_SOURCE_INPUT_FILES}`);
}
const srcAgg = crypto.createHash("sha256");
for (const rel of sourceInputRel) {
  const p = path.join(SRC_REPO, rel);
  if (!fs.existsSync(p)) die(`source input ${rel} does not exist in the clone.`);
  srcAgg.update(rel);
  srcAgg.update(Buffer.from([0]));
  srcAgg.update(fs.readFileSync(p)); // raw bytes, never normalised — this is a content check
  srcAgg.update(Buffer.from([0]));
}
const srcAggHex = srcAgg.digest("hex");
if (srcAggHex !== EXPECT_SOURCE_INPUT_AGGREGATE) {
  die(
    `source input aggregate sha256 is ${srcAggHex}, expected ${EXPECT_SOURCE_INPUT_AGGREGATE}. ` +
      `The clone is at the approved commit but its working-tree content does not match the pinned archive. ` +
      `Refusing to generate data that would claim a pin it did not come from.`,
  );
}

// ── 7. EMIT ─────────────────────────────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(SCENE_OUT, { recursive: true });
const write = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");

const sceneSummaries = [];
for (const { rec, parsed } of scenes) {
  const n = rec.canonical_heading;
  const slug = `scene-${String(n).padStart(2, "0")}`;
  const english = englishByScene.get(n);
  sceneSummaries.push({
    slug,
    canonicalScene: n,
    sourceHeading: rec.source_heading,
    editorialNumberCorrection: rec.source_heading !== n,
    headingTa: parsed.headingText,
    tamilBlockCount: parsed.blocks.length,
    englishUnitCount: english.length,
    songItemIds: songs.filter((s) => s.canonicalScene === n).map((s) => s.id),
  });
  write(path.join(SCENE_OUT, `${slug}.json`), {
    workId: "parasakthi",
    slug,
    canonicalScene: n,
    sourceHeading: rec.source_heading,
    editorialNumberCorrection: rec.source_heading !== n,
    headingTa: parsed.headingText,
    canonicalPart: rec.canonical_part,
    continuationNotes: parsed.continuationNotes,
    // Page provenance is carried for the SOURCE interface. It must not surface in the reader.
    pageProvenance: [{ pdfPage: rec.pdf_page, printedPage: rec.printed_page }, ...parsed.pageProvenance],
    tamil: { blocks: parsed.blocks },
    english: { units: english },
    songItems: songs.filter((s) => s.canonicalScene === n),
  });
}

write(path.join(OUT, "index.json"), {
  workId: "parasakthi",
  titleTa: workEntry.title_ta,
  sourceTitleTa: workEntry.source_title_ta,
  titleEn: "Parasakthi",
  shelf: "cinema-writing",
  readerStructure: "scene",
  // Unlike Manohara, these numbers are the BOOKLET'S OWN.
  sceneNumbering: "source-printed",
  sceneCount: EXPECT_SCENE_COUNT,
  canonicalSceneRange: "1-48",
  absentCanonicalScenes: EXPECT_ABSENT,
  editorialNumberCorrections: EXPECT_ANOMALY.map((a) => ({ canonicalScene: a.canonical, sourceHeading: a.source })),
  scenes: sceneSummaries,
  songs,
});

write(path.join(OUT, "provenance.json"), {
  workId: "parasakthi",
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourcePath: "works/parasakthi",
  sourceCommit: APPROVED_SOURCE_COMMIT,
  sourceCommitNote:
    "The last commit that changed works/parasakthi. The source repository's main has moved well beyond it for unrelated cinema work; no later commit touches this work.",
  source: {
    identifier: workEntry.source_identifier,
    filename: "TVA_BOK_0062968_பராசக்தி.pdf",
    scanSha256: EXPECT_SCAN_SHA256,
    pdfPages: EXPECT_PDF_PAGES,
    canonicalPdfPages: EXPECT_CANONICAL_PDF,
    canonicalPrintedPages: EXPECT_CANONICAL_PRINTED,
    rearAdvertisementPdfPage: 58,
    scanType: "image_only",
    publicationYearAsPrinted: null,
    editionAsPrinted: null,
    publisherAsPrinted: null,
    controllingSourceNote:
      "The controlling source is the scanned booklet; it is not committed to either repository. Publication year, edition and publisher are not printed and are not inferred.",
  },
  creditsAsPrinted: {
    titlePageRoleTa: "திரைக்கதை, வசனம்",
    titlePageNameTa: "கலைஞர் மு. கருணாநிதி",
    creditsPageRoleTa: "கதை-வசனம்",
    creditsPageNameTa: "கலைஞர் மு. கருணாநிதி",
  },
  structure: {
    sceneHeadingsObserved: EXPECT_SCENE_COUNT,
    canonicalRange: "1-48",
    absentCanonicalScenes: EXPECT_ABSENT,
    absenceNote:
      "Headings 23 and 34 are not printed anywhere in the booklet. The absence is recorded as absence: no scene is fabricated for either number, and neither has a reading page.",
    editorialNumberCorrections: EXPECT_ANOMALY.map((a) => ({
      canonicalScene: a.canonical,
      sourceHeading: a.source,
      pdfPage: a.pdf,
      printedPage: a.printed,
    })),
    misnumberingNote:
      "The booklet transposes two late scene numbers: PDF 49 prints heading 48 where the running order requires 43, and PDF 57 prints 43 where it requires 48. The archive reads them canonically for sequencing and preserves both printed readings. Reader order follows the canonical numbers; the printed readings are recorded here and never presented as the canonical ones.",
  },
  tamil: {
    authority: "works/parasakthi/scenes/scene-NN.md",
    sceneDerivatives: EXPECT_SCENE_COUNT,
    dialogueRecords: EXPECT_DIALOGUE_RECORDS,
    canonicalPages: 54,
    verifiedPages: 54,
    reviewPages: 0,
    verificationNote:
      "`verified` is the source archive's recorded state for its own fidelity audit of the 54 canonical pages. It is an archive-recorded verification state, not a claim that a person proofread the pages.",
    contentNote:
      "The reading layer is the full scene text, not the dialogue records. Scenes 26, 29 and 48 hold zero dialogue records yet are not empty: they carry stage directions and complete song blocks, which a dialogue-only reader would have lost.",
  },
  english: {
    authority: "works/parasakthi/translations/records",
    kind: "project-created",
    kindBasis:
      "An archive-produced translation derived from the archive's own verified Tamil scene derivatives. It is not a separately published translation, and the source does not describe it as one.",
    translationUnits: EXPECT_TRANSLATION_UNITS,
    unitKindCounts: EXPECT_UNIT_KINDS,
    scenesVerified: EXPECT_SCENE_COUNT,
    absentCanonicalScenes: EXPECT_ABSENT,
    readerEditionQa: "PASS",
    qaNote:
      "`complete-verified` and `QA PASS` are the source archive's recorded states from its automated whole-work reader QA. They do not establish that a human editorial review was completed, and no such review is claimed.",
  },
  songs: {
    bookletCredits: {
      pdfPage: songCredits.source_pdf_page,
      headingTa: songCredits.source_section_heading,
      scope: "booklet-wide",
      contributorsAsPrinted: songCredits.contributors_as_printed,
      itemLevelAssignmentPresent: false,
      note:
        "The booklet's song-credits page lists six contributors for the songs as a whole and pairs no name with any individual song. Item-level authorship therefore does not come from the booklet.",
    },
    itemLevelAuthority: {
      occurrenceRecords: EXPECT_SONG_ITEMS,
      soundtrackTracks: EXPECT_SOUNDTRACK_TRACKS,
      soundtrackOccurrences: EXPECT_SOUNDTRACK_OCCURRENCES,
      quotedVerseRecords: EXPECT_QUOTED_VERSE,
      evidenceTiers: {
        "external-source":
          "A secondary tracklist: a user-supplied screenshot matched against the Tamil Wikipedia soundtrack table for the 1952 film. This is weaker evidence than the printed booklet and is labelled as such on every item that rests on it.",
        "canonical-context-explicit":
          "The booklet's own text names the poet immediately before the verse.",
      },
      externalEvidence: {
        evidenceId: tracklist.evidence_id,
        evidenceType: tracklist.evidence_type,
        publicSource: tracklist.identified_public_source,
        qualityNote: tracklist.source_quality_note,
      },
      attributionNote:
        "Exactly one of the fourteen song/verse occurrences is attributed to மு. கருணாநிதி. The other thirteen are attributed to பாரதிதாசன், கே. பி. காமாட்சிசுந்தரம், உடுமலை நாராயண கவி, சுப்பிரமணிய பாரதி and அண்ணல் தங்கோ. The booklet credits Kalaignar with the screenplay and dialogue; it does not make him the lyricist of these songs.",
    },
    items: songs,
  },
  integrity: {
    sourceScanSha256: EXPECT_SCAN_SHA256,
    // Exact-content proof for the non-English source inputs: the generated data is bound to the
    // pinned archive's BYTES, not merely to a clone whose HEAD names the pin.
    sourceInputAggregateSha256: EXPECT_SOURCE_INPUT_AGGREGATE,
    sourceInputFiles: sourceInputRel.length,
    translationInputAggregateSha256: EXPECT_TRANSLATION_AGGREGATE,
    translationInputFiles: aggInputs.length,
    readerEditionOutputs: manifest.outputs,
  },
  // rights is deliberately ABSENT. Parasakthi is a composite publication: Kalaignar's screenplay and
  // dialogue alongside songs by five other named poets. The project's nationalisation rights model
  // covers works authored by Kalaignar and cannot be applied wholesale to this booklet's every
  // textual layer. A scoped attribution model is future work; until then, no rights claim is made.
  notes: [
    "Runtime never calls GitHub. This data is generated at import time from a pinned source clone.",
    "The source PDF is not vendored.",
    "Page and PDF numbers are carried for the source/provenance interface and must not appear in the reading interface.",
  ],
});

console.log(`parasakthi — ${EXPECT_SCENE_COUNT} scenes, ${dialogueBlockTotal} Tamil dialogue blocks, ${unitTotal} English units, ${songs.length} song/verse items`);
console.log(`  absent canonical scenes: ${EXPECT_ABSENT.join(", ")}`);
console.log(`  printed misnumberings preserved: ${EXPECT_ANOMALY.map((a) => `canonical ${a.canonical} prints ${a.source}`).join("; ")}`);
console.log(`  songs attributed to மு. கருணாநிதி: ${kalaignarSongs.length} of ${songs.length}`);
console.log(`  wrote ${OUT}`);
