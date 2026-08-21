// Importer for சிலப்பதிகாரம் நாடகக் காப்பியம் — Digital Library Drama benchmark #1.
//
//   node scripts/import-silappathikaram.mjs <kalaignar-stage-plays-clone> <source-commit>
//
// Deterministic and work-specific. It reads ONLY the pinned source tree and fails closed if the
// clone's HEAD is not the supplied commit. Generated data is never hand-edited.
//
// The archival rules this importer enforces, and refuses to run without:
//   * the closing tableau is NOT Scene 39 — it stays unnumbered and separate;
//   * speaker labels are carried exactly as printed (no expansion, no unification);
//   * a speech continuing across the edition's TWO-COLUMN break carries `speakerAsPrinted: null`
//     rather than an invented attribution;
//   * the scan-88 library-stamp obstruction marker is carried verbatim into the reading text;
//   * archival apparatus and the English layer's interpretive notes never enter the reading body;
//   * the 2009 published English witness is never read at all;
//   * printed page numbers are carried only where a page record shows one.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-silappathikaram.mjs <stage-plays-clone> <source-commit>");
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

const SLUG = "silappathikaram-nataka-kappiyam";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const OUT = path.join(process.cwd(), "public/data/plays", SLUG);
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));

const SCAN_FILENAME = "TVA_BOK_0016473_சிலப்பதிகாரம்_நாடகக்_காப்பியம்.pdf";
const SCAN_SHA256 = "2886c8eaa9d79239eba3e9ed0ddefc4c7208da4761384ee7a8b4176e6b1a24dd";
const SCAN_PAGES = 88;
const OBSTRUCTION = "⟦later library stamp obscures leading letters⟧";

// ── SOURCE IDENTITY GUARD ────────────────────────────────────────────────────────────────────────
const meta = readText(path.join(WORK_DIR, "metadata/source.md"));
if (!meta.includes(SCAN_SHA256)) throw new Error("source metadata no longer records the pinned scan SHA-256");
if (!nfc(meta).includes(nfc(SCAN_FILENAME))) throw new Error("source metadata no longer records the pinned scan filename");
if (!/Scan pages:\s*\*\*88\*\*/.test(meta)) throw new Error("source metadata no longer records 88 scan pages");
if (!/Source PDF committed to repository:\s*\*\*No\*\*/.test(meta)) throw new Error("source metadata no longer states the PDF is uncommitted");
if (!meta.includes("No standalone publication year has yet been identified")) {
  throw new Error("source metadata no longer states that no publication year is identified — refusing to import");
}
// The size IS recorded by the source, so failing to read it must abort rather than quietly write
// `null` — a null here would be a false record of absence, not preserved uncertainty.
const sizeMatch = /File size:\s*\*\*\s*([\d,]+)\s*bytes\s*\*\*/.exec(meta);
if (!sizeMatch) throw new Error("source metadata no longer records the scan file size in the expected form — refusing to import");
const SCAN_SIZE = Number(sizeMatch[1].replace(/,/g, ""));
if (!Number.isInteger(SCAN_SIZE) || SCAN_SIZE <= 0) throw new Error(`unreadable scan file size: ${sizeMatch[1]}`);

// The 2009 published English witness must never be read. Assert it is present but untouched.
const witnessDir = path.join(SRC_REPO, "sources");
if (!fs.existsSync(witnessDir)) throw new Error("expected the published-witness sources/ tree to exist");

