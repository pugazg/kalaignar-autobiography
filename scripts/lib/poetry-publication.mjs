// Shared, source-driven engine for POETRY PUBLICATION imports (Digital Library — Poetry, Wave 4 P2+).
//
// A poetry publication is ONE catalogue work whose printed contents are many numbered poems. This
// engine assembles the 58-item (or N-item) reading structure from the pinned source workspace, item
// by item, and emits ONE publication.json plus one provenance.json. It is the publication analogue
// of scripts/lib/standalone-poem.mjs, deliberately kept SEPARATE from it: the standalone engine's
// four payloads are byte-frozen and must not move, and a publication reads a different source shape
// (a per-item sections/ + translations/en/items/ layout, not a single-work document).
//
// Everything algorithmic lives here; everything a particular publication's source states lives in
// scripts/publication-declarations/<slug>.mjs. The engine supplies NO default for a per-work fact
// and fails closed on anything it was not told: an unrecognised marker, a scan a section does not
// carry, an item whose released English disagrees with the reader-facing assembly, a slug that
// collides or is reserved, an ordinal that is out of sequence.
//
// PAGE TRANSITIONS ARE NEUTRAL HERE. Between two scan blocks of one item the engine emits a
// page-transition whose stanzaRelation is "unknown" and textualRelation "not-specifically-recorded"
// with empty evidence — it asserts NEITHER that the printed stanza continues NOR that a new one
// begins. That is the honest representation: this publication's source records item boundaries,
// scan ranges and title witnesses, but not a per-transition printed-stanza relation, so none is
// claimed. The reader renders it as a neutral source-scan marker, exactly as it does for standalone
// poems.
//
// Used by scripts/import-poetry-publication.mjs. Never writes to the source clone.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const readText = (p) => fs.readFileSync(p, "utf8");

// ── Source pin ───────────────────────────────────────────────────────────────────────────────────
export function assertSourcePin(srcRepo, srcCommit, workRelPath, expectedTree) {
  let head, tree;
  try {
    head = execFileSync("git", ["-C", srcRepo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    tree = execFileSync("git", ["-C", srcRepo, "rev-parse", `${srcCommit}:${workRelPath}`], { encoding: "utf8" }).trim();
  } catch (e) {
    throw new Error(`unable to read git state of source clone at ${srcRepo}: ${e.message}`);
  }
  if (head !== srcCommit) {
    throw new Error(`source-commit mismatch: supplied ${srcCommit} but ${srcRepo} HEAD is ${head}.`);
  }
  if (expectedTree && tree !== expectedTree) {
    throw new Error(
      `work-tree mismatch: ${workRelPath} at ${srcCommit} is ${tree}, expected the frozen ${expectedTree}. ` +
        `The Wave-4 source freeze is reopened in that situation and the import must not proceed.`,
    );
  }
  return tree;
}

// ── Markdown / frontmatter helpers ───────────────────────────────────────────────────────────────
const COMMENT = /^<!--[\s\S]*-->$/;
const HEADING = /^(#{1,6})\s+(.*\S)\s*$/;

function stripFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const mm = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!mm) continue;
    let v = mm[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    fm[mm[1]] = v;
  }
  return { fm, body: text.slice(m[0].length) };
}

/** Parse an en-dash / hyphen page-or-scan range like "10–11", "213–219, 221" into PageRun[]. */
export function parseRuns(spec) {
  const runs = [];
  for (const part of String(spec).split(",")) {
    const t = part.trim();
    if (!t) continue;
    const m = /^(\d+)\s*[–\-]\s*(\d+)$/.exec(t) || /^(\d+)$/.exec(t);
    if (!m) throw new Error(`unparseable range segment ${JSON.stringify(part)} in ${JSON.stringify(spec)}`);
    const first = Number(m[1]);
    const last = m[2] !== undefined ? Number(m[2]) : first;
    if (last < first) throw new Error(`descending range ${JSON.stringify(part)}`);
    runs.push({ first, last });
  }
  if (!runs.length) throw new Error(`empty range ${JSON.stringify(spec)}`);
  return runs;
}
const runsToScans = (runs) => runs.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i));

