// Bulk importer for the FOUR dramatic works of கலைஞரின் நான்மணி மாலை — Drama Bulk Onboarding
// Wave 1.
//
//   node scripts/import-naanmani-malai-plays.mjs <kalaignar-stage-plays-clone> <source-commit>
//
// ONE coherent released batch, ONE importer. The four works share a single controlling Tamil scan,
// a single composite-source registry and a single historical source pin; importing them as four
// separate lifecycles would fabricate four independent provenances out of one release.
//
// WORKS IN SCOPE — and the two that are deliberately not:
//   * பரதாயணம் (scans 6–17), அனார்கலி (18–26), சாக்ரடீஸ் (27–43), சேரன் செங்குட்டுவன் (44–53);
//   * மணிமகுடம் is NEVER read: its upstream source processing is still active (115/170 scans, no
//     scene assembly, English not authorized), so it has no released layer to import;
//   * சிலப்பதிகாரம் has its own importer and its own, different, source pin. This one never
//     touches it.
//
// WHAT THIS IMPORTER REFUSES TO DO:
//   * read the 2009 published English witness — the reader's English is the archive's own
//     independent translation, and every English file must declare the witness unused;
//   * convert பரதாயணம் into "Scene 1" — the archive records `scene: null` and assembles one
//     continuous body, so the work is imported as `continuous-play` with `sceneCount: 0`;
//   * count Socrates' introductory note, Bharathayanam's opening note or Cheran Senguttuvan's
//     pre-scene framing as a scene;
//   * let archival apparatus (assembly notes, fidelity reviews, provenance tables, translation
//     notes) into the reading body;
//   * normalize Tamil — no spelling, sandhi, speaker-label, punctuation or old-glyph repair;
//   * invent a publication year, an edition statement, or per-unit scan precision the assembled
//     source does not publish.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-naanmani-malai-plays.mjs <stage-plays-clone> <source-commit>");
  process.exit(1);
}

// ── FAIL-CLOSED SOURCE PIN ───────────────────────────────────────────────────────────────────────
let actualHead;
try {
  actualHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  throw new Error(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`);
}
if (actualHead !== SRC_COMMIT) {
  throw new Error(
    `source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${actualHead}. ` +
      `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
  );
}

const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const OUT_ROOT = path.join(process.cwd(), "public/data/plays");

// ── SHARED COMPOSITE SOURCE ──────────────────────────────────────────────────────────────────────
const REGISTRY = path.join(SRC_REPO, "sources/naanmani-malai-tamil");
const SCAN_FILENAME = "TVA_BOK_0065576_நான்மணி_மாலை.pdf";
const SCAN_SHA256 = "18d2b1405544b03507e9f92067d287cb28f5a92eaf02bed7054e6e78e5e38c89";
const SCAN_PAGES = 54;
const COLLECTION_TA = "கலைஞரின் நான்மணி மாலை";

const regMeta = readText(path.join(REGISTRY, "metadata/source.md"));
if (!regMeta.includes(SCAN_SHA256)) throw new Error("composite source metadata no longer records the pinned scan SHA-256");
if (!nfc(regMeta).includes(nfc(SCAN_FILENAME))) throw new Error("composite source metadata no longer records the pinned scan filename");
if (!/Scan pages:\s*\*\*54\*\*/.test(regMeta)) throw new Error("composite source metadata no longer records 54 scan pages");
if (!/Source PDF committed to repository:\s*\*\*No\*\*/.test(regMeta)) {
  throw new Error("composite source metadata no longer states the PDF is uncommitted");
}
// The scan establishes NO publication year. If the archive ever changes that, the absence recorded
// downstream stops being true, so this aborts rather than silently keeping a stale `year: null`.
if (!regMeta.includes("No standalone publication year has been established")) {
  throw new Error("composite source metadata no longer states that no publication year is established — refusing to import");
}
const sizeMatch = /File size:\s*\*\*\s*([\d,]+)\s*bytes\s*\*\*/.exec(regMeta);
if (!sizeMatch) throw new Error("composite source metadata no longer records the scan file size — refusing to import");
const SCAN_SIZE = Number(sizeMatch[1].replace(/,/g, ""));
if (SCAN_SIZE !== 146754449) throw new Error(`unexpected composite scan size ${SCAN_SIZE}`);

// Shared front matter is the ONLY place this composite prints publisher/place/price, so the four
// works carry those edition facts from the registry rather than each inventing its own.
const PUBLISHER_TA = "தமிழ்க்கனி பதிப்பகம்";
const PLACE_TA = "சென்னை-28";
const PRICE_TA = "விலை ரூ. 4/-";
const COPYRIGHT_TA = "© பதிப்புரிமை";
for (const [label, v] of [["publisher", PUBLISHER_TA], ["place", PLACE_TA], ["price", PRICE_TA], ["copyright", COPYRIGHT_TA]]) {
  if (!nfc(regMeta).includes(nfc(v))) throw new Error(`composite source metadata no longer records the ${label} line ${v}`);
}

// Closure gates published by the composite registry itself.
const regReadme = readText(path.join(REGISTRY, "README.md"));
const coverage = readText(path.join(REGISTRY, "COVERAGE_AUDIT.md"));
const englishClosure = readText(path.join(REGISTRY, "ENGLISH_PHASE_CLOSURE_AUDIT.md"));
if (!/Status:\s*\*\*PASS \/ COMPLETE\*\*/.test(coverage)) throw new Error("composite coverage audit is no longer PASS / COMPLETE");
if (!/Status:\s*\*\*PASS \/ COMPLETE\*\*/.test(englishClosure)) throw new Error("composite English-phase closure audit is no longer PASS / COMPLETE");
if (!/coverage for \*\*54\/54 physical scans\*\*/.test(coverage)) throw new Error("composite coverage audit no longer reports 54/54 scans");
if (!/54\/54 physical scans represented/.test(regReadme)) throw new Error("composite registry no longer reports 54/54 scans represented");
if (!/Count:\s*\*\*4 \/ 4 independent English translations COMPLETE\*\*/.test(regReadme)) {
  throw new Error("composite registry no longer reports 4/4 independent English translations complete");
}