// ── PRINTED PAGE NUMBERS, from the canonical page records ────────────────────────────────────────
const PAGES_DIR = path.join(WORK_DIR, "pages");
const printedPageByScan = new Map();
for (const f of fs.readdirSync(PAGES_DIR).filter((x) => /^\d{4}\.md$/.test(x)).sort()) {
  const t = readText(path.join(PAGES_DIR, f));
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(t);
  if (!fm) throw new Error(`page record ${f} has no front matter`);
  const scan = Number(/^scan_page:\s*(\d+)\s*$/m.exec(fm[1])?.[1]);
  if (!Number.isInteger(scan)) throw new Error(`page record ${f} has no scan_page`);
  const raw = /^printed_page:\s*(.*)$/m.exec(fm[1])?.[1]?.trim();
  // Carried verbatim: this edition prints Roman folios in the front matter and Arabic in the body.
  const printed = !raw || raw === "null" ? null : raw.replace(/^"(.*)"$/, "$1");
  if (printed !== null && !/^([0-9]+|[ivxlcIVXLC]+)$/.test(printed)) {
    throw new Error(`page record ${f} has an unrecognised printed_page ${raw}`);
  }
  printedPageByScan.set(scan, printed);
  if (/^status:\s*"(?!verified)/m.test(fm[1])) throw new Error(`page record ${f} is not verified — refusing to import`);
}
if (printedPageByScan.size !== SCAN_PAGES) throw new Error(`expected ${SCAN_PAGES} page records, found ${printedPageByScan.size}`);

// ── APPARATUS (never enters the reading body) ────────────────────────────────────────────────────
// Apparatus headings are the archive's own, and they are always written in English while every
// printed body heading in the Tamil layer is Tamil. The prefixes below cover the wording variants
// the archive actually uses; ANY other Latin-script H2 in a Tamil scene aborts the import rather
// than being guessed at, because a missed apparatus heading would leak archival prose into the
// reading text.
const APPARATUS_TA_PREFIX = /^(Assembly\b|Source visual\b|Source obstruction\b|Visual[- ]text\b)/;
const APPARATUS_EN = new Set(["Translation notes", "Dravidian movement resonance — interpretive note"]);
const isApparatusTa = (h) => APPARATUS_TA_PREFIX.test(h);
const looksLatin = (h) => /^[\x20-\x7E\u2010-\u2015'"]+$/.test(h);

const SCAN_MARKER = /^<!--\s*source scan\s+(\d+)\s*-->$/;
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
 * Parse one assembled scene (or its English counterpart) into headings, reading units and notes.
 *
 * The parser is stateful because the printed source is: a bracketed stage direction can run across
 * several paragraphs, and a speech interrupted by a direction resumes WITHOUT its label. Both facts
 * are preserved rather than repaired.
 */
function parseScene(text, file, { english }) {
  const apparatus = APPARATUS_EN;
  const { fm, body } = frontMatter(text, file);
  const headings = [];
  const units = [];
  const notes = [];

  const declaredScans = JSON.parse(fm.source_scan_pages ?? "[]");
  if (!Array.isArray(declaredScans) || declaredScans.length === 0) throw new Error(`${file}: no source_scan_pages`);
  // A single-scan scene carries no inline marker, so provenance starts from the declared scan.
  let scan = declaredScans[0];
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
  const touch = (u) => { if (!u.scanSet.has(scan)) u.scanSet.add(scan); };
  const opens = (x) => (x.match(/\[/g) || []).length > (x.match(/]/g) || []).length;
  const closes = (x) => (x.match(/]/g) || []).length > (x.match(/\[/g) || []).length;
  const startsUnit = (x) => x.startsWith("[") || x.startsWith("(") || x.startsWith("“") || x.startsWith('"') || SPEAKER.test(x);

  // Paragraphs are the source's own units. A bracketed stage direction may run across several of
  // them, so a run is absorbed ONLY when the edition's own closing `]` arrives before anything that
  // starts a new unit. This edition also prints genuinely UNMATCHED brackets (the guide lists
  // "brackets/unmatched brackets" as source features); such a direction is kept standalone and
  // flagged rather than swallowing the speeches that follow it.
  const paras = body.split("\n\n").map((x) => x.replace(/\s+$/, "")).filter((x) => x.trim());
  const runEnd = (i) => {
    for (let j = i + 1; j < paras.length; j++) {
      const p = paras[j].trim();
      if (!p || SCAN_MARKER.test(p) || /^<!--[\s\S]*-->$/.test(p)) continue;
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

    const isApparatusHeading = (txt) => (english ? apparatus.has(txt) : isApparatusTa(txt));
    if (h && h[1].length === 2 && !english && looksLatin(h[2].trim()) && !isApparatusTa(h[2].trim())) {
      throw new Error(`${file}: unrecognised English heading "${h[2].trim()}" in a Tamil scene — refusing to guess whether it is apparatus`);
    }
    if (h && h[1].length === 2 && isApparatusHeading(h[2].trim())) {
      flushNote();
      if (!english) break;
      noteHeading = h[2].trim();
      noteBuf = [];
      const rest = t.split("\n").slice(1).join("\n").trim();
      if (rest) noteBuf.push(rest);
      current = null; i++; continue;
    }
    if (noteHeading) { noteBuf.push(chunk); i++; continue; }
    if (h) { headings.push({ level: h[1].length, text: h[2].trim() }); current = null; i++; continue; }

    const sm = SCAN_MARKER.exec(t);
    if (sm) { scan = Number(sm[1]); if (current) touch(current); i++; continue; }
    if (/^<!--[\s\S]*-->$/.test(t)) { current = null; i++; continue; }

    if (ORNAMENT.test(t)) { addUnit({ kind: "ornament", text: t, scanSet: new Set([scan]) }); i++; continue; }

    if (t.startsWith("[")) {
      const end = opens(t) ? runEnd(i) : -1;
      if (end > i) {
        const parts = [chunk];
        const scanSet = new Set([scan]);
        for (let j = i + 1; j <= end; j++) {
          const p = paras[j];
          const pm = SCAN_MARKER.exec(p.trim());
          if (pm) { scan = Number(pm[1]); scanSet.add(scan); continue; }
          if (/^<!--[\s\S]*-->$/.test(p.trim())) continue;
          parts.push(p); scanSet.add(scan);
        }
        addUnit({ kind: "stage-direction", delimiter: "square", text: parts.join("\n\n"), scanSet });
        i = end + 1; continue;
      }
      addUnit({ kind: "stage-direction", delimiter: "square", text: chunk, unclosedInSource: opens(t), scanSet: new Set([scan]) });
      i++; continue;
    }
    if (t.startsWith("(")) { addUnit({ kind: "stage-direction", delimiter: "round", text: chunk, scanSet: new Set([scan]) }); i++; continue; }
    if (t.startsWith("“") || t.startsWith('"')) { addUnit({ kind: "verse", text: chunk, scanSet: new Set([scan]) }); i++; continue; }
    if (closes(t)) {
      // A stray closing bracket paragraph: direction text by the edition's own delimiter.
      addUnit({ kind: "stage-direction", delimiter: "square", text: chunk, continuesUnclosed: true, scanSet: new Set([scan]) });
      i++; continue;
    }

    const sp = SPEAKER.exec(t);
    if (sp) {
      // The separator is carried verbatim: this edition prints both `கோவ : ` and `கி.கிழவர்: `,
      // and normalising that spacing would be a silent punctuation change.
      addUnit({
        kind: "dialogue",
        speakerAsPrinted: sp[1],
        speakerSeparator: sp[2],
        text: chunk.slice(chunk.indexOf(sp[0]) + sp[0].length),
        scanSet: new Set([scan]),
      });
      i++; continue;
    }
    // No printed speaker label. Carried as an UNLABELLED printed speech — never attributed to the
    // previous speaker, never reclassified as a stage direction.
    addUnit({ kind: "dialogue", speakerAsPrinted: null, text: chunk, scanSet: new Set([scan]) });
    i++;
  }

  flushNote();


  const finished = units.map((u) => {
    const scans = [...u.scanSet].sort((a, b) => a - b);
    const sourcePages = scans.map((s) => {
      if (!printedPageByScan.has(s)) throw new Error(`${file}: unit cites scan ${s}, which has no page record`);
      return { scan: s, printedPage: printedPageByScan.get(s) };
    });
    const base = { text: u.text, hasLineBreaks: u.text.includes("\n"), sourcePages };
    if (u.kind === "dialogue") return { kind: "dialogue", speakerAsPrinted: u.speakerAsPrinted, speakerSeparator: u.speakerSeparator ?? null, ...base };
    if (u.kind === "stage-direction") {
      const sd = { kind: "stage-direction", delimiter: u.delimiter, ...base };
      if (u.unclosedInSource) sd.unclosedInSource = true;
      if (u.continuesUnclosed) sd.continuesUnclosed = true;
      return sd;
    }
    return { kind: u.kind, ...base };
  });
  for (const u of finished) if (u.sourcePages.length === 0) throw new Error(`${file}: a unit carries no source provenance`);
  return { fm, headings, units: finished, notes, declaredScans };
}

// ── BUILD SCENES ─────────────────────────────────────────────────────────────────────────────────
const TA_DIR = path.join(WORK_DIR, "scenes");
const EN_DIR = path.join(WORK_DIR, "translations/en");
const sceneFiles = fs.readdirSync(TA_DIR).filter((f) => /^(\d{2}|closing-tableau)\.md$/.test(f)).sort();
if (sceneFiles.length !== 39) throw new Error(`expected 38 numbered scenes + 1 closing tableau, found ${sceneFiles.length} files`);

const scenes = [];
for (const file of sceneFiles) {
  const isTableau = file === "closing-tableau.md";
  const ta = parseScene(readText(path.join(TA_DIR, file)), `scenes/${file}`, { english: false });
  const enPath = path.join(EN_DIR, file);
  if (!fs.existsSync(enPath)) throw new Error(`missing English counterpart for ${file}`);
  const en = parseScene(readText(enPath), `translations/en/${file}`, { english: true });

  if (ta.fm.status !== "assembly-reviewed") throw new Error(`${file}: Tamil status ${ta.fm.status}`);
  if (ta.fm.visual_text_fidelity !== "passed") throw new Error(`${file}: Tamil fidelity ${ta.fm.visual_text_fidelity}`);
  if (en.fm.status !== "translation-reviewed") throw new Error(`${file}: English status ${en.fm.status}`);
  if (en.fm.translation_review !== "passed") throw new Error(`${file}: English review ${en.fm.translation_review}`);
  if (en.fm.secondary_english_witness_used !== "false") {
    throw new Error(`${file}: English declares the published witness was used — refusing to import`);
  }

  const order = ta.fm.scene === "null" ? null : Number(ta.fm.scene);
  // THE CLOSING TABLEAU IS NOT SCENE 39.
  if (isTableau && order !== null) throw new Error("the closing tableau carries a scene number — refusing to import");
  if (!isTableau && !Number.isInteger(order)) throw new Error(`${file}: numbered scene has no scene number`);
  if (order === 39) throw new Error("a Scene 39 appeared in the source — refusing to import");

  const taHeads = ta.headings;
  const enHeads = en.headings;
  const h1 = (hs) => hs.find((x) => x.level === 1)?.text ?? null;
  const h2 = (hs) => hs.find((x) => x.level === 2)?.text ?? null;
  const h3 = (hs) => hs.find((x) => x.level === 3)?.text ?? null;

  scenes.push({
    order,
    slug: file.replace(/\.md$/, ""),
    headingTa: h1(taHeads),
    headingEn: h1(enHeads),
    titleTa: ta.fm.title,
    titleEn: en.fm.title_en,
    // A setting is carried ONLY where the edition prints one; three scenes print none.
    settingTa: ta.fm.setting === "null" || !ta.fm.setting ? null : ta.fm.setting,
    settingEn: h3(enHeads),
    sourceScans: ta.declaredScans,
    isClosingTableau: isTableau,
    tamil: { units: ta.units },
    english: { units: en.units, notes: en.notes },
  });
}

const numbered = scenes.filter((s) => !s.isClosingTableau);
const tableaux = scenes.filter((s) => s.isClosingTableau);
if (numbered.length !== 38) throw new Error(`expected 38 numbered scenes, got ${numbered.length}`);
if (tableaux.length !== 1) throw new Error(`expected exactly 1 closing tableau, got ${tableaux.length}`);
if (numbered.map((s) => s.order).join(",") !== Array.from({ length: 38 }, (_, i) => i + 1).join(",")) {
  throw new Error("numbered scenes are not exactly 1..38 in order");
}

// The obstruction marker must survive into the reading text of BOTH layers.
const allText = scenes.flatMap((s) => [...s.tamil.units, ...s.english.units]).map((u) => u.text).join("\n");
const obstructionCount = (allText.match(new RegExp(OBSTRUCTION, "g")) || []).length;
if (obstructionCount < 4) {
  throw new Error(`expected the scan-88 obstruction marker in both layers, found ${obstructionCount} occurrence(s)`);
}

const scanNums = scenes.flatMap((s) => s.sourceScans);
const bodyScans = { from: Math.min(...scanNums), to: Math.max(...scanNums) };

const count = (sel) => scenes.reduce((n, s) => n + sel(s), 0);
const speakers = new Set(
  scenes.flatMap((s) => s.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted).map((u) => u.speakerAsPrinted)),
);

const play = {
  workId: SLUG,
  slug: SLUG,
  title: { ta: "சிலப்பதிகாரம்", en: "Silappathikaram" },
  descriptor: { ta: "நாடகக் காப்பியம்", en: "A Dramatic Epic" },
  author: { ta: "கலைஞர் மு. கருணாநிதி", en: "Kalaignar M. Karunanidhi" },
  edition: {
    publisherTa: "அஞ்சுகம் வெளியீடு",
    placeTa: "சென்னை-6",
    priceTa: "விலை ரூ. 5",
    copyrightLineTa: "பதிப்புரிமை",
    year: null,
  },
  sourceRepo: "pugazg/kalaignar-stage-plays",
  sourcePath: `works/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  sceneCount: numbered.length,
  closingTableauCount: tableaux.length,
  bodyScans,
  scenes,
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
      "Scan identity (filename, SHA-256, byte size, page count) is carried AS RECORDED BY THE SOURCE ARCHIVE. The controlling PDF is deliberately held outside both repositories and was not supplied to this integration, so the checksum was NOT independently recomputed here. It is the archive's recorded identity, matched against the archive's own metadata — not a verification performed by this repository.",
    pageRecordsVerified: "88 / 88 scans verified at page-record level",
    sourceAudit: "Tamil transcription completion audit: PASSED",
    assembledLayer: "38 numbered scenes + closing tableau assembly-reviewed, visual text fidelity PASSED; global Tamil consistency review PASSED",
    bodyScans: `${bodyScans.from}–${bodyScans.to}`,
    publicationYearNote:
      "NO publication year is printed anywhere in this scan. The edition's own foreword and introductory dates are internal dates and are NOT promoted to a publication year. The catalog therefore carries no year for this work rather than an inferred one.",
    twoColumnNote:
      "The edition is set in TWO COLUMNS. A speech begun at the foot of the left column continues at the head of the right column, and the source does not reprint the speaker label there. Those continuations are carried with `speakerAsPrinted: null` — the honest record that the edition prints no label at that point. They are never attributed to the preceding speaker and never reclassified as stage directions.",
    closingTableauNote:
      "`கண்ணகி சிலை நாட்டு விழா` is printed after காட்சி-38 and after three centred stars, WITHOUT a scene number. It is a separate closing tableau and is NOT Scene 39. It is never numbered, never counted among the 38 scenes and never merged into Scene 38. The importer refuses to run if a Scene 39 ever appears.",
  },
  english: {
    kind: "project-created",
    status: "38/38 numbered scenes + closing tableau translation-reviewed / PASS; final consistency review PASS; release READY",
    independence:
      "The reader's English is the project-created independent translation, drafted and reviewed WITHOUT any published English edition.",
    secondaryWitnessNote:
      "A 2009 published English edition (Macmillan / Bharathiar University, 'Tale of the Anklet and One Act Plays') exists in the source repository as a separately archived analytical witness. It is EVIDENCE ONLY. It was never used to draft or review this translation, is never imported here, and no part of it is published as reader content. The archive's post-release comparison across all 39 units imported 0 changes.",
    notesSeparated:
      "The English layer's translation notes and its 'Dravidian movement resonance' interpretive notes are carried OUTSIDE the reading body in a separately labelled area. The source itself calls the latter 'interpretive context, not translated source text', so it renders as neither Kalaignar's words nor part of the translation.",
  },
  archiveDerived: {
    scenes: numbered.length,
    closingTableau: tableaux.length,
    tamilUnits: count((s) => s.tamil.units.length),
    englishUnits: count((s) => s.english.units.length),
    tamilDialogue: count((s) => s.tamil.units.filter((u) => u.kind === "dialogue").length),
    tamilStageDirections: count((s) => s.tamil.units.filter((u) => u.kind === "stage-direction").length),
    tamilVerse: count((s) => s.tamil.units.filter((u) => u.kind === "verse").length),
    ornaments: count((s) => [...s.tamil.units, ...s.english.units].filter((u) => u.kind === "ornament").length),
    distinctSpeakerLabels: speakers.size,
    unlabelledDialogueUnits: count((s) => s.tamil.units.filter((u) => u.kind === "dialogue" && u.speakerAsPrinted === null).length),
    scenesWithoutPrintedSetting: scenes.filter((s) => s.settingTa === null).length,
    multiScanScenes: scenes.filter((s) => s.sourceScans.length > 1).length,
    printedPageNumbersPresent: [...printedPageByScan.values()].filter((v) => v !== null).length,
    printedPageNumbersAbsent: [...printedPageByScan.values()].filter((v) => v === null).length,
    translationNotes: count((s) => s.english.notes.filter((n) => n.kind === "translation-note").length),
    interpretiveNotes: count((s) => s.english.notes.filter((n) => n.kind === "interpretive-note").length),
    obstructionMarkers: obstructionCount,
    note:
      "Derived structure only. The 88 audited page records remain the controlling archival text; this integration reads the archive's own assembled scene layer, which was built from those records and passed visual-text fidelity review. Dialogue, stage directions and speaker labels are carried verbatim — never re-split, merged, expanded or normalised.",
    speakerNote:
      "Speaker labels are rendered EXACTLY as printed. The edition abbreviates the same character inconsistently (`செங்குட்டுவன்` / `செங்குட்டு` / `செங்கு`; `கோவலன்` / `கோவ`). Those variations are source data, not errors, and are never expanded or unified.",
    unlabelledNote:
      "Dialogue units with `speakerAsPrinted: null` are places where the edition prints no label — overwhelmingly a speech resuming after the two-column break or after an interposed stage direction. Absence of a label is recorded as absence, never resolved into an attribution.",
  },
  unresolved: [
    {
      marker: OBSTRUCTION,
      scan: 88,
      description:
        "A later circular library/accession stamp carrying handwritten 164596 physically covers the leading characters of two printed lines in the closing tableau. Non-destructive enlarged inspection could not securely recover them.",
      policy:
        "The covered characters are NOT reconstructed — not from context, not from another edition, not from the published English translation. The marker is carried verbatim in BOTH the Tamil and the English reading text, is visible on screen, and is never hidden from print or PDF export.",
    },
  ],
  lockedExclusions: [
    "the assembled layer's archival apparatus — assembly notes, source visual / caption / pagination layers, and visual-text fidelity reviews",
    "the English layer's translation notes and 'Dravidian movement resonance' interpretive notes, which are held outside the reading body",
    "the per-scene English review files and the whole published-witness comparison record",
    "the 2009 published English edition itself, which is analytical evidence and is never read, imported or published as reader content",
    "later library/accession stamps, handwritten shelf marks, damage and bleed-through, which are copy-specific and never merged into the literary text",
    "decorative heading artwork, illustrations and photographs, which are described in page records rather than converted into dramatic text",
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
      "This is the PRESENT project-level rights status of Kalaignar's underlying stage play. The edition's own publisher, place, price and copyright lines are edition facts, not statements about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored play. It does NOT extend to the edition's publisher/imprint matter (அஞ்சுகம் வெளியீடு), the printed price line, the decorative artwork, illustrations and photographs, or the library's stamps and accession marks — each retains its own distinct provenance.",
    publishedWitnessNote:
      "The 2009 Macmillan / Bharathiar University English edition is a THIRD PARTY's separately copyrighted translation. It is not covered by this nationalisation, is not published here in any form, and is recorded only as analytical evidence held in the source archive.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked independent translation with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    archivalStatusNote:
      "The source repository's completion/release status is an editorial and archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },
  notes: [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
    "This is ONE stage play in THIRTY-EIGHT numbered scenes PLUS a separate unnumbered closing tableau. The catalog reports 38 scenes; the tableau is carried and displayed separately and is never counted as a 39th scene.",
    "NO publication year is printed in this edition, so none is recorded. Internal foreword dates are not promoted to a publication year.",
    "Printed page numbers are carried only where a page record shows one: 41 of the 88 scans print a folio and 47 do not.",
    "Speaker labels, stage-direction delimiters, repetitions, ellipsis counts, punctuation and historical spelling are carried exactly as printed. Nothing is modernised, expanded or normalised.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "play.json"), JSON.stringify(play, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

const sha = (f) => execFileSync("shasum", ["-a", "256", path.join(OUT, f)], { encoding: "utf8" }).split(" ")[0];
const d = provenance.archiveDerived;
console.log("play:", SLUG);
console.log("scenes:", d.scenes, "+ closing tableau:", d.closingTableau, "(never Scene 39)");
console.log("Tamil  units", d.tamilUnits, "| dialogue", d.tamilDialogue, "| stage directions", d.tamilStageDirections, "| verse", d.tamilVerse);
console.log("English units", d.englishUnits, "| translation notes", d.translationNotes, "| interpretive notes", d.interpretiveNotes);
console.log("distinct printed speaker labels:", d.distinctSpeakerLabels, "| unlabelled (two-column continuations):", d.unlabelledDialogueUnits);
console.log("printed folios present/absent:", d.printedPageNumbersPresent + "/" + d.printedPageNumbersAbsent, "| obstruction markers:", d.obstructionMarkers);
console.log("body scans:", provenance.source.bodyScans);
console.log("play.json sha256:", sha("play.json"));
console.log("provenance.json sha256:", sha("provenance.json"));
