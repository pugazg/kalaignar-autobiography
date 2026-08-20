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
// ── CORRECTED AFTER INDEPENDENT REVIEW ───────────────────────────────────────────────────────────
// The first revision asserted that all 13 physical page transitions fall inside a stanza, on two
// grounds that do not survive scrutiny:
//
//   1. "no fenced Tamil block begins or ends with a blank line". The assembly stores each source
//      page as its own FENCED block, so a blank line CANNOT be expressed across a page edge there.
//      Absence of a blank at a fence edge is a property of the container, not a source statement.
//   2. "the source archive certifies continuations at 13→14, 22→23, 23→24 …". Those records are
//      TEXTUAL / RHETORICAL ("the final poetic line continues directly onto scan 14", "the final
//      open quotation continues onto scan 23"). A sentence, quotation or rhetorical movement can
//      run on across a printed stanza break. Textual continuity is not typographic evidence.
//
// This importer therefore classifies the two dimensions SEPARATELY, and takes each classification
// only from explicit statements in the pinned source repository. Where the source is silent about
// the printed stanza relation, the relation is `unknown` and stays unknown.
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

// ── CROSS-PAGE EVIDENCE AUDIT ────────────────────────────────────────────────────────────────────
// For each of the 13 physical page transitions, the pinned source repository is searched for
// EXPLICIT statements about (a) the printed/typographic stanza relation, and (b) the textual /
// rhetorical relation. Nothing is inferred from punctuation, sentence completion, semantics,
// indentation, "the text flows", the absence of a blank line at a fence edge, or any downstream
// inspection of a PDF.
//
// TYPOGRAPHIC vocabulary is deliberately narrow: a statement counts as stanza evidence only if it
// speaks about the printed stanza/verse-group relation ACROSS that page edge. Statements about
// stanza structure WITHIN a page (e.g. pages/0016.md's "the second stanza") are not cross-page
// evidence and are excluded by requiring the sentence to name the transition.
const STANZA_WORDS = /\b(stanza|verse group|verse-group|verse paragraph)\b|பத்தி/i;
// The TEXTUAL vocabulary follows the words the source archive itself uses for this dimension
// ("continues onto scan 14", "closes the quotation begun at the bottom of scan 22", "cadence
// preserved", "flows directly", "must remain continuous"). It is deliberately broader than the
// typographic vocabulary above because the archive documents this dimension richly — and it is
// never allowed to influence the stanza classification.
const CONTINUATION_WORDS =
  /continu|carries on|closes the quotation|completes the|runs on|cadence preserved|preserved as one|flows directly|does not reset|remain continuous|left grammatically\/rhetorically open/i;
const NON_CONTINUATION = /not textually|but not textually/i;

// Documents that could carry cross-page statements, read in full.
function auditDocuments() {
  const docs = [];
  const add = (rel) => docs.push({ rel, text: readText(path.join(WORK_DIR, rel)) });
  for (const s of POEM_SCANS) add(`pages/${String(s).padStart(4, "0")}.md`);
  add("ASSEMBLY_REVIEW.md");
  add("audit.md");
  add("README.md");
  add("metadata/source.md");
  add("indexes/page-map.md");
  add("SOURCE_COMPLETENESS_REVIEW.md");
  add("sections/" + SLUG + ".md");
  for (const n of [1, 2, 3, 4, 5]) add(`translations/en/batches/batch-0${n}.md`);
  for (const f of ["SOURCE_MAP.md", "EDITORIAL_CONSISTENCY_REVIEW.md", "RELEASE_REPORT.md", "README.md", "TRANSLATION_PLAN.md", `${SLUG}-en.md`])
    add(`translations/en/${f}`);
  return docs;
}

// A translation-batch boundary IS a physical page transition: the source map assigns each batch a
// contiguous scan range, so "Batch 02 → Batch 03" names the scan 19 → 20 edge. Statements written in
// batch terms are therefore matched too — but, like every other citation here, only ever for the
// TEXTUAL dimension. A batch boundary never becomes typographic stanza evidence.
const BATCH_EDGE = new Map(); // "from->to" -> [batchFrom, batchTo]