// மணிமகுடம் must exist upstream and must NOT be in scope. Asserting both keeps the exclusion a
// checked fact rather than a comment.
if (!fs.existsSync(path.join(SRC_REPO, "works/manimagudam"))) {
  throw new Error("expected works/manimagudam to exist upstream — the exclusion assertion cannot be evaluated");
}

// ── APPARATUS ────────────────────────────────────────────────────────────────────────────────────
// Archival apparatus headings, which never enter the reading body. They are always Latin-script H2s.
// The Tamil layer ALSO uses two Latin-script H2s for real reading content — `Printed opening note`
// and `Continuous text` — so a blanket "Latin heading in a Tamil file is apparatus" rule would
// silently drop source text. Both sets are therefore listed explicitly, and any other Latin H2 in a
// Tamil file aborts the import rather than being guessed at.
const TA_APPARATUS = new Set([
  "Assembly notes",
  "Visual text fidelity review",
  "Page-record fidelity review",
  "Provenance and page-boundary handling",
]);
const TA_CONTENT_LATIN = new Set(["Printed opening note", "Continuous text"]);
const EN_APPARATUS = new Set(["Translation notes", "Dravidian movement resonance — interpretive note"]);
const EN_CONTENT_LATIN = new Set(["Printed opening note", "Continuous translation"]);
const looksLatin = (h) => /^[\x20-\x7E‐-―‘’“”'"—–]+$/.test(h);

const SPEAKER = /^([^[\]\n]{1,40}?)(\s*:\s)(?!\s)/;
const ORNAMENT = /^[*\s]+$/;

function frontMatter(text, file) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error(`${file}: missing front matter`);
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { fm: out, body: text.slice(m[0].length) };
}

/**
 * Parse one assembled file (Tamil scene / continuous play, or its English counterpart) into
 * headings, ordered reading units and apparatus notes.
 *
 * Reading units are the source's own blank-line-separated paragraphs, classified by the delimiter
 * or label the edition itself prints. A bracketed stage direction spanning several paragraphs is
 * absorbed only when the edition's own `]` arrives before anything that starts a new unit.
 */
