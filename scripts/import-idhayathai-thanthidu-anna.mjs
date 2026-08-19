// Deterministic, work-specific importer for இதயத்தைத் தந்திடு அண்ணா / "Lend Me Your Heart, Anna"
// (Digital Library Phase 4 — Poetry; first benchmark). A கண்ணீர்க் கவிதாஞ்சலி offered by Kalaignar
// M. Karunanidhi to Perarignar Anna on Chennai Radio on 9.2.1969.
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-poems
// (poems/idhayathai-thanthidu-anna) at a pinned commit, and vendors static bilingual reader data
// into this website under public/data/poems/idhayathai-thanthidu-anna/. Runtime never calls GitHub.
// The source PDF is never read and never vendored (its identity travels as filename + SHA-256 +
// size + scan map only). The source clone is never modified.
//
// Usage: node scripts/import-idhayathai-thanthidu-anna.mjs <path-to-kalaignar-poems-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-idhayathai-thanthidu-anna.mjs <kalaignar-poems-clone> <source-commit>");
  process.exit(1);
}

// Fail closed BEFORE anything is written: the source clone's actual git HEAD must equal the supplied
// <source-commit>, so a SHA that does not match the checked-out tree can never be recorded.
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

const SLUG = "idhayathai-thanthidu-anna";
const WORK_DIR = path.join(SRC_REPO, "poems", SLUG);
const OUT = path.join(process.cwd(), "public/data/poems", SLUG);

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");

// ── Source identity, asserted against the source repository's own metadata record ────────────────
const SCAN_FILENAME = "TVA_BOK_0064132_இதயத்தைத்_தந்திடு_அண்ணா.pdf";
const SCAN_SHA256 = "152cfb251a2049662102a2296487220f6f227f243657c9456df34105520676fe";
const SCAN_SIZE = 26816066;
const SCAN_PAGES = 28;
const POEM_SCANS = Array.from({ length: 14 }, (_, i) => 13 + i); // 13 … 26

const sourceMeta = readText(path.join(WORK_DIR, "metadata/source.md"));
for (const [label, needle] of [
  ["scan filename", SCAN_FILENAME],
  ["scan SHA-256", SCAN_SHA256],
  ["scan size", "26,816,066"],
]) {
  if (!sourceMeta.includes(needle)) {
    throw new Error(`source identity mismatch: metadata/source.md does not record the expected ${label} (${needle})`);
  }
}

// Scan → VISIBLE printed page. Scan 26 shows no printed number and is NOT silently labelled 24.
const PRINTED_PAGE = new Map(POEM_SCANS.map((s) => [s, s <= 25 ? s - 2 : null]));

// ── Tamil: the reviewed source assembly ──────────────────────────────────────────────────────────
// sections/<slug>.md holds one fenced ```text block per poem scan, each preceded by a hidden
// `<!-- scan N / … -->` provenance comment. Inside a block, a blank line is a released stanza break.
//
// PAGE BOUNDARY ≠ STANZA BOUNDARY. The block/fence boundary is provenance only. ASSEMBLY_REVIEW.md
// states the assembly "does not editorially fuse lines across those boundaries" AND that it retains
// the page records' own stanza breaks — and no block begins or ends with a blank line, which is
// asserted below. So the released Tamil establishes that NONE of the 13 physical page transitions
// is a stanza break: the stanza simply continues onto the next scan.
function parseTamil() {
  const src = readText(path.join(WORK_DIR, "sections", `${SLUG}.md`));
  const re = /<!-- scan (\d+) \/ ([^>]*?) -->\n```text\n([\s\S]*?)\n```/g;
  const blocks = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const scan = Number(m[1]);
    const label = m[2].trim();
    const printedMatch = /^printed page (\d+)$/.exec(label);
    const printed = printedMatch ? Number(printedMatch[1]) : null;
    if (printed !== PRINTED_PAGE.get(scan)) {
      throw new Error(`scan ${scan}: assembly marker printed page ${printed} disagrees with the page map ${PRINTED_PAGE.get(scan)}`);
    }
    blocks.push({ scan, printed, lines: m[3].split("\n") });
  }
  if (blocks.length !== POEM_SCANS.length) {
    throw new Error(`expected ${POEM_SCANS.length} Tamil poem blocks, found ${blocks.length}`);
  }
  blocks.forEach((b, i) => {
    if (b.scan !== POEM_SCANS[i]) throw new Error(`Tamil block ${i} is scan ${b.scan}, expected ${POEM_SCANS[i]}`);
    // The fence boundary must carry no stanza information of its own.
    if (b.lines[0].trim() === "" || b.lines[b.lines.length - 1].trim() === "") {
      throw new Error(`scan ${b.scan}: assembly block starts/ends with a blank line — page-edge stanza evidence must be handled explicitly, not assumed`);
    }
  });

  // Fold the 14 blocks into ONE continuous line stream; only in-block blank lines break a stanza.
  const stanzas = [];
  let cur = [];
  for (const b of blocks) {
    for (const raw of b.lines) {
      if (raw.trim() === "") {
        if (cur.length) stanzas.push(cur);
        cur = [];
        continue;
      }
      cur.push(line(raw, b.scan, b.printed));
    }
  }
  if (cur.length) stanzas.push(cur);
  return stanzas.map(toStanza);
}

