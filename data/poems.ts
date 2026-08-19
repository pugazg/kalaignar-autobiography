// Poems (கவிதைகள்) — Digital Library Phase 4. Source-faithful poetry readers built from the
// authoritative poem source repository (pugazg/kalaignar-poems). Data-driven like the other
// Reading Rooms: each poem is vendored to public/data/poems/<slug>/{poem.json, provenance.json}
// by a deterministic, work-specific importer (scripts/import-<slug>.mjs) that pins the exact
// source commit. Runtime never calls GitHub and the source PDF is never vendored.
//
// A POEM IS NOT SPEECH PROSE. The governing Digital Library rule — ONE coherent library, MULTIPLE
// source-faithful reader types — means poetry gets its own reader and its own narrow model rather
// than reusing the speech reader:
//
//   * in prose, a line break is typography; in verse, THE LINE IS THE TEXT. So the unit here is the
//     source LINE, not a paragraph of per-page segments (the speech model). Lines are never merged
//     into prose, never re-wrapped, and never split.
//   * a long source line may WRAP visually on a narrow viewport — that is presentation. It must
//     never become two poetic lines in the data.
//   * stanza structure comes from the RELEASED poem's own blank-line structure. It is never derived
//     from physical page transitions or from translation-batch boundaries (see PoemStanza).
export type PoemLine = {
  /** The exact released source line, verbatim (leading indentation is carried in `indent`). */
  text: string;
  /** Leading indentation in SOURCE SPACES (0, 4, 8 …) where the release establishes it. */
  indent: number;
  /** The physical scan page this line is printed on. */
  sourceScan: number;
  /** The VISIBLE printed page number, or null where the source shows none (scan 26). Never inferred. */
  printedPage: number | null;
};

// One released stanza / structural group: an ordered run of source lines.
//
// CRITICAL SOURCE RULE — a source page boundary is NOT a stanza boundary. A stanza may span several
// scans (`sourceScans.length > 1`); in this work EVERY physical page transition falls inside a
// stanza. Stanza breaks are taken ONLY from blank lines in the released poem, never manufactured
// from a page marker or a translation-batch marker (both of which are provenance only).
export type PoemStanza = {
  lines: PoemLine[];
  /** The distinct scans this one stanza spans, in order. */
  sourceScans: number[];
};

// One language layer of the poem.
export type PoemLayer = {
  stanzas: PoemStanza[];
  /** Total released source lines in this layer. */
  lineCount: number;
};

export type PoemBilingualText = { ta: string; en: string };
export type PoemBilingualName = { nameTa: string; nameEn: string };

// The source/context note printed ABOVE the poem (scan 13). It is METADATA, never verse: it is
// carried here so the reader can present the source-established occasion without inserting a single
// word of it into the poem body.
//
// `noteTa` is the VERBATIM printed Tamil note. `dateIso` / `venue` / `occasion` are the facts that
// note establishes. There is no released English translation of the note, so `noteEn` is a
// project-written description of those source facts and is labelled as such in the reader — it is
// never presented as part of the released English poem.
export type PoemSourceContext = {
  noteTa: string;
  noteEn: string;
  /** ISO date the source context establishes for the poem's offering (1969-02-09). */
  dateIso: string;
  /** The source-printed date exactly as printed ("9.2.1969"). */
  datePrinted: string;
  venue: PoemBilingualText;
  occasion: PoemBilingualText;
};

export type Poem = {
  workId: string;
  slug: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  shelf: "poetry";
  readerStructure: "poem";
  subtype: "poem";
  title: PoemBilingualText;
  author: PoemBilingualName;

  /** The source/context note printed above the poem — metadata, never verse. */
  sourceContext: PoemSourceContext;

  // PUBLICATION metadata is deliberately NULLABLE and, for this work, NULL. The controlling scan
  // carries no standalone publication-year or edition statement. The 15.9.2008 foreword date is an
  // internal foreword date and is NEVER promoted to a publication/edition year. A field is left
  // unset rather than filled merely because the type allows it.
  publicationYear: number | null;
  editionStatement: string | null;

  /** Which source facts the examined scan does NOT establish (source facts, not defects). */
  factsNotStated: string[];

  transcriptionStatus: string;
  translationStatus: string;

  /** Authoritative verified Tamil source layer. */
  tamil: PoemLayer;
  /** RELEASE-COMPLETE project-created English translation layer. */
  english: PoemLayer;

  /** Scans the poem body covers (13–26). */
  poemScans: number[];
};

// Provenance manifest (provenance.json).
export type PoemProvenance = {
  workId: string;
  sourceRepo: string;
  sourcePath: string;
  sourceCommit: string;
  source: {
    titleTa: string;
    titleEn: string;
    authorTa: string;
    authorEn: string;
    scanFilename: string;
    scanSha256: string;
    scanFileSizeBytes: number;
    scanTotalPages: number;
    physicalVerification: string;
    poemScanPages: string;
    poemVerification: string;
    printedPageMapping: string;
    unnumberedScanNote: string;
    sourcePdfCommitted: false;
    /** The verbatim printed context note above the poem, plus what it establishes. */
    contextNoteTa: string;
    contextDatePrinted: string;
    contextDateIso: string;
    contextVenueTa: string;
    contextVenueEn: string;
    contextOccasionTa: string;
    contextOccasionEn: string;
    /** Publication metadata NOT established by the scan — recorded explicitly. */
    publicationNotEstablished: string;
    forewordDateNote: string;
    /** Non-verse material locked out of the poem body. */
    lockedExclusions: string[];
  };
  verification: {
    tamilAssembly: string;
    tamilDiscrepancies: number;
    englishRelease: string;
    englishBatches: string;
    englishOmissions: number;
    englishDuplications: number;
    fullPoemVoiceReview: string;
  };
  archiveDerived: {
    tamilLines: number;
    tamilStanzas: number;
    tamilIndentedLines: number;
    englishLines: number;
    englishStanzas: number;
    englishIndentedLines: number;
    /** Physical page transitions inside the poem body (13→14 … 25→26). */
    pageTransitions: number;
    /** How many of those fall INSIDE a stanza (i.e. are not stanza boundaries). */
    pageTransitionsInsideStanza: number;
    tamilStanzasSpanningPages: number;
    englishStanzasSpanningPages: number;
    /** Translation-batch boundaries in the English release, and how many are continuations. */
    englishBatchBoundaries: number;
    englishBatchBoundariesInsideStanza: number;
    boundaryNote: string;
    provenanceGranularity: string;
    note: string;
  };
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

// Integrated poem slugs (build/import authority; the public catalog entry lives in
// data/library.ts). Phase-4 Benchmark #1 integrates exactly one poem.
export const POEM_SLUGS = ["idhayathai-thanthidu-anna"] as const;
export type PoemSlug = (typeof POEM_SLUGS)[number];
