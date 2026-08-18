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

// ── EXPLICIT source-audited page-boundary table (Tamil, pp.5→6 … 45→46) ─────────
// Reviewer correction: paragraph relationships and word-joins at physical source-page
// boundaries must NOT be inferred from punctuation, nor from a "only the two documented
// mid-word splits" assumption (p8→9 அபரிமித|மான disproved that). Every Tamil page transition
// is classified here from authoritative evidence, keyed by the page being entered (toPage):
//   paragraphRelation:
//     "same-paragraph"     — the printed paragraph continues across the page;
//     "paragraph-boundary" — a new printed paragraph / new parliamentary speaker turn begins;
//     "unknown"            — a sentence completes at the page edge and the next page opens a
//                            new sentence in prose; whether it is the SAME printed paragraph or
//                            a NEW one cannot be established from the archive text and needs the
//                            controlling scan (TVA_BOK_0065650), which was NOT accessible
//                            read-only in this environment → BLOCKER, rendered neutrally.
//   join (applies within a same-paragraph continuation):
//     "none"  — the source splits a WORD across the page → join with NO space;
//     "space" — an ordinary cross-page word boundary → single space.
// Evidence tiers used: 1 transcript.md, 2 verification-log.md, 3 source-notes.md,
// 4 verification/pp*.md, plus the 11-speech Tamil corpus for how a compound is written
// elsewhere. `none` is asserted only where a space would demonstrably break a single Tamil
// word (the following fragment is an inflection/suffix, not a standalone word) or where the
// archive/reviewer explicitly documents a mid-word split. A few sandhi compounds where both a
// spaced and a joined form are valid Tamil are rendered spaced and flagged `scanPending`.
const TA_BOUNDARY = {
  6:  { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'அந்த'|'இடத்திலே' distinct words" },
  7:  { rel: "unknown",            join: "end",   ev: "sentence completes on p6; p7 opens new prose sentence; physical paragraph layout scan-pending" },
  8:  { rel: "same-paragraph",     join: "none",  ev: "verification-log #5: mid-word 'அனைவருக்'+'கும்' = அனைவருக்கும்" },
  9:  { rel: "same-paragraph",     join: "none",  ev: "reviewer-confirmed mid-word 'அபரிமித'+'மான' = அபரிமிதமான" },
  10: { rel: "unknown",            join: "end",   ev: "sentence completes on p9; p10 opens new prose; scan-pending" },
  11: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'தீர்மானத்'+'திற்கு' = தீர்மானத்திற்கு ('திற்கு' not standalone)" },
  12: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'தொழிலாளர்'|'தங்களுடைய' distinct words" },
  13: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'இரும்புக்'+'கரத்தை' = இரும்புக்கரத்தை" },
  14: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'வேலை'|'நிறுத்தம்' (corpus attests spaced)" },
  15: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; '15 சதவிகித'|'கிணறுகளுக்கும்' distinct" },
  16: { rel: "same-paragraph",     join: "unknown", ev: "mid-sentence; sandhi compound 'கோபித்துக் கொள்ள' — spaced; exact source form scanPending", scanPending: true },
  17: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'சென்னை'|'மருத்துவ' distinct" },
  18: { rel: "same-paragraph",     join: "none",  ev: "verification-log #32: mid-word 'ஆகிர'+'மிப்பாளர்கள்' = ஆகிரமிப்பாளர்கள்" },
  19: { rel: "same-paragraph",     join: "unknown", ev: "mid-sentence; sandhi compound 'பேசிக் கொண்டிருக்கிறீர்கள்' — spaced; scanPending", scanPending: true },
  20: { rel: "same-paragraph",     join: "space", ev: "'திரு.' is an abbreviation (NOT a sentence end); 'திரு. சங்கரய்யா' continues (corpus attests)" },
  21: { rel: "unknown",            join: "end",   ev: "sentence completes on p20; p21 opens 'ஆனால்…' new sentence; scan-pending" },
  22: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'இப்படிப்'+'பட்ட' = இப்படிப்பட்ட" },
  23: { rel: "paragraph-boundary", join: "end",   ev: "p23 opens a new speaker turn (**முதல்வர்:**)" },
  24: { rel: "same-paragraph",     join: "space", ev: "mid-sentence (prev ends comma); distinct words" },
  25: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'பெரிய'|'குற்றச்சாட்டுகளுக்கு' (corpus attests spaced)" },
  26: { rel: "paragraph-boundary", join: "end",   ev: "p26 opens a new speaker turn (**கே. விநாயகம்:**)" },
  27: { rel: "unknown",            join: "end",   ev: "sentence completes on p26; p27 opens new prose; scan-pending" },
  28: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; '114'|'லட்சம்' number+word" },
  29: { rel: "same-paragraph",     join: "unknown", ev: "mid-sentence; sandhi compound 'திட்டப் பிரகாரம்' — spaced; scanPending", scanPending: true },
  30: { rel: "paragraph-boundary", join: "end",   ev: "p30 opens a new speaker turn (**க. ராமமூர்த்தி:**)" },
  31: { rel: "same-paragraph",     join: "space", ev: "verification/pp29-34: 'p.30 ends …சீக்கிரமாக, continuing on p.31' (word boundary)" },
  32: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'உயர்ந்த'+'தவை' ('தவை' not standalone → completes a word)" },
  33: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'யந்திரங்களும்'|'இவைகளைத்' distinct" },
  34: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'தொகை'|'90' word+number" },
  35: { rel: "unknown",            join: "end",   ev: "sentence completes on p34; p35 opens 'அடுத்த குற்றச்சாட்டு' new prose; scan-pending" },
  36: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'அவர்'+'களுக்கும்' = அவர்களுக்கும்" },
  37: { rel: "unknown",            join: "end",   ev: "sentence completes on p36; p37 opens new prose; scan-pending" },
  38: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'கார்'|'கம்பெனியைத்தான்' distinct" },
  39: { rel: "same-paragraph",     join: "unknown", ev: "mid-sentence; sandhi compound 'அதிகப் பெருமானம்' — spaced; scanPending", scanPending: true },
  40: { rel: "unknown",            join: "end",   ev: "sentence completes on p39; p40 opens new prose; scan-pending" },
  41: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'நிர்ண'+'யித்து' = நிர்ணயித்து" },
  42: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'குழு'|'அமைக்கப்பட்டு' (corpus attests spaced)" },
  43: { rel: "same-paragraph",     join: "unknown", ev: "mid-sentence; sandhi compound 'உதவித் தொகை' — spaced; scanPending", scanPending: true },
  44: { rel: "same-paragraph",     join: "none",  ev: "mid-word 'இதை'+'யும்' = இதையும் ('யும்' not standalone)" },
  45: { rel: "same-paragraph",     join: "space", ev: "mid-sentence (prev ends comma); distinct words" },
  46: { rel: "same-paragraph",     join: "space", ev: "mid-sentence; 'கேட்ட'|'பிறகு' (corpus attests spaced)" },
};

// Tamil section: build blocks from the explicit audited boundary table (not punctuation).
// Blocks: { kind:"paragraph", segments:[{text,sourcePage,joinToNext}], sourcePages } |
//         { kind:"heading"|"note", text, sourcePage } |
//         { kind:"unresolved-break", toPage, relation:"unknown", note } — a NEUTRAL, honest marker
//         for a scan-pending boundary that neither asserts nor denies a paragraph relationship.
function parseTamil(lines) {
  const blocks = [];
  let currentPage = null;
  let pendingToPage = null; // set when a source-page marker was just seen
  let para = null;
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage))].sort((a, b) => a - b);
      para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  const startPara = (text, page) => { para = { kind: "paragraph", segments: [{ text, sourcePage: page, joinToNext: "end" }], sourcePages: [] }; };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^<!--\s*source-page:\s*(\d+)\s*-->$/))) {
      currentPage = Number(m[1]);
      pendingToPage = currentPage;
      continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      flush();
      blocks.push({ kind: "heading", text: m[1].trim(), sourcePage: currentPage });
      pendingToPage = null;
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    // paragraph text line
    if (!para) {
      startPara(line, currentPage);
    } else if (pendingToPage != null) {
      const entry = TA_BOUNDARY[pendingToPage];
      if (!entry) throw new Error(`no audited boundary entry for page ${pendingToPage}`);
      if (entry.rel === "same-paragraph") {
        para.segments[para.segments.length - 1].joinToNext = entry.join;
        para.segments.push({ text: line, sourcePage: currentPage, joinToNext: "end" });
      } else if (entry.rel === "paragraph-boundary") {
        flush();
        startPara(line, currentPage);
      } else {
        // "unknown" paragraph relation → NEUTRAL: close the run, emit an unresolved-break marker,
        // open the next run. The reader groups the runs on either side into a single non-<p>
        // group (asserting NEITHER a paragraph break NOR a continuation); these runs are counted
        // as unresolved-group runs, not clean logical paragraphs.
        flush();
        blocks.push({ kind: "unresolved-break", toPage: pendingToPage, relation: "unknown", note: entry.ev });
        startPara(line, currentPage);
      }
    } else {
      // two text lines on the same page (blank-separated) = separate printed paragraphs
      flush();
      startPara(line, currentPage);
    }
    pendingToPage = null;
  }
  flush();
  return blocks;
}