// Sentences/bullets in `text` that name the transition from→to.
function statementsNaming(text, from, to) {
  const be = BATCH_EDGE.get(`${from}->${to}`);
  const refs = [
    // "scan 13 → 14", "scan 13 -> 14", "Scan 13 → 14"
    new RegExp(`scan\\s*${from}\\s*(?:→|->|—>|to)\\s*${to}\\b`, "i"),
    // "onto scan 14" / "from scan 13" style, anchored to a line that also names the other scan
    new RegExp(`onto scan ${to}\\b`, "i"),
    new RegExp(`from scan ${from}\\b`, "i"),
    new RegExp(`begun at the bottom of scan ${from}\\b`, "i"),
    new RegExp(`scan ${from}(?:'s)? [^.\\n]{0,80}continues in scan ${to}\\b`, "i"),
    new RegExp(`scan ${from} ends[^.\\n]*;\\s*scan ${to} begins`, "i"),
    new RegExp(`into scan ${to}\\b`, "i"),
    new RegExp(`scan ${to} continues\\b`, "i"),
    new RegExp(`scan ${from} ends\\b[^.\\n]*\\.\\s*Scan ${to}\\b`, "i"),
    ...(be
      ? [
          new RegExp(`batch 0?${be[0]}\\s*(?:→|->|—>|to)\\s*batch 0?${be[1]}\\b`, "i"),
          new RegExp(`continues directly from batch 0?${be[0]}\\b`, "i"),
          new RegExp(`continues into batch 0?${be[1]}\\b`, "i"),
        ]
      : []),
  ];
  const out = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (refs.some((r) => r.test(line))) out.push(line.replace(/^[-*]\s*/, ""));
  }
  return out;
}

function auditTransitions() {
  const docs = auditDocuments();
  const rows = [];
  for (let i = 0; i < POEM_SCANS.length - 1; i++) {
    const from = POEM_SCANS[i];
    const to = POEM_SCANS[i + 1];
    const stanzaEvidence = [];
    const textualEvidence = [];
    let textualRelation = "not-specifically-recorded";
    for (const d of docs) {
      for (const st of statementsNaming(d.text, from, to)) {
        const cite = `${d.rel}: ${st}`;
        // (a) TYPOGRAPHIC — only a statement that actually speaks about the printed stanza relation
        //     across this page edge counts.
        if (STANZA_WORDS.test(st)) stanzaEvidence.push(cite);
        // (b) TEXTUAL / RHETORICAL — recorded separately and never promoted to stanza evidence.
        if (NON_CONTINUATION.test(st)) {
          textualEvidence.push(cite);
          textualRelation = "source-established-non-continuation";
        } else if (CONTINUATION_WORDS.test(st)) {
          textualEvidence.push(cite);
          if (textualRelation !== "source-established-non-continuation") textualRelation = "source-established-continuation";
        }
      }
    }
    // A stanza relation is resolved ONLY by explicit typographic evidence. There is none in the
    // pinned source for any transition, so every relation below is `unknown` — derived, not assumed.
    const stanzaRelation = stanzaEvidence.length ? classifyStanza(stanzaEvidence) : "unknown";
    rows.push({
      fromScan: from,
      toScan: to,
      stanzaRelation,
      textualRelation,
      evidence: { stanza: [...new Set(stanzaEvidence)], textual: [...new Set(textualEvidence)] },
    });
  }
  return rows;
}

// Only reached if a future upstream review adds explicit cross-page stanza wording. Kept narrow and
// fail-closed: ambiguous typographic wording stays `unknown` rather than being guessed.
function classifyStanza(evidence) {
  const joined = evidence.join(" ");
  const sameStanza = /same stanza|one stanza|single stanza|stanza continues|continues the stanza|ஒரே பத்தி/i.test(joined);
  const boundary = /new stanza|stanza break|stanza boundary|separate stanza|begins a stanza|புதிய பத்தி/i.test(joined);
  if (sameStanza && !boundary) return "same-stanza";
  if (boundary && !sameStanza) return "stanza-boundary";
  return "unknown";
}

