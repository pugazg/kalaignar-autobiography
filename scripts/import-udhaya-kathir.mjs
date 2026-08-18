// Deterministic, work-specific importer for உதயக் கதிர் / Udhaya Kathir (Digital Library
// Phase 3 — Speeches; first benchmark). Kalaignar M. Karunanidhi's 1970-09-09 reply to the
// no-confidence-motion debate in the Tamil Nadu Legislative Assembly.
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-assembly-speeches
// (speeches/1970/1970-09-09-no-confidence-motion) at a pinned commit, and vendors static
// bilingual reader data into this website under public/data/speeches/udhaya-kathir/.
// Runtime never calls GitHub.
//
// Fidelity: the released transcript.md is the authority. Tamil is the verified source
// derivative; English is the verified faithful reading translation. Neither is retranslated,
// modernized or normalized. Source-page boundaries and printed section headings are preserved,
// and the source metadata (publication, scan, verification) is copied verbatim from
// metadata.json — nothing is inferred or fabricated.
//
// Usage: node scripts/import-udhaya-kathir.mjs <path-to-assembly-speeches-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-udhaya-kathir.mjs <assembly-speeches-clone> <source-commit>");
  process.exit(1);
}

// Fail closed: the source clone's actual git HEAD must equal the supplied <source-commit>,
// so we never record a caller-supplied SHA that does not correspond to the checked-out tree.
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

const SPEECH_DIR = path.join(SRC_REPO, "speeches/1970/1970-09-09-no-confidence-motion");
const SLUG = "udhaya-kathir";
const OUT = path.join(process.cwd(), "public/data/speeches", SLUG);

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));

const meta = readJSON(path.join(SPEECH_DIR, "metadata.json"));
const transcript = readText(path.join(SPEECH_DIR, "transcript.md"));

// ── Parse a section into an ordered stream of logical blocks ────────────────────
// The file is: title + note, then `# தமிழ் மூல உரை` (Tamil), then `# English translation`.
// Within a section: `## ` = printed section heading; `<!-- source-page: N -->` (Tamil) and
// `### Source page N` (English) = source-page boundaries; `> ` = an editorial note; other
// non-empty lines are paragraph text (verbatim).
//
// CRITICAL SOURCE-FIDELITY RULE (reviewer correction): a source-page boundary is NOT a
// paragraph boundary. The archive normalises physical line-wraps into paragraphs and marks
// page transitions separately (see the source README / verification log). So one LOGICAL
// paragraph may span several source pages. We therefore build paragraphs whose `segments[]`
// are the per-page text fragments (each with its own `sourcePage`), joined for reading by a
// per-segment `joinToNext`:
//   - "none"  = the source splits a WORD across the page (join with NO space);
//   - "space" = an ordinary cross-page word boundary (single space).
// A page transition starts a NEW paragraph only when the preceding fragment ends a sentence
// (terminal punctuation) — an honest, conservative treatment of a completed-sentence-at-page
// boundary. Two text lines separated by a blank line WITHIN a page are separate paragraphs
// (the source keeps one paragraph on one line). Text is never rewritten; each segment.text is
// the exact source line.
//
// Mid-word joins are taken ONLY from the archive's explicit documentation (verification log
// corrections #5 p7→8 and #32 p17→18); they cannot be inferred without a lexicon, so all other
// cross-page continuations default to a single space (the verification would have flagged a
// mid-word split, as it did for those two). An em/en-dash or hyphen at a fragment end also
// joins with no space (covers the English p22 em-dash continuation).
const TERMINAL_PUNCT = new Set([".", "!", "?", "”", '"', "'", ")", ":", ";"]);
// Documented mid-word page splits — [prev-fragment ends-with, next-fragment starts-with].
const DOCUMENTED_MIDWORD = [
  ["அனைவருக்", "கும்"], // verification-log #5, scan p.7→8
  ["ஆகிர", "மிப்பாளர்கள்"], // verification-log #32, scan p.17→18
];
function joinType(prevText, nextText) {
  for (const [a, b] of DOCUMENTED_MIDWORD) {
    if (prevText.endsWith(a) && nextText.startsWith(b)) return "none";
  }
  if (/[-–—]$/.test(prevText)) return "none"; // dash connects with no space
  return "space";
}
function endsSentence(text) {
  const last = text.trimEnd().slice(-1);
  return TERMINAL_PUNCT.has(last);
}

