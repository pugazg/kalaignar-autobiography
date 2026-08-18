// Deterministic, work-specific importer for பூந்தோட்டம் / Poonthottam (Digital Library
// Phase 3 — Speeches; second benchmark — the first PUBLIC speech). Kalaignar M. Karunanidhi's
// 1951-12-06 address at Guindy Engineering College, Chennai.
//
// Reads the AUTHORITATIVE source from a local clone of pugazg/kalaignar-public-speeches
// (speeches/poonthottam) at a pinned commit, and vendors static bilingual reader data into this
// website under public/data/speeches/poonthottam/. Runtime never calls GitHub. The source PDF is
// never vendored (its identity travels as filename + SHA-256 + size + page map only).
//
// Fidelity: the frozen verified-complete Tamil (transcription-ta.md) is authoritative; the
// verified-complete English (translation-en.md) is the faithful reading translation. Neither is
// retranslated, modernized or normalized. Difficult source-supported Tamil forms
// (அகம்புற மென்ற அன்றலர்ந்த, அயோத்தியானுக்கு, தண்ட காரணயத்திலே, பெய்ப்படி, வழக்கு மன்றத்திற்கு,
// மானிடம்) and translator notes are preserved verbatim. Source-page boundaries are kept and every
// page transition is classified from explicit source evidence (audit.md), NOT from punctuation.
//
// Usage: node scripts/import-poonthottam.mjs <path-to-public-speeches-clone> <source-commit>

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

// Fail closed: the source clone's actual git HEAD must equal the supplied <source-commit>, so we
// never record a caller-supplied SHA that does not correspond to the checked-out source tree.
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

const SPEECH_DIR = path.join(SRC_REPO, "speeches/poonthottam");
const SLUG = "poonthottam";
const OUT = path.join(process.cwd(), "public/data/speeches", SLUG);

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJSON = (p) => JSON.parse(readText(p));

const meta = readJSON(path.join(SPEECH_DIR, "metadata.json"));
const tamilSrc = readText(path.join(SPEECH_DIR, "transcription-ta.md"));
const englishSrc = readText(path.join(SPEECH_DIR, "translation-en.md"));

