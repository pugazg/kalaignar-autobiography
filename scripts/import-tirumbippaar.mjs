#!/usr/bin/env node
// Deterministic Tirumbippaar import — Phase D2.1.
//
// Consumes ONLY the pinned, published Tirumbippaar derivatives from
// pugazg/kalaignar-cinema-works and emits the website's generated reading data.
// Nothing here reaches the network: the caller supplies a clone, and every fact
// this script asserts comes from that clone at one approved commit.
//
// Usage: node scripts/import-tirumbippaar.mjs <clone-dir> <commit-sha>
//
// Tirumbippaar differs from Parasakthi in ways that must NOT be flattened:
//   * 93 scene headings, observed consecutively 1–93 — no gaps, no repeats and
//     no editorial renumbering. Parasakthi's absent-heading and misnumbering
//     machinery has no counterpart here and is deliberately absent.
//   * the English edition carries `song-reference`, `chant` and `written-text`
//     units and ZERO full `song` units, because no complete lyric body is
//     printed for either source-named song.
//   * this work has a character layer (39 entities over 45 exact labels) that
//     Parasakthi does not.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-tirumbippaar.mjs <clone-dir> <commit-sha>");
  process.exit(2);
}
const die = (m) => {
  console.error(`import-tirumbippaar: ${m}`);
  process.exit(1);
};

// ── APPROVED PIN AND EXPECTED SOURCE FACTS ────────────────────────────────────
// Every constant below is a fact of the published archive at this commit. They
// are assertions, not configuration: if the archive changes, this importer must
// fail loudly rather than quietly emit data that claims a pin it did not match.
const APPROVED_SOURCE_COMMIT = "6a8c59c445890e568dfe65cc36c2900dd2a8a0b3";
const EXPECT_SCAN_SHA256 = "973b9c3f7b84d6a1902a4a472af8799c783bf1ec2d6cd015796fc1df1ce59682";
const EXPECT_SOURCE_INPUT_AGGREGATE = "db3c6361e7e9d508fdf4d128fc7e4e7389b81d9312953ee13cd6fa007b1822c1";
const EXPECT_SOURCE_INPUT_FILES = 198;
const EXPECT_TRANSLATION_AGGREGATE = "b4064013fdfb70dca8d7b1375abfa2fe17dfc2787ac6d650bb056fe6896be786";
const EXPECT_TRANSLATION_INPUT_FILES = 94;

const EXPECT_IDENTIFIER = "TVA_BOK_0014652";
const EXPECT_PDF_PAGES = 112;
const EXPECT_CANONICAL_PDF = "9-112";
const EXPECT_CANONICAL_PRINTED = "1-104";
const EXPECT_CANONICAL_PAGES = 104;
const EXPECT_SCENE_COUNT = 93;
const EXPECT_DIALOGUE_RECORDS = 1042;
const EXPECT_TRANSLATION_UNITS = 1330;
const EXPECT_UNIT_KINDS = {
  dialogue: 1049,
  "stage-direction": 262,
  song: 0,
  "song-reference": 7,
  chant: 2,
  "written-text": 10,
};
const EXPECT_CROSS_PAGE_UNITS = 12;
const EXPECT_ZERO_DIALOGUE_SCENES = [10, 11, 25, 26, 43, 54];
// The reading layer's own census. It is NOT the dialogue-record count: see the
// note at the block/record check for why the two differ in this work.
const EXPECT_TAMIL_DIALOGUE_BLOCKS = 923;
const EXPECT_SEPARATOR_BLOCKS = 94;
const EXPECT_ENTITIES = 39;
const EXPECT_LABELS = 45;
const EXPECT_SONG_OCCURRENCES = 8;
const EXPECT_SONG_STATUS = { verified: 3, unresolved: 5 };
const EXPECT_EPUB_SHA256 = "955ce8adffe318ccbb5f77cb65afebb6951b7c7ac3091343adf2fd3dcb996ae0";

// Source readings settled upstream by direct inspection of the controlling scan.
// They are asserted here so a later archive change cannot silently reintroduce a
// superseded reading into the published website text.
const SETTLED_READING = "ஊஹும்";
const SUPERSEDED_READING = "ஊஹூம்";
const EXPECT_SETTLED_SCENE_OCCURRENCES = 5;
const SCENE45_SPEAKER_FORM = "பாண்டியன் : தொழிலாளர்கள்";
const FORBIDDEN_LABEL = "பாண்டியன்.";
// Source heading anomalies. These are what the booklet prints; regularising any
// of them would be a fidelity loss, so the importer asserts they survive.
const EXPECT_HEADING_ANOMALIES = [
  { scene: 5, contains: "காட்சி 5[" },
  { scene: 43, contains: "காட்சி 43]." },
];
const EXPECT_SCENE36_NO_CLOSING_GLYPH = 36;

const W = path.join(SRC_REPO, "works/tirumbippaar");
const OUT = path.join(process.cwd(), "public/data/cinema/tirumbippaar");
const SCENE_OUT = path.join(OUT, "scenes");

