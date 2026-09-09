// Deterministic Drama-family importer — Wave 6 P1–P3 Batch 2.
//
//   node scripts/import-drama-wave6.mjs <kalaignar-stage-plays-clone> <source-commit>
//
// ONE importer for the whole Drama family. It reads ONLY the pinned source tree (fails closed if the
// clone HEAD is not the supplied commit) and consumes the frozen canonical Markdown source layer —
// each work's front-matter'd `scenes/*.md` (Tamil) and `translations/en/*.md` (English) plus its
// `metadata/source.md` and `pages/*.md` records. There is NO Reading Room integration payload; the
// canonical assembled Markdown IS the source representation. Generated data is never hand-edited.
//
// Fidelity contract (proved independently by scripts/validate-drama-wave6.mjs):
//   * strings are copied BYTE-FOR-BYTE — NO NFC/NFD, no trim of internal text, no whitespace collapse,
//     no punctuation/quote/dash change, no Tamil/English alteration. The only structural handling is
//     Markdown paragraph splitting (trailing whitespace at a paragraph END is dropped — it is layout,
//     not literary text) and stripping the archive's OWN apparatus (assembly/translation-note
//     sections) and HTML comments, which are never reading content.
//   * documented physical source-condition holds (`[paper loss]`, `[unresolved glyph cluster]`,
//     `[unresolved descriptive cluster]`) are carried VERBATIM in the reading text; nothing is
//     reconstructed.
//   * no scene number, act, `காட்சி` heading, `முற்றும்` or curtain is invented anywhere.
//
// Per-work archival safeguards enforced below (import ABORTS otherwise):
//   * காகிதப்பூ: the source-visible `காட்சிகள்: 2,3,4,5.` block is ONE compressed range (no separate
//     Scene 2/3/4/5 invented); the bare `காட்சி,` between Scene 21 and Scene 24 is unnumbered (no
//     Scene 22/23 assigned); 23 reading units total.
//   * மணிமகுடம்: 47 source-numbered scenes; the user-supplied 1962 Madurai claim is catalogue context
//     only and is NEVER promoted — the scan's own May-1956 and Sept-1963 stagings are the witnesses.
//   * திருவாளர் தேசீயம்பிள்ளை: the source prints NO scene numbers — 7 editorial SRUs (navigation, never
//     source scene numbers); the scan-47 `உதயசூரியன் கோலம்` is a centred intertitle inside SRU-07, not
//     a scene; NO printed `முற்றும்` exists and none is added; SRU-01 and SRU-04 carry documented
//     source-condition holds verbatim.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-drama-wave6.mjs <stage-plays-clone> <source-commit>");
  process.exit(1);
}
const die = (m) => { console.error(`import-drama-wave6: ${m}`); process.exit(1); };

