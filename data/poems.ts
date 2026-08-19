// Poems (கவிதைகள்) — Digital Library Phase 4. Source-faithful poetry readers built from the
// authoritative poem source repository (pugazg/kalaignar-poems). Data-driven like the other
// Reading Rooms: each poem is vendored to public/data/poems/<slug>/{poem.json, provenance.json}
// by a deterministic, work-specific importer (scripts/import-<slug>.mjs) that pins the exact
// source commit. Runtime never calls GitHub and the source PDF is never vendored.
//
// A POEM IS NOT SPEECH PROSE. The governing Digital Library rule — ONE coherent library, MULTIPLE
// source-faithful reader types — means poetry gets its own reader and its own narrow model rather
// than reusing the speech reader: in prose a line break is typography, but in verse THE LINE IS
// THE TEXT. So the unit here is the source LINE. Lines are never merged into prose, never
// re-wrapped, and never split; a long line may WRAP visually on a narrow viewport, but that is
// presentation and never becomes two lines in the data.
//
// ── THE TWO DIMENSIONS (independent review correction) ───────────────────────────────────────────
// An earlier revision of this model folded every physical page transition into a "stanza", on the
// reasoning that the released Tamil assembly shows no blank line at a page edge. That was wrong,
// and the error is worth stating plainly because it is easy to repeat:
//
//   * the assembly stores each source page as its own FENCED block, so the fence structurally
//     CANNOT carry a blank line across the page edge. Absence of a blank there is an artefact of
//     the container, not a source statement about the printed page;
//   * the source archive does record cross-page continuity — but what it records is TEXTUAL /
//     RHETORICAL: "the final poetic line continues directly onto scan 14", "the final open
//     quotation continues onto scan 23". A sentence, a quotation or a rhetorical movement can run
//     on across a printed stanza break. Textual continuity does NOT establish stanza relation.
//
// The corrected model therefore keeps the two dimensions strictly separate, and resolves the
// typographic one only from explicit source evidence.
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

// TYPOGRAPHIC relation across a physical page transition. `unknown` is a first-class, honest
// value: it asserts NEITHER "same stanza" NOR "new stanza", and the reader renders it neutrally.
export type PoemStanzaRelation = "same-stanza" | "stanza-boundary" | "unknown";

// TEXTUAL / RHETORICAL relation across the same transition — a SEPARATE dimension. A transition
// can truthfully be a source-established textual continuation while its stanza relation is
// unknown. This field must never be read as typographic evidence.
export type PoemTextualRelation =
  | "source-established-continuation"
  | "source-established-non-continuation"
  | "not-specifically-recorded";

// Ordered boundary events between source lines.
//
//   "stanza-break"     — a blank line WHOLLY INSIDE one physical source page. The verified page
//                        record preserves that blank-line relation, so this IS source-established
//                        stanza structure.
//   "page-transition"  — a physical page edge. Its stanza relation is carried explicitly and is
//                        `unknown` unless a pinned source document establishes it.
export type PoemBoundary =
  | { kind: "stanza-break"; evidence: "source-blank-line"; sourceScan: number }
  | {
      kind: "page-transition";
      fromScan: number;
      toScan: number;
      stanzaRelation: PoemStanzaRelation;
      textualRelation: PoemTextualRelation;
      /** Verbatim citations from the pinned source repository supporting the two relations above. */
      evidence: { stanza: string[]; textual: string[] };
    };

// One ordered element of a language layer: a source line, or a boundary between lines.
export type PoemElement = ({ kind: "line" } & PoemLine) | PoemBoundary;

// TERMINOLOGY. A maximal run of consecutive lines with no boundary between them is a VERSE RUN,
// not a "stanza": where a run is bounded by a page transition whose relation is unknown, the
// printed stanza it belongs to is simply not established. Only a run delimited on both sides by
// source-established stanza structure (a blank line, or the start/end of the poem) is a
// source-established stanza — counted separately below. Nothing in this model reports a derived
// run count as a printed stanza count.
export type PoemLayer = {
  elements: PoemElement[];
  /** Total released source lines in this layer. */
  lineCount: number;
  /** Blank-line stanza breaks the source establishes WITHIN a page. */
  inPageStanzaBreaks: number;
  /** Maximal runs of lines between any two boundaries — a derived reading unit, NOT a stanza count. */
  verseRuns: number;
  /** Runs whose stanza membership IS fully source-established (no unresolved page edge touching them). */
  sourceEstablishedStanzas: number;
  /** Physical page transitions in this layer. */
  pageTransitions: number;
  /** Page transitions whose typographic stanza relation the source does not establish. */
  unresolvedStanzaRelations: number;
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
    tamilInPageStanzaBreaks: number;
    tamilVerseRuns: number;
    tamilSourceEstablishedStanzas: number;
    tamilIndentedLines: number;
    englishLines: number;
    englishInPageStanzaBreaks: number;
    englishVerseRuns: number;
    englishSourceEstablishedStanzas: number;
    englishIndentedLines: number;
    /** Physical page transitions inside the poem body (13→14 … 25→26). */
    pageTransitionsAudited: number;
    /** TYPOGRAPHIC dimension — resolved only from explicit source evidence. */
    stanzaRelationSameStanza: number;
    stanzaRelationStanzaBoundary: number;
    stanzaRelationUnresolved: number;
    /** TEXTUAL / RHETORICAL dimension — recorded separately, never read as stanza evidence. */
    textualContinuations: number;
    textualNonContinuations: number;
    textualNotRecorded: number;
    /** Per-transition audit table, so a reviewer can check every classification against its citations. */
    transitions: {
      fromScan: number;
      toScan: number;
      stanzaRelation: PoemStanzaRelation;
      textualRelation: PoemTextualRelation;
      stanzaEvidence: string[];
      textualEvidence: string[];
    }[];
    boundaryNote: string;
    provenanceGranularity: string;
    terminologyNote: string;
    note: string;
  };
  /** Source facts only an upstream source-archive review can settle. */
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

// Integrated poem slugs (build/import authority; the public catalog entry lives in
// data/library.ts). Phase-4 Benchmark #1 integrates exactly one poem.
export const POEM_SLUGS = ["idhayathai-thanthidu-anna"] as const;
export type PoemSlug = (typeof POEM_SLUGS)[number];
