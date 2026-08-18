// Speeches (உரைகள்) — Digital Library Phase 3. Source-faithful speech readers built from the
// authoritative speech source repositories (pugazg/kalaignar-assembly-speeches,
// pugazg/kalaignar-public-speeches). Data-driven like the other Reading Rooms: each speech is
// vendored to public/data/speeches/<slug>/{speech.json, provenance.json} by a deterministic,
// work-specific importer (scripts/import-<slug>.mjs) that pins the exact source commit.
//
// A speech is NOT a scene reader: it is long-form prose with printed section headings, rendered
// in source order. Printed section headings and source-page boundaries are preserved; no
// archive-created navigation numbering is presented as printed source numbering.

// A source-fidelity note (reviewer correction): a source-page boundary is NOT a paragraph
// boundary. One LOGICAL paragraph may span several source pages. So a paragraph holds ordered
// per-source-page text SEGMENTS, each carrying its own source page, joined for reading by an
// explicit `joinToNext`:
//   - "none"    = the source splits a WORD across the page → join with NO space;
//   - "space"   = an ordinary cross-page word boundary → single space;
//   - "unknown" = the exact printed joined-vs-spaced form is UNRESOLVED (scan-pending). The
//                 reader must NOT silently choose a space or a concatenation — it renders a
//                 neutral inline source-page marker between the two fragments.
//   - "end"     = last segment of the paragraph.
// Each `segment.text` is the exact source text line, verbatim (source Markdown emphasis kept).
export type SpeechJoin = "space" | "none" | "unknown" | "end";

export type SpeechTextSegment = {
  text: string;
  sourcePage: number | null;
  joinToNext: SpeechJoin;
};

export type SpeechParagraph = {
  kind: "paragraph";
  segments: SpeechTextSegment[];
  sourcePages: number[]; // the source pages this one logical paragraph spans
};

export type SpeechHeading = { kind: "heading"; text: string; sourcePage?: number | null };
export type SpeechNote = { kind: "note"; text: string; sourcePage?: number | null };

// A NEUTRAL boundary whose paragraph RELATIONSHIP could not be established from the archive text
// (a sentence completes at the page edge and the next page opens a new sentence — same printed
// paragraph or a new one is scan-pending). The reader groups the runs on either side into a
// single non-`<p>` group so this asserts NEITHER a paragraph break NOR a continuation.
export type SpeechUnresolvedBreak = { kind: "unresolved-break"; toPage: number; relation: "unknown"; note?: string };

// One ordered block of a speech's Tamil or English stream.
export type SpeechBlock = SpeechParagraph | SpeechHeading | SpeechNote | SpeechUnresolvedBreak;

export type SpeechBilingualName = { nameTa: string; nameEn: string; roleTa?: string; roleEn?: string };
export type SpeechBilingualText = { ta: string; en: string };

// Common fields shared by every speech subtype. The Tamil stream is authoritative; the English
// stream is the verified faithful reading translation.
type SpeechBase = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "speeches";
  readerStructure: "speech";
  date: string; // ISO where the source establishes it
  year: number;
  title: SpeechBilingualText;
  speechType: string;
  speaker: SpeechBilingualName;
  transcriptionStatus: string; // verbatim released status
  translationStatus: string;
  tamil: { sectionTitleTa: string; blocks: SpeechBlock[] }; // authoritative source transcription
  english: { sectionTitleEn: string; blocks: SpeechBlock[] }; // verified faithful translation
  sourcePages: number[]; // exact source pages the Tamil transcription covers
};

// A legislative-assembly speech: it has a legislature and a parliamentary event/context. These
// fields are ASSEMBLY-SPECIFIC — they are not forced onto a public speech as empty placeholders.
export type AssemblySpeech = SpeechBase & {
  subtype: "assembly-speech";
  legislature: { nameTa: string; nameEn: string };
  event: SpeechBilingualText;
};