const nfc = (s) => s.normalize("NFC");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ── 1. PIN AND HEAD ───────────────────────────────────────────────────────────
if (SRC_COMMIT !== APPROVED_SOURCE_COMMIT) {
  die(`commit ${SRC_COMMIT} is not the approved Tirumbippaar pin ${APPROVED_SOURCE_COMMIT}.`);
}
const headFile = path.join(SRC_REPO, ".git/HEAD");
if (!fs.existsSync(headFile)) die(`${SRC_REPO} is not a git clone.`);
let head = readText(headFile).trim();
if (head.startsWith("ref:")) {
  const ref = head.slice(4).trim();
  const rp = path.join(SRC_REPO, ".git", ref);
  head = fs.existsSync(rp)
    ? readText(rp).trim()
    : (readText(path.join(SRC_REPO, ".git/packed-refs")).split("\n").find((l) => l.endsWith(` ${ref}`)) || "").split(" ")[0];
}
if (head !== APPROVED_SOURCE_COMMIT) die(`clone HEAD is ${head}, expected ${APPROVED_SOURCE_COMMIT}.`);

// ── 2. SOURCE SURFACES ────────────────────────────────────────────────────────
const worksJson = readJSON(path.join(SRC_REPO, "data/works.json"));
const workEntry = (Array.isArray(worksJson) ? worksJson : worksJson.works).find((w) => w.id === "tirumbippaar");
if (!workEntry) die("data/works.json has no tirumbippaar entry.");

const sceneIndex = readJSON(path.join(W, "scenes/index.json"));
const dialogueIndex = readJSON(path.join(W, "dialogues/index.json"));
const songIndex = readJSON(path.join(W, "songs/index.json"));
const songInventory = readJSON(path.join(W, "songs/inventory.json"));
const songCredits = readJSON(path.join(W, "songs/credits.json"));
const charIndex = readJSON(path.join(W, "characters/index.json"));
const charEntities = readJSON(path.join(W, "characters/entities.json"));
const charLabels = readJSON(path.join(W, "characters/labels-inventory.json"));
const translationIndex = readJSON(path.join(W, "translations/index.json"));
const manifest = readJSON(path.join(W, "editions/en/manifest.json"));
const pkgManifest = readJSON(path.join(W, "editions/en/package-manifest.json"));
const metaYaml = readText(path.join(W, "metadata.yaml"));

const yamlScalar = (key) => {
  const m = metaYaml.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
};

if (yamlScalar("identifier") !== EXPECT_IDENTIFIER) die(`source identifier is ${yamlScalar("identifier")}.`);
if (yamlScalar("sha256") !== EXPECT_SCAN_SHA256) die("metadata scan sha256 does not match the approved controlling scan.");
if (Number(yamlScalar("pdf_pages")) !== EXPECT_PDF_PAGES) die(`pdf_pages is ${yamlScalar("pdf_pages")}.`);
if (manifest.source_scan_sha256 !== EXPECT_SCAN_SHA256) die("reader manifest disagrees with the controlling scan hash.");
if (manifest.status !== "complete-verified") die(`reader manifest status is ${manifest.status}.`);
if (pkgManifest.status !== "complete-verified") die(`package manifest status is ${pkgManifest.status}.`);
if (pkgManifest.epub?.sha256 !== EXPECT_EPUB_SHA256) die("published EPUB hash does not match the approved package.");

// ── 3. SCENE STRUCTURE ────────────────────────────────────────────────────────
// Tirumbippaar's numbering is plain: 93 consecutive headings. Asserting that
// explicitly is what stops Parasakthi's gap/renumber model from being applied
// here by a later editor who assumes the two works are the same shape.
if (sceneIndex.canonical_pdf_pages !== EXPECT_CANONICAL_PDF) die(`canonical pdf range is ${sceneIndex.canonical_pdf_pages}.`);
if (sceneIndex.canonical_printed_pages !== EXPECT_CANONICAL_PRINTED) die(`canonical printed range is ${sceneIndex.canonical_printed_pages}.`);
if (sceneIndex.scene_headings_observed !== EXPECT_SCENE_COUNT) die(`scene_headings_observed is ${sceneIndex.scene_headings_observed}.`);
if ((sceneIndex.headings_not_observed || []).length) die("this work records no absent headings; the archive now says otherwise.");
const canonicalNums = sceneIndex.scenes.map((s) => s.canonical_heading);
const expectedNums = Array.from({ length: EXPECT_SCENE_COUNT }, (_, i) => i + 1);
if (JSON.stringify(canonicalNums) !== JSON.stringify(expectedNums)) die("canonical scene headings are not the consecutive run 1–93.");
const renumbered = sceneIndex.scenes.filter((s) => s.source_heading !== s.canonical_heading);
if (renumbered.length) die(`${renumbered.length} scene(s) disagree between source and canonical heading; this work has none.`);

