// Speeches (உரைகள்) — Digital Library Phase 3. Source-faithful speech readers built from the
// authoritative speech source repositories (pugazg/kalaignar-assembly-speeches,
// pugazg/kalaignar-public-speeches). Data-driven like the other Reading Rooms: each speech is
// vendored to public/data/speeches/<slug>/{speech.json, provenance.json} by a deterministic,
// work-specific importer (scripts/import-<slug>.mjs) that pins the exact source commit.
//
// A speech is NOT a scene reader: it is long-form prose with printed section headings, rendered
// in source order. Printed section headings and source-page boundaries are preserved; no
// archive-created navigation numbering is presented as printed source numbering.

// One block of a speech's Tamil or English stream, in source order.
export type SpeechBlock = {
  kind: "heading" | "para" | "page-marker" | "note";
  text: string;
  // Source page this block belongs to (from the source's page boundaries), where known.
  sourcePage?: number | null;
};

export type SpeechBilingualName = { nameTa: string; nameEn: string; roleTa?: string; roleEn?: string };

// Vendored per-speech content (speech.json).
export type Speech = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "speeches";
  subtype: string; // "assembly-speech" | "public-speech"
  readerStructure: "speech";
  date: string; // ISO where the source establishes it
  year: number;
  title: { ta: string; en: string };
  event: { ta: string; en: string };
  speechType: string;
  speaker: SpeechBilingualName;
  legislature: { nameTa: string; nameEn: string };
  transcriptionStatus: string; // verbatim released status
  translationStatus: string;
  tamil: { sectionTitleTa: string; blocks: SpeechBlock[] }; // authoritative source transcription
  english: { sectionTitleEn: string; blocks: SpeechBlock[] }; // verified faithful translation
  sourcePages: number[]; // exact source pages the Tamil transcription covers
};

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
  };
  transcription: Record<string, unknown>; // verbatim from source metadata.json
  translation: Record<string, unknown>; // verbatim from source metadata.json
  archiveDerived: {
    sectionHeadings: number;
    tamilParagraphs: number;
    englishParagraphs: number;
    sourcePagesCovered: number;
    note: string;
  };
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
// entry lives in data/library.ts). Kept minimal — one benchmark speech in Phase 3.
export const SPEECH_SLUGS = ["udhaya-kathir"] as const;
export type SpeechSlug = (typeof SPEECH_SLUGS)[number];
