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
    if (v.startsWith('"') && v.endsWith('"')) {
      // Double-quoted YAML scalar: unescape \" and \\ so an embedded straight quote (items 36/37
      // here) matches its unescaped form in the reader-facing assembly header. Curly quotes (காலப்
      // பேழை) carry no backslash and are unaffected.
      v = v.slice(1, -1).replace(/\\(["\\])/g, "$1");
    }
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

// Parse the authoritative `## Anthology group structure` table from a source group-map document.
// Columns: ordinal | contents witness | canonical authority | item range | separate structural scans.
// A `code`-quoted witness is unwrapped; the structural-scan cell yields the explicit scan numbers it
// names (an "N–M" run or an "N–M" pair), or [] when it only describes item-01 sharing.
function parseSourceGroupTable(text) {
  const start = text.indexOf("## Anthology group structure");
  if (start < 0) throw new Error("group map: no `## Anthology group structure` section");
  const section = text.slice(start, text.indexOf("\n## ", start + 1) < 0 ? text.length : text.indexOf("\n## ", start + 1));
  const rows = [];
  for (const line of section.split("\n")) {
    const m = /^\|\s*(\d+)\s*\|(.+)\|\s*$/.exec(line);
    if (!m) continue;
    const cells = m[2].split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const unq = (c) => c.replace(/^`|`$/g, "");
    const rangeCell = cells[2].replace(/[`]/g, "").trim();
    const rr = /^(\d+)\s*[–-]\s*(\d+)$/.exec(rangeCell) || /^(\d+)$/.exec(rangeCell);
    const scanCell = cells[3];
    const structural = [];
    const sm = /(\d+)\s*[–-]\s*(\d+)/.exec(scanCell);
    if (sm && !/item 01|within item/i.test(scanCell)) for (let n = Number(sm[1]); n <= Number(sm[2]); n++) structural.push(n);
    rows.push({
      ordinal: Number(m[1]),
      contents: unq(cells[0]),
      canonical: unq(cells[1]),
      itemFirst: Number(rr[1]),
      itemLast: rr[2] !== undefined ? Number(rr[2]) : Number(rr[1]),
      structural,
      sharesItem01: /shares item 01|within item 01/i.test(scanCell),
    });
  }
  return rows;
}


/**
 * The VISIBLE printed-page numeral for one physical scan, read from the frozen page record.
 *
 * This is the crux of the visible-vs-logical distinction. The publication's structural rule is
 * "logical printed page = physical scan − 1", but that is reconciled pagination, not a claim that a
 * numeral is printed: 58 scans (every item-opening title page) print no page number at all and record
 * `printed_page: null`. `PoemLine.printedPage` is the VISIBLE numeral, so it must come from here — the
 * page record — never from scan − 1. A missing or malformed record fails the import; nothing falls
 * back to scan − 1, null, or the section's logical range.
 */
function loadPageRecord(workDir, scan, slug, logicalOffset) {
  const rel = `pages/${String(scan).padStart(4, "0")}.md`;
  const abs = path.join(workDir, rel);
  if (!fs.existsSync(abs)) throw new Error(`missing page record ${rel} for scan ${scan} — the import will not fall back to scan − 1`);
  const { fm } = stripFrontmatter(readText(abs));
  if (Number(fm.scan_page) !== scan) throw new Error(`${rel}: scan_page ${fm.scan_page} != ${scan}`);
  if (fm.work !== slug) throw new Error(`${rel}: work ${JSON.stringify(fm.work)} != ${JSON.stringify(slug)}`);
  if (fm.status !== "verified") throw new Error(`${rel}: status ${JSON.stringify(fm.status)} is not "verified"`);
  const raw = (fm.printed_page ?? "").trim();
  let printedPage;
  if (raw === "null") printedPage = null;
  else if (/^\d+$/.test(raw)) printedPage = Number(raw);
  else throw new Error(`${rel}: unparseable printed_page ${JSON.stringify(fm.printed_page)} — expected a number or null`);
  // Source-internal consistency: where a CONSTANT reconciliation offset holds (காலப் பேழை, offset 1)
  // a visible numeral must equal scan − offset. Where no constant offset applies (கலைஞரின் கவிதைகள்),
  // the visible numeral is trusted as read and checked instead against the item's logical range.
  if (typeof logicalOffset === "number" && printedPage !== null && printedPage !== scan - logicalOffset) {
    throw new Error(`${rel}: visible printed_page ${printedPage} disagrees with the reconciled rule (scan − ${logicalOffset} = ${scan - logicalOffset})`);
  }
  return { printedPage, section: fm.section ?? null };
}

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
// `<!-- scan_page: N -->`; the English marker is `<!-- scan N -->`. EITHER layer may carry Markdown
// structural headings the release establishes: காலப் பேழை has them only in English (item 14's
// `### Scene 1`, an asymmetry preserved rather than reconciled), while கலைஞரின் கவிதைகள் reprints an
// item's title as a `###` heading in BOTH layers. `allowHeadings` is set per layer by the caller.
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
function englishBodyStream(body, validScans) {
  const out = [];
  let sawTitle = false;
  for (const raw of body.split("\n")) {
    const t = raw.trim();
    if (t === "") continue;
    const m = /^<!--\s*scan\s+(\d+)\s*-->$/.exec(t);
    if (m) {
      // In the reader-facing assembly a group-divider scan marker can trail an item's region before
      // the next group header. Truncate at the first scan marker that is NOT one of this item's own
      // scans, so divider structure is never compared as item verse.
      if (validScans && !validScans.has(Number(m[1]))) break;
      out.push(t);
      continue;
    }
    if (COMMENT.test(t)) continue;
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
  const { slices: asmSlices, groupTitles } = sliceAssembly(asm);

  const items = [];
  const seenSlugs = new Set();
  const sectionOwner = new Map();
  // Reconciled logical page = physical scan − offset, applied run-by-run WHEN a constant offset
  // holds (காலப் பேழை, offset 1). கலைஞரின் கவிதைகள் has a Roman/Arabic split and divider scans, so
  // no constant offset applies there; it declares `logicalPageOffset: null` and the logical pages
  // are proved against the source printed_pages and the visible numerals instead.
  const logicalOffset = decl.logicalPageOffset === undefined ? 1 : decl.logicalPageOffset;
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
    // The section's `printed_pages:` frontmatter is the source-established RECONCILED LOGICAL page
    // run list. It is taken from the source EXACTLY (run count, order and every boundary), never
    // derived: காலப் பேழை happens to satisfy logical = scan − 1 and verifies that constant offset
    // separately, while கலைஞரின் கவிதைகள் has a Roman/Arabic split and divider scans and so has no
    // constant offset. Either way this is NOT proof a numeral is visibly printed, so it is stored
    // under an explicitly logical name and never used as a line's visible printedPage.
    const logicalPrintedPages = secFm.printed_pages ? parseRuns(secFm.printed_pages) : undefined;
    const scans = runsToScans(physicalScans);
    // Page records — read once per scan, verified, and reused for BOTH the visible numeral and the
    // section-identity guard so a scan is parsed a single time.
    const records = new Map(scans.map((sc) => [sc, loadPageRecord(workDir, sc, decl.slug, logicalOffset)]));
    // SECTION IDENTITY. A page record must belong to the current ITEM, not merely the correct work.
    // The first scan's section is the item's identity and EVERY scan the item consumes must carry
    // exactly that same section — a source-side section change inside one item fails the import. How
    // the section VALUE identifies the item is declaration-driven, because the two publications label
    // it differently: காலப் பேழை uses `item-NN-slug`, கலைஞரின் கவிதைகள் uses the item's canonical
    // Tamil title. Uniqueness across items is enforced globally below.
    const sectionMode = decl.sectionIdentity ?? "ordinal-slug";
    const sectionId = records.get(scans[0]).section;
    if (!sectionId) throw new Error(`item ${ord}: page record for scan ${scans[0]} carries no section id`);
    if (sectionMode === "ordinal-slug") {
      const expectedPrefix = `item-${String(ord).padStart(2, "0")}-`;
      if (!sectionId.startsWith(expectedPrefix)) throw new Error(`item ${ord}: page-record section ${JSON.stringify(sectionId)} does not identify ordinal ${ord} (expected prefix ${JSON.stringify(expectedPrefix)})`);
    } else if (sectionMode === "canonical-title") {
      if (sectionId !== d.titleTa) throw new Error(`item ${ord}: page-record section ${JSON.stringify(sectionId)} != the item's canonical title ${JSON.stringify(d.titleTa)}`);
    } else {
      throw new Error(`unknown sectionIdentity mode ${JSON.stringify(sectionMode)}`);
    }
    for (const sc of scans) {
      const sid = records.get(sc).section;
      if (sid !== sectionId) throw new Error(`item ${ord}: scan ${sc} page record section ${JSON.stringify(sid)} != the item's section ${JSON.stringify(sectionId)}`);
    }
    if (sectionOwner.has(sectionId)) throw new Error(`item ${ord}: section ${JSON.stringify(sectionId)} is already used by item ${sectionOwner.get(sectionId)}`);
    sectionOwner.set(sectionId, ord);
    // VISIBLE printed numerals, from those same records — never scan − 1.
    const printedFor = (scan) => records.get(scan).printedPage;

    // allowHeadings is true for BOTH layers: 8 items reprint their title as a `###` source heading at
    // the top of the poem body (in both the Tamil section and the English item). காலப் பேழை's Tamil
    // has no such heading, so this does not change its output.
    const ta = parseLayer(secBody, { markerRe: /^<!--\s*scan_page:\s*(\d+)\s*-->$/, allowHeadings: true, printedPageFor: printedFor });
    if (JSON.stringify(ta.seenScans) !== JSON.stringify(scans)) {
      throw new Error(`item ${ord}: Tamil scans ${JSON.stringify(ta.seenScans)} != declared physical scans ${JSON.stringify(scans)}`);
    }

    // English per-item file
    const enPath = path.join(workDir, "translations/en/items", `${String(ord).padStart(2, "0")}-${d.slug}-en.md`);
    const enRaw = readText(enPath);
    const { fm: enFm, body: enBodyRaw } = stripFrontmatter(enRaw);
    // The per-item English file ends with translator/source apparatus under a LEVEL-2 header
    // (`## Translator notes`, `## Source note`, …). That apparatus is not verse and the reader-facing
    // assembly keeps it out of the item body, so it is cut here before the reading layer is built.
    // Level-3 headers (`### Conclusion`, `### Love or Valour?`) are source structure and are kept.
    const apparatusAt = enBodyRaw.search(/\n## \S/);
    const enBody = apparatusAt >= 0 ? enBodyRaw.slice(0, apparatusAt) : enBodyRaw;
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
    const scanSet = new Set(scans);
    const a = englishBodyStream(enBody, scanSet);
    const b = englishBodyStream("# x\n" + slice.body, scanSet); // assembly slice has no per-item H1; add a dummy so both strip one
    if (a.length !== b.length) throw new Error(`item ${ord}: English item file has ${a.length} stream lines but the assembly slice has ${b.length}`);
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) throw new Error(`item ${ord}: English item file diverges from the reader-facing assembly at stream line ${i + 1}:\n  item:     ${a[i]}\n  assembly: ${b[i]}`);
    }

    // The reconciled logical range must equal [first scan − 1 .. last scan − 1] for this publication
    // (its structural pagination rule), and every VISIBLE numeral, where a line carries one, must sit
    // inside it. A null visible page (an item's title scan) is fine and is not required to appear.
    if (logicalPrintedPages) {
      // When a constant reconciliation offset holds, prove it run-by-run (not endpoints only, so a
      // non-contiguous mapping cannot be flattened while keeping the same outer endpoints).
      if (logicalOffset !== null) {
        if (logicalPrintedPages.length !== physicalScans.length) {
          throw new Error(`item ${ord}: reconciled logical pages have ${logicalPrintedPages.length} runs but physical scans have ${physicalScans.length}`);
        }
        for (let r = 0; r < physicalScans.length; r++) {
          const phys = physicalScans[r];
          const log = logicalPrintedPages[r];
          if (log.first !== phys.first - logicalOffset || log.last !== phys.last - logicalOffset) {
            throw new Error(`item ${ord}: logical run ${r} (${log.first}–${log.last}) does not correspond to physical run (${phys.first}–${phys.last}) with each boundary − ${logicalOffset}`);
          }
        }
      }
      // Always: every VISIBLE numeral on this item's scans must fall inside its reconciled logical
      // range. This ties the section's printed_pages to the page records' actual printed_page values
      // — an independent source layer — and holds for both publications without a constant offset.
      const inRuns = (pp) => logicalPrintedPages.some((r) => pp >= r.first && pp <= r.last);
      for (const e of [...ta.layer.elements, ...en.layer.elements]) {
        if ((e.kind === "line" || e.kind === "source-heading") && e.printedPage != null && !inRuns(e.printedPage)) {
          throw new Error(`item ${ord}: visible printed page ${e.printedPage} (scan ${e.sourceScan}) is outside the reconciled logical range ${JSON.stringify(secFm.printed_pages)}`);
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
      ...(logicalPrintedPages ? { logicalPrintedPages } : {}),
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

  // ── Anthology groups (optional) ─────────────────────────────────────────────────────────────────
  // Source-established divider structure carried as PUBLICATION STRUCTURE. Dividers are NOT items and
  // never count toward itemCount. The declared groups must PARTITION the roster 1..N in order (no
  // gap, no overlap, no reordering), and any group English title must be the one the source assigns
  // in the reader-facing assembly's `## <ta> — <en>` divider header.
  let groups;
  if (decl.groups) {
    const flat = decl.groups.flatMap((g) => g.itemOrdinals);
    const expected = Array.from({ length: decl.itemCount }, (_, i) => i + 1);
    if (JSON.stringify(flat) !== JSON.stringify(expected)) {
      throw new Error(`groups do not partition items 1..${decl.itemCount} in order: got ${JSON.stringify(flat)}`);
    }
    // No item may belong to two groups (the partition above already guarantees order and completeness).
    if (new Set(flat).size !== flat.length) throw new Error(`an item belongs to two groups: ${JSON.stringify(flat)}`);

    // TWO SOURCE WITNESSES for the group structure. The Tamil/structural facts come from the
    // authoritative `## Anthology group structure` table in the declared group-map file; the English
    // group titles come from the released assembly's divider headers. Every declared group is proved
    // against BOTH, and no fact is inferred.
    const srcRows = decl.groupMapFile ? new Map(parseSourceGroupTable(readText(path.join(workDir, decl.groupMapFile))).map((r) => [r.ordinal, r])) : null;
    const itemScanSet = new Set(items.flatMap((it) => it.physicalScans.flatMap((r) => Array.from({ length: r.last - r.first + 1 }, (_, i) => r.first + i))));
    const allStructural = [];
    groups = decl.groups.map((g) => {
      const groupEn = groupTitles.get(g.titleTa);
      if (g.titleEn !== undefined && g.titleEn !== groupEn) {
        throw new Error(`group ${g.ordinal} (${g.titleTa}): declared English ${JSON.stringify(g.titleEn)} != the assembly divider English ${JSON.stringify(groupEn)}`);
      }
      if (srcRows) {
        const row = srcRows.get(g.ordinal);
        if (!row) throw new Error(`group ${g.ordinal}: not present in the source group table`);
        if (row.canonical !== g.titleTa) throw new Error(`group ${g.ordinal}: source canonical title ${JSON.stringify(row.canonical)} != declared ${JSON.stringify(g.titleTa)}`);
        // The contents witness is distinct only where the source records a difference (group 4).
        const declContents = g.contentsTitleTa ?? g.titleTa;
        if (row.contents !== declContents) throw new Error(`group ${g.ordinal}: source contents witness ${JSON.stringify(row.contents)} != declared ${JSON.stringify(declContents)}`);
        if (row.itemFirst !== g.itemOrdinals[0] || row.itemLast !== g.itemOrdinals[g.itemOrdinals.length - 1]) {
          throw new Error(`group ${g.ordinal}: source item range ${row.itemFirst}–${row.itemLast} != declared ${g.itemOrdinals[0]}–${g.itemOrdinals[g.itemOrdinals.length - 1]}`);
        }
        for (const sc of row.structural) {
          if (itemScanSet.has(sc)) throw new Error(`group ${g.ordinal}: structural divider scan ${sc} is wrongly claimed by an item's physical scans`);
          allStructural.push(sc);
        }
        // Group 1 shares item 01; its title-page scans stay inside item 01 and are NOT counted as
        // pure structural scans.
        if (row.sharesItem01) {
          const it01 = items.find((it) => it.ordinal === 1);
          const first = it01?.physicalScans[0].first;
          if (first !== 18) throw new Error(`group 1: item 01 does not begin at scan 18 (got ${first})`);
        }
      }
      return {
        ordinal: g.ordinal,
        titleTa: g.titleTa,
        ...(g.contentsTitleTa ? { contentsTitleTa: g.contentsTitleTa } : {}),
        ...(g.titleEn ? { titleEn: g.titleEn } : {}),
        itemOrdinals: g.itemOrdinals,
      };
    });
    if (srcRows && decl.expectedStructuralScans !== undefined) {
      const uniq = [...new Set(allStructural)].sort((a, b) => a - b);
      if (uniq.length !== decl.expectedStructuralScans) {
        throw new Error(`expected ${decl.expectedStructuralScans} pure structural scans, source table names ${uniq.length}: ${JSON.stringify(uniq)}`);
      }
    }
  }

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
    ...(groups ? { groups } : {}),
  };

  const provenance = buildProvenance({ decl, srcCommit, sourceTree, items, groups });
  return { publication, provenance, asmSlices };
}

// Split the reader-facing assembly into per-item slices, and capture the anthology's group English
// titles. An item slice is the lines after its `## Item N — <title>` header up to the NEXT
// second-level `## ` header of ANY kind — the next item, a `## <groupTa> — <groupEn>` divider, or a
// `## Translator notes` block — so nothing between items leaks into an item's verse. The group
// divider headers give the group English titles the source assigns.
function sliceAssembly(asm) {
  const lines = asm.split("\n");
  const slices = new Map();
  const groupTitles = new Map(); // group Tamil title -> group English title
  let cur = null;
  for (const raw of lines) {
    const item = /^##\s+Item\s+(\d+)\s+—\s+(.*\S)\s*$/.exec(raw);
    if (item) {
      cur = { ordinal: Number(item[1]), titleEn: item[2], lines: [] };
      slices.set(cur.ordinal, cur);
      continue;
    }
    if (/^##\s/.test(raw)) {
      // Any other second-level header ends the current item slice. A `<ta> — <en>` one (that is not
      // the document's own `<title> — English Translation` header) is a group divider.
      cur = null;
      const g = /^##\s+(.*\S)\s+—\s+(.*\S)\s*$/.exec(raw);
      if (g && g[2] !== "English Translation") groupTitles.set(g[1], g[2]);
      continue;
    }
    if (cur) cur.lines.push(raw);
  }
  const out = new Map();
  for (const [ord, sl] of slices) out.set(ord, { titleEn: sl.titleEn, body: sl.lines.join("\n") });
  return { slices: out, groupTitles };
}

function buildProvenance({ decl, srcCommit, sourceTree, items, groups }) {
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
      logicalPrintedPages: i.logicalPrintedPages,
      tamilLines: i.tamil.lineCount,
      englishLines: i.english.lineCount,
    })),
    titleWitnesses: {
      count: witnessItems.length,
      note: decl.titleWitnessNote,
      items: witnessItems.map((i) => ({ ordinal: i.ordinal, titlePageWitness: i.titleTa, contentsWitness: i.contentsTitleTa })),
    },
    groups: groups
      ? groups.map((g) => ({ ordinal: g.ordinal, titleTa: g.titleTa, contentsTitleTa: g.contentsTitleTa, titleEn: g.titleEn, itemCount: g.itemOrdinals.length, firstItem: g.itemOrdinals[0], lastItem: g.itemOrdinals[g.itemOrdinals.length - 1] }))
      : undefined,
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