// ── 4. TAMIL SCENE DERIVATIVES ────────────────────────────────────────────────
// Paragraph classification uses only what the source itself marks:
//   dialogue        — the paragraph opens with a source speaker label;
//   stage-direction — the paragraph opens with `(` or `[`, both of which the
//                     booklet uses for directions;
//   verse           — the paragraph uses Markdown hard breaks, the derivative's
//                     lineation for chant/performance material;
//   prose           — anything else, carried as-is rather than forced.
// No label is invented: speakerLabel is only ever the exact printed label.
// The archive marks a page anchor with an optional `zero_dialogue` flag where a
// page carries no speaker-labelled dialogue. It is captured rather than ignored,
// so the flag survives into the generated data instead of being silently dropped.
const PAGE_RE = /^<!--\s*source:\s*pdf=(\d+)\s+printed=(\d+)\s+status=([\w-]+)(\s+zero_dialogue=true)?\s*-->$/;
const DERIV_RE = /^<!--\s*derivative provenance:/;
const CONT_RE = /^<!--\s*derivative continuation:\s*(.+?)\s*-->$/;
const HEADING_RE = /^###\s+(.+)$/;
const LABEL_RE = /^([^:()[\]\n]{1,40}?)\s*:\s(.*)$/;

function parseScene(md) {
  const lines = nfc(md).split("\n");
  const pageProvenance = [];
  const continuationNotes = [];
  let headingText = null;
  const kept = [];
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const t = line.trim();
    const pm = t.match(PAGE_RE);
    if (pm) {
      pageProvenance.push({ pdfPage: Number(pm[1]), printedPage: Number(pm[2]), status: pm[3], zeroDialogue: Boolean(pm[4]) });
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
    // The booklet separates scenes with a decorative star. The archive's own
    // guidance is to keep such separators structural rather than let them become
    // reading text, so it is marked as its own kind and never rendered as prose.
    if (p.length === 1 && p[0].trim() === "★") return { kind: "separator", text };
    const lm = p[0].match(LABEL_RE);
    if (lm && !p[0].startsWith("(") && !p[0].startsWith("[")) {
      return { kind: "dialogue", speakerLabel: lm[1].trim(), text };
    }
    if (p[0].startsWith("(") || p[0].startsWith("[")) return { kind: "stage-direction", text };
    if (p.some((l) => l.endsWith("  "))) return { kind: "verse", text };
    return { kind: "prose", text };
  });
  return { headingText, pageProvenance, continuationNotes, blocks };
}