// ── English: the RELEASE-COMPLETE translation ────────────────────────────────────────────────────
// The released assembly (translations/en/<slug>-en.md) is the release artifact, but it carries only
// BATCH-level hidden markers. The reviewed batch files carry SCAN-level markers over byte-identical
// verse, so per-line scan provenance IS established by the release artifacts — it is read from the
// batches and then proved equal to the released assembly, line for line, below.
//
// THE STANZA TRAP (this is the subtle part). In every release artifact a hidden marker is written
// with one blank line on each side — a uniform formatting convention, so a marker position carries
// NO stanza information. Two consequences:
//
//   * in the batch files, a scan marker absorbs the blank lines around it;
//   * in the assembly, the scan markers were removed during assembly, leaving their padding blanks
//     behind — which is why the assembly shows a blank line at all 9 intra-batch scan transitions
//     and at none of the 4 batch transitions.
//
// Those 9 blanks are marker-removal ARTIFACTS, not released stanza structure. The evidence:
//   * the released Tamil (which separates markers from verse with fences and is therefore
//     unambiguous) has NO stanza break at any of the 13 page transitions;
//   * EDITORIAL_CONSISTENCY_REVIEW.md §11 records that "only hidden comments preserve provenance"
//     and that no batch-boundary structure appears in the visible poem;
//   * the English text itself splits mid-sentence at those points — printed p.20 ends
//     `"To make Tamil hearts, all Tamil life,` and p.21 opens `gold," she said.`;
//   * RELEASE_REPORT.md / SOURCE_MAP.md certify scan 13→14, 14→15, 17→18, 18→19, 22→23, 23→24 and
//     24→25 as continuations, including the 23→24 crossing of the Batch 04 → Batch 05 boundary.
//
// So a blank RUN that contains a marker is a continuation; a blank run with no marker is a released
// stanza break. Nothing here derives structure from punctuation or from a physical page number.
const BATCHES = [
  { n: 1, scans: [13, 14, 15] },
  { n: 2, scans: [16, 17, 18, 19] },
  { n: 3, scans: [20, 21] },
  { n: 4, scans: [22, 23] },
  { n: 5, scans: [24, 25, 26] },
];

const COMMENT = /^<!--[\s\S]*-->$/;

function tokenize(text, onMarker) {
  const toks = [];
  for (const raw of text.split("\n")) {
    const t = raw.trim();
    if (COMMENT.test(t)) toks.push({ kind: "marker", value: onMarker(t) });
    else if (t === "") toks.push({ kind: "blank" });
    else toks.push({ kind: "line", value: raw });
  }
  return toks;
}

// Collapse each maximal non-line run into a single event: "cont" if it contained a marker,
// otherwise "gap" (a released stanza break). Leading/trailing runs are dropped.
function collapse(toks) {
  const out = [];
  let i = 0;
  while (i < toks.length) {
    if (toks[i].kind === "line") {
      out.push(toks[i]);
      i++;
      continue;
    }
    let hasMarker = false;
    let marker = null;
    while (i < toks.length && toks[i].kind !== "line") {
      if (toks[i].kind === "marker") {
        hasMarker = true;
        marker = toks[i].value;
      }
      i++;
    }
    out.push({ kind: hasMarker ? "cont" : "gap", value: marker });
  }
  // Trim only leading/trailing "gap" runs. A leading/trailing "cont" is kept because it carries
  // the scan marker that tags the verse which follows it.
  while (out.length && out[0].kind === "gap") out.shift();
  while (out.length && out[out.length - 1].kind === "gap") out.pop();
  return out;
}