// ── FAIL-CLOSED SOURCE PIN ─────────────────────────────────────────────────────────────────────
let head;
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch (e) { die(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`); }
if (head !== SRC_COMMIT) die(`source-commit mismatch: supplied ${SRC_COMMIT} but clone HEAD is ${head}`);

// IDENTITY copy — the byte-for-byte guarantee lives here. No normalization of any kind.
const raw = (s) => s;
const readText = (p) => raw(fs.readFileSync(p, "utf8"));
const APPARATUS_TA = /^(Assembly\b)/;                 // "Assembly note", "Assembly provenance"
const APPARATUS_EN = new Set(["Translation notes"]);  // the only apparatus heading in scene EN files

// ── PER-WORK CONFIG ──────────────────────────────────────────────────────────────────────────────
// `titleFrom`: "first-heading" consumes the first Markdown heading of each layer as the unit title;
// "editorial-label" takes the title from front-matter `editorial_label` and keeps EVERY heading
// (work-title lines, intertitles) as in-body heading units.
const WORKS = [
  {
    slug: "kagithapoo",
    title: { ta: "காகிதப்பூ", en: "Kagithappoo" },
    descriptor: { ta: "ஓரங்க நாடகம்", en: "A One-Act Play" },
    author: { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
    authorAttribution: "user-supplied-at-intake",
    edition: {
      collectionTitleTa: "முரசொலி-பொங்கல் மலர்",
      editionStatementTa: "முரசொலி பொங்கல் மலர்—67 (1967)",
    },
    scan: {
      archiveId: "TVA_PRL_0001638",
      sha256: "b0a6499ba072a7346f8c2544a8a61c2363d83a60cad5227482008043cd310ec1",
      sizeBytes: 45718751, pages: 131,
      workRange: "91–131 (41 physical scans; scan 91 is the title/graphic opener)",
    },
    structureKind: "scene-sequence",
    titleFrom: "first-heading",
    fidelityKey: "page_record_fidelity",
    expect: { readingUnits: 23, numberedScenes: 21, compressedRanges: 1, unnumberedScenes: 0, unnumberedBareCaatchi: 1 },
    printedClosure: "The dramatic body closes with a printed `(முற்றும்)` on scan 131, carried as printed.",
    order: (file) => {
      const s = file.replace(/\.md$/, "");
      if (s === "02-05") return 2;                       // compressed range sits where Scene 2 would
      if (s === "unnumbered-between-21-and-24") return 21.5;
      return Number(s);
    },
  },
  {
    slug: "manimagudam",
    title: { ta: "மணிமகுடம்", en: "Manimagudam" },
    descriptor: { ta: "நாடகம்", en: "A Play" },
    author: { ta: "டாக்டர் கலைஞர். மு. கருணாநிதி", en: "Dr. Kalaignar M. Karunanidhi" },
    edition: {
      publisherTa: "பாரதி பதிப்பகம்",
      placeTa: "டி. நகர், சென்னை-600017",
      priceTa: "விலை ரூ. 40.00",
      editionStatementTa: "ஆறாம் பதிப்பு — மே 2010 (பாரதி பதிப்பகம்)",
    },
    scan: {
      archiveId: "TVA_BOK_0064143",
      sha256: "a629509c3404fcc5c2844f5b693e72a41aca03ad2e2494588807af4ff8f16f3b",
      sizeBytes: 187091728, pages: 170,
      workRange: "dramatic body scans 14–170 (front matter 1–13)",
    },
    structureKind: "scene-sequence",
    titleFrom: "first-heading",
    fidelityKey: "page_record_fidelity",
    expect: { readingUnits: 47, numberedScenes: 47, compressedRanges: 0, unnumberedScenes: 0 },
    performanceWitnesses: [
      { date: "May 1956", place: "Tiruchirappalli", detail: "DMK second state conference; staged by the S. S. Rajendran troupe (scan 4)." },
      { date: "September 1963", place: "—", detail: "staging associated with the Murasoli drama troupe under Anna's leadership (scan 5)." },
    ],
    userSuppliedContext: [
      { claim: "Performed at a 1962 Madurai DMK conference.", status: "User-supplied catalogue context. The inspected scan does NOT itself establish this claim; it is retained as context and is never promoted to a source fact. No silent reconciliation is made with the scan's own May-1956 / Sept-1963 stagings." },
    ],
    order: (file) => Number(file.replace(/\.md$/, "")),
  },
  {
    slug: "thiruvalar-desiyampillai",
    title: { ta: "திருவாளர் தேசீயம்பிள்ளை", en: "Thiruvalar Desiyampillai" },
    descriptor: { ta: "நாடகம்", en: "A Play" },
    author: { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
    edition: {
      publisherTa: "K. R. நாராயணன்",
      placeTa: "131, பிராட்வே, சென்னை-1",
      copyrightLineTa: "முத்தமிழ்ச் செல்வி அச்சகம், 1/65, பிராட்வே",
      editionStatementTa: "இரண்டாம் பதிப்பு — நவம்பர் 1965",
    },
    scan: {
      archiveId: "TVA_BOK_0064118",
      sha256: "b336bbebb326803badecbaa93de4ca4d63d80f68137fe70673b07a884c4910eb",
      sizeBytes: 58035177, pages: 49,
      workRange: "dramatic body scans 7–48 (front matter 1–6; scan 49 back-cover advert)",
    },
    structureKind: "editorial-sru-sequence",
    titleFrom: "editorial-label",
    fidelityKey: "page_record_fidelity",
    expect: { readingUnits: 7, numberedScenes: 0, sourceRepresentationUnits: 7 },
    intertitleTa: "உதயசூரியன் கோலம்",
    printedClosure: "The source closes on scan 48 with NO printed `முற்றும்` marker; none is added.",
    // The controlling PAGE_LAYER_COMPLETION_AUDIT.md work-level qualification, carried verbatim. The 9
    // needs-review page records (4 front-matter + 5 body) must never be collapsed to the 5 body holds.
    pageLayerQualification: {
      physicalScans: 49,
      processedPageRecords: 49,
      verifiedPageRecords: 40,
      needsReviewPageRecords: 9,
      needsReviewScans: [1, 3, 4, 5, 7, 8, 9, 35, 36],
      frontMatterHoldScans: [1, 3, 4, 5],
      dramaticBodyHoldScans: [7, 8, 9, 35, 36],
      unresolvedVisualClusters: 3,
    },
    sourceConditionHolds: [
      { scan: 7, unit: "sru-01-yama-court", marker: "[paper loss]", policy: "front/opening paper-loss covered characters are carried as `[paper loss]` verbatim and never reconstructed." },
      { scan: 8, unit: "sru-01-yama-court", marker: "[paper loss]", policy: "paper-loss carried verbatim; scan-9's first `எங்கே ஜனநாயக…` is NOT completed from the later intact line." },
      { scan: 9, unit: "sru-01-yama-court", marker: "[paper loss]", policy: "paper-loss carried verbatim; no missing wording reconstructed." },
      { scan: 35, unit: "sru-04-gandhi-journey", marker: "[unresolved glyph cluster]", policy: "carried verbatim in `கொம்பு மாடெனக் … மட்டும்`; no lexical completion inferred." },
      { scan: 36, unit: "sru-04-gandhi-journey", marker: "[unresolved descriptive cluster]", policy: "both markers in the `ஹரிஜன நலம்` / `சவலைப் பிள்ளை` description carried verbatim; no completion inferred." },
    ],
    order: (file) => Number(/^sru-(\d+)/.exec(file)[1]),
  },
];

// ── FRONT MATTER ───────────────────────────────────────────────────────────────────────────────
function frontMatter(text, file) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) die(`${file}: missing front matter`);
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    // Front-matter METADATA values are unquoted (a YAML-string convenience); this touches control
    // metadata only — never the literary reading text, which is parsed from the body verbatim.
    if (kv) out[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { fm: out, body: text.slice(m[0].length) };
}
const unquote = (v) => (v == null ? v : v.replace(/^"(.*)"$/, "$1"));

// ── LAYER PARSER (per-unit-group; no inline scan markers in this family) ─────────────────────────
function parseLayer(text, file, { english, titleFrom }) {
  const { fm, body } = frontMatter(text, file);
  const paras = body.split("\n\n").map((x) => x.replace(/\s+$/, "")).filter((x) => x.trim());
  const units = [];
  const notes = [];
  let title = null;
  let noteHeading = null, noteBuf = [];
  const flushNote = () => {
    if (noteHeading && noteBuf.length) notes.push({ kind: noteHeading === "Translation notes" ? "translation-note" : "interpretive-note", text: noteBuf.join("\n\n").trim() });
    noteBuf = [];
  };
  const SPEAKER = /^([^[\]\n]{1,40}?)(\s*:\s)(?!\s)/;
  const ORNAMENT = /^[*\s]+$/;
  const isApparatus = (t) => (english ? APPARATUS_EN.has(t) : APPARATUS_TA.test(t));
  const startsUnit = (x) => x.startsWith("[") || x.startsWith("(") || x.startsWith("“") || x.startsWith('"') || /^#{1,6}\s/.test(x) || SPEAKER.test(x);
  const opens = (x) => (x.match(/\[/g) || []).length > (x.match(/]/g) || []).length;
  const closes = (x) => (x.match(/]/g) || []).length > (x.match(/\[/g) || []).length;
  const runEnd = (i) => {
    for (let j = i + 1; j < paras.length; j++) {
      const p = paras[j].trim();
      if (!p || /^<!--[\s\S]*-->$/.test(p)) continue;
      if (/^#{1,6}\s/.test(p)) return -1;
      if (startsUnit(p)) return -1;
      if (closes(p)) return j;
    }
    return -1;
  };

  let i = 0;
  let stopped = false;
  while (i < paras.length && !stopped) {
    const chunk = paras[i];
    const t = chunk.trim();
    // A heading is a standalone single-line `#..###### text` paragraph. Using `.+` (not `[\s\S]`)
    // means a multi-line block starting with `#` is NOT mistaken for a heading.
    const h = /^(#{1,6})\s+(.+)$/.exec(t);

    if (h) {
      const level = h[1].length;
      const htext = h[2].replace(/\s+$/, "");
      if (isApparatus(htext.trim())) {
        flushNote();
        if (!english) { stopped = true; break; }   // TA apparatus ends the reading body
        noteHeading = htext.trim(); noteBuf = []; i++; continue;
      }
      if (noteHeading) { noteBuf.push(chunk); i++; continue; }  // defensive: content after a note heading
      if (titleFrom === "first-heading" && title === null) { title = htext; i++; continue; }
      units.push({ kind: "heading", level, text: htext });
      i++; continue;
    }
    if (noteHeading) { noteBuf.push(chunk); i++; continue; }
    if (/^<!--[\s\S]*-->$/.test(t)) { i++; continue; }
    if (ORNAMENT.test(t)) { units.push({ kind: "ornament", text: chunk }); i++; continue; }

    if (t.startsWith("[")) {
      const end = opens(t) ? runEnd(i) : -1;
      if (end > i) {
        const parts = [chunk];
        for (let j = i + 1; j <= end; j++) { const p = paras[j]; if (/^<!--[\s\S]*-->$/.test(p.trim())) continue; parts.push(p); }
        units.push({ kind: "stage-direction", delimiter: "square", text: parts.join("\n\n") });
        i = end + 1; continue;
      }
      units.push({ kind: "stage-direction", delimiter: "square", text: chunk, ...(opens(t) ? { unclosedInSource: true } : {}) });
      i++; continue;
    }
    if (t.startsWith("(")) { units.push({ kind: "stage-direction", delimiter: "round", text: chunk }); i++; continue; }
    if (t.startsWith("“") || t.startsWith('"')) { units.push({ kind: "verse", text: chunk }); i++; continue; }
    if (closes(t)) { units.push({ kind: "stage-direction", delimiter: "square", text: chunk, continuesUnclosed: true }); i++; continue; }

    const sp = SPEAKER.exec(t);
    if (sp) {
      units.push({ kind: "dialogue", speakerAsPrinted: sp[1], speakerSeparator: sp[2], text: chunk.slice(chunk.indexOf(sp[0]) + sp[0].length) });
      i++; continue;
    }
    units.push({ kind: "dialogue", speakerAsPrinted: null, speakerSeparator: null, text: chunk });
    i++;
  }
  flushNote();
  return { fm, title, units, notes };
}

const finalizeUnit = (u) => {
  const base = { text: u.text, hasLineBreaks: u.text.includes("\n") };
  if (u.kind === "dialogue") return { kind: "dialogue", speakerAsPrinted: u.speakerAsPrinted, speakerSeparator: u.speakerSeparator ?? null, ...base };
  if (u.kind === "stage-direction") { const sd = { kind: "stage-direction", delimiter: u.delimiter, ...base }; if (u.unclosedInSource) sd.unclosedInSource = true; if (u.continuesUnclosed) sd.continuesUnclosed = true; return sd; }
  if (u.kind === "heading") return { kind: "heading", level: u.level, ...base };
  return { kind: u.kind, ...base };
};

// ── BUILD ONE WORK ───────────────────────────────────────────────────────────────────────────────
function buildWork(cfg) {
  const WORK_DIR = path.join(SRC_REPO, "works", cfg.slug);
  const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
  if (!meta.includes(cfg.scan.sha256)) die(`${cfg.slug}: metadata no longer records the pinned scan SHA-256`);
  if (!meta.includes(cfg.scan.archiveId)) die(`${cfg.slug}: metadata no longer records the pinned archive id ${cfg.scan.archiveId}`);
  // The scan filename WITNESS is carried verbatim from the metadata (its Tamil bytes are the source's,
  // never retyped) so the recorded filename can never drift from what the archive actually prints.
  const fnMatch = /Filename:\s*`([^`]+)`/.exec(meta) || new RegExp("(" + cfg.scan.archiveId + "[^`\\n]*\\.pdf)").exec(meta);
  const scanFilename = fnMatch ? fnMatch[1] : die(`${cfg.slug}: could not read the scan filename witness from metadata`);
  if (!scanFilename.includes(cfg.scan.archiveId)) die(`${cfg.slug}: extracted filename lacks the pinned archive id`);

  const TA_DIR = path.join(WORK_DIR, "scenes");
  const EN_DIR = path.join(WORK_DIR, "translations/en");
  const isScene = (f) => /\.md$/.test(f) && !/^(README|TRANSLATION_REVIEW|BATCH_|SCENE|SCANS_|PAGE_|MD_|STRUCTURAL_|ASSEMBLY_|HISTORICAL_|SOURCE_|LEXICAL_|TRANSLATION_PLAN)/.test(f);
  const files = fs.readdirSync(TA_DIR).filter(isScene).sort((a, b) => cfg.order(a) - cfg.order(b));

  const readingUnits = files.map((file) => {
    const stem = file.replace(/\.md$/, "");
    const ta = parseLayer(readText(path.join(TA_DIR, file)), `${cfg.slug}/scenes/${file}`, { english: false, titleFrom: cfg.titleFrom });
    const enPath = path.join(EN_DIR, file);
    if (!fs.existsSync(enPath)) die(`${cfg.slug}: missing English counterpart for ${file}`);
    const en = parseLayer(readText(enPath), `${cfg.slug}/translations/en/${file}`, { english: true, titleFrom: cfg.titleFrom });

    if (ta.fm.status !== "assembly-reviewed") die(`${file}: Tamil status ${ta.fm.status}`);
    if (unquote(ta.fm[cfg.fidelityKey]) && !unquote(ta.fm[cfg.fidelityKey]).startsWith("passed")) die(`${file}: Tamil ${cfg.fidelityKey} ${ta.fm[cfg.fidelityKey]}`);
    if (en.fm.status !== "translation-reviewed") die(`${file}: English status ${en.fm.status}`);
    if (unquote(en.fm.translation_review) !== "passed") die(`${file}: English review ${en.fm.translation_review}`);
    if (unquote(en.fm.secondary_english_witness_used) !== "false") die(`${file}: English used the published witness — refusing to import`);

    // Structural identity per work — derived from the source front matter, never invented.
    let kind = "scene", order = null, extra = {};
    if (cfg.structureKind === "editorial-sru-sequence") {
      kind = "source-representation-unit"; order = null;
      if (unquote(ta.fm.source_scene_number) !== "null") die(`${file}: an SRU carries a source scene number`);
      extra.editorialUnitId = unquote(ta.fm.structural_unit);
    } else if (ta.fm.scene_range !== undefined) {
      kind = "compressed-scene-range"; order = null; extra.sceneRange = JSON.parse(ta.fm.scene_range);
    } else if (unquote(ta.fm.scene) === "null") {
      kind = "unnumbered-scene"; order = null;
      if (ta.fm.source_heading) extra.sourceHeadingTa = unquote(ta.fm.source_heading);
    } else {
      order = Number(ta.fm.scene);
      if (!Number.isInteger(order)) die(`${file}: numbered scene has no integer scene number`);
    }
    if (cfg.slug === "kagithapoo" && (order === 22 || order === 23)) die(`${file}: a Scene ${order} appeared — காகிதப்பூ prints none`);

    const titleTa = cfg.titleFrom === "editorial-label" ? unquote(ta.fm.editorial_label) : ta.title;
    const titleEn = cfg.titleFrom === "editorial-label" ? unquote(en.fm.editorial_label) : en.title;
    if (!titleTa || !titleEn) die(`${file}: could not establish a title`);
    const asv = unquote(ta.fm.assembled_from_verified_pages);

    return {
      order, slug: stem, kind,
      headingTa: cfg.titleFrom === "editorial-label" ? null : ta.title,
      headingEn: cfg.titleFrom === "editorial-label" ? null : en.title,
      titleTa, titleEn,
      settingTa: null, settingEn: null,
      sourceScans: JSON.parse(ta.fm.source_scan_pages),
      ...extra,
      assembledFromVerifiedPages: asv === "true" ? true : asv === "false" ? false : undefined,
      tamil: { units: ta.units.map(finalizeUnit) },
      english: { units: en.units.map(finalizeUnit), notes: en.notes },
    };
  });

  // ── STRUCTURAL SAFEGUARD ASSERTIONS ─────────────────────────────────────────────────────────
  const A = (label, actual, expected) => { if (actual !== expected) die(`${cfg.slug} ${label}: ${actual} != ${expected}`); };
  A("reading units", readingUnits.length, cfg.expect.readingUnits);
  const numbered = readingUnits.filter((u) => u.kind === "scene");
  A("numbered scenes", numbered.length, cfg.expect.numberedScenes ?? 0);
  if (cfg.expect.compressedRanges !== undefined) A("compressed ranges", readingUnits.filter((u) => u.kind === "compressed-scene-range").length, cfg.expect.compressedRanges);
  if (cfg.expect.unnumberedBareCaatchi !== undefined) A("unnumbered bare காட்சி", readingUnits.filter((u) => u.kind === "unnumbered-scene").length, cfg.expect.unnumberedBareCaatchi);
  if (cfg.expect.sourceRepresentationUnits !== undefined) A("SRUs", readingUnits.filter((u) => u.kind === "source-representation-unit").length, cfg.expect.sourceRepresentationUnits);
  // Numbered scenes must be a strictly ascending run of the source's own numbers — never renumbered.
  const nums = numbered.map((u) => u.order);
  if (nums.some((n, k) => k > 0 && n <= nums[k - 1])) die(`${cfg.slug}: numbered scenes are not strictly ascending as printed`);
  if (cfg.slug === "manimagudam" && nums.join(",") !== Array.from({ length: 47 }, (_, k) => k + 1).join(",")) die("manimagudam numbered scenes are not exactly 1..47");
  if (cfg.slug === "kagithapoo") {
    if (readingUnits.some((u) => u.order === 22 || u.order === 23)) die("kagithapoo assigned a Scene 22/23");
    const unnum = readingUnits.find((u) => u.kind === "unnumbered-scene");
    if (!unnum || unnum.sourceHeadingTa !== "காட்சி,") die("kagithapoo unnumbered `காட்சி,` unit missing or altered");
  }
  if (cfg.slug === "thiruvalar-desiyampillai") {
    const holds = readingUnits.filter((u) => u.assembledFromVerifiedPages === false).map((u) => u.slug);
    if (!holds.includes("sru-01-yama-court") || !holds.includes("sru-04-gandhi-journey")) die("thiruvalar SRU-01/SRU-04 must be flagged assembled_from_verified_pages:false");
    const allTa = readingUnits.flatMap((u) => u.tamil.units).map((u) => u.text).join("\n");
    if (!allTa.includes("[paper loss]")) die("thiruvalar `[paper loss]` markers must survive into the reading text");
    if (!allTa.includes("[unresolved glyph cluster]") || !allTa.includes("[unresolved descriptive cluster]")) die("thiruvalar unresolved-cluster markers must survive into the reading text");
    // A PRINTED closure marker is a standalone `முற்றும்` / `(முற்றும்)` unit — NOT the idiom
    // `சுற்றும் முற்றும் பார்த்தார்` where முற்றும் occurs mid-sentence. Guard on standalone form only.
    const isClosureMarker = (txt) => /^\(?\s*முற்றும்\s*\)?[.।]?$/.test(txt.trim());
    if (readingUnits.flatMap((u) => u.tamil.units).some((u) => isClosureMarker(u.text))) die("thiruvalar must not carry an invented printed `முற்றும்` closure");
    const sru7 = readingUnits.find((u) => u.slug === "sru-07-udayasuriyan-kolam-close");
    if (!sru7 || !sru7.tamil.units.some((u) => u.kind === "heading" && u.text.trim() === cfg.intertitleTa)) die("thiruvalar scan-47 `உதயசூரியன் கோலம்` intertitle must be preserved inside SRU-07");
  }

  const count = (sel) => readingUnits.reduce((n, u) => n + sel(u), 0);
  const speakers = new Set(readingUnits.flatMap((s) => s.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted).map((u) => u.speakerAsPrinted)));
  const scanNums = readingUnits.flatMap((s) => s.sourceScans);

  const play = {
    workId: cfg.slug, slug: cfg.slug,
    title: cfg.title, descriptor: cfg.descriptor, author: cfg.author,
    // Authorship-evidence qualification, only where the selected source range prints no author line.
    ...(cfg.authorAttribution === "user-supplied-at-intake"
      ? { authorAttribution: { attribution: cfg.author.en, basis: "user-supplied-catalogue", printedInSelectedSourceRange: false } }
      : {}),
    edition: { ...cfg.edition, year: null },
    sourceRepo: "pugazg/kalaignar-stage-plays", sourcePath: `works/${cfg.slug}`, sourceCommit: SRC_COMMIT,
    structureKind: cfg.structureKind,
    sceneCount: numbered.length,
    closingTableauCount: 0,
    scanProvenance: "per-unit-group",
    bodyScans: { from: Math.min(...scanNums), to: Math.max(...scanNums) },
    readingUnits,
  };

  const d = {
    scenes: numbered.length,
    closingTableau: 0,
    tamilUnits: count((s) => s.tamil.units.filter((u) => u.kind !== "heading").length),
    englishUnits: count((s) => s.english.units.filter((u) => u.kind !== "heading").length),
    tamilDialogue: count((s) => s.tamil.units.filter((u) => u.kind === "dialogue").length),
    tamilStageDirections: count((s) => s.tamil.units.filter((u) => u.kind === "stage-direction").length),
    tamilVerse: count((s) => s.tamil.units.filter((u) => u.kind === "verse").length),
    ornaments: count((s) => [...s.tamil.units, ...s.english.units].filter((u) => u.kind === "ornament").length),
    inBodyHeadings: count((s) => s.tamil.units.filter((u) => u.kind === "heading").length),
    distinctSpeakerLabels: speakers.size,
    unlabelledDialogueUnits: count((s) => s.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted === null).length),
    scenesWithoutPrintedSetting: readingUnits.filter((s) => s.settingTa === null).length,
    multiScanScenes: readingUnits.filter((s) => s.sourceScans.length > 1).length,
    translationNotes: count((s) => s.english.notes.filter((n) => n.kind === "translation-note").length),
    interpretiveNotes: count((s) => s.english.notes.filter((n) => n.kind === "interpretive-note").length),
    note: "Derived structure only. The verified page records remain the controlling archival text; this integration reads the archive's own assembled scene layer built from those records. Dialogue, stage directions, speaker labels, settings and intertitles are carried verbatim — never re-split, merged, expanded or normalised.",
    speakerNote: "Speaker labels are rendered EXACTLY as printed, including inconsistent abbreviations. They are source data and are never expanded or unified.",
    unlabelledNote: "Dialogue units with `speakerAsPrinted: null` are places where the edition prints no label. Absence of a label is recorded as absence, never resolved into an attribution.",
  };
  if (cfg.expect.sourceRepresentationUnits) d.sourceRepresentationUnits = readingUnits.filter((u) => u.kind === "source-representation-unit").length;
  if (cfg.expect.compressedRanges) d.compressedSceneRanges = readingUnits.filter((u) => u.kind === "compressed-scene-range").length;
  if (cfg.expect.unnumberedBareCaatchi) d.unnumberedScenes = readingUnits.filter((u) => u.kind === "unnumbered-scene").length;
  if (cfg.sourceConditionHolds) d.bodySourceConditionHolds = cfg.sourceConditionHolds.length;

  const provenance = {
    sourceRepo: play.sourceRepo, sourcePath: play.sourcePath, sourceCommit: SRC_COMMIT,
    source: {
      scanFilename, scanSha256: cfg.scan.sha256, scanFileSizeBytes: cfg.scan.sizeBytes,
      scanTotalPages: cfg.scan.pages, sourcePdfCommitted: false,
      scanIdentityBasis: "Scan identity (filename, SHA-256, byte size, page count) is carried AS RECORDED BY THE SOURCE ARCHIVE metadata. The controlling PDF is held outside the repositories and was not supplied to this integration, so the checksum was NOT independently recomputed here.",
      pageRecordsVerified: `page records for ${cfg.scan.workRange} governed by the work's page-layer audit`,
      sourceAudit: "Tamil transcription / assembly review: PASSED (per-work assembly-reviewed layer).",
      assembledLayer: `${play.readingUnits.length} reading unit(s) assembly-reviewed; English translation-reviewed / PASS`,
      bodyScans: `${play.bodyScans.from}–${play.bodyScans.to}`,
      publicationYearNote: "No numeric publication year is promoted to the catalogue. Any printed edition statement is carried verbatim in `edition.editionStatementTa` as a source witness only.",
      ...(cfg.structureKind === "editorial-sru-sequence" ? { sruStructureNote: "The source prints NO scene numbers, acts or `காட்சி` headings across its dramatic body. The work is published as seven editorial SOURCE-REPRESENTATION UNITS (SRUs) defined by the source's own prose/stage transitions. `SRU-01`..`SRU-07` are repository navigation identifiers, never source scene numbers, and the reader never presents them as `காட்சி N`." } : {}),
      ...(cfg.expect.compressedRanges ? { compressedSceneNote: "The controlling source prints `காட்சிகள்: 2, 3, 4, 5.` as ONE compressed block with a single performance note and no separate Scene-2/3/4/5 text. It is carried as one compressed reading unit; no separate scene is reconstructed or invented." } : {}),
      ...(cfg.expect.unnumberedBareCaatchi ? { unnumberedSceneNote: "Between Scene 21 and Scene 24 the source prints a bare `காட்சி,` (no numeral) on scan 124, while scan 125 later prints `காட்சி 24.`. That unit is carried as an unnumbered scene; NO Scene 22 or 23 number is ever assigned." } : {}),
      ...(cfg.intertitleTa ? { intertitleNote: "The scan-47 centred `உதயசூரியன் கோலம்` is a source-visible descriptive intertitle inside the final SRU. It is preserved as a visibly separate line and is NEVER promoted to a source scene title or used to invent a numbered scene." } : {}),
      ...(cfg.printedClosure ? { printedClosureNote: cfg.printedClosure } : {}),
      ...(cfg.sourceConditionHolds ? { sourceConditionNote: "This work is accepted READY WITH QUALIFICATION: localized terminal physical source-condition holds are carried verbatim in the reading text as `[paper loss]` / `[unresolved glyph cluster]` / `[unresolved descriptive cluster]`. Nothing is reconstructed; the holds are visibly represented; provenance is complete." } : {}),
    },
    english: {
      kind: "project-created",
      status: `${play.readingUnits.length}/${play.readingUnits.length} reading units translation-reviewed / PASS`,
      independence: "The reader's English is the project-created independent translation, drafted and reviewed WITHOUT any published English edition.",
      secondaryWitnessNote: "No secondary/published English witness was used to draft or review this translation; each source layer declares `secondary_english_witness_used: false`.",
      notesSeparated: "The English layer's translation notes are carried OUTSIDE the reading body in a separately labelled area.",
    },
    archiveDerived: d,
    ...(cfg.performanceWitnesses ? { performanceWitnesses: cfg.performanceWitnesses } : {}),
    ...(cfg.userSuppliedContext ? { userSuppliedContext: cfg.userSuppliedContext } : {}),
    ...(cfg.pageLayerQualification ? { pageLayerQualification: cfg.pageLayerQualification } : {}),
    ...(cfg.sourceConditionHolds ? { sourceConditionHolds: cfg.sourceConditionHolds } : {}),
    lockedExclusions: [
      "the assembled layer's archival apparatus — assembly notes/provenance and per-scene review files",
      "the English layer's translation notes, held outside the reading body",
      "later library/accession stamps, handwritten marks, damage and bleed-through, never merged into the literary text",
      "decorative heading artwork, illustrations and photographs, described in page records rather than converted into dramatic text",
    ],
    projectRights: {
      appliesTo: "underlying-work-authored-by-kalaignar",
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null, governmentOrderDate: null, governmentOrderHandoverDate: "2024-12-22",
      distinctionNote: "This is the PRESENT project-level rights status of Kalaignar's underlying stage play. The edition's own publisher, place, price and copyright lines are edition facts, not statements about those rights.",
      thirdPartyNote: "Nationalisation applies to Kalaignar's underlying authored play. It does NOT extend to the edition's publisher/imprint matter, printed price, decorative artwork, illustrations and photographs, or the library's stamps and accession marks.",
      projectTranslationNote: "The English reading layer is a project-created, source-linked independent translation with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      archivalStatusNote: "The source repository's completion/release status is an editorial and archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
      evidencePending: "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
    notes: [
      "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
      "Speaker labels, stage-direction delimiters, settings, intertitles, repetitions, ellipsis counts, punctuation and historical spelling are carried exactly as printed. Nothing is modernised, expanded or normalised.",
      ...(cfg.authorAttribution === "user-supplied-at-intake" ? ["The author attribution is user-supplied catalogue metadata at intake; the selected source range does not itself print an author line. It is recorded as catalogue context, not promoted to a verified source fact."] : []),
    ],
  };

  const OUT = path.join(process.cwd(), "public/data/plays", cfg.slug);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "play.json"), JSON.stringify(play, null, 1) + "\n");
  fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");
  const sha = (f) => execFileSync("shasum", ["-a", "256", path.join(OUT, f)], { encoding: "utf8" }).split(" ")[0];
  console.log(`\n${cfg.slug}: ${play.readingUnits.length} reading units (${d.scenes} numbered${d.sourceRepresentationUnits ? `, ${d.sourceRepresentationUnits} SRUs` : ""}${d.compressedSceneRanges ? `, ${d.compressedSceneRanges} compressed range` : ""}${d.unnumberedScenes ? `, ${d.unnumberedScenes} unnumbered காட்சி` : ""})`);
  console.log(`  TA units ${d.tamilUnits} (dialogue ${d.tamilDialogue} / stage ${d.tamilStageDirections} / verse ${d.tamilVerse}) · headings ${d.inBodyHeadings} · speakers ${d.distinctSpeakerLabels} · unlabelled ${d.unlabelledDialogueUnits}`);
  console.log(`  EN units ${d.englishUnits} · translation notes ${d.translationNotes}${d.bodySourceConditionHolds ? ` · body source-condition holds ${d.bodySourceConditionHolds}` : ""}`);
  console.log(`  play.json ${sha("play.json")}`);
  console.log(`  provenance.json ${sha("provenance.json")}`);
  return { slug: cfg.slug, readingUnits: play.readingUnits.length };
}

console.log(`import-drama-wave6 — source ${SRC_REPO} @ ${SRC_COMMIT}`);
for (const cfg of WORKS) buildWork(cfg);
console.log("\nimport-drama-wave6 — OK (3 works)");