// ── Tamil: the reviewed source assembly ──────────────────────────────────────────────────────────
// sections/<slug>.md holds one fenced ```text block per poem scan, each preceded by a hidden
// `<!-- scan N / … -->` provenance comment. Inside a block, a blank line is a source-established
// stanza break — the verified page record preserves that blank-line relation. Between blocks there
// is a PAGE TRANSITION whose stanza relation comes from the audit above, never from the fence.
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
  if (blocks.length !== POEM_SCANS.length) throw new Error(`expected ${POEM_SCANS.length} Tamil poem blocks, found ${blocks.length}`);
  blocks.forEach((b, i) => {
    if (b.scan !== POEM_SCANS[i]) throw new Error(`Tamil block ${i} is scan ${b.scan}, expected ${POEM_SCANS[i]}`);
  });

  const els = [];
  blocks.forEach((b, bi) => {
    if (bi > 0) els.push(pageTransition(blocks[bi - 1].scan, b.scan));
    let pendingBlank = false;
    let emittedInBlock = 0;
    b.lines.forEach((raw) => {
      if (raw.trim() === "") {
        // A blank at the very edge of a fenced block cannot be attributed to a within-page relation
        // (the fence is the container boundary), so it is not treated as in-page stanza evidence.
        if (emittedInBlock > 0) pendingBlank = true;
        return;
      }
      if (pendingBlank) {
        els.push({ kind: "stanza-break", evidence: "source-blank-line", sourceScan: b.scan });
        pendingBlank = false;
      }
      els.push({ kind: "line", ...line(raw, b.scan, b.printed) });
      emittedInBlock++;
    });
  });
  return els;
}

// ── English: the RELEASE-COMPLETE translation ────────────────────────────────────────────────────
// The released assembly (translations/en/<slug>-en.md) is the release artifact but carries only
// BATCH-level hidden markers. The reviewed batch files carry SCAN-level markers over byte-identical
// verse, so per-line scan provenance IS established by the release artifacts — it is read from the
// batches and then proved equal to the released assembly, line for line.
//
// A hidden marker establishes PAGE (or BATCH) PROVENANCE. It does NOT establish "no stanza break":
// every marker in the release artifacts is written with blank-line padding on both sides, so a
// marker-adjacent blank run cannot distinguish "padding only" from "padding plus a real stanza
// break". That is CROSS-PAGE STRUCTURAL AMBIGUITY, and it is represented as such — a page
// transition whose stanza relation is `unknown` — rather than being collapsed to a continuation.
// Blank lines wholly INSIDE one scan region remain source-supported stanza structure.
const BATCHES = [
  { n: 1, scans: [13, 14, 15] },
  { n: 2, scans: [16, 17, 18, 19] },
  { n: 3, scans: [20, 21] },
  { n: 4, scans: [22, 23] },
  { n: 5, scans: [24, 25, 26] },
];

const COMMENT = /^<!--[\s\S]*-->$/;

for (let i = 0; i < BATCHES.length - 1; i++) {
  const a = BATCHES[i];
  const b = BATCHES[i + 1];
  BATCH_EDGE.set(`${a.scans[a.scans.length - 1]}->${b.scans[0]}`, [a.n, b.n]);
}

const TRANSITIONS = auditTransitions();
const transitionAt = new Map(TRANSITIONS.map((t) => [`${t.fromScan}->${t.toScan}`, t]));