// ── Line construction ────────────────────────────────────────────────────────────────────────────
// Leading indentation is carried as a source fact (`indent` = exact leading-space count), never
// normalized. Unlike the four standalone poems, this publication's verse uses free-width indentation
// rather than a 4-space step, so no multiple-of-N rule is imposed: the count is whatever the released
// source line carries, and a tab — which would make an indent count meaningless — is refused.
function line(raw, scan, printedPage) {
  const text = raw.replace(/\s+$/, "");
  if (/^\s*\t/.test(text)) throw new Error(`tab indentation on scan ${scan}, refusing to guess a width: ${JSON.stringify(raw)}`);
  const indent = text.length - text.trimStart().length;
  return { kind: "line", text: text.slice(indent), indent, sourceScan: scan, printedPage };
}

const neutralTransition = (fromScan, toScan) => ({
  kind: "page-transition",
  fromScan,
  toScan,
  stanzaRelation: "unknown",
  textualRelation: "not-specifically-recorded",
  evidence: { stanza: [], textual: [] },
});

// ── Layer metrics (identical shape to the standalone PoemLayer) ───────────────────────────────────
function layerOf(elements) {
  const lines = elements.filter((e) => e.kind === "line");
  const breaks = elements.filter((e) => e.kind === "stanza-break");
  const pages = elements.filter((e) => e.kind === "page-transition");
  const headings = elements.filter((e) => e.kind === "source-heading");
  let runs = 0;
  let inRun = false;
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
    sourceHeadings: headings.length || undefined,
  };
}

// ── Per-item reading-layer parse ──────────────────────────────────────────────────────────────────
// Both layers share a structure: a title H1, HTML comments, and scan-delimited blocks of verse with
// blank-line stanza breaks inside a block and a page transition between blocks. The Tamil marker is
// `<!-- scan_page: N -->`; the English marker is `<!-- scan N -->`. Only the English carries the
// occasional Markdown structural heading (item 14's `### Scene 1`), which the Tamil renders as an
// ordinary content line — a real cross-layer asymmetry that is preserved rather than reconciled.
function parseLayer(body, { markerRe, allowHeadings, printedPageFor }) {
  const lines = body.split("\n");
  const els = [];
  let scan = null;
  let printed = null;
  let emittedInBlock = 0;
  let pendingBlank = false;
  let sawTitle = false;
  const seenScans = [];
  for (const raw of lines) {
    const t = raw.trim();
    const marker = markerRe.exec(t);
    if (marker) {
      if (scan !== null) els.push(neutralTransition(scan, Number(marker[1])));
      scan = Number(marker[1]);
      printed = printedPageFor(scan);
      seenScans.push(scan);
      emittedInBlock = 0;
      pendingBlank = false;
      continue;
    }
    if (COMMENT.test(t)) continue;
    if (!sawTitle && /^#\s/.test(t)) {
      sawTitle = true; // the item title H1 is metadata, not verse
      continue;
    }
    if (scan === null) {
      if (t !== "") throw new Error(`verse appears before any scan marker: ${JSON.stringify(raw)}`);
      continue;
    }
    if (t === "") {
      if (emittedInBlock > 0) pendingBlank = true;
      continue;
    }
    const h = HEADING.exec(t);
    if (h) {
      if (!allowHeadings) throw new Error(`unexpected Markdown heading in a layer that declares none: ${JSON.stringify(raw)}`);
      // A structural heading the released translation prints inside the item (e.g. `### Scene 1`).
      if (pendingBlank) {
        els.push({ kind: "stanza-break", evidence: "source-blank-line", sourceScan: scan });
        pendingBlank = false;
      }
      els.push({ kind: "source-heading", text: h[2], sourceScan: scan, printedPage: printed });
      emittedInBlock++;
      continue;
    }
    if (pendingBlank) {
      els.push({ kind: "stanza-break", evidence: "source-blank-line", sourceScan: scan });
      pendingBlank = false;
    }
    els.push(line(raw, scan, printed));
    emittedInBlock++;
  }
  return { layer: layerOf(els), seenScans };
}