// ── EXPLICIT source-audited page-boundary table (Tamil), keyed by the printed page ENTERED ──────
// Poonthottam is a single, continuous, single-speaker public speech: it has NO parliamentary
// speaker turns, so there are no clean paragraph-boundary transitions. Every printed page
// transition (printed 5→6 … 15→16, 11 transitions) is classified from the source's own visual
// audit (audit.md) and the frozen transcription — NEVER from punctuation:
//   paragraphRelation:
//     "same-paragraph" — the printed paragraph demonstrably continues across the page (the source
//                        audit lists it as a mid-sentence continuation);
//     "unknown"        — a sentence COMPLETES at the page edge and the next page opens a NEW
//                        sentence: whether the printed paragraph continues or a new one begins
//                        cannot be established from the archive text and needs the controlling
//                        scan (TVA_BOK_0065784), which is NOT accessible read-only here → BLOCKER,
//                        rendered neutrally (neither a break nor a continuation is asserted).
//   join (within a same-paragraph continuation):
//     "space" — an ordinary cross-page word boundary (no mid-word split occurs anywhere here).
// audit.md explicitly lists the mid-sentence continuations printed p.5→6, p.6→7, p.10→11. It also
// describes p.15→16 as a "thought/sentence continuation … no word is split", but the p.15 sentence
// COMPLETES ("…வளரத்தான் நேரிடும்.") and p.16 opens a new sentence ("அந்த வெறுப்பு…"); that describes
// lexical (no mid-word split) and thematic continuity, NOT a printed-paragraph claim — so p.15→16
// remains an UNKNOWN paragraph relationship rather than a fabricated same-paragraph run.
const TA_BOUNDARY = {
  6:  { rel: "same-paragraph", join: "space", ev: "audit.md continuation printed p.5→6: 'பண்படுத்த' | 'வேண்டும்.' — distinct words, mid-sentence" },
  7:  { rel: "same-paragraph", join: "space", ev: "audit.md continuation printed p.6→7: '…மொண்டு மொண்டு தரும்' | 'தென்றலாக,' — distinct words, mid-sentence" },
  8:  { rel: "unknown",        join: "end",   ev: "printed p.7 completes '…பக்கமிருந்து கிளம்பும் தொனி!'; p.8 opens 'இப்படி ஒரு போராட்டம்…' a new sentence; printed-paragraph layout scan-pending" },
  9:  { rel: "unknown",        join: "end",   ev: "printed p.8 completes '…புகழ் பாடப்படுகிறது ஒரு புறத்திலே!'; p.9 opens 'உடனே,…'; scan-pending" },
  10: { rel: "unknown",        join: "end",   ev: "printed p.9 completes '…இந்த வசதி கிடையாதே!'; p.10 opens 'தண்ணொளி…'; scan-pending" },
  11: { rel: "same-paragraph", join: "space", ev: "audit.md continuation printed p.10→11: 'வேலைகளை விட்டு ஓய்வு' | 'பெறுகிறவர்' — distinct words, mid-sentence" },
  12: { rel: "unknown",        join: "end",   ev: "printed p.11 completes '…சமத்துவக் கோரிக்கை விளக்கம்.'; p.12 opens '‘பூந்தோட்டமே யாருடையது…'; scan-pending" },
  13: { rel: "unknown",        join: "end",   ev: "printed p.12 completes '…வீரன் செங்குட்டுவன் உலாவியிருக்கிறான்.'; p.13 opens 'கடாரங் கொண்ட சோழன்…'; scan-pending" },
  14: { rel: "unknown",        join: "end",   ev: "printed p.13 completes '…மோதிக் கொள்வது என்ற நிலையிருந்திருக்காதே.'; p.14 opens 'அவர்கள் படித்தவர்கள்.'; scan-pending" },
  15: { rel: "unknown",        join: "end",   ev: "printed p.14 completes '…என்று அழைத்தார் அப்பன் பரமசிவன்.'; p.15 opens 'சீராளனை…'; scan-pending" },
  16: { rel: "unknown",        join: "end",   ev: "audit.md calls p.15→16 a thought continuation but the p.15 sentence completes '…வளரத்தான் நேரிடும்.' and p.16 opens 'அந்த வெறுப்பு,…' a new sentence; printed-paragraph relationship scan-pending (NOT claimed same-paragraph)" },
};

// A printed page marker: "## PDF page <pdf> / printed page <printed>". We key the reader by the
// PRINTED page (5-16), matching the public-facing "source page" numbering; the PDF↔printed map
// travels in provenance.
const PAGE_RE = /^##\s+PDF page\s+(\d+)\s*\/\s*printed page\s+(\d+)\s*$/;

// Parse the Tamil (or a note-free) body: bounded from the first PDF-page marker to the first
// non-page `##` section (e.g. "## Verified Tamil freeze"). Skips the `#` speech title (already in
// metadata), `---` page rules, and blank lines. Two blank-separated text lines on the same page are
// separate printed paragraphs; cross-page relationships come ONLY from the audited table.
function parseTamil(text) {
  const blocks = [];
  let printedPage = null;
  let pendingToPage = null;
  let para = null;
  let started = false;
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage))].sort((a, b) => a - b);
      para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  const startPara = (t, p) => { para = { kind: "paragraph", segments: [{ text: t, sourcePage: p, joinToNext: "end" }], sourcePages: [] }; };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(PAGE_RE))) {
      started = true;
      printedPage = Number(m[2]);
      pendingToPage = printedPage;
      continue;
    }
    if (!started) continue; // preamble before the first page marker
    if (line.trim() === "" || /^-{3,}$/.test(line)) continue; // blank / page rule
    if (/^##\s+/.test(line)) break; // reached the trailing non-page section → end of body
    if (/^#\s+/.test(line)) continue; // the printed `# பூந்தோட்டம்` title (already in metadata)
    // paragraph text line
    if (!para) {
      startPara(line, printedPage);
    } else if (pendingToPage != null) {
      const entry = TA_BOUNDARY[pendingToPage];
      if (!entry) throw new Error(`no audited Tamil boundary entry for printed page ${pendingToPage}`);
      if (entry.rel === "same-paragraph") {
        para.segments[para.segments.length - 1].joinToNext = entry.join;
        para.segments.push({ text: line, sourcePage: printedPage, joinToNext: "end" });
      } else {
        // "unknown" paragraph relation → NEUTRAL: close the run, emit an unresolved-break, open the
        // next run. The reader groups the runs on either side into one non-<p> role="group".
        flush();
        blocks.push({ kind: "unresolved-break", toPage: pendingToPage, relation: "unknown", note: entry.ev });
        startPara(line, printedPage);
      }
    } else {
      // two blank-separated text lines on the same page = separate printed paragraphs
      flush();
      startPara(line, printedPage);
    }
    pendingToPage = null;
  }
  flush();
  return blocks;
}