// ── EXPLICIT English boundary audit (EN_BOUNDARY) — NO punctuation heuristic ─────
// The verified project-created faithful translation supplies its OWN paragraph structure: each
// blank-line-separated English block is a translator paragraph, and every `### Source page N`
// anchor is PROVENANCE only. So English paragraph boundaries come from the translator's blocks
// (and printed `##` headings / `>` note), NOT from punctuation. An anchor is classified only
// where it falls BETWEEN two released text blocks:
//   - "paragraph-boundary" — the anchor sits at a translator paragraph break (the default: two
//     distinct blank-separated blocks). Provenance is attached; no join.
//   - "same-paragraph"     — a single translator paragraph CONTINUES across the anchor (the
//     released text is one sentence split by the anchor). Audited explicitly below.
// Heading/note-adjacent anchors are provenance at an already-printed structural break.
// EN_BOUNDARY has an EXPLICIT entry for EVERY English anchor (source pages 5–46), classified
// from the released English structure — never from punctuation:
//   - "heading-note-boundary" — the anchor is adjacent to a printed `##` heading or the `>` note
//     (pages 5, 8, 44): provenance at an already-printed structural break.
//   - "same-paragraph"        — a released sentence flows across the anchor (pages 22, 24): the
//     two blocks are one translator paragraph; join as the text requires (em-dash → none, else space).
//   - "paragraph-boundary"    — the default: the anchor sits between two distinct translator
//     paragraphs (blank-line-separated blocks). Provenance only; no join asserted.
const EN_BOUNDARY = {};
for (let p = 5; p <= 46; p++) EN_BOUNDARY[p] = { rel: "paragraph-boundary" };
for (const p of [5, 8, 44]) EN_BOUNDARY[p] = { rel: "heading-note-boundary" };
EN_BOUNDARY[22] = { rel: "same-paragraph", join: "none" }; // "…bloodshed—" + "was an inquiry…" (em-dash, no space)
EN_BOUNDARY[24] = { rel: "same-paragraph", join: "space" }; // "…when fault was found," + "the police officer…"
function parseEnglish(lines) {
  const blocks = [];
  let currentPage = null;
  let pendingAnchor = null; // the toPage of a just-seen anchor
  let para = null;
  const flush = () => {
    if (para) {
      para.sourcePages = [...new Set(para.segments.map((s) => s.sourcePage).filter((p) => p != null))].sort((a, b) => a - b);
      para.segments[para.segments.length - 1].joinToNext = "end";
      blocks.push(para);
      para = null;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim() === "") continue;
    let m;
    if ((m = line.match(/^###\s+Source page\s+(\d+)\s*$/i))) {
      currentPage = Number(m[1]);
      pendingAnchor = currentPage; // provenance only
      continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      flush();
      blocks.push({ kind: "heading", text: m[1].trim(), sourcePage: currentPage });
      pendingAnchor = null;
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      flush();
      blocks.push({ kind: "note", text: m[1].trim(), sourcePage: currentPage });
      pendingAnchor = null;
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    if (!para) {
      para = { kind: "paragraph", segments: [{ text: line, sourcePage: currentPage, joinToNext: "end" }], sourcePages: [] };
    } else if (pendingAnchor != null && EN_BOUNDARY[pendingAnchor]?.rel === "same-paragraph") {
      // A translator paragraph continues across this anchor (explicitly audited — from the
      // released sentence flowing over the anchor, NOT from punctuation).
      para.segments[para.segments.length - 1].joinToNext = EN_BOUNDARY[pendingAnchor].join;
      para.segments.push({ text: line, sourcePage: currentPage, joinToNext: "end" });
    } else {
      // A distinct translator paragraph (the translator's own blank-separated block).
      flush();
      para = { kind: "paragraph", segments: [{ text: line, sourcePage: currentPage, joinToNext: "end" }], sourcePages: [] };
    }
    pendingAnchor = null;
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
const tamilBlocks = parseTamil(allLines.slice(taStart + 1, enStart));
const englishBlocks = parseEnglish(allLines.slice(enStart + 1));

// Stats over a parsed block stream. Distinguishes RESOLVED paragraphs from RUNS that are part
// of an unresolved-relationship group, and counts lexical joins by kind (none/space/unknown).
function streamStats(blocks) {
  const pages = new Set();
  let headings = 0,
    resolvedParagraphs = 0,
    unresolvedRuns = 0,
    segments = 0,
    crossPageParagraphs = 0,
    midWordJoins = 0,
    spaceJoins = 0,
    unknownLexicalJoins = 0,
    unresolvedBreaks = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind === "heading") {
      headings++;
      if (b.sourcePage != null) pages.add(b.sourcePage);
    } else if (b.kind === "unresolved-break") {
      unresolvedBreaks++;
      if (b.toPage != null) pages.add(b.toPage);
    } else if (b.kind === "paragraph") {
      const adjacentUnresolved = blocks[i - 1]?.kind === "unresolved-break" || blocks[i + 1]?.kind === "unresolved-break";
      if (adjacentUnresolved) unresolvedRuns++;
      else resolvedParagraphs++;
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
  return { headings, resolvedParagraphs, unresolvedRuns, segments, crossPageParagraphs, midWordJoins, spaceJoins, unknownLexicalJoins, unresolvedBreaks, pages: [...pages].sort((a, b) => a - b) };
}
const taStats = streamStats(tamilBlocks);
const enStats = streamStats(englishBlocks);
// Source-audited Tamil boundary tallies (from the explicit table).
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
    // RESOLVED logical reading paragraphs (may span source pages); unresolved-group runs counted separately.
    tamilResolvedParagraphs: taStats.resolvedParagraphs,
    tamilUnresolvedGroupRuns: taStats.unresolvedRuns,
    englishParagraphs: enStats.resolvedParagraphs + enStats.unresolvedRuns, // English has no unresolved runs
    // Physical per-source-page text fragments.
    tamilSourceTextSegments: taStats.segments,
    englishSourceTextSegments: enStats.segments,
    tamilCrossPageParagraphs: taStats.crossPageParagraphs,
    englishCrossPageParagraphs: enStats.crossPageParagraphs,
    sourcePagesCovered: tamilPages.length,
    // Source-audited results over all 41 Tamil page transitions (explicit table, NOT punctuation).
    boundaryAudit: {
      tamilTransitions: auditCounts.transitions,
      sameParagraph: auditCounts.sameParagraph,
      paragraphBoundary: auditCounts.paragraphBoundary,
      headingBoundary: auditCounts.headingBoundary,
      unknownParagraphRelation: auditCounts.unknownParagraphRelation,
      lexicalJoinNone: auditCounts.joinNone, // no space
      lexicalJoinSpace: auditCounts.joinSpace,
      lexicalJoinUnknown: auditCounts.joinUnknown, // unresolved spacing (scan-pending)
    },
    englishBoundaryAudit: {
      englishAnchors: Object.keys(EN_BOUNDARY).length,
      paragraphBoundary: Object.values(EN_BOUNDARY).filter((e) => e.rel === "paragraph-boundary").length,
      headingNoteBoundary: Object.values(EN_BOUNDARY).filter((e) => e.rel === "heading-note-boundary").length,
      sameParagraphContinuations: Object.values(EN_BOUNDARY).filter((e) => e.rel === "same-paragraph").length,
      note: "Every English `### Source page N` anchor has an EXPLICIT EN_BOUNDARY entry, classified from the released translation structure (headings/notes, the translator's blank-separated blocks, and audited sentence continuations) — NEVER from punctuation. Anchors are provenance only; they are never paragraph boundaries in themselves.",
    },
    note: "Section headings are printed in the source. A source-page boundary is NOT a paragraph boundary and paragraph relationships are NOT inferred from punctuation: every Tamil page transition is classified in an explicit source-audited table (transcript + verification log + verification/ records + 11-speech corpus). One logical paragraph may span several source pages via per-page segments, each retaining its source page. Mid-word page splits join with NO space; ordinary word boundaries with a single space; a source-page boundary whose exact printed spacing OR paragraph relationship cannot be established is left UNRESOLVED and rendered neutrally (never silently spaced, concatenated, or split into paragraphs).",
  },
  // BLOCKERS — two classes of source facts only the controlling scan can resolve. Both are
  // represented as unresolved in the data and rendered neutrally; neither is guessed.
  blockers: [
    {
      item: "unresolved-paragraph-relationship",
      count: auditCounts.unknownParagraphRelation,
      detail: `${auditCounts.unknownParagraphRelation} Tamil source-page boundaries where a sentence completes at the page edge and the next page opens a new sentence: whether the PRINTED PARAGRAPH continues or a new one begins cannot be established from the archive text. Encoded as unresolved-break (neither same-paragraph nor a new paragraph) and rendered as a neutral source-page rule.`,
      resolution: "Read-only inspection of the controlling scan TVA_BOK_0065650_உதயக்_கதிர்.pdf (speech pp.5–46). Not accessible read-only in this environment (not on archive.org / tamildigitallibrary.in); the source PDF is not vendored.",
    },
    {
      item: "unresolved-lexical-join",
      count: auditCounts.joinUnknown,
      detail: `${auditCounts.joinUnknown} Tamil cross-page joins (sandhi compounds) where the exact printed JOINED-vs-SPACED form cannot be established from the archive text. Encoded as joinToNext "unknown" (NOT silently "space") and rendered with a neutral inline source-page marker between the two fragments — asserting neither a space nor a concatenation.`,
      resolution: "Same controlling scan; not accessible read-only in this environment.",
    },
  ],
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
    "Printed section headings are preserved. Every Tamil source-page transition is classified in an explicit source-audited boundary table (NOT inferred from punctuation): a source-page boundary is not a paragraph boundary; one logical paragraph may span several source pages via per-page text segments, each retaining its source page; mid-word page splits join with no space.",
    "TWO BLOCKER CLASSES (both rendered neutrally, neither guessed): (A) unresolved PARAGRAPH RELATIONSHIPS at sentence-completed page boundaries — encoded as unresolved-break, not a paragraph; (B) unresolved LEXICAL JOINS at sandhi cross-page boundaries — encoded as joinToNext 'unknown', not silently spaced. Both need the controlling scan TVA_BOK_0065650 (not accessible read-only here; source PDF not vendored).",
    "English paragraph structure is the verified translation's own blank-separated blocks; `### Source page N` anchors are provenance only, never paragraph boundaries; only the sentence-continuations across an anchor are recorded (EN_BOUNDARY). No punctuation heuristic is used for either language.",
  ],
};
fs.writeFileSync(path.join(OUT, "provenance.json"), JSON.stringify(provenance, null, 1) + "\n");

console.log("speech:", SLUG);
console.log("tamil boundary audit:", JSON.stringify(auditCounts));
console.log("tamil: resolved paras", taStats.resolvedParagraphs, "| unresolved-group runs", taStats.unresolvedRuns, "| headings", taStats.headings, "| segments", taStats.segments, "| joins none/space/unknown", `${taStats.midWordJoins}/${taStats.spaceJoins}/${taStats.unknownLexicalJoins}`, "| unresolved-breaks", taStats.unresolvedBreaks);
console.log("english: paragraphs", enStats.resolvedParagraphs + enStats.unresolvedRuns, "| headings", enStats.headings, "| segments", enStats.segments, "| cross-page paras", enStats.crossPageParagraphs);
console.log("source pages covered:", tamilPages[0], "–", tamilPages[tamilPages.length - 1], `(${tamilPages.length})`);
console.log("speech.json sha256:", sha256(readText(path.join(OUT, "speech.json"))));
console.log("provenance.json sha256:", sha256(readText(path.join(OUT, "provenance.json"))));