function parseSection(lines) {
  const blocks = [];
  let currentPage = null;
  let pendingPageCross = false; // a source-page boundary seen since the last text line
  let para = null; // { kind:"paragraph", segments:[{text,sourcePage,joinToNext}], sourcePages:[] }
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage))].sort((a, b) => a - b);
      // The final segment has no following segment to join to.
      if (para.segments.length) para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^<!--\s*source-page:\s*(\d+)\s*-->$/)) || (m = line.match(/^###\s+Source page\s+(\d+)\s*$/i))) {
      currentPage = Number(m[1]);
      pendingPageCross = true; // affects how the NEXT text line attaches
      continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      flush();
      blocks.push({ kind: "heading", text: m[1].trim(), sourcePage: currentPage });
      pendingPageCross = false;
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      flush();
      blocks.push({ kind: "note", text: m[1].trim(), sourcePage: currentPage });
      pendingPageCross = false;
      continue;
    }
    if (/^#\s+/.test(line)) continue; // stray H1 (shouldn't occur inside a section)
    // A paragraph text line (verbatim; source Markdown emphasis preserved).
    if (!para) {
      para = { kind: "paragraph", segments: [{ text: line, sourcePage: currentPage, joinToNext: "end" }], sourcePages: [] };
    } else if (pendingPageCross) {
      const lastSeg = para.segments[para.segments.length - 1];
      if (endsSentence(lastSeg.text)) {
        flush();
        para = { kind: "paragraph", segments: [{ text: line, sourcePage: currentPage, joinToNext: "end" }], sourcePages: [] };
      } else {
        lastSeg.joinToNext = joinType(lastSeg.text, line); // same paragraph continues across the page
        para.segments.push({ text: line, sourcePage: currentPage, joinToNext: "end" });
      }
    } else {
      // Two text lines on the same page separated by a blank line = separate paragraphs.
      flush();
      para = { kind: "paragraph", segments: [{ text: line, sourcePage: currentPage, joinToNext: "end" }], sourcePages: [] };
    }
    pendingPageCross = false;
  }
  flush();
  return blocks;
}

const allLines = transcript.split("\n");
const taStart = allLines.findIndex((l) => /^#\s+தமிழ்\s*மூல\s*உரை/.test(l));
const enStart = allLines.findIndex((l) => /^#\s+English translation/i.test(l));
if (taStart === -1 || enStart === -1 || enStart <= taStart) {
  throw new Error("could not locate the Tamil (# தமிழ் மூல உரை) and English (# English translation) sections");
}
const tamilBlocks = parseSection(allLines.slice(taStart + 1, enStart));
const englishBlocks = parseSection(allLines.slice(enStart + 1));

// Stats over a parsed block stream (paragraphs / headings / segments / cross-page joins).
function streamStats(blocks) {
  const pages = new Set();
  let headings = 0,
    paragraphs = 0,
    segments = 0,
    crossPageParagraphs = 0,
    midWordJoins = 0,
    spaceJoins = 0;
  for (const b of blocks) {
    if (b.kind === "heading") {
      headings++;
      if (b.sourcePage != null) pages.add(b.sourcePage);
    } else if (b.kind === "paragraph") {
      paragraphs++;
      if (b.segments.length > 1) crossPageParagraphs++;
      for (const s of b.segments) {
        segments++;
        if (s.sourcePage != null) pages.add(s.sourcePage);
        if (s.joinToNext === "none") midWordJoins++;
        else if (s.joinToNext === "space") spaceJoins++;
      }
    }
  }
  return { headings, paragraphs, segments, crossPageParagraphs, midWordJoins, spaceJoins, pages: [...pages].sort((a, b) => a - b) };
}
const taStats = streamStats(tamilBlocks);
const enStats = streamStats(englishBlocks);
// Source-page span actually covered by the Tamil transcription (audit trail).
const tamilPages = taStats.pages;

const speech = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-assembly-speeches",
  sourcePath: "speeches/1970/1970-09-09-no-confidence-motion",
  sourceCommit: SRC_COMMIT,
  shelf: "speeches",
  subtype: "assembly-speech",
  readerStructure: "speech",
  date: meta.date,
  year: meta.year,
  title: { ta: meta.speech.title_ta, en: meta.speech.title_en },
  event: { ta: meta.speech.event_ta, en: meta.speech.event_en },
  speechType: meta.speech.type,
  speaker: {
    nameTa: meta.speaker.name_ta,
    nameEn: meta.speaker.name_en,
    roleTa: meta.speaker.role_ta,
    roleEn: meta.speaker.role_en,
  },
  legislature: { nameTa: meta.legislature.name_ta, nameEn: meta.legislature.name_en },
  // Verbatim released transcription/translation status (source-derived, not asserted here).
  transcriptionStatus: meta.transcription.status,
  translationStatus: meta.translation.status,
  // The two ordered, source-faithful block streams. Tamil is authoritative.
  tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: tamilBlocks },
  english: { sectionTitleEn: "English translation", blocks: englishBlocks },
  sourcePages: tamilPages, // exact source pages the Tamil transcription covers
};
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "speech.json"), JSON.stringify(speech, null, 1) + "\n");

