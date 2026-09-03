// Shared, source-driven engine for STANDALONE poem imports (Digital Library — Poetry).
//
// One engine, many works. Everything algorithmic lives here: source-pin enforcement, source-identity
// assertion, the cross-page evidence audit, the two Tamil assembly conventions, the batch→assembly
// English proof, line construction, layer metrics, locked-exclusion enforcement and payload emission.
// Everything WORK-SPECIFIC lives in scripts/poem-declarations/<slug>.mjs — scan maps, section and
// batch conventions, and the prose that states what the pinned source repository actually records.
//
// The split is deliberate. A per-work fact belongs in a declaration precisely BECAUSE it is a fact
// about that source tree; putting it in the engine would make it a default, and a default is how one
// work's evidence silently becomes another work's assertion. The engine therefore fails closed on
// anything it is not told: an unrecognised marker, a heading inside verse, an unlisted audit
// document, an indentation width it cannot attribute, a scan with no verse. It never infers a
// printed page number, a publication year, a stanza relation, or a date.
//
// Used by scripts/import-standalone-poem.mjs. Never writes to the source clone.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const readText = (p) => fs.readFileSync(p, "utf8");

// ── Source pin ───────────────────────────────────────────────────────────────────────────────────
// Fail closed BEFORE anything is written: the source clone's actual git HEAD must equal the supplied
// <source-commit>, so a SHA that does not match the checked-out tree can never be recorded.
export function assertSourcePin(srcRepo, srcCommit) {
  let actualHead;
  try {
    actualHead = execFileSync("git", ["-C", srcRepo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch (e) {
    throw new Error(`unable to read git HEAD of source clone at ${srcRepo}: ${e.message}`);
  }
  if (actualHead !== srcCommit) {
    throw new Error(
      `source-commit mismatch: supplied ${srcCommit} but ${srcRepo} HEAD is ${actualHead}. ` +
        `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
    );
  }
}

// ── Evidence vocabulary (shared, and deliberately asymmetric) ────────────────────────────────────
// TYPOGRAPHIC vocabulary is narrow: a statement counts as stanza evidence only if it speaks about
// the printed stanza/verse-group relation ACROSS a page edge. Statements about stanza structure
// WITHIN a page are not cross-page evidence and are excluded by requiring the sentence to name the
// transition.
// `\b` is meaningless against Tamil script, and `பத்தி` (stanza/paragraph) is a common SUBSTRING —
// it sits inside `பத்தினிகளிடம்`, "to the wives", which has nothing to do with stanzas. Without an
// explicit Tamil-letter boundary that word would be cited in published provenance as typographic
// stanza evidence. The classifier stayed fail-closed and the relation stayed `unknown`, so no
// payload was ever wrong, but the CITATION would have been, so the boundary is required here.
const TA = "\\u0B80-\\u0BFF";
const STANZA_WORDS = new RegExp(`\\b(stanza|verse group|verse-group|verse paragraph)\\b|(?<![${TA}])பத்தி(?![${TA}])`, "i");
// The TEXTUAL vocabulary follows the words the source archives themselves use for this dimension
// ("continues onto scan 14", "closes the quotation begun at the bottom of scan 22", "cadence
// preserved", "flows directly", "must remain continuous"). It is broader than the typographic
// vocabulary above because the archives document this dimension richly — and it is never allowed to
// influence the stanza classification.
const CONTINUATION_WORDS =
  /continu|carries on|closes the quotation|completes the|runs on|cadence preserved|preserved as one|flows directly|does not reset|remain continuous|left grammatically\/rhetorically open/i;
const NON_CONTINUATION = /not textually|but not textually/i;

const COMMENT = /^<!--[\s\S]*-->$/;

// Only reached if an upstream review records explicit cross-page stanza wording. Narrow and
// fail-closed: ambiguous typographic wording stays `unknown` rather than being guessed.
function classifyStanza(evidence) {
  const joined = evidence.join(" ");
  const sameStanza = new RegExp(`same stanza|one stanza|single stanza|stanza continues|continues the stanza|ஒரே பத்தி(?![${TA}])`, "i").test(joined);
  const boundary = new RegExp(`new stanza|stanza break|stanza boundary|separate stanza|begins a stanza|புதிய பத்தி(?![${TA}])`, "i").test(joined);
  if (sameStanza && !boundary) return "same-stanza";
  if (boundary && !sameStanza) return "stanza-boundary";
  return "unknown";
}

// ── Audit corpus ─────────────────────────────────────────────────────────────────────────────────
// The declaration lists the documents to read, IN ORDER, because citation order is part of the
// emitted payload. The engine then proves that list is COMPLETE against a rule derived from the work
// itself: every Markdown file in the work tree except the page records of scans outside the poem.
// A declaration can therefore never quietly drop a document that carries cross-page evidence.
function auditDocuments(workDir, decl) {
  const declared = decl.auditDocs;
  const onDisk = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith(".md")) onDisk.push(path.relative(workDir, abs));
    }
  };
  walk(workDir);
  const poemScanSet = new Set(decl.poemScans);
  const required = onDisk.filter((rel) => {
    const m = /^pages\/0*(\d+)\.md$/.exec(rel);
    return m ? poemScanSet.has(Number(m[1])) : true;
  });
  const declaredSet = new Set(declared);
  const missing = required.filter((rel) => !declaredSet.has(rel));
  if (missing.length) {
    throw new Error(
      `audit corpus incomplete: ${missing.length} Markdown document(s) in the work tree are not listed in auditDocs ` +
        `and would never be searched for cross-page evidence: ${missing.join(", ")}`,
    );
  }
  const absent = declared.filter((rel) => !fs.existsSync(path.join(workDir, rel)));
  if (absent.length) throw new Error(`auditDocs names document(s) that do not exist in the source tree: ${absent.join(", ")}`);
  return declared.map((rel) => ({ rel, text: readText(path.join(workDir, rel)) }));
}

// Sentences/bullets in `text` that name the transition from→to. A translation-batch boundary IS a
// physical page transition (the source map assigns each batch a contiguous scan range), so
// statements written in batch terms are matched too — but, like every other citation here, only ever
// for the TEXTUAL dimension. A batch boundary never becomes typographic stanza evidence.
function statementsNaming(text, from, to, batchEdge) {
  const be = batchEdge.get(`${from}->${to}`);
  const refs = [
    new RegExp(`scan\\s*${from}\\s*(?:→|->|—>|to)\\s*${to}\\b`, "i"),
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

function auditTransitions(workDir, decl, batchEdge) {
  const docs = auditDocuments(workDir, decl);
  const scans = decl.poemScans;
  const rows = [];
  for (let i = 0; i < scans.length - 1; i++) {
    const from = scans[i];
    const to = scans[i + 1];
    const stanzaEvidence = [];
    const textualEvidence = [];
    let textualRelation = "not-specifically-recorded";
    for (const d of docs) {
      for (const st of statementsNaming(d.text, from, to, batchEdge)) {
        const cite = `${d.rel}: ${st}`;
        // (a) TYPOGRAPHIC — only a statement that speaks about the printed stanza relation counts.
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
    rows.push({
      fromScan: from,
      toScan: to,
      stanzaRelation: stanzaEvidence.length ? classifyStanza(stanzaEvidence) : "unknown",
      textualRelation,
      evidence: { stanza: [...new Set(stanzaEvidence)], textual: [...new Set(textualEvidence)] },
    });
  }
  return rows;
}

// ── Inline Markdown markup in the released English (MEASURED, NOT REWRITTEN) ────────────────────
// The Tamil assemblies are literal text. The released English assemblies are Markdown, and some use
// inline emphasis inside the verse — `*tangu sani vēl*` in one work, `**…**` in another. Those
// delimiters are carried into the payload EXACTLY as released, byte for byte, and nothing here
// rewrites them.
//
// What that means for a reader is a separate question from what the payload holds, and the two must
// not be conflated. components/PoemReader.tsx renders each line through `inline()`, which converts
// balanced same-line `**…**` to <strong> and `*…*` to <em>. So for balanced emphasis the delimiters
// are markup the reader resolves, not characters a reader sees.
//
// `markupCensus` is therefore a DATA-LAYER census: it counts released verse lines whose text
// contains Markdown-like markers, and it says nothing on its own about visible output. It splits
// them because only one half raises a question:
//
//   balanced  — markers the line-local renderer resolves into <em>/<strong>. No reader sees them.
//   leftover  — `*` characters left outside every balanced match on that line. These reach the
//               reader as literal characters. That is CORRECT for a genuine literal (a lone `*`
//               standing as a mark in the source) and is the visible residue of an emphasis that
//               opens on one line and closes on another, which a per-line renderer cannot pair.
//
// The counts are asserted by the tests so neither category can grow unnoticed, and any leftover is
// reported rather than repaired: rewriting released text is not this import's decision to make.
const BALANCED = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
const OTHER_MARKUP = /`|\[[^\]]*\]\([^)]*\)/;

export function markupCensus(built) {
  const tally = (layer) => {
    let balanced = 0;
    let leftover = 0;
    const leftoverLines = [];
    for (const e of layer.elements) {
      if (e.kind !== "line") continue;
      const t = e.text;
      if (!t.includes("*") && !OTHER_MARKUP.test(t)) continue;
      const spans = [];
      BALANCED.lastIndex = 0;
      let m;
      while ((m = BALANCED.exec(t)) !== null) spans.push([m.index, m.index + m[0].length]);
      if (spans.length) balanced++;
      let loose = 0;
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "*") continue;
        if (!spans.some(([a, b]) => a <= i && i < b)) loose++;
      }
      if (loose) {
        leftover++;
        leftoverLines.push({ sourceScan: e.sourceScan, text: t });
      }
    }
    return { balanced, leftover, leftoverLines };
  };
  return { tamil: tally(built.ta), english: tally(built.en) };
}

// ── Shared line construction ─────────────────────────────────────────────────────────────────────
// A source line stays ONE logical line. Leading indentation is carried as a source fact (`indent`)
// rather than baked into the text, so the reader can preserve it without forcing <pre> styling and a
// long line can still wrap visually on a narrow viewport without becoming a new poetic line.
function line(raw, scan, printed, indentUnit) {
  const text = raw.replace(/\s+$/, "");
  const indent = text.length - text.trimStart().length;
  if (indent % indentUnit !== 0) throw new Error(`unexpected indentation width ${indent} on scan ${scan}: ${JSON.stringify(raw)}`);
  return { text: text.slice(indent), indent, sourceScan: scan, printedPage: printed };
}

// ── Tamil: the reviewed source assembly ──────────────────────────────────────────────────────────
// Two conventions are in use across the poem repositories, and the difference is real rather than
// cosmetic, so both are parsed explicitly rather than by a permissive regex that would accept either
// and notice neither:
//
//   "fenced-labelled"  `<!-- scan N / LABEL -->` followed by a ```text fence. LABEL is either
//                      `printed page M` or a statement that no printed number is visible.
//   "plain-marker"     `<!-- scan_page: N -->` with unfenced text running to the next marker.
//
// Inside a block, a blank line is a source-established stanza break. Between blocks there is a PAGE
// TRANSITION whose stanza relation comes from the evidence audit, never from the container.
function parseTamil(workDir, decl, pageTransition) {
  const src = readText(path.join(workDir, decl.tamil.file));
  const blocks = [];

  if (decl.tamil.convention === "fenced-labelled") {
    const re = /<!-- scan (\d+) \/ ([^>]*?) -->\n```text\n([\s\S]*?)\n```/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const scan = Number(m[1]);
      const label = m[2].trim();
      const printedMatch = /^printed page (\d+)$/.exec(label);
      const printed = printedMatch ? Number(printedMatch[1]) : null;
      if (!printedMatch && !decl.tamil.unnumberedLabels.includes(label)) {
        throw new Error(`scan ${scan}: unrecognised assembly label ${JSON.stringify(label)} — the engine will not guess whether a printed page number is present`);
      }
      if (printed !== decl.printedPageFor(scan)) {
        throw new Error(`scan ${scan}: assembly marker printed page ${printed} disagrees with the page map ${decl.printedPageFor(scan)}`);
      }
      blocks.push({ scan, printed, lines: m[3].split("\n") });
    }
  } else if (decl.tamil.convention === "plain-marker") {
    // Everything before the first scan marker is Markdown front matter of the assembly FILE, not the
    // poem; the poem region begins at the first declared scan marker, exactly as the English
    // assembly region does.
    const marker = /<!-- scan_page:\s*(\d+)\s*-->/g;
    const hits = [];
    let m;
    while ((m = marker.exec(src)) !== null) hits.push({ scan: Number(m[1]), start: m.index, bodyStart: m.index + m[0].length });
    hits.forEach((h, i) => (h.end = i + 1 < hits.length ? hits[i + 1].start : src.length));
    for (const h of hits) {
      const body = src.slice(h.bodyStart, h.end);
      const lines = body.split("\n").filter((raw) => !COMMENT.test(raw.trim()));
      if (decl.printedPageFor(h.scan) !== null) {
        throw new Error(`scan ${h.scan}: the plain-marker convention carries no printed-page label, but the declaration claims printed page ${decl.printedPageFor(h.scan)}`);
      }
      blocks.push({ scan: h.scan, printed: null, lines });
    }
  } else {
    throw new Error(`unknown Tamil assembly convention ${JSON.stringify(decl.tamil.convention)}`);
  }

  if (blocks.length !== decl.poemScans.length) throw new Error(`expected ${decl.poemScans.length} Tamil poem blocks, found ${blocks.length}`);
  blocks.forEach((b, i) => {
    if (b.scan !== decl.poemScans[i]) throw new Error(`Tamil block ${i} is scan ${b.scan}, expected ${decl.poemScans[i]}`);
  });

  const headingLines = decl.tamil.headingLines ?? [];
  const els = [];
  blocks.forEach((b, bi) => {
    if (bi > 0) els.push(pageTransition(blocks[bi - 1].scan, b.scan));
    let pendingBlank = false;
    let emittedInBlock = 0;
    b.lines.forEach((raw) => {
      if (raw.trim() === "") {
        // A blank at the very edge of a block cannot be attributed to a within-page relation (the
        // container boundary is not a source statement), so it is not in-page stanza evidence.
        if (emittedInBlock > 0) pendingBlank = true;
        return;
      }
      if (pendingBlank) {
        els.push({ kind: "stanza-break", evidence: "source-blank-line", sourceScan: b.scan });
        pendingBlank = false;
      }
      const built = line(raw, b.scan, b.printed, decl.indentUnit ?? 4);
      // A structural heading PRINTED IN THE SOURCE is not a line of verse. The Tamil assembly gives
      // it no markup, so it is recognised only from an explicit declaration citing the source
      // statement that establishes it — never from position, length or capitalisation.
      els.push(headingLines.includes(built.text) ? { kind: "source-heading", text: built.text, sourceScan: b.scan, printedPage: b.printed } : { kind: "line", ...built });
      emittedInBlock++;
    });
  });
  return els;
}

// ── English: the RELEASE-COMPLETE translation ────────────────────────────────────────────────────
// The reviewed batch files carry SCAN-level markers; the released assembly is the release artifact.
// Per-line scan provenance is read from the batches and then PROVED equal to the released assembly,
// line for line, so the provenance is established by the release artifacts rather than assumed.
//
// A hidden marker establishes PAGE PROVENANCE. It does NOT establish "no stanza break": markers are
// written with blank-line padding, so a marker-adjacent blank run cannot distinguish padding from a
// real stanza break. That is CROSS-PAGE STRUCTURAL AMBIGUITY and is represented as such. Blank lines
// wholly INSIDE one scan region remain source-supported stanza structure.
function sliceRegion(src, label, { startAt, startAfter, endBefore }) {
  let from = 0;
  if (startAt) {
    const i = src.indexOf(startAt);
    if (i < 0) throw new Error(`${label}: cannot locate the region start ${JSON.stringify(startAt)}`);
    from = i;
  } else if (startAfter) {
    const i = src.indexOf(startAfter);
    if (i < 0) throw new Error(`${label}: cannot locate the region start ${JSON.stringify(startAfter)}`);
    from = i + startAfter.length;
  }
  let to = src.length;
  if (endBefore) {
    const i = src.indexOf(endBefore, from);
    if (i < 0) throw new Error(`${label}: cannot locate the region end ${JSON.stringify(endBefore)}`);
    to = i;
  }
  if (to <= from) throw new Error(`${label}: the released verse region is empty`);
  return src.slice(from, to);
}

function parseEnglish(workDir, decl, pageTransition) {
  const en = decl.english;
  const markerScan = en.markerScan ?? /scan (\d+)/;
  const sourceHeadings = en.sourceHeadings ?? false;
  const HEADING = /^(#{1,6})\s+(.*\S)\s*$/;

  // 1. batch files → per-scan regions
  const regions = []; // { scan, batch, runs: string[][] }
  for (const b of en.batches) {
    const label = b.file;
    const src = readText(path.join(workDir, b.file));
    const section = sliceRegion(src, label, {
      startAt: b.verseStartAt ?? en.verseStartAt,
      startAfter: b.verseStartAfter ?? en.verseStartAfter,
      endBefore: b.verseEndBefore ?? en.verseEndBefore,
    });
    const seen = [];
    let cur = null;
    for (const raw of section.split("\n")) {
      const t = raw.trim();
      if (COMMENT.test(t)) {
        const mm = markerScan.exec(t);
        if (!mm) throw new Error(`${label}: unrecognised hidden marker ${t}`);
        const scan = Number(mm[1]);
        seen.push(scan);
        cur = { scan, batch: b.id, runs: [[]] };
        regions.push(cur);
        continue;
      }
      if (!cur) {
        if (t !== "") throw new Error(`${label}: verse appears before any scan marker`);
        continue;
      }
      if (t === "") {
        if (cur.runs[cur.runs.length - 1].length) cur.runs.push([]);
        continue;
      }
      if (HEADING.test(t)) {
        if (!sourceHeadings) throw new Error(`${label}: a Markdown heading appears inside the released verse region (${t}) and this work declares no source headings`);
        if (cur.runs[cur.runs.length - 1].length) cur.runs.push([]);
        cur.runs[cur.runs.length - 1].push(raw);
        cur.runs.push([]);
        continue;
      }
      cur.runs[cur.runs.length - 1].push(raw);
    }
    if (JSON.stringify(seen) !== JSON.stringify(b.scans)) {
      throw new Error(`${label}: scan markers ${JSON.stringify(seen)} disagree with the source map ${JSON.stringify(b.scans)}`);
    }
  }
  for (const r of regions) {
    r.runs = r.runs.filter((run) => run.length);
    if (!r.runs.length) throw new Error(`scan ${r.scan}: released English carries no verse for this scan`);
  }
  const seenScans = regions.map((r) => r.scan);
  if (JSON.stringify(seenScans) !== JSON.stringify(decl.poemScans)) {
    throw new Error(`English scan regions ${JSON.stringify(seenScans)} do not match the poem scans ${JSON.stringify(decl.poemScans)}`);
  }

  // 2. build the ordered element stream
  const els = [];
  regions.forEach((r, ri) => {
    if (ri > 0) els.push(pageTransition(regions[ri - 1].scan, r.scan));
    r.runs.forEach((run, ki) => {
      // A blank run WHOLLY INSIDE one scan region is source-established stanza structure.
      if (ki > 0) els.push({ kind: "stanza-break", evidence: "source-blank-line", sourceScan: r.scan });
      for (const raw of run) {
        const h = HEADING.exec(raw.trim());
        if (h && sourceHeadings) {
          els.push({ kind: "source-heading", text: h[2], sourceScan: r.scan, printedPage: decl.printedPageFor(r.scan), raw: raw.trim() });
          continue;
        }
        els.push({ kind: "line", ...line(raw, r.scan, decl.printedPageFor(r.scan), decl.indentUnit ?? 4) });
      }
    });
  });

  // 3. prove the batch-derived stream IS the released assembly, line for line
  const asmSrc = readText(path.join(workDir, en.assembly.file));
  const asmRegion = sliceRegion(asmSrc, en.assembly.file, en.assembly);
  const asmLines = asmRegion
    .split("\n")
    .filter((raw) => raw.trim() !== "" && !COMMENT.test(raw.trim()))
    .map((raw) => raw.replace(/\s+$/, ""));
  const built = els
    .filter((e) => e.kind === "line" || e.kind === "source-heading")
    .map((e) => (e.kind === "source-heading" ? e.raw : " ".repeat(e.indent) + e.text));
  if (asmLines.length !== built.length) {
    throw new Error(`released English assembly has ${asmLines.length} verse lines but the reviewed batches have ${built.length}`);
  }
  for (let i = 0; i < asmLines.length; i++) {
    if (asmLines[i] !== built[i]) {
      throw new Error(`released English assembly diverges from the reviewed batches at line ${i + 1}:\n  assembly: ${asmLines[i]}\n  batches:  ${built[i]}`);
    }
  }
  for (const e of els) delete e.raw; // the payload carries the heading TEXT, never Markdown syntax
  return els;
}

// ── Layer metrics (source-honest; a derived run is never reported as a printed stanza) ───────────
function layerOf(elements) {
  const lines = elements.filter((e) => e.kind === "line");
  const breaks = elements.filter((e) => e.kind === "stanza-break");
  const pages = elements.filter((e) => e.kind === "page-transition");
  const headings = elements.filter((e) => e.kind === "source-heading");
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
    } else if (e.kind === "page-transition") {
      leftUnresolved = e.stanzaRelation === "unknown";
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
    // Emitted only where the source actually prints a structural heading, so a work without one is
    // byte-identical to a payload built before this key existed.
    sourceHeadings: headings.length || undefined,
  };
}

// ── Build ────────────────────────────────────────────────────────────────────────────────────────
export function buildStandalonePoem({ decl, srcRepo, srcCommit }) {
  const workDir = path.join(srcRepo, "poems", decl.slug);
  const scans = decl.poemScans;

  // Source identity, asserted against the source repository's own metadata record.
  const sourceMeta = readText(path.join(workDir, "metadata/source.md"));
  for (const [label, needle] of [
    ["scan filename", decl.scan.filename],
    ["scan SHA-256", decl.scan.sha256],
    ["scan size", decl.scan.sizeText],
  ]) {
    if (!sourceMeta.includes(needle)) {
      throw new Error(`source identity mismatch: metadata/source.md does not record the expected ${label} (${needle})`);
    }
  }

  const batchEdge = new Map();
  const batches = decl.english.batches;
  for (let i = 0; i < batches.length - 1; i++) {
    const a = batches[i];
    const b = batches[i + 1];
    if (a.n && b.n) batchEdge.set(`${a.scans[a.scans.length - 1]}->${b.scans[0]}`, [a.n, b.n]);
  }

  const TRANSITIONS = auditTransitions(workDir, decl, batchEdge);
  const transitionAt = new Map(TRANSITIONS.map((t) => [`${t.fromScan}->${t.toScan}`, t]));
  const pageTransition = (fromScan, toScan) => {
    const t = transitionAt.get(`${fromScan}->${toScan}`);
    if (!t) throw new Error(`no audited transition for ${fromScan}->${toScan}`);
    return { kind: "page-transition", fromScan, toScan, stanzaRelation: t.stanzaRelation, textualRelation: t.textualRelation, evidence: t.evidence };
  };

  const taEls = parseTamil(workDir, decl, pageTransition);
  const enEls = parseEnglish(workDir, decl, pageTransition);

  // Locked exclusions: non-verse matter that must never reach a reading layer.
  for (const [layerName, elements] of [["Tamil", taEls], ["English", enEls]]) {
    const body = elements.filter((e) => e.kind === "line").map((e) => e.text).join("\n");
    for (const phrase of decl.excludedPhrases) {
      if (body.includes(phrase)) throw new Error(`${layerName} verse contains locked-excluded non-verse material: ${JSON.stringify(phrase)}`);
    }
  }

  const ta = layerOf(taEls);
  const en = layerOf(enEls);

  const coveredScans = (layer) => [...new Set(layer.elements.filter((e) => e.kind === "line").map((e) => e.sourceScan))].sort((a, b) => a - b);
  for (const [name, layer] of [["Tamil", ta], ["English", en]]) {
    const covered = coveredScans(layer);
    if (JSON.stringify(covered) !== JSON.stringify(scans)) throw new Error(`${name} layer covers scans ${JSON.stringify(covered)}, expected ${JSON.stringify(scans)}`);
    if (layer.pageTransitions !== scans.length - 1) throw new Error(`${name}: ${layer.pageTransitions} page transitions, expected ${scans.length - 1}`);
  }
  // Both layers must agree about the source's structural headings, or one of them is inventing or
  // swallowing one.
  if ((ta.sourceHeadings ?? 0) !== (en.sourceHeadings ?? 0)) {
    throw new Error(`the two reading layers disagree about source headings: Tamil ${ta.sourceHeadings ?? 0}, English ${en.sourceHeadings ?? 0}`);
  }

  // The declared source-context note must appear verbatim in the pinned source assembly.
  if (decl.sourceContext?.noteTa) {
    const asm = readText(path.join(workDir, decl.tamil.file));
    for (const frag of decl.sourceContext.noteTa.split("\n")) {
      if (!asm.includes(frag.replace(/^\(|\)$/g, ""))) throw new Error(`source context note fragment not found verbatim in the source assembly: ${JSON.stringify(frag)}`);
    }
  }

  const relCount = (rel) => TRANSITIONS.filter((t) => t.stanzaRelation === rel).length;
  const txtCount = (rel) => TRANSITIONS.filter((t) => t.textualRelation === rel).length;
  const derived = { TRANSITIONS, relCount, txtCount, ta, en, scans };

  const poem = {
    workId: decl.slug,
    slug: decl.slug,
    sourceRepo: "pugazg/kalaignar-poems",
    sourcePath: `poems/${decl.slug}`,
    sourceCommit: srcCommit,
    shelf: "poetry",
    readerStructure: "poem",
    subtype: "poem",
    title: decl.title,
    author: decl.author,
    sourceContext: decl.sourceContext,
    publicationYear: decl.publicationYear,
    editionStatement: decl.editionStatement,
    factsNotStated: decl.factsNotStated,
    editorialExceptions: decl.editorialExceptions,
    transcriptionStatus: decl.transcriptionStatus,
    translationStatus: decl.translationStatus,
    tamil: ta,
    english: en,
    poemScans: scans,
  };

  const provenance = {
    workId: decl.slug,
    sourceRepo: poem.sourceRepo,
    sourcePath: poem.sourcePath,
    sourceCommit: srcCommit,
    source: {
      titleTa: decl.title.ta,
      titleEn: decl.title.en,
      authorTa: decl.author.nameTa,
      authorEn: decl.author.nameEn,
      scanFilename: decl.scan.filename,
      scanSha256: decl.scan.sha256,
      scanFileSizeBytes: decl.scan.sizeBytes,
      scanTotalPages: decl.scan.totalPages,
      physicalVerification: decl.provenance.physicalVerification,
      poemScanPages: decl.provenance.poemScanPages,
      poemVerification: decl.provenance.poemVerification,
      printedPageMapping: decl.provenance.printedPageMapping,
      unnumberedScanNote: decl.provenance.unnumberedScanNote,
      sourcePdfCommitted: false,
      sourceTypeLabel: decl.provenance.sourceTypeLabel,
      contextNoteTa: decl.sourceContext?.noteTa,
      contextDatePrinted: decl.sourceContext?.datePrinted,
      contextDateIso: decl.sourceContext?.dateIso,
      contextVenueTa: decl.sourceContext?.venue?.ta,
      contextVenueEn: decl.sourceContext?.venue?.en,
      contextOccasionTa: decl.sourceContext?.occasion?.ta,
      contextOccasionEn: decl.sourceContext?.occasion?.en,
      publicationEstablished: decl.provenance.publicationEstablished,
      publicationNotEstablished: decl.provenance.publicationNotEstablished,
      forewordDateNote: decl.provenance.forewordDateNote,
      englishTitleNote: decl.provenance.englishTitleNote,
      sourceHeadingNote: decl.provenance.sourceHeadingNote,
      editorialExceptionNote: decl.provenance.editorialExceptionNote,
      lockedExclusions: decl.provenance.lockedExclusions,
    },
    verification: decl.provenance.verification,
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
      sourceHeadings: ta.sourceHeadings,
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
      boundaryNote: decl.provenance.boundaryNote,
      provenanceGranularity: decl.provenance.provenanceGranularity,
      terminologyNote: decl.provenance.terminologyNote,
      note: decl.provenance.derivedNote,
    },
    blockers: relCount("unknown")
      ? [
          {
            item: "cross-page-stanza-relationship",
            count: relCount("unknown"),
            detail: `${relCount("unknown")} physical page transitions for which the pinned source repository records no printed stanza relation: it establishes neither that the printed stanza continues nor that a new one begins. Encoded as stanzaRelation "unknown" (neither same-stanza nor stanza-boundary) and rendered as a neutral source-page transition marker. The relation is never inferred from punctuation, sentence completion, rhetorical meaning, indentation, the fact that the text flows, or the absence of a blank line at a fenced page edge. The archive's cross-page TEXTUAL continuity records are preserved separately and are not read as typographic evidence.`,
            resolution: decl.provenance.blockerResolution,
          },
        ]
      : [],
    projectRights: decl.provenance.projectRights,
    notes: decl.notes(derived),
  };

  return { poem, provenance, ...derived };
}