const scenes = [];
let dialogueBlockTotal = 0;
let separatorTotal = 0;
const pagesSeen = new Set();
for (const rec of sceneIndex.scenes) {
  const file = path.join(W, "scenes", rec.file);
  if (!fs.existsSync(file)) die(`scene index names ${rec.file} but the file does not exist.`);
  const md = readText(file);
  const parsed = parseScene(md);
  if (!parsed.headingText) die(`${rec.file} has no scene heading.`);
  if (!parsed.headingText.includes(String(rec.canonical_heading))) {
    die(`${rec.file} heading "${parsed.headingText}" does not carry canonical scene ${rec.canonical_heading}.`);
  }
  if (!parsed.blocks.length) die(`${rec.file} produced no reading blocks.`);
  if (!parsed.pageProvenance.length) die(`${rec.file} carries no page provenance.`);
  dialogueBlockTotal += parsed.blocks.filter((b) => b.kind === "dialogue").length;
  separatorTotal += parsed.blocks.filter((b) => b.kind === "separator").length;
  for (const p of parsed.pageProvenance) {
    if (p.printedPage !== p.pdfPage - 8) die(`${rec.file}: printed ${p.printedPage} is not pdf ${p.pdfPage} − 8.`);
    pagesSeen.add(p.pdfPage);
  }

  // EXACT RECONSTRUCTION: the blocks must rebuild the source file once its
  // heading and provenance comments are removed. This is what proves nothing was
  // dropped, reordered or reworded on the way into the website.
  const stripped = nfc(md)
    .split("\n")
    .filter((l) => {
      const t = l.trim();
      return !PAGE_RE.test(t) && !DERIV_RE.test(t) && !CONT_RE.test(t) && !HEADING_RE.test(t);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const rebuilt = parsed.blocks.map((b) => b.text).join("\n\n").trim();
  if (rebuilt !== stripped) die(`${rec.file}: block reconstruction does not equal the source text.`);

  scenes.push({ rec, parsed });
}
if (pagesSeen.size !== EXPECT_CANONICAL_PAGES) die(`scene derivatives cover ${pagesSeen.size} canonical pages, expected ${EXPECT_CANONICAL_PAGES}.`);
// Unlike Parasakthi, this work's paragraph blocks and its immutable dialogue
// records are deliberately DIFFERENT granularities and must not be forced to
// match. Ten scenes carry long speeches that the booklet prints across several
// paragraphs while the archive indexes them as multiple records, so the reading
// layer legitimately yields fewer labelled blocks than there are records. The
// census is asserted as the fact it is, and the record count is proved from the
// records themselves further down rather than inferred from paragraph shape.
if (dialogueBlockTotal !== EXPECT_TAMIL_DIALOGUE_BLOCKS) {
  die(`Tamil scene text yields ${dialogueBlockTotal} speaker-labelled blocks, expected ${EXPECT_TAMIL_DIALOGUE_BLOCKS}.`);
}
if (separatorTotal !== EXPECT_SEPARATOR_BLOCKS) die(`scene text yields ${separatorTotal} star separators, expected ${EXPECT_SEPARATOR_BLOCKS}.`);
if (dialogueIndex.dialogue_records !== EXPECT_DIALOGUE_RECORDS) die(`dialogue index reports ${dialogueIndex.dialogue_records} records.`);
if (JSON.stringify(dialogueIndex.zero_record_scenes) !== JSON.stringify(EXPECT_ZERO_DIALOGUE_SCENES)) {
  die(`zero-dialogue scenes are ${JSON.stringify(dialogueIndex.zero_record_scenes)}, expected ${JSON.stringify(EXPECT_ZERO_DIALOGUE_SCENES)}.`);
}
// Those six scenes hold no labelled dialogue but are NOT empty: they carry stage
// directions, chant, newspaper and performance material. Asserting both facts
// stops a dialogue-only reader from later being mistaken for a complete one.
for (const n of EXPECT_ZERO_DIALOGUE_SCENES) {
  const s = scenes.find((x) => x.rec.canonical_heading === n);
  if (!s) die(`zero-dialogue scene ${n} is missing.`);
  if (s.parsed.blocks.some((b) => b.kind === "dialogue")) die(`scene ${n} should hold no labelled dialogue but does.`);
  if (!s.parsed.blocks.some((b) => b.kind !== "separator")) die(`scene ${n} holds nothing but separators.`);
}

// ── 5. SETTLED SOURCE READINGS ────────────────────────────────────────────────
const allSceneText = scenes.map((s) => s.parsed.blocks.map((b) => b.text).join("\n")).join("\n");
const settledCount = (allSceneText.match(new RegExp(SETTLED_READING, "g")) || []).length;
if (settledCount !== EXPECT_SETTLED_SCENE_OCCURRENCES) {
  die(`the settled reading ${SETTLED_READING} appears ${settledCount}× in scene text, expected ${EXPECT_SETTLED_SCENE_OCCURRENCES}.`);
}
if (allSceneText.includes(SUPERSEDED_READING)) die(`the superseded reading ${SUPERSEDED_READING} is present in the imported reading text.`);
const scene45 = scenes.find((s) => s.rec.canonical_heading === 45);
if (!scene45.parsed.blocks.some((b) => b.text.includes(SCENE45_SPEAKER_FORM))) {
  die(`scene 45 does not carry the verified source form "${SCENE45_SPEAKER_FORM}".`);
}
if (scenes.some((s) => s.parsed.blocks.some((b) => b.speakerLabel === FORBIDDEN_LABEL))) {
  die(`a "${FORBIDDEN_LABEL}" speaker label was produced; the source prints no such label.`);
}
// Heading anomalies are source facts, not defects to tidy.
for (const a of EXPECT_HEADING_ANOMALIES) {
  const s = scenes.find((x) => x.rec.canonical_heading === a.scene);
  if (!s.parsed.headingText.includes(a.contains)) die(`scene ${a.scene} heading no longer prints "${a.contains}".`);
}
const s36 = scenes.find((x) => x.rec.canonical_heading === EXPECT_SCENE36_NO_CLOSING_GLYPH);
if (/காட்சி\s*36\s*[\])]/.test(s36.parsed.headingText)) {
  die("scene 36 now carries a closing glyph; the source prints none and it must not be regularised.");
}

// ── 6. ENGLISH LAYER ──────────────────────────────────────────────────────────
if (translationIndex.translation_units !== EXPECT_TRANSLATION_UNITS) die(`translation index reports ${translationIndex.translation_units} units.`);
if (JSON.stringify(translationIndex.unit_kind_counts) !== JSON.stringify(EXPECT_UNIT_KINDS)) {
  die(`English unit-kind census changed: ${JSON.stringify(translationIndex.unit_kind_counts)}`);
}
const st = translationIndex.unit_status_counts || {};
if (st.verified !== EXPECT_TRANSLATION_UNITS || st.draft || st.review) die(`English unit statuses are ${JSON.stringify(st)}.`);
if ((translationIndex.cross_page_translation_units || []).length !== EXPECT_CROSS_PAGE_UNITS) {
  die(`cross-page English units number ${(translationIndex.cross_page_translation_units || []).length}.`);
}

const dialogueIds = new Set();
for (const f of fs.readdirSync(path.join(W, "dialogues/records")).sort()) {
  const raw = readJSON(path.join(W, "dialogues/records", f));
  for (const r of Array.isArray(raw) ? raw : raw.records || []) dialogueIds.add(r.id);
}
if (dialogueIds.size !== EXPECT_DIALOGUE_RECORDS) die(`dialogue records resolve to ${dialogueIds.size} distinct ids.`);