function parseEnglish() {
  // 1. batch files → scan-tagged events
  const events = [];
  for (const b of BATCHES) {
    const src = readText(path.join(WORK_DIR, "translations/en/batches", `batch-0${b.n}.md`));
    const start = src.indexOf("## English translation");
    const end = src.indexOf("## Translator's notes");
    if (start < 0 || end < 0 || end <= start) throw new Error(`batch-0${b.n}.md: cannot locate the released verse section`);
    // Only the '## English translation' section is ever read — translator notes, source-fidelity
    // checklists and voice reviews are support layers and never enter the poem.
    const section = src.slice(start + "## English translation".length, end);
    const seen = [];
    const collapsed = collapse(
      tokenize(section, (t) => {
        const mm = /scan (\d+)/.exec(t);
        if (!mm) throw new Error(`batch-0${b.n}.md: unrecognised hidden marker ${t}`);
        return Number(mm[1]);
      }),
    );
    let scan = null;
    for (const ev of collapsed) {
      if (ev.kind === "cont" && ev.value != null) {
        scan = ev.value;
        seen.push(scan);
      }
      if (ev.kind === "line" && scan == null) throw new Error(`batch-0${b.n}.md: verse appears before any scan marker`);
      events.push({ ...ev, scan, batch: b.n });
    }
    // Each batch must cover exactly the scans the source map assigns it, in order, once each.
    if (JSON.stringify(seen) !== JSON.stringify(b.scans)) {
      throw new Error(`batch-0${b.n}.md: scan markers ${JSON.stringify(seen)} disagree with the source map ${JSON.stringify(b.scans)}`);
    }
    // A batch boundary is itself a marker position → a continuation, never a stanza break.
    events.push({ kind: "cont", value: null, scan, batch: b.n });
  }
  while (events.length && events[events.length - 1].kind !== "line") events.pop();

  // 2. prove the batch-derived line stream IS the released assembly, line for line
  const asmSrc = readText(path.join(WORK_DIR, "translations/en", `${SLUG}-en.md`));
  const asmStart = asmSrc.indexOf("<!-- batch 01");
  if (asmStart < 0) throw new Error("released English assembly: cannot locate the first batch marker");
  const asmLines = collapse(tokenize(asmSrc.slice(asmStart), (t) => t))
    .filter((e) => e.kind === "line")
    .map((e) => e.value);
  const batchLines = events.filter((e) => e.kind === "line").map((e) => e.value);
  if (asmLines.length !== batchLines.length) {
    throw new Error(`released English assembly has ${asmLines.length} verse lines but the reviewed batches have ${batchLines.length}`);
  }
  for (let i = 0; i < asmLines.length; i++) {
    if (asmLines[i] !== batchLines[i]) {
      throw new Error(`released English assembly diverges from the reviewed batches at line ${i + 1}:\n  assembly: ${asmLines[i]}\n  batches:  ${batchLines[i]}`);
    }
  }

  // 3. events → stanzas ("gap" breaks; "cont" continues)
  const stanzas = [];
  let cur = [];
  for (const ev of events) {
    if (ev.kind === "gap") {
      if (cur.length) stanzas.push(cur);
      cur = [];
      continue;
    }
    if (ev.kind === "line") cur.push(line(ev.value, ev.scan, PRINTED_PAGE.get(ev.scan) ?? null));
  }
  if (cur.length) stanzas.push(cur);
  return stanzas.map(toStanza);
}

// ── Shared line/stanza construction ──────────────────────────────────────────────────────────────
// A source line stays ONE logical line. Leading indentation is carried as a source fact (`indent`)
// rather than baked into the text, so the reader can preserve it without forcing <pre> styling and
// a long line can still wrap visually on a narrow viewport without becoming a new poetic line.
function line(raw, scan, printed) {
  const text = raw.replace(/\s+$/, "");
  const indent = text.length - text.trimStart().length;
  if (indent % 4 !== 0) throw new Error(`unexpected indentation width ${indent} on scan ${scan}: ${JSON.stringify(raw)}`);
  return { text: text.slice(indent), indent, sourceScan: scan, printedPage: printed };
}

function toStanza(lines) {
  const scans = [];
  for (const l of lines) if (scans[scans.length - 1] !== l.sourceScan) scans.push(l.sourceScan);
  return { lines, sourceScans: scans };
}