function parseEnglish() {
  // 1. batch files → per-scan regions
  const regions = []; // { scan, batch, lines: string[][] }  (lines grouped into blank-delimited runs)
  for (const b of BATCHES) {
    const src = readText(path.join(WORK_DIR, "translations/en/batches", `batch-0${b.n}.md`));
    const start = src.indexOf("## English translation");
    const end = src.indexOf("## Translator's notes");
    if (start < 0 || end < 0 || end <= start) throw new Error(`batch-0${b.n}.md: cannot locate the released verse section`);
    // Only the '## English translation' section is ever read — translator notes, source-fidelity
    // checklists and voice reviews are support layers and never enter the poem.
    const section = src.slice(start + "## English translation".length, end);
    const seen = [];
    let cur = null;
    for (const raw of section.split("\n")) {
      const t = raw.trim();
      if (COMMENT.test(t)) {
        const mm = /scan (\d+)/.exec(t);
        if (!mm) throw new Error(`batch-0${b.n}.md: unrecognised hidden marker ${t}`);
        const scan = Number(mm[1]);
        seen.push(scan);
        cur = { scan, batch: b.n, runs: [[]] };
        regions.push(cur);
        continue;
      }
      if (!cur) {
        if (t !== "") throw new Error(`batch-0${b.n}.md: verse appears before any scan marker`);
        continue;
      }
      if (t === "") {
        if (cur.runs[cur.runs.length - 1].length) cur.runs.push([]);
        continue;
      }
      cur.runs[cur.runs.length - 1].push(raw);
    }
    if (JSON.stringify(seen) !== JSON.stringify(b.scans)) {
      throw new Error(`batch-0${b.n}.md: scan markers ${JSON.stringify(seen)} disagree with the source map ${JSON.stringify(b.scans)}`);
    }
  }
  for (const r of regions) {
    r.runs = r.runs.filter((run) => run.length);
    if (!r.runs.length) throw new Error(`scan ${r.scan}: released English carries no verse for this scan`);
  }
  const seenScans = regions.map((r) => r.scan);
  if (JSON.stringify(seenScans) !== JSON.stringify(POEM_SCANS)) {
    throw new Error(`English scan regions ${JSON.stringify(seenScans)} do not match the poem scans ${JSON.stringify(POEM_SCANS)}`);
  }

  // 2. build the ordered element stream
  const els = [];
  regions.forEach((r, ri) => {
    if (ri > 0) els.push(pageTransition(regions[ri - 1].scan, r.scan));
    r.runs.forEach((run, ki) => {
      // A blank run WHOLLY INSIDE one scan region is source-established stanza structure.
      if (ki > 0) els.push({ kind: "stanza-break", evidence: "source-blank-line", sourceScan: r.scan });
      for (const raw of run) els.push({ kind: "line", ...line(raw, r.scan, PRINTED_PAGE.get(r.scan) ?? null) });
    });
  });

  // 3. prove the batch-derived line stream IS the released assembly, line for line
  const asmSrc = readText(path.join(WORK_DIR, "translations/en", `${SLUG}-en.md`));
  const asmStart = asmSrc.indexOf("<!-- batch 01");
  if (asmStart < 0) throw new Error("released English assembly: cannot locate the first batch marker");
  const asmLines = asmSrc
    .slice(asmStart)
    .split("\n")
    .filter((raw) => raw.trim() !== "" && !COMMENT.test(raw.trim()))
    .map((raw) => raw.replace(/\s+$/, ""));
  const built = els.filter((e) => e.kind === "line").map((e) => " ".repeat(e.indent) + e.text);
  if (asmLines.length !== built.length) {
    throw new Error(`released English assembly has ${asmLines.length} verse lines but the reviewed batches have ${built.length}`);
  }
  for (let i = 0; i < asmLines.length; i++) {
    if (asmLines[i] !== built[i]) {
      throw new Error(`released English assembly diverges from the reviewed batches at line ${i + 1}:\n  assembly: ${asmLines[i]}\n  batches:  ${built[i]}`);
    }
  }
  return els;
}

function pageTransition(fromScan, toScan) {
  const t = transitionAt.get(`${fromScan}->${toScan}`);
  if (!t) throw new Error(`no audited transition for ${fromScan}->${toScan}`);
  return {
    kind: "page-transition",
    fromScan,
    toScan,
    stanzaRelation: t.stanzaRelation,
    textualRelation: t.textualRelation,
    evidence: t.evidence,
  };
}