const unitsByScene = new Map();
const seenUnitIds = new Set();
const linkCounts = new Map();
let unitTotal = 0;
const kindCensus = {};
for (const s of scenes) {
  const n = s.rec.canonical_heading;
  const f = path.join(W, "translations/records", `scene-${String(n).padStart(2, "0")}.json`);
  if (!fs.existsSync(f)) die(`English record for scene ${n} is missing.`);
  const raw = readJSON(f);
  const units = Array.isArray(raw) ? raw : raw.units || [];
  // The scene number is carried by the record file's wrapper, not by every unit:
  // only some units repeat it. The wrapper is the authority, and where a unit
  // does repeat it the two must agree.
  if (!Array.isArray(raw)) {
    if (raw.canonical_scene !== n) die(`English record file for scene ${n} declares scene ${raw.canonical_scene}.`);
    if (raw.unit_count !== units.length) die(`English record for scene ${n} declares ${raw.unit_count} units but holds ${units.length}.`);
  }
  const out = units.map((u) => {
    if (seenUnitIds.has(u.id)) die(`duplicate English unit id ${u.id}.`);
    seenUnitIds.add(u.id);
    if (u.status !== "verified") die(`English unit ${u.id} has status ${u.status}.`);
    if (u.canonical_scene !== undefined && u.canonical_scene !== n) {
      die(`English unit ${u.id} repeats scene ${u.canonical_scene} but sits in the scene ${n} record.`);
    }
    if (!new RegExp(`^tirumbippaar-en-s${String(n).padStart(3, "0")}-u\\d+$`).test(u.id)) {
      die(`English unit id ${u.id} does not belong to scene ${n}.`);
    }
    const src = u.source || {};
    const rid = src.source_record_id || null;
    if (rid) {
      if (!dialogueIds.has(rid)) die(`English unit ${u.id} links to unknown dialogue record ${rid}.`);
      linkCounts.set(rid, (linkCounts.get(rid) || 0) + 1);
    }
    const pages = (src.page_provenance || []).map((p) => ({ pdfPage: p.pdf_page, printedPage: p.printed_page }));
    if (!pages.length) die(`English unit ${u.id} carries no page provenance.`);
    for (const p of pages) {
      if (p.printedPage !== p.pdfPage - 8) die(`English unit ${u.id}: printed ${p.printedPage} is not pdf ${p.pdfPage} − 8.`);
    }
    kindCensus[u.kind] = (kindCensus[u.kind] || 0) + 1;
    unitTotal += 1;
    return {
      id: u.id,
      kind: u.kind,
      speakerLabel: src.speaker_label ?? null,
      sourceRecordId: rid,
      sourceOccurrenceId: src.source_occurrence_id ?? null,
      pageProvenance: pages,
      text: nfc(u.translation?.english_text ?? ""),
      notes: u.translation?.notes ?? [],
    };
  });
  unitsByScene.set(n, out);
}
if (unitTotal !== EXPECT_TRANSLATION_UNITS) die(`English records hold ${unitTotal} units.`);
for (const [k, v] of Object.entries(EXPECT_UNIT_KINDS)) {
  if ((kindCensus[k] || 0) !== v) die(`English unit kind ${k} is ${kindCensus[k] || 0}, expected ${v}.`);
}
// Every immutable dialogue record must be linked exactly once — no duplicates,
// no orphans, no records left unlinked.
const dup = [...linkCounts.entries()].filter(([, c]) => c > 1);
if (dup.length) die(`${dup.length} dialogue record(s) are linked more than once.`);
const unlinked = [...dialogueIds].filter((id) => !linkCounts.has(id));
if (unlinked.length) die(`${unlinked.length} dialogue record(s) are never linked from the English layer.`);
if (linkCounts.size !== EXPECT_DIALOGUE_RECORDS) die(`${linkCounts.size} dialogue records are linked, expected ${EXPECT_DIALOGUE_RECORDS}.`);
const crossPage = [...unitsByScene.values()].flat().filter((u) => u.pageProvenance.length > 1);
if (crossPage.length !== EXPECT_CROSS_PAGE_UNITS) die(`${crossPage.length} English units span pages, expected ${EXPECT_CROSS_PAGE_UNITS}.`);

// ── 7. CHARACTERS AND SONGS ───────────────────────────────────────────────────
const entities = Array.isArray(charEntities) ? charEntities : charEntities.entities || [];
const labels = Array.isArray(charLabels) ? charLabels : charLabels.labels || [];
if (entities.length !== EXPECT_ENTITIES) die(`character entities number ${entities.length}.`);
if (labels.length !== EXPECT_LABELS) die(`exact source labels number ${labels.length}.`);
if (JSON.stringify(labels).includes(FORBIDDEN_LABEL)) die(`the label inventory contains "${FORBIDDEN_LABEL}".`);