// ── Exclusions (LOCKED) ──────────────────────────────────────────────────────────────────────────
// Non-verse matter that must never enter the poem body. Each phrase is checked against the
// generated verse below; the importer fails closed rather than shipping contaminated verse.
const EXCLUDED_PHRASES = [
  "9.2.1969", // scan 13 source/context note (metadata, not verse)
  "சென்னை வானொலியில்",
  "கண்ணீர்க் கவிதாஞ்சலி",
  "அச்சிட்டோர்", // scan 26 printer imprint
  "வைகை பிரிண்டர்ஸ்",
  "சைதாப்பேட்டை",
  "உலகத்தமிழ் செம்மொழி", // scan 27 poster back matter
  "பிறப்பொக்கும் எல்லா உயிர்க்கும்",
  "வாழிய வாழியவே",
  "குறிஞ்சி சுப்பிரமணியன்", // publisher/donor matter
  "என்னுரை", // foreword
  "15.9.2008", // foreword date — never a publication year
  "Translator's notes",
  "Source-fidelity review",
  "Kalaignar-voice review",
  "Batch judgement",
  "reviewed",
  "assembly",
];

function assertNoExcluded(layerName, stanzas) {
  const body = stanzas.flatMap((s) => s.lines.map((l) => l.text)).join("\n");
  for (const phrase of EXCLUDED_PHRASES) {
    if (body.includes(phrase)) {
      throw new Error(`${layerName} verse contains locked-excluded non-verse material: ${JSON.stringify(phrase)}`);
    }
  }
}

// ── Build ────────────────────────────────────────────────────────────────────────────────────────
const taStanzas = parseTamil();
const enStanzas = parseEnglish();
assertNoExcluded("Tamil", taStanzas);
assertNoExcluded("English", enStanzas);

const layer = (stanzas) => ({ stanzas, lineCount: stanzas.reduce((n, s) => n + s.lines.length, 0) });
const ta = layer(taStanzas);
const en = layer(enStanzas);

// Every poem scan must be represented in both layers, exactly the 14 poem scans and nothing else.
for (const [name, l] of [["Tamil", ta], ["English", en]]) {
  const scans = [...new Set(l.stanzas.flatMap((s) => s.sourceScans))].sort((a, b) => a - b);
  if (JSON.stringify(scans) !== JSON.stringify(POEM_SCANS)) {
    throw new Error(`${name} layer covers scans ${JSON.stringify(scans)}, expected ${JSON.stringify(POEM_SCANS)}`);
  }
}

// Page-transition audit — proved from the generated structure, not asserted.
function transitionAudit(l) {
  const inside = [];
  for (const s of l.stanzas) {
    for (let i = 1; i < s.lines.length; i++) {
      const a = s.lines[i - 1].sourceScan;
      const b = s.lines[i].sourceScan;
      if (a !== b) inside.push(`${a}->${b}`);
    }
  }
  return inside;
}
const taInside = transitionAudit(ta);
const enInside = transitionAudit(en);
const ALL_TRANSITIONS = POEM_SCANS.slice(0, -1).map((s) => `${s}->${s + 1}`);
for (const [name, inside] of [["Tamil", taInside], ["English", enInside]]) {
  if (JSON.stringify(inside) !== JSON.stringify(ALL_TRANSITIONS)) {
    throw new Error(
      `${name}: page-transition audit failed — expected all ${ALL_TRANSITIONS.length} physical page transitions to fall INSIDE a stanza, got ${JSON.stringify(inside)}`,
    );
  }
}

const CONTEXT_NOTE_TA =
  "(9.2.1969 அன்று சென்னை வானொலியில் பேரறிஞர் அண்ணா\nஅவர்களுக்குக் கலைஞர் மு. கருணாநிதி அவர்கள் அளித்த\nகண்ணீர்க் கவிதாஞ்சலி)";

// The verbatim note must actually be the one the source assembly prints above the poem.
{
  const asm = readText(path.join(WORK_DIR, "sections", `${SLUG}.md`));
  for (const frag of CONTEXT_NOTE_TA.split("\n")) {
    if (!asm.includes(frag.replace(/^\(|\)$/g, ""))) {
      throw new Error(`source context note fragment not found verbatim in the source assembly: ${JSON.stringify(frag)}`);
    }
  }
}