// ── EXPLICIT English boundary audit (EN_BOUNDARY), keyed by printed page anchor 5-16 — NO
// punctuation heuristic. The verified translation supplies its OWN paragraph structure (blank-
// separated blocks); each printed-page marker is PROVENANCE only. Classified from the released
// structure:
//   "heading-note-boundary" — the anchor is adjacent to the printed `#` title (page 5) or follows a
//     translator `>` note that ends the previous page (pages 7, 10, 11, 13, 14). Provenance at an
//     already-structural break.
//   "same-paragraph"        — a released sentence flows across the anchor with NO intervening note
//     (page 6: "…cultivated" / "properly."). Joined as the text requires (here: space).
//   "paragraph-boundary"    — the default: the anchor sits between two distinct translator
//     paragraphs (pages 8, 9, 12, 15, 16). Provenance only; no join asserted.
const EN_BOUNDARY = {};
for (let p = 5; p <= 16; p++) EN_BOUNDARY[p] = { rel: "paragraph-boundary" };
EN_BOUNDARY[5] = { rel: "heading-note-boundary" }; // printed `# Poonthottam` title page
for (const p of [7, 10, 11, 13, 14]) EN_BOUNDARY[p] = { rel: "heading-note-boundary" }; // follow an end-of-page translator note
EN_BOUNDARY[6] = { rel: "same-paragraph", join: "space" }; // "…filled and cultivated" + "properly. A beautiful…"

function parseEnglish(text) {
  const blocks = [];
  let printedPage = null;
  let pendingAnchor = null;
  let para = null;
  let started = false;
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage).filter((p) => p != null))].sort((a, b) => a - b);
      para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(PAGE_RE))) {
      started = true;
      printedPage = Number(m[2]);
      pendingAnchor = printedPage;
      continue;
    }
    if (!started) continue;
    if (line.trim() === "" || /^-{3,}$/.test(line)) continue;
    if (/^##\s+/.test(line)) break; // trailing "## Verification state" → end of body
    if ((m = line.match(/^>\s?(.*)$/))) {
      // A translator note — a distinct block that also ends the current paragraph.
      flush();
      blocks.push({ kind: "note", text: m[1].trim(), sourcePage: printedPage });
      pendingAnchor = null;
      continue;
    }
    if (/^#\s+/.test(line)) continue; // the printed `# Poonthottam` title
    if (!para) {
      para = { kind: "paragraph", segments: [{ text: line, sourcePage: printedPage, joinToNext: "end" }], sourcePages: [] };
    } else if (pendingAnchor != null && EN_BOUNDARY[pendingAnchor]?.rel === "same-paragraph") {
      para.segments[para.segments.length - 1].joinToNext = EN_BOUNDARY[pendingAnchor].join;
      para.segments.push({ text: line, sourcePage: printedPage, joinToNext: "end" });
    } else {
      flush();
      para = { kind: "paragraph", segments: [{ text: line, sourcePage: printedPage, joinToNext: "end" }], sourcePages: [] };
    }
    pendingAnchor = null;
  }
  flush();
  return blocks;
}

const tamilBlocks = parseTamil(tamilSrc);
const englishBlocks = parseEnglish(englishSrc);

// Stats over a parsed block stream (same shape as the Udhaya importer for a comparable provenance).
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
      const adjacentUnresolved = blocks[i - 1]?.kind === "unresolved-break" || blocks[i + 1]?.kind === "unresolved-break";
      if (adjacentUnresolved) unresolvedRuns++; else resolvedParagraphs++;
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