export function writeStandalonePoem(outDir, poem, provenance) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "poem.json"), JSON.stringify(poem, null, 1) + "\n");
  fs.writeFileSync(path.join(outDir, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");
}

export function reportStandalonePoem(outDir, built) {
  const { poem, provenance, ta, en, TRANSITIONS, relCount, txtCount } = built;
  console.log("poem:", poem.slug);
  console.log("tamil:   lines", ta.lineCount, "| in-page stanza breaks", ta.inPageStanzaBreaks, "| verse runs", ta.verseRuns, "| source-established stanzas", ta.sourceEstablishedStanzas, "| indented", provenance.archiveDerived.tamilIndentedLines);
  console.log("english: lines", en.lineCount, "| in-page stanza breaks", en.inPageStanzaBreaks, "| verse runs", en.verseRuns, "| source-established stanzas", en.sourceEstablishedStanzas, "| indented", provenance.archiveDerived.englishIndentedLines);
  console.log("page transitions audited:", TRANSITIONS.length);
  console.log("  stanza relation  — same-stanza", relCount("same-stanza"), "/ stanza-boundary", relCount("stanza-boundary"), "/ UNRESOLVED", relCount("unknown"));
  console.log("  textual relation — continuation", txtCount("source-established-continuation"), "/ non-continuation", txtCount("source-established-non-continuation"), "/ not recorded", txtCount("not-specifically-recorded"));
  for (const t of TRANSITIONS) console.log(`   ${t.fromScan}->${t.toScan}  stanza=${t.stanzaRelation.padEnd(8)} textual=${t.textualRelation.padEnd(34)} evidence: stanza ${t.evidence.stanza.length} / textual ${t.evidence.textual.length}`);
  const census = markupCensus(built);
  for (const [layer, c] of Object.entries(census)) {
    if (!c.balanced && !c.leftover) continue;
    console.log(`${layer} Markdown-marker census — ${c.balanced} line(s) with balanced emphasis the reader resolves, ${c.leftover} with leftover literal '*'`);
    for (const l of c.leftoverLines) console.log(`    leftover on scan ${l.sourceScan}: ${JSON.stringify(l.text)}`);
  }
  console.log("poem.json sha256:", sha256(readText(path.join(outDir, "poem.json"))));
  console.log("provenance.json sha256:", sha256(readText(path.join(outDir, "provenance.json"))));
}