const songOcc = Array.isArray(songInventory) ? songInventory : songInventory.occurrences || songInventory.songs || songInventory.records || [];
if (songOcc.length !== EXPECT_SONG_OCCURRENCES) die(`song occurrences number ${songOcc.length}.`);
const songStatus = {};
for (const o of songOcc) {
  const s = o.authorship?.status ?? "unknown";
  songStatus[s] = (songStatus[s] || 0) + 1;
}
for (const [k, v] of Object.entries(EXPECT_SONG_STATUS)) {
  if ((songStatus[k] || 0) !== v) die(`song authorship status ${k} is ${songStatus[k] || 0}, expected ${v}.`);
}
// No song occurrence is Kalaignar's here. The booklet's cover credit is story
// and dialogue; turning that into lyric authorship would be a fabrication.
const kalaignarSongs = songOcc.filter((o) => JSON.stringify(o.authorship ?? {}).includes("கருணாநிதி"));
if (kalaignarSongs.length) die(`${kalaignarSongs.length} song occurrence(s) claim Kalaignar authorship; the archive records none.`);
// The booklet prints no complete lyric body for either source-named song, which
// is exactly why the English layer holds zero full `song` units.
if (EXPECT_UNIT_KINDS.song !== 0) die("this work is expected to carry no full song units.");

// ── 8. BYTE-LEVEL INTEGRITY ───────────────────────────────────────────────────
// The structural checks above prove the archive still says what it said. This
// catches the one class they cannot see: a change that alters bytes while
// preserving every structure they inspect. The set is defined by a rule — every
// non-English source file this importer reads — and the English side is excluded
// because it is already byte-covered by the translation aggregate.
const sourceInputRel = [
  "data/works.json",
  "works/tirumbippaar/metadata.yaml",
  "works/tirumbippaar/scenes/index.json",
  "works/tirumbippaar/dialogues/index.json",
  "works/tirumbippaar/songs/index.json",
  "works/tirumbippaar/songs/inventory.json",
  "works/tirumbippaar/songs/credits.json",
  "works/tirumbippaar/songs/tracklist-evidence.json",
  "works/tirumbippaar/characters/index.json",
  "works/tirumbippaar/characters/entities.json",
  "works/tirumbippaar/characters/labels-inventory.json",
  "works/tirumbippaar/editions/en/manifest.json",
  ...sceneIndex.scenes.map((s) => `works/tirumbippaar/scenes/${s.file}`),
  ...fs.readdirSync(path.join(W, "dialogues/records")).sort().map((f) => `works/tirumbippaar/dialogues/records/${f}`),
].sort();
if (sourceInputRel.length !== EXPECT_SOURCE_INPUT_FILES) {
  die(`source input set has ${sourceInputRel.length} files, expected ${EXPECT_SOURCE_INPUT_FILES}.`);
}
const srcAgg = crypto.createHash("sha256");
for (const rel of sourceInputRel) {
  const p = path.join(SRC_REPO, rel);
  if (!fs.existsSync(p)) die(`source input ${rel} does not exist in the clone.`);
  srcAgg.update(rel);
  srcAgg.update(Buffer.from([0]));
  srcAgg.update(fs.readFileSync(p));
  srcAgg.update(Buffer.from([0]));
}
const srcAggHex = srcAgg.digest("hex");
if (srcAggHex !== EXPECT_SOURCE_INPUT_AGGREGATE) {
  die(
    `source input aggregate sha256 is ${srcAggHex}, expected ${EXPECT_SOURCE_INPUT_AGGREGATE}. ` +
      `The clone is at the approved commit but its content does not match the pinned archive. ` +
      `Refusing to generate data that would claim a pin it did not come from.`,
  );
}
const translationInputRel = [
  "works/tirumbippaar/translations/index.json",
  ...fs.readdirSync(path.join(W, "translations/records")).sort().map((f) => `works/tirumbippaar/translations/records/${f}`),
].sort();
if (translationInputRel.length !== EXPECT_TRANSLATION_INPUT_FILES) {
  die(`translation input set has ${translationInputRel.length} files, expected ${EXPECT_TRANSLATION_INPUT_FILES}.`);
}
const trAgg = crypto.createHash("sha256");
for (const rel of translationInputRel) {
  trAgg.update(rel);
  trAgg.update(Buffer.from([0]));
  trAgg.update(fs.readFileSync(path.join(SRC_REPO, rel)));
  trAgg.update(Buffer.from([0]));
}
const trAggHex = trAgg.digest("hex");
if (trAggHex !== EXPECT_TRANSLATION_AGGREGATE) die(`translation input aggregate sha256 is ${trAggHex}, expected ${EXPECT_TRANSLATION_AGGREGATE}.`);
if (manifest.translation_input_aggregate_sha256 !== EXPECT_TRANSLATION_AGGREGATE) {
  die("the archive's own manifest disagrees with the expected translation aggregate.");
}

// ── 9. EMIT ───────────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(SCENE_OUT, { recursive: true });
const write = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");

