// Deterministic, work-specific importer for அறப்போர் / Arappor (Digital Library Phase 3 —
// Speeches; third benchmark). A public speech by Kalaignar M. Karunanidhi preserved in the
// second-edition booklet of April 1949.
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-public-speeches
// (speeches/arappor) at a pinned commit, and vendors static bilingual reader data into this website
// under public/data/speeches/arappor/. Runtime never calls GitHub. The source PDF is never vendored
// (its identity travels as filename + SHA-256 + size + page map only).
//
// THE BENCHMARK-#3 POINT: this source states NO speech date, NO venue and NO event. Those absences
// are SOURCE FACTS, faithfully carried through as null — the April 1949 publication/edition date is
// never substituted for a speech date, and no venue/event/occasion/audience is inferred.
//
// Fidelity: the strict-verified Tamil (transcription-ta.md) is authoritative; the verified-complete
// English (translation-en.md) is the faithful reading translation. Neither is retranslated,
// modernized or normalized; source-supported difficult forms are preserved exactly as released.
//
// Usage: node scripts/import-arappor.mjs <path-to-public-speeches-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-arappor.mjs <public-speeches-clone> <source-commit>");
  process.exit(1);
}

// Fail closed BEFORE anything is written: the source clone's actual git HEAD must equal the
// supplied <source-commit>, so we never record a SHA that does not match the checked-out tree.
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

const SPEECH_DIR = path.join(SRC_REPO, "speeches/arappor");
const SLUG = "arappor";
const OUT = path.join(process.cwd(), "public/data/speeches", SLUG);

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));

const meta = readJSON(path.join(SPEECH_DIR, "metadata.json"));
const tamilSrc = readText(path.join(SPEECH_DIR, "transcription-ta.md"));
const englishSrc = readText(path.join(SPEECH_DIR, "translation-en.md"));

