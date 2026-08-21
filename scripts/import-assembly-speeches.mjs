// Importer for the 2007 anthology தொழில்துறை பற்றி கலைஞரின் சட்டமன்ற உரைகள்.
//
//   node scripts/import-assembly-speeches.mjs <kalaignar-assembly-speeches-clone> <source-commit>
//
// ONE importer, TEN independently citable datasets. All ten speeches come from a single controlling
// scan and share one processing model, so ten near-identical importers would be duplication with no
// archival justification — but each speech is separately dated, separately citable and gets its own
// public/data/speeches/<slug>/{speech.json, provenance.json}, exactly as udhaya-kathir does.
//
// udhaya-kathir is NOT regenerated here. It comes from a different controlling source (its own
// 48-page booklet), it was imported with a per-boundary adjudication table, and this importer
// aborts if it ever appears in the generation set.
//
// ── THE DISTINCTION THIS FILE EXISTS TO PRESERVE ────────────────────────────────────────────────
// udhaya-kathir's importer carries a hand-built table of cross-page decisions: for each physical
// page boundary it records whether the printed text joined with a space, joined with no space, or
// could not be resolved. No such table exists for this anthology, and none is invented here.
//
// Instead the archive's own stated rule is applied: ARCHIVAL_WORKFLOW.md permits normalising
// "physical line wraps into paragraphs", and the released transcripts end each page on a complete
// word accordingly. Cross-page continuations are therefore joined with ONE SPACE as a matter of
// archive policy, and every provenance file says so in those words. It is not claimed that the 214
// boundaries were checked individually against the scan, because they were not.
//
// Nothing is deleted, added, respelled or re-punctuated. Each source fragment is stored verbatim as
// its own segment carrying its own source page, so the inserted separator stays visible in the data
// rather than being baked into a flattened string.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-assembly-speeches.mjs <assembly-speeches-clone> <source-commit>");
  process.exit(1);
}

const die = (m) => { throw new Error(m); };
const nfc = (s) => s.normalize("NFC");
const readText = (p) => nfc(fs.readFileSync(p, "utf8"));
const readJSON = (p) => JSON.parse(readText(p));

