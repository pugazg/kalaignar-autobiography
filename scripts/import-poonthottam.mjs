// Deterministic, work-specific importer for பூந்தோட்டம் / Poonthottam.
// Phase 3 Benchmark #2 deliberately remains a single-work adapter — this is NOT a generalized
// speech-ingestion framework. It reads the fully released public-speech archive at one pinned
// commit and vendors static reader/provenance JSON. Production never calls GitHub at runtime.
//
// Usage:
//   node scripts/import-poonthottam.mjs <path-to-public-speeches-clone> <source-commit>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SRC_REPO = process.argv[2];
const SRC_COMMIT = process.argv[3];
if (!SRC_REPO || !SRC_COMMIT) {
  console.error("usage: node scripts/import-poonthottam.mjs <public-speeches-clone> <source-commit>");
  process.exit(1);
}

let actualHead;
try {
  actualHead = execFileSync("git", ["-C", SRC_REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch (e) {
  throw new Error(`unable to read git HEAD of source clone at ${SRC_REPO}: ${e.message}`);
}
if (actualHead !== SRC_COMMIT) {
  throw new Error(
    `source-commit mismatch: supplied ${SRC_COMMIT} but ${SRC_REPO} HEAD is ${actualHead}. ` +
      "Refusing to generate data from an unpinned source tree.",
  );
}

const SLUG = "poonthottam";
const SPEECH_DIR = path.join(SRC_REPO, "speeches/poonthottam");
const OUT = path.join(process.cwd(), "public/data/speeches", SLUG);
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const meta = readJSON(path.join(SPEECH_DIR, "metadata.json"));
const tamilSource = readText(path.join(SPEECH_DIR, "transcription-ta.md"));
const englishSource = readText(path.join(SPEECH_DIR, "translation-en.md"));

// EXPLICIT work-specific boundary audit over the 11 physical speech-page transitions.
// The source archive's T3/E3 records explicitly establish three same-sentence continuations:
//   PDF 6→7: பண்படுத்த / வேண்டும்.
//   PDF 7→8: ...மொண்டு மொண்டு தரும் / தென்றலாக...
//   PDF 11→12: ...வேலைகளை விட்டு ஓய்வு / பெறுகிறவர்...
// They are ordinary lexical word boundaries, so join with one space.
//
// For the other eight transitions, the archive verifies that no text is omitted/duplicated and
// records the continuous argument, but does NOT explicitly record whether the printed paragraph
// itself continues across the physical page edge. We therefore keep that relationship UNKNOWN.
// A terminal punctuation mark is never used to decide it. Read-only scan inspection (or a future
// source-repo audit that records the printed paragraph relation) is required to resolve those 8.
const BOUNDARY = {
  7:  { rel: "same-paragraph", join: "space", evidence: "T3: printed p.5→6 பண்படுத்த / வேண்டும். continuation" },
  8:  { rel: "same-paragraph", join: "space", evidence: "T3: printed p.6→7 fragrance sentence / தென்றலாக continuation" },
  9:  { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  10: { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  11: { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  12: { rel: "same-paragraph", join: "space", evidence: "T3: printed p.10→11 வேலைகளை விட்டு ஓய்வு / பெறுகிறவர் continuation" },
  13: { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  14: { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  15: { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  16: { rel: "unknown", join: "end", evidence: "E3 transition verified; printed paragraph relationship not recorded" },
  17: { rel: "unknown", join: "end", evidence: "T3 confirms thought transition/no split-word damage; printed paragraph relationship not recorded" },
};

function parsePageSections(markdown) {
  const pages = [];
  let current = null;
  const flush = () => {
    if (current) pages.push(current);
    current = null;
  };

  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const page = line.match(/^##\s+PDF page\s+(\d+)\s*\/\s*printed page\s+(\d+)\s*$/i);
    if (page) {
      const pdfPage = Number(page[1]);
      if (pdfPage >= 6 && pdfPage <= 17) {
        flush();
        current = { pdfPage, printedPage: Number(page[2]), lines: [] };
      } else if (current) {
        flush();
      }
      continue;
    }
    if (!current) continue;
    // The canonical speech-body section ends when the repository starts its post-body gate notes.
    if (/^##\s+/.test(line)) {
      flush();
      break;
    }
    if (line.trim() === "---") continue;
    current.lines.push(line);
  }
  flush();

  const wanted = Array.from({ length: 12 }, (_, i) => i + 6);
  const got = pages.map((p) => p.pdfPage);
  if (JSON.stringify(got) !== JSON.stringify(wanted)) {
    throw new Error(`expected PDF speech pages 6-17 exactly once; got ${got.join(",")}`);
  }
  return pages;
}

function pageBlocks(page) {
  const groups = [];
  let group = [];
  const flush = () => {
    if (group.length) groups.push(group);
    group = [];
  };
  for (const line of page.lines) {
    if (line.trim() === "") flush();
    else group.push(line);
  }
  flush();

  return groups.map((lines) => {
    if (lines.length === 1 && /^#\s+/.test(lines[0])) {
      return { kind: "heading", text: lines[0].replace(/^#\s+/, ""), sourcePage: page.pdfPage };
    }
    if (lines.every((l) => /^>\s?/.test(l))) {
      return { kind: "note", text: lines.map((l) => l.replace(/^>\s?/, "")).join("\n"), sourcePage: page.pdfPage };
    }
    return {
      kind: "paragraph",
      segments: [{ text: lines.join("\n"), sourcePage: page.pdfPage, joinToNext: "end" }],
      sourcePages: [page.pdfPage],
    };
  });
}

function buildBlocks(markdown) {
  const pages = parsePageSections(markdown);
  const blocks = [];

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    const incoming = pageBlocks(page);
    if (pi === 0) {
      blocks.push(...incoming);
      continue;
    }

    const boundary = BOUNDARY[page.pdfPage];
    if (!boundary) throw new Error(`missing explicit boundary audit for PDF page ${page.pdfPage}`);

    if (boundary.rel === "same-paragraph") {
      // A translator note can sit textually between two source-page fragments in translation-en.md.
      // To avoid turning a physical page edge into a semantic paragraph break, extend the previous
      // paragraph object even when a trailing editorial note follows it; the note remains verbatim
      // as its own block immediately after the completed paragraph in the public reading view.
      let previousParagraphIndex = -1;
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].kind === "paragraph") { previousParagraphIndex = i; break; }
        if (blocks[i].kind === "heading" || blocks[i].kind === "unresolved-break") break;
      }
      const firstParagraphIndex = incoming.findIndex((b) => b.kind === "paragraph");
      if (previousParagraphIndex === -1 || firstParagraphIndex === -1) {
        throw new Error(`audited same-paragraph transition into p${page.pdfPage} lacks paragraph fragments`);
      }
      const prev = blocks[previousParagraphIndex];
      const next = incoming[firstParagraphIndex];
      prev.segments[prev.segments.length - 1].joinToNext = boundary.join;
      prev.segments.push(...next.segments);
      prev.sourcePages = [...new Set([...prev.sourcePages, ...next.sourcePages])].sort((a, b) => a - b);
      incoming.splice(firstParagraphIndex, 1);
      blocks.push(...incoming);
      continue;
    }

    if (boundary.rel === "unknown") {
      blocks.push({
        kind: "unresolved-break",
        toPage: page.pdfPage,
        relation: "unknown",
        note: boundary.evidence,
      });
      blocks.push(...incoming);
      continue;
    }

    throw new Error(`unsupported boundary relation ${boundary.rel}`);
  }

  return blocks;
}

const tamilBlocks = buildBlocks(tamilSource);
const englishBlocks = buildBlocks(englishSource);

function streamStats(blocks) {
  const pages = new Set();
  let headings = 0;
  let paragraphs = 0;
  let segments = 0;
  let crossPageParagraphs = 0;
  const unresolvedBreaks = [];
  const unresolvedRunIndexes = new Set();

  blocks.forEach((b, i) => {
    if (b.kind === "heading") {
      headings++;
      if (b.sourcePage != null) pages.add(b.sourcePage);
    } else if (b.kind === "note") {
      if (b.sourcePage != null) pages.add(b.sourcePage);
    } else if (b.kind === "unresolved-break") {
      unresolvedBreaks.push(b);
      pages.add(b.toPage);
      if (blocks[i - 1]?.kind === "paragraph") unresolvedRunIndexes.add(i - 1);
      if (blocks[i + 1]?.kind === "paragraph") unresolvedRunIndexes.add(i + 1);
    } else if (b.kind === "paragraph") {
      paragraphs++;
      segments += b.segments.length;
      if (b.segments.length > 1) crossPageParagraphs++;
      b.segments.forEach((s) => { if (s.sourcePage != null) pages.add(s.sourcePage); });
    }
  });

  return {
    headings,
    paragraphs,
    resolvedParagraphs: paragraphs - unresolvedRunIndexes.size,
    unresolvedRuns: unresolvedRunIndexes.size,
    segments,
    crossPageParagraphs,
    unresolvedBreaks,
    pages: [...pages].sort((a, b) => a - b),
  };
}

const taStats = streamStats(tamilBlocks);
const enStats = streamStats(englishBlocks);
const boundaryValues = Object.values(BOUNDARY);
const auditCounts = {
  transitions: boundaryValues.length,
  sameParagraph: boundaryValues.filter((b) => b.rel === "same-paragraph").length,
  paragraphBoundary: 0,
  headingBoundary: 0,
  unknownParagraphRelation: boundaryValues.filter((b) => b.rel === "unknown").length,
  joinNone: boundaryValues.filter((b) => b.rel === "same-paragraph" && b.join === "none").length,
  joinSpace: boundaryValues.filter((b) => b.rel === "same-paragraph" && b.join === "space").length,
  joinUnknown: boundaryValues.filter((b) => b.rel === "same-paragraph" && b.join === "unknown").length,
};

const speech = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: "speeches/poonthottam",
  sourceCommit: SRC_COMMIT,
  shelf: "speeches",
  subtype: "public-speech",
  readerStructure: "speech",
  date: meta.speech.date,
  year: Number(meta.speech.date.slice(0, 4)),
  title: { ta: meta.speech.title_ta, en: "Poonthottam" },
  event: null,
  venue: { ta: meta.speech.venue_ta, en: "Guindy Engineering College, Chennai" },
  speechType: meta.document_type,
  speaker: { nameTa: meta.creator.name_ta, nameEn: meta.creator.name_en },
  legislature: null,
  transcriptionStatus: meta.workflow.tamil_transcription,
  translationStatus: meta.workflow.english_translation,
  tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: tamilBlocks },
  english: { sectionTitleEn: "English translation", blocks: englishBlocks },
  sourcePages: taStats.pages,
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "speech.json"), JSON.stringify(speech, null, 1) + "\n");

const provenance = {
  workId: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: "speeches/poonthottam",
  sourceCommit: SRC_COMMIT,
  source: {
    publicationTitleTa: meta.title.ta,
    authorTa: meta.creator.current_edition_name_ta,
    editionTa: meta.publication.edition_text,
    publicationDate: String(meta.publication.publication_year),
    publisherTa: meta.publication.publisher_ta,
    publisherLocationTa: meta.publication.publisher_address_ta,
    printerTa: meta.publication.printer_ta,
    coverPriceTa: meta.publication.price_text,
    scanFilename: meta.source.filename,
    scanSha256: meta.source.sha256,
    scanFileSizeBytes: meta.source.file_size_bytes,
    scanTotalPages: meta.source.pdf_pages,
    speechScanPages: "6-17",
    printedSpeechPages: "5-16",
    nonSpeechScanPages: "PDF 1-5, 18",
    controllingSourceNoteTa:
      "கட்டுப்படுத்தும் மூலம் TVA_BOK_0065784_கலைஞரின்_பூந்தோட்டம்.pdf scan. PDF 6–17 / அச்சுப் பக்கங்கள் 5–16 மட்டுமே உரைப் பகுதி. மூல PDF இந்த இணையத் திட்டத்தில் சேமிக்கப்படவில்லை; அடையாள SHA-256 மூலக் களஞ்சிய metadata-இல் தக்கவைக்கப்பட்டுள்ளது.",
    controllingSourceNoteEn:
      "The controlling source is the TVA_BOK_0065784 Poonthottam scan. Only PDF 6–17 / printed pages 5–16 are the speech body. The source PDF is not vendored here; its SHA-256 identity is retained from the authoritative source archive.",
  },
  transcription: {
    status: meta.workflow.tamil_transcription,
    verified_against_scan: meta.workflow.tamil_visual_audit === "complete",
    pages: "PDF 6-17 / printed 5-16",
    t3_consolidation: meta.workflow.tamil_consolidation,
    page_boundary_check: meta.workflow.tamil_page_boundary_check,
  },
  translation: {
    status: meta.workflow.english_translation,
    type: "project-created faithful reading translation",
    verified_against_tamil: meta.workflow.english_translation_final_verification === "complete",
    pages: "PDF 6-17 / printed 5-16",
    e3_page_transitions_checked: meta.workflow.english_translation_final_verification_page_transitions_checked,
  },
  archiveDerived: {
    sectionHeadings: taStats.headings,
    tamilResolvedParagraphs: taStats.resolvedParagraphs,
    tamilUnresolvedGroupRuns: taStats.unresolvedRuns,
    englishParagraphs: enStats.paragraphs,
    tamilSourceTextSegments: taStats.segments,
    englishSourceTextSegments: enStats.segments,
    tamilCrossPageParagraphs: taStats.crossPageParagraphs,
    englishCrossPageParagraphs: enStats.crossPageParagraphs,
    sourcePagesCovered: taStats.pages.length,
    boundaryAudit: {
      tamilTransitions: auditCounts.transitions,
      sameParagraph: auditCounts.sameParagraph,
      paragraphBoundary: auditCounts.paragraphBoundary,
      headingBoundary: auditCounts.headingBoundary,
      unknownParagraphRelation: auditCounts.unknownParagraphRelation,
      lexicalJoinNone: auditCounts.joinNone,
      lexicalJoinSpace: auditCounts.joinSpace,
      lexicalJoinUnknown: auditCounts.joinUnknown,
    },
    englishBoundaryAudit: {
      englishAnchors: 12,
      paragraphBoundary: 0,
      headingNoteBoundary: 0,
      sameParagraphContinuations: auditCounts.sameParagraph,
      unknownParagraphRelation: auditCounts.unknownParagraphRelation,
      note:
        "The English release preserves PDF/printed-page correspondence. Cross-page continuation is asserted only at the three transitions explicitly established by the source archive's T3/E3 evidence; the other printed-paragraph relationships remain unresolved. No punctuation heuristic is used.",
    },
    note:
      "Within-page paragraph divisions come from the verified source-repository transcription/translation. Physical page edges are handled separately by the explicit 11-transition work-specific audit. Three source-supported same-sentence continuations span pages with a single-space lexical join; eight printed-paragraph relationships remain neutral/unresolved rather than guessed.",
  },
  blockers: [
    {
      item: "unresolved-paragraph-relationship",
      count: auditCounts.unknownParagraphRelation,
      detail:
        `${auditCounts.unknownParagraphRelation} Poonthottam physical speech-page transitions are textually verified but the source repository does not explicitly record whether the PRINTED paragraph continues across the page edge. The reader represents these boundaries neutrally; it asserts neither a new paragraph nor a continuation.`,
      resolution:
        `Read-only inspection of the controlling scan ${meta.source.filename}, or a future source-repository audit that explicitly records those printed paragraph relations. Do not infer them from punctuation.`,
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
      "The scanned edition's publication/imprint facts and the later Tamil Nadu Government nationalisation are distinct facts.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored speech. It does not extend to publisher material, the prefatory poem as a separate source unit, scan/library markings, or other third-party material.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked verified translation and retains its own provenance distinct from the nationalised underlying Tamil work.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date remain unverified from the order itself; 2024-12-22 is the public handover date only.",
  },
  notes: [
    "The authoritative public-speech archive marks Tamil and English verified-complete across all 12 speech pages; this import does not retranslate, modernise, normalise or repair either released layer.",
    "The source explicitly establishes the speech date 06.12.1951 and venue சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி. It does not separately establish a named event, occasion or audience; those facts remain unset.",
    "PDF page 5 is a prefatory poem and is not part of this speech body. PDF page 18 is back-cover/promotional matter. Neither is imported as speech text.",
    "The importer has an explicit table for all 11 speech-page transitions. It never treats physical page boundaries or terminal punctuation as paragraph evidence.",
    "Where a project translator note falls textually at a known cross-page continuation, the note remains verbatim but is rendered after the completed logical paragraph so the physical source-page edge does not create a false semantic paragraph break.",
  ],
};

fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("source commit:", SRC_COMMIT);
console.log("boundary audit:", JSON.stringify(auditCounts));
console.log("Tamil pages:", taStats.pages.join(","));
console.log("Tamil paragraphs/segments:", taStats.paragraphs, taStats.segments);
console.log("English paragraphs/segments:", enStats.paragraphs, enStats.segments);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