// ── Shared line construction ─────────────────────────────────────────────────────────────────────
// A source line stays ONE logical line. Leading indentation is carried as a source fact (`indent`)
// rather than baked into the text, so the reader can preserve it without forcing <pre> styling and
// a long line can still wrap visually on a narrow viewport without becoming a new poetic line.
function line(raw, scan, printed) {
  const text = raw.replace(/\s+$/, "");
  const indent = text.length - text.trimStart().length;
  if (indent % 4 !== 0) throw new Error(`unexpected indentation width ${indent} on scan ${scan}: ${JSON.stringify(raw)}`);
  return { text: text.slice(indent), indent, sourceScan: scan, printedPage: printed };
}

// ── Layer metrics (source-honest; a derived run is never reported as a printed stanza) ────────────
function layerOf(elements) {
  const lines = elements.filter((e) => e.kind === "line");
  const breaks = elements.filter((e) => e.kind === "stanza-break");
  const pages = elements.filter((e) => e.kind === "page-transition");
  // Verse runs: maximal line runs between any two boundaries.
  let runs = 0;
  let inRun = false;
  // A run's stanza membership is source-established only if NEITHER side is an unresolved page edge.
  let established = 0;
  let leftUnresolved = false;
  let curUnresolved = false;
  for (const e of elements) {
    if (e.kind === "line") {
      if (!inRun) {
        inRun = true;
        runs++;
        curUnresolved = leftUnresolved;
      }
      continue;
    }
    if (inRun) {
      const rightUnresolved = e.kind === "page-transition" && e.stanzaRelation === "unknown";
      if (!curUnresolved && !rightUnresolved) established++;
      inRun = false;
      leftUnresolved = rightUnresolved;
    }
  }
  if (inRun && !curUnresolved) established++;
  return {
    elements,
    lineCount: lines.length,
    inPageStanzaBreaks: breaks.length,
    verseRuns: runs,
    sourceEstablishedStanzas: established,
    pageTransitions: pages.length,
    unresolvedStanzaRelations: pages.filter((p) => p.stanzaRelation === "unknown").length,
  };
}

// ── Exclusions (LOCKED) ──────────────────────────────────────────────────────────────────────────
const EXCLUDED_PHRASES = [
  "9.2.1969", "சென்னை வானொலியில்", "கண்ணீர்க் கவிதாஞ்சலி",
  "அச்சிட்டோர்", "வைகை பிரிண்டர்ஸ்", "சைதாப்பேட்டை",
  "உலகத்தமிழ் செம்மொழி", "பிறப்பொக்கும் எல்லா உயிர்க்கும்", "வாழிய வாழியவே",
  "குறிஞ்சி சுப்பிரமணியன்", "என்னுரை", "15.9.2008",
  "Translator's notes", "Source-fidelity review", "Kalaignar-voice review", "Batch judgement",
  "reviewed", "assembly",
];

function assertNoExcluded(layerName, elements) {
  const body = elements.filter((e) => e.kind === "line").map((e) => e.text).join("\n");
  for (const phrase of EXCLUDED_PHRASES) {
    if (body.includes(phrase)) throw new Error(`${layerName} verse contains locked-excluded non-verse material: ${JSON.stringify(phrase)}`);
  }
}

// ── Build ────────────────────────────────────────────────────────────────────────────────────────
const taEls = parseTamil();
const enEls = parseEnglish();
assertNoExcluded("Tamil", taEls);
assertNoExcluded("English", enEls);
const ta = layerOf(taEls);
const en = layerOf(enEls);

for (const [name, l] of [["Tamil", l1(ta)], ["English", l1(en)]]) {
  if (JSON.stringify(l) !== JSON.stringify(POEM_SCANS)) throw new Error(`${name} layer covers scans ${JSON.stringify(l)}, expected ${JSON.stringify(POEM_SCANS)}`);
}
function l1(layer) {
  return [...new Set(layer.elements.filter((e) => e.kind === "line").map((e) => e.sourceScan))].sort((a, b) => a - b);
}
for (const [name, l] of [["Tamil", ta], ["English", en]]) {
  if (l.pageTransitions !== POEM_SCANS.length - 1) throw new Error(`${name}: ${l.pageTransitions} page transitions, expected ${POEM_SCANS.length - 1}`);
}

