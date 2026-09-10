// Shared IMPORTER helpers for Wave-6 Batch-5 novels (பெரிய இடத்துப் பெண், புதையல்).
//
// These two novels ship their OWN audited assembled reading layer (`sections/`), exactly like the
// first novel benchmark (பலிபீடம் நோக்கி). This module reads that layer BYTE-FAITHFULLY and never
// normalizes literary text. It is used only by the two Batch-5 importers; the independent validator
// (scripts/validate-novels-wave6.mjs) re-derives source truth with its OWN, separate implementation
// and must agree with what these importers emit.
//
// ── FIDELITY CONTRACT (the Batch-5 rule) ─────────────────────────────────────────────────────────
// The emitted literary text of a block is the source bytes with ONLY the HTML provenance comments
// removed. There is NO trim(), NO trimEnd(), NO whitespace collapse, NO Unicode/punctuation/quote/
// dash/Tamil normalization and NO editorial repair — the Poetry-batch `literalWhitespace` lesson,
// applied to prose. Structural recognition (headings, blank-line block boundaries) uses a separate
// probe; the value that is emitted always comes from the raw source value.

import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

export const readText = (p) => fs.readFileSync(p, "utf8");
export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
// Tamil can reach us in different Unicode normal forms; identity comparisons (filenames, headings)
// are made on NFC. Literary BODY text is never normalized — nfc() is used only for identity probes.
export const nfc = (s) => s.normalize("NFC");

/** Fail closed BEFORE any write if the source clone is not exactly at the pinned commit. */
export function assertSourceHead(repo, commit) {
  let head;
  try {
    head = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch (e) {
    throw new Error(`unable to read git HEAD of source clone at ${repo}: ${e.message}`);
  }
  if (head !== commit) {
    throw new Error(
      `source-commit mismatch: supplied ${commit} but ${repo} HEAD is ${head}. ` +
        `Refusing to generate data with a commit SHA that does not match the checked-out source tree.`,
    );
  }
  return head;
}

/** Parse leading YAML front matter. Values keep their exact bytes (only surrounding quotes removed). */
export function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error("missing YAML front matter");
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return { fm, body: text.slice(m[0].length) };
}

// A provenance comment. `source:` / `source scan(s)` / `source split` / `source range` carry scan and
// printed-page attribution; `source join` / `source boundary` mark a continuity at the exact point.
const COMMENT = /<!--[\s\S]*?-->/g;
const SCAN_RE = /scan\s*(\d+)/gi;
const PRINTED_RE = /printed(?:\s*page)?\s*:?\s*(\d+)/i;

/** All scans named in a comment, in order (deduped-preserving). */
function scansIn(text) {
  return [...text.matchAll(SCAN_RE)].map((m) => Number(m[1]));
}

/**
 * Parse a PER-RUN trailing `source*` marker into ordered {scan, printedPage} pages.
 *
 * A per-run marker names one scan (`scan 13; printed page: 12`) or a transition
 * (`scan 13 / printed 12 → scan 14 / printed 13`, or the terse `scan 7 → 8`). Every named scan
 * becomes a page, its printedPage taken only where the marker prints one for it. A section SUMMARY
 * marker (`scans 46-49 / printed pages 45-48`) uses the plural `scans` with a hyphen range and names
 * no single run — it yields NO pages, so blocks it "closes" keep `[]` and rely on the section's own
 * front-matter scan coverage. `scan` (singular, whitespace-delimited) never matches `scans`.
 */
function parsePages(spec) {
  const out = [];
  let sawScan = false;
  for (const part of spec.split(/→|->/)) {
    const s = /\bscan\s+(\d+)/i.exec(part); // singular `scan N` only — excludes plural `scans`
    if (s) {
      sawScan = true;
      const p = PRINTED_RE.exec(part);
      out.push({ scan: Number(s[1]), printedPage: p ? Number(p[1]) : null });
    } else if (sawScan) {
      // A terse continuation like `→ 8`: a bare scan number after an explicit `scan N`.
      const b = /(\d+)/.exec(part);
      if (b) {
        const p = PRINTED_RE.exec(part);
        out.push({ scan: Number(b[1]), printedPage: p ? Number(p[1]) : null });
      }
    }
  }
  return out;
}

const isBlank = (line) => /^\s*$/.test(line);
const isStandaloneComment = (line) => /^\s*<!--[\s\S]*-->\s*$/.test(line);
const isSourceMarker = (line) => /^\s*<!--\s*source\b/i.test(line.trim()) && isStandaloneComment(line);

/**
 * Byte-faithful section parser.
 *
 * Blocks are runs of consecutive literary lines. A standalone `source*` comment closes the run above
 * it and supplies that run's page attribution (the assembled layer's trailing-marker convention). An
 * inline comment inside a text line is stripped from display and, when it names ≥2 scans, recorded as
 * a join. English apparatus — a labelled `> **X:**` blockquote — is captured as a note and kept OUT
 * of the body. Nothing else is transformed: a block's text is its source lines, verbatim, with only
 * the comment spans removed.
 */
