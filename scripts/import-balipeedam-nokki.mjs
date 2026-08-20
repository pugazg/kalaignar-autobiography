// Deterministic, work-specific importer for பலிபீடம் நோக்கி / "Towards the Sacrificial Altar"
// (Digital Library — Fiction; first novel benchmark). A 1947 first-edition novel by Kalaignar
// M. Karunanidhi whose central episode is staged as an internal film.
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-novels
// (works/balipeedam-nokki) at a pinned commit, and vendors static bilingual reader data into this
// website under public/data/novels/balipeedam-nokki/. Runtime never calls GitHub. The source PDF is
// never read and never vendored. The source clone is never modified.
//
// ── WHAT THIS IMPORTER DOES *NOT* DECIDE ────────────────────────────────────────────────────────
// Unlike the Poetry and Essays benchmarks, this source ships its OWN audited **assembled reading
// layer** (`sections/`), built from the 34 verified page records with every cross-page join already
// made and documented. So the reading structure here is the archive's, not this integration's:
//
//   * paragraph structure is taken verbatim from the assembled layer — never re-split, never merged;
//   * the seven cross-page joins the audit established are carried as recorded provenance, and this
//     importer never invents a join and never re-opens one;
//   * `ராயசம் வெங்கண்ணு` is a SECTION of this novel, never a separate work (see the guard below).
//
// Usage: node scripts/import-balipeedam-nokki.mjs <kalaignar-novels-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-balipeedam-nokki.mjs <kalaignar-novels-clone> <source-commit>");
  process.exit(1);
}

// Fail closed BEFORE anything is written.
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

const SLUG = "balipeedam-nokki";
const WORK_DIR = path.join(SRC_REPO, "works", SLUG);
const OUT = path.join(process.cwd(), "public/data/novels", SLUG);
const readText = (p) => fs.readFileSync(p, "utf8");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ── Source identity, asserted against the source repository's own metadata record ────────────────
const SCAN_FILENAME = "TVA_BOK_0065570_பலிபீடம்_நோக்கி.pdf";
const SCAN_SHA256 = "c4700c9043da8eadbf25144e7127a66a9270326512c095d99e1113a4feb464fe";
const SCAN_SIZE = 69724254;
const SCAN_PAGES = 34;

// Tamil text can reach us in different Unicode normal forms, so identity comparisons are made on
// NFC — a filename that differs only by composition is the SAME filename, not a mismatch.
const nfc = (s) => s.normalize("NFC");
const meta = nfc(readText(path.join(WORK_DIR, "metadata/source.md")));
for (const [label, needle] of [
  ["scan filename", SCAN_FILENAME],
  ["scan SHA-256", SCAN_SHA256],
  ["scan size", "69,724,254"],
  ["scan count", "**34**"],
  ["first edition", "ஏப்ரல் 1947"],
  ["publisher", "எரிமலைப் பதிப்பகம்"],
  ["embedded-sequence rule", "This scan contains one work"],
]) {
  if (!meta.includes(nfc(needle))) throw new Error(`source identity mismatch: metadata/source.md lacks the expected ${label} (${needle})`);
}
// The archive must still state that the earlier separate-work split was wrong.
if (!meta.includes(nfc("embedded cinematic / historical sequence inside"))) {
  throw new Error("source metadata no longer states the embedded-sequence rule for ராயசம் வெங்கண்ணு — refusing to import");
}

// ── Parsing the assembled reading layer ──────────────────────────────────────────────────────────
// Provenance comments in this source are TRAILING: `<!-- source: scan 7; printed page: 6 -->`
// closes the run of blocks above it. Inline `<!-- source join: … -->` / `<!-- source boundary: … -->`
// comments sit INSIDE a paragraph at the exact point the audit established continuity.
const SRC_MARKER = /^<!--\s*source:\s*(.+?)\s*-->$/;
const INLINE_COMMENT = /<!--\s*source (?:join|boundary):\s*([\s\S]*?)-->/g;
// English apparatus: labelled note sections and the batch scaffolding that divides the translation.
const EN_NOTE_HEADING = /^#{2,3}\s+(Pilot translation notes|Batch \d+ translation notes|Batch \d+ review result|Internal-sequence translation status)\s*$/;
const EN_SCAFFOLD_HEADING = /^#{2,3}\s+Batch \d+\s*(—|-)\s*.+$/;