// ── FAIL-CLOSED SOURCE PIN ───────────────────────────────────────────────────────────────────────
let head;
try { head = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
catch (e) { die(`unable to read git HEAD of ${SRC_REPO}: ${e.message}`); }
if (head !== SRC_COMMIT) {
  die(`source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${head}. ` +
      `Refusing to generate data against a revision the release is not pinned to.`);
}

const SOURCE_REPO_NAME = "pugazg/kalaignar-assembly-speeches";
const EXCLUDED = "1970-09-09-no-confidence-motion"; // udhaya-kathir — different controlling source
const OUT_ROOT = path.join(process.cwd(), "public/data/speeches");

// ── THE ARCHIVE'S OWN REGISTRY IS THE READINESS AUTHORITY ────────────────────────────────────────
const registry = readJSON(path.join(SRC_REPO, "data/speeches.json"));
const entries = (Array.isArray(registry) ? registry : registry.speeches ?? []);
if (!entries.length) die("data/speeches.json lists no speeches");
const targets = entries.filter((e) => e.id !== EXCLUDED);
if (targets.some((e) => e.id === EXCLUDED)) die("udhaya-kathir must never be in the generation set");
if (targets.length !== 10) die(`expected 10 remaining speeches in data/speeches.json, found ${targets.length}`);

const slugs = new Set();
for (const e of targets) {
  if (slugs.has(e.id)) die(`duplicate speech id in the registry: ${e.id}`);
  slugs.add(e.id);
}

// ── TRANSCRIPT PARSING ───────────────────────────────────────────────────────────────────────────
// Each transcript carries both language layers under H1s. Tamil marks pages with an HTML comment;
// English marks them with `### Source page N`. Each layer is parsed by ITS OWN convention — English
// formatting is never used to infer Tamil structure, or the reverse.
// A fragment that closes with terminal punctuation at a page edge leaves the paragraph
// relationship unresolved; one that runs on is a continuation. This is read from the released text
// itself, not from any judgement about wording.
const SENTENCE_END = /[.!?:”"]\s*$|[.!?]["”]\s*$/;

const TA_H1 = "# தமிழ் மூல உரை";
const EN_H1 = "# English translation";

/**
 * Splits a language section into blocks.
 *
 * `pageMarker` recognises that layer's page anchor. Anything else that is a Markdown heading is a
 * PRINTED heading and is preserved as a heading block — including the H1s the 1963 speech reproduces
 * from the anthology's running title. Those are visible on the printed page; demoting or discarding
 * them because an H1 is structurally inconvenient would be an edit to the source.
 */
function parseSection(lines, pageMarker, slug, lang) {
  const blocks = [];
  let page = null;
  let para = null;
  let pendingPageBreak = false;

  const flush = () => {
    if (!para) return;
    para.segments[para.segments.length - 1].joinToNext = "end";
    para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage).filter((p) => p != null))].sort((a, b) => a - b);
    blocks.push(para);
    para = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const pm = pageMarker(line);
    if (pm !== null) { page = pm; pendingPageBreak = para !== null; continue; }
    if (!line.trim()) continue;

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      pendingPageBreak = false;
      blocks.push({ kind: "heading", text: h[2].trim(), sourcePage: page });
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      pendingPageBreak = false;
      blocks.push({ kind: "note", text: line.replace(/^>\s?/, "").trim(), sourcePage: page });
      continue;
    }
    if (line === "---") { flush(); pendingPageBreak = false; continue; }

    if (para && pendingPageBreak) {
      const prev = para.segments[para.segments.length - 1].text.trimEnd();
      if (SENTENCE_END.test(prev)) {
        // The previous fragment CLOSES a sentence at the page edge and this page opens a new one.
        // Whether the printed page continued the same paragraph or began a new one is not
        // recoverable from the released text, and the archive adjudicates no boundary here. Assert
        // NEITHER: close the run and emit a neutral marker, exactly as udhaya-kathir does for its
        // own unresolved boundaries.
        flush();
        blocks.push({ kind: "unresolved-break", toPage: page, relation: "unknown" });
        pendingPageBreak = false;
        para = { kind: "paragraph", segments: [{ text: line, sourcePage: page, joinToNext: "end" }], sourcePages: [] };
        continue;
      }
      // ARCHIVE-POLICY CONTINUATION. The sentence runs on across the physical page edge. The
      // archive normalises line wrapping into paragraphs, so the two fragments read as one
      // paragraph joined by a single space. Both fragments are kept verbatim and separate.
      para.segments[para.segments.length - 1].joinToNext = "space";
      para.segments.push({ text: line, sourcePage: page, joinToNext: "end" });
      pendingPageBreak = false;
      continue;
    }
    if (para) {
      // A blank line inside one page ends the paragraph; a new paragraph starts here.
      flush();
    }
    para = { kind: "paragraph", segments: [{ text: line, sourcePage: page, joinToNext: "end" }], sourcePages: [] };
  }
  flush();
  if (!blocks.length) die(`${slug}: the ${lang} layer produced no blocks`);
  return blocks;
}