const relCount = (rel) => TRANSITIONS.filter((t) => t.stanzaRelation === rel).length;
const txtCount = (rel) => TRANSITIONS.filter((t) => t.textualRelation === rel).length;

const CONTEXT_NOTE_TA =
  "(9.2.1969 அன்று சென்னை வானொலியில் பேரறிஞர் அண்ணா\nஅவர்களுக்குக் கலைஞர் மு. கருணாநிதி அவர்கள் அளித்த\nகண்ணீர்க் கவிதாஞ்சலி)";
{
  const asm = readText(path.join(WORK_DIR, "sections", `${SLUG}.md`));
  for (const frag of CONTEXT_NOTE_TA.split("\n")) {
    if (!asm.includes(frag.replace(/^\(|\)$/g, ""))) throw new Error(`source context note fragment not found verbatim in the source assembly: ${JSON.stringify(frag)}`);
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
    noteEn:
      "The note printed above the poem records that on 9.2.1969, on Chennai Radio, Kalaignar M. Karunanidhi offered this கண்ணீர்க் கவிதாஞ்சலி — a tearful poetic tribute — to Perarignar Anna.",
    dateIso: "1969-02-09",
    datePrinted: "9.2.1969",
    venue: { ta: "சென்னை வானொலி", en: "Chennai Radio" },
    occasion: { ta: "பேரறிஞர் அண்ணாவுக்கான கண்ணீர்க் கவிதாஞ்சலி", en: "A poetic tribute to Perarignar Anna" },
  },
  publicationYear: null,
  editionStatement: null,
  factsNotStated: ["publication-year", "edition-statement", "printed-page-number-on-scan-26", "cross-page-stanza-relationships"],
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
    tamilInPageStanzaBreaks: ta.inPageStanzaBreaks,
    tamilVerseRuns: ta.verseRuns,
    tamilSourceEstablishedStanzas: ta.sourceEstablishedStanzas,
    tamilIndentedLines: ta.elements.filter((e) => e.kind === "line" && e.indent > 0).length,
    englishLines: en.lineCount,
    englishInPageStanzaBreaks: en.inPageStanzaBreaks,
    englishVerseRuns: en.verseRuns,
    englishSourceEstablishedStanzas: en.sourceEstablishedStanzas,
    englishIndentedLines: en.elements.filter((e) => e.kind === "line" && e.indent > 0).length,
    pageTransitionsAudited: TRANSITIONS.length,
    stanzaRelationSameStanza: relCount("same-stanza"),
    stanzaRelationStanzaBoundary: relCount("stanza-boundary"),
    stanzaRelationUnresolved: relCount("unknown"),
    textualContinuations: txtCount("source-established-continuation"),
    textualNonContinuations: txtCount("source-established-non-continuation"),
    textualNotRecorded: txtCount("not-specifically-recorded"),
    transitions: TRANSITIONS.map((t) => ({
      fromScan: t.fromScan,
      toScan: t.toScan,
      stanzaRelation: t.stanzaRelation,
      textualRelation: t.textualRelation,
      stanzaEvidence: t.evidence.stanza,
      textualEvidence: t.evidence.textual,
    })),
    boundaryNote:
      "TEXTUAL/RHETORICAL continuity and TYPOGRAPHIC stanza relation are separate dimensions and are recorded separately. The source archive records cross-page textual continuations (a line, a quotation or a rhetorical movement running on), but a sentence can run on across a printed stanza break, so those records do not establish the stanza relation. Marker-adjacent blank-line formatting does not by itself establish the cross-page stanza relationship either: in the Tamil assembly each page is a separate fenced block, which structurally cannot express a blank line across the page edge, and in the English release every hidden marker is written with blank-line padding on both sides. Blank lines wholly inside one source page ARE source-established stanza structure and are preserved as such.",
    provenanceGranularity:
      "Line-level scan provenance in BOTH layers. Tamil lines carry the scan of their assembly block; English lines carry the scan marked in the reviewed batch files, whose verse is proved byte-identical to the released assembly. Printed page numbers are recorded only where the scan shows one (scans 13–25 → printed 11–23); scan 26 stays null.",
    terminologyNote:
      "A maximal run of lines between two boundaries is a VERSE RUN, not a stanza: where a run is bounded by a page transition whose relation is unresolved, the printed stanza it belongs to is simply not established. Only runs delimited on both sides by source-established stanza structure are counted as source-established stanzas. No derived run count is reported as a printed stanza count.",
    note: "Derived structure only. The Tamil assembly is the authoritative source layer; the English is the RELEASE-COMPLETE project-created translation. Neither was retranslated, modernized, re-lineated or normalized during import: line text, line order, in-page stanza gaps, indentation, punctuation, quotation marks, ellipses and repetition are carried exactly as released.",
  },
  blockers: relCount("unknown")
    ? [
        {
          item: "cross-page-stanza-relationship",
          count: relCount("unknown"),
          detail: `${relCount("unknown")} physical page transitions for which the pinned source repository records no printed stanza relation: it establishes neither that the printed stanza continues nor that a new one begins. Encoded as stanzaRelation "unknown" (neither same-stanza nor stanza-boundary) and rendered as a neutral source-page transition marker. The relation is never inferred from punctuation, sentence completion, rhetorical meaning, indentation, the fact that the text flows, or the absence of a blank line at a fenced page edge. The archive's cross-page TEXTUAL continuity records are preserved separately and are not read as typographic evidence.`,
          resolution:
            "Resolution requires an UPSTREAM source-archive visual/source review of the controlling scan TVA_BOK_0064132_இதயத்தைத்_தந்திடு_அண்ணா.pdf (poem scans 13–26) that explicitly records the printed stanza relationship at each physical page transition. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
        },
      ]
    : [],
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
    `Independent-review correction: an earlier revision asserted that all ${TRANSITIONS.length} physical page transitions fall inside a stanza. That conflated textual continuity with typographic stanza continuity. The two dimensions are now recorded separately, and the stanza relation is resolved only from explicit source evidence — currently ${relCount("same-stanza")} same-stanza, ${relCount("stanza-boundary")} stanza-boundary, ${relCount("unknown")} unresolved.`,
    "A source line remains one logical line. Indentation is carried as a source fact so it survives without <pre> styling, and a long line may wrap visually on a narrow viewport without ever becoming two poetic lines.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "poem.json"), JSON.stringify(poem, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("poem:", SLUG);