const sceneSummaries = [];
for (const s of scenes) {
  const n = s.rec.canonical_heading;
  const slug = `scene-${String(n).padStart(2, "0")}`;
  const units = unitsByScene.get(n);
  const scenePayload = {
    workId: "tirumbippaar",
    slug,
    canonicalScene: n,
    sourceHeading: s.rec.source_heading,
    headingTa: s.parsed.headingText,
    canonicalPart: s.rec.canonical_part,
    continuationNotes: s.parsed.continuationNotes,
    pageProvenance: s.parsed.pageProvenance.map((p) => ({
      pdfPage: p.pdfPage,
      printedPage: p.printedPage,
      ...(p.zeroDialogue ? { zeroDialogue: true } : {}),
    })),
    tamil: { blocks: s.parsed.blocks },
    english: { units },
  };
  write(path.join(SCENE_OUT, `${slug}.json`), scenePayload);
  sceneSummaries.push({
    slug,
    canonicalScene: n,
    sourceHeading: s.rec.source_heading,
    headingTa: s.parsed.headingText,
    startPdfPage: s.rec.pdf_page,
    startPrintedPage: s.rec.printed_page,
    tamilBlockCount: s.parsed.blocks.length,
    dialogueBlockCount: s.parsed.blocks.filter((b) => b.kind === "dialogue").length,
    englishUnitCount: units.length,
  });
}

write(path.join(OUT, "index.json"), {
  workId: "tirumbippaar",
  titleTa: yamlScalar("title_ta"),
  sourceTitleTa: yamlScalar("source_title_ta"),
  titleEn: "Tirumbippaar",
  shelf: "cinema-writing",
  readerStructure: "scene",
  sceneNumbering: "source-printed",
  sceneCount: EXPECT_SCENE_COUNT,
  canonicalSceneRange: sceneIndex.scene_heading_range,
  scenes: sceneSummaries,
  songs: songOcc.map((o) => ({
    id: o.id,
    canonicalScene: o.canonical_scene,
    kind: o.candidate_kind ?? null,
    sourceTextTa: o.source_text_ta ?? null,
    printedTextExtent: o.printed_text_extent ?? null,
    authorshipStatus: o.authorship?.status ?? null,
    lyricistTa: o.authorship?.lyricist_ta ?? null,
    evidenceBasis: o.authorship?.evidence_basis ?? null,
  })),
});