export function parseSection(rawFileText, { english }) {
  const { fm, body } = frontMatter(rawFileText);
  const lines = body.split("\n");

  const blocks = [];
  const rawBlocks = []; // comment-stripped run text WITH prefixes, for the byte round-trip check
  const notes = [];
  const joins = [];
  let pending = []; // literary blocks awaiting a trailing source marker
  let run = null; // current run of literary lines being accumulated
  let noteBuf = null; // current blockquote-note buffer

  const flushNote = () => {
    if (noteBuf) {
      const raw = noteBuf.join("\n");
      const label = /^>\s*\*\*(.+?):\*\*/.exec(noteBuf[0]);
      notes.push({
        kind: "translator-note",
        heading: label ? label[1] : "Note",
        text: raw.replace(/^>\s?/gm, "").replace(COMMENT, "").trim(),
      });
      noteBuf = null;
    }
  };

  const closeRun = () => {
    if (!run) return;
    // Strip comment spans from the run's literary text (display), collecting inline joins first.
    const rawJoined = run.join("\n");
    for (const m of rawJoined.matchAll(COMMENT)) {
      const c = m[0];
      if (/source\s+(join|boundary|split|range)/i.test(c)) {
        const sc = scansIn(c);
        if (sc.length >= 2) joins.push({ fromScan: sc[0], toScan: sc[1], evidence: c.replace(/^<!--\s?/, "").replace(/\s?-->$/, "").trim() });
      }
    }
    const stripped = rawJoined.replace(COMMENT, "");
    if (stripped.trim() === "") { run = null; return; } // a run that was only comments
    rawBlocks.push(stripped);
    const headMatch = /^(#{1,6})\s/.exec(stripped);
    let block;
    if (headMatch) {
      block = { kind: "heading", level: headMatch[1].length, text: stripped.replace(/^#{1,6}\s*/, ""), hasLineBreaks: false, sourcePages: [] };
    } else if (/^[★✾]+$/.test(stripped.trim()) && !stripped.includes("\n")) {
      block = { kind: "ornament", text: stripped.trim(), hasLineBreaks: false, sourcePages: [] };
    } else {
      block = { kind: "paragraph", text: stripped, hasLineBreaks: stripped.includes("\n"), sourcePages: [] };
    }
    blocks.push(block);
    pending.push(block);
    run = null;
  };

  for (const line of lines) {
    // A labelled blockquote note (`> **Label:** …`) is editorial apparatus in EITHER language — the
    // assembled Tamil files also embed the English provenance blockquotes. Never body; captured as a
    // note (only the English notes are surfaced downstream).
    if (/^>\s*\*\*.+?:\*\*/.test(line)) {
      closeRun();
      flushNote();
      noteBuf = [line];
      continue;
    }
    if (noteBuf) {
      if (line.startsWith(">") || (!isBlank(line) && !/^#{1,6}\s/.test(line) && !isStandaloneComment(line))) {
        // continuation of the blockquote (blockquotes may wrap onto un-prefixed lines)
        if (line.startsWith(">")) { noteBuf.push(line); continue; }
      }
      if (isBlank(line)) { flushNote(); continue; }
      flushNote();
    }

    if (isSourceMarker(line)) {
      // Trailing marker: attach its pages to the run above, then to any earlier un-attributed blocks.
      closeRun();
      const inner = line.trim().replace(/^<!--\s?/, "").replace(/\s?-->$/, "");
      const spec = inner.replace(/^source\s*(scans?|split|range)?\s*:?/i, "");
      const pages = parsePages(spec);
      if (pages.length) {
        for (const b of pending) if (b.sourcePages.length === 0) b.sourcePages = pages;
        pending = [];
      }
      continue;
    }
    if (isStandaloneComment(line)) {
      // A non-source standalone comment (structural `<!-- Chapter … -->`, `<!-- scan … -->`): apparatus.
      closeRun();
      continue;
    }
    if (isBlank(line)) {
      closeRun();
      continue;
    }
    // literary line
    if (!run) run = [];
    run.push(line);
  }
  closeRun();
  flushNote();

  return { fm, blocks, rawBlocks, notes, joins };
}

/**
 * INDEPENDENT literal stream used for the importer's own byte round-trip self-check. Returns the
 * source body with every comment span removed, split into blocks (runs of non-blank lines) with each
 * block's exact bytes preserved. English `> **X:**` blockquote notes are dropped (apparatus).
 */
export function literalBlocks(rawFileText, { english }) {
  const { body } = frontMatter(rawFileText);
  const cleaned = body.replace(COMMENT, "");
  const out = [];
  let run = null;
  let inNote = false;
  for (const line of cleaned.split("\n")) {
    if (/^>\s*\*\*.+?:\*\*/.test(line)) { if (run) { out.push(run.join("\n")); run = null; } inNote = true; continue; }
    if (inNote) { if (isBlank(line)) inNote = false; else if (line.startsWith(">")) continue; else inNote = false; if (inNote) continue; if (isBlank(line)) continue; }
    if (isBlank(line)) { if (run) { out.push(run.join("\n")); run = null; } continue; }
    if (!run) run = [];
    run.push(line);
  }
  if (run) out.push(run.join("\n"));
  return out;
}
