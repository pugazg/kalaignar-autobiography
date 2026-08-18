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

// ── Parse transcript.md into two ordered block streams (Tamil, English) ─────────
// The file is: title + note, then `# தமிழ் மூல உரை` (Tamil), then `# English translation`.
// Within a section: `## ` = printed section heading; `### Source page N` = an English
// source-page anchor; `<!-- source-page: N -->` = a Tamil source-page boundary; other
// non-empty lines are paragraphs. Text is copied verbatim; only the structural markers are
// interpreted. Nothing is rewritten.
function parseSection(lines) {
  const blocks = [];
  let currentPage = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^<!--\s*source-page:\s*(\d+)\s*-->$/))) {
      currentPage = Number(m[1]);
      continue;
    }
    if ((m = line.match(/^###\s+Source page\s+(\d+)\s*$/i))) {
      // English source-page anchor (occasional); record it and update the running page.
      currentPage = Number(m[1]);
      blocks.push({ kind: "page-marker", sourcePage: currentPage, text: `Source page ${m[1]}` });
      continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      blocks.push({ kind: "heading", text: m[1].trim(), sourcePage: currentPage });
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      // Blockquote — an editorial note (e.g. the translation note). Kept verbatim
      // (inner Markdown emphasis preserved); rendered as a distinct note, not raw.
      blocks.push({ kind: "note", text: m[1].trim(), sourcePage: currentPage });
      continue;
    }
    if (/^#\s+/.test(line)) continue; // stray H1 (shouldn't occur inside a section)
    // Paragraph text is preserved verbatim, including source Markdown emphasis
    // (**speaker labels** in parliamentary interjections, *(Laughter.)* etc.),
    // which the reader renders faithfully. Nothing is rewritten.
    blocks.push({ kind: "para", text: line, sourcePage: currentPage });
  }
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

// Source-page span actually covered by the Tamil transcription (audit trail).
const tamilPages = [...new Set(tamilBlocks.map((b) => b.sourcePage).filter((p) => p != null))].sort(
  (a, b) => a - b,
);

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
    sectionHeadings: tamilBlocks.filter((b) => b.kind === "heading").length,
    tamilParagraphs: tamilBlocks.filter((b) => b.kind === "para").length,
    englishParagraphs: englishBlocks.filter((b) => b.kind === "para").length,
    sourcePagesCovered: tamilPages.length,
    note: "Section headings are printed in the source; paragraph splits follow the source. No archive-created navigation numbering is imposed on the reader.",
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
    "Printed section headings and source-page boundaries are preserved. Paragraphs follow the source; no archive-created navigation numbering is presented as source numbering.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("tamil blocks:", tamilBlocks.length, "(headings", speech.tamil.blocks.filter((b) => b.kind === "heading").length + ")");
console.log("english blocks:", englishBlocks.length);
console.log("source pages covered:", tamilPages[0], "–", tamilPages[tamilPages.length - 1], `(${tamilPages.length})`);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