console.log("tamil:   lines", ta.lineCount, "| in-page stanza breaks", ta.inPageStanzaBreaks, "| verse runs", ta.verseRuns, "| source-established stanzas", ta.sourceEstablishedStanzas, "| indented", provenance.archiveDerived.tamilIndentedLines);
console.log("english: lines", en.lineCount, "| in-page stanza breaks", en.inPageStanzaBreaks, "| verse runs", en.verseRuns, "| source-established stanzas", en.sourceEstablishedStanzas, "| indented", provenance.archiveDerived.englishIndentedLines);
console.log("page transitions audited:", TRANSITIONS.length);
console.log("  stanza relation  — same-stanza", relCount("same-stanza"), "/ stanza-boundary", relCount("stanza-boundary"), "/ UNRESOLVED", relCount("unknown"));
console.log("  textual relation — continuation", txtCount("source-established-continuation"), "/ non-continuation", txtCount("source-established-non-continuation"), "/ not recorded", txtCount("not-specifically-recorded"));
for (const t of TRANSITIONS) console.log(`   ${t.fromScan}->${t.toScan}  stanza=${t.stanzaRelation.padEnd(8)} textual=${t.textualRelation.padEnd(34)} evidence: stanza ${t.evidence.stanza.length} / textual ${t.evidence.textual.length}`);
console.log("poem.json sha256:", sha256(readText(path.join(OUT, "poem.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