write(path.join(OUT, "provenance.json"), {
  workId: "tirumbippaar",
  sourceRepo: "pugazg/kalaignar-cinema-works",
  sourcePath: "works/tirumbippaar",
  sourceCommit: APPROVED_SOURCE_COMMIT,
  sourceCommitNote:
    "The CI publication commit that built the released English reader package. It is the archive's own authoritative Tirumbippaar checkpoint, not merely the last commit to touch the work.",
  source: {
    identifier: EXPECT_IDENTIFIER,
    filename: yamlScalar("filename"),
    scanSha256: EXPECT_SCAN_SHA256,
    pdfPages: EXPECT_PDF_PAGES,
    canonicalPdfPages: EXPECT_CANONICAL_PDF,
    canonicalPrintedPages: EXPECT_CANONICAL_PRINTED,
    printedPageFormula: "printed page = PDF page − 8",
    scanType: yamlScalar("scan_type"),
    editionAsPrinted: yamlScalar("edition_statement_as_printed"),
    publicationYearAsPrinted: Number(yamlScalar("publication_year_as_printed")),
    controllingSourceNote:
      "The controlling source is the scanned booklet, which is not committed to either repository. Every reading here derives from the archive's scan-adjudicated derivatives at the pinned commit.",
  },
  creditsAsPrinted: {
    coverRoleTa: "கதை - வசனம்",
    coverNameTa: "கலைஞர் மு. கருணாநிதி",
    note: "The cover credits story and dialogue to Kalaignar. It is not a lyric-authorship credit, and no song occurrence in this work is attributed to him.",
  },
  historicalNotices: {
    rightsNoticeAsPrinted: yamlScalar("rights_notice_as_printed"),
    priceAsPrinted: yamlScalar("price_as_printed"),
    note: "These are 1953 source statements recorded as printed evidence. They are not a present-day rights determination, and no catalogue-level rights block is asserted from them.",
  },
  frontMatterCrop: {
    pdfPage: 2,
    visiblePartialReading: "சிட்டி பிரஸ், மதுரை ரோ…",
    status: "unresolved-source-crop",
    note: "The printer/imprint line is physically cropped in the supplied scan. It sits in front matter, seven pages before canonical text begins, is documented as non-blocking, and is never reconstructed.",
  },
  structure: {
    sceneHeadingsObserved: EXPECT_SCENE_COUNT,
    canonicalRange: sceneIndex.scene_heading_range,
    headingsNotObserved: [],
    numberingNote:
      "All 93 headings are observed consecutively with no gaps, repeats or editorial renumbering. This work has none of Parasakthi's absent-heading or transposed-number structure.",
    headingAnomalies: [
      { canonicalScene: 5, printed: "காட்சி 5[", note: "Irregular opening bracket as printed." },
      { canonicalScene: 36, printed: "காட்சி 36", note: "No closing glyph is printed." },
      { canonicalScene: 43, printed: "காட்சி 43].", note: "Closing bracket followed by a full stop as printed." },
    ],
    anomalyNote: "These are source-visible typography, preserved rather than regularised for cleaner display data.",
  },
  tamil: {
    authority: "works/tirumbippaar/scenes/scene-NN.md",
    sceneDerivatives: EXPECT_SCENE_COUNT,
    dialogueRecords: EXPECT_DIALOGUE_RECORDS,
    tamilDialogueBlocks: EXPECT_TAMIL_DIALOGUE_BLOCKS,
    separatorBlocks: EXPECT_SEPARATOR_BLOCKS,
    granularityNote:
      "The reading layer's 923 speaker-labelled paragraph blocks and the archive's 1042 immutable dialogue records are different granularities, not a discrepancy: ten scenes print a single long speech across several paragraphs that the archive indexes as multiple records. Neither layer is derived from the other.",
    canonicalPages: EXPECT_CANONICAL_PAGES,
    zeroDialogueScenes: EXPECT_ZERO_DIALOGUE_SCENES,
    zeroDialogueNote:
      "These six scenes carry no speaker-labelled dialogue but are not empty: they hold stage directions, chant, newspaper and performance material. The reading layer is the full scene text, not the dialogue records.",
    verificationNote:
      "`verified` and `verified-reconciled` are the archive's own recorded states for its scan-adjudicated fidelity audit of the 104 canonical pages. They are archive states, not a claim of independent human re-verification here.",
    settledReadings: {
      "ஊஹும்": "Confirmed by the owner directly against the controlling scan; the superseded ஊஹூம் must never re-enter the reading text.",
      "பாண்டியன் : தொழிலாளர்கள்": "Scene 45 prints no full stop after the speaker name; no பாண்டியன். label variant exists.",
    },
  },
  english: {
    authority: "works/tirumbippaar/translations/records",
    kind: "project-created",
    kindBasis:
      "An archive-produced translation derived from the archive's own scan-adjudicated Tamil derivatives. It is not a historical published translation.",
    translationUnits: EXPECT_TRANSLATION_UNITS,
    unitKindCounts: EXPECT_UNIT_KINDS,
    crossPageUnits: EXPECT_CROSS_PAGE_UNITS,
    scenesVerified: EXPECT_SCENE_COUNT,
    noFullSongUnitsNote:
      "Zero full `song` units exist because the booklet prints no complete lyric body for either source-named song. The seven `song-reference` units record performance references only.",
    readerEditionQa: "PASS",
    qaNote: "`complete-verified` and `QA PASS` are the archive's recorded states from its own automated publication workflow.",
  },
  characters: {
    authority: "works/tirumbippaar/characters",
    entities: EXPECT_ENTITIES,
    exactSourceLabels: EXPECT_LABELS,
    note: "Exact printed speaker labels are preserved. Stable upstream entity ids are retained unchanged, including tirumbippaar-char-punnakodi.",
  },
  songs: {
    authority: "works/tirumbippaar/songs",
    occurrences: EXPECT_SONG_OCCURRENCES,
    authorshipStatusCounts: EXPECT_SONG_STATUS,
    kalaignarAttributedOccurrences: 0,
    note:
      "Three occurrences carry item-level external-source attribution; five remain unresolved and stay unresolved. No complete lyric body is printed for any occurrence, so none is reproduced.",
  },
  publication: {
    epubPath: "works/tirumbippaar/editions/en/tirumbippaar-en.epub",
    epubSha256: EXPECT_EPUB_SHA256,
    readerSha256: pkgManifest.reader_sha256,
    packageStatus: pkgManifest.status,
    note: "The published EPUB and reader edition are archive artifacts. They are referenced for provenance and are not vendored into the website.",
  },
  integrity: {
    sourceScanSha256: EXPECT_SCAN_SHA256,
    sourceInputAggregateSha256: EXPECT_SOURCE_INPUT_AGGREGATE,
    sourceInputFiles: EXPECT_SOURCE_INPUT_FILES,
    translationInputAggregateSha256: EXPECT_TRANSLATION_AGGREGATE,
    translationInputFiles: EXPECT_TRANSLATION_INPUT_FILES,
    aggregateNote:
      "Each aggregate is sha256 over `relative path + NUL + raw bytes + NUL` for the sorted input set. It proves the bytes behind this import, not merely the commit identity.",
  },
  notes: [
    "Phase D2.1 generated data only. No public route, catalogue entry or sitemap URL exists for this work yet.",
    "No current-day rights determination is asserted. The 1953 notice is preserved as printed source evidence.",
  ],
});

console.log(
  `tirumbippaar — ${EXPECT_SCENE_COUNT} scenes, ${dialogueBlockTotal} Tamil dialogue blocks, ${unitTotal} English units, ` +
    `${EXPECT_CANONICAL_PAGES} canonical pages, pinned at ${APPROVED_SOURCE_COMMIT}`,
);