// ── EXPLICIT source-evidence page-boundary table (Tamil), keyed by the printed page ENTERED ──────
// The speech body is PDF 4-20 / printed 3-19 → 17 pages → 16 internal transitions, every one of
// which is classified here from what the SOURCE ARCHIVE itself records — never from punctuation,
// never from sentence completion, never from semantic continuity, never from speaker count, and
// never from any downstream inspection of a locally available PDF.
//
//   "same-paragraph" — the source archive establishes that the printed text continued across the
//                      break. Arappor's audit.md records five genuine cross-page WORD splits that
//                      were joined during consolidation; a word physically spanning a page break
//                      proves the printed paragraph continued through it.
//   "unknown"        — the source archive records NO printed-paragraph relation for this
//                      transition. It states neither that the paragraph continued nor that a new
//                      printed paragraph began, so the relation stays unresolved and is rendered
//                      neutrally. audit.md's general remark that "page-boundary joins and paragraph
//                      boundaries" were checked is NOT per-transition evidence and is deliberately
//                      not read as such.
//
// LEXICAL JOIN — an important, easily-missed detail. audit.md documents the five splits as
// `மௌ`/`னம்` → `மௌனம்` etc., but the consolidation ALREADY reassembled each word into the FIRST
// page's text: printed p.4 ends with the complete `மௌனம்` and printed p.5 begins with the complete
// word `சாதித்தனர்`. The mid-word split therefore no longer exists at the segment boundary, and the
// remaining join is an ordinary word boundary. Encoding these as `join: "none"` would render
// `மௌனம்சாதித்தனர்` and corrupt five passages, so they are `join: "space"`. Verified for all five.
const TA_BOUNDARY = {
  // printed toPage: relation, join, evidence
  4:  { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.3→4 → unresolved (not derived here)" },
  5:  { rel: "same-paragraph", join: "space", ev: "audit.md documents the cross-page word split `மௌ`/`னம்` → `மௌனம்` at this boundary, so the printed paragraph continued; the archive already joined the word into printed p.4, leaving an ordinary word boundary here" },
  6:  { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.5→6 → unresolved (not derived here)" },
  7:  { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.6→7 → unresolved (not derived here)" },
  8:  { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.7→8 → unresolved (not derived here)" },
  9:  { rel: "same-paragraph", join: "space", ev: "audit.md documents the cross-page word split `நடரா`/`ஜன்` → `நடராஜன்` at this boundary; word already joined into printed p.8, leaving an ordinary word boundary" },
  10: { rel: "same-paragraph", join: "space", ev: "audit.md documents the cross-page word split `அதற்`/`காக` → `அதற்காக` at this boundary; word already joined into printed p.9, leaving an ordinary word boundary" },
  11: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.10→11 → unresolved (not derived here)" },
  12: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.11→12 → unresolved (not derived here)" },
  13: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.12→13 → unresolved (not derived here)" },
  14: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.13→14 → unresolved (not derived here)" },
  15: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.14→15 → unresolved (not derived here)" },
  16: { rel: "same-paragraph", join: "space", ev: "audit.md documents the cross-page word split `சுப்பரா`/`யன்` → `சுப்பராயன்` at this boundary; word already joined into printed p.15, leaving an ordinary word boundary" },
  17: { rel: "same-paragraph", join: "space", ev: "audit.md documents the cross-page word split `கடை`/`சியாக` → `கடைசியாக` at this boundary; word already joined into printed p.16, leaving an ordinary word boundary" },
  18: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.17→18 → unresolved (not derived here)" },
  19: { rel: "unknown",        join: "end",   ev: "source archive records no printed-paragraph relation for printed p.18→19 → unresolved (not derived here)" },
};

// Page markers. Tamil uses "### PDF page N - printed page M" (hyphen); English uses an em dash.
const PAGE_RE = /^###\s+PDF page\s+(\d+)\s*[-—]\s*printed page\s+(\d+)\s*$/;

// Parse a body bounded by "## Speech body" … next top-level "## " section. Page markers set the
// current page; `####` printed headings become heading blocks; the per-page verification table and
// horizontal rules are skipped. Two blank-separated text lines on one page are separate printed
// paragraphs (the archive states paragraph boundaries are preserved); CROSS-page relationships come
// only from the audited table above.
function parseTamil(text) {
  const body = text.split("## Speech body")[1].split("\n## ")[0];
  const blocks = [];
  let printedPage = null, pendingToPage = null, para = null, started = false;
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage))].sort((a, b) => a - b);
      para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  const startPara = (t, p) => { para = { kind: "paragraph", segments: [{ text: t, sourcePage: p, joinToNext: "end" }], sourcePages: [] }; };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(PAGE_RE))) { started = true; printedPage = Number(m[2]); pendingToPage = printedPage; continue; }
    if (!started) continue;
    if (line.trim() === "" || /^-{3,}$/.test(line) || line.trim().startsWith("|")) continue;
    if ((m = line.match(/^####\s+(.*)$/))) { flush(); blocks.push({ kind: "heading", text: m[1].trim(), sourcePage: printedPage }); pendingToPage = null; continue; }
    if (/^#{1,3}\s+/.test(line)) continue;
    if (!para) {
      startPara(line, printedPage);
    } else if (pendingToPage != null) {
      const entry = TA_BOUNDARY[pendingToPage];
      if (!entry) throw new Error(`no audited Tamil boundary entry for printed page ${pendingToPage}`);
      if (entry.rel === "same-paragraph") {
        para.segments[para.segments.length - 1].joinToNext = entry.join;
        para.segments.push({ text: line, sourcePage: printedPage, joinToNext: "end" });
      } else {
        // Unresolved printed-paragraph relation → NEUTRAL: close the run, emit an unresolved-break,
        // open the next run. The reader groups both runs in one non-<p> role="group".
        flush();
        blocks.push({ kind: "unresolved-break", toPage: pendingToPage, relation: "unknown", note: entry.ev });
        startPara(line, printedPage);
      }
    } else {
      flush();
      startPara(line, printedPage);
    }
    pendingToPage = null;
  }
  flush();
  return blocks;
}

// ── EXPLICIT English anchor audit (EN_BOUNDARY) — NO punctuation heuristic ──────────────────────
// The verified translation supplies its OWN paragraph structure (blank-separated blocks); each
// "### PDF page N — printed page M" marker is PROVENANCE only, never a paragraph boundary in
// itself. Every printed-page anchor 3-19 is classified explicitly:
//   "heading-boundary"   — the anchor is adjacent to the printed `#### Arappor` title (printed p.3).
//   "paragraph-boundary" — the default: the anchor sits between two distinct translator paragraphs.
// Arappor's English keeps its translator/source notes in a separate "## Translator/source notes"
// section rather than inline, so no anchor is note-adjacent and no cross-anchor sentence
// continuation is asserted. English structure is never projected back onto Tamil.
const EN_BOUNDARY = {};
for (let p = 3; p <= 19; p++) EN_BOUNDARY[p] = { rel: "paragraph-boundary" };
EN_BOUNDARY[3] = { rel: "heading-boundary" };

function parseEnglish(text) {
  const body = text.split("## Speech body")[1].split("\n## ")[0];
  const blocks = [];
  let printedPage = null, para = null, started = false;
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage).filter((p) => p != null))].sort((a, b) => a - b);
      para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(PAGE_RE))) { started = true; printedPage = Number(m[2]); continue; }
    if (!started) continue;
    if (line.trim() === "" || /^-{3,}$/.test(line) || line.trim().startsWith("|")) continue;
    if ((m = line.match(/^####\s+(.*)$/))) { flush(); blocks.push({ kind: "heading", text: m[1].trim(), sourcePage: printedPage }); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flush(); blocks.push({ kind: "note", text: m[1].trim(), sourcePage: printedPage }); continue; }
    if (/^#{1,3}\s+/.test(line)) continue;
    flush();
    para = { kind: "paragraph", segments: [{ text: line, sourcePage: printedPage, joinToNext: "end" }], sourcePages: [] };
  }
  flush();
  return blocks;
}

// The translator/source notes live in their own trailing section; carry them verbatim as note
// blocks appended after the body so they are preserved without being mistaken for speech prose.
function parseTrailingNotes(text) {
  const i = text.indexOf("## Translator/source notes");
  if (i === -1) return [];
  const sec = text.slice(i).split("\n## ")[0];
  return sec
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.trim() && !/^#{1,4}\s+/.test(l) && !/^-{3,}$/.test(l))
    .map((l) => ({ kind: "note", text: l.replace(/^[-*]\s+/, "").trim(), sourcePage: null }));
}

const tamilBlocks = parseTamil(tamilSrc);
const englishBlocks = [...parseEnglish(englishSrc), ...parseTrailingNotes(englishSrc)];

function streamStats(blocks) {
  const pages = new Set();
  let headings = 0, resolvedParagraphs = 0, unresolvedRuns = 0, notes = 0, segments = 0,
    crossPageParagraphs = 0, midWordJoins = 0, spaceJoins = 0, unknownLexicalJoins = 0, unresolvedBreaks = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind === "heading") { headings++; if (b.sourcePage != null) pages.add(b.sourcePage); }
    else if (b.kind === "note") { notes++; if (b.sourcePage != null) pages.add(b.sourcePage); }
    else if (b.kind === "unresolved-break") { unresolvedBreaks++; if (b.toPage != null) pages.add(b.toPage); }
    else if (b.kind === "paragraph") {
      const adj = blocks[i - 1]?.kind === "unresolved-break" || blocks[i + 1]?.kind === "unresolved-break";
      if (adj) unresolvedRuns++; else resolvedParagraphs++;
      if (b.segments.length > 1) crossPageParagraphs++;
      for (const s of b.segments) {
        segments++;
        if (s.sourcePage != null) pages.add(s.sourcePage);
        if (s.joinToNext === "none") midWordJoins++;
        else if (s.joinToNext === "space") spaceJoins++;
        else if (s.joinToNext === "unknown") unknownLexicalJoins++;
      }
    }
  }
  return { headings, resolvedParagraphs, unresolvedRuns, notes, segments, crossPageParagraphs, midWordJoins, spaceJoins, unknownLexicalJoins, unresolvedBreaks, pages: [...pages].sort((a, b) => a - b) };
}
const taStats = streamStats(tamilBlocks);
const enStats = streamStats(englishBlocks);