// A public speech: it has a source-established VENUE. `event` / `occasion` / `audience` are
// OPTIONAL and stay unset unless the source establishes them (no fake college-function/meeting is
// inferred from a venue). A public speech has NO legislature.
export type PublicSpeech = SpeechBase & {
  subtype: "public-speech";
  venue: SpeechBilingualText;
  event?: SpeechBilingualText | null;
  occasion?: SpeechBilingualText | null;
  audience?: SpeechBilingualText | null;
};

// Vendored per-speech content (speech.json). Discriminated on `subtype` so assembly-specific and
// public-specific metadata each stay honestly typed rather than a bag of nullable assembly fields.
export type Speech = AssemblySpeech | PublicSpeech;

// Provenance manifest (provenance.json).
export type SpeechProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    publicationTitleTa: string;
    authorTa: string;
    editionTa: string;
    publicationDate: string;
    publisherTa: string;
    publisherLocationTa: string;
    printerTa: string;
    printerLocationTa: string;
    coverPriceTa: string;
    scanFilename: string;
    scanTotalPages: number;
    speechScanPages: string;
    frontMatterScanPages: string;
    advertisementScanPages: string;
    // Optional source facts some editions establish and others do not (never fabricated):
    scanSha256?: string; // published only where the source archive records a scan checksum
    scanFileSizeBytes?: number;
    printedSpeechPages?: string; // printed page range when it differs from the PDF/scan range
    firstEditionTa?: string; // a distinct first-edition statement, where the edition prints one
    publisherAddressTa?: string; // fuller publisher address, where recorded
    editionMatterNote?: string; // third-party front matter (e.g. a publisher preface author/date)
  };
  transcription: Record<string, unknown>; // verbatim from source metadata.json
  translation: Record<string, unknown>; // verbatim from source metadata.json
  archiveDerived: {
    sectionHeadings: number;
    tamilResolvedParagraphs: number; // clean logical paragraphs (may span source pages)
    tamilUnresolvedGroupRuns: number; // runs inside an unresolved-relationship group
    englishParagraphs: number;
    tamilSourceTextSegments: number; // physical per-source-page fragments
    englishSourceTextSegments: number;
    tamilCrossPageParagraphs: number;
    englishCrossPageParagraphs: number;
    sourcePagesCovered: number;
    // Source-audited results over all Tamil page transitions (explicit table, not punctuation).
    boundaryAudit: {
      tamilTransitions: number;
      sameParagraph: number;
      paragraphBoundary: number;
      headingBoundary: number;
      unknownParagraphRelation: number;
      lexicalJoinNone: number; // join with NO space
      lexicalJoinSpace: number;
      lexicalJoinUnknown: number; // unresolved spacing (scan-pending), never silently spaced
    };
    englishBoundaryAudit: {
      englishAnchors: number;
      paragraphBoundary: number;
      headingNoteBoundary: number;
      sameParagraphContinuations: number;
      note: string;
    };
    note: string;
  };
  // Known blockers — source facts only the controlling scan can resolve, each represented as
  // unresolved in the data and rendered neutrally (never guessed).
  blockers?: {
    item: string;
    count: number;
    detail: string;
    resolution: string;
  }[];
  // Present project-level rights of the underlying Kalaignar-authored work (see Manohara model).
  projectRights: {
    appliesTo: string;
    rightsStatus: string;
    rightsAuthority: string;
    rightsAction: string;
    rightsAnnouncementDate: string;
    governmentOrderNumber: string | null;
    governmentOrderDate: string | null;
    governmentOrderHandoverDate: string | null;
    distinctionNote: string;
    thirdPartyNote: string;
    projectTranslationNote: string;
    evidencePending: string;
  };
  notes: string[];
};

// Lightweight catalog of integrated speech slugs (build/import authority; the public catalog
// entry lives in data/library.ts). One benchmark per subtype so far: an assembly speech
// (udhaya-kathir) and a public speech (poonthottam).
export const SPEECH_SLUGS = ["udhaya-kathir", "poonthottam"] as const;
export type SpeechSlug = (typeof SPEECH_SLUGS)[number];