function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error("missing YAML front matter");
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return { fm, body: text.slice(m[0].length) };
}

/** Parse `scan 4; printed page: —` / `scan 5 / printed 4 → scan 6 / printed 5` into pages. */
function parseMarker(spec) {
  const out = [];
  for (const part of spec.split(/→|->/)) {
    const scan = /scan\s*(\d+)/.exec(part);
    if (!scan) continue;
    const printed = /printed(?:\s*page)?\s*:?\s*(\d+)/.exec(part);
    out.push({ scan: Number(scan[1]), printedPage: printed ? Number(printed[1]) : null });
  }
  if (!out.length) throw new Error(`unrecognised source marker: ${JSON.stringify(spec)}`);
  return out;
}

/**
 * Parse one assembled section file. Blocks are taken exactly as the assembled layer has them; the
 * only transformation is stripping the inline provenance comments out of display text (their
 * content is preserved separately as join evidence).
 */
function parseSection(text, { english }) {
  const { fm, body } = frontMatter(text);
  const blocks = [];
  const notes = [];
  const joins = [];
  let pending = [];
  let noteHeading = null;
  let noteBuf = [];
  let inNote = false;

  const flushNote = () => {
    if (inNote && noteBuf.length) notes.push({ kind: "translator-note", heading: noteHeading, text: noteBuf.join("\n").trim() });
    noteBuf = [];
  };

  // Split into blocks on blank lines, but ALSO give every standalone comment line its own block:
  // the source frequently places a `<!-- source join: … -->` line directly above a
  // `<!-- source: … -->` marker with no blank line between them, and treating that pair as one
  // chunk silently swallowed the marker (leaving the blocks above it with no provenance).
  const chunks = [];
  for (const para of body.split(/\n\s*\n/)) {
    let buf = [];
    for (const line of para.split("\n")) {
      if (/^<!--[\s\S]*-->$/.test(line.trim())) {
        if (buf.length) { chunks.push(buf.join("\n")); buf = []; }
        chunks.push(line);
      } else buf.push(line);
    }
    if (buf.length) chunks.push(buf.join("\n"));
  }

  for (const raw of chunks) {
    const chunk = raw.replace(/\s+$/, "");
    const t = chunk.trim();
    if (!t) continue;

    if (english && EN_NOTE_HEADING.test(t.split("\n")[0])) {
      flushNote();
      inNote = true;
      noteHeading = t.split("\n")[0].replace(/^#+\s*/, "");
      const rest = t.split("\n").slice(1).join("\n").trim();
      noteBuf = rest ? [rest] : [];
      continue;
    }
    if (english && EN_SCAFFOLD_HEADING.test(t.split("\n")[0])) {
      // Batch scaffolding divides the TRANSLATION, not the work: the heading itself is apparatus,
      // and the body simply continues after it.
      flushNote();
      inNote = false;
      const rest = t.split("\n").slice(1).join("\n").trim();
      if (!rest) continue;
    }
    if (inNote) {
      if (/^#{1,6}\s/.test(t)) { flushNote(); inNote = false; } else { noteBuf.push(chunk); continue; }
    }
    // The English layer opens with a labelled translator's note blockquote.
    if (english && /^>\s*\*\*Translator's note:\*\*/.test(t)) {
      notes.push({ kind: "translator-note", heading: "Translator's note", text: t.replace(/^>\s?/gm, "").trim() });
      continue;
    }
    if (t === "---") continue;

    const marker = SRC_MARKER.exec(t);
    if (marker) {
      const pages = parseMarker(marker[1]);
      for (const b of pending) b.sourcePages = pages;
      pending = [];
      continue;
    }
    if (/^<!--[\s\S]*-->$/.test(t)) continue; // any other standalone comment is apparatus

    // Collect inline join/boundary evidence, then strip it from display text.
    let display = chunk;
    for (const m of chunk.matchAll(INLINE_COMMENT)) {
      const ev = m[1].trim();
      const scans = [...ev.matchAll(/scan\s*(\d+)/g)].map((x) => Number(x[1]));
      if (scans.length >= 2) joins.push({ fromScan: scans[0], toScan: scans[1], evidence: ev });
    }
    display = display.replace(INLINE_COMMENT, "").replace(/[ \t]{2,}\n/g, "\n").replace(/[ \t]+$/gm, "");

    if (/^#{1,6}\s/.test(display.trim())) {
      const level = display.trim().match(/^#+/)[0].length;
      const b = { kind: "heading", level, text: display.trim().replace(/^#+\s*/, ""), hasLineBreaks: false, sourcePages: [] };
      blocks.push(b);
      pending.push(b);
      continue;
    }
    // A short ornament-only chunk is a printed ornament belonging to the work.
    if (/^[★✾*]+$/.test(display.trim())) {
      const b = { kind: "ornament", text: display.trim(), hasLineBreaks: false, sourcePages: [] };
      blocks.push(b);
      pending.push(b);
      continue;
    }
    const b = { kind: "paragraph", text: display, hasLineBreaks: display.includes("\n"), sourcePages: [] };
    blocks.push(b);
    pending.push(b);
  }
  flushNote();
  return { fm, blocks, notes, joins };
}

// ── Build the three sections ─────────────────────────────────────────────────────────────────────
const TA_DIR = path.join(WORK_DIR, "sections");
const EN_DIR = path.join(WORK_DIR, "translations/en/sections");
const taFiles = fs.readdirSync(TA_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
const enFiles = fs.readdirSync(EN_DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
if (taFiles.length !== 3) throw new Error(`expected 3 assembled Tamil sections, found ${taFiles.length}`);
if (enFiles.length !== 3) throw new Error(`expected 3 English sections, found ${enFiles.length}`);

// ── Printed headings, derived from the CANONICAL page records ───────────────────────────────────
// The assembled reading layer writes its own section label into the top of each file as an `#`
// heading. For sections 1 and 2 that label happens to BE a heading the 1947 edition actually prints
// (scan 4 and scan 8); for section 3 it is purely the archive's descriptive label — scan 30 begins
// straight into `படம் முடிந்துவிட்டது.` with no printed heading at all.
//
// Carrying such a label into the reading body would publish archival apparatus as Kalaignar's text
// AND attach page provenance to words that are not on those pages. So a heading is admitted to the
// body only if the audited `pages/` record for a body scan prints it verbatim. Anything else is the
// archive's own section label: it is kept as the section's title (where the UI states it is the
// archive's division, not a printed chapter) and never enters the body.
const PAGES_DIR = path.join(WORK_DIR, "pages");
const APPARATUS_HEADING = /^#{1,6}\s+(Scan observations|Non-text \/ copy-specific marks|Verification note|Page record)\s*$/;
const printedHeadings = new Map(); // heading text → [scan, …]
for (const file of fs.readdirSync(PAGES_DIR).filter((f) => /^\d{4}.*\.md$/.test(f)).sort()) {
  const scan = Number(file.slice(0, 4));
  const text = nfc(readText(path.join(PAGES_DIR, file)));
  const fmEnd = /^---\n[\s\S]*?\n---\n/.exec(text);
  if (!fmEnd) throw new Error(`page record ${file} has no front matter`);
  // Only body pages can print a heading of the work. The record declares its own type, so the
  // cover, title page, publisher note and back matter exclude themselves.
  if (!/^page_type:\s*"body"\s*$/m.test(fmEnd[0])) continue;
  for (const line of text.slice(fmEnd[0].length).split("\n")) {
    if (!/^#{1,6}\s/.test(line)) continue;
    if (APPARATUS_HEADING.test(line.trim())) break; // apparatus starts here; nothing after it is printed
    const t = line.trim().replace(/^#+\s*/, "");
    if (!printedHeadings.has(t)) printedHeadings.set(t, []);
    printedHeadings.get(t).push(scan);
  }
}
if (printedHeadings.size === 0) throw new Error("no printed headings found in the audited page records — refusing to import");

const EMBEDDED_SLUG = "rayasam-vengannu-sequence";
const sections = [];
const allJoins = [];
for (let i = 0; i < 3; i++) {
  const ta = parseSection(readText(path.join(TA_DIR, taFiles[i])), { english: false });
  const en = parseSection(readText(path.join(EN_DIR, enFiles[i])), { english: true });
  const order = Number(ta.fm.section_order);
  if (order !== i + 1) throw new Error(`${taFiles[i]}: section_order ${order}, expected ${i + 1}`);
  if (Number(en.fm.section_order) !== order) throw new Error(`${enFiles[i]}: section_order disagrees with Tamil`);
  if (ta.fm.status !== "verified") throw new Error(`${taFiles[i]}: status "${ta.fm.status}", expected verified`);
  if (en.fm.status !== "reviewed") throw new Error(`${enFiles[i]}: status "${en.fm.status}", expected reviewed`);
  if (ta.fm.work !== SLUG || en.fm.work !== SLUG) throw new Error(`section ${order}: work identity is not ${SLUG}`);

  const slug = taFiles[i].replace(/^\d\d-/, "").replace(/\.md$/, "");
  const isEmbedded = slug === EMBEDDED_SLUG;
  // GUARD: the embedded sequence must stay a SECTION of this work — never its own work identity.
  if (isEmbedded && ta.fm.work !== SLUG) throw new Error("the ராயசம் வெங்கண்ணு sequence must keep the novel's work identity");
  if (isEmbedded && !ta.fm.structural_note?.includes("not a separate work")) {
    throw new Error("the assembled layer no longer marks ராயசம் வெங்கண்ணு as an internal sequence — refusing to import");
  }

  // Strip the archive's own section label from the reading body (see PRINTED_HEADINGS above). It can
  // only ever be the section's LEADING block; a non-printed heading anywhere else would mean the
  // assembled layer changed shape, so the importer fails closed rather than guessing.
  let labelStripped = false;
  ta.blocks.forEach((b, idx) => {
    if (b.kind !== "heading") return;
    const scans = printedHeadings.get(nfc(b.text));
    if (scans && scans.length) {
      // A printed heading must be cited to a scan that actually prints it.
      if (!b.sourcePages.some((pg) => scans.includes(pg.scan))) {
        throw new Error(`section ${order}: heading "${b.text}" is printed on scan(s) ${scans.join(", ")} but is cited to ${b.sourcePages.map((pg) => pg.scan).join(", ")}`);
      }
      return;
    }
    if (idx !== 0) {
      throw new Error(`section ${order}: non-printed heading "${b.text}" appears at block ${idx}, not as the section label — refusing to guess`);
    }
    labelStripped = true;
  });
  if (labelStripped) {
    ta.blocks.shift();
    // The English layer mirrors the label with its own wording (its front-matter title and its body
    // heading differ), so it is identified by position, not by text.
    if (en.blocks[0]?.kind !== "heading") throw new Error(`section ${order}: Tamil carries an archive section label but English does not`);
    en.blocks.shift();
  }
  for (const b of en.blocks) {
    if (b.kind === "heading" && b.sourcePages.length === 0) throw new Error(`section ${order}: English heading "${b.text}" lost its provenance`);
  }

  allJoins.push(...ta.joins);
  sections.push({
    order,
    slug,
    titleTa: ta.fm.section_title,
    titleEn: en.fm.section_title,
    sourceScansTa: ta.fm.source_scans,
    sourceScansEn: en.fm.source_scans,
    isEmbeddedSequence: isEmbedded,
    // Whether the section's title is a heading the 1947 edition prints, or the archive's own
    // descriptive label for a division it made for reading. The reader states which.
    titleIsPrintedHeading: printedHeadings.has(nfc(ta.fm.section_title)),
    carriesArchiveSectionLabel: labelStripped,
    tamil: { blocks: ta.blocks },
    english: { blocks: en.blocks, notes: en.notes },
  });
}

// The assembled layer's README lists EVERY verified page-boundary join the audit established. Most
// carry an inline comment at the join point, but one (scans 12→13) is a QUOTATION continuity rather
// than a word split, so it has no inline marker — reading only the inline comments would under-report
// the archive's own established joins. Both sources are merged, each citation kept verbatim.
const readmeJoins = [];
{
  const readme = nfc(readText(path.join(TA_DIR, "README.md")));
  for (const m of readme.matchAll(/^-\s*scans\s*(\d+)\s*→\s*(\d+)\s*:\s*(.+)$/gm)) {
    readmeJoins.push({ fromScan: Number(m[1]), toScan: Number(m[2]), evidence: `sections/README.md: ${m[3].trim()}` });
  }
  if (!readmeJoins.length) throw new Error("assembled-layer README no longer lists its verified page-boundary joins — refusing to import");
}
const joins = [];
for (const j of [...allJoins, ...readmeJoins]) {
  const existing = joins.find((x) => x.fromScan === j.fromScan && x.toScan === j.toScan);
  if (existing) {
    if (!existing.evidence.includes(j.evidence)) existing.evidence = `${existing.evidence} | ${j.evidence}`;
  } else joins.push(j);
}
joins.sort((a, b) => a.fromScan - b.fromScan);
// Every join the README documents must be represented.
for (const r of readmeJoins) {
  if (!joins.some((x) => x.fromScan === r.fromScan && x.toScan === r.toScan)) {
    throw new Error(`documented join ${r.fromScan}→${r.toScan} is missing from the generated data`);
  }
}

// ── Exclusions (LOCKED) ──────────────────────────────────────────────────────────────────────────
// Copy-specific and apparatus material must never appear in the reading body.
const EXCLUDED = [
  ["library/ownership stamp note", "library/ownership stamps"],
  ["bleed-through note", "bleed-through"],
  ["handwritten accession note", "handwritten accession"],
  ["assembled-layer authority prose", "controlling archival text"],
  ["translator's-note label", "**Translator's note:**"],
  ["batch notes label", "translation notes"],
  ["review-result label", "review result"],
  ["release status label", "RELEASE-READY"],
  ["source-join comment", "source join:"],
  ["source-boundary comment", "source boundary:"],
  ["provenance comment", "<!-- source:"],
];
{
  const body = sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).map((b) => b.text).join("\n");
  for (const [label, needle] of EXCLUDED) {
    if (body.includes(needle)) throw new Error(`reading body contains locked-excluded material (${label}): ${JSON.stringify(needle)}`);
  }
}
// Every block must have been closed by a provenance marker.
for (const s of sections) {
  for (const [layer, blocks] of [["Tamil", s.tamil.blocks], ["English", s.english.blocks]]) {
    const orphan = blocks.filter((b) => b.sourcePages.length === 0);
    if (orphan.length) throw new Error(`${layer} section ${s.order}: ${orphan.length} block(s) carry no source provenance`);
  }
}

// ── Assemble ─────────────────────────────────────────────────────────────────────────────────────
const count = (sel) => sections.reduce((n, s) => n + sel(s), 0);
const scans = sections.flatMap((s) => [...s.tamil.blocks, ...s.english.blocks]).flatMap((b) => b.sourcePages.map((p) => p.scan));
const bodyScans = { from: Math.min(...scans), to: Math.max(...scans) };

const novel = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-novels",
  sourcePath: `works/${SLUG}`,
  sourceCommit: SRC_COMMIT,
  shelf: "fiction",
  readerStructure: "novel",
  subtype: "novel",
  title: { ta: "பலிபீடம் நோக்கி", en: "Towards the Sacrificial Altar" },
  author: { ta: "மு. கருணாநிதி", en: "M. Karunanidhi" },
  edition: {
    statementTa: "முதற்பதிப்பு ஏப்ரல் 1947",
    year: 1947,
    monthTa: "ஏப்ரல்",
    publisherTa: "எரிமலைப் பதிப்பகம்",
    placeTa: "துறையூர்",
    districtTa: "திருச்சி Dt.",
    seriesTa: "எரிமலைப் பதிப்பக வெளியீடு 3",
    priceTa: "அணா ஆறு",
    printerTa: "ஊழியன் பிரஸ், துறையூர்",
    printedCode: "Q. H. No. Ty. 40. C. 2000",
  },
  sections,
  sectionCount: sections.length,
  bodyScans,
};

const provenance = {
  workId: SLUG,
  sourceRepo: novel.sourceRepo,
  sourcePath: novel.sourcePath,
  sourceCommit: SRC_COMMIT,
  source: {
    titleTa: novel.title.ta,
    titleEn: novel.title.en,
    authorTa: novel.author.ta,
    scanFilename: SCAN_FILENAME,
    scanSha256: SCAN_SHA256,
    scanFileSizeBytes: SCAN_SIZE,
    scanTotalPages: SCAN_PAGES,
    pageRecordsVerified: "34 / 34 page records verified",
    sourceAudit: "Tamil source audit PASSED",
    assembledLayer: "assembled Tamil reading layer PASSED (derived only from the audited page records)",
    sourcePdfCommitted: false,
    editionTa: "முதற்பதிப்பு ஏப்ரல் 1947",
    publisherTa: "எரிமலைப் பதிப்பகம்",
    placeTa: "துறையூர், திருச்சி Dt.",
    seriesTa: "எரிமலைப் பதிப்பக வெளியீடு 3",
    priceTa: "அணா ஆறு",
    printerTa: "ஊழியன் பிரஸ், துறையூர்",
    printedCode: "Q. H. No. Ty. 40. C. 2000",
    printedPageNumbering:
      "Printed page numbers are not visible on every scan. Where no number is visibly printed the page map records `—` and this integration carries `printedPage: null` — a number is never inferred from sequence.",
    bodyScans: `${bodyScans.from}–${bodyScans.to}`,
    embeddedSequenceNote:
      "`ராயசம் வெங்கண்ணு — தஞ்சை சரித்திரக் கதை` is NOT a separate work. The source archive states, after a full read of scans 4–33, that it is an embedded cinematic/historical sequence inside `பலிபீடம் நோக்கி`, used by the narrator as the central illustrative episode. It therefore has no separate catalog work, no separate work-level metadata, no separate translation project, no separate release identity and no separate route here — only a section of this one novel, carrying its own source-printed heading. The importer refuses to run if the source stops stating this.",
    sourceContinuity: [
      "scans 4–7 — the opening `பலிபீடம்` frame develops the argument through சேரன் செங்குட்டுவன், Aryan ritual power and Tamil self-respect;",
      "scan 7 — the narrator explicitly introduces the internal film: `படக்காட்சி ஆரம்பமாகிறது பாருங்கள். படம் உங்களுக்கு ஒரு பாடம் தரட்டும்.`;",
      "scan 8 — a title-card page prints `ராயசம் வெங்கண்ணு`, `தஞ்சை சரித்திரக் கதை`, `எரிமலை ‘ரிலீஸ்’` and screenplay/dialogue credits — the novel's cinematic device, not a second work;",
      "scans 9–29 — the Thanjavur narrative is staged with screenplay-like narration, dialogue and visual directions;",
      "scan 30 — the narrator exits the film: `படம் முடிந்துவிட்டது. பாடம் கற்றுக்கொண்டீர்களா? பலிபீடம் நோக்க...`;",
      "scans 31–33 — the work returns to direct address and closes on the `பலிபீடம்` metaphor;",
      "scan 34 — blank/back matter, outside the body.",
    ],
    lockedExclusions: [
      "scans 1–3 — the illustrated cover, the title page and the publisher-note page (all of which also carry library stamps and handwritten accession marks)",
      "scan 34 — blank/back matter with no body text",
      "library and ownership stamps, handwritten accession-style markings, marginal marks, underlines and reverse-side bleed-through throughout",
      "the assembled layer's own provenance comments and its authority/assembly prose",
      "the English layer's translator's-note blockquote, per-batch translation notes, review results and status sections, and the batch scaffolding headings that divide the translation rather than the work",
      "the assembled layer's own section label where the 1947 edition prints no such heading (section 3) — kept as the section's title, never as body text, and never given page provenance",
    ],
  },
  english: {
    kind: "project-created",
    status: "whole-work English VERIFIED",
    batches: "Batches 1–6 reviewed",
    bodyCoverage: "English body-text coverage complete for scans 4–33",
    bilingualAlignment: "final bilingual alignment PASSED",
    releaseReadiness: "combined archival package RELEASE-READY (an editorial/archival status, not a rights determination)",
    translatorNotesSeparated:
      "The English layer's translator's note and its per-batch translation notes, review results and status sections are carried OUTSIDE the reading body and rendered in a separate, clearly-labelled area — never as Kalaignar's prose. The `Batch N — …` headings divide the TRANSLATION, not the work, so they are dropped while the body continues.",
  },
  archiveDerived: {
    sections: sections.length,
    tamilBlocks: count((s) => s.tamil.blocks.length),
    englishBlocks: count((s) => s.english.blocks.length),
    tamilParagraphs: count((s) => s.tamil.blocks.filter((b) => b.kind === "paragraph").length),
    englishParagraphs: count((s) => s.english.blocks.filter((b) => b.kind === "paragraph").length),
    printedHeadingsInSource: [...printedHeadings.entries()].map(([text, scans]) => ({ text, scans })),
    sectionsWithArchiveOnlyTitle: sections.filter((s) => s.carriesArchiveSectionLabel).length,
    tamilHeadings: count((s) => s.tamil.blocks.filter((b) => b.kind === "heading").length),
    englishHeadings: count((s) => s.english.blocks.filter((b) => b.kind === "heading").length),
    ornaments: count((s) => [...s.tamil.blocks, ...s.english.blocks].filter((b) => b.kind === "ornament").length),
    tamilBlocksWithLineBreaks: count((s) => s.tamil.blocks.filter((b) => b.hasLineBreaks).length),
    englishBlocksWithLineBreaks: count((s) => s.english.blocks.filter((b) => b.hasLineBreaks).length),
    translatorNotes: count((s) => s.english.notes.length),
    sourceEstablishedJoins: joins.length,
    joins,
    embeddedSequenceSections: sections.filter((s) => s.isEmbeddedSequence).length,
    note:
      "Derived structure only. The 34 audited `pages/` records remain the controlling archival text; this integration reads the archive's own assembled reading layer, which was built from those records and PASSED assembly review. Paragraph structure is carried verbatim — never re-split, never merged — and no source wording, punctuation or historical spelling was normalized.",
    joinNote:
      "The source audit established every cross-page continuity BEFORE assembly, and the assembled layer applies each one at the exact point the audit fixed, marked with an inline comment. Those comments are carried here as recorded join provenance and stripped from the display text. This integration never invents a join, never re-opens one the archive made, and never infers continuity from punctuation, blank lines or page markers.",
    provenanceGranularity:
      "Block-level scan provenance taken from the assembled layer's own trailing `<!-- source: … -->` comments, which close the run of blocks above them. A block spanning a page carries both scans. Printed page numbers are recorded only where the scan shows one; otherwise `printedPage` is null.",
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
      "This is the PRESENT project-level rights status of Kalaignar's underlying novel. The 1947 edition's own publisher, series, price and printer lines are edition facts, not statements about those rights.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored novel. It does NOT extend to the edition's publisher/imprint matter, the cover artwork and design, the printer's material, or the library's stamps and accession marks — each retains its own distinct provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked translation (englishKind: project-created) with its own distinct provenance; it is not covered by the nationalisation of the Tamil work.",
    archivalStatusNote:
      "The source repository's `RELEASE-READY` status is an editorial/archival judgement about transcription and translation completeness. It is NOT, by itself, a copyright, public-domain or republication-rights determination.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only. Neither is invented here.",
  },
  notes: [
    "The controlling source is the supplied scanned PDF; it is NOT committed to the source repository and is NOT vendored here. Its identity travels as filename + SHA-256 + byte size + scan count.",
    "This is ONE continuous novel in THREE assembled sections. `ராயசம் வெங்கண்ணு — தஞ்சை சரித்திரக் கதை` is section 2 — an internal cinematic-historical sequence — and is never a separate catalog work, route or release identity.",
    "The section split at scan 30 follows the SOURCE's narrative transition, not a mechanical page boundary: section 2 carries the internal film through its printed end-card (`வணக்கம்`), and section 3 begins at the narrator's explicit `படம் முடிந்துவிட்டது…` return. No source text is duplicated or omitted at that split.",
    "Intentional source line breaks — the film-credit lines and the closing lineated address — are preserved inside their blocks and rendered as written, never collapsed into running prose.",
    "The body covers scans 4–33. Scans 1–3 (cover, title page, publisher note) and scan 34 (blank/back matter) are outside the reading body, as are all copy-specific marks.",
    "Printed page numbers are carried only where the scan shows one; where the page map records `—` this integration carries null rather than inferring a number.",
    "SECTION TITLES ARE THE ARCHIVE'S, NOT THE BOOK'S. The assembled layer opens each file with its own descriptive section label. Where the 1947 edition actually prints that heading (scan 4 `பலிபீடம் நோக்கி`; scan 8 `ராயசம் வெங்கண்ணு` / `தஞ்சை சரித்திரக் கதை`) the printed heading is carried in the body and cited to the scan that prints it. Where it does not — section 3, where scan 30 runs straight on into `படம் முடிந்துவிட்டது…` — the label is NOT admitted to the reading body and no page provenance is asserted for it; it survives only as the section's title, which the reader labels as the archive's division.",
  ],
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "novel.json"), JSON.stringify(novel, null, 1) + "\n");
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

const d = provenance.archiveDerived;
console.log("novel:", SLUG);
console.log("sections:", d.sections, "| embedded-sequence sections:", d.embeddedSequenceSections);
console.log("Tamil  blocks", d.tamilBlocks, "| paragraphs", d.tamilParagraphs, "| headings", d.tamilHeadings, "| line-break blocks", d.tamilBlocksWithLineBreaks);
console.log("English blocks", d.englishBlocks, "| paragraphs", d.englishParagraphs, "| headings", d.englishHeadings, "| line-break blocks", d.englishBlocksWithLineBreaks);
console.log("ornaments:", d.ornaments, "| translator notes:", d.translatorNotes, "| source-established joins:", d.sourceEstablishedJoins);
console.log("body scans:", provenance.source.bodyScans);
console.log("novel.json sha256:", sha256(readText(path.join(OUT, "novel.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