const taBoundary = Object.values(TA_BOUNDARY);
const auditCounts = {
  transitions: taBoundary.length,
  sameParagraph: taBoundary.filter((e) => e.rel === "same-paragraph").length,
  paragraphBoundary: taBoundary.filter((e) => e.rel === "paragraph-boundary").length,
  headingBoundary: taBoundary.filter((e) => e.rel === "heading-boundary").length,
  unknownParagraphRelation: taBoundary.filter((e) => e.rel === "unknown").length,
  joinNone: taBoundary.filter((e) => e.rel === "same-paragraph" && e.join === "none").length,
  joinSpace: taBoundary.filter((e) => e.rel === "same-paragraph" && e.join === "space").length,
  joinUnknown: taBoundary.filter((e) => e.rel === "same-paragraph" && e.join === "unknown").length,
};
const tamilPages = taStats.pages; // printed pages actually covered (5-16)

// The source-supported English venue label appears verbatim in the released translation
// ("Guindy Engineering College"); Chennai renders சென்னை. No event is invented from the venue.
const VENUE_EN = "Guindy Engineering College, Chennai";

const speech = {
  workId: SLUG,
  slug: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: "speeches/poonthottam",
  sourceCommit: SRC_COMMIT,
  shelf: "speeches",
  subtype: "public-speech",
  readerStructure: "speech",
  date: meta.speech.date, // "1951-12-06" — the source-established speech date, NOT the 2019 edition
  year: Number(meta.speech.date.slice(0, 4)),
  title: { ta: meta.speech.title_ta, en: "Poonthottam" }, // speech heading பூந்தோட்டம் → transliteration
  speechType: meta.document_type, // "public-speech-booklet"
  // Source title-page attribution "தோழர் மு.கருணாநிதி": honorific கept in the role field so the
  // public reader can render it before the name, exactly as the source styles the speaker.
  speaker: { nameTa: meta.creator.name_ta, nameEn: meta.creator.name_en, roleTa: "தோழர்", roleEn: "Thozhar" },
  venue: { ta: meta.speech.venue_ta, en: VENUE_EN },
  // The source does NOT separately establish an event, occasion or audience — left unset (not
  // inferred from the venue).
  event: meta.speech.event, // null
  occasion: meta.speech.occasion, // null
  audience: meta.speech.audience, // null
  transcriptionStatus: meta.workflow.tamil_transcription, // "verified-complete"
  translationStatus: meta.workflow.english_translation, // "verified-complete"
  tamil: { sectionTitleTa: "தமிழ் மூல உரை", blocks: tamilBlocks },
  english: { sectionTitleEn: "English translation", blocks: englishBlocks },
  sourcePages: tamilPages,
};
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "speech.json"), JSON.stringify(speech, null, 1) + "\n");