const taMarker = (l) => { const m = /^<!--\s*source-page:\s*(\d+)\s*-->$/.exec(l); return m ? Number(m[1]) : null; };
const enMarker = (l) => { const m = /^###\s+Source page\s+(\d+)\s*$/.exec(l); return m ? Number(m[1]) : null; };

// ── GENERATE ─────────────────────────────────────────────────────────────────────────────────────
const summary = [];
for (const entry of targets) {
  const slug = entry.id;
  const year = entry.date.slice(0, 4);
  const dir = path.join(SRC_REPO, "speeches", year, slug);
  if (!fs.existsSync(dir)) die(`${slug}: source directory not found at speeches/${year}/${slug}`);

  const meta = readJSON(path.join(dir, "metadata.json"));
  const transcript = readText(path.join(dir, "transcript.md"));

  // The registry and the per-speech metadata must agree about verification.
  if (entry.transcription_status !== "verified") die(`${slug}: registry transcription_status is "${entry.transcription_status}"`);
  if (entry.translation_status !== "verified") die(`${slug}: registry translation_status is "${entry.translation_status}"`);
  if (entry.verified_against_scan !== true) die(`${slug}: registry does not record verified_against_scan`);
  if (meta.transcription?.status !== entry.transcription_status) {
    die(`${slug}: metadata transcription status "${meta.transcription?.status}" disagrees with the registry "${entry.transcription_status}"`);
  }
  if (meta.translation?.status !== entry.translation_status) {
    die(`${slug}: metadata translation status "${meta.translation?.status}" disagrees with the registry "${entry.translation_status}"`);
  }

  const lines = transcript.split("\n");
  const taAt = lines.indexOf(TA_H1);
  const enAt = lines.indexOf(EN_H1);
  if (taAt === -1) die(`${slug}: transcript has no "${TA_H1}" section`);
  if (enAt === -1) die(`${slug}: transcript has no "${EN_H1}" section`);
  if (enAt < taAt) die(`${slug}: the English section precedes the Tamil section — unexpected transcript shape`);

  const tamilBlocks = parseSection(lines.slice(taAt + 1, enAt), taMarker, slug, "Tamil");
  const englishBlocks = parseSection(lines.slice(enAt + 1), enMarker, slug, "English");

  const taPages = [...new Set(lines.slice(taAt + 1, enAt).map(taMarker).filter((p) => p != null))];
  const enPages = [...new Set(lines.slice(enAt + 1).map(enMarker).filter((p) => p != null))];
  if (!taPages.length) die(`${slug}: no Tamil source-page markers resolved`);
  if (taPages.length !== enPages.length) {
    die(`${slug}: Tamil covers ${taPages.length} source pages but English covers ${enPages.length}`);
  }
  const declared = meta.source?.speech_scan_pages;
  if (declared) {
    const [a, b] = declared.split(/[–—-]/).map((n) => Number(n.trim()));
    if (Number.isInteger(a) && Number.isInteger(b) && b - a + 1 !== taPages.length) {
      die(`${slug}: metadata declares scan pages ${declared} (${b - a + 1} pages) but ${taPages.length} markers resolved`);
    }
  }

  const speech = {
    workId: slug,
    slug,
    sourceRepo: SOURCE_REPO_NAME,
    sourcePath: `speeches/${year}/${slug}`,
    sourceCommit: SRC_COMMIT,
    shelf: "speeches",
    subtype: "assembly-speech",
    readerStructure: "speech",
    date: entry.date,
    year: entry.year ?? Number(year),
    title: { ta: entry.title_ta, en: entry.title_en },
    event: { ta: entry.event_ta, en: entry.event_en },
    speechType: meta.speech?.archive_subject_slug ?? "industries-debate",
    speaker: {
      nameTa: entry.speaker_ta,
      nameEn: entry.speaker_en,
      ...(meta.speaker?.role_ta ? { roleTa: meta.speaker.role_ta } : {}),
      ...(meta.speaker?.role_en ? { roleEn: meta.speaker.role_en } : {}),
    },
    legislature: {
      nameTa: meta.legislature?.source_context_ta ?? "சட்டமன்ற உரை",
      nameEn: meta.legislature?.source_context_en ?? "Legislative Assembly speech",
    },
    transcriptionStatus: entry.transcription_status,
    translationStatus: entry.translation_status,
    tamil: { sectionTitleTa: TA_H1.replace(/^#\s*/, ""), blocks: tamilBlocks },
    english: { sectionTitleEn: EN_H1.replace(/^#\s*/, ""), blocks: englishBlocks },
    sourcePages: taPages,
  };

  const hasRelease = Object.prototype.hasOwnProperty.call(meta, "release");
  const provenance = {
    workId: slug,
    sourceRepo: SOURCE_REPO_NAME,
    sourcePath: `speeches/${year}/${slug}`,
    sourceCommit: SRC_COMMIT,
    source: {
      publicationTitleTa: meta.source.publication_title_ta,
      editionTa: meta.source.edition_ta,
      publicationDate: meta.source.publication_date,
      publicationDatePrintedTa: meta.source.publication_date_printed_ta ?? null,
      publisherTa: meta.source.publisher_ta,
      publisherLocationTa: meta.source.location,
      salesRightsTa: meta.source.sales_rights ?? null,
      scanFilename: meta.source.scan_filename,
      scanTotalPages: meta.source.scan_total_pages,
      scanFileSizeBytes: meta.source.file_size,
      scanSha256: meta.source.sha256,
      speechScanPages: meta.source.speech_scan_pages,
      speechPrintedPages: meta.source.speech_printed_pages ?? null,
      scanToPrintedRelationship: meta.source.relationship ?? null,
      sourceAuthority: meta.source.source_authority ?? null,
      speechSourceLabelTa: meta.speech?.source_label_ta ?? null,
      speechPrintedDate: meta.speech?.printed_date ?? null,
      // Booklet-only facts (printer, printer location, cover price, front-matter and advertisement
      // page ranges) are deliberately absent: this speech is one section of an anthology and the
      // archive states none of them for it. Nothing is written where the source says nothing.
    },
    // ── EVIDENCE LAYER 1: the archive's machine-readable registry ──
    archiveVerification: {
      registry: "data/speeches.json",
      transcriptionStatus: entry.transcription_status,
      verifiedAgainstScan: entry.verified_against_scan,
      translationStatus: entry.translation_status,
    },
    // ── EVIDENCE LAYER 2: the per-speech release block, present for some and absent for others ──
    releaseReadiness: hasRelease
      ? {
          basis: "per-speech-release-block",
          explicitPerSpeechReleaseBlockPresent: true,
          releaseReady: meta.release.release_ready,
          note: "The per-speech metadata carries an explicit release block, recorded here verbatim.",
        }
      : {
          basis: "archive-index",
          explicitPerSpeechReleaseBlockPresent: false,
          note:
            "The archive registry records this speech as verified against the scan with a verified " +
            "translation. The per-speech metadata contains no explicit release block, so none is " +
            "reported here; its absence is recorded rather than filled in.",
        },
    // ── THE JOIN POLICY, STATED WITHOUT OVERCLAIM ──
    crossPageJoinPolicy: {
      policy: "space",
      basis: "archive-normalisation-rule",
      individualAdjudication: false,
      appliedBoundaries: tamilBlocks.reduce((n, b) => n + (b.kind === "paragraph" ? b.segments.filter((s) => s.joinToNext === "space").length : 0), 0),
      unresolvedBoundaries: tamilBlocks.filter((b) => b.kind === "unresolved-break").length,
      note:
        "Physical page-boundary continuations are joined with one space under the archive's " +
        "normalisation policy (ARCHIVAL_WORKFLOW.md permits normalising physical line wraps into " +
        "paragraphs). The source archive provides no per-boundary adjudication for this speech, so " +
        "no boundary here is claimed to have been checked individually against the scan. Each " +
        "source fragment is stored verbatim as its own segment with its own source page; the " +
        "separator is inserted only when the paragraph is read, never into the stored text.",
    },
    transcription: meta.transcription ?? {},
    translation: meta.translation ?? {},
    archiveDerived: {
      tamilSourcePages: taPages.length,
      englishSourcePages: enPages.length,
      tamilBlocks: tamilBlocks.length,
      englishBlocks: englishBlocks.length,
      tamilHeadings: tamilBlocks.filter((b) => b.kind === "heading").length,
      englishHeadings: englishBlocks.filter((b) => b.kind === "heading").length,
      tamilParagraphs: tamilBlocks.filter((b) => b.kind === "paragraph").length,
      tamilUnresolvedBreaks: tamilBlocks.filter((b) => b.kind === "unresolved-break").length,
      englishUnresolvedBreaks: englishBlocks.filter((b) => b.kind === "unresolved-break").length,
      englishParagraphs: englishBlocks.filter((b) => b.kind === "paragraph").length,
    },
  };

  const out = path.join(OUT_ROOT, slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "speech.json"), JSON.stringify(speech, null, 2) + "\n");
  fs.writeFileSync(path.join(out, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");

  summary.push({ slug, date: entry.date, pages: taPages.length, joins: provenance.crossPageJoinPolicy.appliedBoundaries, unresolved: provenance.crossPageJoinPolicy.unresolvedBoundaries, release: hasRelease });
}

if (summary.length !== 10) die(`generated ${summary.length} speeches, expected 10`);
if (fs.existsSync(path.join(OUT_ROOT, "udhaya-kathir"))) {
  // present, and it must remain untouched — this importer never writes there
}
console.log(`anthology: ${targets[0].title_ta.split("—")[0].trim()}`);
console.log(`source: ${SOURCE_REPO_NAME} @ ${SRC_COMMIT}`);
for (const s of summary) {
  console.log(`  ${s.slug.padEnd(34)} ${s.date}  pages ${String(s.pages).padStart(3)}  policy-joins ${String(s.joins).padStart(3)}  unresolved ${String(s.unresolved).padStart(3)}  release-block ${s.release ? "present" : "absent"}`);
}
console.log(`  ${summary.length} speeches | ${summary.reduce((n, s) => n + s.pages, 0)} source pages | ${summary.reduce((n, s) => n + s.joins, 0)} policy joins | ${summary.reduce((n, s) => n + s.unresolved, 0)} unresolved boundaries | ${summary.filter((s) => s.release).length} with explicit release blocks`);