// ── provenance.json ────────────────────────────────────────────────────────────
const provenance = {
  workId: SLUG,
  sourceRepo: "pugazg/kalaignar-assembly-speeches",
  sourcePath: "speeches/1970/1970-09-09-no-confidence-motion",
  sourceCommit: SRC_COMMIT,
  // Source publication facts, copied verbatim from the authoritative metadata.json.
  source: {
    publicationTitleTa: meta.source.publication_title_ta,
    authorTa: meta.source.author_ta,
    editionTa: meta.source.edition_ta,
    publicationDate: meta.source.publication_date,
    publisherTa: meta.source.publisher_ta,
    publisherLocationTa: meta.source.publisher_location_ta,
    printerTa: meta.source.printer_ta,
    printerLocationTa: meta.source.printer_location_ta,
    coverPriceTa: meta.source.cover_price_ta,
    scanFilename: meta.source.scan_filename,
    scanTotalPages: meta.source.scan_total_pages,
    speechScanPages: meta.source.speech_scan_pages,
    frontMatterScanPages: meta.source.front_matter_scan_pages,
    advertisementScanPages: meta.source.advertisement_scan_pages,
  },
  transcription: meta.transcription, // verbatim: method, preserve flags, verified status/note
  translation: meta.translation, // verbatim: language, placement, status, type, verified flag
  archiveDerived: {
    sectionHeadings: taStats.headings, // printed in the source (## headings)
    // Logical reading paragraphs (one paragraph may span several source pages).
    tamilParagraphs: taStats.paragraphs,
    englishParagraphs: enStats.paragraphs,
    // Physical per-source-page text fragments that make up those paragraphs.
    tamilSourceTextSegments: taStats.segments,
    englishSourceTextSegments: enStats.segments,
    // Logical paragraphs that continue across a source-page boundary.
    tamilCrossPageParagraphs: taStats.crossPageParagraphs,
    englishCrossPageParagraphs: enStats.crossPageParagraphs,
    // Cross-page joins by kind (mid-word "none" vs ordinary word-boundary "space").
    tamilMidWordJoins: taStats.midWordJoins,
    tamilWordSpaceJoins: taStats.spaceJoins,
    sourcePagesCovered: tamilPages.length,
    note: "Section headings are printed in the source. Paragraphs are LOGICAL reading paragraphs: a source-page boundary is not a paragraph boundary, so one paragraph may span multiple source pages via per-page text segments (each retaining its source page). Mid-word page splits documented in the source verification log join with no space; other cross-page continuations join with a single space; a completed sentence at a page boundary is treated as a paragraph break. No archive-created navigation numbering is imposed on the reader.",
  },
  // Present project-level rights status of the UNDERLYING Kalaignar-authored work (Tamil:
  // நாட்டுடைமையாக்கப்பட்டது). Project-level fact (Tamil Nadu Government nationalisation), kept
  // DISTINCT from the 1970 edition's own publication data. The GO number and formal ISSUE date
  // are unverified (null); 2024-12-22 is the public HANDOVER only, not the issue date.
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
      "The 1970 publication's own imprint data and the later Tamil Nadu Government nationalisation are different facts; the imprint does not describe the present rights status.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored speech. It does not extend to third-party contributions or to the project-created English translation, which retain their own provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only.",
  },
  notes: [
    "The controlling source is the scanned 1970 booklet; only scan pages 5–46 are the Assembly speech (1–4 front matter, 47–48 advertisements).",
    "Tamil is the verified source transcription; English is the verified faithful reading translation placed after the complete Tamil. Neither was edited during import.",
    "Printed section headings are preserved. A source-page boundary is NOT a paragraph boundary: one logical paragraph may span several source pages via per-page text segments, each retaining its source page; mid-word page splits (verification log) join with no space. No archive-created navigation numbering is presented as source numbering.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("tamil: paragraphs", taStats.paragraphs, "| headings", taStats.headings, "| segments", taStats.segments, "| cross-page paras", taStats.crossPageParagraphs, "| mid-word joins", taStats.midWordJoins, "| space joins", taStats.spaceJoins);
console.log("english: paragraphs", enStats.paragraphs, "| headings", enStats.headings, "| segments", enStats.segments, "| cross-page paras", enStats.crossPageParagraphs);
console.log("source pages covered:", tamilPages[0], "–", tamilPages[tamilPages.length - 1], `(${tamilPages.length})`);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