// ── provenance.json ────────────────────────────────────────────────────────────
const provenance = {
  workId: SLUG,
  sourceRepo: "pugazg/kalaignar-public-speeches",
  sourcePath: "speeches/poonthottam",
  sourceCommit: SRC_COMMIT,
  // Source publication facts from the authoritative metadata.json (verbatim where structured).
  source: {
    publicationTitleTa: meta.title.ta, // கலைஞரின் பூந்தோட்டம்
    authorTa: meta.creator.name_ta, // மு. கருணாநிதி
    editionTa: "நான்காம் பதிப்பு", // the current scanned edition (year shown separately)
    publicationDate: String(meta.publication.publication_year), // 2019 (edition), NOT the speech date
    publisherTa: meta.publication.publisher_ta,
    publisherLocationTa: "சென்னை - 600 007",
    printerTa: "‘விடுதலை’ ஆஃப்செட் பிரிண்டர்ஸ்",
    printerLocationTa: "சென்னை - 600 007",
    coverPriceTa: meta.publication.price_text,
    scanFilename: meta.source.filename,
    scanTotalPages: meta.source.pdf_pages, // 18
    speechScanPages: "6–17", // PDF pages
    frontMatterScanPages: "1–5", // cover, title, bibliographic, publisher preface, prefatory poem
    advertisementScanPages: "18", // back cover / promotional matter / barcode
    // Optional facts this edition establishes (Udhaya's assembly metadata did not publish these):
    scanSha256: meta.source.sha256,
    scanFileSizeBytes: meta.source.file_size_bytes,
    printedSpeechPages: "5–16",
    firstEditionTa: "முதற்பதிப்பு - 1951 (திராவிடப் பண்ணை)",
    publisherAddressTa: meta.publication.publisher_address_ta,
    editionMatterNote: `PDF 4 carries a publisher preface (பதிப்புரை) signed for the publisher by கி. வீரமணி, dated ${meta.publication.publisher_preface_date}; PDF 5 carries Kalaignar's prefatory poem எரிமலை!. Neither is part of the பூந்தோட்டம் speech body. The preface is third-party front matter.`,
  },
  // Constructed from the workflow record (this repo tracks stage state, not a transcription block).
  transcription: {
    status: meta.workflow.tamil_transcription, // verified-complete
    verified_against_scan: true,
    method: "manual transcription with strict independent line-by-line visual audit (T1–T3), frozen",
    note: "Tamil is the authoritative frozen layer, verified-complete against the supplied scan; source-supported spelling, punctuation, spacing, repetition and unusual forms preserved.",
  },
  translation: {
    status: meta.workflow.english_translation, // verified-complete
    type: "faithful reading translation",
    language: "en",
    from: "frozen verified-complete Tamil (transcription-ta.md)",
    verified: true,
    note: "Project-created, source-linked; difficult source-supported Tamil forms are retained transparently with translator notes rather than conjecturally normalized.",
  },
  archiveDerived: {
    sectionHeadings: taStats.headings, // 0 — the body has no printed `##` section headings
    tamilResolvedParagraphs: taStats.resolvedParagraphs,
    tamilUnresolvedGroupRuns: taStats.unresolvedRuns,
    englishParagraphs: enStats.resolvedParagraphs + enStats.unresolvedRuns,
    tamilSourceTextSegments: taStats.segments,
    englishSourceTextSegments: enStats.segments,
    tamilCrossPageParagraphs: taStats.crossPageParagraphs,
    englishCrossPageParagraphs: enStats.crossPageParagraphs,
    sourcePagesCovered: tamilPages.length, // 12 (printed 5-16)
    boundaryAudit: {
      tamilTransitions: auditCounts.transitions, // 11
      sameParagraph: auditCounts.sameParagraph, // 3
      paragraphBoundary: auditCounts.paragraphBoundary, // 0 (single continuous speaker — no turns)
      headingBoundary: auditCounts.headingBoundary, // 0
      unknownParagraphRelation: auditCounts.unknownParagraphRelation, // 8
      lexicalJoinNone: auditCounts.joinNone, // 0 (no mid-word page splits)
      lexicalJoinSpace: auditCounts.joinSpace, // 3
      lexicalJoinUnknown: auditCounts.joinUnknown, // 0 (no scan-ambiguous cross-page joins)
    },
    englishBoundaryAudit: {
      englishAnchors: Object.keys(EN_BOUNDARY).length, // 12 (printed pages 5-16)
      paragraphBoundary: Object.values(EN_BOUNDARY).filter((e) => e.rel === "paragraph-boundary").length,
      headingNoteBoundary: Object.values(EN_BOUNDARY).filter((e) => e.rel === "heading-note-boundary").length,
      sameParagraphContinuations: Object.values(EN_BOUNDARY).filter((e) => e.rel === "same-paragraph").length,
      note: "Every English printed-page anchor (5-16) has an EXPLICIT EN_BOUNDARY entry, classified from the released translation structure (the printed title, the translator's blank-separated blocks, the six translator notes, and the single audited cross-page sentence continuation p.5→6) — NEVER from punctuation. Anchors are provenance only.",
    },
    note: "Section headings are printed in the source (none inside this speech body). A source-page boundary is NOT a paragraph boundary and paragraph relationships are NOT inferred from punctuation: every Tamil page transition is classified in an explicit source-audited table (audit.md + frozen transcription). One logical paragraph may span several source pages via per-page segments, each retaining its source page; ordinary cross-page word boundaries join with a single space; a source-page boundary whose printed paragraph relationship cannot be established is left UNRESOLVED and rendered neutrally.",
  },
  // BLOCKER — one class of source fact only the controlling scan can resolve. Represented as
  // unresolved in the data and rendered neutrally; never guessed. (Poonthottam has no scan-
  // ambiguous lexical joins, so — unlike Udhaya — there is no lexical-join blocker.)
  blockers: [
    {
      item: "unresolved-paragraph-relationship",
      count: auditCounts.unknownParagraphRelation,
      detail: `${auditCounts.unknownParagraphRelation} printed-page boundaries where a sentence completes at the page edge and the next page opens a new sentence: whether the PRINTED PARAGRAPH continues or a new one begins cannot be established from the archive text. Encoded as unresolved-break (neither same-paragraph nor a new paragraph) and rendered as a neutral source-page rule.`,
      resolution: "Read-only inspection of the controlling scan TVA_BOK_0065784_கலைஞரின்_பூந்தோட்டம்.pdf (speech PDF pp.6–17 / printed pp.5–16). The source PDF is not committed under repository policy and is not accessible read-only in this environment.",
    },
  ],
  // Present project-level rights of the UNDERLYING Kalaignar-authored speech (Tamil:
  // நாட்டுடைமையாக்கப்பட்டது). Kept DISTINCT from the 2019 edition's third-party publisher/preface
  // material. GO number and formal ISSUE date are unverified (null); 2024-12-22 is the public
  // HANDOVER only.
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
      "The 2019 fourth-edition's own publisher/printer/edition data is a source/edition fact, distinct from and not a statement of the present rights of Kalaignar's underlying 1951 speech.",
    thirdPartyNote:
      "Nationalisation applies to Kalaignar's underlying authored speech. It does not extend to the project-created English translation, or to third-party edition material — the publisher's 2018 preface (கி. வீரமணி), cover/design, photographs, or annotations — which retain their own provenance.",
    projectTranslationNote:
      "The English reading layer is a project-created, source-linked faithful translation (englishKind: project-created) with its own distinct provenance.",
    evidencePending:
      "The Government Order's exact number and formal ISSUE date must be verified from the order itself; 2024-12-22 is the public handover date only.",
  },
  notes: [
    "The controlling source is the scanned booklet (fourth edition, 2019); only the speech body — PDF pages 6–17 / printed pages 5–16 (12 pages) — is transcribed. PDF 1–5 (cover, title, bibliographic, publisher preface, and Kalaignar's prefatory poem எரிமலை!) and PDF 18 (back cover) are NOT speech body. The source PDF is not vendored.",
    "The source establishes the speech date (1951-12-06) and venue (சென்னை கிண்டி இன்ஜினியரிங் கல்லூரி) but does NOT separately name an event, occasion, or audience; those remain unset rather than inferred from the venue.",
    "Tamil is the frozen verified-complete source transcription; English is the verified-complete faithful reading translation made only from the frozen Tamil. Neither was edited during import. Difficult source-supported forms (அகம்புற மென்ற அன்றலர்ந்த, அயோத்தியானுக்கு, தண்ட காரணயத்திலே, பெய்ப்படி, வழக்கு மன்றத்திற்கு, மானிடம்) and the six translator notes are preserved verbatim.",
    "A source-page boundary is not a paragraph boundary. This is a single continuous speech with no speaker turns, so there are no clean paragraph-boundary transitions; the three audited mid-sentence continuations (printed p.5→6, p.6→7, p.10→11) join with a space, and the other eight page transitions — where a sentence completes at the page edge — are UNRESOLVED paragraph relationships, rendered neutrally (never guessed). Needs the controlling scan TVA_BOK_0065784.",
    "English paragraph structure is the verified translation's own blank-separated blocks; printed-page anchors are provenance only, never paragraph boundaries; the single audited cross-page sentence continuation (printed p.5→6) is recorded in EN_BOUNDARY. No punctuation heuristic is used for either language.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("tamil boundary audit:", JSON.stringify(auditCounts));
console.log("tamil: resolved paras", taStats.resolvedParagraphs, "| unresolved-group runs", taStats.unresolvedRuns, "| headings", taStats.headings, "| segments", taStats.segments, "| joins none/space/unknown", `${taStats.midWordJoins}/${taStats.spaceJoins}/${taStats.unknownLexicalJoins}`, "| unresolved-breaks", taStats.unresolvedBreaks);
console.log("english: paragraphs", enStats.resolvedParagraphs + enStats.unresolvedRuns, "| notes", enStats.notes, "| segments", enStats.segments, "| cross-page paras", enStats.crossPageParagraphs);
console.log("source pages covered (printed):", tamilPages[0], "–", tamilPages[tamilPages.length - 1], `(${tamilPages.length})`);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