const poem = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-poems",
  sourcePath: `poems/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  shelf: "poetry",
  readerStructure: "poem",
  subtype: "poem",
  title: { ta: "இதயத்தைத் தந்திடு அண்ணா", en: "Lend Me Your Heart, Anna" },
  author: { nameTa: "மு. கருணாநிதி", nameEn: "M. Karunanidhi" },
  sourceContext: {
    noteTa: CONTEXT_NOTE_TA,
    // NOT a released translation — the source repository releases no English rendering of the note.
    // This is a project description of the facts the printed note establishes, labelled as such in
    // the reader so it is never mistaken for released English verse.
    noteEn:
      "The note printed above the poem records that on 9.2.1969, on Chennai Radio, Kalaignar M. Karunanidhi offered this கண்ணீர்க் கவிதாஞ்சலி — a tearful poetic tribute — to Perarignar Anna.",
    dateIso: "1969-02-09",
    datePrinted: "9.2.1969",
    venue: { ta: "சென்னை வானொலி", en: "Chennai Radio" },
    occasion: { ta: "பேரறிஞர் அண்ணாவுக்கான கண்ணீர்க் கவிதாஞ்சலி", en: "A poetic tribute to Perarignar Anna" },
  },
  // The controlling scan establishes NO standalone publication-year or edition statement. These
  // stay null; the 15.9.2008 foreword date is never promoted into them.
  publicationYear: null,
  editionStatement: null,
  factsNotStated: ["publication-year", "edition-statement", "printed-page-number-on-scan-26"],
  transcriptionStatus: "verified source assembly — PASS, 0 discrepancies (28/28 physical scans, 14/14 poem scans)",
  translationStatus: "RELEASE-COMPLETE project-created translation — batches 01–05 reviewed PASS, full-poem voice/fidelity review PASS",
  tamil: ta,
  english: en,
  poemScans: POEM_SCANS,
};

const provenance = {
  workId: SLUG,
  sourceRepo: poem.sourceRepo,
  sourcePath: poem.sourcePath,
  sourceCommit: SRC_COMMIT,
  source: {
    titleTa: poem.title.ta,
    titleEn: poem.title.en,
    authorTa: poem.author.nameTa,
    authorEn: poem.author.nameEn,
    scanFilename: SCAN_FILENAME,
    scanSha256: SCAN_SHA256,
    scanFileSizeBytes: SCAN_SIZE,
    scanTotalPages: SCAN_PAGES,
    physicalVerification: "28 / 28 verified",
    poemScanPages: "13–26",
    poemVerification: "14 / 14 verified",
    printedPageMapping: "printed pages 11–23 on scans 13–25",
    unnumberedScanNote: "Scan 26 carries no visible printed page number; it is NOT silently labelled 24 and no number is inferred.",
    sourcePdfCommitted: false,
    contextNoteTa: CONTEXT_NOTE_TA,
    contextDatePrinted: "9.2.1969",
    contextDateIso: "1969-02-09",
    contextVenueTa: "சென்னை வானொலி",
    contextVenueEn: "Chennai Radio",
    contextOccasionTa: "பேரறிஞர் அண்ணாவுக்கான கண்ணீர்க் கவிதாஞ்சலி",
    contextOccasionEn: "A poetic tribute to Perarignar Anna",
    publicationNotEstablished:
      "The supplied scan establishes NO standalone publication-year or edition statement, so publicationYear and editionStatement are null. The 9.2.1969 context is the poem's source-established offering date, NOT a publication date.",
    forewordDateNote:
      "The foreword (என்னுரை, scans 5–10) ends with சென்னை -20 and the date 15.9.2008. That is a foreword-internal date belonging to third-party front matter. It is NEVER presented as the publication year, the edition year, or a '2008 poem'.",
    lockedExclusions: [
      "scan 13 source/context note printed above the poem — metadata, never verse",
      "scan 26 printer imprint (அச்சிட்டோர் / வைகை பிரிண்டர்ஸ் & பப்ளிஷர்ஸ் / சைதாப்பேட்டை, சென்னை-15.)",
      "scans 27–28 back matter (World Classical Tamil Conference poster with its separate Kalaignar composition; back cover)",
      "scans 1–12 front matter: cover, publisher/donor advertisement, photographs, portrait, and the என்னுரை foreword",
      "translator notes, source-fidelity checklists, voice reviews and batch-judgement prose from the translation batches",
      "the Markdown explanatory prose surrounding both released assemblies",
    ],
  },
  verification: {
    tamilAssembly: "PASS — 14/14 page blocks, 0 missing, 0 duplicate",
    tamilDiscrepancies: 0,
    englishRelease: "RELEASE-COMPLETE",
    englishBatches: "01–05 reviewed PASS; 5/5 present exactly once; 14/14 poem scans represented",
    englishOmissions: 0,
    englishDuplications: 0,
    fullPoemVoiceReview: "PASS — full-poem Kalaignar-language/voice review",
  },
  archiveDerived: {
    tamilLines: ta.lineCount,
    tamilStanzas: ta.stanzas.length,
    tamilIndentedLines: ta.stanzas.flatMap((s) => s.lines).filter((l) => l.indent > 0).length,
    englishLines: en.lineCount,
    englishStanzas: en.stanzas.length,
    englishIndentedLines: en.stanzas.flatMap((s) => s.lines).filter((l) => l.indent > 0).length,
    pageTransitions: ALL_TRANSITIONS.length,
    pageTransitionsInsideStanza: taInside.length,
    tamilStanzasSpanningPages: ta.stanzas.filter((s) => s.sourceScans.length > 1).length,
    englishStanzasSpanningPages: en.stanzas.filter((s) => s.sourceScans.length > 1).length,
    englishBatchBoundaries: BATCHES.length - 1,
    englishBatchBoundariesInsideStanza: BATCHES.length - 1,
    boundaryNote:
      "A source page boundary is NOT a stanza boundary and a translation-batch boundary is NOT a stanza boundary. All 13 physical page transitions (13→14 … 25→26) fall INSIDE a stanza in BOTH layers, and all 4 batch boundaries fall inside an English stanza. Stanza structure is taken ONLY from blank lines in the released poem: in Tamil those are unambiguous because the hidden page markers sit outside the fenced verse blocks; in English the blank lines that surround a hidden marker are a uniform formatting convention (marker-removal artefacts in the assembled file) and carry no stanza information, which is why the batch files and the released assembly are reconciled line-for-line before stanzas are derived.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly block; English lines carry the scan marked in the reviewed batch files, whose verse is proved byte-identical to the released assembly. Printed page numbers are recorded only where the scan shows one (scans 13–25 → printed 11–23); scan 26 stays null. No provenance is manufactured beyond what the release artifacts establish, and the reader does not interrupt the verse with per-line page markers.",
    note: "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, stanza gaps, indentation, punctuation, quotation marks, ellipses and repetition are carried exactly as released.",
  },
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
      "This is the PRESENT project-level rights status of Kalaignar's underlying poem. The booklet's own publisher/donor matter is an edition fact, not a statement about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored poem. It does NOT extend to the third-party என்னுரை foreword, the photographs and their captions, the publisher/donor advertisement and back matter, the printer imprint, or the cover/design — each of which retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },
  notes: [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan map.",
    "The poem body is scans 13–26 (14 scans). Scans 1–12 (front matter, foreword, photographs) and scans 27–28 (poster, back cover) are outside the poem.",
    "The source context printed above the poem — 9.2.1969 / சென்னை வானொலி / a கண்ணீர்க் கவிதாஞ்சலி to பேரறிஞர் அண்ணா — is carried as METADATA. Not one word of it is inserted into the verse.",
    "The scan establishes no publication year and no edition statement, so both are null. The 15.9.2008 foreword date is foreword-internal third-party matter and is never surfaced as publication or edition metadata.",
    "Stanza structure comes from the released poem's own blank-line structure. All 13 physical page transitions and all 4 translation-batch boundaries fall inside a stanza in the generated data.",
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "poem.json"), JSON.stringify(poem, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("poem:", SLUG);
console.log("tamil:  lines", ta.lineCount, "| stanzas", ta.stanzas.length, "| indented", provenance.archiveDerived.tamilIndentedLines, "| stanzas spanning scans", provenance.archiveDerived.tamilStanzasSpanningPages);
console.log("english:lines", en.lineCount, "| stanzas", en.stanzas.length, "| indented", provenance.archiveDerived.englishIndentedLines, "| stanzas spanning scans", provenance.archiveDerived.englishStanzasSpanningPages);
console.log("page transitions:", ALL_TRANSITIONS.length, "| inside a stanza — tamil", taInside.length, "/ english", enInside.length);
console.log("batch boundaries:", BATCHES.length - 1, "| all continuations");
console.log("publicationYear / editionStatement:", poem.publicationYear, "/", poem.editionStatement);
console.log("poem.json sha256:", sha256(readText(path.join(OUT, "poem.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