const tb = Object.values(TA_BOUNDARY);
const auditCounts = {
  transitions: tb.length,
  sameParagraph: tb.filter((e) => e.rel === "same-paragraph").length,
  paragraphBoundary: tb.filter((e) => e.rel === "paragraph-boundary").length,
  headingBoundary: tb.filter((e) => e.rel === "heading-boundary").length,
  unknownParagraphRelation: tb.filter((e) => e.rel === "unknown").length,
  joinNone: tb.filter((e) => e.rel === "same-paragraph" && e.join === "none").length,
  joinSpace: tb.filter((e) => e.rel === "same-paragraph" && e.join === "space").length,
  joinUnknown: tb.filter((e) => e.rel === "same-paragraph" && e.join === "unknown").length,
};
const tamilPages = taStats.pages;

const speech = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: "speeches/arappor",
  sourceCommit: SRC_COMMIT,
  shelf: "speeches",
  subtype: "public-speech",
  readerStructure: "speech",
  // SOURCE FACTS: the examined booklet states no speech date, venue or event. Carried as null —
  // the April 1949 publication/edition date is NOT a speech date and is never substituted here.
  date: meta.speech.date, // null
  year: meta.speech.date ? Number(String(meta.speech.date).slice(0, 4)) : null, // null
  title: { ta: meta.title.ta, en: meta.title.en_transliteration },
  speechType: meta.document_type, // "public-speech-booklet"
  speaker: { nameTa: meta.creator.name_ta, nameEn: meta.creator.name_en },
  venue: meta.speech.venue, // null
  event: meta.speech.event, // null
  occasion: null,
  audience: null,
  transcriptionStatus: meta.workflow.tamil_transcription, // "verified-complete"
  translationStatus: meta.workflow.english_translation, // "verified-complete"
  tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: tamilBlocks },
  english: { sectionTitleEn: "English translation", blocks: englishBlocks },
  sourcePages: tamilPages, // printed pages 3-19
};
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "speech.json"), JSON.stringify(speech, null, 1) + "\n");