// Reconstruct the raw verse/heading/marker stream of a released English body, for the byte-equality
// proof against the reader-facing assembly. Blank lines and the title H1 are dropped; scan markers,
// headings and verse lines are kept verbatim.
function englishBodyStream(body) {
  const out = [];
  let sawTitle = false;
  for (const raw of body.split("\n")) {
    const t = raw.trim();
    if (t === "") continue;
    if (COMMENT.test(t)) {
      if (/^<!--\s*scan\s+\d+\s*-->$/.test(t)) out.push(t);
      continue;
    }
    if (!sawTitle && /^#\s/.test(t)) {
      sawTitle = true;
      continue;
    }
    out.push(raw.replace(/\s+$/, ""));
  }
  return out;
}

// ── Build one publication ─────────────────────────────────────────────────────────────────────────
export function buildPublication({ decl, srcRepo, srcCommit, sourceTree }) {
  const workDir = path.join(srcRepo, decl.sourcePath);

  // Source identity, asserted against the workspace's own metadata record.
  const meta = readText(path.join(workDir, "metadata/source.md"));
  for (const [label, needle] of [
    ["scan filename", decl.scan.filename],
    ["scan SHA-256", decl.scan.sha256],
    ["scan size", decl.scan.sizeText],
    ["physical scan count", String(decl.scan.totalScans)],
  ]) {
    if (!meta.includes(needle)) throw new Error(`source identity mismatch: metadata/source.md does not record ${label} (${needle})`);
  }

  // The reader-facing combined English assembly, split into per-item slices on its `## Item N —`
  // headers. This is a DIFFERENT artifact from the per-item files the reading layer is built from,
  // so proving each item file equals its slice ties the two released English witnesses together.
  const asm = readText(path.join(workDir, decl.english.assemblyFile));
  const asmSlices = sliceAssembly(asm);

  const items = [];
  const seenSlugs = new Set();
  for (const d of decl.items) {
    const ord = d.ordinal;
    // Tamil section
    const secRaw = readText(path.join(workDir, `sections/${String(ord).padStart(2, "0")}.md`));
    const { fm: secFm, body: secBody } = stripFrontmatter(secRaw);
    if (Number(secFm.item) !== ord) throw new Error(`item ${ord}: sections/${String(ord).padStart(2, "0")}.md declares item ${secFm.item}`);
    if (secFm.title !== d.titleTa) throw new Error(`item ${ord}: section title ${JSON.stringify(secFm.title)} != declared ${JSON.stringify(d.titleTa)}`);
    const contentsTitleTa = secFm.contents_title !== secFm.title ? secFm.contents_title : undefined;
    if ((contentsTitleTa ?? null) !== (d.contentsTitleTa ?? null)) {
      throw new Error(`item ${ord}: contents-title witness ${JSON.stringify(contentsTitleTa)} != declared ${JSON.stringify(d.contentsTitleTa)}`);
    }
    const physicalScans = parseRuns(secFm.physical_scans);
    const printedPages = secFm.printed_pages ? parseRuns(secFm.printed_pages) : undefined;
    const scans = runsToScans(physicalScans);
    const printedFor = (scan) => {
      // printed page = physical scan − 1 across the numbered block (source-established rule); the
      // per-item printed_pages range is the witness this is checked against below.
      return scan - 1;
    };

    const ta = parseLayer(secBody, { markerRe: /^<!--\s*scan_page:\s*(\d+)\s*-->$/, allowHeadings: false, printedPageFor: printedFor });
    if (JSON.stringify(ta.seenScans) !== JSON.stringify(scans)) {
      throw new Error(`item ${ord}: Tamil scans ${JSON.stringify(ta.seenScans)} != declared physical scans ${JSON.stringify(scans)}`);
    }

    // English per-item file
    const enPath = path.join(workDir, "translations/en/items", `${String(ord).padStart(2, "0")}-${d.slug}-en.md`);
    const enRaw = readText(enPath);
    const { fm: enFm, body: enBody } = stripFrontmatter(enRaw);
    if (Number(enFm.item) !== ord) throw new Error(`item ${ord}: English item file declares item ${enFm.item}`);
    if (enFm.title_en !== d.titleEn) throw new Error(`item ${ord}: English title ${JSON.stringify(enFm.title_en)} != declared ${JSON.stringify(d.titleEn)}`);
    if (enFm.title_ta !== d.titleTa) throw new Error(`item ${ord}: English file title_ta ${JSON.stringify(enFm.title_ta)} != declared ${JSON.stringify(d.titleTa)}`);
    const en = parseLayer(enBody, { markerRe: /^<!--\s*scan\s+(\d+)\s*-->$/, allowHeadings: true, printedPageFor: printedFor });
    if (JSON.stringify(en.seenScans) !== JSON.stringify(scans)) {
      throw new Error(`item ${ord}: English scans ${JSON.stringify(en.seenScans)} != declared physical scans ${JSON.stringify(scans)}`);
    }

    // PROVE the per-item English body equals the reader-facing assembly slice, line for line.
    const slice = asmSlices.get(ord);
    if (!slice) throw new Error(`item ${ord}: no assembly slice found`);
    if (slice.titleEn !== d.titleEn) throw new Error(`item ${ord}: assembly header title ${JSON.stringify(slice.titleEn)} != declared ${JSON.stringify(d.titleEn)}`);
    const a = englishBodyStream(enBody);
    const b = englishBodyStream("# x\n" + slice.body); // assembly slice has no per-item H1; add a dummy so both strip one
    if (a.length !== b.length) throw new Error(`item ${ord}: English item file has ${a.length} stream lines but the assembly slice has ${b.length}`);
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) throw new Error(`item ${ord}: English item file diverges from the reader-facing assembly at stream line ${i + 1}:\n  item:     ${a[i]}\n  assembly: ${b[i]}`);
    }

    // printed-page witness: every line's printedPage must fall inside the declared printed_pages runs.
    if (printedPages) {
      const inRuns = (p) => printedPages.some((r) => p >= r.first && p <= r.last);
      for (const e of [...ta.layer.elements, ...en.layer.elements]) {
        if ((e.kind === "line" || e.kind === "source-heading") && e.printedPage != null && !inRuns(e.printedPage)) {
          throw new Error(`item ${ord}: derived printed page ${e.printedPage} (scan ${e.sourceScan}) is outside the declared printed pages ${JSON.stringify(secFm.printed_pages)}`);
        }
      }
    }

    if (seenSlugs.has(d.slug)) throw new Error(`duplicate item slug ${JSON.stringify(d.slug)}`);
    seenSlugs.add(d.slug);
    if (decl.reservedSegments.includes(d.slug)) throw new Error(`item slug ${JSON.stringify(d.slug)} collides with a reserved route segment`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) throw new Error(`item slug ${JSON.stringify(d.slug)} fails the slug pattern`);

    const item = {
      ordinal: ord,
      slug: d.slug,
      titleTa: d.titleTa,
      ...(contentsTitleTa ? { contentsTitleTa } : {}),
      titleEn: d.titleEn,
      ...(secFm.printed_item_number ? { printedOrdinal: Number(secFm.printed_item_number) } : {}),
      physicalScans,
      ...(printedPages ? { printedPages } : {}),
      tamil: ta.layer,
      english: en.layer,
    };
    items.push(item);
  }

  // Ordinals are exactly 1..N in order.
  const ordinals = items.map((i) => i.ordinal);
  const expected = Array.from({ length: decl.items.length }, (_, i) => i + 1);
  if (JSON.stringify(ordinals) !== JSON.stringify(expected)) {
    throw new Error(`item ordinals ${JSON.stringify(ordinals)} are not exactly 1..${decl.items.length} in order`);
  }
  if (items.length !== decl.itemCount) throw new Error(`assembled ${items.length} items but declared itemCount ${decl.itemCount}`);

  const publication = {
    workId: decl.slug,
    slug: decl.slug,
    sourceRepo: decl.sourceRepo,
    sourcePath: decl.sourcePath,
    sourceCommit: srcCommit,
    sourceTree,
    shelf: "poetry",
    readerStructure: "poetry-publication",
    subtype: "poetry-publication",
    title: decl.title,
    author: decl.author,
    publicationYear: decl.publicationYear,
    editionStatement: decl.editionStatement,
    itemCount: decl.itemCount,
    items,
  };

  const provenance = buildProvenance({ decl, srcCommit, sourceTree, items, asmSlices });
  return { publication, provenance, asmSlices };
}