function parseAssembled(text, file, { english }) {
  const { fm, body } = frontMatter(text, file);
  const headings = [];
  const units = [];
  const notes = [];
  let current = null;
  let noteHeading = null;
  let noteBuf = [];

  const flushNote = () => {
    if (noteHeading && noteBuf.length) {
      notes.push({
        kind: noteHeading === "Translation notes" ? "translation-note" : "interpretive-note",
        text: noteBuf.join("\n\n").trim(),
      });
    }
    noteBuf = [];
  };
  const addUnit = (u) => { units.push(u); current = u; return u; };
  const opens = (x) => (x.match(/\[/g) || []).length > (x.match(/]/g) || []).length;
  const closes = (x) => (x.match(/]/g) || []).length > (x.match(/\[/g) || []).length;
  const startsUnit = (x) => x.startsWith("[") || x.startsWith("(") || x.startsWith("“") || x.startsWith('"') || SPEAKER.test(x);

  const paras = body.split("\n\n").map((x) => x.replace(/^\n+/, "").replace(/\s+$/, "")).filter((x) => x.trim());
  const runEnd = (i) => {
    for (let j = i + 1; j < paras.length; j++) {
      const p = paras[j].trim();
      if (!p) continue;
      if (/^(#{1,6})\s/.test(p)) return -1;
      if (startsUnit(p)) return -1;
      if (closes(p)) return j;
    }
    return -1;
  };

  let i = 0;
  while (i < paras.length) {
    const chunk = paras[i];
    const t = chunk.trim();
    const firstLine = t.split("\n")[0];
    const h = /^(#{1,6})\s+(.*)$/.exec(firstLine);

    if (h) {
      const txt = h[2].trim();
      const apparatus = english ? EN_APPARATUS : TA_APPARATUS;
      const contentLatin = english ? EN_CONTENT_LATIN : TA_CONTENT_LATIN;
      // The guard is asymmetric, because the two layers head their content differently.
      //
      // A TAMIL file heads its content in Tamil, so a Latin-script heading there is either
      // archival apparatus or one of the two Latin content headings the archive uses
      // (`Printed opening note`, `Continuous text`). Anything else is unrecognised and aborts:
      // guessing wrong would either leak archival prose into the reading text or delete source
      // text. An ENGLISH file heads everything in Latin script, so there the apparatus set is the
      // enumerated exception and every other heading is content.
      if (!english && looksLatin(txt) && !apparatus.has(txt) && !contentLatin.has(txt)) {
        throw new Error(`${file}: unrecognised Latin heading "${txt}" in a Tamil file — refusing to guess whether it is apparatus or reading content`);
      }
      if (apparatus.has(txt)) {
        flushNote();
        if (!english) break; // Tamil apparatus ends the reading body outright.
        noteHeading = txt;
        noteBuf = [];
        const rest = t.split("\n").slice(1).join("\n").trim();
        if (rest) noteBuf.push(rest);
        current = null; i++; continue;
      }
      if (noteHeading) { noteBuf.push(chunk); i++; continue; }
      headings.push({ level: h[1].length, text: txt, index: units.length });
      current = null; i++; continue;
    }
    if (noteHeading) { noteBuf.push(chunk); i++; continue; }

    if (ORNAMENT.test(t)) { addUnit({ kind: "ornament", text: t }); i++; continue; }

    if (t.startsWith("[")) {
      const end = opens(t) ? runEnd(i) : -1;
      if (end > i) {
        const parts = [];
        for (let j = i; j <= end; j++) parts.push(paras[j]);
        addUnit({ kind: "stage-direction", delimiter: "square", text: parts.join("\n\n") });
        i = end + 1; continue;
      }
      addUnit({ kind: "stage-direction", delimiter: "square", text: chunk, unclosedInSource: opens(t) });
      i++; continue;
    }
    if (t.startsWith("(")) { addUnit({ kind: "stage-direction", delimiter: "round", text: chunk }); i++; continue; }
    if (t.startsWith("“") || t.startsWith('"')) { addUnit({ kind: "verse", text: chunk }); i++; continue; }
    if (closes(t)) { addUnit({ kind: "stage-direction", delimiter: "square", text: chunk, continuesUnclosed: true }); i++; continue; }

    const sp = SPEAKER.exec(t);
    if (sp) {
      // The separator is carried verbatim — this composite prints `அனார் : `, `விஜ. ` and
      // `கன: ` and normalising that spacing would be a silent punctuation change.
      addUnit({
        kind: "dialogue",
        speakerAsPrinted: sp[1],
        speakerSeparator: sp[2],
        text: chunk.slice(chunk.indexOf(sp[0]) + sp[0].length),
      });
      i++; continue;
    }
    // No printed label: carried as an UNLABELLED printed speech, never attributed to the previous
    // speaker and never reclassified as a stage direction.
    addUnit({ kind: "dialogue", speakerAsPrinted: null, text: chunk });
    i++;
  }
  flushNote();

  const finished = units.map((u) => {
    const base = { text: u.text, hasLineBreaks: u.text.includes("\n") };
    if (u.kind === "dialogue") {
      return { kind: "dialogue", speakerAsPrinted: u.speakerAsPrinted, speakerSeparator: u.speakerSeparator ?? null, ...base };
    }
    if (u.kind === "stage-direction") {
      const sd = { kind: "stage-direction", delimiter: u.delimiter, ...base };
      if (u.unclosedInSource) sd.unclosedInSource = true;
      if (u.continuesUnclosed) sd.continuesUnclosed = true;
      return sd;
    }
    return { kind: u.kind, ...base };
  });
  return { fm, headings, units: finished, notes };
}

/**
 * Parse a VERIFIED PAGE RECORD's `## Printed text` section.
 *
 * Used only for சாக்ரடீஸ்' introductory note, which the archive verifies at page-record level but
 * publishes no assembled file for. The page records encode the printed line structure with
 * Markdown hard breaks, and that structure is carried through UNCHANGED: no print-line wrap is
 * joined here, because joining `கருத்` + `துக்கள்` would be an assembly decision the source archive
 * has not made and this integration must not make on its behalf.
 */
function parsePageRecordPrintedText(text, file) {
  const { fm, body } = frontMatter(text, file);
  if (fm.status !== "verified") throw new Error(`${file}: page record is not verified — refusing to import`);
  const m = /^## Printed text\n([\s\S]*?)(?=^## |\s*$)/m.exec(body);
  if (!m) throw new Error(`${file}: no '## Printed text' section`);
  const paras = m[1].split("\n\n").map((x) => x.replace(/^\n+/, "").replace(/\s+$/, "")).filter((x) => x.trim());
  const units = paras.map((p) => {
    const t = p.trim();
    if (ORNAMENT.test(t)) return { kind: "ornament", text: t, hasLineBreaks: false };
    if (t.startsWith("[")) return { kind: "stage-direction", delimiter: "square", text: p, hasLineBreaks: p.includes("\n") };
    if (t.startsWith("(")) return { kind: "stage-direction", delimiter: "round", text: p, hasLineBreaks: p.includes("\n") };
    return { kind: "dialogue", speakerAsPrinted: null, speakerSeparator: null, text: p, hasLineBreaks: p.includes("\n") };
  });
  return { fm, units };
}

// ── PER-WORK BUILD ───────────────────────────────────────────────────────────────────────────────
const nums = (s) => JSON.parse(s ?? "[]");
const h = (hs, lvl) => hs.find((x) => x.level === lvl)?.text ?? null;

function gate(cond, msg) { if (!cond) throw new Error(`source completion gate failed: ${msg}`); }

function checkTamilGates(fm, file) {
  if (fm.status !== "assembly-reviewed") throw new Error(`${file}: Tamil status ${fm.status}`);
  if (fm.assembled_from_verified_pages !== "true") throw new Error(`${file}: not assembled from verified pages`);
  // Bharathayanam's continuous assembly records its fidelity in ASSEMBLY_FIDELITY_REVIEW.md rather
  // than a per-file flag; the scene files carry the flag directly.
  if (fm.visual_text_fidelity && fm.visual_text_fidelity !== "passed") {
    throw new Error(`${file}: Tamil fidelity ${fm.visual_text_fidelity}`);
  }
}
function checkEnglishGates(fm, file) {
  if (fm.status !== "translation-reviewed") throw new Error(`${file}: English status ${fm.status}`);
  if (fm.translation_review !== "passed") throw new Error(`${file}: English review ${fm.translation_review}`);
  if (fm.secondary_english_witness_used !== "false") {
    throw new Error(`${file}: English declares the 2009 published witness was used — refusing to import`);
  }
}

/**
 * Prove an opening note's scan attribution FROM THE PAGE RECORD, rather than assuming it sits on
 * the work's first scan. The page record for that scan must itself carry the matching printed
 * section heading; if the archive ever moves the material, this aborts instead of mislabelling it.
 */
function assertOpeningNoteScan(dir, slug, scan, headings) {
  const f = path.join(dir, "pages", `${String(scan).padStart(4, "0")}.md`);
  if (!fs.existsSync(f)) throw new Error(`${slug}: no page record for scan ${scan}, which the opening note is attributed to`);
  const rec = readText(f);
  const { fm } = frontMatter(rec, `${slug}/pages/${scan}`);
  if (fm.status !== "verified") throw new Error(`${slug}: page record for scan ${scan} is not verified`);
  if (!headings.some((h) => new RegExp(`^## ${h}\\s*$`, "m").test(rec))) {
    throw new Error(`${slug}: page record for scan ${scan} carries none of the expected printed sections (${headings.join(" / ")}) — refusing to attribute the opening note to it`);
  }
  return scan;
}

/** Every work's own README must still report its completion gates. */
function assertWorkReadme(dir, slug, required) {
  const readme = readText(path.join(dir, "README.md"));
  for (const r of required) {
    if (!new RegExp(r).test(readme)) throw new Error(`${slug}: README no longer reports "${r}"`);
  }
  return readme;
}

const WORKS = [
  {
    slug: "bharathayanam",
    titleTa: "பரதாயணம்",
    titleEn: "Bharathayanam",
    descriptorTa: "காலட்சேப நாடகம்",
    descriptorEn: "A kalakshepam drama",
    structureKind: "continuous-play",
    scans: [6, 17],
    readmeGates: [
      "page-level Tamil visual verification: \\*\\*12/12 scans COMPLETE\\*\\*",
      "continuous-text assembly: \\*\\*COMPLETE / PASS\\*\\*",
      "independent English translation: \\*\\*COMPLETE / translation-reviewed PASS\\*\\*",
      "unresolved literary-text readings: \\*\\*0\\*\\*",
      "unresolved English translation blocks: \\*\\*0\\*\\*",
    ],
    sceneFiles: [],
    hasWitness: false,
  },
  {
    slug: "anarkali",
    titleTa: "அனார்கலி",
    titleEn: "Anarkali",
    descriptorTa: "நான்கு காட்சி நாடகம்",
    descriptorEn: "A play in four scenes",
    structureKind: "scene-sequence",
    scans: [18, 26],
    readmeGates: ["9/9", "4/4"],
    sceneFiles: ["01", "02", "03", "04"],
    hasWitness: true,
  },
  {
    slug: "socrates",
    titleTa: "சாக்ரடீஸ்",
    titleEn: "Socrates",
    descriptorTa: "ஐந்து காட்சி நாடகம்",
    descriptorEn: "A play in five scenes",
    structureKind: "scene-sequence",
    scans: [27, 43],
    readmeGates: [
      "total Tamil page verification: \\*\\*17/17 COMPLETE\\*\\*",
      "scenes assembled: \\*\\*5/5 COMPLETE\\*\\*",
      "independent English scenes: \\*\\*5/5 COMPLETE\\*\\*",
      "unresolved English translation blocks: \\*\\*0\\*\\*",
    ],
    sceneFiles: ["01", "02", "03", "04", "05"],
    hasWitness: true,
    introPages: [27, 28],
  },
  {
    slug: "cheran-senguttuvan",
    titleTa: "சேரன் செங்குட்டுவன்",
    titleEn: "Cheran Senguttuvan",
    descriptorTa: "நான்கு காட்சி நாடகம்",
    descriptorEn: "A play in four scenes",
    structureKind: "scene-sequence",
    scans: [44, 53],
    readmeGates: ["10/10", "4/4"],
    sceneFiles: ["01", "02", "03", "04"],
    hasWitness: true,
  },
];

const summaries = [];

for (const W of WORKS) {
  const dir = path.join(SRC_REPO, "works", W.slug);
  if (!fs.existsSync(dir)) throw new Error(`${W.slug}: work directory missing from the pinned source`);
  assertWorkReadme(dir, W.slug, W.readmeGates);

  const meta = readText(path.join(dir, "metadata/source.md"));
  if (!meta.includes(SCAN_SHA256)) throw new Error(`${W.slug}: work metadata no longer records the composite scan SHA-256`);
  if (!new RegExp(`Work scan range:\\s*\\*\\*${W.scans[0]}–${W.scans[1]}\\*\\*`).test(meta)) {
    throw new Error(`${W.slug}: work metadata no longer records scan range ${W.scans[0]}–${W.scans[1]}`);
  }
  // NO YEAR MAY BE INFERRED. The absence is established once, for the whole composite, by the
  // shared registry (asserted above). A work's own metadata need not repeat it — only
  // பரதாயணம் does — but if it ever DOES state a year, that is a source change this integration
  // must not absorb silently, so anything other than "not established" aborts.
  const yearLine = /^-\s*Publication year:\s*(.*)$/m.exec(meta);
  if (yearLine && !/not established/.test(yearLine[1])) {
    throw new Error(`${W.slug}: work metadata now states a publication year (${yearLine[1].trim()}) — refusing to import against a stale no-year record`);
  }

  const readingUnits = [];
  let openingNote;

  if (W.structureKind === "continuous-play") {
    // ── பரதாயணம் — ONE continuous dramatic body, and an opening note that is not a scene ──────
    const taRaw = readText(path.join(dir, "scenes/continuous-play.md"));
    const enRaw = readText(path.join(dir, "translations/en/continuous-play.md"));
    const ta = parseAssembled(taRaw, `${W.slug}/scenes/continuous-play.md`, { english: false });
    const en = parseAssembled(enRaw, `${W.slug}/translations/en/continuous-play.md`, { english: true });
    checkTamilGates(ta.fm, `${W.slug}/scenes/continuous-play.md`);
    checkEnglishGates(en.fm, `${W.slug}/translations/en/continuous-play.md`);
    // THE ARCHIVE ITSELF RECORDS `scene: null`. If that ever became a number the work would no
    // longer be continuous, and importing it as one would be false.
    if (ta.fm.scene !== "null") throw new Error(`${W.slug}: expected scene: null in the continuous assembly, got ${ta.fm.scene}`);

    const declared = nums(ta.fm.source_scan_pages);
    if (declared[0] !== W.scans[0] || declared[declared.length - 1] !== W.scans[1]) {
      throw new Error(`${W.slug}: continuous assembly declares scans ${declared.join(",")}, expected ${W.scans.join("–")}`);
    }

    // Split at the archive's own section headings: opening note, then continuous body.
    const cut = (parsed, noteHead, bodyHead) => {
      const iNote = parsed.headings.findIndex((x) => x.text === noteHead);
      const iBody = parsed.headings.findIndex((x) => x.text === bodyHead);
      if (iNote === -1 || iBody === -1) throw new Error(`${W.slug}: expected "${noteHead}" and "${bodyHead}" sections`);
      const noteStart = parsed.headings[iNote].index;
      const bodyStart = parsed.headings[iBody].index;
      return { note: parsed.units.slice(noteStart, bodyStart), body: parsed.units.slice(bodyStart) };
    };
    const taCut = cut(ta, "Printed opening note", "Continuous text");
    const enCut = cut(en, "Printed opening note", "Continuous translation");
    if (taCut.note.length === 0 || taCut.body.length === 0) throw new Error(`${W.slug}: empty opening note or continuous body`);

    openingNote = {
      attachedTo: "continuous-play",
      labelTa: "அச்சிடப்பட்ட தொடக்கக் குறிப்பு",
      labelEn: "Printed opening note",
      sourceScans: [assertOpeningNoteScan(dir, W.slug, W.scans[0], ["Printed opening note"])],
      tamil: { units: taCut.note },
      english: { units: enCut.note, notes: [] },
    };
    readingUnits.push({
      order: null,
      slug: "continuous-play",
      kind: "continuous-body",
      headingTa: h(ta.headings, 1),
      headingEn: h(en.headings, 1),
      titleTa: W.titleTa,
      titleEn: W.titleEn,
      settingTa: null,
      settingEn: null,
      sourceScans: declared,
      tamil: { units: taCut.body },
      english: { units: enCut.body, notes: en.notes },
    });
  } else {
    // ── SCENE SEQUENCES ──────────────────────────────────────────────────────────────────────
    for (const stem of W.sceneFiles) {
      const taFile = `${W.slug}/scenes/${stem}.md`;
      const enFile = `${W.slug}/translations/en/${stem}.md`;
      const ta = parseAssembled(readText(path.join(dir, "scenes", `${stem}.md`)), taFile, { english: false });
      const en = parseAssembled(readText(path.join(dir, "translations/en", `${stem}.md`)), enFile, { english: true });
      checkTamilGates(ta.fm, taFile);
      checkEnglishGates(en.fm, enFile);

      const order = Number(ta.fm.scene);
      if (!Number.isInteger(order) || order !== Number(stem)) throw new Error(`${taFile}: scene number ${ta.fm.scene} does not match the file stem`);
      const declared = nums(ta.fm.source_scan_pages);
      if (declared.length === 0) throw new Error(`${taFile}: no source_scan_pages`);

      // The scene heading is the FIRST Tamil heading whose text is a printed `காட்சி` heading; the
      // work title H1 (present only on the opening file) is not a scene heading.
      const taSceneHeadIdx = ta.headings.findIndex((x) => /காட்சி/.test(x.text));
      if (taSceneHeadIdx === -1) throw new Error(`${taFile}: no printed காட்சி heading found`);
      const taSceneHead = ta.headings[taSceneHeadIdx];
      const enSceneHeadIdx = en.headings.findIndex((x) => /^Scene\b/.test(x.text));
      if (enSceneHeadIdx === -1) throw new Error(`${enFile}: no Scene heading found`);
      const enSceneHead = en.headings[enSceneHeadIdx];

      // Anything printed BEFORE the scene heading is the work's pre-dramatic framing, not scene
      // text (சேரன் செங்குட்டுவன் prints a framing voice before காட்சி — 1). It becomes the
      // opening note; it is never numbered and never counted as a scene.
      if (taSceneHead.index > 0) {
        if (openingNote) throw new Error(`${W.slug}: more than one block of pre-scene framing`);
        openingNote = {
          attachedTo: stem,
          labelTa: "நாடகத் துவக்கத்திற்கு முன் அச்சிடப்பட்டது",
          labelEn: "Printed before the play begins",
          sourceScans: [assertOpeningNoteScan(dir, W.slug, declared[0], ["Printed pre-scene text", "Printed opening note"])],
          tamil: { units: ta.units.slice(0, taSceneHead.index) },
          english: { units: en.units.slice(0, enSceneHead.index), notes: [] },
        };
      }

      // The printed setting is the heading directly under the scene heading, where the source
      // prints one. Several scenes print none; none is ever inferred.
      const settingTa = ta.fm.setting && ta.fm.setting !== "null" ? ta.fm.setting : null;
      const afterEn = en.headings.filter((x) => x.index >= enSceneHead.index && x.level > enSceneHead.level);
      const settingEn = settingTa === null ? null : afterEn[0]?.text ?? null;

      readingUnits.push({
        order,
        slug: stem,
        kind: "scene",
        headingTa: taSceneHead.text,
        headingEn: enSceneHead.text,
        titleTa: taSceneHead.text,
        titleEn: enSceneHead.text,
        settingTa,
        settingEn,
        sourceScans: declared,
        tamil: { units: ta.units.slice(taSceneHead.index) },
        english: { units: en.units.slice(enSceneHead.index), notes: en.notes },
      });
    }

    // ── சாக்ரடீஸ்' introductory note (scans 27–28) ────────────────────────────────────────────
    if (W.introPages) {
      const taUnits = [];
      for (const n of W.introPages) {
        const f = `${W.slug}/pages/${String(n).padStart(4, "0")}.md`;
        const rec = parsePageRecordPrintedText(readText(path.join(dir, "pages", `${String(n).padStart(4, "0")}.md`)), f);
        if (rec.fm.section !== "introductory-note") throw new Error(`${f}: expected section introductory-note, got ${rec.fm.section}`);
        if (rec.fm.scene !== "null") throw new Error(`${f}: introductory note carries a scene number — refusing to import`);
        taUnits.push(...rec.units);
      }
      const enIntroFile = `${W.slug}/translations/en/00-introduction.md`;
      const enIntro = parseAssembled(readText(path.join(dir, "translations/en/00-introduction.md")), enIntroFile, { english: true });
      checkEnglishGates(enIntro.fm, enIntroFile);
      if (enIntro.fm.section !== "introductory-note") throw new Error(`${enIntroFile}: expected section introductory-note`);
      openingNote = {
        attachedTo: W.sceneFiles[0],
        labelTa: "அச்சிடப்பட்ட முன்னுரைக் குறிப்பு",
        labelEn: "Printed introductory note",
        sourceScans: W.introPages,
        tamil: { units: taUnits },
        english: { units: enIntro.units, notes: enIntro.notes },
      };
    }
  }

  // ── STRUCTURAL INVARIANTS ────────────────────────────────────────────────────────────────────
  const scenes = readingUnits.filter((u) => u.kind === "scene");
  const continuous = readingUnits.filter((u) => u.kind === "continuous-body");
  if (W.structureKind === "continuous-play") {
    gate(continuous.length === 1 && scenes.length === 0, `${W.slug}: a continuous work must have exactly one continuous body and no scenes`);
    // NO "Scene 1" ANYWHERE. The route slug is editorial navigation, never a source scene number.
    for (const u of continuous) {
      if (u.order !== null) throw new Error(`${W.slug}: the continuous body carries a scene number — refusing to import`);
      if (/^scene-?0*1$/i.test(u.slug)) throw new Error(`${W.slug}: the continuous body was given a scene-shaped slug`);
    }
  } else {
    gate(scenes.length === W.sceneFiles.length, `${W.slug}: expected ${W.sceneFiles.length} scenes, got ${scenes.length}`);
    gate(
      scenes.map((s) => s.order).join(",") === W.sceneFiles.map((_, i) => i + 1).join(","),
      `${W.slug}: scenes are not exactly 1..${W.sceneFiles.length} in order`,
    );
  }
  if (openingNote && !readingUnits.some((u) => u.slug === openingNote.attachedTo)) {
    throw new Error(`${W.slug}: opening note is attached to a reading unit that does not exist`);
  }

  const scanNums = readingUnits.flatMap((u) => u.sourceScans);
  const bodyScans = { from: Math.min(...scanNums), to: Math.max(...scanNums) };
  if (bodyScans.from < W.scans[0] || bodyScans.to > W.scans[1]) {
    throw new Error(`${W.slug}: reading units cite scans outside the work's declared range`);
  }
  // Scan 54 is composite back matter and belongs to no play.
  if (scanNums.includes(54)) throw new Error(`${W.slug}: a reading unit cites scan 54, which is composite back matter`);

  const allUnits = readingUnits.flatMap((u) => [...u.tamil.units, ...u.english.units])
    .concat(openingNote ? [...openingNote.tamil.units, ...openingNote.english.units] : []);
  const count = (f) => allUnits.filter(f).length;
  const taUnitsAll = readingUnits.flatMap((u) => u.tamil.units).concat(openingNote ? openingNote.tamil.units : []);
  const enUnitsAll = readingUnits.flatMap((u) => u.english.units).concat(openingNote ? openingNote.english.units : []);
  const speakers = new Set(taUnitsAll.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted).map((u) => u.speakerAsPrinted));

  const play = {
    workId: W.slug,
    slug: W.slug,
    title: { ta: W.titleTa, en: W.titleEn },
    descriptor: { ta: W.descriptorTa, en: W.descriptorEn },
    author: { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
    edition: {
      publisherTa: PUBLISHER_TA,
      placeTa: PLACE_TA,
      priceTa: PRICE_TA,
      copyrightLineTa: COPYRIGHT_TA,
      collectionTitleTa: COLLECTION_TA,
      year: null,
    },
    sourceRepo: "pugazg/kalaignar-stage-plays",
    sourcePath: `works/${W.slug}`,
    sourceCommit: SRC_COMMIT,
    structureKind: W.structureKind,
    sceneCount: scenes.length,
    closingTableauCount: 0,
    scanProvenance: "per-unit-group",
    bodyScans,
    ...(openingNote ? { openingNote } : {}),
    readingUnits,
  };

  const provenance = {
    sourceRepo: play.sourceRepo,
    sourcePath: play.sourcePath,
    sourceCommit: SRC_COMMIT,
    source: {
      scanFilename: SCAN_FILENAME,
      scanSha256: SCAN_SHA256,
      scanFileSizeBytes: SCAN_SIZE,
      scanTotalPages: SCAN_PAGES,
      sourcePdfCommitted: false,
      scanIdentityBasis:
        "Scan identity (filename, SHA-256, byte size, page count) is carried AS RECORDED BY THE SOURCE ARCHIVE's composite-source registry. The controlling PDF is held outside both repositories and was not supplied to this integration, so the checksum was NOT independently recomputed here.",
      pageRecordsVerified: `${W.scans[1] - W.scans[0] + 1} / ${W.scans[1] - W.scans[0] + 1} scans verified at page-record level`,
      sourceAudit: "Composite 54-scan coverage audit: PASS / COMPLETE (0 gaps, 0 overlaps)",
      assembledLayer:
        W.structureKind === "continuous-play"
          ? "Continuous-text assembly COMPLETE / PASS; page-record ↔ assembly fidelity review PASS"
          : `${W.sceneFiles.length}/${W.sceneFiles.length} scenes assembly-reviewed; page-record ↔ scene fidelity PASS`,
      bodyScans: `${bodyScans.from}–${bodyScans.to}`,
      publicationYearNote:
        "NO publication year is established anywhere in this composite scan. The archive states so explicitly and forbids promoting internal dates or contextual clues into one, so the catalogue carries no year and no edition-year statement for this work.",
      collectionNote: `Printed inside the composite Tamil collection ${COLLECTION_TA} (54 scans). This work occupies scans ${W.scans[0]}–${W.scans[1]}. Scans 1–5 are shared front matter and scan 54 is the illustrated back cover; neither is part of any play's reading body.`,
      ...(W.structureKind === "continuous-play"
        ? {
            continuousStructureNote:
              "The source prints this work as ONE continuous dramatic/kalakshepam text with NO scene division: its archive records `scene: null` and assembles a single continuous-play file. It therefore has 0 source scenes, and its single reading route carries an editorial navigation slug. It is never presented, numbered or counted as \"Scene 1\".",
          }
        : {}),
      ...(openingNote
        ? {
            openingNoteNote:
              `The source prints ${openingNote.labelEn.toLowerCase()} before the dramatic body (scans ${openingNote.sourceScans.join(", ")}). It is published as source text at the head of the reading unit it precedes, but it is NOT a scene: it is never numbered, never counted in the scene total, and never given a route of its own.` +
              (W.introPages
                ? " The archive verifies this note at page-record level and publishes no assembled file for it, so it is carried at page-record fidelity with the printed line structure intact — no print-line wrap is joined here, because that assembly decision belongs to the source archive."
                : ""),
          }
        : {}),
    },
    english: {
      kind: "project-created",
      status:
        W.structureKind === "continuous-play"
          ? "Independent English translation COMPLETE; translation review PASS; 0 unresolved translation blocks"
          : `Independent English ${W.sceneFiles.length}/${W.sceneFiles.length} scenes${W.introPages ? " + introductory note" : ""} COMPLETE; translation review PASS; 0 unresolved translation blocks`,
      independence:
        "The reader's English is the archive's own project-created independent translation, drafted and reviewed from the verified Tamil BEFORE any published English witness was opened. Every imported English file declares `secondary_english_witness_used: false`, and the importer refuses to run if one does not.",
      secondaryWitnessNote: W.hasWitness
        ? "M. D. Jayabalan's 2009 published English 'Tale of the Anklet and One Act Plays' contains this play and is held in the source archive as a SECONDARY COMPARISON WITNESS. The archive's post-translation comparison is PASS / COMPLETE and changed no verified Tamil and no reviewed English. It is never read by this importer and no part of it is published here."
        : "The 2009 published English 'One Act Plays' collection contains NO Bharathayanam, so no witness comparison applies to this work. That is 'not applicable', not an unfinished comparison, and no published English was used in its translation or review.",
      notesSeparated:
        "The English layer's translation notes — and, for Bharathayanam, its 'Dravidian movement resonance' interpretive note, which the source itself labels interpretive context rather than translated source text — are carried OUTSIDE the reading body in a separately labelled area.",
    },
    archiveDerived: {
      scenes: scenes.length,
      closingTableau: 0,
      continuousBodies: continuous.length,
      openingNotes: openingNote ? 1 : 0,
      tamilUnits: taUnitsAll.length,
      englishUnits: enUnitsAll.length,
      tamilDialogue: taUnitsAll.filter((u) => u.kind === "dialogue").length,
      tamilStageDirections: taUnitsAll.filter((u) => u.kind === "stage-direction").length,
      tamilVerse: taUnitsAll.filter((u) => u.kind === "verse").length,
      ornaments: count((u) => u.kind === "ornament"),
      distinctSpeakerLabels: speakers.size,
      unlabelledDialogueUnits: taUnitsAll.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted === null).length,
      scenesWithoutPrintedSetting: scenes.filter((s) => s.settingTa === null).length,
      multiScanScenes: readingUnits.filter((u) => u.sourceScans.length > 1).length,
      translationNotes: readingUnits.reduce((n, u) => n + u.english.notes.filter((x) => x.kind === "translation-note").length, 0),
      interpretiveNotes: readingUnits.reduce((n, u) => n + u.english.notes.filter((x) => x.kind === "interpretive-note").length, 0),
      note:
        "Derived structure only. The archive's verified page records remain the controlling text; this integration reads the archive's own assembled layer, which was built from those records and passed its fidelity review. Dialogue, stage directions and speaker labels are carried verbatim — never re-split, merged, expanded or normalised.",
      speakerNote:
        "Speaker labels are rendered EXACTLY as printed, including the composite's inconsistent abbreviations (`பாகவதர்` / `பாக`, `சிஷ்யன்` / `சிஷ்`, `விஜயர்` / `விஜ.`). Those variations are source data, not errors, and are never expanded or unified.",
      unlabelledNote:
        "Dialogue units with `speakerAsPrinted: null` are printed paragraphs the edition sets without a speaker label. Absence of a label is recorded as absence and never resolved into an attribution.",
    },
    lockedExclusions: [
      "the assembled layer's archival apparatus — assembly notes, visual-text / page-record fidelity reviews, and the continuous assembly's provenance and page-boundary table",
      "the English layer's translation notes and interpretive notes, which are held outside the reading body",
      "the per-work first-pass discrepancy, intro-reconciliation and page-verification records",
      "the 2009 published English witness and every secondary-witness comparison record, which are analytical evidence and are never read or published as reader content",
      "the composite volume's shared front matter (scans 1–5) and illustrated back cover (scan 54), which belong to no individual play",
      "library/accession marks, later handwriting, damage and bleed-through, which are copy-specific and never merged into the literary text",
    ],
    projectRights: {
      appliesTo: "underlying-work-authored-by-kalaignar",
      rightsStatus: "nationalised-by-tamil-nadu-government",
      rightsAuthority: "Government of Tamil Nadu",
      rightsAction: "nationalisation",
      rightsAnnouncementDate: "2024-08-22",
      governmentOrderNumber: null,
      governmentOrderDate: null,
      governmentOrderHandoverDate: "2024-12-22",
      distinctionNote:
        `This is the PRESENT project-level rights status of Kalaignar's underlying Tamil dramatic work. The composite volume's own publisher (${PUBLISHER_TA}), place, price and copyright lines are edition facts, not statements about those rights.`,
      thirdPartyNote:
        `Nationalisation applies to Kalaignar's underlying authored play. It does NOT extend to the project-created English translation, to the composite edition's publisher/imprint matter, printed price or cover artwork and design, or to the library/accession markings and other artefacts of this physical copy — each retains its own distinct provenance.`,
      ...(W.hasWitness
        ? {
            publishedWitnessNote:
              "M. D. Jayabalan's 2009 published English translation is a THIRD PARTY's separately copyrighted work. It is not covered by this nationalisation, is not published here in any form, and is recorded only as analytical evidence held in the source archive.",
          }
        : {}),
      projectTranslationNote:
        "The English reading layer is a project-created, source-linked independent translation with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
      archivalStatusNote:
        "The source repository's completion/release status is an editorial and archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
      evidencePending:
        "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
    },
    notes: [
      `The controlling source is the composite scanned PDF ${SCAN_FILENAME}; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.`,
      `This work occupies scans ${W.scans[0]}–${W.scans[1]} of the 54-scan composite ${COLLECTION_TA}. The volume's shared front matter and back cover belong to no individual play and are not imported into any reading body.`,
      "NO publication year is established in this composite scan, so none is recorded and no edition-year statement is made.",
      W.structureKind === "continuous-play"
        ? "The source prints this work as one continuous dramatic text with NO scenes. It is carried as a continuous body with 0 source scenes and is never presented as \"Scene 1\"."
        : `The source prints ${W.sceneFiles.length} numbered scenes. ${openingNote ? "Printed pre-dramatic material is carried separately and is never counted among them." : "No pre-dramatic material is printed for this work."}`,
      "The assembled source marks no scan boundaries inside its text, so scan provenance is carried per reading unit rather than per unit — the archive publishes no finer precision, and claiming any would be false.",
      "Speaker labels, stage-direction delimiters, repetitions, ellipsis counts, punctuation and old/source spellings are carried exactly as the archive verified them. Nothing is modernised, expanded or normalised.",
    ],
  };

  const out = path.join(OUT_ROOT, W.slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "play.json"), JSON.stringify(play, null, 1) + "\n");
  fs.writeFileSync(path.join(out, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

  summaries.push({ W, play, provenance, out });
}

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
console.log(`batch: கலைஞரின் நான்மணி மாலை — ${summaries.length} works @ ${SRC_COMMIT.slice(0, 12)}`);
for (const { W, play, provenance, out } of summaries) {
  const d = provenance.archiveDerived;
  console.log(`\n${W.titleEn} (${W.slug})`);
  console.log(`  structure: ${play.structureKind} | scenes: ${play.sceneCount} | continuous bodies: ${d.continuousBodies} | opening notes: ${d.openingNotes}`);
  console.log(`  reading units: ${play.readingUnits.length} [${play.readingUnits.map((u) => u.slug).join(", ")}] | scans ${provenance.source.bodyScans}`);
  console.log(`  Tamil units ${d.tamilUnits} (dialogue ${d.tamilDialogue}, directions ${d.tamilStageDirections}, verse ${d.tamilVerse}) | English units ${d.englishUnits}`);
  console.log(`  distinct speaker labels ${d.distinctSpeakerLabels} | unlabelled ${d.unlabelledDialogueUnits} | translation notes ${d.translationNotes} | interpretive ${d.interpretiveNotes}`);
  console.log(`  play.json ${sha(path.join(out, "play.json"))}`);
  console.log(`  provenance.json ${sha(path.join(out, "provenance.json"))}`);
}