const provenance = {
  workId: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: "speeches/arappor",
  sourceCommit: SRC_COMMIT,
  source: {
    publicationTitleTa: meta.title.ta,
    authorTa: meta.creator.name_ta,
    editionTa: meta.publication.edition_text, // இரண்டாம்பதிப்பு ஏப்ரல் 1949
    publicationDate: `${meta.publication.publication_year}-04`, // EDITION date, never the speech date
    publisherTa: meta.publication.publisher_ta,
    publisherLocationTa: "சென்னை - 1",
    printerTa: meta.publication.printer_ta,
    printerLocationTa: "சென்னை - 1",
    coverPriceTa: meta.publication.price_text,
    scanFilename: meta.source.filename,
    scanTotalPages: meta.source.pdf_pages, // 22
    speechScanPages: "4–20", // PDF pages
    frontMatterScanPages: "1–3", // cover, title page, imprint
    advertisementScanPages: "21–22", // publisher advertisements / back matter
    scanSha256: meta.source.sha256,
    scanFileSizeBytes: meta.source.file_size_bytes,
    printedSpeechPages: "3–19",
    publisherAddressTa: meta.publication.publisher_address_ta,
    // SOURCE FACTS — absences, not blockers.
    speechFactsNotStated: [
      "Speech date — not stated in the examined source. April 1949 is the second edition's publication date and is NOT used as a speech date.",
      "Venue — not stated in the examined source; none is inferred.",
      "Event / occasion / audience — not stated in the examined source; none is inferred.",
    ],
    speechFactsNoteEn:
      "The examined scan states no speech date, venue or event on its cover, title or imprint pages. These remain unset pending independent source evidence; the Digital Library does not infer them.",
  },
  transcription: {
    status: meta.workflow.tamil_transcription,
    verified_against_scan: true,
    method: "manual transcription with a strict line-by-line visual fidelity re-audit of all 17 speech pages (4 batches), consolidated",
    note: "Tamil is the authoritative strict-verified layer; source-supported spelling, punctuation, unusual and possibly erroneous printed forms are preserved rather than normalized.",
  },
  translation: {
    status: meta.workflow.english_translation,
    type: "faithful reading translation",
    language: "en",
    from: "strict-verified Tamil (transcription-ta.md)",
    verified: true,
    note: "Project-created, source-linked; rhetoric, repetition, historical references and polemical language preserved. Translator/source notes are carried as notes, never as speech prose.",
  },
  archiveDerived: {
    sectionHeadings: taStats.headings,
    tamilResolvedParagraphs: taStats.resolvedParagraphs,
    tamilUnresolvedGroupRuns: taStats.unresolvedRuns,
    englishParagraphs: enStats.resolvedParagraphs + enStats.unresolvedRuns,
    tamilSourceTextSegments: taStats.segments,
    englishSourceTextSegments: enStats.segments,
    tamilCrossPageParagraphs: taStats.crossPageParagraphs,
    englishCrossPageParagraphs: enStats.crossPageParagraphs,
    sourcePagesCovered: tamilPages.length, // 17 (printed 3-19)
    boundaryAudit: {
      tamilTransitions: auditCounts.transitions, // 16
      sameParagraph: auditCounts.sameParagraph, // 5 (the documented cross-page word splits)
      paragraphBoundary: auditCounts.paragraphBoundary, // 0 source-established
      headingBoundary: auditCounts.headingBoundary, // 0
      unknownParagraphRelation: auditCounts.unknownParagraphRelation, // 11
      lexicalJoinNone: auditCounts.joinNone,
      lexicalJoinSpace: auditCounts.joinSpace,
      lexicalJoinUnknown: auditCounts.joinUnknown,
    },
    englishBoundaryAudit: {
      englishAnchors: Object.keys(EN_BOUNDARY).length, // 17 (printed 3-19)
      paragraphBoundary: Object.values(EN_BOUNDARY).filter((e) => e.rel === "paragraph-boundary").length,
      headingNoteBoundary: Object.values(EN_BOUNDARY).filter((e) => e.rel === "heading-boundary").length,
      sameParagraphContinuations: Object.values(EN_BOUNDARY).filter((e) => e.rel === "same-paragraph").length,
      note: "Every English printed-page anchor (3-19) has an EXPLICIT EN_BOUNDARY entry classified from the released translation structure — the printed title and the translator's own blank-separated blocks — NEVER from punctuation. Anchors are provenance only. Translator/source notes are carried verbatim from the translation's own trailing notes section. English paragraph structure is never projected back onto Tamil.",
    },
    note: "Section headings are printed in the source. A source-page boundary is NOT a paragraph boundary; paragraph relations are taken ONLY from what the source archive establishes — never from punctuation, sentence completion, semantic continuity or speaker count, and never from any downstream inspection of the scan. The archive documents five genuine cross-page word splits, which prove the printed paragraph continued at those five boundaries; because consolidation already reassembled each word into the preceding page, the remaining segment join there is an ordinary word boundary (space), not a mid-word join. For the other eleven transitions the archive records no printed-paragraph relation at all, so they remain UNRESOLVED and render neutrally.",
  },
  blockers: [
    {
      item: "unresolved-paragraph-relationship",
      count: auditCounts.unknownParagraphRelation,
      detail: `${auditCounts.unknownParagraphRelation} printed-page boundaries for which the source archive records no printed-paragraph relation: it establishes neither that the printed paragraph continues nor that a new one begins. Encoded as unresolved-break (neither same-paragraph nor a new paragraph) and rendered as a neutral source-page rule. No relation is inferred here from punctuation, sentence completion, semantic continuity or speaker count.`,
      resolution:
        "Resolution requires an upstream source-archive visual review of the controlling scan TVA_BOK_0064122_அறப்போர்.pdf (speech PDF pp.4–20 / printed pp.3–19) that explicitly records the printed paragraph relation for these transitions. The source PDF is not vendored here, and this Digital Library integration does not establish those typographic facts independently.",
    },
  ],
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
      "The 1949 second edition's own publisher/printer/price data is a source/edition fact, distinct from and not a statement of the present rights of Kalaignar's underlying speech.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored speech. It does not extend to the project-created English translation, or to third-party edition material — publisher advertisements, cover/design, imprint or annotations — which retain their own provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only.",
  },
  notes: [
    "The controlling source is the scanned second-edition booklet (April 1949); only the speech body — PDF pages 4–20 / printed pages 3–19 (17 pages) — is transcribed. PDF 1–3 (cover, title page, imprint) and PDF 21–22 (publisher advertisements / back matter) are NOT speech body. The source PDF is not vendored.",
    "The examined source states NO speech date, NO venue and NO event. These are source facts, not implementation blockers: they are carried as unset and documented on this page. April 1949 is the edition's publication date and is never presented as the speech date.",
    "Tamil is the strict-verified source transcription; English is the verified-complete faithful reading translation made from it. Neither was edited during import; source-supported difficult and possibly erroneous printed forms are preserved exactly as released, and translator/source notes are carried as notes.",
    "Of the 16 printed-page transitions, the archive establishes 5 as continuations via documented cross-page word splits (`மௌனம்`, `நடராஜன்`, `அதற்காக`, `சுப்பராயன்`, `கடைசியாக`) and records no printed-paragraph relation for the other 11, which stay UNRESOLVED and render neutrally. There are 0 source-established clean paragraph boundaries — a statement about the archive's silence, not an inference.",
    "Because consolidation already reassembled each split word into the preceding page's text, those five segment boundaries join with a single space; encoding them as mid-word joins would corrupt the rendered text.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("tamil boundary audit:", JSON.stringify(auditCounts));
console.log("tamil: resolved paras", taStats.resolvedParagraphs, "| unresolved-group runs", taStats.unresolvedRuns, "| headings", taStats.headings, "| segments", taStats.segments, "| joins none/space/unknown", `${taStats.midWordJoins}/${taStats.spaceJoins}/${taStats.unknownLexicalJoins}`, "| unresolved-breaks", taStats.unresolvedBreaks);
console.log("english: paragraphs", enStats.resolvedParagraphs + enStats.unresolvedRuns, "| notes", enStats.notes, "| headings", enStats.headings, "| segments", enStats.segments);
console.log("source pages covered (printed):", tamilPages[0], "–", tamilPages[tamilPages.length - 1], `(${tamilPages.length})`);
console.log("date/venue/event:", speech.date, "/", speech.venue, "/", speech.event);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