// Split the reader-facing assembly into per-item slices on `## Item N — <title>` headers.
function sliceAssembly(asm) {
  const lines = asm.split("\n");
  const slices = new Map();
  let cur = null;
  for (const raw of lines) {
    const m = /^##\s+Item\s+(\d+)\s+—\s+(.*\S)\s*$/.exec(raw);
    if (m) {
      cur = { ordinal: Number(m[1]), titleEn: m[2], lines: [] };
      slices.set(cur.ordinal, cur);
      continue;
    }
    if (cur) cur.lines.push(raw);
  }
  const out = new Map();
  for (const [ord, s] of slices) out.set(ord, { titleEn: s.titleEn, body: s.lines.join("\n") });
  return out;
}

function buildProvenance({ decl, srcCommit, sourceTree, items, asmSlices }) {
  const witnessItems = items.filter((i) => i.contentsTitleTa);
  return {
    workId: decl.slug,
    sourceRepo: decl.sourceRepo,
    sourcePath: decl.sourcePath,
    sourceCommit: srcCommit,
    sourceTree,
    source: {
      titleTa: decl.title.ta,
      titleEn: decl.title.en,
      authorTa: decl.author.nameTa,
      authorEn: decl.author.nameEn,
      scanFilename: decl.scan.filename,
      scanSha256: decl.scan.sha256,
      scanFileSizeBytes: decl.scan.sizeBytes,
      scanTotalPages: decl.scan.totalScans,
      sourcePdfCommitted: false,
      sourceTypeLabel: decl.sourceTypeLabel,
      publicationEstablished: decl.publicationEstablished,
      paginationNote: decl.paginationNote,
      boundaryNote: decl.boundaryNote,
      lockedExclusions: decl.lockedExclusions,
    },
    verification: decl.verification,
    itemRoster: items.map((i) => ({
      ordinal: i.ordinal,
      slug: i.slug,
      titleTa: i.titleTa,
      contentsTitleTa: i.contentsTitleTa,
      titleEn: i.titleEn,
      printedOrdinal: i.printedOrdinal,
      physicalScans: i.physicalScans,
      printedPages: i.printedPages,
      tamilLines: i.tamil.lineCount,
      englishLines: i.english.lineCount,
    })),
    titleWitnesses: {
      count: witnessItems.length,
      note: decl.titleWitnessNote,
      items: witnessItems.map((i) => ({ ordinal: i.ordinal, titlePageWitness: i.titleTa, contentsWitness: i.contentsTitleTa })),
    },
    itemNumberingAnomalies: items
      .filter((i) => i.printedOrdinal !== undefined && i.printedOrdinal !== i.ordinal)
      .map((i) => ({ ordinal: i.ordinal, printedNumber: i.printedOrdinal, note: decl.itemNumberingNote })),
    projectRights: decl.projectRights,
    notes: decl.notes({ items }),
  };
}

export function writePublication(outDir, publication, provenance) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "publication.json"), JSON.stringify(publication, null, 1) + "\n");
  fs.writeFileSync(path.join(outDir, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");
}

export function reportPublication(outDir, built) {
  const { publication } = built;
  const taLines = publication.items.reduce((n, i) => n + i.tamil.lineCount, 0);
  const enLines = publication.items.reduce((n, i) => n + i.english.lineCount, 0);
  const withHeadings = publication.items.filter((i) => i.english.sourceHeadings).length;
  const witnesses = publication.items.filter((i) => i.contentsTitleTa).length;
  console.log("publication:", publication.slug);
  console.log("  items:", publication.items.length, "| tamil lines:", taLines, "| english lines:", enLines);
  console.log("  title-witness items:", witnesses, "| items with English source-headings:", withHeadings);
  console.log("  scan coverage:", publication.items[0].physicalScans[0].first, "…", publication.items.at(-1).physicalScans.at(-1).last);
  console.log("  publication.json sha256:", sha256(readText(path.join(outDir, "publication.json"))));
  console.log("  provenance.json sha256: ", sha256(readText(path.join(outDir, "provenance.json"))));
}
