// Speeches (உரைகள்) — source-faithful readers for Assembly and public speeches.
//
// The catalog envelope is shared, but ingestion remains work-specific. Each integrated speech is
// vendored to public/data/speeches/<slug>/{speech.json, provenance.json} by a deterministic importer
// pinned to the exact authoritative source-repository commit. Production never calls GitHub at runtime.
//
// A source-page boundary is NOT a paragraph boundary. One logical paragraph may span source pages;
// each verbatim page fragment therefore carries an explicit join decision. Unknown source facts are
// represented as unknown rather than inferred from punctuation.

export type SpeechSubtype = "assembly-speech" | "public-speech";
export type SpeechJoin = "space" | "none" | "unknown" | "end";
export type SpeechBilingualText = { ta: string; en: string };

export type SpeechTextSegment = {
  text: string;
  sourcePage: number | null;
  joinToNext: SpeechJoin;
};

export type SpeechParagraph = {
  kind: "paragraph";
  segments: SpeechTextSegment[];
  sourcePages: number[];
};

export type SpeechHeading = { kind: "heading"; text: string; sourcePage?: number | null };
export type SpeechNote = { kind: "note"; text: string; sourcePage?: number | null };
export type SpeechUnresolvedBreak = {
  kind: "unresolved-break";
  toPage: number;
  relation: "unknown";
  note?: string;
};

export type SpeechBlock = SpeechParagraph | SpeechHeading | SpeechNote | SpeechUnresolvedBreak;

export type SpeechBilingualName = {
  nameTa: string;
  nameEn: string;
  roleTa?: string;
  roleEn?: string;
};

// Vendored per-speech content (speech.json). Context fields are deliberately optional: a public
// speech must not be forced into an Assembly schema, and a source that does not establish an event,
// date, venue or role must not acquire one merely to satisfy the reader.
export type Speech = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "speeches";
  subtype: SpeechSubtype;
  readerStructure: "speech";
  date: string | null;
  year: number | null;
  title: SpeechBilingualText;
  event?: SpeechBilingualText | null;
  venue?: SpeechBilingualText | null;
  speechType: string;
  speaker: SpeechBilingualName;
  legislature?: { nameTa: string; nameEn: string } | null;
  transcriptionStatus: string;
  translationStatus: string;
  tamil: { sectionTitleTa: string; blocks: SpeechBlock[] };
  english: { sectionTitleEn: string; blocks: SpeechBlock[] };
  sourcePages: number[];
};

export type SpeechSourceFacts = {
  publicationTitleTa: string;
  authorTa: string;
  editionTa: string;
  publicationDate: string;
  publisherTa?: string;
  publisherLocationTa?: string;
  printerTa?: string;
  printerLocationTa?: string;
  coverPriceTa?: string;
  scanFilename: string;
  scanSha256?: string;
  scanFileSizeBytes?: number;
  scanTotalPages: number;
  speechScanPages: string;
  printedSpeechPages?: string;
  frontMatterScanPages?: string;
  advertisementScanPages?: string;
  nonSpeechScanPages?: string;
  controllingSourceNoteTa?: string;
  controllingSourceNoteEn?: string;
};

export type SpeechProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: SpeechSourceFacts;
  transcription: Record<string, unknown>;
  translation: Record<string, unknown>;
  archiveDerived: {
    sectionHeadings: number;
    tamilResolvedParagraphs: number;
    tamilUnresolvedGroupRuns: number;
    englishParagraphs: number;
    tamilSourceTextSegments: number;
    englishSourceTextSegments: number;
    tamilCrossPageParagraphs: number;
    englishCrossPageParagraphs: number;
    sourcePagesCovered: number;
    boundaryAudit: {
      tamilTransitions: number;
      sameParagraph: number;
      paragraphBoundary: number;
      headingBoundary: number;
      unknownParagraphRelation: number;
      lexicalJoinNone: number;
      lexicalJoinSpace: number;
      lexicalJoinUnknown: number;
    };
    englishBoundaryAudit: {
      englishAnchors: number;
      paragraphBoundary: number;
      headingNoteBoundary: number;
      sameParagraphContinuations: number;
      unknownParagraphRelation?: number;
      note: string;
    };
    note: string;
  };
  blockers?: {
    item: string;
    count: number;
    detail: string;
    resolution: string;
  }[];
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

export const SPEECH_SLUGS = ["udhaya-kathir", "poonthottam"] as const;
export type SpeechSlug = (typeof SPEECH_SLUGS)[number];
